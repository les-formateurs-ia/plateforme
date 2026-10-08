import { X } from "lucide-react";
import { useTh } from "@/app/theme/theme";

// Petite pastille pour un tag d'exercice HTML — cartes, filtre, éditeur.
export function ExerciseTagPill({ label, onRemove, active, onClick }: {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  onClick?: () => void;
}) {
  const th = useTh();
  const clickable = !!onClick;
  return (
    <span
      onClick={onClick}
      className={clickable ? "cursor-pointer transition-opacity hover:opacity-80" : undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 2,
        background: active ? th.ink : "transparent",
        color: active ? th.onInk : th.fg2,
        border: `1px solid ${active ? th.ink : th.inputB}`,
      }}
    >
      {label}
      {onRemove && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hover:opacity-70">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}
