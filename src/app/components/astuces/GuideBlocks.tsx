import { Fragment, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, Check, ChevronDown, CircleAlert, Cpu, Eye, Info, KeyRound, Lightbulb, RotateCcw, Sparkles, User, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { PromptBlock } from "@/app/components/astuces/PromptBlock";
import { tintAt } from "@/app/components/astuces/shared";
import { cx } from "@/app/lib/cx";
import type { Block, CalloutTone } from "@/app/data/guide-outils/types";

// Texte en ligne : **gras** et `code`.
export function Inline({ text }: { text: string }) {
  const th = useTh();
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-bold" style={{ color: th.fg }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`")) {
          return <code key={i} className="px-1 py-0.5 rounded-[3px] text-[0.9em] font-mono" style={{ background: th.gradShadow(th.isDark ? 0.12 : 0.05), color: th.fg }}>{p.slice(1, -1)}</code>;
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function BlockTitle({ children }: { children: ReactNode }) {
  const th = useTh();
  return <h2 className="text-[1.2rem] sm:text-[1.35rem] font-black leading-tight mb-4" style={{ color: th.fg }}>{children}</h2>;
}

const CALLOUT_ICONS: Record<CalloutTone, typeof Info> = { tip: Lightbulb, warning: CircleAlert, info: Info, key: KeyRound };

function Callout({ tone, title, text }: { tone: CalloutTone; title: string; text: string }) {
  const th = useTh();
  const color = { tip: th.success, warning: th.danger, info: th.info, key: th.warn }[tone];
  const Icon = CALLOUT_ICONS[tone];
  return (
    <div className="rounded-[10px] p-4 sm:p-5 flex gap-3" style={{ background: `${color}${th.isDark ? "1f" : "12"}`, borderLeft: `3px solid ${color}` }}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
      <div>
        <p className="text-[15px] font-black" style={{ color: th.fg }}>{title}</p>
        <p className="mt-1 text-[14px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={text} /></p>
      </div>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  const th = useTh();
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setDone((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });
  return (
    <GCard className="p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-base font-black" style={{ color: th.fg }}>{title}</p>
        <span className="text-xs font-semibold tabular-nums" style={{ color: done.size === items.length ? th.success : th.fg3 }}>{done.size} / {items.length}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => {
          const on = done.has(i);
          return (
            <li key={i}>
              <button type="button" onClick={() => toggle(i)} aria-pressed={on} className="w-full text-left flex items-start gap-3 rounded-[6px] px-2 py-2 transition-colors hover:opacity-80">
                <span className="mt-0.5 w-5 h-5 shrink-0 rounded-[4px] flex items-center justify-center" style={{ border: `1.5px solid ${on ? th.success : th.inputB}`, background: on ? th.success : "transparent" }}>
                  {on && <Check className="w-3.5 h-3.5" style={{ color: th.onInk }} strokeWidth={3} />}
                </span>
                <span className={cx("text-[14px] leading-relaxed", on && "line-through")} style={{ color: on ? th.fg3 : th.fg2 }}><Inline text={item} /></span>
              </button>
            </li>
          );
        })}
      </ul>
    </GCard>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const th = useTh();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="rounded-[10px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
      {items.map((item, i) => {
        const on = open === i;
        return (
          <div key={i} style={{ borderTop: i ? `1px solid ${th.sep}` : "none", background: th.card }}>
            <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="w-full text-left flex items-center justify-between gap-4 px-5 py-4">
              <span className="text-[15px] font-bold" style={{ color: th.fg }}>{item.q}</span>
              <ChevronDown className={cx("w-4 h-4 shrink-0 transition-transform", on && "rotate-180")} style={{ color: th.fg3 }} />
            </button>
            {on && <p className="px-5 pb-5 -mt-1 text-[14px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={item.a} /></p>}
          </div>
        );
      })}
    </div>
  );
}

function Quiz({ questions }: { questions: { q: string; options: string[]; answer: number; explain: string }[] }) {
  const th = useTh();
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const score = picked.filter((p, i) => p === questions[i].answer).length;
  const answered = picked.filter((p) => p !== null).length;
  return (
    <div className="space-y-4">
      {questions.map((q, qi) => {
        const choice = picked[qi];
        return (
          <GCard key={qi} className="p-5">
            <p className="eyebrow" style={{ color: th.fg3 }}>Question {qi + 1} / {questions.length}</p>
            <p className="mt-1.5 text-[15px] font-bold leading-snug" style={{ color: th.fg }}><Inline text={q.q} /></p>
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer;
                const isPicked = choice === oi;
                const revealed = choice !== null;
                const border = revealed && isAnswer ? th.success : revealed && isPicked ? th.danger : th.sep;
                return (
                  <button key={oi} type="button" disabled={revealed} onClick={() => setPicked((prev) => prev.map((p, i) => (i === qi ? oi : p)))}
                    className="text-left rounded-[8px] px-4 py-2.5 text-[14px] transition-colors disabled:cursor-default"
                    style={{ border: `1.5px solid ${border}`, color: th.fg, background: revealed && isAnswer ? `${th.success}14` : "transparent" }}>
                    <Inline text={opt} />
                  </button>
                );
              })}
            </div>
            {choice !== null && (
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: th.fg2 }}>
                <span className="font-black" style={{ color: choice === q.answer ? th.success : th.danger }}>{choice === q.answer ? "Exact. " : "Pas tout à fait. "}</span>
                <Inline text={q.explain} />
              </p>
            )}
          </GCard>
        );
      })}
      {answered === questions.length && (
        <div className="flex items-center justify-between gap-3 rounded-[10px] px-5 py-4" style={{ background: th.navA }}>
          <p className="text-[15px] font-black" style={{ color: th.fg }}>Score : {score} / {questions.length}</p>
          <button type="button" onClick={() => setPicked(questions.map(() => null))} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: th.fg }}>
            <RotateCcw className="w-4 h-4" /><span className="ink-link">Recommencer</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Maquette annotée : un faux écran à gauche, les explications numérotées à droite.
function Mockup({ title, caption, tabs, activeTab = 0, fields }: Extract<Block, { type: "mockup" }>) {
  const th = useTh();
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <BlockTitle>{title}</BlockTitle>
      {caption && <p className="-mt-2 mb-4 text-[14px] leading-relaxed max-w-3xl" style={{ color: th.fg2 }}><Inline text={caption} /></p>}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:gap-6">
        <div className="rounded-[12px] overflow-hidden self-start" style={{ border: `1px solid ${th.sep}`, background: th.card, boxShadow: "0 30px 60px -40px rgba(0,0,0,0.35)" }}>
          <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
            {["#f4a6c0", "#f6d38e", "#6adeb1"].map((c) => <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
          </div>
          {tabs && (
            <div className="flex gap-1 px-4 pt-3">
              {tabs.map((t, i) => (
                <span key={t} className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full" style={{ background: i === activeTab ? th.ink : "transparent", color: i === activeTab ? th.onInk : th.fg3 }}>{t}</span>
              ))}
            </div>
          )}
          <div className="p-4 space-y-3">
            {fields.map((f, i) => (
              <div key={f.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="rounded-[8px] p-2 -m-2 transition-colors"
                style={{ background: hover === i ? `${tintAt(i)}33` : "transparent" }}>
                <p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wide" style={{ color: th.fg3 }}>
                  <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black" style={{ background: tintAt(i), color: "#000" }}>{i + 1}</span>{f.label}
                </p>
                <p className="mt-1 text-[13px] leading-snug rounded-[6px] px-3 py-2 whitespace-pre-line" style={{ border: `1px solid ${th.inputB}`, color: th.fg2, background: th.inputBg }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>
        <ol className="space-y-2">
          {fields.map((f, i) => (
            <li key={f.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="flex gap-3 rounded-[8px] px-3 py-2.5 transition-colors"
              style={{ background: hover === i ? `${tintAt(i)}26` : "transparent" }}>
              <span className="w-6 h-6 shrink-0 rounded-full text-[12px] flex items-center justify-center font-black" style={{ background: tintAt(i), color: "#000" }}>{i + 1}</span>
              <div>
                <p className="text-[14px] font-black" style={{ color: th.fg }}>{f.label}</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={f.note} /></p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Chat({ title, turns, note }: Extract<Block, { type: "chat" }>) {
  const th = useTh();
  return (
    <div>
      <BlockTitle>{title}</BlockTitle>
      <div className="rounded-[12px] p-4 sm:p-5 space-y-3 max-w-3xl" style={{ background: th.navA, border: `1px solid ${th.sep}` }}>
        {turns.map((t, i) => {
          const user = t.from === "user";
          return (
            <div key={i} className={cx("flex gap-2.5", user && "flex-row-reverse")}>
              <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center" style={{ background: user ? th.ink : th.card, border: `1px solid ${th.sep}` }}>
                {user ? <User className="w-3.5 h-3.5" style={{ color: th.onInk }} /> : <Sparkles className="w-3.5 h-3.5" style={{ color: th.fg }} />}
              </span>
              <p className="rounded-[12px] px-4 py-2.5 text-[14px] leading-relaxed max-w-[85%] whitespace-pre-line"
                style={{ background: user ? th.ink : th.card, color: user ? th.onInk : th.fg, border: user ? "none" : `1px solid ${th.sep}` }}>
                {t.text}
              </p>
            </div>
          );
        })}
      </div>
      {note && <p className="mt-3 text-[13.5px] leading-relaxed max-w-3xl" style={{ color: th.fg2 }}><Inline text={note} /></p>}
    </div>
  );
}

// « Sous le capot » : encart technique, visuellement distinct du texte courant.
function Deep({ title, paragraphs, analogy }: Extract<Block, { type: "deep" }>) {
  const th = useTh();
  return (
    <div className="max-w-3xl rounded-[12px] p-5 sm:p-6" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.035)", border: `1px solid ${th.sep}` }}>
      <p className="flex items-center gap-2 eyebrow" style={{ color: th.fg3 }}><Cpu className="w-4 h-4" />Sous le capot</p>
      <h2 className="mt-2 text-[1.15rem] sm:text-[1.3rem] font-black leading-tight" style={{ color: th.fg }}>{title}</h2>
      <div className="mt-3 space-y-3">
        {paragraphs.map((p, i) => <p key={i} className="text-[14.5px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={p} /></p>)}
      </div>
      {analogy && (
        <p className="mt-4 text-[14px] leading-relaxed rounded-[8px] px-4 py-3" style={{ background: `${th.warn}${th.isDark ? "1f" : "14"}`, color: th.fg }}>
          <span className="font-black">Pour imager : </span><Inline text={analogy} />
        </p>
      )}
    </div>
  );
}

// Chaîne d'étapes : horizontale sur grand écran, verticale sur mobile.
function Flow({ title, caption, nodes }: Extract<Block, { type: "flow" }>) {
  const th = useTh();
  return (
    <div>
      <BlockTitle>{title}</BlockTitle>
      {caption && <p className="-mt-2 mb-4 text-[14px] leading-relaxed max-w-3xl" style={{ color: th.fg2 }}><Inline text={caption} /></p>}
      <ol className="flex flex-col lg:flex-row lg:items-stretch gap-2">
        {nodes.map((n, i) => (
          <Fragment key={i}>
            <li className="flex-1 min-w-0 rounded-[10px] p-4" style={{ background: `${tintAt(i)}${th.isDark ? "24" : "2e"}` }}>
              <p className="flex items-center gap-2 text-[14px] font-black leading-snug" style={{ color: th.fg }}>
                <span className="w-5 h-5 shrink-0 rounded-full text-[11px] flex items-center justify-center" style={{ background: tintAt(i), color: "#000" }}>{i + 1}</span>{n.label}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={n.detail} /></p>
            </li>
            {i < nodes.length - 1 && (
              <li aria-hidden className="flex items-center justify-center shrink-0" style={{ color: th.fg3 }}>
                <ArrowDown className="w-4 h-4 lg:hidden" /><ArrowRight className="w-4 h-4 hidden lg:block" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}

// Barre proportionnelle survolable + légende détaillée.
function Stack({ title, caption, total, segments }: Extract<Block, { type: "stack" }>) {
  const th = useTh();
  const [hover, setHover] = useState<number | null>(null);
  const sum = segments.reduce((n, s) => n + s.value, 0) || 1;
  return (
    <div className="max-w-4xl">
      <BlockTitle>{title}</BlockTitle>
      {caption && <p className="-mt-2 mb-4 text-[14px] leading-relaxed max-w-3xl" style={{ color: th.fg2 }}><Inline text={caption} /></p>}
      {total && <p className="mb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: th.fg3 }}>{total}</p>}
      <div className="flex h-10 rounded-[8px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
        {segments.map((s, i) => (
          <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} title={s.label}
            className="h-full transition-opacity flex items-center justify-center text-[11px] font-black overflow-hidden"
            style={{ width: `${(s.value / sum) * 100}%`, background: tintAt(i), color: "#000", opacity: hover === null || hover === i ? 1 : 0.4 }}>
            {s.value / sum > 0.08 ? `${Math.round((s.value / sum) * 100)} %` : ""}
          </div>
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        {segments.map((s, i) => (
          <li key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="flex gap-3 rounded-[8px] px-3 py-2.5 transition-colors"
            style={{ background: hover === i ? `${tintAt(i)}26` : "transparent" }}>
            <span className="mt-1 w-3 h-3 shrink-0 rounded-[3px]" style={{ background: tintAt(i) }} />
            <div>
              <p className="text-[14px] font-black" style={{ color: th.fg }}>{s.label}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={s.note} /></p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Myths({ items }: { items: { myth: string; truth: string }[] }) {
  const th = useTh();
  return (
    <div className="space-y-3 max-w-4xl">
      {items.map((m, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-2 rounded-[10px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
          <div className="p-4 flex gap-2.5" style={{ background: `${th.danger}${th.isDark ? "1a" : "0d"}` }}>
            <X className="w-4 h-4 shrink-0 mt-0.5" style={{ color: th.danger }} />
            <div>
              <p className="eyebrow" style={{ color: th.fg3 }}>Idée reçue</p>
              <p className="mt-1 text-[14px] font-bold leading-snug" style={{ color: th.fg }}><Inline text={m.myth} /></p>
            </div>
          </div>
          <div className="p-4 flex gap-2.5" style={{ background: th.card }}>
            <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: th.success }} />
            <div>
              <p className="eyebrow" style={{ color: th.fg3 }}>En réalité</p>
              <p className="mt-1 text-[14px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={m.truth} /></p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Insider({ title, items }: Extract<Block, { type: "insider" }>) {
  const th = useTh();
  return (
    <div className="max-w-3xl">
      <p className="flex items-center gap-2 eyebrow" style={{ color: th.fg3 }}><Eye className="w-4 h-4" />Ce que peu de gens savent</p>
      {title && <h2 className="mt-2 text-[1.2rem] sm:text-[1.35rem] font-black leading-tight" style={{ color: th.fg }}>{title}</h2>}
      <ol className="mt-4 space-y-4">
        {items.map((it, i) => (
          <li key={i} className="flex gap-4">
            <span className="text-[1.6rem] font-black leading-none tabular-nums w-8 shrink-0" style={{ color: tintAt(i * 2) }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-[15px] font-black leading-snug" style={{ color: th.fg }}><Inline text={it.title} /></p>
              <p className="mt-1 text-[14px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={it.text} /></p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function BeforeAfter({ title, before, after, why }: Extract<Block, { type: "beforeAfter" }>) {
  const th = useTh();
  const pane = (side: { label: string; text: string }, good: boolean) => (
    <div className="rounded-[10px] p-4 flex flex-col" style={{ border: `1.5px solid ${good ? th.success : th.sep}`, background: good ? `${th.success}0f` : th.card }}>
      <p className="eyebrow" style={{ color: good ? th.success : th.fg3 }}>{side.label}</p>
      <p className="mt-2 text-[13.5px] leading-relaxed whitespace-pre-line font-mono" style={{ color: th.fg }}>{side.text}</p>
    </div>
  );
  return (
    <div className="max-w-4xl">
      <BlockTitle>{title}</BlockTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{pane(before, false)}{pane(after, true)}</div>
      <p className="mt-3 text-[14px] leading-relaxed" style={{ color: th.fg2 }}><span className="font-black" style={{ color: th.fg }}>Pourquoi ça marche mieux : </span><Inline text={why} /></p>
    </div>
  );
}

export function GuideBlock({ block }: { block: Block }) {
  const th = useTh();
  switch (block.type) {
    case "lead":
      return <p className="text-lg sm:text-xl font-semibold leading-snug max-w-3xl" style={{ color: th.fg }}><Inline text={block.text} /></p>;

    case "text":
      return (
        <div className="max-w-3xl">
          {block.title && <BlockTitle>{block.title}</BlockTitle>}
          <div className="space-y-3">
            {block.paragraphs.map((p, i) => <p key={i} className="text-[15px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={p} /></p>)}
          </div>
        </div>
      );

    case "keyfacts":
      return (
        <div>
          {block.title && <BlockTitle>{block.title}</BlockTitle>}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {block.items.map((k, i) => (
              <div key={k.label} className="rounded-[10px] p-4" style={{ background: `${tintAt(i)}${th.isDark ? "26" : "33"}` }}>
                <p className="text-[1.6rem] sm:text-[1.9rem] font-black leading-none" style={{ color: th.fg }}>{k.value}</p>
                <p className="mt-2 text-[13px] leading-snug" style={{ color: th.fg2 }}><Inline text={k.label} /></p>
              </div>
            ))}
          </div>
        </div>
      );

    case "steps":
      return (
        <div className="max-w-3xl">
          {block.title && <BlockTitle>{block.title}</BlockTitle>}
          <ol className="relative">
            {block.steps.map((s, i) => (
              <li key={i} className="relative pl-12 pb-6 last:pb-0">
                {i < block.steps.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px" style={{ background: th.sep }} />}
                <span className="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black" style={{ background: th.ink, color: th.onInk }}>{i + 1}</span>
                <p className="text-[15.5px] font-black pt-1" style={{ color: th.fg }}>{s.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={s.text} /></p>
                {s.tip && <p className="mt-2 text-[13px] leading-relaxed rounded-[6px] px-3 py-2" style={{ background: `${th.success}14`, color: th.fg }}><span className="font-black">Astuce : </span><Inline text={s.tip} /></p>}
              </li>
            ))}
          </ol>
        </div>
      );

    case "compare":
      return (
        <div>
          {block.title && <BlockTitle>{block.title}</BlockTitle>}
          <div className={cx("grid grid-cols-1 gap-4", block.columns.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
            {block.columns.map((c, i) => (
              <GCard key={c.title} className="p-5 flex flex-col">
                <div className="h-1 -mx-5 -mt-5 mb-4" style={{ background: tintAt(i * 2) }} />
                {c.badge && <p className="eyebrow" style={{ color: th.fg3 }}>{c.badge}</p>}
                <p className="mt-1 text-[17px] font-black" style={{ color: th.fg }}>{c.title}</p>
                <ul className="mt-3 space-y-2 flex-1">
                  {c.points.map((p) => <li key={p} className="text-[14px] leading-relaxed pl-4 relative" style={{ color: th.fg2 }}><span className="absolute left-0" style={{ color: th.fg3 }}>•</span><Inline text={p} /></li>)}
                </ul>
                {c.bestFor && <p className="mt-4 pt-3 text-[13.5px] leading-relaxed" style={{ borderTop: `1px solid ${th.sep}`, color: th.fg }}><span className="font-black">Idéal pour : </span><Inline text={c.bestFor} /></p>}
              </GCard>
            ))}
          </div>
        </div>
      );

    case "table":
      return (
        <div>
          {block.title && <BlockTitle>{block.title}</BlockTitle>}
          <div className="overflow-x-auto rounded-[10px]" style={{ border: `1px solid ${th.sep}` }}>
            <table className="w-full text-[13.5px] border-collapse min-w-[560px]">
              <thead>
                <tr style={{ background: th.navA }}>
                  {block.headers.map((h) => <th key={h} className="text-left font-black px-4 py-3" style={{ color: th.fg }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri} style={{ borderTop: `1px solid ${th.sep}` }}>
                    {row.map((cell, ci) => <td key={ci} className={cx("px-4 py-3 align-top leading-relaxed", ci === 0 && "font-bold")} style={{ color: ci === 0 ? th.fg : th.fg2 }}><Inline text={cell} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.note && <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: th.fg3 }}><Inline text={block.note} /></p>}
        </div>
      );

    case "callout":
      return <div className="max-w-3xl"><Callout tone={block.tone} title={block.title} text={block.text} /></div>;

    case "checklist":
      return <div className="max-w-3xl"><Checklist title={block.title} items={block.items} /></div>;

    case "faq":
      return <div className="max-w-3xl">{block.title && <BlockTitle>{block.title}</BlockTitle>}<Faq items={block.items} /></div>;

    case "mockup":
      return <Mockup {...block} />;

    case "chat":
      return <Chat {...block} />;

    case "prompt":
      return <div className="max-w-3xl"><PromptBlock label={block.label} text={block.text} placeholders={block.placeholders} /></div>;

    case "glossary":
      return (
        <div>
          {block.title && <BlockTitle>{block.title}</BlockTitle>}
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {block.items.map((g) => (
              <GCard key={g.term} className="p-4">
                <dt className="text-[15px] font-black" style={{ color: th.fg }}>{g.term}</dt>
                <dd className="mt-1 text-[13.5px] leading-relaxed" style={{ color: th.fg2 }}><Inline text={g.def} /></dd>
              </GCard>
            ))}
          </dl>
        </div>
      );

    case "quiz":
      return <div className="max-w-3xl">{block.title && <BlockTitle>{block.title}</BlockTitle>}<Quiz questions={block.questions} /></div>;

    case "deep":
      return <Deep {...block} />;

    case "flow":
      return <Flow {...block} />;

    case "stack":
      return <Stack {...block} />;

    case "myths":
      return <div>{block.title && <BlockTitle>{block.title}</BlockTitle>}<Myths items={block.items} /></div>;

    case "insider":
      return <Insider {...block} />;

    case "beforeAfter":
      return <BeforeAfter {...block} />;
  }
}
