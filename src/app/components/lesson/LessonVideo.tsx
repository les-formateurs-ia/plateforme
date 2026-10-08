import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, Play } from "lucide-react";

// Lecteur de la vidéo d'une leçon.
// - Fichier envoyé (bucket lesson-videos) : <video> avec preload="metadata" et
//   le fragment #t=0.1, pour que Chrome et Safari affichent la première image
//   comme miniature au lieu d'un cadre noir.
// - Lien YouTube / Vimeo : lecteur intégré du service (un <video> ne sait pas
//   lire ces pages).
// - Échec de lecture (format non pris en charge par le navigateur, typiquement
//   un .mov en HEVC dans Chrome, ou fichier introuvable) : message clair et
//   lien de téléchargement, plutôt qu'un cadre noir qui ne répond pas.
export function LessonVideo({ src, title }: { src: string; title: string }) {
  const embed = embedUrl(src);
  if (embed) {
    return (
      <iframe src={embed} title={title} className="absolute inset-0 w-full h-full bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
    );
  }
  return <FileVideo src={src} title={title} />;
}

function FileVideo({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [started, setStarted] = useState(false);

  useEffect(() => { setState("loading"); setStarted(false); }, [src]);

  const extension = src.split("?")[0].split(".").pop()?.toLowerCase();
  const play = () => {
    const v = ref.current;
    if (!v) return;
    setStarted(true);
    v.play().catch(() => setState("error"));
  };

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={ref}
        key={src}
        src={`${src}#t=0.1`}
        title={title}
        controls={started}
        preload="metadata"
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
        onLoadedData={() => setState("ready")}
        onLoadedMetadata={() => setState((s) => (s === "loading" ? "ready" : s))}
        onError={() => setState("error")}
        onPlay={() => setStarted(true)}
      />
      {/* Avant la première lecture : grand bouton, au-dessus de la miniature. */}
      {!started && state !== "error" && (
        <button type="button" onClick={play} aria-label={`Lire la vidéo : ${title}`}
          className="group absolute inset-0 flex items-center justify-center"
          style={{ background: "linear-gradient(180deg,rgba(0,0,0,0) 50%,rgba(0,0,0,0.45) 100%)" }}>
          <span className="sweep w-16 h-16 rounded-full flex items-center justify-center bg-white text-black" style={{ ["--btn-sweep" as string]: "var(--grad-iris)" }}>
            {state === "loading" ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
          </span>
        </button>
      )}
      {state === "error" && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <AlertCircle className="w-7 h-7 text-white/70" />
          <p className="text-base font-bold">La vidéo ne peut pas être lue ici</p>
          <p className="text-sm text-white/60 max-w-md">
            {extension === "mov" || extension === "hevc"
              ? "Ce format (.mov) n'est pas lu par tous les navigateurs. Tu peux la télécharger, et ton formateur peut la remplacer par un fichier MP4."
              : "Ton navigateur n'arrive pas à lire ce fichier. Tu peux le télécharger pour le regarder."}
          </p>
          <a href={src} target="_blank" rel="noopener" download
            className="sweep mt-1 inline-flex items-center gap-2 min-h-10 px-4 rounded-[2px] bg-white text-black text-sm font-semibold">
            <Download className="w-4 h-4" />Télécharger la vidéo
          </a>
        </div>
      )}
    </div>
  );
}

/** Lien YouTube / Vimeo → adresse du lecteur intégré ; null pour un fichier. */
export function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return url;
  } catch {
    return null;
  }
  return null;
}

/**
 * Vérifie, avant l'envoi, que le navigateur sait lire le fichier : on charge
 * ses métadonnées depuis une URL locale. Renvoie un message d'avertissement
 * (format probablement illisible pour une partie des élèves) ou null.
 */
export function checkVideoFile(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const risky = ext === "mov" || ext === "hevc" || ext === "mkv" || ext === "avi" || ext === "wmv";
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    const done = (ok: boolean) => {
      URL.revokeObjectURL(url);
      if (!ok) resolve(`« ${file.name} » ne peut pas être lu par ce navigateur. Exporte la vidéo en MP4 (H.264) pour que tous les élèves puissent la voir.`);
      else if (risky) resolve(`« ${file.name} » est au format .${ext}, que certains navigateurs ne lisent pas. Le MP4 (H.264) est recommandé.`);
      else resolve(null);
    };
    v.preload = "metadata";
    v.onloadedmetadata = () => done(v.videoWidth > 0 || v.duration > 0);
    v.onerror = () => done(false);
    window.setTimeout(() => done(true), 8000);
    v.src = url;
  });
}
