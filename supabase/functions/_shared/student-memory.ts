// Mémoire long terme de l'Agent IA sur un élève : une fiche texte courte,
// régénérée en tâche de fond à partir de TOUTES ses conversations passées
// (toutes formations, texte + vocal confondus — agent_messages n'a pas de
// notion de modalité côté lecture, les deux écrivent dans la même table).
// Complète buildStudentOverview (chiffres de progression, toujours frais) par
// une synthèse qualitative qui persiste au-delà de la fenêtre d'historique
// récente d'une seule conversation.
import { runInBackground } from "./podcast-utils.ts";

const MEMORY_MODEL = "gemini-3.6-flash";
// En dessous de ce nombre de nouveaux messages depuis la dernière synthèse,
// pas la peine de rappeler Gemini — la fiche existante reste pertinente.
const UPDATE_THRESHOLD = 8;
const MAX_MESSAGES_PER_UPDATE = 200;

const SUMMARY_PROMPT_TEMPLATE = `Tu maintiens la fiche mémoire d'un élève pour son mentor IA, à partir de ses échanges passés (texte et vocal). Cette fiche sert uniquement à personnaliser les futures réponses de l'agent : qui est cet élève, comment il apprend, ce qu'il maîtrise ou confond encore, ses centres d'intérêt liés à son métier, sa façon de communiquer.

FICHE ACTUELLE :
{{existing}}

NOUVEAUX ÉCHANGES DEPUIS LA DERNIÈRE MISE À JOUR :
{{newMessages}}

Réécris la fiche à jour, 150 mots maximum, en français, à la troisième personne. Ne garde que des faits utiles et durables (pas de récap des sujets de cours déjà couverts par le suivi de progression, pas de méta-commentaire). Si un point de la fiche actuelle est contredit ou dépassé par les nouveaux échanges, corrige-le plutôt que de l'empiler. Réponds UNIQUEMENT avec le texte de la fiche, sans titre ni guillemets.`;

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export async function getStudentMemoryText(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase.from("student_ai_memory").select("summary").eq("user_id", userId).maybeSingle();
  const summary = (data?.summary as string | undefined)?.trim();
  return summary || "Pas encore de mémoire long terme sur cet élève — premiers échanges avec toi.";
}

// Fire-and-forget : ne bloque jamais la réponse en cours à l'élève. Les
// erreurs sont avalées (loggées) plutôt que remontées, car cette mise à jour
// est un bonus de personnalisation, jamais un chemin critique de la requête.
export function scheduleStudentMemoryUpdate(supabase: SupabaseClient, userId: string) {
  runInBackground(updateStudentMemoryIfDue(supabase, userId).catch((err) => console.error("student-memory update failed:", err)));
}

async function updateStudentMemoryIfDue(supabase: SupabaseClient, userId: string): Promise<void> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) return;

  const { data: memRow } = await supabase
    .from("student_ai_memory").select("summary, last_summarized_at").eq("user_id", userId).maybeSingle();
  const existingSummary = (memRow?.summary as string | undefined)?.trim() ?? "";
  const cursor = memRow?.last_summarized_at ?? "1970-01-01T00:00:00Z";

  const { data: convRows } = await supabase.from("agent_conversations").select("id").eq("user_id", userId);
  const conversationIds = (convRows ?? []).map((c: { id: string }) => c.id);
  if (conversationIds.length === 0) return;

  const { data: newMessages } = await supabase
    .from("agent_messages").select("role, content, created_at")
    .in("conversation_id", conversationIds)
    .gt("created_at", cursor)
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES_PER_UPDATE);

  const messages = (newMessages ?? []) as { role: string; content: string; created_at: string }[];
  if (messages.length < UPDATE_THRESHOLD) return;

  const transcript = messages.map((m) => `${m.role === "ai" ? "Agent" : "Élève"} : ${m.content}`).join("\n");
  const prompt = SUMMARY_PROMPT_TEMPLATE
    .replace("{{existing}}", existingSummary || "(aucune fiche pour l'instant, premiers échanges avec cet élève)")
    .replace("{{newMessages}}", transcript);

  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MEMORY_MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
  });
  if (!resp.ok) { console.error("student-memory Gemini call failed:", await resp.text()); return; }

  const json = await resp.json();
  const newSummary = (json?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined)?.trim();
  if (!newSummary) return;

  const latestCreatedAt = messages[messages.length - 1].created_at;
  await supabase.from("student_ai_memory").upsert({
    user_id: userId,
    summary: newSummary,
    last_summarized_at: latestCreatedAt,
    updated_at: new Date().toISOString(),
  });
}
