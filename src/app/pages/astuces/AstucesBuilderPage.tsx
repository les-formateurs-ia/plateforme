import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { RotateCcw, Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { Segmented, ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { CopyButton } from "@/app/components/astuces/PromptBlock";
import { AstucesCrumbs, BRIQUES_CRUMB, briqueTint } from "@/app/components/astuces/shared";
import { assemblePrompt, builderSteps, getDomain, SUBJECT_KEY, type AstuceDomain, type MediaRatio } from "@/app/data/astuces";
import { studioLink } from "@/app/lib/astucesMedia";
import { cx } from "@/app/lib/cx";

const PROMPT_MAX = 2000;
const RATIOS: Partial<Record<AstuceDomain["id"], { value: MediaRatio; label: string }[]>> = {
  image: [{ value: "1:1", label: "Carré" }, { value: "3:4", label: "Portrait" }, { value: "16:9", label: "Paysage" }, { value: "9:16", label: "Story" }],
  video: [{ value: "16:9", label: "Paysage" }, { value: "9:16", label: "Vertical" }, { value: "1:1", label: "Carré" }],
};

// Brouillon conservé par navigateur (confort uniquement : peut être vide en
// navigation privée, d'où les try/catch).
const draftKey = (domainId: string) => `astuces-builder:${domainId}`;
function readDraft(domainId: string): { values: Record<string, string>; ratio?: MediaRatio } {
  try {
    const raw = localStorage.getItem(draftKey(domainId));
    return raw ? JSON.parse(raw) : { values: {} };
  } catch { return { values: {} }; }
}

export function AstucesBuilderPage() {
  const { domain: domainId } = useParams<{ domain: string }>();
  const domain = getDomain(domainId);
  if (!domain) return <Navigate to="/astuces" replace />;
  return <Builder key={domain.id} domain={domain} />;
}

function Builder({ domain }: { domain: AstuceDomain }) {
  const th = useTh();
  const navigate = useNavigate();
  const steps = useMemo(() => builderSteps(domain), [domain]);
  const [draft] = useState(() => readDraft(domain.id));
  const [values, setValues] = useState<Record<string, string>>(draft.values ?? {});
  const [ratio, setRatio] = useState<MediaRatio>(draft.ratio ?? RATIOS[domain.id][0].value);
  const { text, parts } = assemblePrompt(domain, values);
  const hasSubject = !!values[SUBJECT_KEY]?.trim();
  const filled = steps.filter((s) => values[s.key]?.trim()).length;

  useEffect(() => {
    try { localStorage.setItem(draftKey(domain.id), JSON.stringify({ values, ratio })); } catch { /* stockage indisponible */ }
  }, [domain.id, values, ratio]);

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const tint = (key: string) => briqueTint(domain, key);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-8">
      <div className="fade-up space-y-5">
        <AstucesCrumbs items={[{ label: "Guide IA", to: "/astuces" }, BRIQUES_CRUMB, { label: "Constructeur" }]} />
        <div className="max-w-3xl">
          <p className="eyebrow" style={{ color: th.fg3 }}>Constructeur de prompt · {domain.label}</p>
          <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>Assemble ton prompt</h1>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: th.fg2 }}>
            Commence par le sujet, puis choisis une option par brique ou écris la tienne. Tu n'es pas obligé de tout remplir : chaque brique que tu précises, c'est une décision que l'IA ne prend plus à ta place.
          </p>
        </div>
      </div>

      <div className="fade-up grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] gap-6 items-start">
        <ol className="space-y-3 min-w-0">
          {steps.map((step, i) => {
            const value = values[step.key] ?? "";
            const isSubject = step.key === SUBJECT_KEY;
            return (
              <li key={step.key}>
                <GCard className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center text-[11px] font-black"
                        style={{ background: value.trim() ? `${tint(step.key)}` : "transparent", border: `1px solid ${value.trim() ? "transparent" : th.inputB}`, color: value.trim() ? "#000" : th.fg3 }}>
                        {i + 1}
                      </span>
                      <p className="text-[15px] font-black truncate" style={{ color: th.fg }}>{step.label}{isSubject && <span style={{ color: th.danger }}> *</span>}</p>
                    </div>
                    {step.brique && (
                      <Link to={`/astuces/${domain.id}/briques/${step.brique.id}`} className="ink-link text-xs font-semibold shrink-0" style={{ color: th.fg3 }}>
                        Revoir la brique
                      </Link>
                    )}
                  </div>
                  {step.brique && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {step.brique.vocabulary.map((term) => {
                        const active = value.trim() === term.snippet;
                        return (
                          <button key={term.term} type="button" title={term.snippet} onClick={() => set(step.key, active ? "" : term.snippet)} aria-pressed={active}
                            className={cx("px-2.5 py-1 rounded-[2px] text-xs font-semibold transition-colors", !active && "hover:opacity-70")}
                            style={active ? { background: th.ink, color: th.onInk, border: `1px solid ${th.ink}` } : { border: `1px solid ${th.sep}`, color: th.fg2 }}>
                            {term.term}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isSubject ? (
                    <textarea value={value} onChange={(e) => set(step.key, e.target.value)} placeholder={step.placeholder} rows={2}
                      className="mt-3 w-full px-3 py-2.5 rounded-[6px] text-sm outline-none resize-y"
                      style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }} />
                  ) : (
                    <input value={value} onChange={(e) => set(step.key, e.target.value)} placeholder={step.placeholder}
                      className="mt-3 w-full px-3 py-2.5 rounded-[6px] text-sm outline-none"
                      style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }} />
                  )}
                </GCard>
              </li>
            );
          })}
        </ol>

        <aside aria-label="Prompt assemblé" className="lg:sticky lg:top-4">
          <GCard accent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-black" style={{ color: th.fg }}>Ton prompt</p>
              <span className="text-xs font-semibold" style={{ color: text.length > PROMPT_MAX ? th.danger : th.fg3 }}>
                {filled}/{steps.length} briques · {text.length} car.
              </span>
            </div>
            <div className="min-h-[120px] rounded-[6px] p-3 text-[14px] leading-[1.8]" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : th.gradShadow(0.025) }}>
              {text ? (
                parts.map((p, i) => p.key ? (
                  <span key={i} className="rounded-[3px] px-0.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
                    style={{ background: `${tint(p.key)}${th.isDark ? "4d" : "66"}`, color: th.fg }}>{p.text}</span>
                ) : <span key={i} style={{ color: th.fg2 }}>{p.text}</span>)
              ) : (
                <span style={{ color: th.fg3 }}>Ton prompt apparaîtra ici au fur et à mesure.</span>
              )}
            </div>
            <div>
              <p className="eyebrow mb-2" style={{ color: th.fg3 }}>Format (réglé dans Le Studio)</p>
              <Segmented value={ratio} onChange={(v) => setRatio(v as MediaRatio)} options={RATIOS[domain.id]} />
            </div>
            <div className="flex flex-wrap gap-2">
              <ShimBtn sm disabled={!hasSubject || text.length > PROMPT_MAX} onClick={() => navigate(studioLink(domain.studio, text, ratio))}>
                <Sparkles className="w-4 h-4" />Essayer dans le Studio
              </ShimBtn>
              {text && <CopyButton text={text} label="Copier" />}
              {filled > 0 && <VBtn sm onClick={() => setValues({})}><RotateCcw className="w-4 h-4" />Effacer</VBtn>}
            </div>
            {!hasSubject && <p className="text-xs" style={{ color: th.fg3 }}>Renseigne au moins le sujet pour lancer la génération.</p>}
            <p className="text-xs leading-relaxed" style={{ color: th.fg3 }}>
              Astuce : génère une première fois, puis ne modifie qu'une seule brique à la fois pour voir précisément son effet.
            </p>
          </GCard>
        </aside>
      </div>
    </div>
  );
}
