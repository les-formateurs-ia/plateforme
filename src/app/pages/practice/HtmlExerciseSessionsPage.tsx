import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Code, Pencil } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { HtmlExerciseEditDialog } from "@/app/components/practice/HtmlExerciseEditDialog";
import { listVisibleHtmlExercises, ensureHtmlExerciseSession, type VisibleHtmlExercise } from "@/app/lib/htmlExercise";
import { listHtmlExercises, type HtmlExerciseRow } from "@/app/lib/htmlExercises";

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
        title="Apercu"
        tabIndex={-1}
        style={{ width: "300%", height: "300%", border: 0, transform: "scale(0.3333)", transformOrigin: "top left", background: "#fff" }}
      />
    </div>
  );
}

function CreateTile({ onClick }: { onClick: () => void }) {
  const th = useTh();
  return (
    <button onClick={onClick}
      className="group relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 hover:scale-[1.02]"
      style={{ aspectRatio: "1/1", background: th.isDark ? "rgba(181,141,224,0.06)" : "rgba(181,141,224,0.05)", border: "1.5px dashed rgba(181,141,224,0.4)" }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at 50% 30%, rgba(181,141,224,0.18), transparent 70%)" }} />
      <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)", boxShadow: "0 6px 20px rgba(181,141,224,0.4)" }}>
        <Plus className="w-5 h-5 text-white" />
      </div>
      <div className="relative text-sm font-black" style={{ color: th.fg }}>Nouvel exercice</div>
    </button>
  );
}

function AdminHtmlExercisesView() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"global" | "private">("global");
  const [exercises, setExercises] = useState<HtmlExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<HtmlExerciseRow | undefined>(undefined);

  const load = async () => {
    setLoading(true);
    setExercises(await listHtmlExercises(tab));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [tab]);

  const openCreate = () => { setEditingExercise(undefined); setDialogOpen(true); };
  const openEdit = (ex: HtmlExerciseRow) => { setEditingExercise(ex); setDialogOpen(true); };
  const openExercise = async (ex: HtmlExerciseRow) => {
    if (!user || opening) return;
    setOpening(ex.id);
    try {
      const sessionId = await ensureHtmlExerciseSession(user.id, ex.id);
      navigate(`/practice/html/${sessionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible d'ouvrir cet exercice.");
      setOpening(null);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
          {([["global", "Globales"], ["private", "Privees"]] as const).map(([id, label]) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} className="px-7 py-3 rounded-full text-sm font-bold transition-all"
                style={active
                  ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", boxShadow: "0 2px 12px rgba(181,141,224,0.35)" }
                  : { color: th.fg2, background: "transparent" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-center py-6" style={{ color: th.fg3 }}>Chargement...</p>
      ) : (
        <div className="grid gap-4 mt-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
          <CreateTile onClick={openCreate} />
          {exercises.map((ex) => (
            <div key={ex.id} onClick={() => openExercise(ex)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02]"
              style={{ aspectRatio: "1/1", background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 4px 18px rgba(0,0,0,0.16)", opacity: opening && opening !== ex.id ? 0.5 : 1 }}>
              <div className="relative flex-1 overflow-hidden" style={{ background: "#0c0c13" }}>
                <HtmlPreview html={ex.htmlContent} />
                <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(ex); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-85"
                  style={{ background: th.card, border: `1px solid ${th.sep}`, color: th.fg }}
                  title="Modifier">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }} />
              </div>
              <div className="p-3 shrink-0">
                <div className="text-xs font-black truncate" style={{ color: th.fg }}>{ex.name}</div>
                <div className="text-[10px] truncate mt-0.5" style={{ color: th.fg3 }}>
                  {ex.visibility === "private" ? `${ex.assigneeCount} eleve${ex.assigneeCount > 1 ? "s" : ""}` : "Global"}
                </div>
              </div>
            </div>
          ))}
          {!exercises.length && (
            <div className="col-span-full">
              <GCard><div className="p-8 text-center"><p className="text-sm" style={{ color: th.fg3 }}>Aucun exercice {tab === "global" ? "global" : "prive"} pour l'instant.</p></div></GCard>
            </div>
          )}
        </div>
      )}

      <HtmlExerciseEditDialog open={dialogOpen} onOpenChange={setDialogOpen} exercise={editingExercise} onSaved={load} />
    </>
  );
}

function StudentHtmlExercisesView() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exercises, setExercises] = useState<VisibleHtmlExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listVisibleHtmlExercises(user.id);
        if (!cancelled) setExercises(rows);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger tes exercices.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const open = async (ex: VisibleHtmlExercise) => {
    if (!user || opening) return;
    setOpening(ex.exerciseId);
    try {
      const sessionId = ex.sessionId ?? (await ensureHtmlExerciseSession(user.id, ex.exerciseId));
      navigate(`/practice/html/${sessionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible d'ouvrir cet exercice.");
      setOpening(null);
    }
  };

  if (loading) return <p className="text-sm text-center py-6" style={{ color: th.fg3 }}>Chargement...</p>;
  if (loadError) return <p className="text-sm" style={{ color: "#e5484d" }}>{loadError}</p>;
  if (!exercises.length) {
    return (
      <GCard><div className="p-8 text-center">
        <p className="text-sm font-semibold mb-1" style={{ color: th.fg }}>Aucun exercice pour l'instant</p>
        <p className="text-xs" style={{ color: th.fg3 }}>Ton formateur ne t'a pas encore attribue d'exercice HTML.</p>
      </div></GCard>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
      {exercises.map((ex) => (
        <div key={ex.exerciseId} onClick={() => open(ex)}
          className="group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02]"
          style={{ aspectRatio: "1/1", background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 4px 18px rgba(0,0,0,0.16)", opacity: opening && opening !== ex.exerciseId ? 0.5 : 1 }}>
          <div className="relative flex-1 overflow-hidden" style={{ background: "#0c0c13" }}>
            <HtmlPreview html={ex.previewHtml} />
            <div className="absolute inset-0" style={{ boxShadow: "inset 0 -24px 20px -20px rgba(0,0,0,0.35)" }} />
          </div>
          <div className="p-3 shrink-0">
            <div className="text-xs font-black truncate" style={{ color: th.fg }}>{ex.name}</div>
            <div className="text-[10px] truncate mt-0.5" style={{ color: th.fg3 }}>{ex.attemptCount > 0 ? `${ex.attemptCount} tentative${ex.attemptCount > 1 ? "s" : ""}` : "Pret a ouvrir"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HtmlExerciseSessionsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const staff = isStaff(role);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Pratique IA
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Exercices pour vous</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>
          {staff ? "Cree, modifie et ouvre les exercices HTML proposes aux eleves." : "Ouvre les exercices HTML attribues par ton formateur."}
        </p>
      </div>

      {staff ? <AdminHtmlExercisesView /> : <StudentHtmlExercisesView />}
    </div>
  );
}
