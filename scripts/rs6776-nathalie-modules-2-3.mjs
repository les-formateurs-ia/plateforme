// Passe les modules 2 et 3 de la VRAIE copie de Nathalie (ancienne formation, en production) à la
// nouvelle version RS6776, en reprenant le contenu de son aperçu. Son module 1 n'est pas touché.
// - Sauvegarde préalable de ses modules 2 et 3 (JSON) pour pouvoir revenir en arrière.
// - Mise à jour en place des leçons (mêmes identifiants, ordre de la bible), quiz remplacés.
// - Les modules restent dans leur état d'ouverture actuel (fermés tant que le formateur ne les ouvre pas).
// - Aucune vidéo n'est supprimée du stockage.
//
//   node scripts/rs6776-nathalie-modules-2-3.mjs            # simulation
//   node scripts/rs6776-nathalie-modules-2-3.mjs --apply
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const l of existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : []) {
  const i = l.indexOf("=");
  if (i > 0 && !l.trim().startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const APPLY = process.argv.includes("--apply");
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const must = (r, what) => { if (r.error) throw new Error(`${what} : ${r.error.message}`); return r.data; };
const log = (...a) => console.log(APPLY ? "" : "[simulation]", ...a);

const REAL = "1527ddfb-843c-4903-a581-bb38d6c62784"; // copie réelle de Nathalie
const PREVIEW = "d0a3dd69-9647-4e09-8928-659b0cf89e60"; // aperçu « version Nathalie »
const FIELDS = "slug,title,video_provider,video_url,custom_video_url,video_asset_id,duration_minutes,ai_content_prompt,practical_exercise_prompt,reference_content,custom_html_content,is_mission,mission_template";

const real = must(await db.from("instance_sections").select("id,title,order_index,is_unlocked").eq("instance_id", REAL).order("order_index"), "modules réels");
const prev = must(await db.from("instance_sections").select("id,title,order_index").eq("instance_id", PREVIEW).order("order_index"), "modules aperçu");

// Sauvegarde
const backup = { at: new Date().toISOString(), instance: REAL, sections: [] };
for (const s of real.filter((x) => x.order_index >= 1)) {
  const ls = must(await db.from("instance_lessons").select("*").eq("section_id", s.id).order("order_index"), "leçons");
  const qs = must(await db.from("instance_quiz_questions").select("*, instance_quiz_options(*)").in("lesson_id", ls.map((l) => l.id)), "quiz");
  backup.sections.push({ ...s, lessons: ls, quiz: qs });
}
mkdirSync("tmp/rs6776-backups", { recursive: true });
const backupFile = `tmp/rs6776-backups/nathalie-modules-2-3-${Date.now()}.json`;
writeFileSync(backupFile, JSON.stringify(backup, null, 2));
log(`Sauvegarde : ${backupFile}`);

for (const order of [1, 2]) {
  const rs = real.find((s) => s.order_index === order);
  const ps = prev.find((s) => s.order_index === order);
  const oldLessons = must(await db.from("instance_lessons").select("id,title,order_index").eq("section_id", rs.id).order("order_index"), "anciennes leçons");
  const newLessons = must(await db.from("instance_lessons").select(`id,${FIELDS}`).eq("section_id", ps.id).order("order_index"), "nouvelles leçons");
  log(`\nModule ${order + 1} (${rs.is_unlocked ? "ouvert" : "fermé"}) : « ${rs.title} » → « ${ps.title} »`);
  if (oldLessons.length !== newLessons.length) throw new Error(`Nombre de leçons différent (${oldLessons.length} → ${newLessons.length}) : à traiter à la main.`);
  if (APPLY) must(await db.from("instance_sections").update({ title: ps.title }).eq("id", rs.id), "titre module");
  // Ordre temporaire pour éviter les collisions d'ordre/slug pendant la mise à jour.
  if (APPLY) for (const [i, o] of oldLessons.entries()) must(await db.from("instance_lessons").update({ order_index: 1000 + i, slug: `tmp-${o.id}` }).eq("id", o.id), "ordre temporaire");
  for (const [i, n] of newLessons.entries()) {
    const o = oldLessons[i];
    log(`  ${o.title}  →  ${n.title}${n.is_mission ? " (mission)" : ""}${n.video_url ? " · vidéo" : ""}${n.custom_video_url ? " · vidéo perso" : ""}`);
    if (!APPLY) continue;
    const { id: _ignore, ...fields } = n;
    must(await db.from("instance_lessons").update({ ...fields, order_index: i }).eq("id", o.id), "leçon");
    // Quiz : celui de l'aperçu remplace l'ancien.
    const oldQ = must(await db.from("instance_quiz_questions").select("id").eq("lesson_id", o.id), "ancien quiz");
    if (oldQ.length) {
      must(await db.from("instance_quiz_options").delete().in("question_id", oldQ.map((q) => q.id)), "suppr. options");
      must(await db.from("instance_quiz_questions").delete().in("id", oldQ.map((q) => q.id)), "suppr. questions");
    }
    const newQ = must(await db.from("instance_quiz_questions").select("question,explanation,order_index,instance_quiz_options(label,is_correct,order_index)").eq("lesson_id", n.id).order("order_index"), "quiz aperçu");
    for (const q of newQ) {
      const nq = must(await db.from("instance_quiz_questions").insert({ lesson_id: o.id, question: q.question, explanation: q.explanation, order_index: q.order_index }).select("id").single(), "question");
      if (q.instance_quiz_options.length) must(await db.from("instance_quiz_options").insert(q.instance_quiz_options.map((x) => ({ ...x, question_id: nq.id }))), "options");
    }
  }
}
log("\nModule 1 : inchangé.");
