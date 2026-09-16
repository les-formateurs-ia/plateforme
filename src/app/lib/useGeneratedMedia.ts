import { useEffect, useState } from "react";

// A backend result is only visible once the browser has loaded the actual asset.
export function useGeneratedMedia(path: string | null, getUrl: (path: string) => Promise<string>) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setLoaded(false);
    setError(null);
    if (!path) return;
    getUrl(path).then((value) => { if (!cancelled) setUrl(value); })
      .catch(() => { if (!cancelled) setError("Impossible de charger le média. Réessayez."); });
    const timeout = setTimeout(() => { if (!cancelled) setError("Le chargement du média prend trop de temps. Réessayez."); }, 60000);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [path, getUrl, attempt]);
  return {
    url, loaded, error: loaded ? null : error,
    onLoad: () => { setLoaded(true); setError(null); },
    onError: () => { setLoaded(false); setError("Impossible de charger le média. Réessayez."); },
    retry: () => { setError(null); setLoaded(false); setAttempt((value) => value + 1); },
  };
}
