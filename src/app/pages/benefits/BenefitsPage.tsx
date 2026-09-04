import { CheckCircle, Calendar, ExternalLink, Layers } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { AI_TOOLS, PROMPT_CATS } from "@/app/data/mock";

export function BenefitsPage() {
  const th = useTh();
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div><h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Mes avantages</GT></h2><p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Inclus dans ta formation — ressources exclusives pour aller plus loin</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GCard glow>
          <div className="p-6 flex flex-col">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{ background: `${th.gradShadow(0.12)}`, border: `1px solid ${th.gradShadow(0.25)}` }}>🎓</div>
            <h3 className="text-base font-black mb-2" style={{ color: th.fg }}>Session Expert IA</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: th.fg2 }}>Échange 1:1 en visio avec un expert IA certifié. Pose tes questions et prépare ta certification.</p>
            <div className="space-y-2 mb-5 flex-1">
              {["1 appel par semaine inclus", "Formateur certifié IA", "Replay disponible 30 jours", "Feedback personnalisé"].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs" style={{ color: th.fg2 }}><CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: th.navAC }} />{f}</div>
              ))}
            </div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><Calendar className="w-4 h-4" />Planifier un échange</span></ShimBtn>
            <p className="text-[10px] text-center mt-2" style={{ color: th.fg3 }}>Prochaine dispo : mer. 14h00</p>
          </div>
        </GCard>

        <GCard>
          <div className="p-6 flex flex-col">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{ background: "rgba(106,222,177,0.1)", border: "1px solid rgba(106,222,177,0.2)" }}>🤖</div>
            <h3 className="text-base font-black mb-2" style={{ color: th.fg }}>Meilleurs IA du marché</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: th.fg2 }}>Accès gratuit aux modèles IA premium les plus puissants — inclus sans frais supplémentaires.</p>
            <div className="space-y-2 mb-5 flex-1">
              {AI_TOOLS.map(({ name, sub, color, letter }) => (
                <div key={name} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : `${th.gradShadow(0.04)}`, border: `1px solid ${th.sep}` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{letter}</div>
                  <div className="flex-1 min-w-0"><div className="text-xs font-bold" style={{ color: th.fg }}>{name}</div><div className="text-[10px]" style={{ color: th.fg3 }}>{sub}</div></div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: "#6adeb1", background: "rgba(106,222,177,0.1)" }}>Gratuit</span>
                </div>
              ))}
            </div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" />Accéder aux outils</span></ShimBtn>
          </div>
        </GCard>

        <GCard>
          <div className="p-6 flex flex-col">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{ background: "rgba(251,194,173,0.1)", border: "1px solid rgba(251,194,173,0.2)" }}>📚</div>
            <h3 className="text-base font-black mb-2" style={{ color: th.fg }}>Bibliothèque de Prompts</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: th.fg2 }}>200+ prompts professionnels testés, organisés par métier et par cas d'usage.</p>
            <div className="grid grid-cols-2 gap-1.5 mb-5 flex-1">
              {PROMPT_CATS.map(({ emoji, label, count }) => (
                <button key={label} className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:opacity-80 transition-opacity" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : `${th.gradShadow(0.04)}`, border: `1px solid ${th.sep}` }}>
                  <span className="text-sm">{emoji}</span>
                  <div className="min-w-0"><div className="text-[10px] font-medium truncate" style={{ color: th.fg2 }}>{label}</div><div className="text-[9px]" style={{ color: th.fg3 }}>{count}</div></div>
                </button>
              ))}
            </div>
            <ShimBtn full sm><span className="flex items-center justify-center gap-2"><Layers className="w-4 h-4" />Explorer la bibliothèque</span></ShimBtn>
          </div>
        </GCard>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: th.fg3 }}>Autres avantages inclus</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[{ emoji: "🏆", title: "Certification reconnue", desc: "Diplôme IA Pro reconnu par 150+ entreprises" }, { emoji: "💼", title: "Réseau Alumni", desc: "Communauté privée de 2 400 diplômés" }, { emoji: "📈", title: "Mises à jour gratuites", desc: "Nouveaux modules IA intégrés sans surcoût" }, { emoji: "🎯", title: "Coaching carrière", desc: "1 session RH pour ton positionnement IA" }].map(({ emoji, title, desc }) => (
            <GCard key={title}><div className="p-4"><span className="text-2xl block mb-2">{emoji}</span><div className="text-sm font-bold mb-1" style={{ color: th.fg }}>{title}</div><div className="text-xs leading-relaxed" style={{ color: th.fg3 }}>{desc}</div></div></GCard>
          ))}
        </div>
      </div>
    </div>
  );
}
