// Script à 1 voix (monologue) pour la vidéo avatar HeyGen — distinct du script
// de podcast (dialogue à 2 voix) car un avatar HeyGen ne peut incarner qu'une
// seule personne. Même logique de personnalisation : cours + référentiel +
// objectif professionnel de l'élève, contenu obligatoire jamais coupé.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole, isStaffRole } from "../_shared/podcast-utils.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";

function buildScriptPrompt(lessonTitle: string, lessonContent: string, objectifProfessionnel: string | null): string {
  return `Tu es un formateur qui présente une courte capsule vidéo à un élève, seul face caméra (pas de dialogue, un seul narrateur).

RÈGLE ABSOLUE : le contenu pédagogique obligatoire du cours (Source 1) doit être fidèlement transmis. Ne supprime jamais une connaissance ou un point du cours pour "faire de la place" à la personnalisation — la personnalisation est une couche ajoutée, jamais un remplacement.

=== SOURCE 1 : COURS DE RÉFÉRENCE "${lessonTitle}" (obligatoire, à couvrir dans ses grandes lignes) ===
${lessonContent}

=== SOURCE 2 : PROFIL DE L'ÉLÈVE (contexte de personnalisation) ===
${objectifProfessionnel?.trim() ? objectifProfessionnel : "Aucun profil renseigné — reste généraliste mais professionnel, sans inventer de contexte métier."}

=== COMMENT PERSONNALISER (avec parcimonie et naturel) ===
- N'utilise le profil de l'élève QUE là où cela aide réellement à comprendre un concept ou illustrer un exemple.
- Ne répète pas mécaniquement son métier à chaque phrase.
- Termine en reliant le sujet à l'un des objectifs de l'élève si le profil le permet.

=== FORMAT DE SORTIE ===
Un monologue direct à la caméra, ENTRE 200 ET 280 MOTS MAXIMUM (impératif technique pour une courte vidéo), qui résume l'essentiel du cours de façon claire et engageante, en tutoyant l'élève. Pas de didascalies, pas de nom de narrateur, juste le texte parlé brut.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const { lessonId } = await req.json();
    if (!lessonId) return jsonResponse({ error: "lessonId manquant." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    const userId = userData.user.id;

    if (!isStaffRole(await getCallerRole(supabase, userId))) {
      return jsonResponse({ error: "Seuls un admin ou un formateur peuvent générer une vidéo avatar." }, 403);
    }

    const { data: lesson, error: lessonErr } = await supabase
      .from("lessons").select("id, title, reference_content").eq("id", lessonId).maybeSingle();
    if (lessonErr) return jsonResponse({ error: lessonErr.message }, 500);
    if (!lesson) return jsonResponse({ error: "Leçon introuvable ou accès refusé." }, 404);
    if (!lesson.reference_content) return jsonResponse({ error: "Cette leçon n'a pas encore de contenu de cours." }, 400);

    const { data: onboarding } = await supabase
      .from("student_onboarding").select("goal, goal_detail").eq("user_id", userId).maybeSingle();
    const objectifProfessionnel = onboarding?.goal_detail || onboarding?.goal || null;

    const scriptPrompt = buildScriptPrompt(lesson.title, lesson.reference_content, objectifProfessionnel);
    const textResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: scriptPrompt }] }] }),
      },
    );
    if (!textResp.ok) return jsonResponse({ error: `Gemini (script) a échoué : ${await textResp.text()}` }, 502);
    const textJson = await textResp.json();
    const script = textJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!script) return jsonResponse({ error: "Gemini n'a renvoyé aucun script." }, 502);

    return jsonResponse({ script });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
