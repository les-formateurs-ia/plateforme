import { useEffect, useState } from "react";
import { useAuth } from "@/app/state/auth-context";
import { getMyInstances, type MyInstance } from "@/app/lib/learning";

const STORAGE_KEY = "selectedInstanceId";

// Liste des formations actives d'un élève, pour le sélecteur affiché quand il
// en a plusieurs en parallèle (Dashboard/Mes leçons). Le choix est retenu en
// localStorage ; par défaut, la formation la plus récemment attribuée.
export function useMyInstances() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<MyInstance[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await getMyInstances(user.id);
      if (cancelled) return;
      setInstances(rows);
      let stored: string | null = null;
      try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* stockage indisponible */ }
      const fallback = rows[0]?.id ?? null;
      setSelectedIdState(stored && rows.some((r) => r.id === stored) ? stored : fallback);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const setSelectedId = (id: string) => {
    setSelectedIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* stockage indisponible */ }
  };

  return { instances, selectedId, setSelectedId, loading };
}

export type { MyInstance };
