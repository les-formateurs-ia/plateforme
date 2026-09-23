// Blocage côté interface des modules Runware une fois le plafond IA personnel
// atteint — le vrai garde-fou reste checkAiBudget côté edge functions ; ceci
// évite juste à l'élève de remplir un formulaire pour se voir refuser ensuite.
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useProfile } from "@/app/state/profile-context";
import { isAiBudgetExhausted } from "@/app/lib/aiUsage";

export function useAiBudgetExhausted(): boolean {
  const { profile } = useProfile();
  return isAiBudgetExhausted(profile.spentUsd, profile.budgetUsd);
}

export function AiBudgetExhaustedNotice({ compact = false }: { compact?: boolean }) {
  const th = useTh();
  const { profile } = useProfile();
  return (
    <div className={`flex items-start gap-3 rounded-2xl ${compact ? "px-3.5 py-2.5" : "px-5 py-4"}`} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
      <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
      <div className="text-sm" style={{ color: th.fg }}>
        <p className="font-bold">Crédits IA épuisés</p>
        <p style={{ color: th.fg2 }}>Tu as atteint ta limite de {profile.budgetUsd.toFixed(2)} $ de crédits IA. Ces modèles seront de nouveau disponibles une fois ton budget rechargé — contacte ton formateur ou l'administrateur.</p>
      </div>
    </div>
  );
}

export function AiBudgetGate({ children }: { children: ReactNode }) {
  const th = useTh();
  const navigate = useNavigate();
  const exhausted = useAiBudgetExhausted();
  if (!exhausted) return <>{children}</>;
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Le Studio
      </button>
      <AiBudgetExhaustedNotice />
    </div>
  );
}
