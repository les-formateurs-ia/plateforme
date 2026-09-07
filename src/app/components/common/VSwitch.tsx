import { useTh } from "@/app/theme/theme";

// Interrupteur maison (piste + poignée qui glisse) — le primitive Radix de
// ui/switch.tsx s'appuie sur des variables CSS (--primary, --switch-background)
// non branchées sur useTh() et rendait un gris quasi invisible en thème clair.
// Ici : gris neutre à gauche quand inactif, dégradé d'accent du rôle à droite
// quand actif, comme le reste des états actifs de l'app.
export function VSwitch({ checked, onCheckedChange, disabled }: {
  checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean;
}) {
  const th = useTh();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className="relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        width: 40, height: 24, padding: 2,
        background: checked ? `linear-gradient(135deg,${th.grad1},${th.grad2})` : (th.isDark ? "rgba(255,255,255,0.16)" : "rgba(15,14,20,0.16)"),
        boxShadow: checked ? `0 1px 6px ${th.gradShadow(0.4)}` : "inset 0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      <span
        className="block rounded-full bg-white transition-transform duration-200 ease-out"
        style={{ width: 20, height: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}
