// Étape 2 : anime Raul uniquement sur les scènes où il est visible (avatar plein
// cadre ou en médaillon), en synchronisant ses lèvres sur la voix off de l'étape 1.
// Les scènes « avatar absent » ne coûtent rien : seule leur voix est utilisée.
//
//   node scripts/heygen-avatar.mjs <nom> [--dry-run]
//
// Écrit public/generated/<nom>/avatar-<id>.mp4 et complète src/generated/<nom>.json.
import { readFileSync, writeFileSync, existsSync, openAsBlob } from "node:fs";
import { hg, download, balance, LOOK_RAUL } from "./heygen-lib.mjs";

const [name, flag] = process.argv.slice(2);
if (!name) { console.error("Usage : node scripts/heygen-avatar.mjs <nom> [--dry-run]"); process.exit(1); }
const dry = flag === "--dry-run";
const COST_PER_SEC = 1.4 / 14.52; // mesuré sur le test du 11/11/2026 (Avatar 6, 1080p)

const manifestPath = `src/generated/${name}.json`;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const todo = manifest.scenes.filter((s) => s.avatar !== "none" && !(s.avatarVideo && existsSync(`public/${s.avatarVideo}`)));
const secs = todo.reduce((a, s) => a + s.duration, 0);
console.log(`${todo.length} scène(s) à animer, ${secs.toFixed(1)} s, coût estimé ${(secs * COST_PER_SEC).toFixed(2)} $`);
if (dry || todo.length === 0) process.exit(0);

const before = await balance();
const save = () => writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Lance tous les rendus, puis attend.
const jobs = [];
for (const s of todo) {
  const form = new FormData();
  form.append("file", await openAsBlob(`public/${s.audio}`, { type: "audio/wav" }), `${name}-scene-${s.id}.wav`);
  const asset = await hg("/v3/assets", { method: "POST", form });
  const v = await hg("/v3/videos", {
    method: "POST",
    headers: { "Idempotency-Key": `${name}-scene-${s.id}-${s.text.length}-v1` },
    body: {
      type: "avatar", title: `RS6776 ${name} scène ${s.id}`, avatar_id: LOOK_RAUL,
      audio_asset_id: asset.asset_id, engine: { type: "heygen-avatar-6" }, resolution: "1080p", aspect_ratio: "16:9",
    },
  });
  console.log(`> scène ${s.id} : rendu ${v.video_id}`);
  jobs.push({ s, id: v.video_id });
}
for (const { s, id } of jobs) {
  for (let i = 0; ; i++) {
    const v = await hg(`/v3/videos/${id}`);
    if (v.status === "completed") {
      const file = `generated/${name}/avatar-${s.id}.mp4`;
      await download(v.video_url, `public/${file}`);
      Object.assign(s, { avatarVideo: file, avatarVideoId: id, avatarDuration: v.duration });
      save();
      console.log(`✓ scène ${s.id} (${v.duration} s)`);
      break;
    }
    if (v.status === "failed") throw new Error(`Scène ${s.id} : échec ${JSON.stringify(v).slice(0, 300)}`);
    if (i > 90) throw new Error(`Scène ${s.id} : délai dépassé`);
    await new Promise((r) => setTimeout(r, 15000));
  }
}
const after = await balance();
console.log(`Solde HeyGen : ${before} $ → ${after} $ (coût réel ${(before - after).toFixed(2)} $)`);
