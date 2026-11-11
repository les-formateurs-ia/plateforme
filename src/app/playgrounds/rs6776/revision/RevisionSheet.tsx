import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Accessibility, AlertTriangle, BookOpen, Briefcase, Calendar, Check, CheckCircle2, Eye, FileText, Gauge, GraduationCap,
  Image as ImageIcon, Layers, ListChecks, Lock, MessageSquare, PenLine, Scale, ScanText, Search, Shield, Sparkles, Target,
  Users, Wand2, X,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Hero, Tile, ProgressRing, IrisNumber, alpha, celebrate } from "@/app/playgrounds/ui";
import { ModTools, ModTest } from "../Lecon11Revision";
import type { Block, IconName, RevisionData, RevisionModule, Tint } from "./types";

// Fiche de révision générique des leçons RS6776 : même tableau de bord que la
// leçon 1.1 (bandeau à particules, tuiles colorées, anneau de progression),
// alimenté par un fichier de contenu par leçon (revision/lXY.ts).

export const TINT: Record<Tint, string> = { violet: "#b58de0", bleu: "#78d5e2", vert: "#6adeb1", corail: "#fbc2ad", mauve: "#dbacf0" };
const ICONS: Record<IconName, typeof Sparkles> = {
  sparkles: Sparkles, layers: Layers, scan: ScanText, alert: AlertTriangle, target: Target, graduation: GraduationCap, check: Check,
  briefcase: Briefcase, shield: Shield, lock: Lock, eye: Eye, file: FileText, list: ListChecks, calendar: Calendar, users: Users,
  wand: Wand2, image: ImageIcon, scale: Scale, search: Search, message: MessageSquare, gauge: Gauge, accessibility: Accessibility,
  book: BookOpen, pen: PenLine,
};

export function RevisionSheet({ data, profile }: { data: RevisionData; profile?: string }) {
  const th = useTh();
  const modules = useMemo(() => {
    const extra = profile ? data.profiles?.[profile] : undefined;
    const exam: RevisionModule = { id: "__exam", title: "Pour l'écrit", teaser: `Exercice ${data.exam.exercise} : ${data.exam.label}`, tint: "violet", icon: "graduation", blocks: [] };
    const test: RevisionModule = { id: "__test", title: "Testez-vous", teaser: `${data.flashcards.length} cartes, révélez et évaluez-vous.`, tint: "bleu", icon: "check", blocks: [] };
    const base = [...data.modules];
    if (extra) base.splice(Math.min(4, base.length), 0, extra);
    return [...base, exam, test];
  }, [data, profile]);
  const [open, setOpen] = useState<string | null>(null);
  const [explored, setExplored] = useState<Set<string>>(new Set());
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) focusRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [open]);
  const select = (id: string) => { setOpen((c) => (c === id ? null : id)); if (id !== "__test") setExplored((s) => new Set(s).add(id)); };
  const current = modules.find((m) => m.id === open);
  // Grille de 4 colonnes : une tuile large seulement si elle remplit la dernière ligne.
  const wideOk = (modules.length + modules.filter((m) => m.wide).length) % 4 === 0;

  const [before, after] = data.highlight && data.title.includes(data.highlight) ? data.title.split(data.highlight) : [data.title, ""];

  return (
    <div className="flex flex-col gap-5">
      <Hero>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:pr-24">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Fiche de révision · Leçon {data.lesson}</p>
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-5" style={{ color: th.fg }}>
              {before}{data.highlight && <span className="hl">{data.highlight}</span>}{after}
            </h2>
            <ol className="grid md:grid-cols-3 gap-4">
              {data.keyPoints.map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <IrisNumber n={i + 1} />
                  <span><span className="block text-sm font-semibold" style={{ color: th.fg }}>{t}</span><span className="text-xs" style={{ color: th.fg2 }}>{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing value={explored.size / modules.length} label="exploré" />
            <p className="text-xs max-w-[16ch]" style={{ color: th.fg2 }}>{explored.size} module{explored.size > 1 ? "s" : ""} sur {modules.length}. Dans l'ordre que vous voulez.</p>
          </div>
        </div>
      </Hero>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="group" aria-label="Modules de la fiche">
        {modules.map((m) => {
          const tint = TINT[m.tint];
          const Icon = ICONS[m.icon] ?? Sparkles;
          return (
            <Tile key={m.id} tint={tint} onClick={() => select(m.id)} selected={open === m.id} done={explored.has(m.id)} label={m.title} className={`p-4 min-h-[128px] ${m.wide && wideOk ? "col-span-2" : ""}`}>
              <span className="flex h-full flex-col">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: alpha(tint, 0.25), border: `1px solid ${alpha(tint, 0.6)}` }}><Icon className="w-4 h-4" style={{ color: th.fg }} aria-hidden /></span>
                <span className="text-sm font-semibold" style={{ color: th.fg }}>{m.title}</span>
                <span className="text-xs mt-0.5" style={{ color: th.fg2 }}>{m.teaser}</span>
              </span>
            </Tile>
          );
        })}
      </div>

      <div ref={focusRef} className="scroll-mt-24">
        {current ? (
          <div key={current.id} className="pg-pop rounded-[14px] p-6 relative overflow-hidden" style={{ background: `linear-gradient(170deg, ${alpha(TINT[current.tint], th.isDark ? 0.14 : 0.1)}, ${th.card} 45%)`, border: `1px solid ${alpha(TINT[current.tint], 0.6)}` }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <h3 className="text-lg font-semibold" style={{ color: th.fg }}>{current.title}</h3>
              <button onClick={() => setOpen(null)} aria-label="Fermer le module" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}><X className="w-4 h-4" /></button>
            </div>
            {current.id === "__exam" ? <Exam data={data} /> : current.id === "__test" ? (
              <ModTest cards={data.flashcards} onDone={() => setExplored((s) => new Set(s).add("__test"))} />
            ) : (
              <div className="flex flex-col gap-5">{current.blocks.map((b, i) => <BlockView key={i} b={b} tint={TINT[current.tint]} />)}</div>
            )}
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: th.fg3 }}>Choisissez un module pour l'ouvrir.</p>
        )}
      </div>
    </div>
  );
}

/* ================= Blocs ================= */

function rich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
}

function BlockView({ b, tint }: { b: Block; tint: string }) {
  const th = useTh();
  const card = (t: string, children: ReactNode, key?: string) => (
    <div key={key} className="rounded-[10px] p-4" style={{ background: alpha(t, th.isDark ? 0.1 : 0.12), border: `1px solid ${alpha(t, 0.6)}` }}>{children}</div>
  );
  switch (b.type) {
    case "text":
      return <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>{rich(b.text)}</p>;
    case "rule":
      return <p className="rounded-[10px] px-4 py-3 text-sm font-semibold" style={{ background: alpha(tint, th.isDark ? 0.12 : 0.16), borderLeft: `3px solid ${tint}`, color: th.fg }}>{rich(b.text)}</p>;
    case "cards":
      return (
        <div className={`grid gap-3 ${b.items.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {b.items.map((it) => {
            const t = it.tint ? TINT[it.tint] : tint;
            const Icon = it.icon ? ICONS[it.icon] : null;
            return card(t, <>
              <p className="flex items-center gap-2 text-sm font-semibold mb-1" style={{ color: th.fg }}>{Icon && <Icon className="w-4 h-4" aria-hidden />}{it.title}</p>
              <p className="text-sm" style={{ color: th.fg2 }}>{rich(it.text)}</p>
            </>, it.title);
          })}
        </div>
      );
    case "flip":
      return <div className={`grid gap-3 ${b.items.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>{b.items.map((it, i) => <Flip key={it.title} it={it} tint={Object.values(TINT)[i % 5]} />)}</div>;
    case "compare":
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          {[b.left, b.right].map((c, i) => {
            const col = b.tone ? (i === 0 ? th.success : th.danger) : i === 0 ? TINT.bleu : TINT.violet;
            return (
              <div key={c.title} className="rounded-[10px] p-4" style={{ border: `1px solid ${col}`, background: alpha(b.tone ? (i === 0 ? "#6adeb1" : "#fbc2ad") : i === 0 ? TINT.bleu : TINT.violet, th.isDark ? 0.08 : 0.1) }}>
                <p className="text-sm font-semibold mb-1" style={{ color: b.tone ? col : th.fg }}>{c.title}</p>
                <p className="text-sm" style={{ color: th.fg2 }}>{rich(c.text)}</p>
              </div>
            );
          })}
        </div>
      );
    case "steps":
      return (
        <ol className={`grid gap-3 ${b.items.length >= 4 ? "md:grid-cols-4" : b.items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {b.items.map((s, i) => (
            <li key={s.title} className="rounded-[10px] p-4" style={{ border: `1px solid ${th.sep}` }}>
              <IrisNumber n={i + 1} />
              <p className="text-sm font-semibold mt-2" style={{ color: th.fg }}>{s.title}</p>
              {s.text && <p className="text-sm mt-1" style={{ color: th.fg2 }}>{rich(s.text)}</p>}
            </li>
          ))}
        </ol>
      );
    case "checklist":
      return <Checklist title={b.title} items={b.items} tint={tint} />;
    case "beforeAfter":
      return (
        <div>
          {b.label && <p className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{b.label}</p>}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-[10px] p-4" style={{ border: `1px solid ${th.danger}` }}>
              <p className="text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: th.danger }}>{b.beforeTag ?? "Avant"}</p>
              <p className="text-sm whitespace-pre-line" style={{ color: th.fg }}>{b.before}</p>
            </div>
            <div className="rounded-[10px] p-4" style={{ border: `1px solid ${th.success}`, background: alpha("#6adeb1", th.isDark ? 0.08 : 0.1) }}>
              <p className="text-[10.5px] font-bold uppercase tracking-widest mb-1.5" style={{ color: th.success }}>{b.afterTag ?? "Après"}</p>
              <p className="text-sm whitespace-pre-line" style={{ color: th.fg }}>{b.after}</p>
            </div>
          </div>
        </div>
      );
    case "example":
      return (
        <div className="relative rounded-[10px] p-4 pt-5" style={{ border: `1px solid ${b.danger === false ? th.success : th.danger}` }}>
          {b.stamp && <span className="absolute -top-2.5 right-3 rounded-full px-2 text-[10px] font-bold uppercase tracking-widest" style={{ background: b.danger === false ? th.success : th.danger, color: th.onInk }}>{b.stamp}</span>}
          {b.label && <p className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{b.label}</p>}
          {b.lines.map((l, i) => <p key={i} className="text-sm" style={{ color: th.fg }}>{l}</p>)}
          {b.note && <p className="text-xs mt-2" style={{ color: th.fg3 }}>{b.note}</p>}
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-[10px]" style={{ border: `1px solid ${th.sep}` }}>
          <table className="w-full text-sm">
            {b.caption && <caption className="text-left text-[10.5px] font-bold uppercase tracking-widest p-3" style={{ color: th.fg3 }}>{b.caption}</caption>}
            <thead><tr style={{ background: alpha(tint, 0.15) }}>{b.headers.map((h) => <th key={h} scope="col" className="text-left px-3 py-2 text-[11px] uppercase tracking-widest" style={{ color: th.fg }}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i} style={{ borderTop: `1px solid ${th.sep}` }}>{r.map((c, j) => <td key={j} className="px-3 py-2 align-top" style={{ color: j === 0 ? th.fg : th.fg2 }}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case "sort":
      return <Sorter b={b} />;
    case "choice":
      return <Choice b={b} />;
    case "tools":
      return <ModTools />;
  }
}

function Flip({ it, tint }: { it: { title: string; front: string; back: string; icon?: IconName }; tint: string }) {
  const th = useTh();
  const [f, setF] = useState(false);
  const Icon = it.icon ? ICONS[it.icon] : Sparkles;
  return (
    <button onClick={() => setF((v) => !v)} aria-pressed={f} className="text-left rounded-[12px] p-4 h-full transition-colors"
      style={{ background: f ? `linear-gradient(150deg, ${alpha(tint, 0.85)}, ${alpha(tint, 0.45)})` : alpha(tint, th.isDark ? 0.1 : 0.12), border: `1px solid ${alpha(tint, 0.7)}`, color: f ? "#111" : th.fg }}>
      <span className="flex items-center gap-2 text-sm font-semibold mb-2"><Icon className="w-4 h-4" aria-hidden />{it.title}</span>
      <span className="block text-sm" style={{ opacity: 0.85 }}>{f ? it.back : it.front}</span>
      <span className="block text-[11px] font-semibold mt-3" style={{ opacity: 0.6 }}>{f ? "← La définition" : "Ce que ça change pour vous →"}</span>
    </button>
  );
}

function Checklist({ title, items, tint }: { title?: string; items: string[]; tint: string }) {
  const th = useTh();
  const [c, setC] = useState(() => items.map(() => false));
  const ref = useRef<HTMLDivElement>(null);
  const toggle = (i: number) => {
    const next = c.map((v, j) => (j === i ? !v : v));
    if (next.every(Boolean) && !c.every(Boolean)) celebrate(ref.current, 0.8);
    setC(next);
  };
  return (
    <div ref={ref}>
      {title && <p className="text-[10.5px] font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{title}</p>}
      <div className="flex flex-col gap-2">
        {items.map((r, i) => (
          <button key={r} onClick={() => toggle(i)} aria-pressed={c[i]} className="flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm"
            style={{ border: `1px solid ${c[i] ? alpha(tint, 0.9) : th.sep}`, background: c[i] ? alpha(tint, 0.15) : "transparent", color: th.fg }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: c[i] ? "var(--grad-iris)" : "transparent", border: c[i] ? "none" : `1px solid ${th.fg3}` }}>{c[i] && <Check className="w-3 h-3" color="#111" />}</span>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

function Sorter({ b }: { b: Extract<Block, { type: "sort" }> }) {
  const th = useTh();
  const [picks, setPicks] = useState<Record<number, string>>({});
  const ref = useRef<HTMLDivElement>(null);
  const done = Object.keys(picks).length === b.items.length;
  const score = b.items.filter((it, i) => picks[i] === it.answer).length;
  const pick = (i: number, cat: string) => {
    const next = { ...picks, [i]: cat };
    setPicks(next);
    if (Object.keys(next).length === b.items.length && b.items.every((it, k) => next[k] === it.answer)) celebrate(ref.current, 0.8);
  };
  const cols = Object.values(TINT);
  return (
    <div ref={ref}>
      <p className="text-sm mb-3" style={{ color: th.fg2 }}>{b.prompt}</p>
      <div className="flex flex-col gap-2">
        {b.items.map((it, i) => {
          const p = picks[i];
          return (
            <div key={it.text} className="rounded-[10px] p-3" style={{ border: `1px solid ${p ? (p === it.answer ? th.success : th.danger) : th.sep}` }}>
              <p className="text-sm mb-2" style={{ color: th.fg }}>{it.text}</p>
              <div className="flex flex-wrap gap-2">
                {b.categories.map((cat, k) => {
                  const chosen = p === cat;
                  const good = p && cat === it.answer;
                  return (
                    <button key={cat} disabled={!!p} onClick={() => pick(i, cat)} className="rounded-full px-3 py-1 text-xs font-semibold disabled:cursor-default"
                      style={good ? { background: th.success, color: th.onInk } : chosen ? { background: th.danger, color: th.onInk } : { border: `1px solid ${alpha(cols[k % 5], 0.8)}`, background: alpha(cols[k % 5], 0.12), color: th.fg }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
              {p && it.why && <p className="text-xs mt-2" style={{ color: th.fg2 }}>{it.why}</p>}
            </div>
          );
        })}
      </div>
      {done && <p className="mt-3 text-sm font-semibold" style={{ color: th.fg }}><CheckCircle2 className="inline w-4 h-4 mr-1" />{score} sur {b.items.length}</p>}
    </div>
  );
}

function Choice({ b }: { b: Extract<Block, { type: "choice" }> }) {
  const th = useTh();
  const [p, setP] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <p className="text-sm font-semibold mb-3" style={{ color: th.fg }}>{b.question}</p>
      <div className="flex flex-col gap-2">
        {b.options.map((o, i) => {
          const shown = p !== null;
          const col = shown && o.correct ? th.success : shown && p === i ? th.danger : th.sep;
          return (
            <button key={o.label} disabled={shown} onClick={() => { setP(i); if (o.correct) celebrate(ref.current, 0.6); }} className="text-left rounded-[8px] px-3 py-2 text-sm disabled:cursor-default" style={{ border: `1px solid ${col}`, color: th.fg }}>
              {o.label}
              {shown && (o.correct || p === i) && o.why && <span className="block text-xs mt-1" style={{ color: th.fg2 }}>{o.why}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Exam({ data }: { data: RevisionData }) {
  const th = useTh();
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: th.fg2 }}>Cette leçon prépare l'<strong style={{ color: th.fg }}>exercice {data.exam.exercise}</strong> de l'écrit : {data.exam.label}.</p>
      <BlockView b={{ type: "steps", items: data.exam.steps.map((t) => ({ title: t })) }} tint={TINT.violet} />
      {data.exam.table && <BlockView b={{ type: "table", caption: "Exemple fictif", headers: data.exam.table.headers, rows: [data.exam.table.row] }} tint={TINT.violet} />}
    </div>
  );
}
