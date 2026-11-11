// Remplit une leçon de l'APERÇU « version Nathalie » (copie admin is_preview, voir
// rs6776-preview-nathalie.mjs) : vidéo commune, vidéo personnalisée, cours complet,
// fiche de révision + Playground SIRH, quiz de Nathalie. Ne touche à rien d'autre :
// ni au modèle, ni à la vraie copie de Nathalie, ni aux autres élèves.
//
//   node scripts/rs6776-fill-preview.mjs 1.2            # simulation
//   node scripts/rs6776-fill-preview.mjs 1.2 --apply    # écrit
//   node scripts/rs6776-fill-preview.mjs 1.2 --apply --replace-videos   # renvoie les vidéos (après un nouveau rendu)
import { readFileSync, existsSync, statSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { parseQuiz } from "./rs6776-quiz.mjs";

for (const l of existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : []) {
  const i = l.indexOf("=");
  if (i > 0 && !l.trim().startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const [lesson] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const REPLACE = process.argv.includes("--replace-videos");
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const must = (r, what) => { if (r.error) throw new Error(`${what} : ${r.error.message}`); return r.data; };
const log = (...a) => console.log(APPLY ? "" : "[simulation]", ...a);

const PREVIEW_NAME = "APERÇU Nathalie — RS6776 · Création de contenus rédactionnels et visuels par l'usage responsable de l'IA générative";
const SLUGS = {
  "1.1": "comprendre-ia-generative", "1.2": "analyser-son-poste", "1.3": "installer-configurer-outils", "1.4": "informations-a-proteger",
  "1.5": "securiser-son-usage", "1.6": "plan-actions-ia", "2.1": "bases-prompt-engineering", "2.2": "prompts-avances",
  "2.3": "redaction-assistee", "2.4": "contenus-visuels", "2.5": "optimiser-contenus", "3.1": "contenus-inclusifs", "3.2": "cadre-legal-ia-act-rgpd",
};
if (!SLUGS[lesson]) { console.error(`Leçon inconnue : ${lesson}`); process.exit(1); }
const key = lesson.replace(".", "-");
const doc = `docs/formation-rs6776/lecon-${lesson}`;
const files = {
  commune: `lesson-videos/out/rs6776-${key}-commune.mp4`,
  nathalie: `lesson-videos/out/rs6776-${key}-nathalie.mp4`,
  cours: `${doc}/cours.html`,
  playground: `${doc}/playground-nathalie.html`,
  quiz: `${doc}/quiz-nathalie.csv`,
};
// Fiche de révision et Playground natifs, variante SIRH (plus aucun HTML collé).
const marker = `<!-- playground:rs6776-${key} profil=sirh -->`;
const customHtml = marker;

const inst = must(await db.from("formation_instances").select("id").eq("name", PREVIEW_NAME).eq("is_preview", true).single(), "aperçu");
const secs = must(await db.from("instance_sections").select("id").eq("instance_id", inst.id), "modules");
const row = must(await db.from("instance_lessons").select("id,section_id,title,video_url,custom_video_url").in("section_id", secs.map((s) => s.id)).eq("slug", SLUGS[lesson]).single(), "leçon");
log(`Leçon ${lesson} « ${row.title} » (aperçu ${inst.id})`);

const BUCKET = "lesson-videos";
const prefix = `${inst.id}/`;
const pathOf = (url) => url?.split(`/object/public/${BUCKET}/`)[1] ?? null;
async function putVideo(kind, current) {
  const f = files[kind];
  if (!existsSync(f)) { log(`  ${kind} : pas de fichier ${f}, ignoré`); return current; }
  if (current && !REPLACE) { log(`  ${kind} : déjà en place`); return current; }
  log(`  ${kind} : envoi de ${f} (${(statSync(f).size / 1e6).toFixed(1)} Mo)`);
  if (!APPLY) return current;
  const path = `${inst.id}/${row.section_id}/${Date.now()}-rs6776-${key}-${kind}.mp4`;
  must(await db.storage.from(BUCKET).upload(path, readFileSync(f), { contentType: "video/mp4", upsert: false }), `envoi ${kind}`);
  // L'ancienne vidéo de l'APERÇU est supprimée — uniquement si elle est rangée sous le dossier de l'aperçu.
  const old = pathOf(current);
  if (old?.startsWith(prefix)) await db.storage.from(BUCKET).remove([old]);
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
const video_url = await putVideo("commune", row.video_url);
const custom_video_url = await putVideo("nathalie", row.custom_video_url);

const cours = existsSync(files.cours) ? readFileSync(files.cours, "utf8") : null;
log(`  cours : ${cours ? `${cours.length} car.` : "absent"} · Playground : ${customHtml.length} car. (natif)`);
if (APPLY) must(await db.from("instance_lessons").update({
  video_url, custom_video_url, video_provider: "external_url", ...(cours ? { reference_content: cours } : {}), custom_html_content: customHtml,
}).eq("id", row.id), "mise à jour leçon");

// Quiz de Nathalie (remplace le quiz de cette leçon de l'aperçu).
if (existsSync(files.quiz)) {
  const qs = parseQuiz(readFileSync(files.quiz, "utf8"));
  log(`  quiz : ${qs.length} questions`);
  if (APPLY && qs.length) {
    const old = must(await db.from("instance_quiz_questions").select("id").eq("lesson_id", row.id), "ancien quiz");
    if (old.length) {
      must(await db.from("instance_quiz_options").delete().in("question_id", old.map((q) => q.id)), "suppr. options");
      must(await db.from("instance_quiz_questions").delete().in("id", old.map((q) => q.id)), "suppr. questions");
    }
    for (const [i, q] of qs.entries()) {
      const nq = must(await db.from("instance_quiz_questions").insert({ lesson_id: row.id, question: q.question, explanation: q.explanation || null, order_index: i }).select("id").single(), "question");
      must(await db.from("instance_quiz_options").insert(q.options.map((o, k) => ({ question_id: nq.id, label: o.label, is_correct: o.is_correct, order_index: k }))), "options");
    }
  }
} else log("  quiz : absent");
if (APPLY) log(`Ouvrir en local : http://localhost:5173/lesson/${row.id}`);
