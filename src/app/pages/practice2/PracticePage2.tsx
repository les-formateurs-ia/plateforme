import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";

const BLOCKS = [
  { emoji: "⚔️", title: "Battle Ground", desc: "Envoie un même prompt à plusieurs IA (Gemini, GPT-4o, Claude) et compare leurs réponses côte à côte.", tag: "Comparaison de modèles", path: "/practice2/battle-ground", color: "#fbc2ad", glow: "rgba(251,194,173,0.12)" },
  { emoji: "🎯", title: "Rétro-ingénierie", desc: "Une image cible est générée automatiquement. À toi de deviner le prompt qui a permis de la créer.", tag: "Reverse Prompting", path: "/practice2/reverse-prompting", color: "#78d5e2", glow: "rgba(120,213,226,0.12)" },
  { emoji: "🕵️", title: "Détection Image IA", desc: "Réelle ou générée par IA ? Devine et découvre l'explication derrière chaque image.", tag: "Vrai ou Faux", path: "/practice2/ai-detection", color: "#6adeb1", glow: "rgba(106,222,177,0.12)" },
];

export function PracticePage2() {
  const th = useTh();
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Exercez-vous 2 !</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Trois ateliers pratiques pour affûter ton regard sur l'IA générative</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BLOCKS.map(({ emoji, title, desc, tag, path, color, glow }) => (
          <GCard key={title} className="hover:scale-[1.01] transition-transform" onClick={() => navigate(path)}>
            <div className="p-6 flex flex-col" style={{ minHeight: 220 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: glow, border: `1px solid ${color}22` }}>{emoji}</div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>{tag}</span>
              </div>
              <h4 className="text-sm font-black mb-2" style={{ color: th.fg }}>{title}</h4>
              <p className="text-xs leading-relaxed flex-1" style={{ color: th.fg3 }}>{desc}</p>
              <div className="mt-5">
                <VBtn sm><span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" />Commencer</span></VBtn>
              </div>
            </div>
          </GCard>
        ))}
      </div>
    </div>
  );
}
