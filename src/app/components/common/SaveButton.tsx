import { Check } from "lucide-react";
import { useTh } from "@/app/theme/theme";

// Bouton "Enregistrer" à état : gris/désactivé, à l'encre dès qu'actionnable,
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
      className={`${state === "active" ? "sweep " : ""}rounded-[2px] font-semibold transition-all duration-300 flex items-center justify-center gap-1.5`}
      style={{
        ...(saved ? { width: 40, height: 40, padding: 0 } : { padding: "10px 20px" }),
        background: purple || saved ? th.ink : th.navA,
        color: purple || saved ? th.onInk : th.fg3,
        cursor: state === "active" ? "pointer" : "default",
      }}
    >
      {saved ? <Check className="w-4 h-4" /> : state === "saving" ? savingLabel : label}
    </button>
  );
}
