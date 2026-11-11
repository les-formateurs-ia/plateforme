// Outils partagés par les scripts HeyGen de production des vidéos de leçon.
// La clé est lue dans HEYGEN_API_KEY (jamais écrite dans le dépôt).
import { readFileSync } from "node:fs";

export const API = "https://api.heygen.com";
export const VOICE_TANGUY = "341b4807e5e6455fa88f34bda5d6eeea"; // voir docs/formation-rs6776/bible.md
export const LOOK_RAUL = "Raul_sitting_office_front";

export function apiKey() {
  const k = process.env.HEYGEN_API_KEY;
  if (!k) throw new Error("HEYGEN_API_KEY manquante (export HEYGEN_API_KEY=...)");
  return k;
}

export async function hg(path, { method = "GET", body, headers = {}, form } = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try {
      res = await fetch(API + path, {
        method,
        headers: { "X-Api-Key": apiKey(), ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
        body: form ?? (body ? JSON.stringify(body) : undefined),
      });
    } catch (e) {
      // Coupure réseau passagère (EPIPE, ECONNRESET…) : on réessaie.
      console.warn(`  réseau indisponible sur ${path} (${e.cause?.code ?? e.message}), nouvel essai`);
      await new Promise((r) => setTimeout(r, 2 ** attempt * 2000));
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get("retry-after")) || 2 ** attempt * 2;
      console.warn(`  ${res.status} sur ${path}, nouvel essai dans ${wait}s`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
    return json.data ?? json;
  }
  throw new Error(`${method} ${path} : trop d'essais`);
}

export async function download(url, dest) {
  const { writeFileSync } = await import("node:fs");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement ${url} → ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

export async function balance() {
  const me = await hg("/v3/users/me");
  return me.wallet?.remaining_balance ?? null;
}

// Découpe un script de vidéo (docs/formation-rs6776/lecon-X/script-*.md) en scènes.
// Une scène = un titre « ### Scène N — Titre (…) · avatar plein cadre|absent|en médaillon ».
// La voix off = les paragraphes qui commencent par « et ne sont pas des libellés
// d'habillage (les libellés contiennent « · »).
export function parseScript(mdPath) {
  const md = readFileSync(mdPath, "utf8");
  const parts = md.split(/^### /m).slice(1);
  const scenes = [];
  for (const part of parts) {
    const [heading, ...rest] = part.split("\n");
    const m = /^Scène\s+([0-9]+[a-z]?)\s+—\s+(.*?)\s*(?:\(bloc [A-E]\))?\s*·\s*avatar\s+(plein cadre|absent|en médaillon)/i.exec(heading);
    if (!m) continue;
    const body = rest.join("\n").split(/\n---\n/)[0];
    const paras = body.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.startsWith("«") && !p.includes(" · "));
    const text = paras
      .map((p) => p.replace(/^«\s*/, "").replace(/\s*»$/, "").replace(/\s*\n\s*/g, " "))
      .join(" ")
      .trim();
    if (!text) continue;
    const avatar = m[3].toLowerCase() === "plein cadre" ? "full" : m[3].toLowerCase() === "absent" ? "none" : "pip";
    scenes.push({ id: m[1], title: m[2].trim(), avatar, text });
  }
  return scenes;
}

// Regroupe les horodatages par caractère de HeyGen en horodatages par mot.
export function wordsFromChars(chars) {
  const words = [];
  let cur = null;
  for (const c of chars) {
    if (/\s/.test(c.text)) { if (cur) { words.push(cur); cur = null; } continue; }
    if (!cur) cur = { w: "", start: c.start_time, end: c.end_time };
    cur.w += c.text;
    cur.end = c.end_time;
  }
  if (cur) words.push(cur);
  return words.map((w) => ({ ...w, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
}
