import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Pencil, Trash2, Code } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GT } from "@/app/components/common/GT";
import { SessionEditDialog } from "@/app/components/practice/SessionEditDialog";
import { createExerciseSession, renameExerciseSession, deleteExerciseSession } from "@/app/lib/exerciseSessions";
import { listHtmlExerciseSessions, type HtmlExerciseSession } from "@/app/lib/htmlExercise";

const RED = "#e5484d";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Aperçu miniature en vrai rendu (pas de capture serveur) : l'iframe rend le
// HTML dans un viewport 3x plus grand que la carte, mis à l'échelle en CSS —
// donne l'effet "page web réduite" plutôt qu'un mobile écrasé. sandbox=""
// (sans allow-scripts) : on affiche, on n'exécute rien — pas de risque de
// déclencher un appel ai-proxy juste en listant les dossiers.
function HtmlPreview({ html }: { html: string | null }) {
  if (!html) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Code className="w-6 h-6" style={{ color: "rgba(255,255,255,0.35)" }} />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
      <iframe
        srcDoc={html}
        sandbox=""
        title="Aperçu"
        tabIndex={-1}
        style={{ width: "300%", height: "300%", border: 0, transform: "scale(0.3333)", transformOrigin: "top left", background: "#fff" }}
      />
    </div>
  );
}

export function HtmlExerciseSessionsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<HtmlExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<HtmlExerciseSession | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      setSessions(await listHtmlExerciseSessions(user.id));
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
      const session = await createExerciseSession(user.id, "html");
      navigate(`/practice/html/${session.id}`);
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

  const handleRename = async (patch: { name: string; description?: string }) => {
    if (!editingSession) return;
    await renameExerciseSession(editingSession.sessionId, { name: patch.name, description: patch.description || null });
    setSessions((prev) => prev.map((s) => (s.sessionId === editingSession.sessionId ? { ...s, name: patch.name, description: patch.description || null } : s)));
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Pratique IA
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Exercices pour vous</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Reprends un historique existant ou lance un nouveau bac à sable HTML.</p>
      </div>

      {loading && <p className="text-sm text-center py-6" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && loadError && <p className="text-sm" style={{ color: RED }}>{loadError}</p>}

      {!loading && !loadError && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
          <button onClick={startNewSession} disabled={creating}
            className="group relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
            style={{ aspectRatio: "1/1", background: th.isDark ? "rgba(181,141,224,0.06)" : "rgba(181,141,224,0.05)", border: "1.5px dashed rgba(181,141,224,0.4)" }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at 50% 30%, rgba(181,141,224,0.18), transparent 70%)" }} />
            <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)", boxShadow: "0 6px 20px rgba(181,141,224,0.4)" }}>
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="relative">
              <div className="text-sm font-black" style={{ color: th.fg }}>Nouveau test</div>
              <div className="text-[11px] mt-0.5" style={{ color: th.fg3 }}>{creating ? "Création…" : "Bac à sable HTML"}</div>
            </div>
          </button>

          {sessions.map((s) => (
            <div key={s.sessionId} onClick={() => navigate(`/practice/html/${s.sessionId}`)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02]"
              style={{ aspectRatio: "1/1", background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 4px 18px rgba(0,0,0,0.16)" }}>
              <div className="relative flex-1 overflow-hidden" style={{ background: "#0c0c13" }}>
                <HtmlPreview html={s.latestHtml} />
                <div className="absolute inset-0" style={{ boxShadow: "inset 0 -24px 20px -20px rgba(0,0,0,0.35)" }} />

                <div className="absolute inset-0 flex items-start justify-end p-2 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditingSession(s); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-80"
                    style={{ background: "rgba(0,0,0,0.4)" }} title="Renommer">
                    <Pencil className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button onClick={(e) => handleDelete(e, s.sessionId)} disabled={deletingId === s.sessionId}
                    className="w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: "rgba(0,0,0,0.4)" }} title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: "#ffb4b4" }} />
                  </button>
                </div>
              </div>

              <div className="p-3 shrink-0">
                <div className="text-xs font-black truncate" style={{ color: th.fg }}>{s.name || `Test n°${s.ordinal}`}</div>
                {s.description
                  ? <div className="text-[10px] truncate mt-0.5" style={{ color: th.fg3 }}>{s.description}</div>
                  : <div className="text-[10px] mt-0.5" style={{ color: th.fg3 }}>{formatDate(s.createdAt)} · {s.attemptCount} tent.</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSession && (
        <SessionEditDialog
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
          initialName={editingSession.name || `Test n°${editingSession.ordinal}`}
          initialDescription={editingSession.description ?? ""}
          withDescription
          onSave={handleRename}
        />
      )}
    </div>
  );
}
