import { useEffect, useRef } from "react";
import { cx } from "@/app/lib/cx";

// Vignette vidéo d'une création (Studio). Safari ne précharge pas les données
// d'une vidéo qui ne joue pas : « loadeddata » n'arrive jamais, et l'écran
// « Génération en cours » restait affiché par-dessus la vidéo. Ici la vidéo
// est prête dès que ses métadonnées sont connues (Safari les charge), avec un
// filet de sécurité au bout de 2,5 s ; le fragment #t=0.001 fait afficher la
// première image comme miniature. Au survol, aperçu muet en boucle.
export function MediaThumbVideo({ url, onReady, onError, className }: {
  url: string; onReady: () => void; onError: () => void; className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = false;
    const fallback = window.setTimeout(() => ready(), 2500);
    return () => window.clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  function ready() {
    if (readyRef.current) return;
    readyRef.current = true;
    onReady();
  }

  return (
    <video
      ref={ref}
      key={url}
      src={`${url}#t=0.001`}
      muted
      loop
      playsInline
      preload="metadata"
      onLoadedMetadata={ready}
      onLoadedData={ready}
      onCanPlay={ready}
      onError={(e) => {
        // Trace utile au diagnostic (code MediaError : 2 réseau, 3 décodage, 4 format non pris en charge).
        console.warn("Vidéo illisible", { code: e.currentTarget.error?.code, message: e.currentTarget.error?.message, url: url.split("?")[0] });
        if (!readyRef.current) onError();
      }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") void ref.current?.play().catch(() => {}); }}
      onPointerLeave={() => { const v = ref.current; if (v) { v.pause(); v.currentTime = 0.001; } }}
      className={cx("absolute inset-0 w-full h-full object-cover", className)}
    />
  );
}
