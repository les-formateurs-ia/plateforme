// Rend quelques images fixes d'une composition pour contrôle visuel rapide.
// Usage : node scripts/stills.mjs <compositionId> <dossierSortie> <t1> <t2> ...  (temps en secondes)
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [, , id, outDir, ...times] = process.argv;
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });

for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(t) * composition.fps));
  const output = path.join(outDir, `t${String(t).replace(".", "_")}.jpg`);
  await renderStill({ composition, serveUrl, frame, output, imageFormat: "jpeg", jpegQuality: 85 });
  console.log(output);
}
