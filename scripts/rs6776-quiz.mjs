// Lecture d'un quiz CSV (mêmes règles que l'import de quiz de l'éditeur de leçon) :
// colonnes question, reponse_1…, bonne_reponse (numéro ou texte), explication.
export function parseQuiz(text) {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const d = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows = []; let r = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === d) { r.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; r.push(f); f = ""; if (r.some((x) => x.trim())) rows.push(r); r = []; }
    else f += c;
  }
  if (f.length || r.length) { r.push(f); if (r.some((x) => x.trim())) rows.push(r); }
  const norm = (h) => h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
  const h = rows[0].map(norm);
  const qc = h.indexOf("question"), cc = h.findIndex((x) => ["bonne_reponse", "reponse_correcte", "correct", "correct_answer"].includes(x)), ec = h.findIndex((x) => ["explication", "explanation"].includes(x));
  const oc = h.map((x, i) => ({ x, i })).filter(({ x }) => /^(reponse|option)_?\d+$/.test(x)).sort((a, b) => parseInt(a.x.replace(/\D/g, "")) - parseInt(b.x.replace(/\D/g, ""))).map(({ i }) => i);
  const out = [];
  for (const cols of rows.slice(1)) {
    const question = (cols[qc] ?? "").trim(); if (!question) continue;
    const opts = oc.map((c) => (cols[c] ?? "").trim()).filter(Boolean); if (opts.length < 2) continue;
    const raw = (cols[cc] ?? "").trim();
    let k = /^\d+$/.test(raw) ? parseInt(raw) - 1 : -1;
    if (k < 0 || k >= opts.length) k = opts.findIndex((o) => o.toLowerCase() === raw.toLowerCase());
    if (k < 0) { console.warn(`  ! question ignorée (bonne réponse introuvable) : ${question.slice(0, 60)}`); continue; }
    out.push({ question, explanation: ec >= 0 ? (cols[ec] ?? "").trim() : "", options: opts.map((label, i) => ({ label, is_correct: i === k })) });
  }
  return out;
}
