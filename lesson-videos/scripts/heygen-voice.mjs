// Étape 1 : voix off d'une vidéo de leçon, scène par scène, avec la voix Tanguy
// et l'horodatage de chaque mot (pour caler l'habillage Remotion).
//
//   node scripts/heygen-voice.mjs <script.md> <nom>        ex. lesson1_1-commune
//
// Écrit public/generated/<nom>/scene-<id>.wav (ignoré par Git) et
// src/generated/<nom>.json (manifeste : scènes, texte, durées, mots).
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { hg, download, parseScript, wordsFromChars, VOICE_TANGUY } from "./heygen-lib.mjs";

const [mdPath, name] = process.argv.slice(2);
if (!mdPath || !name) { console.error("Usage : node scripts/heygen-voice.mjs <script.md> <nom>"); process.exit(1); }

const MODEL = process.env.HEYGEN_TTS_MODEL || "heygen-voice-1-turbo-free";
const audioDir = `public/generated/${name}`;
const manifestPath = `src/generated/${name}.json`;
mkdirSync(audioDir, { recursive: true });
mkdirSync("src/generated", { recursive: true });

const scenes = parseScript(mdPath);
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { scenes: [] };
const out = [];
for (const s of scenes) {
  const file = `${audioDir}/scene-${s.id}.wav`;
  const old = previous.scenes.find((p) => p.id === s.id && p.text === s.text);
  if (old && existsSync(file)) { console.log(`= scène ${s.id} inchangée`); out.push(old); continue; }
  process.stdout.write(`> scène ${s.id} (${s.text.split(/\s+/).length} mots)… `);
  const r = await hg("/v3/models/audio/tts", {
    method: "POST",
    body: { model: MODEL, voice_id: VOICE_TANGUY, text: s.text, language: "fr", with_timestamps: true },
  });
  await download(r.audio_url, file);
  const words = wordsFromChars(r.original_characters ?? []);
  console.log(`${r.duration?.toFixed?.(2) ?? "?"} s`);
  out.push({ ...s, audio: `generated/${name}/scene-${s.id}.wav`, duration: r.duration, words });
}
const total = out.reduce((a, s) => a + (s.duration || 0), 0);
const avatarSec = out.filter((s) => s.avatar !== "none").reduce((a, s) => a + (s.duration || 0), 0);
writeFileSync(manifestPath, JSON.stringify({ name, source: mdPath, voice: VOICE_TANGUY, model: MODEL, total, avatarSeconds: avatarSec, scenes: out }, null, 2));
console.log(`\nDurée totale ${total.toFixed(1)} s · dont avatar visible ${avatarSec.toFixed(1)} s → ${manifestPath}`);
