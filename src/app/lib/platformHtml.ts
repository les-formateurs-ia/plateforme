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

// Utilisé pour le contenu "Cours" d'une leçon (LessonPage.tsx) : rendu dans une iframe
// sandboxée comme le Playground (le formateur garde ses <style>/<script> intacts), mais sans
// hauteur fixe ni scroll propre — l'iframe doit épouser la hauteur de son contenu pour que
// seul le scroll de la page reste actif. Sans allow-same-origin, le parent ne peut pas lire
// contentDocument depuis l'extérieur : on fait mesurer la hauteur par l'iframe elle-même et la
// faire remonter via postMessage. On neutralise aussi le fond blanc par défaut d'un document
// HTML autonome, pour qu'il se fonde dans le thème sombre/clair de la plateforme (un
// <style>/background posé par le formateur passe après dans la cascade et prend le dessus).
export function injectAutoResize(html: string): string {
  const extras = `<style>html,body{margin:0;background:transparent;}</style>
<script>(function(){
  function post(){
    var h = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    parent.postMessage({ __autoResizeHeight: h }, "*");
  }
  if (window.ResizeObserver) new ResizeObserver(post).observe(document.documentElement);
  window.addEventListener("load", post);
  document.addEventListener("DOMContentLoaded", post);
  setTimeout(post, 50); setTimeout(post, 300); setTimeout(post, 1000);
})();</script>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${extras}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}\n${extras}`);
  return extras + html;
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
