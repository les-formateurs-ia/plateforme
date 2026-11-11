// Crée (ou complète) le modèle de formation RS6776 dans l'ordre définitif de
// docs/formation-rs6776/bible.md, en BROUILLON, sans toucher aux autres modèles
// ni aux copies des élèves. Rejouable : rien n'est recréé s'il existe déjà.
//
//   node scripts/rs6776-create-template.mjs            # simulation, n'écrit rien
//   node scripts/rs6776-create-template.mjs --apply    # écrit
//
// Clé service_role lue dans .env (SUPABASE_SERVICE_ROLE_KEY).
import { readFileSync, existsSync, statSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const l of existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : []) {
  const i = l.indexOf("=");
  if (i > 0 && !l.trim().startsWith("#")) process.env[l.slice(0, i).trim()] ??= l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const APPLY = process.argv.includes("--apply");
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const FORMATION = {
  name: "RS6776 · Création de contenus rédactionnels et visuels par l'usage responsable de l'IA générative",
  slug: "rs6776-formation-video-v2",
  description: "Comprendre, tester et maîtriser l'IA générative pour créer des contenus rédactionnels et visuels efficaces, accessibles et conformes. Prépare à la certification RS6776 (InKréa).",
  duration_minutes: 960,
  status: "draft",
};

const L = (slug, title, extra = {}) => ({ slug, title, ...extra });
const MODULES = [
  { title: "Module 1 — Comprendre, installer et planifier l'IA dans son travail", lessons: [
    L("comprendre-ia-generative", "Comprendre l'IA générative et ses usages", { lesson11: true }),
    L("analyser-son-poste", "Analyser son poste et identifier les tâches automatisables"),
    L("installer-configurer-outils", "Installer et configurer les outils IA"),
    L("informations-a-proteger", "Reconnaître les informations à protéger"),
    L("securiser-son-usage", "Sécuriser son usage de l'IA"),
    L("plan-actions-ia", "Élaborer son plan d'actions IA"),
    L("mission-strategie-confidentialite", "Mission IA : stratégie et confidentialité", { is_mission: true, mission_template: "strategie-confidentialite" }),
  ] },
  { title: "Module 2 — Maîtriser le prompt engineering et créer des contenus", lessons: [
    L("bases-prompt-engineering", "Les bases du prompt engineering"),
    L("prompts-avances", "Prompts avancés : méthode pour les tâches complexes"),
    L("redaction-assistee", "Rédaction assistée par IA"),
    L("contenus-visuels", "Créer des contenus visuels"),
    L("optimiser-contenus", "Optimiser les contenus générés"),
    L("mission-contenu-optimisation", "Mission IA : contenu et optimisation", { is_mission: true, mission_template: "contenu-optimisation" }),
  ] },
  { title: "Module 3 — Produire des contenus accessibles et conformes", lessons: [
    L("contenus-inclusifs", "Produire des contenus inclusifs"),
    L("cadre-legal-ia-act-rgpd", "Cadre légal : IA Act, RGPD et veille"),
    L("mission-conformite-accessibilite", "Mission IA : conformité et accessibilité", { is_mission: true, mission_template: "conformite-accessibilite" }),
  ] },
];

// Leçon 1.1 au nouveau format : vidéo commune, cours complet (source des IA),
// fiche de révision native. Le Playground commun n'est pas encore ouvert (pg=non).
const LESSON_11 = {
  videoFile: "lesson-videos/out/rs6776-1-1-commune.mp4",
  reference_content: readFileSync("docs/formation-rs6776/lecon-1.1/cours.html", "utf8"),
  custom_html_content: "<!-- playground:rs6776-1-1 pg=non -->",
  duration_minutes: 30,
};

const log = (...a) => console.log(APPLY ? "" : "[simulation]", ...a);
const must = (r, what) => { if (r.error) throw new Error(`${what} : ${r.error.message}`); return r.data; };

// 1. Le modèle
let formation = must(await db.from("formations").select("id,name,status").eq("slug", FORMATION.slug).maybeSingle(), "lecture modèle");
if (formation) log(`Modèle déjà présent : ${formation.id} (${formation.status})`);
else if (APPLY) { formation = must(await db.from("formations").insert(FORMATION).select("id,name,status").single(), "création modèle"); log(`Modèle créé : ${formation.id}`); }
else log(`Créerait le modèle « ${FORMATION.name} » en brouillon`);

// 2. Modules et leçons
for (const [mi, mod] of MODULES.entries()) {
  let section = formation ? must(await db.from("sections").select("id").eq("formation_id", formation.id).eq("order_index", mi).maybeSingle(), "lecture module") : null;
  if (!section && APPLY) section = must(await db.from("sections").insert({ formation_id: formation.id, title: mod.title, order_index: mi }).select("id").single(), "création module");
  log(`${section ? "✓" : "+"} ${mod.title}`);
  for (const [li, les] of mod.lessons.entries()) {
    const existing = section ? must(await db.from("lessons").select("id,video_url").eq("section_id", section.id).eq("slug", les.slug).maybeSingle(), "lecture leçon") : null;
    let row = existing;
    if (!row && APPLY) {
      row = must(await db.from("lessons").insert({
        section_id: section.id, slug: les.slug, title: les.title, order_index: li, video_provider: "external_url",
        is_mission: !!les.is_mission, mission_template: les.mission_template ?? null,
      }).select("id,video_url").single(), "création leçon");
    }
    log(`   ${existing ? "✓" : "+"} ${li + 1}. ${les.title}${les.is_mission ? " (mission)" : ""}`);

    if (les.lesson11) {
      // Vidéo commune : nouveau fichier, nouveau chemin — aucune vidéo existante n'est remplacée ni supprimée.
      let videoUrl = row?.video_url ?? null;
      if (!videoUrl) {
        const size = (statSync(LESSON_11.videoFile).size / 1e6).toFixed(1);
        if (APPLY) {
          const path = `${formation.id}/${section.id}/${Date.now()}-rs6776-1-1-commune.mp4`;
          must(await db.storage.from("lesson-videos").upload(path, readFileSync(LESSON_11.videoFile), { contentType: "video/mp4", upsert: false }), "envoi vidéo");
          videoUrl = db.storage.from("lesson-videos").getPublicUrl(path).data.publicUrl;
        }
        log(`      + vidéo commune (${size} Mo) envoyée dans un nouveau fichier`);
      } else log("      ✓ vidéo déjà en place");
      if (APPLY) must(await db.from("lessons").update({
        video_url: videoUrl, video_provider: "external_url", reference_content: LESSON_11.reference_content,
        custom_html_content: LESSON_11.custom_html_content, duration_minutes: LESSON_11.duration_minutes,
      }).eq("id", row.id), "mise à jour leçon 1.1");
      log(`      cours complet (${LESSON_11.reference_content.length} car.), fiche de révision : ${LESSON_11.custom_html_content}`);
    }
  }
}
if (!APPLY) console.log("\nSimulation terminée. Relancer avec --apply pour écrire.");
