import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GT } from "@/app/components/common/GT";
import imgImages from "@/imports/Créer vos images.png";
import imgVideos from "@/imports/Imaginez vos vidéos.png";
import imgMusiques from "@/imports/Concevez vos propres musiques.png";
import imgTalkingHead from "@/imports/Faites parler vos images.png";
import imgTextToSpeech from "@/imports/Du texte à l'audio.png";
import imgDoublage from "@/imports/Parlez n'importe quelle langue.png";
import imgFaceSwap from "@/imports/Prenez l'apparence de qui vous voulez.png";

// `restricted` : modules pas encore prêts (intégration API à venir) —
// visibles en aperçu (grisé, non cliquable) pour l'admin seulement, masqués
// pour le formateur et l'élève.
const STUDIO_MODULES = [
  { slug: "images",       image: imgImages,       title: "Créer vos images",                      subtitle: "Text-to-Image",                    desc: "Génère des visuels percutants à partir d'une simple description.", restricted: false },
  { slug: "videos",       image: imgVideos,       title: "Imaginez vos vidéos",                    subtitle: "Text/Image-to-Video",              desc: "Transforme un texte ou une image en vidéo animée.",                restricted: false },
  { slug: "musiques",     image: imgMusiques,     title: "Concevez vos propres musiques",          subtitle: "Text-to-Music",                    desc: "Compose une bande originale unique pour tes créations.",           restricted: true },
  { slug: "talking-head", image: imgTalkingHead,  title: "Faites parler vos images",               subtitle: "Lip-sync / Talking Head",          desc: "Anime et synchronise les lèvres de tes visuels sur un discours.",  restricted: true },
  { slug: "text-to-speech", image: imgTextToSpeech, title: "Du texte à l'audio",                   subtitle: "Text-to-Speech",                   desc: "Convertis instantanément un script écrit en voix naturelle.",      restricted: true },
  { slug: "doublage",     image: imgDoublage,     title: "Parlez n'importe quelle langue",         subtitle: "Traduction & Doublage audio",      desc: "Traduis et double automatiquement l'audio de tes vidéos.",         restricted: true },
  { slug: "face-swap",    image: imgFaceSwap,     title: "Prenez l'apparence de qui vous voulez",  subtitle: "Face Swap / Avatar",               desc: "Incarne un avatar ou échange de visage sur tes vidéos.",           restricted: true },
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
        {visibleModules.map(({ slug, image, title, subtitle, desc, restricted }) => (
          <div key={slug} className={`relative rounded-3xl overflow-hidden transition-transform ${restricted ? "opacity-45 cursor-default" : "group cursor-pointer hover:scale-[1.01]"}`}
            style={{ minHeight: 220 }}
            onClick={restricted ? undefined : () => navigate(`/studio/${slug}`)}>
            {/* url() entre guillemets : certains fichiers (ex. "Du texte à l'audio.png") ont une
                apostrophe dans leur nom, invalide dans un url() CSS non quoté — sans les
                guillemets, le navigateur rejette toute la déclaration et l'image disparaît. */}
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${image}")`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(10,10,16,0.15) 0%,rgba(10,10,16,0.75) 100%)" }} />
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
