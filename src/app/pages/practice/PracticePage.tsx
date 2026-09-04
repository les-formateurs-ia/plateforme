import { useNavigate } from "react-router";
import { Flame, Clock, Zap, ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { PROMPT_CATS } from "@/app/data/mock";

export function PracticePage() {
  const th = useTh();
  const navigate = useNavigate();
  const BLOCKS = [
    { emoji: "📚", title: "Exercices basiques", desc: "Toutes les questions de quiz de ta formation, terminées ou non — révise à volonté.", tag: "QCM du cours", available: true, path: "/practice/basics", color: "#78d5e2", glow: "rgba(106,222,177,0.12)" },
    { emoji: "✨", title: "Exercices pour vous", desc: "Bac à sable HTML/JS — colle du code et vois-le tourner en direct, exactement comme le Playground d'une leçon.", tag: "Playground", available: true, path: "/practice/html", color: `${th.grad2}`, glow: `${th.gradShadow(0.12)}` },
    { emoji: "🎨", title: "Génération images & vidéos", desc: "Entraînement à la rédaction de prompts pour générateurs d'image et de vidéo IA — comparaison avant/après correction.", tag: "IA · Image & Vidéo", available: true, path: "/practice/media", color: "#fbc2ad", glow: "rgba(251,194,173,0.12)" },
    { emoji: "⚡", title: "Exercices prompts", desc: "Entraînement exclusif à la rédaction de prompts professionnels. Aucun QCM — pratique pure.", tag: "20 exercices", available: true, path: "/practice/prompts", color: "#6adeb1", glow: "rgba(106,222,177,0.12)" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Pratique IA</GT></h2><p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Entraîne-toi et construis tes compétences en pratiquant</p></div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shrink-0" style={{ background: "rgba(251,194,173,0.1)", border: "1px solid rgba(251,194,173,0.25)", color: "#fbc2ad" }}><Flame className="w-3.5 h-3.5" />7 jours de suite !</div>
      </div>

      {/* Daily challenge */}
      <div className="rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden flex-wrap sm:flex-nowrap"
        style={{ background: th.isDark ? `linear-gradient(135deg,${th.gradShadow(0.18)},rgba(219,172,240,0.08))` : `linear-gradient(135deg,${th.gradShadow(0.1)},rgba(219,172,240,0.04))`, border: `1px solid ${th.gradShadow(0.25)}` }}>
        <div className="text-3xl shrink-0">⚡</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: th.navAC }}>Défi du jour</div>
          <h3 className="text-sm font-black mb-0.5" style={{ color: th.fg }}>Crée un prompt pour rédiger une fiche de poste IA-ready</h3>
          <p className="text-xs" style={{ color: th.fg3 }}>Objectif : offre complète avec missions, profil et avantages — adaptée à ton secteur</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs flex items-center gap-1" style={{ color: th.fg3 }}><Clock className="w-3 h-3" />15 min · 120 XP</span>
          <VBtn sm><span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />Relever le défi</span></VBtn>
        </div>
      </div>

      {/* 2×2 grid */}
      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: th.fg }}>Choisir un type d'exercice</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BLOCKS.map(({ emoji, title, desc, tag, available, path, color, glow }) => (
            <GCard key={title} className={available ? "hover:scale-[1.01] transition-transform" : ""} onClick={available ? (path ? () => navigate(path) : () => {}) : undefined}>
              <div className="p-6 flex flex-col" style={{ minHeight: 200 }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: glow, border: `1px solid ${color}22` }}>{emoji}</div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>{tag}</span>
                </div>
                <h4 className="text-sm font-black mb-2" style={{ color: th.fg }}>{title}</h4>
                <p className="text-xs leading-relaxed flex-1" style={{ color: th.fg3 }}>{desc}</p>
                <div className="mt-5">
                  {available
                    ? <VBtn sm><span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" />Commencer</span></VBtn>
                    : <span className="inline-block text-xs px-3 py-1.5 rounded-lg" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : `${th.gradShadow(0.05)}`, color: th.fg3, border: `1px solid ${th.sep}` }}>Bientôt disponible</span>
                  }
                </div>
              </div>
            </GCard>
          ))}
        </div>
      </div>

      {/* Prompt library */}
      <GCard><div className="p-5">
        <div className="flex items-center justify-between mb-4"><span className="text-sm font-black" style={{ color: th.fg }}>Bibliothèque de prompts</span><button className="text-xs flex items-center gap-1" style={{ color: th.navAC }}>Voir tout <ArrowRight className="w-3 h-3" /></button></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROMPT_CATS.map(({ emoji, label, count }) => (
            <button key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs text-center transition-colors hover:opacity-80" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : `${th.gradShadow(0.04)}`, border: `1px solid ${th.sep}` }}>
              <span className="text-xl">{emoji}</span><span className="font-medium" style={{ color: th.fg2 }}>{label}</span><span style={{ color: th.fg3 }}>{count} prompts</span>
            </button>
          ))}
        </div>
      </div></GCard>
    </div>
  );
}
