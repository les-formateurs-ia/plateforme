import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowRight, Camera, Clock, Lock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { GCard } from "@/app/components/common/GCard";
import { SectionHead } from "@/app/components/common/SectionHead";
import { AstuceMediaFrame } from "@/app/components/astuces/AstuceMediaFrame";
import { BriquesLibrary } from "@/app/components/astuces/BriquesLibrary";
import { OutilLogo, outilAccent } from "@/app/components/astuces/OutilLogo";
import { ASTUCE_CAS, ASTUCE_DOMAINS, casMediaKeys, type AstuceCas, type AstuceDomainId } from "@/app/data/astuces";
import { useAuth } from "@/app/state/auth-context";
import { VisitorMoreNotice } from "@/app/components/common/Visitor";
import { isCasOpenToVisitor } from "@/app/lib/visitor";
import { isAdmin } from "@/app/lib/permissions";
import { GUIDE_OUTILS, articleCount, type GuideOutil } from "@/app/data/guide-outils";

// Une section par domaine : Images (photo de l'élève, logo…), puis Web
// (pages générées par Claude, montrées en vidéo).
const CAS_SECTIONS: { domain: AstuceDomainId; eyebrow: string; title: string; intro?: string }[] = [
  { domain: "image", eyebrow: "Images", title: "Que veux-tu créer ?" },
  {
    domain: "video",
    eyebrow: "Vidéos",
    title: "Fais bouger tes images",
    intro: "Une vidéo se prépare comme une image, avec en plus le mouvement, la caméra et parfois le son. Plusieurs cas partent d'une image : celles des cas ci-dessus prennent vie.",
  },
  {
    domain: "web",
    eyebrow: "Web · avec Claude",
    title: "Ton site, ta page de vente",
    intro: "Ici, pas de génération dans la plateforme : tu découvres comment demander une page à Claude, avec de vraies pages qu'il a créées à partir de ces prompts. Tu n'as plus qu'à copier le tien.",
  },
];

// locked (mode Visiteur) : aperçu seul, la carte ne s'ouvre pas.
function CasCard({ cas, locked = false }: { cas: AstuceCas; locked?: boolean }) {
  const th = useTh();
  const navigate = useNavigate();
  const web = cas.domain === "web";
  return (
    <GCard onClick={locked ? undefined : () => navigate(`/astuces/cas/${cas.id}`)} className="group flex flex-col">
      <div className="relative">
        {locked && (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[11px] font-bold" style={{ background: th.ink, color: th.onInk }}>
            <Lock className="w-3 h-3" />En formation
          </span>
        )}
        {/* Vignette fixe : la version animée est réservée à la page du cas. */}
        <AstuceMediaFrame mediaKey={casMediaKeys.still(cas)} ratio={web ? "16:10" : "1:1"} kind={cas.domain === "video" ? "video" : "image"} label={cas.title} className="rounded-none border-0" />
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
        {locked ? (
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: th.fg3 }}>
            <Lock className="w-3.5 h-3.5" />Disponible en formation
          </span>
        ) : (
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: th.fg }}>
            <span className="ink-link">Voir le pas-à-pas</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </GCard>
  );
}

// « Comprendre les outils » : une carte par IA, ses chapitres en aperçu.
function OutilCard({ outil }: { outil: GuideOutil }) {
  const th = useTh();
  const navigate = useNavigate();
  return (
    <GCard onClick={() => navigate(`/astuces/outils/${outil.id}`)} className="group flex flex-col">
      <div className="h-1" style={{ background: outilAccent(outil.id) }} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-3">
          <OutilLogo id={outil.id} className="w-12 h-12" />
          <div>
            <h3 className="text-lg font-black leading-tight" style={{ color: th.fg }}>{outil.name}</h3>
            <p className="text-[12px] font-semibold" style={{ color: th.fg3 }}>{outil.vendor} · {articleCount(outil)} articles</p>
          </div>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: th.fg2 }}>{outil.tagline}</p>
        <ul className="mt-3 space-y-1 flex-1">
          {outil.chapters.map((c) => (
            <li key={c.id} className="text-[13px] leading-snug pl-4 relative" style={{ color: th.fg }}>
              <span className="absolute left-0" style={{ color: outilAccent(outil.id) }}>›</span>{c.title}
            </li>
          ))}
        </ul>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: th.fg }}>
          <span className="ink-link">Explorer {outil.name}</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </GCard>
  );
}

export function AstucesPage() {
  const th = useTh();
  const { hash } = useLocation();
  const { isVisitor, role } = useAuth();
  // « Comprendre les outils » : visible de l'admin seulement pour l'instant.
  const showOutils = isAdmin(role);

  // /astuces#briques ou #outils (fils d'Ariane) : on descend directement
  // à la section.
  useEffect(() => {
    if (hash !== "#briques" && hash !== "#outils") return;
    const timer = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" }), 50);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-12">
      <div className="fade-up">
        <p className="eyebrow" style={{ color: th.fg3 }}>Pratiquer</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>Guide <GT>IA</GT></h1>
        <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
          Choisis ce que tu veux créer. Pour chaque cas, on te donne le prompt complet, on le décortique brique par brique avec des exemples, et tu l'adaptes à ton projet avant de le lancer dans Le Studio ou dans Claude.
        </p>
      </div>

      {showOutils && (
      <section id="outils" aria-labelledby="astuces-outils" className="fade-up scroll-mt-6">
        <SectionHead id="astuces-outils" eyebrow="Comprendre les outils · Les bases, ChatGPT, Claude, Gemini" title="Comment marche chaque IA" />
        <p className="text-sm max-w-3xl -mt-2 mb-5 leading-relaxed" style={{ color: th.fg2 }}>
          Ce qu'on n'a pas le temps de détailler en vidéo : comment une IA fonctionne vraiment, puis les fonctionnalités, les modèles et les réglages de chaque outil, avec le pourquoi de chaque chose. Commence par « Les bases » si tu débutes. Tout est tiré de la documentation officielle.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {GUIDE_OUTILS.map((outil) => <OutilCard key={outil.id} outil={outil} />)}
        </div>
      </section>
      )}

      {CAS_SECTIONS.map((section) => {
        const cases = ASTUCE_CAS.filter((c) => c.domain === section.domain);
        if (cases.length === 0) return null;
        // Mode Visiteur : un cas pratique ouvert par type d'astuce, les autres en aperçu.
        const lockedCount = isVisitor ? cases.filter((c) => !isCasOpenToVisitor(c.id)).length : 0;
        return (
          <section key={section.domain} aria-labelledby={`astuces-cas-${section.domain}`} className="fade-up">
            <SectionHead id={`astuces-cas-${section.domain}`} eyebrow={`${section.eyebrow} · ${cases.length} cas pratiques`} title={section.title} />
            {section.intro && <p className="text-sm max-w-3xl -mt-2 mb-5 leading-relaxed" style={{ color: th.fg2 }}>{section.intro}</p>}
            <div className={section.domain === "web" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
              {cases.map((cas) => <CasCard key={cas.id} cas={cas} locked={isVisitor && !isCasOpenToVisitor(cas.id)} />)}
            </div>
            {lockedCount > 0 && (
              <div className="mt-4">
                <VisitorMoreNotice>
                  {lockedCount === cases.length
                    ? "Mode visiteur : ces cas pratiques sont présentés en aperçu, leur pas-à-pas complet est disponible en formation."
                    : `Mode visiteur : un cas pratique est ouvert pour essayer, ${lockedCount > 1 ? `les ${lockedCount} autres de cette rubrique sont disponibles` : "l'autre cas de cette rubrique est disponible"} en formation.`}
                </VisitorMoreNotice>
              </div>
            )}
          </section>
        );
      })}

      {isVisitor ? (
        <VisitorMoreNotice>Mode visiteur : la bibliothèque des briques de prompt (anatomie, règles d'or, briques détaillées et constructeur) est disponible en formation.</VisitorMoreNotice>
      ) : (<>
      <div id="briques" className="scroll-mt-6 pt-4">
        <div role="separator" className="flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: th.sep }} />
          <span className="eyebrow shrink-0" style={{ color: th.fg3 }}>Aller plus loin</span>
          <div className="h-px flex-1" style={{ background: th.sep }} />
        </div>
        <div className="mt-8 max-w-3xl">
          <h2 className="text-[1.6rem] sm:text-[2rem] leading-[1.08] font-black" style={{ color: th.fg }}>Les briques d'un prompt image</h2>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: th.fg2 }}>
            Tous les cas Images ci-dessus utilisent les mêmes briques : le sujet, la lumière, le cadrage, les couleurs… Ici, chaque brique est expliquée en détail, avec son vocabulaire, ses pièges et des variations contrôlées. De quoi écrire n'importe quel prompt, même pour un besoin qui n'est pas dans la liste.
          </p>
        </div>
      </div>

      {ASTUCE_DOMAINS.map((domain) => <BriquesLibrary key={domain.id} domain={domain} />)}
      </>)}
    </div>
  );
}
