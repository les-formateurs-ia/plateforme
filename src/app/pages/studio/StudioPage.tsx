import { useNavigate } from "react-router";
import { ArrowRight, Image as ImageIcon, Video, Music, Speech, Volume2, Languages, UserRoundCog } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GT } from "@/app/components/common/GT";

// Visuels/illustrations de chaque carte : en attente de validation du dossier
// d'assets par le Product Owner (cf. ticket "Le Studio") — un dégradé +
// icône sert de placeholder, à remplacer par `image` une fois le dossier
// livré, sans changer la structure de la grille.
// `restricted` : modules pas encore prêts (intégration API à venir) —
// visibles en aperçu (grisé, non cliquable) pour l'admin seulement, masqués
// pour le formateur et l'élève.
const STUDIO_MODULES = [
  { slug: "images",       Icon: ImageIcon,    title: "Créer vos images",                      subtitle: "Text-to-Image",                    desc: "Génère des visuels percutants à partir d'une simple description.", colors: ["#f97362", "#fbc2ad"] as const, restricted: false },
  { slug: "videos",       Icon: Video,        title: "Imaginez vos vidéos",                    subtitle: "Text/Image-to-Video",              desc: "Transforme un texte ou une image en vidéo animée.",                colors: ["#6a8dde", "#78d5e2"] as const, restricted: false },
  { slug: "musiques",     Icon: Music,        title: "Concevez vos propres musiques",          subtitle: "Text-to-Music",                    desc: "Compose une bande originale unique pour tes créations.",           colors: ["#b58de0", "#dbacf0"] as const, restricted: true },
  { slug: "talking-head", Icon: Speech,       title: "Faites parler vos images",               subtitle: "Lip-sync / Talking Head",          desc: "Anime et synchronise les lèvres de tes visuels sur un discours.",  colors: ["#6adeb1", "#78d5e2"] as const, restricted: true },
  { slug: "text-to-speech", Icon: Volume2,    title: "Du texte à l'audio",                     subtitle: "Text-to-Speech",                   desc: "Convertis instantanément un script écrit en voix naturelle.",      colors: ["#fbc2ad", "#fceccd"] as const, restricted: true },
  { slug: "doublage",     Icon: Languages,    title: "Parlez n'importe quelle langue",         subtitle: "Traduction & Doublage audio",      desc: "Traduis et double automatiquement l'audio de tes vidéos.",         colors: ["#78d5e2", "#b58de0"] as const, restricted: true },
  { slug: "face-swap",    Icon: UserRoundCog, title: "Prenez l'apparence de qui vous voulez",  subtitle: "Face Swap / Avatar",               desc: "Incarne un avatar ou échange de visage sur tes vidéos.",           colors: ["#dbacf0", "#f97362"] as const, restricted: true },
];

export function StudioPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdminRole = role === "admin";
  const visibleModules = STUDIO_MODULES.filter((m) => !m.restricted || isAdminRole);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Le Studio</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Pratique la génération multimédia avec de vrais modèles d'IA — image, vidéo, musique, voix et avatar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleModules.map(({ slug, Icon, title, subtitle, desc, colors, restricted }) => (
          <div key={slug} className={`relative rounded-3xl overflow-hidden transition-transform ${restricted ? "opacity-45 cursor-default" : "group cursor-pointer hover:scale-[1.01]"}`}
            style={{ minHeight: 220, background: `linear-gradient(135deg,${colors[0]},${colors[1]})` }}
            onClick={restricted ? undefined : () => navigate(`/studio/${slug}`)}>
            <Icon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-15 text-white" strokeWidth={1.25} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(10,10,16,0.05) 0%,rgba(10,10,16,0.55) 100%)" }} />
            <div className="relative h-full flex flex-col justify-between p-5" style={{ minHeight: 220 }}>
              <div>
                <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)" }}>{subtitle}</span>
                <h3 className="text-lg font-black text-white leading-snug">{title}</h3>
                <p className="text-xs text-white/80 mt-1.5 leading-relaxed max-w-[85%]">{desc}</p>
              </div>
              <button disabled={restricted} className="self-start flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-full transition-colors disabled:pointer-events-none hover:bg-white"
                style={{ background: "rgba(255,255,255,0.92)", color: "#0f0e14" }}>
                Créer maintenant <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
