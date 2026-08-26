export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// admin & formateur ont les mêmes droits de génération IA — un étudiant ne
// doit pas pouvoir déclencher la génération de mindmap/vidéo avatar en
// appelant la fonction Edge directement (contourner un bouton masqué côté
// front ne suffit pas : la vérification doit vivre ici aussi).
export function isStaffRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "formateur";
}

// deno-lint-ignore no-explicit-any
export async function getCallerRole(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role ?? null;
}

// atob() + Array.from(str, charCodeAt) est très lent en V8 pour de grandes
// chaînes (des millions de caractères pour un podcast de plusieurs minutes) :
// Array.from passe par le protocole itérateur + un appel de fonction par
// caractère. Une boucle for classique écrivant dans un Uint8Array pré-alloué
// est nettement plus rapide et évite de dépasser le budget CPU de la fonction.
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function pcmToWav(pcmData: Uint8Array, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Uint8Array {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);
  return wavBytes;
}

// Le traitement d'un gros extrait audio (parse JSON + décodage base64) dépasse
// le quota CPU fixe de 2s des Edge Functions (indépendant du plan, indépendant
// du temps mur). Solution : découper le script en petits groupes de répliques,
// synthétiser et décoder chaque groupe dans un appel HTTP séparé (donc un
// budget CPU neuf à chaque fois), puis ne recoller que des octets déjà
// décodés (pas de re-parse JSON/base64, donc peu coûteux en CPU).
export function splitScriptIntoChunks(script: string, maxWordsPerChunk = 90): string[] {
  const lines = script.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;
  for (const line of lines) {
    const wordCount = line.split(/\s+/).length;
    if (current.length > 0 && currentWords + wordCount > maxWordsPerChunk) {
      chunks.push(current.join("\n"));
      current = [];
      currentWords = 0;
    }
    current.push(line);
    currentWords += wordCount;
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks;
}

export function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

export function runInBackground(promise: Promise<unknown>) {
  // @ts-ignore EdgeRuntime est fourni globalement par le runtime Supabase Edge Functions.
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore idem
    EdgeRuntime.waitUntil(promise);
  } else {
    void promise;
  }
}
