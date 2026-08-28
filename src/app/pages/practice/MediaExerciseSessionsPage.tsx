import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Folder, Trash2, Image as ImageIcon, Video } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { listMediaExerciseSessions, deleteMediaExerciseSession, type MediaExerciseSession } from "@/app/lib/mediaExercise";
import { ANNOTATION_RED as RED, scoreTone } from "@/app/lib/textAnnotation";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listMediaExerciseSessions(user.id);
        if (!cancelled) setSessions(rows);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const startNewSession = () => {
    const sessionId = crypto.randomUUID();
    navigate(`/practice/media/${sessionId}`);
  };

  const handleDelete = async (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (!confirm("Supprimer définitivement cet historique de tentatives (et les médias générés) ?")) return;
    setDeletingId(sessionId);
    try {
      await deleteMediaExerciseSession(user.id, sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de supprimer cet historique.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Pratique IA
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Génération images & vidéos</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Reprends un historique existant ou lance un nouveau test.</p>
      </div>

      <GCard accent className="hover:scale-[1.005] transition-transform" onClick={startNewSession}>
        <div className="p-5 flex items-center gap-4 cursor-pointer">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)" }}>
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black" style={{ color: th.fg }}>Nouveau test</div>
            <div className="text-xs" style={{ color: th.fg3 }}>Démarrer un nouvel historique de tentatives</div>
          </div>
        </div>
      </GCard>

      {loading && <p className="text-sm text-center py-6" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && loadError && <p className="text-sm" style={{ color: RED }}>{loadError}</p>}

      {!loading && !loadError && sessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: th.fg }}>Historique</h3>
          {sessions.map((s) => (
            <GCard key={s.sessionId} className="hover:scale-[1.005] transition-transform" onClick={() => navigate(`/practice/media/${s.sessionId}`)}>
              <div className="p-5 flex items-center gap-4 cursor-pointer">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(181,141,224,0.06)" }}>
                  <Folder className="w-5 h-5" style={{ color: th.navAC }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black" style={{ color: th.fg }}>Test n°{s.ordinal}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0" style={{ color: th.navAC, background: "rgba(181,141,224,0.1)" }}>
                      {s.mode === "image" ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}{s.mode === "image" ? "Image" : "Vidéo"}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color: scoreTone(s.lastScore).color, background: scoreTone(s.lastScore).bg }}>{s.lastScore}/20</span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: th.fg3 }}>{s.preview || "(prompt vide)"}</p>
                  <p className="text-[11px] mt-1" style={{ color: th.fg3 }}>{formatDate(s.startedAt)} · {s.attemptCount} tentative{s.attemptCount > 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, s.sessionId)}
                  disabled={deletingId === s.sessionId}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: "rgba(229,72,77,0.1)" }}
                  title="Supprimer cet historique"
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: RED }} />
                </button>
              </div>
            </GCard>
          ))}
        </div>
      )}
    </div>
  );
}
