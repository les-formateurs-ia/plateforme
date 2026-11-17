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
//   npm run astuces:media -- --images-only | --videos-only | --pages-only
//   npm run astuces:media -- --pages-only --rerender   refilme les pages web sans rappeler Claude
//   npm run astuces:media -- --force            régénère même si déjà présent
//   npm run astuces:media -- --as=email@…       passe par Le Studio de ce compte (voir plus bas)
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
//
// Mode Studio (--as=<email>) : sans clé Runware locale, chaque image est
// générée par les edge functions du Studio (generate-studio-image puis
// check-studio-image-status) AU NOM de ce compte — les images arrivent dans
// sa galerie et sont décomptées de son budget IA, comme une génération faite
// à la main. La session est ouverte avec la clé service-role (lien magique
// généré côté admin, aucun e-mail envoyé). Pas de graine dans ce mode : Le
// Studio n'en transmet pas. Formats limités à ceux du Studio (pas de 4:5).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadAstuces, loadStudioModels, loadStudioVideoModels } from "./lib/load-astuces.mjs";
import { openPageRecorder } from "./lib/page-recorder.mjs";

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
// Vidéos des cas pratiques (Studio Vidéos), ordre de grandeur par clip.
const STUDIO_VIDEO_COST_ESTIMATE = { kling: 0.7, "kling-video-3-pro": 0.7, "veo-3-1-fast": 1.0, "seedance-2-0-fast": 0.65 };
// Page web : une réponse de Claude Opus de ~6 000 tokens de code.
const PAGE_COST_ESTIMATE = 0.4;

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
  const opts = { dryRun: false, force: false, rerender: false, only: [], kinds: new Set(["image", "video", "page"]), concurrency: 4 };
  for (const arg of argv) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--force") opts.force = true;
    else if (arg === "--images-only") opts.kinds = new Set(["image"]);
    else if (arg === "--videos-only") opts.kinds = new Set(["video"]);
    else if (arg === "--pages-only") opts.kinds = new Set(["page"]);
    else if (arg === "--rerender") opts.rerender = true;
    else if (arg.startsWith("--only=")) opts.only = arg.slice(7).split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg.startsWith("--concurrency=")) opts.concurrency = Math.max(1, Number(arg.slice(14)) || 4);
    else if (arg.startsWith("--as=")) opts.as = arg.slice(5).trim();
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

// Format réel d'après les premiers octets (les fichiers du Studio peuvent
// être servis en application/octet-stream).
function sniffType(body, announced) {
  if (EXT_BY_TYPE[announced]) return announced;
  const head = body.subarray(0, 12);
  if (head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (head[0] === 0x89 && head.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (head[0] === 0xff && head[1] === 0xd8) return "image/jpeg";
  if (head.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  return announced;
}

// ── Mode Studio ────────────────────────────────────────────────────────────
async function functionError(error) {
  try {
    const body = await error.context?.clone().json();
    if (body?.error) return body.error;
  } catch { /* corps non JSON */ }
  return error.message;
}

async function openStudioSession(supabaseUrl, anonKey, admin, email) {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !link?.properties?.hashed_token) throw new Error(`Compte ${email} introuvable : ${error?.message ?? "pas de lien"}`);
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: true } });
  const { data: session, error: otpError } = await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" });
  if (otpError || !session?.user) throw new Error(`Connexion à ${email} impossible : ${otpError?.message ?? "session vide"}`);
  return { client, userId: session.user.id, sources: new Map() };
}

// La photo de départ (bucket public) est déposée une fois dans les sources
// Studio du compte, comme le ferait l'élève avec « Ajoute ta photo ».
function studioSourcePath(ctx, key, url) {
  if (!ctx.sources.has(key)) {
    ctx.sources.set(key, (async () => {
      const file = await fetch(url);
      if (!file.ok) throw new Error(`photo de départ illisible (HTTP ${file.status})`);
      const body = Buffer.from(await file.arrayBuffer());
      const contentType = sniffType(body, (file.headers.get("content-type") ?? "").split(";")[0].trim());
      const filePath = `${ctx.userId}/sources/astuces-${key.replaceAll("/", "-")}.${EXT_BY_TYPE[contentType] ?? "webp"}`;
      const { error } = await ctx.client.storage.from("studio-images").upload(filePath, body, { contentType, upsert: true });
      if (error) throw new Error(`dépôt de la photo de départ : ${error.message}`);
      return filePath;
    })());
  }
  return ctx.sources.get(key);
}

async function generateViaStudio(ctx, spec, sourceUrl) {
  const sourceImagePath = sourceUrl ? await studioSourcePath(ctx, spec.sourceKey, sourceUrl) : undefined;
  const { data, error } = await ctx.client.functions.invoke("generate-studio-image", {
    body: { model: spec.model ?? DEFAULT_IMAGE_MODEL, aspectRatio: spec.ratio, prompt: spec.prompt, sourceImagePath },
  });
  if (error) throw new Error(await functionError(error));
  const deadline = Date.now() + 5 * 60000;
  while (Date.now() < deadline) {
    const { data: status, error: statusError } = await ctx.client.functions.invoke("check-studio-image-status", { body: { generationId: data.id } });
    if (statusError) throw new Error(await functionError(statusError));
    if (status.status === "ready" && status.imagePath) {
      const { data: signed, error: signError } = await ctx.client.storage.from("studio-images").createSignedUrl(status.imagePath, 600);
      if (signError || !signed?.signedUrl) throw new Error(`lecture du résultat : ${signError?.message ?? "pas d'URL"}`);
      return { url: signed.signedUrl, cost: 0 };
    }
    if (status.status === "failed") throw new Error(status.error ?? "génération échouée");
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error("Délai dépassé (5 min)");
}

// Vidéo d'un cas pratique, comme un élève dans « Créer vos vidéos » : l'image
// de départ est déposée dans ses sources, puis generate-studio-video et
// check-studio-video-status jusqu'au résultat.
function studioVideoSourcePath(ctx, key, url) {
  const cacheKey = `video:${key}`;
  if (!ctx.sources.has(cacheKey)) {
    ctx.sources.set(cacheKey, (async () => {
      const file = await fetch(url);
      if (!file.ok) throw new Error(`image de départ illisible (HTTP ${file.status})`);
      const body = Buffer.from(await file.arrayBuffer());
      const contentType = sniffType(body, (file.headers.get("content-type") ?? "").split(";")[0].trim());
      const filePath = `${ctx.userId}/sources/astuces-${key.replaceAll("/", "-")}.${EXT_BY_TYPE[contentType] ?? "jpg"}`;
      const { error } = await ctx.client.storage.from("studio-videos").upload(filePath, body, { contentType, upsert: true });
      if (error) throw new Error(`dépôt de l'image de départ : ${error.message}`);
      return filePath;
    })());
  }
  return ctx.sources.get(cacheKey);
}

async function generateVideoViaStudio(ctx, spec, sourceUrl) {
  const sourceImagePath = sourceUrl ? await studioVideoSourcePath(ctx, spec.sourceKey, sourceUrl) : undefined;
  const options = { aspectRatio: spec.ratio, ...(spec.duration ? { duration: spec.duration } : {}) };
  const { data, error } = await ctx.client.functions.invoke("generate-studio-video", {
    body: { model: spec.model, prompt: spec.prompt, sourceImagePath, options },
  });
  if (error) throw new Error(await functionError(error));
  const deadline = Date.now() + 15 * 60000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 6000));
    const { data: status, error: statusError } = await ctx.client.functions.invoke("check-studio-video-status", { body: { generationId: data.id } });
    if (statusError) throw new Error(await functionError(statusError));
    if (status.status === "ready" && status.videoPath) {
      const { data: signed, error: signError } = await ctx.client.storage.from("studio-videos").createSignedUrl(status.videoPath, 600);
      if (signError || !signed?.signedUrl) throw new Error(`lecture du résultat : ${signError?.message ?? "pas d'URL"}`);
      return { url: signed.signedUrl, cost: 0 };
    }
    if (status.status === "failed") throw new Error(status.error ?? "génération échouée");
  }
  throw new Error("Délai dépassé (15 min)");
}

// text/plain : code HTML des pages web d'exemple (<clé>.html), conservé pour
// pouvoir les refilmer (--rerender) sans rappeler Claude.
const BUCKET_OPTIONS = { public: true, fileSizeLimit: "50MB", allowedMimeTypes: [...Object.keys(EXT_BY_TYPE), "text/plain"] };

// ── Pages web (cas Web) ────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Le chat du Studio plafonne une réponse à 8 192 tokens : une page complète
// (CSS + SVG + textes) dépasse souvent. Comme un élève le ferait, on demande
// alors à Claude de continuer dans la même conversation, puis on recolle.
const MAX_CONTINUATIONS = 3;

const stripFences = (text) => text.replace(/^\s*```[a-z]*[^\n]*\n/i, "").replace(/\n?```\s*$/, "");

// Recolle une suite en retirant le chevauchement éventuel (Claude reprend
// parfois les derniers caractères).
function appendContinuation(acc, next) {
  for (let k = Math.min(400, next.length, acc.length); k >= 8; k--) {
    if (acc.endsWith(next.slice(0, k))) return acc + next.slice(k);
  }
  return acc + next;
}

function cleanHtml(text) {
  let html = stripFences(text);
  const start = html.search(/<!doctype html|<html/i);
  if (start > 0) html = html.slice(start);
  const end = html.search(/<\/html>/i);
  return end >= 0 ? html.slice(0, end + "</html>".length).trim() : html;
}

async function askClaude(ctx, spec, message, conversationId) {
  const { data, error } = await ctx.client.functions.invoke("studio-chat", {
    body: { provider: "anthropic", model: spec.model, message, ...(conversationId ? { conversationId } : {}) },
  });
  if (error) throw new Error(await functionError(error));
  let conversation = data.conversation;
  const deadline = Date.now() + 12 * 60000;
  while (conversation?.pending_task) {
    if (Date.now() > deadline) throw new Error("Claude n'a pas répondu en 12 min");
    await sleep(5000);
    const status = await ctx.client.functions.invoke("studio-chat-status", { body: { conversationId: conversation.id } });
    if (status.error) throw new Error(await functionError(status.error));
    if (status.data?.error) throw new Error(status.data.error);
    conversation = status.data?.conversation ?? conversation;
  }
  const reply = conversation?.messages?.at(-1);
  if (!reply || reply.role !== "assistant" || !reply.content) throw new Error("réponse de Claude vide");
  return { conversationId: conversation.id, text: reply.content };
}

// Même chemin qu'un élève dans « Discutez avec Claude » : une conversation
// par page, visible dans l'historique du compte.
async function generatePageViaStudio(ctx, spec) {
  let { conversationId, text } = await askClaude(ctx, spec, spec.prompt);
  const start = text.search(/<!doctype html|<html/i);
  if (start < 0) throw new Error("la réponse de Claude ne contient pas de page HTML");
  let code = stripFences(text.slice(start));
  for (let i = 0; !/<\/html>/i.test(code); i++) {
    if (i >= MAX_CONTINUATIONS) throw new Error("page incomplète malgré les relances");
    const tail = code.slice(-80);
    const next = await askClaude(ctx, spec, `Ta réponse a été coupée. Continue le code exactement là où il s'arrête (après « ${tail} »), sans répéter ce qui précède et sans aucune explication.`, conversationId);
    code = appendContinuation(code, stripFences(next.text));
  }
  return cleanHtml(code);
}

// Retouche : Claude ne renvoie que les blocs <style>/<script> à ajouter ;
// on les colle avant </body> de la page de départ, qui reste intacte.
async function retouchViaStudio(ctx, spec, baseHtml) {
  const message = `${spec.prompt}\n\nVoici le code actuel de la page :\n\n\`\`\`html\n${baseHtml}\n\`\`\``;
  let { conversationId, text } = await askClaude(ctx, spec, message);
  // Rare : réponse coupée au milieu d'un bloc — on demande la suite.
  const openScripts = (t) => (t.match(/<script\b/gi) ?? []).length - (t.match(/<\/script>/gi) ?? []).length;
  for (let i = 0; openScripts(text) > 0; i++) {
    if (i >= MAX_CONTINUATIONS) throw new Error("retouche incomplète malgré les relances");
    const next = await askClaude(ctx, spec, `Ta réponse a été coupée. Continue exactement là où elle s'arrête (après « ${text.slice(-80)} »), sans rien répéter ni expliquer.`, conversationId);
    text = appendContinuation(text, stripFences(next.text));
  }
  const blocks = text.match(/<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>/gi) ?? [];
  if (blocks.length === 0) throw new Error("la retouche ne contient ni <style> ni <script>");
  const additions = `\n<!-- Retouche : ${spec.key} -->\n${blocks.join("\n")}\n`;
  const lastBody = baseHtml.search(/<\/body>(?![\s\S]*<\/body>)/i);
  return lastBody >= 0 ? `${baseHtml.slice(0, lastBody)}${additions}${baseHtml.slice(lastBody)}` : `${baseHtml}${additions}`;
}

async function ensureBucket(supabase) {
  const { error } = await supabase.storage.getBucket(BUCKET);
  if (!error) {
    // Bucket existant (créé par la migration) : on s'assure qu'il accepte
    // aussi les PNG/JPEG des modèles qui ne sortent pas en WEBP et le HTML.
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

const kindOf = (spec) => (spec.page ? "page" : spec.kind);
const modelLabel = (spec) => (spec.page ? spec.model : spec.kind === "image" ? spec.model ?? DEFAULT_IMAGE_MODEL : spec.model ?? "vidéo");
const icon = (spec) => (spec.page ? "🌐" : spec.kind === "image" ? "🖼 " : "🎬");
const costOf = (spec) => (spec.page ? (spec.pageFrom && !spec.prompt ? 0 : PAGE_COST_ESTIMATE) : spec.kind === "video" ? STUDIO_VIDEO_COST_ESTIMATE[spec.model] ?? VIDEO_COST_ESTIMATE : IMAGE_COST_ESTIMATE[modelLabel(spec)] ?? DEFAULT_IMAGE_COST);

async function main() {
  loadDotEnv();
  const opts = parseArgs(process.argv.slice(2));
  const { ASTUCE_DOMAINS, ASTUCE_CAS, collectMedia } = await loadAstuces();
  const studio = await loadStudioModels();
  const { STUDIO_VIDEO_MODELS } = await loadStudioVideoModels();
  // Vidéo d'un cas pratique = modèle du Studio Vidéos ; sinon vidéo de la
  // bibliothèque (Runware direct, Seedance).
  const isStudioVideo = (s) => s.kind === "video" && !s.page && !!STUDIO_VIDEO_MODELS[s.model];
  const manifest = readManifest();

  const all = collectMedia(ASTUCE_DOMAINS, ASTUCE_CAS);
  const todo = all.filter((s) =>
    opts.kinds.has(kindOf(s))
    && (opts.only.length === 0 || opts.only.some((prefix) => s.key.startsWith(prefix)))
    && (opts.force || !manifest[s.key]));

  const count = (kind) => todo.filter((s) => kindOf(s) === kind).length;
  const estimate = opts.rerender ? 0 : todo.reduce((sum, s) => sum + costOf(s), 0);
  console.log(`${all.length} exemples au total, ${Object.keys(manifest).length} déjà générés.`);
  console.log(`À générer : ${count("image")} image(s), ${count("video")} vidéo(s), ${count("page")} page(s) web — coût estimé ≈ ${estimate.toFixed(2)} $ (ordre de grandeur).`);

  if (opts.dryRun) {
    for (const s of todo) {
      const dep = s.sourceKey ? `  (référence : ${s.sourceKey})` : s.startKey ? `  (départ : ${s.startKey})` : "";
      console.log(`  ${icon(s)} ${s.key}  [${modelLabel(s)}${s.page ? ` → ${s.kind === "video" ? "vidéo" : "capture"}` : ""}]${dep}`);
    }
    return;
  }
  if (todo.length === 0) return;

  const apiKey = process.env.RUNWARE_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("VITE_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY manquantes dans .env.");
  if (!apiKey && !opts.as && todo.some((s) => !s.page)) throw new Error("RUNWARE_API_KEY manquante dans .env — ou passe par Le Studio d'un compte avec --as=<email>.");
  if (opts.as && todo.some((s) => kindOf(s) === "video" && !isStudioVideo(s))) throw new Error("Le mode Studio ne gère que les vidéos des cas pratiques (pas celles de la bibliothèque).");
  if (!opts.as && todo.some(isStudioVideo)) throw new Error("Les vidéos des cas pratiques passent par Le Studio : ajoute --as=<email>.");
  if (!opts.as && !opts.rerender && todo.some((s) => s.page && s.prompt)) throw new Error("Les pages web passent par Claude du Studio : ajoute --as=<email> (ou --rerender).");

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  await ensureBucket(supabase);

  let studioCtx = null;
  if (opts.as) {
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error("VITE_SUPABASE_ANON_KEY manquante dans .env.");
    studioCtx = await openStudioSession(supabaseUrl, anonKey, supabase, opts.as);
    const { data: profile } = await supabase.from("profiles").select("spent_usd, ai_budget_usd").eq("id", studioCtx.userId).single();
    console.log(`Mode Studio : compte ${opts.as}${profile ? ` — budget IA ${Number(profile.spent_usd ?? 0).toFixed(2)} $ / ${Number(profile.ai_budget_usd ?? 0).toFixed(2)} $` : ""}`);
  }
  const publicUrl = (key, ext) => `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${key}.${ext}`;

  let spent = 0;
  const failures = [];

  // Une image de référence / de départ doit déjà être en ligne.
  const dependencyUrl = (key) => {
    if (!key) return undefined;
    const entry = manifest[key];
    if (!entry) throw new Error(`image ${key} absente — génère-la d'abord`);
    // ?v= : sans lui, le CDN Supabase peut resservir l'ancienne version d'une
    // photo de départ qu'on vient de régénérer (même chemin).
    return `${publicUrl(key, entry.ext)}?v=${entry.v}`;
  };

  // Navigateur headless ouvert seulement s'il y a des pages à filmer.
  const recorder = todo.some((s) => s.page) ? await openPageRecorder() : null;

  const storedHtml = async (key) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(`${key}.html`);
    if (error || !data) throw new Error(`code HTML absent (${key}.html) — génère d'abord la page sans --rerender`);
    return data.text();
  };

  const renderPage = async (spec) => {
    const htmlPath = `${spec.key}.html`;
    let html;
    if (spec.pageFrom && !spec.prompt) {
      // Capture fixe d'une page déjà générée : pas d'appel à Claude.
      html = await storedHtml(spec.pageFrom);
    } else if (opts.rerender) {
      html = await storedHtml(spec.key);
    } else {
      html = spec.pageFrom
        ? await retouchViaStudio(studioCtx, spec, await storedHtml(spec.pageFrom))
        : await generatePageViaStudio(studioCtx, spec);
      const { error } = await supabase.storage.from(BUCKET).upload(htmlPath, Buffer.from(html), { contentType: "text/plain;charset=utf-8", upsert: true });
      if (error) throw new Error(`upload du HTML : ${error.message}`);
    }
    return spec.kind === "video"
      ? { body: await recorder.record(html), contentType: "video/mp4" }
      : { body: await recorder.screenshot(html), contentType: "image/jpeg" };
  };

  const handleSpec = async (spec) => {
    const label = `${icon(spec)} ${spec.key}`;
    try {
      let body;
      let contentType;
      let result = { cost: 0 };
      if (spec.page) {
        ({ body, contentType } = await renderPage(spec));
      } else {
        result = spec.kind === "image"
          ? (studioCtx
            ? await generateViaStudio(studioCtx, spec, dependencyUrl(spec.sourceKey))
            : await generateImage(apiKey, spec, dependencyUrl(spec.sourceKey), studio))
          : isStudioVideo(spec)
            ? await generateVideoViaStudio(studioCtx, spec, dependencyUrl(spec.sourceKey))
            : await generateVideo(apiKey, spec, dependencyUrl(spec.startKey));
        const file = await fetch(result.url);
        if (!file.ok) throw new Error(`téléchargement impossible (HTTP ${file.status})`);
        body = Buffer.from(await file.arrayBuffer());
        contentType = sniffType(body, (file.headers.get("content-type") ?? "").split(";")[0].trim());
      }
      const ext = EXT_BY_TYPE[contentType];
      if (!ext) throw new Error(`format reçu inattendu : ${contentType}`);
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

  // Les dépendances d'abord : images seules, puis Image-to-Image, puis vidéos,
  // puis pages web (Claude en parallèle, captures une par une).
  try {
    await runPool(todo.filter((s) => kindOf(s) === "image" && !s.sourceKey), opts.concurrency, handleSpec);
    await runPool(todo.filter((s) => kindOf(s) === "image" && s.sourceKey), opts.concurrency, handleSpec);
    await runPool(todo.filter((s) => kindOf(s) === "video"), opts.concurrency, handleSpec);
    await runPool(todo.filter((s) => kindOf(s) === "page" && !s.pageFrom), opts.concurrency, handleSpec);
    await runPool(todo.filter((s) => kindOf(s) === "page" && s.pageFrom), opts.concurrency, handleSpec);
  } finally {
    await recorder?.close();
  }

  console.log(studioCtx
    ? `\nTerminé : ${todo.length - failures.length}/${todo.length} réussis (coût décompté du budget IA de ${opts.as}).`
    : `\nTerminé : ${todo.length - failures.length}/${todo.length} réussis, ${spent.toFixed(2)} $ dépensés (selon Runware).`);
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
