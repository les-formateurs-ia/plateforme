import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowRight, Camera, Check, Clock, Lightbulb, RotateCcw, Sparkles, TriangleAlert, Upload } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { SectionHead } from "@/app/components/common/SectionHead";
import { AstuceMediaFrame } from "@/app/components/astuces/AstuceMediaFrame";
import { BriqueSchema, hasBriqueSchema } from "@/app/components/astuces/BriqueSchema";
import { CopyButton, PromptBlock } from "@/app/components/astuces/PromptBlock";
import { AstucesCrumbs, GRID_BY_RATIO, tintAt } from "@/app/components/astuces/shared";
import { ASTUCE_CAS, casExamplePrompt, casMediaKeys, casParts, getCas, getDomain, partsText, type AstuceCas, type CasBrique, type CasPart } from "@/app/data/astuces";
import { casStudioLink } from "@/app/lib/astucesMedia";
import { cx } from "@/app/lib/cx";

const PROMPT_MAX = 2000;

const ANCHORS = [
  { id: "prompt", label: "Le prompt" },
  { id: "briques", label: "Brique par brique" },
  { id: "avant-apres", label: "Avant / après" },
  { id: "a-toi", label: "À toi de jouer" },
];

// Choix de l'élève (champs + briques), conservés par navigateur : confort
// uniquement, peut être vide en navigation privée, d'où les try/catch.
const draftKey = (id: string) => `astuces-cas:${id}`;
function readDraft(id: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(draftKey(id));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

export function AstucesCasPage() {
  const { casId } = useParams<{ casId: string }>();
  const cas = getCas(casId);
  if (!cas) return <Navigate to="/astuces" replace />;
  return <CasView key={cas.id} cas={cas} />;
}

// Prompt surligné : chaque brique dans sa couleur, les champs soulignés.
function PromptParts({ cas, parts, active, onHover, onPick }: {
  cas: AstuceCas;
  parts: CasPart[];
  active?: string | null;
  onHover?: (slot: string | null) => void;
  onPick?: (slot: string) => void;
}) {
  const th = useTh();
  const tint = (slot: string) => tintAt(cas.briques.findIndex((b) => b.id === slot));
  return (
    <>
      {parts.map((p, i) => {
        if (!p.slot) return <span key={i} style={{ color: th.fg2 }}>{p.text}</span>;
        const slot = p.slot;
        const dim = active != null && active !== slot;
        if (p.kind === "field") {
          return (
            <span key={i} className="font-semibold transition-opacity" style={{ color: p.missing ? th.fg3 : th.fg, borderBottom: `2px ${p.missing ? "dashed" : "solid"} ${th.fg3}`, opacity: dim ? 0.35 : 1 }}>
              {p.text}
            </span>
          );
        }
        const interactive = !!onPick;
        return (
          <span key={i} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onPick(slot) : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(slot); } } : undefined}
            onMouseEnter={onHover ? () => onHover(slot) : undefined} onMouseLeave={onHover ? () => onHover(null) : undefined}
            className={cx("rounded-[3px] px-1 py-0.5 transition-opacity [box-decoration-break:clone] [-webkit-box-decoration-break:clone]", interactive && "cursor-pointer")}
            style={{ background: `${tint(slot)}${th.isDark ? "4d" : "73"}`, color: th.fg, opacity: dim ? 0.35 : 1 }}>
            {p.text}
          </span>
        );
      })}
    </>
  );
}

function CasView({ cas }: { cas: AstuceCas }) {
  const th = useTh();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>(() => readDraft(cas.id));
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(draftKey(cas.id), JSON.stringify(values)); } catch { /* stockage indisponible */ }
  }, [cas.id, values]);

  useEffect(() => { document.getElementById("cas-top")?.scrollIntoView({ block: "start" }); }, [cas.id]);

  const set = (slot: string, value: string) => setValues((prev) => ({ ...prev, [slot]: value }));
  const choice = (brique: CasBrique) => values[brique.id]?.trim() || brique.options[0].snippet;
  const tintOf = (brique: CasBrique) => tintAt(cas.briques.indexOf(brique));
  const scrollTo = (id: string) => document.getElementById(`cas-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const exampleParts = casParts(cas, {}, true);
  const examplePrompt = casExamplePrompt(cas);
  const parts = casParts(cas, values);
  const text = partsText(parts);
  const missing = parts.filter((p) => p.missing);
  const refDomain = getDomain(cas.domain);
  const others = ASTUCE_CAS.filter((c) => c.id !== cas.id);
  const touched = Object.values(values).some((v) => v.trim());

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-14">
      <div id="cas-top" className="fade-up grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)] gap-8 items-start scroll-mt-6">
        <div className="space-y-5 min-w-0">
          <AstucesCrumbs items={[{ label: "Astuces IA", to: "/astuces" }, { label: cas.title }]} />
          <div className="max-w-3xl">
            <p className="eyebrow" style={{ color: th.fg3 }}>Cas pratique · Image</p>
            <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>{cas.title}</h1>
            <p className="mt-3 text-[15px] sm:text-base leading-relaxed" style={{ color: th.fg2 }}>{cas.intro}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-semibold" style={{ color: th.fg2 }}>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" style={{ color: th.fg3 }} />{cas.model.label}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" style={{ color: th.fg3 }} />{cas.duration}</span>
            {cas.source && <span className="inline-flex items-center gap-1.5"><Camera className="w-4 h-4" style={{ color: th.fg3 }} />Avec ta photo</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {ANCHORS.map((a) => (
              <button key={a.id} type="button" onClick={() => scrollTo(a.id)}
                className="px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative max-w-[360px] w-full lg:justify-self-end">
          <AstuceMediaFrame mediaKey={casMediaKeys.result(cas)} ratio={cas.ratio} kind="image" label={`Résultat — ${cas.title}`} />
          {cas.source && (
            <div className="absolute left-3 bottom-3 w-[32%] shadow-lg">
              <AstuceMediaFrame mediaKey={casMediaKeys.source(cas)} ratio="1:1" kind="image" label="Photo de départ" className="rounded-[6px]" />
            </div>
          )}
        </div>
      </div>

      {cas.source && (
        <section aria-labelledby="cas-source" className="fade-up">
          <SectionHead id="cas-source" eyebrow="Ce qu'il te faut" title={cas.source.label} />
          <GCard className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-5 items-start">
              <div className="max-w-[160px]">
                <AstuceMediaFrame mediaKey={casMediaKeys.source(cas)} ratio="1:1" kind="image" label="Photo de départ des exemples" />
                <p className="mt-2 text-[11.5px] leading-snug" style={{ color: th.fg3 }}>La photo de départ des exemples de cette page (fictive).</p>
              </div>
              <div className="min-w-0">
                <ul className="space-y-2.5">
                  {cas.source.tips.map((tip) => (
                    <li key={tip} className="text-[14px] leading-relaxed pl-6 relative" style={{ color: th.fg }}>
                      <Check className="w-4 h-4 absolute left-0 top-0.5" style={{ color: th.success }} />{tip}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed rounded-[6px] px-3 py-2.5" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : th.gradShadow(0.03), color: th.fg2 }}>
                  <Upload className="w-4 h-4 shrink-0 mt-0.5" style={{ color: th.fg3 }} />
                  <span>Dans Le Studio, clique sur <span className="font-semibold" style={{ color: th.fg }}>« Ajouter une image »</span> et importe ta photo : {cas.model.label} s'en sert comme référence, le prompt décrit ce qu'il doit en faire.</span>
                </p>
              </div>
            </div>
          </GCard>
        </section>
      )}

      <section aria-labelledby="cas-prompt" className="fade-up scroll-mt-6">
        <SectionHead id="cas-prompt" eyebrow="Le prompt complet" title="Le prompt qui a donné ce résultat" />
        <div className="max-w-4xl space-y-5">
          <p className="text-sm" style={{ color: th.fg3 }}>Chaque couleur est une brique : survole-la, clique pour voir ce qu'elle change.</p>
          <p className="text-[15px] sm:text-[17px] leading-[1.9]">
            <PromptParts cas={cas} parts={exampleParts} active={hovered} onHover={setHovered} onPick={(slot) => scrollTo(`brique-${slot}`)} />
          </p>
          <div className="flex flex-wrap gap-2">
            {cas.briques.map((b) => (
              <button key={b.id} type="button" onClick={() => scrollTo(`brique-${b.id}`)} onMouseEnter={() => setHovered(b.id)} onMouseLeave={() => setHovered(null)}
                className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-xs font-semibold transition-opacity"
                style={{ border: `1px solid ${th.sep}`, color: th.fg, opacity: hovered !== null && hovered !== b.id ? 0.45 : 1 }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tintOf(b) }} />{b.title}
              </button>
            ))}
            {cas.fields.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold" style={{ color: th.fg3 }}>
                <span className="w-4 h-0 shrink-0" style={{ borderBottom: `2px solid ${th.fg3}` }} />Tes infos
              </span>
            )}
          </div>
          <PromptBlock text={examplePrompt} studioTo={cas.fields.length ? undefined : casStudioLink(cas, examplePrompt)} />
          <p className="text-[13.5px] leading-relaxed" style={{ color: th.fg2 }}>
            <span className="font-black" style={{ color: th.fg }}>Modèle conseillé : {cas.model.label}. </span>{cas.model.why}
          </p>
        </div>
      </section>

      <section aria-labelledby="cas-briques" className="fade-up scroll-mt-6">
        <SectionHead id="cas-briques" eyebrow={`${cas.briques.length} briques`} title="Ce que chaque brique change" />
        <p className="text-sm max-w-3xl -mt-2 mb-8 leading-relaxed" style={{ color: th.fg2 }}>
          Dans chaque série, tout le prompt reste identique sauf la brique en couleur. Clique sur l'option qui te plaît : elle est reprise dans ton prompt, plus bas.
        </p>
        <div className="space-y-12">
          {cas.briques.map((brique, index) => {
            const current = choice(brique);
            return (
              <div key={brique.id} id={`cas-brique-${brique.id}`} className="scroll-mt-6">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full shrink-0 inline-flex items-center justify-center text-xs font-black" style={{ background: tintOf(brique), color: "#000" }}>{index + 1}</span>
                  <h3 className="text-[1.2rem] sm:text-[1.35rem] font-black leading-tight" style={{ color: th.fg }}>{brique.title}</h3>
                </div>
                <div className="mt-2 flex items-start gap-4 max-w-4xl">
                  <p className="flex-1 min-w-0 text-[14.5px] leading-relaxed max-w-3xl" style={{ color: th.fg2 }}>{brique.why}</p>
                  {/* Rappel visuel du concept : le schéma de la brique de la bibliothèque. */}
                  {brique.ref && hasBriqueSchema(brique.ref) && (
                    <div className="hidden sm:block w-32 shrink-0 rounded-[6px] p-2" style={{ background: `${tintOf(brique)}${th.isDark ? "26" : "33"}`, color: th.fg }}>
                      <BriqueSchema briqueId={brique.ref} tint={tintOf(brique)} />
                    </div>
                  )}
                </div>
                <div className={cx("mt-4 grid gap-3 sm:gap-4", GRID_BY_RATIO[cas.ratio], cas.ratio !== "16:9" && "max-w-4xl")}>
                  {brique.options.map((option, i) => {
                    const active = current === option.snippet;
                    return (
                      <button key={option.id} type="button" onClick={() => set(brique.id, option.snippet)} aria-pressed={active}
                        className="text-left rounded-[10px] p-2 transition-colors"
                        style={{ background: th.card, border: `1px solid ${active ? th.ink : th.sep}` }}>
                        <div className="relative">
                          <AstuceMediaFrame mediaKey={casMediaKeys.option(cas, brique, option)} ratio={cas.ratio} kind="image" label={option.label} />
                          {active && (
                            <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wide" style={{ background: th.ink, color: th.onInk }}>
                              <Check className="w-3 h-3" />Choisi
                            </span>
                          )}
                        </div>
                        <div className="px-1.5 pt-3 pb-1.5">
                          <p className="text-sm font-black" style={{ color: th.fg }}>{option.label}{i === 0 && <span className="ml-1.5 text-[11px] font-semibold" style={{ color: th.fg3 }}>· exemple principal</span>}</p>
                          <p className="mt-1 text-[12.5px] leading-snug" style={{ color: th.fg2 }}>{option.note}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="text-[13px] leading-relaxed min-w-0" style={{ color: th.fg2 }}>
                    <span className="font-semibold" style={{ color: th.fg3 }}>Dans le prompt : </span>
                    <span className="rounded-[2px] px-1 [box-decoration-break:clone]" style={{ background: `${tintOf(brique)}${th.isDark ? "4d" : "66"}`, color: th.fg }}>{current}</span>
                  </p>
                  {brique.ref && refDomain?.briques.some((b) => b.id === brique.ref) && (
                    <Link to={`/astuces/${cas.domain}/briques/${brique.ref}`} className="ink-link text-xs font-semibold shrink-0" style={{ color: th.fg3 }}>
                      Tout savoir sur la brique « {refDomain.briques.find((b) => b.id === brique.ref)?.title} »
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="cas-avant-apres" className="fade-up scroll-mt-6">
        <SectionHead id="cas-avant-apres" eyebrow="Avant / après" title="Le même besoin, deux prompts" />
        <div className={cx("grid gap-4", cas.ratio === "16:9" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 max-w-3xl")}>
          {([
            { key: casMediaKeys.weak(cas), title: "Prompt vague", text: cas.weak.prompt, color: th.danger },
            { key: casMediaKeys.result(cas), title: "Prompt précis", text: examplePrompt, color: th.success },
          ]).map((col) => (
            <div key={col.title} className="space-y-3 min-w-0">
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: col.color }}>{col.title}</p>
              <AstuceMediaFrame mediaKey={col.key} ratio={cas.ratio} kind="image" label={col.title} />
              <PromptBlock text={col.text} />
            </div>
          ))}
        </div>
        <p className="mt-4 text-[15px] leading-relaxed max-w-3xl" style={{ color: th.fg }}>
          <span className="font-black">Pourquoi ça marche : </span>{cas.weak.explanation}
        </p>
      </section>

      <section aria-labelledby="cas-a-toi" className="fade-up scroll-mt-6">
        <SectionHead id="cas-a-toi" eyebrow="À toi de jouer" title="Adapte le prompt à ton projet" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] gap-6 items-start">
          <ol className="space-y-3 min-w-0">
            {cas.fields.map((field) => (
              <li key={field.id}>
                <GCard className="p-4 sm:p-5">
                  <label className="block">
                    <span className="text-[15px] font-black" style={{ color: th.fg }}>{field.label}<span style={{ color: th.danger }}> *</span></span>
                    <input value={values[field.id] ?? ""} onChange={(e) => set(field.id, e.target.value)} placeholder={field.placeholder}
                      className="mt-3 w-full px-3 py-2.5 rounded-[6px] text-sm outline-none"
                      style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }} />
                  </label>
                </GCard>
              </li>
            ))}
            {cas.briques.map((brique) => {
              const current = choice(brique);
              // Valeur brute (non trimée) : sinon l'espace tapé en fin de saisie disparaît aussitôt.
              const raw = values[brique.id] ?? "";
              const custom = brique.options.some((o) => o.snippet === current) ? "" : raw;
              return (
                <li key={brique.id}>
                  <GCard className="p-4 sm:p-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tintOf(brique) }} />
                      <p className="text-[15px] font-black" style={{ color: th.fg }}>{brique.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {brique.options.map((option) => {
                        const active = current === option.snippet;
                        return (
                          <button key={option.id} type="button" title={option.snippet} onClick={() => set(brique.id, option.snippet)} aria-pressed={active}
                            className={cx("px-2.5 py-1 rounded-[2px] text-xs font-semibold transition-colors", !active && "hover:opacity-70")}
                            style={active ? { background: th.ink, color: th.onInk, border: `1px solid ${th.ink}` } : { border: `1px solid ${th.sep}`, color: th.fg2 }}>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <input value={custom} onChange={(e) => set(brique.id, e.target.value)} placeholder="Ou écris ta propre version…"
                      aria-label={`${brique.title} : ta propre version`}
                      className="mt-3 w-full px-3 py-2.5 rounded-[6px] text-sm outline-none"
                      style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }} />
                  </GCard>
                </li>
              );
            })}
          </ol>

          <aside aria-label="Ton prompt" className="lg:sticky lg:top-4">
            <GCard accent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-black" style={{ color: th.fg }}>Ton prompt</p>
                <span className="text-xs font-semibold" style={{ color: text.length > PROMPT_MAX ? th.danger : th.fg3 }}>{text.length} car.</span>
              </div>
              <div className="rounded-[6px] p-3 text-[14px] leading-[1.8]" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : th.gradShadow(0.025) }}>
                <PromptParts cas={cas} parts={parts} />
              </div>
              <p className="text-xs font-semibold" style={{ color: th.fg3 }}>Modèle : {cas.model.label} · Format {cas.ratio}</p>
              <div className="flex flex-wrap gap-2">
                <ShimBtn sm disabled={missing.length > 0 || text.length > PROMPT_MAX} onClick={() => navigate(casStudioLink(cas, text))}>
                  <Sparkles className="w-4 h-4" />Essayer dans le Studio
                </ShimBtn>
                <CopyButton text={text} label="Copier" />
                {touched && <VBtn sm onClick={() => setValues({})}><RotateCcw className="w-4 h-4" />Réinitialiser</VBtn>}
              </div>
              {missing.length > 0 && (
                <p className="text-xs" style={{ color: th.fg3 }}>À compléter : {missing.map((p) => p.text.slice(1, -1)).join(", ")}.</p>
              )}
              {cas.source && (
                <p className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: th.fg2 }}>
                  <Upload className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: th.fg3 }} />
                  N'oublie pas d'importer {cas.source.label.charAt(0).toLowerCase() + cas.source.label.slice(1)} dans Le Studio avant de générer.
                </p>
              )}
              <p className="text-xs leading-relaxed" style={{ color: th.fg3 }}>
                Astuce : génère une première fois, puis ne change qu'une seule brique à la fois pour voir précisément son effet.
              </p>
            </GCard>
          </aside>
        </div>
      </section>

      <section aria-label="Pièges et astuces" className="fade-up grid grid-cols-1 md:grid-cols-2 gap-4">
        <GCard className="p-5">
          <p className="flex items-center gap-2 text-base font-black" style={{ color: th.fg }}><TriangleAlert className="w-4 h-4" style={{ color: th.danger }} />Les pièges à éviter</p>
          <ul className="mt-3 space-y-2.5">
            {cas.pitfalls.map((p) => <li key={p} className="text-[13.5px] leading-relaxed pl-4 relative" style={{ color: th.fg2 }}><span className="absolute left-0" style={{ color: th.danger }}>×</span>{p}</li>)}
          </ul>
        </GCard>
        <GCard className="p-5">
          <p className="flex items-center gap-2 text-base font-black" style={{ color: th.fg }}><Lightbulb className="w-4 h-4" style={{ color: th.success }} />Les astuces de pro</p>
          <ul className="mt-3 space-y-2.5">
            {cas.tips.map((t) => <li key={t} className="text-[13.5px] leading-relaxed pl-4 relative" style={{ color: th.fg2 }}><span className="absolute left-0" style={{ color: th.success }}>→</span>{t}</li>)}
          </ul>
        </GCard>
      </section>

      <section aria-labelledby="cas-declinaisons" className="fade-up">
        <SectionHead id="cas-declinaisons" eyebrow="Déclinaisons" title="Le même prompt, d'autres usages" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cas.variants.map((v) => (
            <GCard key={v.title} className="p-4">
              <p className="text-[15px] font-black" style={{ color: th.fg }}>{v.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: th.fg2 }}>{v.text}</p>
            </GCard>
          ))}
        </div>
      </section>

      <nav aria-label="Autres cas pratiques" className="fade-up pt-6 pb-4" style={{ borderTop: `1px solid ${th.sep}` }}>
        <p className="eyebrow mb-3" style={{ color: th.fg3 }}>Autres cas pratiques</p>
        <div className="flex flex-wrap gap-2">
          {others.map((c) => (
            <Link key={c.id} to={`/astuces/cas/${c.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
              {c.title}<ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
