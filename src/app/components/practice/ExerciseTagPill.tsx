import { X } from "lucide-react";

// Petite pastille pour un tag d'exercice HTML — cartes, filtre, éditeur.
export function ExerciseTagPill({ label, onRemove, active, onClick }: {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <span
      onClick={onClick}
      className={clickable ? "cursor-pointer transition-opacity hover:opacity-80" : undefined}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
        background: active ? "linear-gradient(135deg,#b58de0,#dbacf0)" : "rgba(181,141,224,0.12)",
        color: active ? "#fff" : "#b58de0",
        border: active ? "1px solid transparent" : "1px solid rgba(181,141,224,0.3)",
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
