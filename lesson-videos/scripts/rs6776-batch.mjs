// Production en lot des vidéos RS6776, leçon par leçon, dans l'ordre :
//   avatar commune + Nathalie (payant) → rendu des deux MP4 → envoi dans l'aperçu Nathalie.
// Garde-fou : avant chaque leçon, compare le solde HeyGen au coût estimé (+15 %) et
// s'arrête proprement s'il ne suffit pas (code de sortie 3).
//
//   HEYGEN_API_KEY=… node scripts/rs6776-batch.mjs 1.2 1.3 …
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { balance } from "./heygen-lib.mjs";

const COST_PER_SEC = 1.4 / 14.52;
const root = fileURLToPath(new URL("../..", import.meta.url));
const run = (cmd, args, cwd = ".") => execFileSync(cmd, args, { cwd, stdio: "inherit" });
const missingAvatarSecs = (name) => {
  const m = JSON.parse(readFileSync(`src/generated/${name}.json`, "utf8"));
  return m.scenes.filter((s) => s.avatar !== "none" && !(s.avatarVideo && existsSync(`public/${s.avatarVideo}`))).reduce((a, s) => a + s.duration, 0);
};

for (const lesson of process.argv.slice(2)) {
  const k = lesson.replace(".", "_");
  const names = [`lesson${k}-commune`, `lesson${k}-nathalie`];
  const need = names.reduce((a, n) => a + missingAvatarSecs(n), 0) * COST_PER_SEC;
  const bal = await balance();
  console.log(`\n=== Leçon ${lesson} : avatar à produire ≈ ${need.toFixed(2)} $, solde ${bal} $`);
  if (need > 0 && bal < need * 1.15) {
    console.log(`SOLDE_INSUFFISANT avant la leçon ${lesson} (il faut ≈ ${(need * 1.15).toFixed(2)} $, solde ${bal} $).`);
    process.exit(3);
  }
  for (const n of names) run("node", ["scripts/heygen-avatar.mjs", n]);
  for (const [n, comp] of [[names[0], `RS6776-${lesson.replace(".", "-")}-Commune`], [names[1], `RS6776-${lesson.replace(".", "-")}-Nathalie`]]) {
    const outFile = `out/rs6776-${lesson.replace(".", "-")}-${n.split("-")[1]}.mp4`;
    if (existsSync(outFile) && process.env.RS6776_RERENDER !== "1") { console.log(`  ${outFile} déjà rendu`); continue; }
    run("npx", ["remotion", "render", comp, `out/rs6776-${lesson.replace(".", "-")}-${n.split("-")[1]}.mp4`, "--crf=18", "--log=error"]);
  }
  // Envoi dans l'aperçu, relancé en cas de coupure réseau (les vidéos déjà envoyées ne sont pas renvoyées).
  for (let attempt = 1; ; attempt++) {
    try { run("node", ["scripts/rs6776-fill-preview.mjs", lesson, "--apply", ...(attempt === 1 ? ["--replace-videos"] : [])], root); break; }
    catch (e) { if (attempt >= 4) throw e; console.log(`  nouvel essai d'envoi (${attempt})…`); await new Promise((r) => setTimeout(r, 15000 * attempt)); }
  }
  console.log(`=== Leçon ${lesson} terminée, solde ${await balance()} $`);
}
console.log("\nLOT_TERMINE");
