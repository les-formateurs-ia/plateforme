import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/app/state/auth-context";
import { useTh } from "@/app/theme/theme";
import { ExerciseSessionsBoard } from "@/app/components/practice/ExerciseSessionsBoard";
import { createExerciseSession, renameExerciseSession } from "@/app/lib/exerciseSessions";
import { listMediaExerciseSessions, deleteMediaExerciseSession, type MediaExerciseSession } from "@/app/lib/mediaExercise";

export function MediaExerciseSessionsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<MediaExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    listMediaExerciseSessions(user.id)
      .then(setSessions)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives."))
      .finally(() => setLoading(false));
  }, [user]);

  const startNewSession = async () => {
    if (!user || creating) return;
    setCreating(true);
    try {
      const session = await createExerciseSession(user.id, "media");
      navigate(`/practice/media/${session.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de créer un nouveau test.");
      setCreating(false);
    }
  };

  return (
    <ExerciseSessionsBoard
      eyebrow="IA · Image & vidéo" icon={<ImageIcon className="w-3.5 h-3.5" />} title="Images & vidéos"
      intro="Décris une image, l'IA note ton prompt, le corrige et génère les deux versions : compare le résultat avant et après."
      steps={[
        { title: "Décris ton image", text: "Sujet, style, lumière, cadrage : des repères t'aident à ne rien oublier." },
        { title: "Reçois ta note", text: "Ton prompt est noté sur 20, annoté, puis réécrit par l'IA." },
        { title: "Compare", text: "Les deux images sont générées : fais glisser le curseur pour voir la différence." },
      ]}
      sessions={sessions.map((s) => ({
        id: s.sessionId, title: s.name || `Test n°${s.ordinal}`, preview: s.preview, createdAt: s.createdAt,
        attemptCount: s.attemptCount, lastScore: s.lastScore, bestScore: s.bestScore,
        badge: s.mode === "video"
          ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] shrink-0" style={{ background: th.navA, color: th.fg3 }}>Vidéo</span>
          : undefined,
      }))}
      loading={loading} loadError={loadError} creating={creating}
      onCreate={() => void startNewSession()}
      onOpen={(id) => navigate(`/practice/media/${id}`)}
      onRename={async (id, name) => {
        await renameExerciseSession(id, { name });
        setSessions((prev) => prev.map((s) => (s.sessionId === id ? { ...s, name } : s)));
      }}
      onDelete={async (id) => {
        // Supprime aussi les images/vidéos générées (le stockage ne cascade pas).
        if (user) await deleteMediaExerciseSession(user.id, id);
        setSessions((prev) => prev.filter((s) => s.sessionId !== id));
      }}
    />
  );
}
