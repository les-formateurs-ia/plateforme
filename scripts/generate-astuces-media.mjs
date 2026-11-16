// Génère les exemples visuels des Astuces IA (cas pratiques et briques ;
// images, et vidéos quand le domaine sera publié) via Runware, les dépose
// dans le bucket public Supabase "astuces-media" et met à jour
// src/app/data/astuces/media-manifest.json (que l'UI lit pour savoir quels
// exemples existent — un exemple absent s'affiche en « à venir »).
//
// Pré-requis dans .env (jamais commité) :
//   RUNWARE_API_KEY            — la même clé que le secret Supabase du Studio
//   VITE_SUPABASE_URL          — déjà présent
//   SUPABASE_SERVICE_ROLE_KEY  — déjà présent (upload dans le bucket)
//
// Usage :
//   npm run astuces:media -- --dry-run          liste ce qui sera généré + coût estimé
//   npm run astuces:media                       génère tout ce qui manque (reprise possible)
//   npm run astuces:media -- --only=cas/logo,image/lumiere   filtre par préfixe de clé
//   npm run astuces:media -- --images-only | --videos-only
//   npm run astuces:media -- --force            régénère même si déjà présent
//
// Idempotent : le manifeste est réécrit après chaque média réussi, une
// interruption (Ctrl+C, solde épuisé) ne perd rien — relancer reprend où on
// s'est arrêté. Ordre : images sans dépendance (dont les photos de départ),
// puis images Image-to-Image (qui ont besoin de leur photo en ligne), puis
// vidéos.
//
// Les images passent par le catalogue du Studio (supabase/functions/_shared/
// studio-models.ts) : même modèle, mêmes dimensions, même paramètre d'image
// de référence que pour l'élève. On y ajoute seulement la graine (modèles
// FLUX / hébergés par Runware) et une sortie WEBP plus légère.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadAstuces, loadStudioModels } from "./lib/load-astuces.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(ROOT, "src/app/data/astuces/media-manifest.json");
const BUCKET = "astuces-media";
const RUNWARE_URL = "https://api.runware.ai/v1";

// Modèle Studio des images qui n'en précisent pas.
const DEFAULT_IMAGE_MODEL = "flux2-pro";
// Seedance 2.0 Fast : image-to-video via frameImages, son via settings.audio,
// 0,13 $/s en 720p (~0,65 $ le clip de 5 s) — vérifié sur runware.ai/docs le 2026-11-16.
const VIDEO_MODEL = process.env.ASTUCES_VIDEO_MODEL || "bytedance:seedance@2.0-fast";
const VIDEO_DURATION = 5;

// Ordre de grandeur par image (le coût réel, renvoyé par Runware, est
// affiché à la fin) — à affiner après un premier passage.
const IMAGE_COST_ESTIMATE = { "flux2-pro": 0.04, "nano-banana": 0.14, "gpt-image-2": 0.1, "recraft-v4-pro": 0.25 };
const DEFAULT_IMAGE_COST = 0.1;
const VIDEO_COST_ESTIMATE = 0.65;

// Le Studio n'a pas de 4:5 (utilisé par la bibliothèque de briques).
const EXTRA_IMAGE_DIMS = { "4:5": { width: 896, height: 1120 } };
const VIDEO_DIMS = { "1:1": [960, 960], "4:5": [834, 1112], "16:9": [1280, 720], "9:16": [720, 1280] };
// Graine acceptée : FLUX via BFL et modèles hébergés par Runware. Les modèles
// tiers (Google, OpenAI, Recraft…) n'en documentent pas.
const acceptsSeed = (runwareModel) => /^(bfl|runware):/.test(runwareModel);
const EXT_BY_TYPE = { "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg", "video/mp4": "mp4" };

function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (!(key in process.env)) process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}

function parseArgs(argv) {
  const opts = { dryRun: false, force: false, only: [], kinds: new Set(["image", "video"]), concurrency: 4 };
  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--force") opts.force = true;
    else if (arg === "--images-only") opts.kinds = new Set(["image"]);
    else if (arg === "--videos-only") opts.kinds = new Set(["video"]);
    else if (arg.startsWith("--only=")) opts.only = arg.slice(7).split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg.startsWith("--concurrency=")) opts.concurrency = Math.max(1, Number(arg.slice(14)) || 4);
    else throw new Error(`Option inconnue : ${arg}`);
  }
  return opts;
}

function readManifest() {
  try { return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")); } catch { return {}; }
}

function writeManifest(manifest) {
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

async function callRunware(apiKey, tasks, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(RUNWARE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(tasks),
      signal: controller.signal,
    });
    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { throw new Error(`Réponse Runware invalide (HTTP ${resp.status}) : ${text.slice(0, 300)}`); }
    if (json.errors?.length) {
      const e = json.errors[0];
      throw new Error(`${e.code ?? "erreur"} — ${e.message ?? "Runware a refusé la tâche"}${e.parameter ? ` (${e.parameter})` : ""}`);
    }
    return json.data ?? [];
  } finally {
    clearTimeout(timer);
  }
}

const resultUrl = (item) => item?.imageURL ?? item?.videoURL;

async function pollUntilReady(apiKey, taskUUID, { intervalMs, maxMs }) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const data = await callRunware(apiKey, [{ taskType: "getResponse", taskUUID }], 60000);
    const item = data.find((d) => d.taskUUID === taskUUID) ?? data[0];
    if (resultUrl(item)) return item;
  }
  throw new Error(`Délai dépassé (${Math.round(maxMs / 60000)} min) pour la tâche ${taskUUID}`);
}

async function generateImage(apiKey, spec, sourceUrl, studio) {
  const modelId = spec.model ?? DEFAULT_IMAGE_MODEL;
  const config = studio.STUDIO_MODELS[modelId];
  if (!config) throw new Error(`modèle Studio inconnu : ${modelId}`);
  const dims = studio.ASPECT_RATIO_DIMENSIONS[spec.ratio] ?? EXTRA_IMAGE_DIMS[spec.ratio];
  if (!dims) throw new Error(`format non géré : ${spec.ratio}`);
  if (sourceUrl && !config.supportsSourceImage) throw new Error(`${modelId} ne prend pas d'image de référence`);
  const taskUUID = randomUUID();
  const task = {
    ...config.buildTask({ prompt: spec.prompt, width: dims.width, height: dims.height, sourceImageUrl: sourceUrl }),
    taskUUID,
    deliveryMethod: "async",
    outputType: "URL",
    numberResults: 1,
    includeCost: true,
    ...(spec.seed != null && acceptsSeed(config.runwareModel) ? { seed: spec.seed } : {}),
  };
  let data;
  try {
    data = await callRunware(apiKey, [{ ...task, outputFormat: "WEBP", outputQuality: 85 }], 60000);
  } catch (err) {
    // Un modèle tiers qui refuserait la conversion WEBP : on garde son format.
    if (!/output(Format|Quality)/i.test(err instanceof Error ? err.message : "")) throw err;
    data = await callRunware(apiKey, [task], 60000);
  }
  const item = resultUrl(data[0]) ? data[0] : await pollUntilReady(apiKey, taskUUID, { intervalMs: 3000, maxMs: 5 * 60000 });
  return { url: resultUrl(item), cost: item.cost ?? 0 };
}

async function generateVideo(apiKey, spec, startUrl) {
  const [width, height] = VIDEO_DIMS[spec.ratio];
  const taskUUID = randomUUID();
  const data = await callRunware(apiKey, [{
    taskType: "videoInference",
    taskUUID,
    deliveryMethod: "async",
    model: VIDEO_MODEL,
    positivePrompt: spec.prompt,
    width,
    height,
    duration: VIDEO_DURATION,
    outputFormat: "MP4",
    settings: { audio: !!spec.audio },
    ...(startUrl ? { frameImages: [startUrl] } : {}),
    includeCost: true,
  }], 60000);
  const item = resultUrl(data[0]) ? data[0] : await pollUntilReady(apiKey, taskUUID, { intervalMs: 6000, maxMs: 10 * 60000 });
  return { url: resultUrl(item), cost: item.cost ?? 0 };
}

const BUCKET_OPTIONS = { public: true, fileSizeLimit: "50MB", allowedMimeTypes: Object.keys(EXT_BY_TYPE) };

async function ensureBucket(supabase) {
  const { error } = await supabase.storage.getBucket(BUCKET);
  if (!error) {
    // Bucket existant (créé par la migration) : on s'assure qu'il accepte
    // aussi les PNG/JPEG des modèles qui ne sortent pas en WEBP.
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, BUCKET_OPTIONS);
    if (updateError) throw new Error(`Mise à jour du bucket impossible : ${updateError.message}`);
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(BUCKET, BUCKET_OPTIONS);
  if (createError && !/already exists/i.test(createError.message)) throw new Error(`Création du bucket impossible : ${createError.message}`);
}

async function runPool(items, concurrency, worker) {
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

const modelLabel = (spec) => (spec.kind === "image" ? spec.model ?? DEFAULT_IMAGE_MODEL : "vidéo");

async function main() {
  loadDotEnv();
  const opts = parseArgs(process.argv.slice(2));
  const { ASTUCE_DOMAINS, ASTUCE_CAS, collectMedia } = await loadAstuces();
  const studio = await loadStudioModels();
  const manifest = readManifest();

  const all = collectMedia(ASTUCE_DOMAINS, ASTUCE_CAS);
  const todo = all.filter((s) =>
    opts.kinds.has(s.kind)
    && (opts.only.length === 0 || opts.only.some((prefix) => s.key.startsWith(prefix)))
    && (opts.force || !manifest[s.key]));

  const count = (kind) => todo.filter((s) => s.kind === kind).length;
  const estimate = todo.reduce((sum, s) => sum + (s.kind === "video" ? VIDEO_COST_ESTIMATE : IMAGE_COST_ESTIMATE[modelLabel(s)] ?? DEFAULT_IMAGE_COST), 0);
  console.log(`${all.length} exemples au total, ${Object.keys(manifest).length} déjà générés.`);
  console.log(`À générer : ${count("image")} image(s), ${count("video")} vidéo(s) — coût estimé ≈ ${estimate.toFixed(2)} $ (ordre de grandeur).`);

  if (opts.dryRun) {
    for (const s of todo) {
      const dep = s.sourceKey ? `  (référence : ${s.sourceKey})` : s.startKey ? `  (départ : ${s.startKey})` : "";
      console.log(`  ${s.kind === "image" ? "🖼 " : "🎬"} ${s.key}  [${modelLabel(s)}]${dep}`);
    }
    return;
  }
  if (todo.length === 0) return;

  const apiKey = process.env.RUNWARE_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey) throw new Error("RUNWARE_API_KEY manquante dans .env (même valeur que le secret Supabase du Studio).");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("VITE_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY manquantes dans .env.");

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  await ensureBucket(supabase);
  const publicUrl = (key, ext) => `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${key}.${ext}`;

  let spent = 0;
  const failures = [];

  // Une image de référence / de départ doit déjà être en ligne.
  const dependencyUrl = (key) => {
    if (!key) return undefined;
    const entry = manifest[key];
    if (!entry) throw new Error(`image ${key} absente — génère-la d'abord`);
    return publicUrl(key, entry.ext);
  };

  const handleSpec = async (spec) => {
    const label = `${spec.kind === "image" ? "🖼 " : "🎬"} ${spec.key}`;
    try {
      const result = spec.kind === "image"
        ? await generateImage(apiKey, spec, dependencyUrl(spec.sourceKey), studio)
        : await generateVideo(apiKey, spec, dependencyUrl(spec.startKey));
      const file = await fetch(result.url);
      if (!file.ok) throw new Error(`téléchargement impossible (HTTP ${file.status})`);
      const contentType = (file.headers.get("content-type") ?? "").split(";")[0].trim() || (spec.kind === "video" ? "video/mp4" : "image/webp");
      const ext = EXT_BY_TYPE[contentType];
      if (!ext) throw new Error(`format reçu inattendu : ${contentType}`);
      const body = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(`${spec.key}.${ext}`, body, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw new Error(`upload : ${error.message}`);
      manifest[spec.key] = { kind: spec.kind, ext, v: Date.now() };
      writeManifest(manifest);
      spent += result.cost;
      console.log(`✔ ${label}  (${(body.length / 1024).toFixed(0)} Ko, ${result.cost ? `${result.cost.toFixed(3)} $` : "coût n/c"})`);
    } catch (err) {
      failures.push({ key: spec.key, message: err instanceof Error ? err.message : String(err) });
      console.error(`✖ ${label} — ${err instanceof Error ? err.message : err}`);
    }
  };

  // Les dépendances d'abord : images seules, puis Image-to-Image, puis vidéos.
  await runPool(todo.filter((s) => s.kind === "image" && !s.sourceKey), opts.concurrency, handleSpec);
  await runPool(todo.filter((s) => s.kind === "image" && s.sourceKey), opts.concurrency, handleSpec);
  await runPool(todo.filter((s) => s.kind === "video"), opts.concurrency, handleSpec);

  console.log(`\nTerminé : ${todo.length - failures.length}/${todo.length} réussis, ${spent.toFixed(2)} $ dépensés (selon Runware).`);
  if (failures.length) {
    console.log("Échecs (relance la commande pour réessayer uniquement ceux-ci) :");
    for (const f of failures) console.log(`  - ${f.key} : ${f.message}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
