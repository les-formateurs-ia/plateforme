// Images de contrôle d'une vidéo RS6776 : une image aux 3/4 de chaque scène sans avatar.
//   node scripts/stills-rs6776.mjs lesson3_1-commune RS6776-3-1-Commune
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const [name, comp] = process.argv.slice(2);
const m = JSON.parse(readFileSync(`src/generated/${name}.json`, "utf8"));
let t = 0.6; const times = [];
for (const s of m.scenes) { if (s.avatar === "none") times.push((t + s.duration * 0.75).toFixed(1)); t += s.duration + 0.45; }
execFileSync("node", ["scripts/stills.mjs", comp, `out/stills-${name}`, ...times], { stdio: "inherit" });
