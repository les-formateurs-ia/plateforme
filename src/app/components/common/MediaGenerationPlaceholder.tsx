import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import "@/styles/media-generation.css";

export function MediaGenerationPlaceholder({ kind, ready = false, error, onRetry, retryDisabled = false }: {
  kind: "image" | "video" | "music";
  ready?: boolean;
  error?: string | null;
  onRetry: () => void;
  retryDisabled?: boolean;
}) {
  const th = useTh();
  const label = kind === "image" ? "Génération de l’image en cours…" : kind === "video" ? "Génération de la vidéo en cours…" : "Composition de la musique en cours…";
  return (
    <div className={`media-generation ${ready ? "media-generation--ready" : ""} ${error ? "media-generation--error" : ""}`}
      style={{ background: th.card, color: th.fg }} aria-hidden={ready || undefined}>
      {!error && <div className="media-generation__halo" aria-hidden="true" />}
      <div className="media-generation__message" role={error ? "alert" : "status"} aria-live="polite" aria-atomic="true">
        {error ? <AlertCircle className="w-6 h-6 shrink-0" aria-hidden="true" /> : <Sparkles className="w-6 h-6 shrink-0" aria-hidden="true" />}
        <p className={error ? "" : "media-generation__pulse"}>{error || label}</p>
        {error && <button type="button" disabled={retryDisabled} onClick={(event) => { event.stopPropagation(); onRetry(); }}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50"
          style={{ borderColor: th.inputB, background: th.inputBg, color: th.fg }}>
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />Réessayer
        </button>}
      </div>
    </div>
  );
}
