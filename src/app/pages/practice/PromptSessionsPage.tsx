import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Sparkles, Pencil, Trash2, ChevronRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { SessionEditDialog } from "@/app/components/practice/SessionEditDialog";
import { createExerciseSession, renameExerciseSession, deleteExerciseSession } from "@/app/lib/exerciseSessions";
import { listPromptExerciseSessions, type PromptExerciseSession } from "@/app/lib/promptExercise";
import { ANNOTATION_RED as RED, scoreTone } from "@/app/lib/textAnnotation";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PromptSessionsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<PromptExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<PromptExerciseSession | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      setSessions(await listPromptExerciseSessions(user.id));
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
      const session = await createExerciseSession(user.id, "prompt");
      navigate(`/practice/prompts/${session.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de créer un nouveau test.");
      setCreating(false);
    }
  };

  const handleDelete = async (e: MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm("Supprimer définitivement cet historique de tentatives ?")) return;
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
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Exercices prompts</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Écris un prompt, l'IA le note sur 20 et t'explique précisément quoi corriger.</p>
      </div>

      <button onClick={startNewSession} disabled={creating}
        className="w-full group relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 text-left transition-all duration-300 hover:scale-[1.005] disabled:opacity-60"
        style={{ background: "linear-gradient(120deg,rgba(181,141,224,0.16),rgba(219,172,240,0.06) 60%)", border: "1px solid rgba(181,141,224,0.3)" }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(120deg,rgba(181,141,224,0.1),transparent 70%)" }} />
        <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)", boxShadow: "0 4px 16px rgba(181,141,224,0.4)" }}>
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="text-sm font-black" style={{ color: th.fg }}>Nouveau test</div>
          <div className="text-xs" style={{ color: th.fg3 }}>{creating ? "Création…" : "Démarrer un nouvel historique de tentatives"}</div>
        </div>
        <ChevronRight className="relative w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: th.navAC }} />
      </button>

      {loading && <p className="text-sm text-center py-6" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && loadError && <p className="text-sm" style={{ color: RED }}>{loadError}</p>}

      {!loading && !loadError && sessions.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-bold" style={{ color: th.fg }}>Historique</h3>
          {sessions.map((s) => {
            const tone = s.lastScore !== null ? scoreTone(s.lastScore) : null;
            return (
              <div key={s.sessionId} onClick={() => navigate(`/practice/prompts/${s.sessionId}`)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.004]"
                style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: tone ? tone.color : th.sep, opacity: tone ? 0.7 : 0.3 }} />
                <div className="pl-6 pr-4 py-4 flex items-center gap-4">
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: th.navAC, opacity: 0.6 }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black truncate" style={{ color: th.fg }}>{s.name || `Test n°${s.ordinal}`}</span>
                      {tone && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color: tone.color, background: tone.bg }}>{s.lastScore}/20</span>}
                    </div>
                    {s.preview && <p className="text-xs truncate mt-0.5" style={{ color: th.fg3 }}>{s.preview}</p>}
                    <p className="text-[11px] mt-1" style={{ color: th.fg3 }}>{formatDate(s.createdAt)} · {s.attemptCount} tentative{s.attemptCount > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingSession(s); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                      style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)" }} title="Renommer">
                      <Pencil className="w-3.5 h-3.5" style={{ color: th.fg3 }} />
                    </button>
                    <button onClick={(e) => handleDelete(e, s.sessionId)} disabled={deletingId === s.sessionId}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: "rgba(229,72,77,0.1)" }} title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: RED }} />
                    </button>
                  </div>
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
