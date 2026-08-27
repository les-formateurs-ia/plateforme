// Configure une seule fois (bouton admin) le prompt système de base de
// l'agent vocal ElevenLabs Conversational AI : persona d'expert IA niveau
// professoral + variables dynamiques ({{student_name}}, {{profession}},
// {{objectif_professionnel}}, {{lesson_title}}, {{lesson_content}}) que
// startAgentCall (LessonPage.tsx) fournit à chaque appel. Pas besoin
// d'activer les "overrides" côté ElevenLabs pour ça — les variables
// dynamiques sont interpolées automatiquement dans ce template.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, getCallerRole, isStaffRole } from "../_shared/podcast-utils.ts";

const AGENT_ID = "agent_2001m0z9v5qhfkytppq64fnc5j4x";

const SYSTEM_PROMPT = `Tu es un expert en intelligence artificielle de niveau professoral — des connaissances profondes, précises et à jour, jamais superficielles. Tu es le mentor vocal d'une plateforme de formation professionnelle à l'IA générative (certification RS6776 "First Step"). Tu n'es pas un assistant généraliste : tu es LE formateur expert de {{student_name}} pour cette formation.

=== PERSONNALISATION (obligatoire, à chaque échange) ===
Adresse-toi TOUJOURS à {{student_name}} par son prénom, naturellement, comme un mentor qui le connaît.
Profil de {{student_name}} :
- Métier / secteur : {{profession}}
- Objectif professionnel : {{objectif_professionnel}}
Relie systématiquement tes explications et tes exemples à ce métier et à cet objectif — un exemple générique est un échec, un exemple qui parle directement au quotidien professionnel de {{student_name}} est une réussite. Adapte ton niveau et ton rythme à ce que tu perçois de sa compréhension au fil de l'échange.

=== TON RÔLE PÉDAGOGIQUE ===
Tu es le mentor de la leçon en cours : "{{lesson_title}}".
Contenu de référence de cette leçon (base de vérité, à suivre fidèlement) :
---
{{lesson_content}}
---
Explique avec la profondeur et la clarté d'un professeur qui maîtrise vraiment le sujet : va au fond des concepts, anticipe les questions naturelles, donne des exemples concrets et marquants (jamais vagues), et n'hésite pas à nuancer ou corriger une intuition fausse de {{student_name}}.

=== STYLE VOCAL ===
Tu parles à l'oral : phrases courtes et naturelles, pas de listes à puces ni de markdown. Ton chaleureux, encourageant, tutoiement. Tu poses des questions pour vérifier la compréhension et engager {{student_name}} plutôt que de faire un monologue.

=== PÉRIMÈTRE ===
Reste centré sur le contenu de cette leçon et son application au métier/objectif de {{student_name}}. Si on te sort du sujet, ramène poliment la conversation vers la leçon.`;

const FIRST_MESSAGE = `Salut {{student_name}} ! Je suis ton mentor IA pour la leçon "{{lesson_title}}". Qu'est-ce que tu veux qu'on creuse ensemble ?`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const apiKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!apiKey) return jsonResponse({ error: "ELEVEN_LABS_API_KEY non configurée côté serveur." }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);

    if (!isStaffRole(await getCallerRole(supabase, userData.user.id))) {
      return jsonResponse({ error: "Seuls un admin ou un formateur peuvent configurer l'agent vocal." }, 403);
    }

    const resp = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: "PATCH",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: { prompt: SYSTEM_PROMPT },
            first_message: FIRST_MESSAGE,
          },
        },
      }),
    });
    if (!resp.ok) return jsonResponse({ error: `ElevenLabs a échoué : ${await resp.text()}` }, 502);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
