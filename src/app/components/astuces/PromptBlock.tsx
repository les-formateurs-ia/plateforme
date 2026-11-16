import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Check, Copy, Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

export function CopyButton({ text, label = "Copier", compact }: { text: string; label?: string; compact?: boolean }) {
  const th = useTh();
  const [copied, setCopied] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* presse-papiers indisponible (contexte non sécurisé) */ }
  };
  return (
    <button type="button" onClick={copy} aria-label={copied ? "Copié" : label}
      className={cx("inline-flex items-center gap-1.5 rounded-[2px] font-semibold transition-opacity hover:opacity-70 shrink-0", compact ? "text-[11px] p-1" : "text-xs px-2.5 py-1.5")}
      style={{ color: copied ? th.success : th.fg2, border: compact ? "none" : `1px solid ${th.sep}` }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {!compact && (copied ? "Copié" : label)}
    </button>
  );
}

// Met en valeur, dans un prompt : soit un passage précis (`highlight`, la
// variable d'une série contrôlée), soit tous les [EMPLACEMENTS] d'un modèle.
function renderPrompt(text: string, mark: (s: string, key: number) => ReactNode, highlight?: string, placeholders?: boolean): ReactNode {
  if (placeholders) {
    return text.split(/(\[[^\]]+\])/g).map((part, i) => (part.startsWith("[") && part.endsWith("]") ? mark(part, i) : part));
  }
  if (highlight) {
    const at = text.indexOf(highlight);
    if (at >= 0) return <>{text.slice(0, at)}{mark(highlight, 0)}{text.slice(at + highlight.length)}</>;
  }
  return text;
}

export function PromptText({ text, highlight, placeholders, className }: { text: string; highlight?: string; placeholders?: boolean; className?: string }) {
  const th = useTh();
  const mark = (s: string, key: number) => (
    <mark key={key} className="rounded-[2px] px-0.5 font-semibold" style={{ background: placeholders ? th.gradShadow(0.08) : `${th.role}55`, color: th.fg }}>{s}</mark>
  );
  return <p className={cx("text-[13.5px] leading-relaxed whitespace-pre-line", className)} style={{ color: th.fg2 }}>{renderPrompt(text, mark, highlight, placeholders)}</p>;
}

export function PromptBlock({ text, highlight, placeholders, label, studioTo }: {
  text: string;
  highlight?: string;
  placeholders?: boolean;
  label?: string;
  // Lien « Essayer dans le Studio » (prompt pré-rempli), absent pour un modèle à trous.
  studioTo?: string;
}) {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <div className="rounded-[8px] p-4" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : th.gradShadow(0.025), border: `1px solid ${th.sep}` }}>
      {label && <p className="eyebrow mb-2" style={{ color: th.fg3 }}>{label}</p>}
      <PromptText text={text} highlight={highlight} placeholders={placeholders} />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <CopyButton text={text} label={placeholders ? "Copier le modèle" : "Copier le prompt"} />
        {studioTo && (
          <button type="button" onClick={() => navigate(studioTo)}
            className="sweep inline-flex items-center gap-1.5 rounded-[2px] text-xs font-semibold px-2.5 py-1.5"
            style={{ background: th.ink, color: th.onInk }}>
            <Sparkles className="w-3.5 h-3.5" />Essayer dans le Studio
          </button>
        )}
      </div>
    </div>
  );
}
