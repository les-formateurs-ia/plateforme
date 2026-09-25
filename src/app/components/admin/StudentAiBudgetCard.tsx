// Budget IA Runware d'un élève, vu par le staff : consommation / plafond,
// historique des ajustements, et ajout/retrait de crédits (admin seulement —
// le formateur voit sans pouvoir modifier, cf. admin_add_ai_credits).
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import { AiBudgetBar } from "@/app/components/common/AiBudgetBar";
import { addAiCredits, getStudentAiBudget, isAiBudgetExhausted, type AiBudgetTopup } from "@/app/lib/aiUsage";

const QUICK_AMOUNTS = [10, 25, 50];

export function StudentAiBudgetCard({ studentId, canTopUp }: { studentId: string; canTopUp: boolean }) {
  const th = useTh();
  const [budget, setBudget] = useState<{ spentUsd: number; budgetUsd: number; topups: AiBudgetTopup[] } | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => getStudentAiBudget(studentId).then(setBudget).catch((err) => {
    console.error(err);
    toast.error("Impossible de charger le budget IA.");
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // value > 0 : ajout ; value < 0 : retrait (le plafond ne descend pas sous 0).
  const adjust = async (value: number) => {
    if (!Number.isFinite(value) || value === 0) {
      toast.error("Indique un montant positif.");
      return;
    }
    if (budget && budget.budgetUsd + value < 0) {
      toast.error(`Impossible de retirer plus que le plafond actuel (${budget.budgetUsd.toFixed(2)} $).`);
      return;
    }
    setSaving(true);
    try {
      await addAiCredits(studentId, value);
      toast.success(value > 0 ? `${value.toFixed(2)} $ de crédits IA ajoutés.` : `${(-value).toFixed(2)} $ de crédits IA retirés.`);
      setAmount("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ajustement impossible.");
    } finally {
      setSaving(false);
    }
  };

  if (!budget) return null;
  const exhausted = isAiBudgetExhausted(budget.spentUsd, budget.budgetUsd);
  const remaining = Math.max(0, budget.budgetUsd - budget.spentUsd);
  const typedAmount = Math.abs(Number(amount.replace(",", ".")));
  const chipStyle = { background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg };
  const chipClass = "text-xs font-semibold px-3 py-2 rounded-full transition-opacity hover:opacity-80 disabled:opacity-50";

  return (
    <GCard className="min-w-0">
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black" style={{ color: th.fg }}>Crédits IA (Runware)</h3>
          {exhausted && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>Épuisés — modèles bloqués</span>}
        </div>

        <AiBudgetBar spentUsd={budget.spentUsd} capUsd={budget.budgetUsd} size="lg" />
        <p className="text-xs" style={{ color: th.fg3 }}>Reste {remaining.toFixed(2)} $. Gemini n'est pas décompté ; tous les modèles Runware sont bloqués dès que la consommation atteint le plafond.</p>

        {canTopUp && (
          <div className="space-y-2">
            <label className="block text-xs font-bold" style={{ color: th.fg }}>Ajuster le plafond</label>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <button key={v} type="button" disabled={saving} onClick={() => adjust(v)} className={chipClass} style={chipStyle}>
                  +{v} $
                </button>
              ))}
              {QUICK_AMOUNTS.map((v) => (
                <button key={-v} type="button" disabled={saving || budget.budgetUsd < v} onClick={() => adjust(-v)} className={chipClass} style={chipStyle}>
                  −{v} $
                </button>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Montant ($)"
                  disabled={saving}
                  className="w-28 rounded-xl px-3 py-2 text-sm outline-none"
                  style={chipStyle}
                />
                <VBtn sm onClick={() => adjust(typedAmount)} disabled={saving || !amount}>
                  <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Ajouter</span>
                </VBtn>
                <VBtn sm onClick={() => adjust(-typedAmount)} disabled={saving || !amount}>
                  <span className="flex items-center gap-1"><Minus className="w-3.5 h-3.5" />Retirer</span>
                </VBtn>
              </div>
            </div>
          </div>
        )}

        {budget.topups.length > 0 && (
          <div>
            <p className="text-xs font-bold mb-1.5" style={{ color: th.fg }}>Ajustements</p>
            <ul className="space-y-1">
              {budget.topups.map((t) => (
                <li key={t.id} className="flex justify-between text-xs" style={{ color: th.fg2 }}>
                  <span>{new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="font-semibold" style={t.amountUsd < 0 ? { color: "#ef4444" } : undefined}>
                    {t.amountUsd < 0 ? "−" : "+"}{Math.abs(t.amountUsd).toFixed(2)} $
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GCard>
  );
}
