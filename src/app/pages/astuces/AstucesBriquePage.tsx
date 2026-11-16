import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Lightbulb, TriangleAlert, Wand2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import { SectionHead } from "@/app/components/common/SectionHead";
import { AstuceMediaFrame } from "@/app/components/astuces/AstuceMediaFrame";
import { BriqueSchema, hasBriqueSchema } from "@/app/components/astuces/BriqueSchema";
import { CopyButton, PromptBlock, PromptText } from "@/app/components/astuces/PromptBlock";
import { AstucesCrumbs, BRIQUES_CRUMB, GRID_BY_RATIO, briqueNumber, briqueTint } from "@/app/components/astuces/shared";
import { domainMediaKind, fillVariation, getBrique, getDomain, mediaKeys } from "@/app/data/astuces";
import { studioLink } from "@/app/lib/astucesMedia";
import { cx } from "@/app/lib/cx";

export function AstucesBriquePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { domain: domainId, briqueId } = useParams<{ domain: string; briqueId: string }>();
  const domain = getDomain(domainId);
  const brique = domain ? getBrique(domain, briqueId) : undefined;
  const [selected, setSelected] = useState(0);

  // Nouvelle brique (navigation précédente/suivante) : on revient en haut et
  // sur la première variation.
  useEffect(() => {
    setSelected(0);
    document.getElementById("astuces-brique-top")?.scrollIntoView({ block: "start" });
  }, [briqueId]);

  if (!domain) return <Navigate to="/astuces" replace />;
  if (!brique) return <Navigate to="/astuces" replace />;

  const kind = domainMediaKind(domain);
  const index = domain.briques.findIndex((b) => b.id === brique.id);
  const prev = domain.briques[index - 1];
  const next = domain.briques[index + 1];
  const v = brique.variations;
  const selectedItem = v?.items[Math.min(selected, (v?.items.length ?? 1) - 1)];
  const ba = brique.beforeAfter;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-14">
      <div id="astuces-brique-top" className="fade-up space-y-5 scroll-mt-6">
        <AstucesCrumbs items={[{ label: "Astuces IA", to: "/astuces" }, BRIQUES_CRUMB, { label: brique.title }]} />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] gap-6 lg:gap-10 items-center">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: briqueTint(domain, brique.id) }} />
            <p className="eyebrow" style={{ color: th.fg3 }}>Brique {briqueNumber(domain, brique.id)} / {String(domain.briques.length).padStart(2, "0")}</p>
          </div>
          <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>{brique.title}</h1>
          <p className="mt-3 text-lg sm:text-xl font-semibold leading-snug" style={{ color: th.fg }}>{brique.question}</p>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: th.fg2 }}>{brique.why}</p>
        </div>
        {hasBriqueSchema(brique.id) && (
          <div className="rounded-[10px] p-5 sm:p-6 max-w-md lg:max-w-none" style={{ background: `${briqueTint(domain, brique.id)}${th.isDark ? "26" : "33"}`, color: th.fg }}>
            <BriqueSchema briqueId={brique.id} tint={briqueTint(domain, brique.id)} label={`Schéma : ${brique.title}`} />
          </div>
        )}
        </div>
      </div>

      {v && selectedItem && (
        <section aria-labelledby="astuces-variations" className="fade-up">
          <SectionHead id="astuces-variations" eyebrow="Variations contrôlées" title="Une seule brique change" />
          <p className="text-sm max-w-3xl -mt-2 mb-5 leading-relaxed" style={{ color: th.fg2 }}>{v.intro}</p>

          {v.startImage && (
            <div className="grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[140px_minmax(0,1fr)] gap-4 items-center mb-6">
              <AstuceMediaFrame mediaKey={mediaKeys.start(domain, brique)} ratio={v.ratio} kind="image" label="Image de départ" />
              <div className="min-w-0">
                <p className="eyebrow mb-1" style={{ color: th.fg3 }}>Image de départ commune</p>
                <PromptText text={v.startImage} />
              </div>
            </div>
          )}

          <div className={cx("grid gap-3 sm:gap-4", GRID_BY_RATIO[v.ratio])}>
            {v.items.map((item, i) => {
              const active = item.id === selectedItem.id;
              return (
                <button key={item.id} type="button" onClick={() => setSelected(i)} aria-pressed={active}
                  className="text-left rounded-[10px] p-2 transition-colors"
                  style={{ background: th.card, border: `1px solid ${active ? th.ink : th.sep}` }}>
                  <AstuceMediaFrame mediaKey={mediaKeys.variation(domain, brique, item.id)} ratio={v.ratio} kind={kind} withSound={v.audio} label={item.label} />
                  <div className="px-1.5 pt-3 pb-1.5">
                    <p className="text-sm font-black" style={{ color: th.fg }}>{item.label}</p>
                    <p className="mt-1 text-[12.5px] leading-snug" style={{ color: th.fg2 }}>{item.note}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <PromptBlock label={`Prompt exact — ${selectedItem.label}`} text={fillVariation(v, selectedItem.snippet)} highlight={selectedItem.snippet}
              studioTo={v.startImage ? undefined : studioLink(domain.studio, fillVariation(v, selectedItem.snippet), v.ratio)} />
            {v.startImage && (
              <p className="mt-2 text-xs" style={{ color: th.fg3 }}>
                Pour reproduire cet exemple, génère d'abord l'image de départ dans Le Studio Images, puis joins-la dans Le Studio Vidéos avec ce prompt.
              </p>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="astuces-vocabulaire" className="fade-up">
        <SectionHead id="astuces-vocabulaire" eyebrow="Vocabulaire" title="Les mots qui marchent" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brique.vocabulary.map((term) => (
            <GCard key={term.term} className="p-4">
              <p className="text-[15px] font-black" style={{ color: th.fg }}>{term.term}</p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: th.fg2 }}>{term.meaning}</p>
              <div className="mt-3 flex items-start gap-2 rounded-[6px] px-3 py-2" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : th.gradShadow(0.03) }}>
                <p className="flex-1 text-[13px] italic leading-relaxed" style={{ color: th.fg }}>« {term.snippet} »</p>
                <CopyButton text={term.snippet} compact />
              </div>
            </GCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="astuces-formule" className="fade-up">
        <SectionHead id="astuces-formule" eyebrow="La formule" title="La structure à suivre" />
        <GCard accent className="p-5">
          <PromptText text={brique.formula} placeholders className="text-[15px]" />
        </GCard>
      </section>

      {ba && (
        <section aria-labelledby="astuces-avant-apres" className="fade-up">
          <SectionHead id="astuces-avant-apres" eyebrow="Avant / après" title="Le même besoin, deux prompts" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              { side: "avant" as const, title: "Prompt vague", text: ba.weak, color: th.danger },
              { side: "apres" as const, title: "Prompt précis", text: ba.strong, color: th.success },
            ]).map((col) => (
              <div key={col.side} className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: col.color }}>{col.title}</p>
                {ba.illustrated && (
                  <AstuceMediaFrame mediaKey={mediaKeys.beforeAfter(domain, brique, col.side)} ratio={ba.ratio} kind={kind} label={col.title}
                    className={ba.ratio === "16:9" ? "" : "max-w-[360px]"} />
                )}
                <PromptBlock text={col.text} studioTo={col.side === "apres" ? studioLink(domain.studio, col.text, ba.ratio) : undefined} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed max-w-3xl" style={{ color: th.fg }}>
            <span className="font-black">Pourquoi ça marche : </span>{ba.explanation}
          </p>
        </section>
      )}

      <section aria-label="Pièges et astuces" className="fade-up grid grid-cols-1 md:grid-cols-2 gap-4">
        <GCard className="p-5">
          <p className="flex items-center gap-2 text-base font-black" style={{ color: th.fg }}><TriangleAlert className="w-4 h-4" style={{ color: th.danger }} />Les pièges à éviter</p>
          <ul className="mt-3 space-y-2.5">
            {brique.pitfalls.map((p) => <li key={p} className="text-[13.5px] leading-relaxed pl-4 relative" style={{ color: th.fg2 }}><span className="absolute left-0" style={{ color: th.danger }}>×</span>{p}</li>)}
          </ul>
        </GCard>
        <GCard className="p-5">
          <p className="flex items-center gap-2 text-base font-black" style={{ color: th.fg }}><Lightbulb className="w-4 h-4" style={{ color: th.success }} />Les astuces de pro</p>
          <ul className="mt-3 space-y-2.5">
            {brique.tips.map((t) => <li key={t} className="text-[13.5px] leading-relaxed pl-4 relative" style={{ color: th.fg2 }}><span className="absolute left-0" style={{ color: th.success }}>→</span>{t}</li>)}
          </ul>
        </GCard>
      </section>

      <nav aria-label="Briques voisines" className="fade-up flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2 pb-4" style={{ borderTop: `1px solid ${th.sep}` }}>
        <div className="flex gap-3 pt-5">
          {prev && <VBtn sm onClick={() => navigate(`/astuces/${domain.id}/briques/${prev.id}`)}><ArrowLeft className="w-4 h-4" />{prev.title}</VBtn>}
          {next && <VBtn sm onClick={() => navigate(`/astuces/${domain.id}/briques/${next.id}`)}>{next.title}<ArrowRight className="w-4 h-4" /></VBtn>}
        </div>
        {brique.builder && (
          <div className="sm:pt-5">
            <VBtn sm onClick={() => navigate(`/astuces/${domain.id}/constructeur`)}><Wand2 className="w-4 h-4" />Utiliser dans le constructeur</VBtn>
          </div>
        )}
      </nav>
    </div>
  );
}
