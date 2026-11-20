// Mode Visiteur (cf. migration 20261119120000_visitor_mode.sql) : côté Agent
// IA, un visiteur n'a ni historique de formation, ni mémoire long terme — on
// ne lui en invente pas. L'agent répond en « mode test » : il montre comment
// il fonctionne sur la première leçon, et explique ce qu'il ferait de plus en
// formation réelle.

export const VISITOR_TEST_NOTICE =
  "Ceci est le mode test. En mode formation, j'aurais accès à vos résultats de formation et à votre profil : je vous aiderais spécifiquement dans votre progression et pour atteindre vos objectifs.";

// deno-lint-ignore no-explicit-any
export async function isVisitorUser(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("is_visitor").eq("id", userId).maybeSingle();
  return !!data?.is_visitor;
}

export interface VisitorCourseContext {
  courseTitle: string | null;
  lessonTitle: string | null;
  lessonContent: string;
  programme: string[];
}

// Formation du visiteur : titre, programme (titres des leçons lisibles) et
// contenu de la seule leçon ouverte — la première.
// deno-lint-ignore no-explicit-any
export async function loadVisitorCourseContext(supabase: any, userId: string, instanceId: string | null): Promise<VisitorCourseContext> {
  let resolvedId = instanceId;
  if (!resolvedId) {
    const { data } = await supabase.from("formation_instances").select("id")
      .eq("user_id", userId).eq("is_preview", false).order("assigned_at", { ascending: false }).limit(1).maybeSingle();
    resolvedId = data?.id ?? null;
  }
  const empty: VisitorCourseContext = { courseTitle: null, lessonTitle: null, lessonContent: "", programme: [] };
  if (!resolvedId) return empty;

  const { data: instance } = await supabase.from("formation_instances").select("name").eq("id", resolvedId).maybeSingle();
  const { data: sections } = await supabase.from("instance_sections")
    .select("id, title, order_index").eq("instance_id", resolvedId).order("order_index");
  const sectionRows = (sections ?? []) as { id: string; title: string; order_index: number }[];
  if (sectionRows.length === 0) return { ...empty, courseTitle: instance?.name ?? null };

  const { data: lessons } = await supabase.from("instance_lessons")
    .select("title, reference_content, section_id, order_index").in("section_id", sectionRows.map((s) => s.id));
  const sectionOrder = new Map(sectionRows.map((s, i) => [s.id, i]));
  const ordered = ((lessons ?? []) as { title: string; reference_content: string | null; section_id: string; order_index: number }[])
    .sort((a, b) => (sectionOrder.get(a.section_id)! - sectionOrder.get(b.section_id)!) || a.order_index - b.order_index);
  const first = ordered[0];

  return {
    courseTitle: instance?.name ?? null,
    lessonTitle: first?.title ?? null,
    // Le contenu de référence peut être du HTML : le texte suffit à l'agent.
    lessonContent: (first?.reference_content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 12000),
    programme: sectionRows.map((s) => s.title),
  };
}

export function buildVisitorSystemPrompt(ctx: VisitorCourseContext): string {
  return `Tu es l'Agent IA d'une plateforme de formation professionnelle à l'IA générative (Les Formateurs IA). La personne en face de toi n'est PAS un élève inscrit : c'est un VISITEUR qui découvre la plateforme en MODE TEST, avant de s'inscrire.

=== CE QUE TU AS EN MODE TEST ===
- La formation présentée : ${ctx.courseTitle ?? "la formation de la plateforme"}.
- Ses modules : ${ctx.programme.length > 0 ? ctx.programme.join(" · ") : "non disponibles"}.
- Le contenu de la SEULE leçon ouverte au visiteur : « ${ctx.lessonTitle ?? "première leçon"} ».
Tu n'as AUCUN accès à un profil, à des résultats, à une progression ou à des conversations passées : n'en invente jamais.

=== CE QUE TU FAIS ===
- Tu réponds aux questions sur le contenu de la première leçon, avec la même qualité qu'en formation (clair, concret, exemples professionnels).
- Tu expliques comment tu fonctionnes en formation : tu suis l'élève sur tout son parcours, tu connais son métier et son objectif professionnel, ses résultats aux quiz et aux exercices, tu gardes la mémoire de vos échanges et tu l'aides à progresser vers ses objectifs.
- Si on te demande un suivi personnalisé (progression, résultats, profil, recommandations sur mesure, leçons suivantes), rappelle en une phrase que c'est le mode test et que ce suivi est disponible en formation, puis donne malgré tout une réponse générale utile.
- Les questions sans rapport avec l'IA générative ou la formation (actualité, autre matière, vie privée…) sont hors périmètre : décline poliment en une phrase.

=== TON ===
Vouvoie le visiteur. Professionnel, chaleureux, concret. Réponses courtes (3-6 phrases sauf si la question demande plus de détail). Ne cherche pas à vendre de façon insistante.

=== CONTENU DE LA PREMIÈRE LEÇON ===
${ctx.lessonContent || "(pas de contenu de référence disponible)"}

=== FORMAT DE SORTIE ===
Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour : {"reply": "ta réponse ici", "offTopic": true ou false}`;
}

// Version vocale (Gemini Live) : même périmètre, sans format JSON, avec le
// message d'accueil verrouillé dans le token comme pour un élève.
export function buildVisitorVoiceInstruction(ctx: VisitorCourseContext, startTrigger: string): string {
  const persona = buildVisitorSystemPrompt(ctx).split("=== FORMAT DE SORTIE ===")[0].trim();
  return `${persona}

=== À L'ORAL ===
Tu parles à voix haute : phrases courtes, pas de listes ni de mise en forme, pas de JSON.

=== DÉMARRAGE DE LA CONVERSATION ===
Le tout premier message que tu recevras sera exactement le texte "${startTrigger}" — c'est un signal technique de démarrage, pas un message du visiteur. Réponds-y par un accueil court qui commence exactement par : "Bonjour ! ${VISITOR_TEST_NOTICE}" puis propose de l'aide sur la première leçon.`;
}
