import { useEffect, useRef, useState } from "react";

interface Generation {
  id: string;
  status: "pending" | "ready" | "failed";
  errorMessage: string | null;
}
export type MediaGeneration<T> = T & { clientKey?: string; trackingError?: string | null };
type PollResult = { status: Generation["status"]; error: string | null };

// Keep the same card mounted from the optimistic request through media loading.
// Tracking errors retry polling; server failures retry the original submission.
export function useMediaGenerations<T extends Generation, R extends PollResult>(
  userId: string | undefined,
  fetchAll: (userId: string) => Promise<T[]>,
  poll: (id: string) => Promise<R>,
  resultFields: (result: R) => Partial<T>,
) {
  const [generations, setGenerations] = useState<MediaGeneration<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const epoch = useRef(0);
  const busy = useRef(false);
  const requests = useRef(new Map<string, () => Promise<string>>());

  const patch = (key: string, value: Partial<MediaGeneration<T>>) => {
    setGenerations((rows) => rows.map((row) => (row.clientKey ?? row.id) === key ? { ...row, ...value } : row));
  };

  const track = async (id: string, key: string, version: number) => {
    try {
      const result = await poll(id);
      if (epoch.current !== version) return;
      if (result.status === "pending") {
        patch(key, { trackingError: "La génération prend plus de temps que prévu. Réessayez pour vérifier son état." } as Partial<MediaGeneration<T>>);
        return;
      }
      patch(key, { ...resultFields(result), status: result.status, errorMessage: result.error, trackingError: null } as Partial<MediaGeneration<T>>);
      if (result.status === "ready" && userId) {
        // Fetch title/lyrics/other generated metadata without replacing the card.
        try {
          const rows = await fetchAll(userId);
          const final = rows.find((row) => row.id === id);
          if (final?.status === "ready" && epoch.current === version) patch(key, final);
        } catch { /* The result paths from polling already allow media display. */ }
      }
    } catch (error) {
      if (epoch.current === version) patch(key, { trackingError: error instanceof Error ? error.message : "Connexion interrompue. Réessayez pour vérifier la génération." } as Partial<MediaGeneration<T>>);
    }
  };

  useEffect(() => {
    const version = ++epoch.current;
    busy.current = false;
    requests.current.clear();
    setGenerating(false);
    setGenerations([]);
    setHistoryError(null);
    setLoading(true);
    if (!userId) { setLoading(false); return; }
    fetchAll(userId).then((rows) => {
      if (epoch.current !== version) return;
      setGenerations((current) => [...current, ...rows.filter((row) => !current.some((item) => item.id === row.id))]);
      rows.filter((row) => row.status === "pending").forEach((row) => void track(row.id, row.id, version));
    }).catch(() => {
      if (epoch.current === version) setHistoryError("Impossible de charger l’historique.");
    }).finally(() => { if (epoch.current === version) setLoading(false); });
    return () => { epoch.current++; };
  }, [userId, fetchAll]);

  const start = async (draft: T, request: () => Promise<string>, replaceKey?: string) => {
    if (!userId || busy.current) return;
    busy.current = true;
    setGenerating(true);
    const version = epoch.current;
    const key = replaceKey ?? draft.id;
    requests.current.set(key, request);
    const row = { ...draft, clientKey: key, status: "pending" as const, errorMessage: null, trackingError: null };
    setGenerations((rows) => replaceKey ? rows.map((old) => (old.clientKey ?? old.id) === key ? row : old) : [row, ...rows]);
    try {
      const id = await request();
      if (epoch.current !== version) return;
      patch(key, { id } as Partial<MediaGeneration<T>>);
      await track(id, key, version);
    } catch (error) {
      if (epoch.current === version) patch(key, { status: "failed", errorMessage: error instanceof Error ? error.message : "La génération a échoué." } as Partial<MediaGeneration<T>>);
    } finally {
      if (epoch.current === version) { busy.current = false; setGenerating(false); }
    }
  };

  const retry = async (row: MediaGeneration<T>, fallbackRequest: () => Promise<string>) => {
    if (busy.current) return;
    const key = row.clientKey ?? row.id;
    if (row.status === "pending") {
      busy.current = true;
      setGenerating(true);
      patch(key, { trackingError: null } as Partial<MediaGeneration<T>>);
      const version = epoch.current;
      try { await track(row.id, key, version); }
      finally { if (epoch.current === version) { busy.current = false; setGenerating(false); } }
    } else {
      await start(row, requests.current.get(key) ?? fallbackRequest, key);
    }
  };
  return { generations, loading, generating, historyError, start, retry };
}
