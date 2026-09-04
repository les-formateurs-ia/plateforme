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
        fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
        background: active ? `linear-gradient(135deg,${th.grad1},${th.grad2})` : `${th.gradShadow(0.12)}`,
        color: active ? "#fff" : `${th.grad1}`,
        border: active ? "1px solid transparent" : `1px solid ${th.gradShadow(0.3)}`,
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
