import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PenLine } from "lucide-react";
import { useAuth } from "@/app/state/auth-context";
import { ExerciseSessionsBoard } from "@/app/components/practice/ExerciseSessionsBoard";
import { createExerciseSession, renameExerciseSession, deleteExerciseSession } from "@/app/lib/exerciseSessions";
import { listPromptExerciseSessions, type PromptExerciseSession } from "@/app/lib/promptExercise";

export function PromptSessionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<PromptExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    listPromptExerciseSessions(user.id)
      .then(setSessions)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives."))
      .finally(() => setLoading(false));
  }, [user]);

  const startNewSession = async () => {
    if (!user || creating) return;
    setCreating(true);
    try {
      const session = await createExerciseSession(user.id, "prompt");
      navigate(`/practice/prompts/${session.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de créer un nouveau test.");
      setCreating(false);
    }
  };

  return (
    <ExerciseSessionsBoard
      eyebrow="Écriture de prompts" icon={<PenLine className="w-3.5 h-3.5" />} title="Exercices prompts"
      intro="Écris un prompt, l'IA le note sur 20, te montre quoi corriger, et tu l'améliores jusqu'à la bonne note."
      steps={[
        { title: "Choisis une mission", text: "Une situation professionnelle concrète, ou ton propre besoin." },
        { title: "Écris ton prompt", text: "Des repères s'allument au fil de la frappe : rôle, contexte, format…" },
        { title: "Améliore-le", text: "Note sur 20 et corrections annotées. Corrige en gardant les remarques sous les yeux." },
      ]}
      sessions={sessions.map((s) => ({
        id: s.sessionId, title: s.name || `Test n°${s.ordinal}`, preview: s.preview, createdAt: s.createdAt,
        attemptCount: s.attemptCount, lastScore: s.lastScore, bestScore: s.bestScore,
      }))}
      loading={loading} loadError={loadError} creating={creating}
      onCreate={() => void startNewSession()}
      onOpen={(id) => navigate(`/practice/prompts/${id}`)}
      onRename={async (id, name) => {
        await renameExerciseSession(id, { name });
        setSessions((prev) => prev.map((s) => (s.sessionId === id ? { ...s, name } : s)));
      }}
      onDelete={async (id) => {
        await deleteExerciseSession(id);
        setSessions((prev) => prev.filter((s) => s.sessionId !== id));
      }}
    />
  );
}
