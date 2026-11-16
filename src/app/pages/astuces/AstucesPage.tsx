import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowRight, Camera, Clock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { GCard } from "@/app/components/common/GCard";
import { SectionHead } from "@/app/components/common/SectionHead";
import { AstuceMediaFrame } from "@/app/components/astuces/AstuceMediaFrame";
import { BriquesLibrary } from "@/app/components/astuces/BriquesLibrary";
import { ASTUCE_CAS, ASTUCE_DOMAINS, casMediaKeys, type AstuceCas } from "@/app/data/astuces";

function CasCard({ cas }: { cas: AstuceCas }) {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <GCard onClick={() => navigate(`/astuces/cas/${cas.id}`)} className="group flex flex-col">
      <div className="relative">
        <AstuceMediaFrame mediaKey={casMediaKeys.result(cas)} ratio="1:1" kind="image" label={cas.title} className="rounded-none border-0" />
        {/* Avec une photo de départ : on montre d'où l'on part. */}
        {cas.source && (
          <div className="absolute left-3 bottom-3 w-[30%] shadow-lg">
            <AstuceMediaFrame mediaKey={casMediaKeys.source(cas)} ratio="1:1" kind="image" label={`Photo de départ — ${cas.source.label}`} className="rounded-[6px]" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-black leading-snug" style={{ color: th.fg }}>{cas.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed flex-1" style={{ color: th.fg2 }}>{cas.tagline}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-semibold" style={{ color: th.fg3 }}>
          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{cas.duration}</span>
          {cas.source && <span className="inline-flex items-center gap-1"><Camera className="w-3.5 h-3.5" />Avec ta photo</span>}
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: th.fg }}>
          <span className="ink-link">Voir le pas-à-pas</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </GCard>
  );
}

export function AstucesPage() {
  const th = useTh();
  const { hash } = useLocation();

  // /astuces#briques (fil d'Ariane des pages de brique) : on descend
  // directement à la bibliothèque.
  useEffect(() => {
    if (hash !== "#briques") return;
    const timer = setTimeout(() => document.getElementById("briques")?.scrollIntoView({ block: "start" }), 50);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-12">
      <div className="fade-up">
        <p className="eyebrow" style={{ color: th.fg3 }}>Pratiquer</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>Astuces <GT>IA</GT></h1>
        <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
          Choisis ce que tu veux créer. Pour chaque cas, on te donne le prompt complet, on le décortique brique par brique avec des exemples, et tu l'adaptes à ton projet avant de le lancer dans Le Studio.
        </p>
      </div>

      <section aria-labelledby="astuces-cas" className="fade-up">
        <SectionHead id="astuces-cas" eyebrow={`Images · ${ASTUCE_CAS.length} cas pratiques`} title="Que veux-tu créer ?" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ASTUCE_CAS.map((cas) => <CasCard key={cas.id} cas={cas} />)}
        </div>
      </section>

      <div id="briques" className="scroll-mt-6 pt-4">
        <div role="separator" className="flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: th.sep }} />
          <span className="eyebrow shrink-0" style={{ color: th.fg3 }}>Aller plus loin</span>
          <div className="h-px flex-1" style={{ background: th.sep }} />
        </div>
        <div className="mt-8 max-w-3xl">
          <h2 className="text-[1.6rem] sm:text-[2rem] leading-[1.08] font-black" style={{ color: th.fg }}>Les briques d'un prompt</h2>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: th.fg2 }}>
            Tous les cas ci-dessus utilisent les mêmes briques : le sujet, la lumière, le cadrage, les couleurs… Ici, chaque brique est expliquée en détail, avec son vocabulaire, ses pièges et des variations contrôlées. De quoi écrire n'importe quel prompt, même pour un besoin qui n'est pas dans la liste.
          </p>
        </div>
      </div>

      {ASTUCE_DOMAINS.map((domain) => <BriquesLibrary key={domain.id} domain={domain} />)}
    </div>
  );
}
