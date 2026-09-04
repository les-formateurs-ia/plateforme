import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Pencil, Trash2, Image as ImageIcon, Video } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GT } from "@/app/components/common/GT";
import { SessionEditDialog } from "@/app/components/practice/SessionEditDialog";
import { createExerciseSession, renameExerciseSession, deleteExerciseSession } from "@/app/lib/exerciseSessions";
import { listMediaExerciseSessions, type MediaExerciseSession } from "@/app/lib/mediaExercise";
import { ANNOTATION_RED as RED, scoreTone } from "@/app/lib/textAnnotation";

// Distingue les deux modes d'exercice (image/vidéo) par une couleur fixe,
// pas l'accent de rôle — même logique que la palette du mindmap.
const MODE_GRADIENT: Record<"image" | "video", string> = {
  image: "linear-gradient(150deg,#dbacf0,#b58de0 65%)",
  video: "linear-gradient(150deg,#9ce6e6,#2792dc 65%)",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MediaExerciseSessionsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<MediaExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<MediaExerciseSession | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      setSessions(await listMediaExerciseSessions(user.id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user]);

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

  const handleDelete = async (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Supprimer définitivement cet historique (et les médias générés) ?")) return;
    setDeletingId(sessionId);
    try {
      await deleteExerciseSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de supprimer cet historique.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (patch: { name: string }) => {
    if (!editingSession) return;
    await renameExerciseSession(editingSession.sessionId, { name: patch.name });
    setSessions((prev) => prev.map((s) => (s.sessionId === editingSession.sessionId ? { ...s, name: patch.name } : s)));
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Pratique IA
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Génération images & vidéos</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Reprends un historique existant ou lance un nouveau test.</p>
      </div>

      {loading && <p className="text-sm text-center py-6" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && loadError && <p className="text-sm" style={{ color: RED }}>{loadError}</p>}

      {!loading && !loadError && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
          <button onClick={startNewSession} disabled={creating}
            className="group relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
            style={{ aspectRatio: "1/1", background: th.isDark ? `${th.gradShadow(0.06)}` : `${th.gradShadow(0.05)}`, border: `1.5px dashed ${th.gradShadow(0.4)}` }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 30%, ${th.gradShadow(0.18)}, transparent 70%)` }} />
            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, boxShadow: `0 6px 20px ${th.gradShadow(0.4)}` }}>
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="relative">
              <div className="text-sm font-black" style={{ color: th.fg }}>Nouveau test</div>
              <div className="text-[11px] mt-0.5" style={{ color: th.fg3 }}>{creating ? "Création…" : "Image ou vidéo"}</div>
            </div>
          </button>

          {sessions.map((s) => {
            const tone = s.lastScore !== null ? scoreTone(s.lastScore) : null;
            const gradient = s.mode ? MODE_GRADIENT[s.mode] : "linear-gradient(150deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))";
            return (
              <div key={s.sessionId} onClick={() => navigate(`/practice/media/${s.sessionId}`)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02]"
                style={{ aspectRatio: "1/1", background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 4px 18px rgba(0,0,0,0.16)" }}>
                <div className="relative flex-1 flex items-center justify-center overflow-hidden" style={{ background: gradient }}>
                  <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 60%)" }} />
                  {s.mode === "video"
                    ? <Video className="w-8 h-8 relative drop-shadow-lg" style={{ color: "rgba(255,255,255,0.92)" }} />
                    : <ImageIcon className="w-8 h-8 relative drop-shadow-lg" style={{ color: "rgba(255,255,255,0.92)" }} />}

                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.28)", color: "#fff" }}>
                    {s.mode === "video" ? "Vidéo" : "Image"}
                  </div>
                  {tone && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.28)", color: "#fff" }}>
                      {s.lastScore}/20
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-start justify-end p-2 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingSession(s); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-80"
                      style={{ background: "rgba(0,0,0,0.35)" }} title="Renommer">
                      <Pencil className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button onClick={(e) => handleDelete(e, s.sessionId)} disabled={deletingId === s.sessionId}
                      className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: "rgba(0,0,0,0.35)" }} title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#ffb4b4" }} />
                    </button>
                  </div>
                </div>

                <div className="p-3 shrink-0">
                  <div className="text-xs font-black truncate" style={{ color: th.fg }}>{s.name || `Test n°${s.ordinal}`}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: th.fg3 }}>{formatDate(s.createdAt)} · {s.attemptCount} tent.</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingSession && (
        <SessionEditDialog
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
          initialName={editingSession.name || `Test n°${editingSession.ordinal}`}
          onSave={handleRename}
        />
      )}
    </div>
  );
}
