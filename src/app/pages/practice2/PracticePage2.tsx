import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { useAuth } from "@/app/state/auth-context";

const COUNT_WORDS = ["Aucun", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"];

export function PracticePage2() {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdminRole = role === "admin";
  // `restricted` : même règle que les modules non prêts du Studio (cf. StudioPage) —
  // visibles en aperçu (grisé, non cliquable) pour l'admin seulement, masqués
  // pour le formateur et l'élève. Les routes sont aussi réservées à l'admin (App.tsx).
  const BLOCKS = [
    { emoji: "⚔️", title: "Battle Ground", desc: "Envoie un même prompt à plusieurs IA (Gemini, GPT-4o, Claude) et compare leurs réponses côte à côte.", tag: "Comparaison de modèles", path: "/practice/battle-ground", color: "#fbc2ad", glow: "rgba(251,194,173,0.12)", restricted: false },
    { emoji: "🎯", title: "Rétro-ingénierie", desc: "Une image cible est générée automatiquement. À toi de deviner le prompt qui a permis de la créer.", tag: "Reverse Prompting", path: "/practice/reverse-prompting", color: "#78d5e2", glow: "rgba(120,213,226,0.12)", restricted: false },
    { emoji: "🕵️", title: "Détection Image IA", desc: "Réelle ou générée par IA ? Devine et découvre l'explication derrière chaque image.", tag: "Vrai ou Faux", path: "/practice/ai-detection", color: "#6adeb1", glow: "rgba(106,222,177,0.12)", restricted: true },
    { emoji: "✨", title: "Exercices pour vous", desc: "Bac à sable HTML/JS — colle du code et vois-le tourner en direct, exactement comme le Playground d'une leçon.", tag: "Playground", path: "/practice/html", color: `${th.grad2}`, glow: `${th.gradShadow(0.12)}`, restricted: true },
    { emoji: "🎨", title: "Génération images & vidéos", desc: "Entraînement à la rédaction de prompts pour générateurs d'image et de vidéo IA — comparaison avant/après correction.", tag: "IA · Image & Vidéo", path: "/practice/media", color: "#fbc2ad", glow: "rgba(251,194,173,0.12)", restricted: false },
    { emoji: "⚡", title: "Exercices prompts", desc: "Entraînement exclusif à la rédaction de prompts professionnels. Aucun QCM — pratique pure.", tag: "20 exercices", path: "/practice/prompts", color: "#6adeb1", glow: "rgba(106,222,177,0.12)", restricted: false },
  ];
  const visibleBlocks = BLOCKS.filter((b) => !b.restricted || isAdminRole);
  const availableCount = visibleBlocks.filter((b) => !b.restricted).length;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Exercez-vous !</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>{COUNT_WORDS[availableCount] ?? availableCount} ateliers pratiques pour affûter ton regard sur l'IA générative</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleBlocks.map(({ emoji, title, desc, tag, path, color, glow, restricted }) => (
          <GCard key={title} className={restricted ? "opacity-45 cursor-default" : "hover:scale-[1.01] transition-transform"} onClick={restricted ? undefined : () => navigate(path)}>
            <div className="p-6 flex flex-col" style={{ minHeight: 220 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: glow, border: `1px solid ${color}22` }}>{emoji}</div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>{tag}</span>
              </div>
              <h4 className="text-sm font-black mb-2" style={{ color: th.fg }}>{title}</h4>
              <p className="text-xs leading-relaxed flex-1" style={{ color: th.fg3 }}>{desc}</p>
              {!restricted && <div className="mt-5">
                <VBtn sm><span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" />Commencer</span></VBtn>
              </div>}
            </div>
          </GCard>
        ))}
      </div>
    </div>
  );
}
