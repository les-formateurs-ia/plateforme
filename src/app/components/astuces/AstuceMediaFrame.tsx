import { useEffect, useRef, useState } from "react";
import { Film, ImageIcon, Volume2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { astuceMedia, RATIO_CSS } from "@/app/lib/astucesMedia";
import type { MediaRatio } from "@/app/data/astuces";
import { cx } from "@/app/lib/cx";

// Vidéo d'exemple : muette, en boucle, lue uniquement quand elle est à
// l'écran (une page de brique en affiche jusqu'à six). `withSound` passe en
// lecteur avec contrôles pour les exemples dont le son est le sujet.
function LoopVideo({ src, withSound, label }: { src: string; withSound?: boolean; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || withSound) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => { /* lecture auto bloquée : l'image reste */ });
      else el.pause();
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [withSound]);

  return (
    <video ref={ref} src={src} aria-label={label} className="absolute inset-0 w-full h-full object-cover"
      muted={!withSound} loop={!withSound} playsInline preload="metadata" controls={withSound} />
  );
}

export function AstuceMediaFrame({ mediaKey, ratio, label, kind, withSound, className }: {
  mediaKey: string;
  ratio: MediaRatio;
  label: string;
  // Type attendu, pour le visuel d'attente quand l'exemple n'existe pas encore.
  kind: "image" | "video";
  withSound?: boolean;
  className?: string;
}) {
  const th = useTh();
  const media = astuceMedia(mediaKey);
  const [failed, setFailed] = useState(false);
  const Icon = kind === "video" ? Film : ImageIcon;

  return (
    <div className={cx("relative w-full overflow-hidden rounded-[8px]", className)}
      style={{ aspectRatio: RATIO_CSS[ratio], background: th.isDark ? "rgba(255,255,255,0.03)" : th.gradShadow(0.03), border: `1px solid ${th.sep}` }}>
      {media && !failed ? (
        media.kind === "video" ? (
          <LoopVideo src={media.url} withSound={withSound} label={label} />
        ) : (
          <img src={media.url} alt={label} loading="lazy" decoding="async" onError={() => setFailed(true)}
            className="absolute inset-0 w-full h-full object-cover" />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <Icon className="w-6 h-6" style={{ color: th.fg3 }} />
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: th.fg3 }}>Exemple à venir</span>
        </div>
      )}
      {media && withSound && (
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wide pointer-events-none"
          style={{ background: th.ink, color: th.onInk }}>
          <Volume2 className="w-3 h-3" />Son
        </span>
      )}
    </div>
  );
}
