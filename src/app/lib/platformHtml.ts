// Partagé entre le Playground d'une leçon (LessonPage.tsx) et l'exercice
// "Exercices pour vous" (Pratique IA) — même mécanique : un HTML collé par
// l'utilisateur tourne dans une iframe sandboxée sans allow-same-origin, donc
// sans accès à la session Supabase du site principal. On lui injecte
// explicitement son propre jeton via window.__PLATFORM_AUTH__ pour qu'il
// puisse appeler la fonction proxy `ai-proxy` (qui garde la clé Gemini côté
// serveur) en son nom, sans jamais détenir de clé lui-même.
export function injectPlatformAuth(html: string, accessToken: string): string {
  const payload = JSON.stringify({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    accessToken,
  }).replace(/</g, "\\u003c");
  const script = `<script>window.__PLATFORM_AUTH__=${payload};</script>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${script}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}\n${script}`);
  return script + html;
}

// Word (et donc l'autocorrection dans les .docx) remplace souvent les guillemets
// droits par des guillemets typographiques et "--" par un tiret cadratin — ce qui
// casse la syntaxe des attributs HTML (class="foo" devient class="foo" avec des
// guillemets incompatibles). On les remet en droits par sécurité après extraction.
export function normalizeSmartQuotes(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, "-");
}
