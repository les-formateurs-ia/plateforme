import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
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
import { CHAT_PROVIDERS } from "@/app/lib/studioChat";
import imgChatGPT from "@/imports/chatgpt_logo.png";
import imgGemini from "@/imports/gemini_logo.png";
import imgClaude from "@/imports/claude_logo.png";

// `restricted` : modules pas encore prêts (intégration API à venir) —
// visibles en aperçu (grisé, non cliquable) pour l'admin seulement, masqués
// pour le formateur et l'élève.
const CHAT_COVERS = { openai: imgChatGPT, gemini: imgGemini, anthropic: imgClaude };
const CHAT_MODULES = (["openai", "gemini", "anthropic"] as const).map((id) => {
  const p = CHAT_PROVIDERS[id];
  return { slug: p.slug, image: CHAT_COVERS[id], title: `Discutez avec ${p.name}`, subtitle: `Chat IA · ${p.company}`, desc: "", restricted: false };
});

const STUDIO_MODULES: { slug: string; image: string | null; background?: string; title: string; subtitle: string; desc: string; restricted: boolean }[] = [
  ...CHAT_MODULES,
  { slug: "images",       image: imgImages,       title: "Créer vos images",                      subtitle: "Text-to-Image",                    desc: "Génère des visuels percutants à partir d'une simple description.", restricted: false },
  { slug: "videos",       image: imgVideos,       title: "Imaginez vos vidéos",                    subtitle: "Text/Image-to-Video",              desc: "Transforme un texte ou une image en vidéo animée.",                restricted: false },
  { slug: "musiques",     image: imgMusiques,     title: "Concevez vos propres musiques",          subtitle: "Text-to-Music",                    desc: "Compose une bande originale unique pour tes créations.",           restricted: false },
  { slug: "talking-head", image: imgTalkingHead,  title: "Faites parler vos images",               subtitle: "Lip-sync / Talking Head",          desc: "Anime et synchronise les lèvres de tes visuels sur un discours.",  restricted: false },
  { slug: "text-to-speech", image: imgTextToSpeech, title: "Du texte à l'audio",                   subtitle: "Text-to-Speech",                   desc: "Convertis instantanément un script écrit en voix naturelle.",      restricted: false },
  { slug: "doublage",     image: imgDoublage,     title: "Parlez n'importe quelle langue",         subtitle: "Traduction & Doublage audio",      desc: "Traduis et double automatiquement l'audio de tes vidéos.",         restricted: false },
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
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}><GT>Le Studio</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Discute avec ChatGPT, Gemini et Claude, et pratique la génération multimédia avec de vrais modèles d'IA — image, vidéo, musique, voix et avatar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {visibleModules.map(({ slug, image, background, title, subtitle, restricted }) => (
          <div key={slug} className={`relative w-full min-h-[220px] md:min-h-[260px] rounded-2xl overflow-hidden transition-transform ${restricted ? "opacity-45 cursor-default" : "group"}`}
            style={{ aspectRatio: "3 / 2" }}>
            {/* url() entre guillemets : certains fichiers (ex. "Du texte à l'audio.png") ont une
                apostrophe dans leur nom, invalide dans un url() CSS non quoté — sans les
                guillemets, le navigateur rejette toute la déclaration et l'image disparaît. */}
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={image ? { backgroundImage: `url("${image}")`, backgroundSize: "cover", backgroundPosition: "center" } : { background }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(10,10,16,0.15) 0%,rgba(10,10,16,0.75) 100%)" }} />
            <div className="relative h-full flex flex-col justify-between gap-5 p-4 sm:p-3">
              <div>
                <span className="inline-block text-xs sm:text-[13px] font-semibold px-3 sm:px-4 py-1 rounded-full mb-3 self-start" style={{ background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)" }}>{subtitle}</span>
                <h3 className="font-black text-white leading-tight break-words max-w-[92%] sm:max-w-[78%] text-[20px] min-[381px]:text-[22px] sm:text-[30px] lg:text-[34px]">{title}</h3>
              </div>
              {!restricted && (
                <button
                  onClick={() => navigate(`/studio/${slug}`)}
                  className="inline-flex items-center gap-2 self-start text-sm sm:text-base font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors"
                  style={{ background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                >
                  Créer maintenant
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
