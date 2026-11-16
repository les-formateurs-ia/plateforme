// Charge le contenu des Astuces IA (TypeScript pur) depuis Node, via esbuild
// (déjà présent avec Vite) : pas de duplication des prompts dans le script.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ENTRY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/app/data/astuces/index.ts");

// Catalogue des modèles du Studio (même fichier que l'edge function
// generate-studio-image) : les exemples sont générés avec exactement les
// mêmes paramètres Runware que ceux qu'obtiendra l'élève dans Le Studio.
const STUDIO_MODELS_ENTRY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/functions/_shared/studio-models.ts");

async function bundleAndImport(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
  const code = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

export const loadAstuces = () => bundleAndImport(ENTRY);
export const loadStudioModels = () => bundleAndImport(STUDIO_MODELS_ENTRY);
