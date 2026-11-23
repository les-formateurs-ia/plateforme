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

// Modèles de chat du Studio (cas Web : la page d'exemple est écrite par Claude).
const STUDIO_CHAT_MODELS_ENTRY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/functions/_shared/studio-chat-models.ts");
export const loadStudioChatModels = () => bundleAndImport(STUDIO_CHAT_MODELS_ENTRY);

// Modèles vidéo du Studio (cas Vidéo : exemples générés dans « Créer vos vidéos »).
const STUDIO_VIDEO_MODELS_ENTRY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/functions/_shared/studio-video-models.ts");
export const loadStudioVideoModels = () => bundleAndImport(STUDIO_VIDEO_MODELS_ENTRY);

// Guide « Comprendre les outils » (ChatGPT, Claude, Gemini).
const GUIDE_OUTILS_ENTRY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/app/data/guide-outils/index.ts");
export const loadGuideOutils = () => bundleAndImport(GUIDE_OUTILS_ENTRY);
