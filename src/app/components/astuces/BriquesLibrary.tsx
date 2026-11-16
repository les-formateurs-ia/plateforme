import { useNavigate } from "react-router";
import { Wand2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { SectionHead } from "@/app/components/common/SectionHead";
import { AstuceMediaFrame } from "@/app/components/astuces/AstuceMediaFrame";
import { BriqueSchema, hasBriqueSchema } from "@/app/components/astuces/BriqueSchema";
import { PromptBlock } from "@/app/components/astuces/PromptBlock";
import { PromptAnatomy, briqueNumber, briqueTint } from "@/app/components/astuces/shared";
import { anatomyPrompt, domainMediaKind, mediaKeys, type AstuceDomain } from "@/app/data/astuces";
import { studioLink } from "@/app/lib/astucesMedia";

// La grammaire générale du prompt d'un domaine (anatomie, règles d'or,
// briques, constructeur), affichée sous les cas pratiques.
export function BriquesLibrary({ domain }: { domain: AstuceDomain }) {
  const th = useTh();
  const navigate = useNavigate();
  const kind = domainMediaKind(domain);
  const prefix = `astuces-${domain.id}`;

  return (
    <div className="space-y-14">
      <section aria-labelledby={`${prefix}-anatomie`} className="fade-up">
        <SectionHead id={`${prefix}-anatomie`} eyebrow="Anatomie d'un prompt" title="Un bon prompt, brique par brique" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] gap-6 items-start">
          <div className="space-y-5 min-w-0">
            <p className="text-sm" style={{ color: th.fg3 }}>Survole un passage pour voir à quelle brique il correspond, clique pour l'apprendre.</p>
            <PromptAnatomy domain={domain} />
            <PromptBlock text={anatomyPrompt(domain)} studioTo={studioLink(domain.studio, anatomyPrompt(domain), domain.anatomy.ratio)} />
          </div>
          <AstuceMediaFrame mediaKey={mediaKeys.anatomy(domain)} ratio={domain.anatomy.ratio} kind={kind} withSound={domain.anatomy.audio}
            label="Résultat du prompt ci-contre" />
        </div>
      </section>

      <section aria-labelledby={`${prefix}-regles`} className="fade-up">
        <SectionHead id={`${prefix}-regles`} eyebrow="Règles d'or" title="Cinq réflexes à prendre" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {domain.principles.map((p, i) => (
            <GCard key={p.title} className="p-4">
              <p className="text-xs font-black" style={{ color: th.fg3 }}>{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-[15px] font-black leading-snug" style={{ color: th.fg }}>{p.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: th.fg2 }}>{p.text}</p>
            </GCard>
          ))}
        </div>
      </section>

      <section aria-labelledby={`${prefix}-briques`} className="fade-up">
        <SectionHead id={`${prefix}-briques`} eyebrow={`${domain.briques.length} briques`} title="Toutes les briques d'un prompt" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {domain.briques.map((brique) => {
            const tint = briqueTint(domain, brique.id);
            return (
              <GCard key={brique.id} onClick={() => navigate(`/astuces/${domain.id}/briques/${brique.id}`)} className="group flex flex-col">
                {/* Schéma du concept (les photos montrent les variations, sur la page de la brique). */}
                <div className="relative aspect-video flex items-center justify-center overflow-hidden" style={{ background: `${tint}${th.isDark ? "26" : "33"}`, color: th.fg }}>
                  {hasBriqueSchema(brique.id) ? (
                    <BriqueSchema briqueId={brique.id} tint={tint} className="w-[82%] transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <span className="absolute left-4 bottom-3 text-[2.6rem] font-black leading-none">{briqueNumber(domain, brique.id)}</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: briqueTint(domain, brique.id) }} />
                    <span className="text-[11px] font-bold" style={{ color: th.fg3 }}>BRIQUE {briqueNumber(domain, brique.id)}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-black" style={{ color: th.fg }}>{brique.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed flex-1" style={{ color: th.fg2 }}>{brique.question}</p>
                </div>
              </GCard>
            );
          })}
        </div>
      </section>

      <section aria-labelledby={`${prefix}-constructeur`} className="fade-up pb-4">
        <GCard accent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-5 md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow" style={{ color: th.fg3 }}>Constructeur libre</p>
              <h2 id={`${prefix}-constructeur`} className="mt-2 text-[1.35rem] sm:text-[1.6rem] font-black leading-tight" style={{ color: th.fg }}>
                Ton besoin n'est pas dans la liste ?
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: th.fg2 }}>
                Assemble ton propre prompt en choisissant une option pour chaque brique (ou en écrivant la tienne), puis lance-le dans Le Studio avec {domain.studio.modelLabel}.
              </p>
            </div>
            <ShimBtn onClick={() => navigate(`/astuces/${domain.id}/constructeur`)}><Wand2 className="w-4 h-4" />Ouvrir le constructeur</ShimBtn>
          </div>
        </GCard>
      </section>
    </div>
  );
}
