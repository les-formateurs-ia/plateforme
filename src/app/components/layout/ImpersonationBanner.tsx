import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useImpersonation } from "@/app/state/impersonation-context";

// Couleur "alerte" fixe (déjà utilisée pour la pastille incident dans
// MainLayout) — volontairement PAS un dégradé de rôle (th.grad1/2), pour ne
// pas laisser croire que ce bandeau est une simple couleur d'accent admin.
const ALERT_COLOR = "#fb7185";

export function ImpersonationBanner() {
  const { isImpersonating, targetName, staffBasePath, stopImpersonating } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleReturn = async () => {
    try {
      await stopImpersonating();
      navigate(`${staffBasePath ?? "/admin"}/planning`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  };

  return (
    <div className="shrink-0 h-10 flex items-center justify-between gap-3 px-4" style={{ background: ALERT_COLOR, color: "#fff" }}>
      <span className="text-sm font-semibold truncate">
        Vous êtes connecté en tant que <strong>{targetName}</strong>
      </span>
      <button
        onClick={handleReturn}
        className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-opacity hover:opacity-90"
        style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff" }}
      >
        Retour à mon compte
      </button>
    </div>
  );
}
