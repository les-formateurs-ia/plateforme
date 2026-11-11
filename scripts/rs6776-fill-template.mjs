// Complète une leçon du MODÈLE de formation RS6776 (brouillon, slug rs6776-formation-video-v2) :
// vidéo commune, cours complet, fiche de révision native (sans Playground : il est propre à chaque
// élève, comme la vidéo personnalisée), quiz. Ne touche à aucune copie d'élève.
//
//   node scripts/rs6776-fill-template.mjs 1.2                 # simulation
//   node scripts/rs6776-fill-template.mjs 1.2 --apply
//   node scripts/rs6776-fill-template.mjs 1.1 --apply --replace-video   # après un nouveau rendu
import { readFileSync, existsSync, statSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { parseQuiz } from "./rs6776-quiz.mjs";

for (const l of existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : []) {
  const i = l.indexOf("=");
  if (i > 0 && !l.trim().startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const [lesson] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const REPLACE = process.argv.includes("--replace-video");
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const must = (r, what) => { if (r.error) throw new Error(`${what} : ${r.error.message}`); return r.data; };
const log = (...a) => console.log(APPLY ? "" : "[simulation]", ...a);

const SLUGS = {
  "1.1": "comprendre-ia-generative", "1.2": "analyser-son-poste", "1.3": "installer-configurer-outils", "1.4": "informations-a-proteger",
  "1.5": "securiser-son-usage", "1.6": "plan-actions-ia", "2.1": "bases-prompt-engineering", "2.2": "prompts-avances",
  "2.3": "redaction-assistee", "2.4": "contenus-visuels", "2.5": "optimiser-contenus", "3.1": "contenus-inclusifs", "3.2": "cadre-legal-ia-act-rgpd",
};
if (!SLUGS[lesson]) { console.error(`Leçon inconnue : ${lesson}`); process.exit(1); }
const key = lesson.replace(".", "-");
const doc = `docs/formation-rs6776/lecon-${lesson}`;
const videoFile = `lesson-videos/out/rs6776-${key}-commune.mp4`;

const tpl = must(await db.from("formations").select("id").eq("slug", "rs6776-formation-video-v2").single(), "modèle");
const secs = must(await db.from("sections").select("id").eq("formation_id", tpl.id), "modules");
const row = must(await db.from("lessons").select("id,section_id,title,video_url").in("section_id", secs.map((s) => s.id)).eq("slug", SLUGS[lesson]).single(), "leçon");
log(`Modèle · leçon ${lesson} « ${row.title} »`);

const BUCKET = "lesson-videos";
let video_url = row.video_url;
if (existsSync(videoFile) && (!video_url || REPLACE)) {
  log(`  vidéo commune : envoi de ${videoFile} (${(statSync(videoFile).size / 1e6).toFixed(1)} Mo)`);
  if (APPLY) {
    const path = `${tpl.id}/${row.section_id}/${Date.now()}-rs6776-${key}-commune.mp4`;
    must(await db.storage.from(BUCKET).upload(path, readFileSync(videoFile), { contentType: "video/mp4", upsert: false }), "envoi vidéo");
    video_url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    // L'ancienne vidéo du modèle n'est pas supprimée : des copies d'élèves peuvent encore la référencer.
  }
} else log(`  vidéo commune : ${video_url ? "déjà en place" : `pas encore rendue (${videoFile})`}`);

const cours = existsSync(`${doc}/cours.html`) ? readFileSync(`${doc}/cours.html`, "utf8") : null;
const marker = `<!-- playground:rs6776-${key} pg=non -->`;
log(`  cours : ${cours ? `${cours.length} car.` : "absent"} · ${marker}`);
if (APPLY) must(await db.from("lessons").update({
  video_url, video_provider: "external_url", ...(cours ? { reference_content: cours } : {}), custom_html_content: marker, custom_video_url: null,
}).eq("id", row.id), "mise à jour leçon");

const quizFile = `${doc}/quiz-nathalie.csv`;
if (existsSync(quizFile)) {
  const qs = parseQuiz(readFileSync(quizFile, "utf8"));
  log(`  quiz : ${qs.length} questions`);
  if (APPLY && qs.length) {
    const old = must(await db.from("quiz_questions").select("id").eq("lesson_id", row.id), "ancien quiz");
    if (old.length) {
      must(await db.from("quiz_options").delete().in("question_id", old.map((q) => q.id)), "suppr. options");
      must(await db.from("quiz_questions").delete().in("id", old.map((q) => q.id)), "suppr. questions");
    }
    for (const [i, q] of qs.entries()) {
      const nq = must(await db.from("quiz_questions").insert({ lesson_id: row.id, question: q.question, explanation: q.explanation || null, order_index: i }).select("id").single(), "question");
      must(await db.from("quiz_options").insert(q.options.map((o, k) => ({ question_id: nq.id, label: o.label, is_correct: o.is_correct, order_index: k }))), "options");
    }
  }
}
