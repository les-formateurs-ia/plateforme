// Crée un cours d'exemple complet (le "jeu de base" que l'admin pourra ensuite
// renommer / éditer / supprimer depuis le back-office) : 1 formation, 5 modules,
// leurs leçons, et un quiz par module. Utilise la clé service_role (bypass RLS),
// même principe que seed-users.mjs.
//
//   npm run seed:course

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Il manque SUPABASE_URL (ou VITE_SUPABASE_URL) et/ou SUPABASE_SERVICE_ROLE_KEY dans ton .env.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const COURSE = {
  name: "Maîtriser l'IA Générative",
  slug: "maitriser-ia-generative",
  description: "Parcours complet pour utiliser l'IA générative au quotidien : fondamentaux, prompt engineering, automatisation, agents IA, et projet de certification.",
  duration_minutes: 480,
  price_cents: 129900,
  currency: "EUR",
  certification_enabled: true,
  certification_prompt: "Évalue la capacité du candidat à concevoir, présenter et défendre un projet IA générative appliqué à son métier.",
  status: "published",
};

const SECTIONS = [
  {
    title: "Introduction à l'IA Générative",
    lessons: [
      { title: "Qu'est-ce que l'IA générative ?", duration_minutes: 15,
        ai_content_prompt: "Explique simplement ce qu'est l'IA générative, comment elle diffère de l'IA traditionnelle, avec des analogies accessibles à un débutant.",
        practical_exercise_prompt: "Propose un exercice où l'élève liste 3 tâches de son métier qui pourraient être assistées par l'IA générative." },
      { title: "Les grands modèles de langage (LLM) expliqués", duration_minutes: 18,
        ai_content_prompt: "Vulgarise le fonctionnement d'un LLM (entraînement, tokens, prédiction du mot suivant) sans jargon technique excessif.",
        practical_exercise_prompt: "Fais tester à l'élève 3 prompts identiques sur des modèles différents et comparer les résultats." },
      { title: "ChatGPT, Claude, Gemini : panorama des outils", duration_minutes: 20,
        ai_content_prompt: "Compare les principaux assistants IA du marché (forces, cas d'usage privilégiés) en restant neutre et factuel.",
        practical_exercise_prompt: "Demande à l'élève de choisir l'outil le plus adapté à 3 scénarios métier donnés et de justifier son choix." },
      { title: "Cas d'usage professionnels de l'IA", duration_minutes: 16,
        ai_content_prompt: "Donne des exemples concrets et sectoriels d'usage de l'IA générative adaptés au métier de l'élève.",
        practical_exercise_prompt: "Fais rédiger à l'élève un cas d'usage IA appliqué directement à sa profession déclarée." },
      { title: "Quiz final du module", duration_minutes: 10, quiz: [
        { question: "Qu'est-ce qu'un LLM (Large Language Model) ?",
          options: ["Un logiciel de montage vidéo", "Un modèle statistique entraîné sur de grands volumes de texte pour générer du langage", "Un langage de programmation", "Une base de données relationnelle"],
          correct: 1,
          explanation: "Un LLM est un modèle de deep learning entraîné sur d'immenses corpus de texte, capable de prédire et générer du langage de façon cohérente." },
        { question: "Parmi ces outils, lequel N'EST PAS un assistant IA génératif grand public ?",
          options: ["ChatGPT", "Claude", "PostgreSQL", "Gemini"],
          correct: 2,
          explanation: "PostgreSQL est un système de gestion de base de données relationnelle, pas un assistant IA génératif." },
        { question: "Quel est un cas d'usage typique de l'IA générative en entreprise ?",
          options: ["Rédaction automatique de contenu", "Remplacement physique des employés", "Stockage de données sur disque dur", "Gestion de la paie sans supervision"],
          correct: 0,
          explanation: "La génération de contenu (texte, résumés, emails...) est l'un des cas d'usage les plus répandus et matures de l'IA générative en entreprise." },
      ] },
    ],
  },
  {
    title: "Prompt Engineering Pro",
    lessons: [
      { title: "Les bases du prompting", duration_minutes: 15,
        ai_content_prompt: "Présente les principes fondamentaux d'un bon prompt : clarté, contexte, exemples.",
        practical_exercise_prompt: "Fais réécrire à l'élève un prompt vague en un prompt structuré et précis." },
      { title: "La formule RCTF expliquée", duration_minutes: 20,
        ai_content_prompt: "Détaille la formule Rôle + Contexte + Tâche + Format avec un exemple avant/après.",
        practical_exercise_prompt: "Demande à l'élève d'appliquer RCTF à un besoin de son métier." },
      { title: "Chain of Thought", duration_minutes: 22,
        ai_content_prompt: "Explique le raisonnement étape par étape (chain of thought) et pourquoi il améliore la fiabilité des réponses.",
        practical_exercise_prompt: "Fais comparer à l'élève une réponse avec et sans chain of thought sur un problème logique simple." },
      { title: "Few-shot learning", duration_minutes: 16,
        ai_content_prompt: "Explique comment donner des exemples dans un prompt (few-shot) pour guider le style et le format de sortie.",
        practical_exercise_prompt: "Fais construire à l'élève un prompt few-shot avec 2 exemples pour un besoin métier précis." },
      { title: "Prompts avancés & température", duration_minutes: 19,
        ai_content_prompt: "Explique le paramètre de température et son impact sur la créativité vs précision des réponses.",
        practical_exercise_prompt: "Fais tester à l'élève le même prompt avec une consigne créative vs une consigne factuelle." },
      { title: "Quiz final du module", duration_minutes: 15, quiz: [
        { question: "Quelle technique améliore le plus la qualité d'un prompt IA ?",
          options: ["Utiliser des mots-clés SEO", "Assigner un rôle précis à l'IA avant la tâche", "Écrire en majuscules", "Poser plusieurs questions simultanément"],
          correct: 1,
          explanation: "Assigner un rôle ancre le contexte de l'IA et améliore drastiquement la pertinence — c'est la base du prompt engineering professionnel." },
        { question: "Que signifie la formule RCTF en prompt engineering ?",
          options: ["Rôle, Contexte, Tâche, Format", "Recherche, Calcul, Test, Feedback", "Requête, Cache, Token, Fichier", "Résultat, Coût, Temps, Fiabilité"],
          correct: 0,
          explanation: "RCTF = Rôle + Contexte + Tâche + Format, la structure de base d'un prompt efficace." },
        { question: "Quel est l'effet d'une température basse lors d'une génération IA ?",
          options: ["Des réponses plus créatives et variées", "Des réponses plus précises et déterministes", "Une génération plus lente", "Un coût d'API plus élevé"],
          correct: 1,
          explanation: "Une température basse réduit l'aléatoire du modèle, produisant des réponses plus prévisibles et cohérentes." },
      ] },
    ],
  },
  {
    title: "IA & Automatisation",
    lessons: [
      { title: "Automatiser ses tâches répétitives avec l'IA", duration_minutes: 18,
        ai_content_prompt: "Montre comment repérer les tâches répétitives d'un métier qui peuvent être déléguées à l'IA.",
        practical_exercise_prompt: "Fais lister à l'élève 3 tâches répétitives de son quotidien professionnel automatisables." },
      { title: "Connecter l'IA à ses outils (Zapier, Make, n8n)", duration_minutes: 22,
        ai_content_prompt: "Présente les outils no-code d'automatisation et comment ils s'interfacent avec une IA générative.",
        practical_exercise_prompt: "Fais schématiser à l'élève un scénario d'automatisation simple (déclencheur → IA → action)." },
      { title: "Créer un workflow IA de bout en bout", duration_minutes: 25,
        ai_content_prompt: "Guide la construction d'un workflow complet : déclencheur, traitement IA, action de sortie.",
        practical_exercise_prompt: "Fais concevoir à l'élève un workflow complet pour un besoin réel de son métier." },
      { title: "Quiz final du module", duration_minutes: 12, quiz: [
        { question: "Quel type d'outil permet de relier une IA à d'autres applications sans coder ?",
          options: ["Un compilateur", "Un outil no-code d'automatisation (Zapier, Make...)", "Un antivirus", "Un tableur seul"],
          correct: 1,
          explanation: "Les outils no-code d'automatisation permettent de connecter une IA à d'autres services sans écrire de code." },
        { question: "Pourquoi automatiser une tâche répétitive avec l'IA plutôt que la faire manuellement ?",
          options: ["Pour gagner du temps et réduire les erreurs", "Parce que c'est obligatoire légalement", "Pour rendre la tâche plus complexe", "Aucun intérêt réel"],
          correct: 0,
          explanation: "L'automatisation vise avant tout le gain de temps et la réduction des erreurs humaines sur des tâches répétitives." },
        { question: "Dans un workflow IA de bout en bout, que représente un 'trigger' ?",
          options: ["Le résultat final", "L'événement qui déclenche le workflow", "Le prix de l'abonnement", "Le nom du modèle utilisé"],
          correct: 1,
          explanation: "Le trigger est l'événement (email reçu, formulaire soumis...) qui démarre l'exécution du workflow." },
      ] },
    ],
  },
  {
    title: "Agents IA & Workflows",
    lessons: [
      { title: "Qu'est-ce qu'un agent IA ?", duration_minutes: 16,
        ai_content_prompt: "Définis ce qu'est un agent IA autonome et en quoi il diffère d'un simple assistant conversationnel.",
        practical_exercise_prompt: "Fais imaginer à l'élève un agent IA utile pour son métier et ses objectifs." },
      { title: "Donner des outils à un agent (tool use)", duration_minutes: 20,
        ai_content_prompt: "Explique le concept de 'tool use' : comment un agent appelle des fonctions/API pour agir sur le monde réel.",
        practical_exercise_prompt: "Fais lister à l'élève les outils (API, bases de données...) qu'un agent aurait besoin pour une tâche donnée." },
      { title: "Construire son premier agent autonome", duration_minutes: 28,
        ai_content_prompt: "Guide pas à pas la conception d'un agent simple : objectif, outils, boucle de décision, limites de sécurité.",
        practical_exercise_prompt: "Fais concevoir à l'élève le cahier des charges d'un agent autonome pour son activité." },
      { title: "Quiz final du module", duration_minutes: 12, quiz: [
        { question: "Qu'est-ce qui distingue un agent IA d'un simple chatbot ?",
          options: ["L'agent peut planifier et exécuter des actions via des outils", "L'agent ne répond qu'en anglais", "Le chatbot est toujours plus rapide", "Aucune différence"],
          correct: 0,
          explanation: "Un agent IA peut décomposer un objectif en étapes et agir via des outils, au-delà de la simple conversation." },
        { question: "Que désigne le 'tool use' chez un agent IA ?",
          options: ["La capacité de l'agent à appeler des fonctions/API externes", "L'utilisation d'une souris et d'un clavier", "Un mode de paiement", "La limite de tokens"],
          correct: 0,
          explanation: "Le tool use permet à l'agent d'interagir avec des systèmes externes (API, bases de données, fichiers...)." },
        { question: "Quel est un risque à surveiller avec un agent autonome ?",
          options: ["Des actions en boucle ou incontrôlées sans supervision", "Une trop faible latence", "Un design visuel pauvre", "Aucun risque particulier"],
          correct: 0,
          explanation: "Un agent mal cadré peut répéter ou enchaîner des actions non désirées — d'où l'importance de garde-fous." },
      ] },
    ],
  },
  {
    title: "Projet Final & Certification",
    lessons: [
      { title: "Cadrer son projet final IA", duration_minutes: 15,
        ai_content_prompt: "Aide à définir un périmètre de projet IA réaliste, aligné avec le métier et les objectifs de l'élève.",
        practical_exercise_prompt: "Fais rédiger à l'élève une fiche de cadrage (objectif, périmètre, résultat attendu) de son projet final." },
      { title: "Présenter son projet devant un jury", duration_minutes: 18,
        ai_content_prompt: "Donne des conseils de structuration et de présentation orale pour une soutenance de projet IA.",
        practical_exercise_prompt: "Fais préparer à l'élève un plan de présentation en 5 slides pour sa soutenance." },
      { title: "Quiz de préparation à la certification", duration_minutes: 15, quiz: [
        { question: "Quel est l'objectif principal de la soutenance de certification ?",
          options: ["Démontrer sa maîtrise pratique de l'IA générative sur un cas réel", "Réciter le cours par cœur", "Présenter un CV", "Passer un test de vitesse de frappe"],
          correct: 0,
          explanation: "La soutenance évalue la capacité à appliquer concrètement l'IA générative à un cas réel, pas la mémorisation." },
        { question: "Que doit contenir un bon projet final ?",
          options: ["Un objectif clair, une solution IA concrète et des résultats mesurables", "Uniquement des captures d'écran", "Aucun livrable", "Une liste de prompts sans contexte"],
          correct: 0,
          explanation: "Un bon projet articule objectif, mise en œuvre concrète et résultats mesurables." },
        { question: "Comment bien se préparer à la soutenance ?",
          options: ["En s'entraînant à présenter et en anticipant les questions du jury", "En improvisant totalement sans préparation", "En évitant de tester son projet", "En changeant de sujet la veille"],
          correct: 0,
          explanation: "S'entraîner et anticiper les questions du jury est la meilleure préparation à une soutenance réussie." },
      ] },
    ],
  },
];

async function main() {
  const { data: existing } = await admin.from("formations").select("id").eq("slug", COURSE.slug).maybeSingle();
  if (existing) {
    console.log(`✗ Le cours "${COURSE.slug}" existe déjà (id: ${existing.id}) — rien à faire. Édite-le depuis le back-office.`);
    return;
  }

  const { data: formation, error: formationError } = await admin.from("formations").insert(COURSE).select("id").single();
  if (formationError) { console.error("Échec création formation:", formationError.message); process.exit(1); }
  console.log(`✓ Formation créée : ${COURSE.name} (${formation.id})`);

  for (let sIndex = 0; sIndex < SECTIONS.length; sIndex++) {
    const section = SECTIONS[sIndex];
    const { data: sectionRow, error: sectionError } = await admin
      .from("sections")
      .insert({ formation_id: formation.id, title: section.title, order_index: sIndex })
      .select("id")
      .single();
    if (sectionError) { console.error(`  Échec création section "${section.title}":`, sectionError.message); continue; }
    console.log(`  ✓ Module ${sIndex + 1} : ${section.title}`);

    for (let lIndex = 0; lIndex < section.lessons.length; lIndex++) {
      const lesson = section.lessons[lIndex];
      const { data: lessonRow, error: lessonError } = await admin
        .from("lessons")
        .insert({
          section_id: sectionRow.id,
          slug: `lecon-${lIndex + 1}`,
          title: lesson.title,
          duration_minutes: lesson.duration_minutes,
          ai_content_prompt: lesson.ai_content_prompt ?? null,
          practical_exercise_prompt: lesson.practical_exercise_prompt ?? null,
          order_index: lIndex,
        })
        .select("id")
        .single();
      if (lessonError) { console.error(`    Échec création leçon "${lesson.title}":`, lessonError.message); continue; }
      console.log(`    ✓ ${lesson.title}`);

      if (lesson.quiz) {
        for (let qIndex = 0; qIndex < lesson.quiz.length; qIndex++) {
          const q = lesson.quiz[qIndex];
          const { data: questionRow, error: questionError } = await admin
            .from("quiz_questions")
            .insert({ lesson_id: lessonRow.id, question: q.question, explanation: q.explanation, order_index: qIndex })
            .select("id")
            .single();
          if (questionError) { console.error(`      Échec création question:`, questionError.message); continue; }

          const options = q.options.map((label, oIndex) => ({
            question_id: questionRow.id,
            label,
            is_correct: oIndex === q.correct,
            order_index: oIndex,
          }));
          const { error: optionsError } = await admin.from("quiz_options").insert(options);
          if (optionsError) console.error(`      Échec création options:`, optionsError.message);
        }
        console.log(`      ✓ ${lesson.quiz.length} question(s) de quiz`);
      }
    }
  }

  console.log("\nTerminé. Le cours est éditable depuis le back-office (compte admin).");
}

main();
