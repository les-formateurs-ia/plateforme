import { Check } from "lucide-react";
import { useTh } from "@/app/theme/theme";

// Bouton "Enregistrer" à état : gris/désactivé, violet dès qu'actionnable,
// puis se transforme en pastille avec une coche une fois l'enregistrement effectué.
export type SaveButtonState = "disabled" | "active" | "saving" | "saved";

export function SaveButton({
  state, onClick, label = "Enregistrer", savingLabel = "Enregistrement...",
}: {
  state: SaveButtonState;
  onClick: () => void;
  label?: string;
  savingLabel?: string;
}) {
  const th = useTh();
  const saved = state === "saved";
  const purple = state === "active" || state === "saving";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== "active"}
      className="rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-[0.98]"
      style={{
        ...(saved ? { width: 40, height: 40, padding: 0 } : { padding: "10px 20px" }),
        background: purple || saved ? `linear-gradient(135deg,${th.grad1},${th.grad2})` : th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.05)",
        boxShadow: purple || saved ? `0 2px 12px ${th.gradShadow(0.35)}` : "none",
        color: purple || saved ? "#fff" : th.fg3,
        cursor: state === "active" ? "pointer" : "default",
      }}
    >
      {saved ? <Check className="w-4 h-4" /> : state === "saving" ? savingLabel : label}
    </button>
  );
}
