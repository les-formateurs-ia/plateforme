// Télécharge les benchmarks Artificial Analysis et écrit le snapshot local
// src/app/data/aiBenchmarks.snapshot.json, que le Hub IA utilise quand la
// table Supabase ai_benchmarks n'est pas disponible (dev local, ou avant la
// première synchronisation automatique).
//
// Pré-requis dans .env (jamais commité) :
//   ARTIFICIAL_ANALYSIS_API_KEY — clé gratuite (artificialanalysis.ai → API keys)
//
// Usage : npm run benchmarks:sync   (≈ 13 requêtes, quota gratuit 100 / 24 h)
//
// La logique (appels + mise en forme) est partagée avec la fonction Supabase
// sync-ai-benchmarks : supabase/functions/_shared/ai-benchmarks.ts.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fetchBenchmarkSnapshot } from "../supabase/functions/_shared/ai-benchmarks.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

function readEnvKey(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(`${root}.env`, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const apiKey = readEnvKey("ARTIFICIAL_ANALYSIS_API_KEY");
if (!apiKey) {
  console.error("ARTIFICIAL_ANALYSIS_API_KEY absente du .env.");
  process.exit(1);
}

const snapshot = await fetchBenchmarkSnapshot(apiKey);
const out = `${root}src/app/data/aiBenchmarks.snapshot.json`;
writeFileSync(out, `${JSON.stringify(snapshot)}\n`);

for (const board of Object.values(snapshot.boards)) {
  const top = board.entries[0];
  console.log(`${board.id.padEnd(22)} ${String(board.entries.length).padStart(4)} modèles · n°1 : ${top?.name} (${top?.score})`);
}
console.log(`\nSnapshot écrit : ${out}`);
