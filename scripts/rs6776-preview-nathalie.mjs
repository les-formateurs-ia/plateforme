// Crée une copie d'APERÇU « version Nathalie » du modèle RS6776, rattachée au
// compte admin (is_preview = true) : invisible pour Nathalie et pour les élèves,
// elle sert à tester en local sa vidéo personnalisée et le Playground SIRH.
// La vraie copie de Nathalie (ancienne formation) n'est pas touchée.
//
// template_id est laissé vide exprès : « Voir en tant qu'élève » sur le modèle
// supprime l'aperçu existant de l'admin pour ce modèle, il effacerait celui-ci.
//
//   node scripts/rs6776-preview-nathalie.mjs            # simulation
//   node scripts/rs6776-preview-nathalie.mjs --apply
import { readFileSync, existsSync, statSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const l of existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : []) {
  const i = l.indexOf("=");
  if (i > 0 && !l.trim().startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const APPLY = process.argv.includes("--apply");
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const must = (r, what) => { if (r.error) throw new Error(`${what} : ${r.error.message}`); return r.data; };
const log = (...a) => console.log(APPLY ? "" : "[simulation]", ...a);

const TEMPLATE_SLUG = "rs6776-formation-video-v2";
const PREVIEW_NAME = "APERÇU Nathalie — RS6776 · Création de contenus rédactionnels et visuels par l'usage responsable de l'IA générative";
const NATHALIE_VIDEO = "lesson-videos/out/rs6776-1-1-nathalie.mp4";
const MARKER_SIRH = "<!-- playground:rs6776-1-1 profil=sirh -->";

const template = must(await db.from("formations").select("*").eq("slug", TEMPLATE_SLUG).single(), "modèle");
const admins = must(await db.from("profiles").select("id,first_name,last_name").eq("role", "admin"), "admins");
const ownerId = process.env.RS6776_PREVIEW_OWNER ?? (admins.length === 1 ? admins[0].id : null);
if (!ownerId) { console.log("Plusieurs admins : préciser RS6776_PREVIEW_OWNER=<id>.", admins); process.exit(1); }
log(`Propriétaire de l'aperçu : ${admins.find((a) => a.id === ownerId)?.first_name ?? ownerId}`);

let inst = must(await db.from("formation_instances").select("id").eq("user_id", ownerId).eq("name", PREVIEW_NAME).eq("is_preview", true).maybeSingle(), "lecture aperçu");
if (inst) log(`Aperçu déjà présent : ${inst.id}`);
else if (APPLY) {
  inst = must(await db.from("formation_instances").insert({
    template_id: null, user_id: ownerId, name: PREVIEW_NAME, description: template.description, duration_minutes: template.duration_minutes,
    price_cents: template.price_cents, currency: template.currency, certification_enabled: template.certification_enabled,
    certification_prompt: template.certification_prompt, status: "active", assigned_by: ownerId, is_preview: true,
  }).select("id").single(), "création aperçu");
  log(`Aperçu créé : ${inst.id}`);
} else log("Créerait l'aperçu");

const sections = must(await db.from("sections").select("*").eq("formation_id", template.id).order("order_index"), "modules");
let lesson11 = null;
for (const s of sections) {
  let is = inst ? must(await db.from("instance_sections").select("id").eq("instance_id", inst.id).eq("order_index", s.order_index).maybeSingle(), "lecture module") : null;
  if (!is && APPLY) is = must(await db.from("instance_sections").insert({ instance_id: inst.id, title: s.title, order_index: s.order_index, is_unlocked: true }).select("id").single(), "copie module");
  const lessons = must(await db.from("lessons").select("*").eq("section_id", s.id).order("order_index"), "leçons");
  for (const l of lessons) {
    let il = is ? must(await db.from("instance_lessons").select("id,custom_video_url").eq("section_id", is.id).eq("slug", l.slug).maybeSingle(), "lecture leçon") : null;
    if (!il && APPLY) il = must(await db.from("instance_lessons").insert({
      section_id: is.id, slug: l.slug, title: l.title, video_provider: l.video_provider, video_url: l.video_url, custom_video_url: l.custom_video_url,
      video_asset_id: l.video_asset_id, duration_minutes: l.duration_minutes, ai_content_prompt: l.ai_content_prompt,
      practical_exercise_prompt: l.practical_exercise_prompt, reference_content: l.reference_content, custom_html_content: l.custom_html_content,
      is_mission: l.is_mission, mission_template: l.mission_template, order_index: l.order_index,
    }).select("id,custom_video_url").single(), "copie leçon");
    if (l.slug === "comprendre-ia-generative") lesson11 = { il, sectionId: is?.id };
  }
  log(`✓ ${s.title} (${lessons.length} leçons, module ouvert)`);
}

// Leçon 1.1 version Nathalie : vidéo personnalisée + Playground et fiche SIRH.
const size = (statSync(NATHALIE_VIDEO).size / 1e6).toFixed(1);
if (APPLY) {
  let url = lesson11.il.custom_video_url;
  if (!url) {
    const path = `${inst.id}/${lesson11.sectionId}/${Date.now()}-rs6776-1-1-nathalie.mp4`;
    must(await db.storage.from("lesson-videos").upload(path, readFileSync(NATHALIE_VIDEO), { contentType: "video/mp4", upsert: false }), "envoi vidéo");
    url = db.storage.from("lesson-videos").getPublicUrl(path).data.publicUrl;
  }
  must(await db.from("instance_lessons").update({ custom_video_url: url, custom_html_content: MARKER_SIRH }).eq("id", lesson11.il.id), "leçon 1.1");
  log(`Leçon 1.1 : vidéo personnalisée (${size} Mo) + ${MARKER_SIRH}`);
  log(`Ouvrir en local : http://localhost:5173/lesson/${lesson11.il.id}`);
} else log(`Leçon 1.1 : enverrait la vidéo de Nathalie (${size} Mo) et poserait ${MARKER_SIRH}`);
