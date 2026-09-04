import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Code, Pencil, Sparkles, Tags } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff, isAdmin } from "@/app/lib/permissions";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { HtmlExerciseEditDialog } from "@/app/components/practice/HtmlExerciseEditDialog";
import { TagManagerDialog } from "@/app/components/practice/TagManagerDialog";
import { ExerciseTagPill } from "@/app/components/practice/ExerciseTagPill";
import { listVisibleHtmlExercises, ensureHtmlExerciseSession, type VisibleHtmlExercise } from "@/app/lib/htmlExercise";
import { listHtmlExercises, type HtmlExerciseRow } from "@/app/lib/htmlExercises";
import type { ExerciseTag } from "@/app/lib/exerciseTags";

// Tags présents dans une liste d'exercices, dédupliqués et triés — sert de
// filtre plutôt que le référentiel complet (pas de tag vide sans exercice).
function collectTags(items: { tags: ExerciseTag[] }[]): ExerciseTag[] {
  const map = new Map<string, ExerciseTag>();
  for (const item of items) for (const tag of item.tags) map.set(tag.id, tag);
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function TagFilterBar({ tags, selected, onToggle }: { tags: ExerciseTag[]; selected: Set<string>; onToggle: (id: string) => void }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <ExerciseTagPill key={t.id} label={t.name} active={selected.has(t.id)} onClick={() => onToggle(t.id)} />
      ))}
    </div>
  );
}

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
  const { user, role } = useAuth();
  const [tab, setTab] = useState<"global" | "private">("global");
  const [exercises, setExercises] = useState<HtmlExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<HtmlExerciseRow | undefined>(undefined);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    setExercises(await listHtmlExercises(tab));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [tab]);
  useEffect(() => { setTagFilter(new Set()); }, [tab]);

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

  const toggleTagFilter = (id: string) => {
    setTagFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const availableTags = useMemo(() => collectTags(exercises), [exercises]);
  const filteredExercises = tagFilter.size ? exercises.filter((ex) => ex.tags.some((t) => tagFilter.has(t.id))) : exercises;

  return (
    <>
      <div className="flex items-center justify-center gap-3 flex-wrap relative">
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
        {isAdmin(role) && (
          <div className="sm:absolute sm:right-0">
            <VBtn sm onClick={() => setTagManagerOpen(true)}>
              <span className="flex items-center gap-1.5"><Tags className="w-3.5 h-3.5" />Gerer les tags</span>
            </VBtn>
          </div>
        )}
      </div>

      {!loading && availableTags.length > 0 && (
        <div className="flex justify-center">
          <TagFilterBar tags={availableTags} selected={tagFilter} onToggle={toggleTagFilter} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-center py-6" style={{ color: th.fg3 }}>Chargement...</p>
      ) : (
        <div className="grid gap-4 mt-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
          <CreateTile onClick={openCreate} />
          {filteredExercises.map((ex) => (
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
                {ex.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ex.tags.map((t) => <ExerciseTagPill key={t.id} label={t.name} />)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!filteredExercises.length && (
            <div className="col-span-full">
              <GCard><div className="p-8 text-center"><p className="text-sm" style={{ color: th.fg3 }}>Aucun exercice {tab === "global" ? "global" : "prive"} pour l'instant.</p></div></GCard>
            </div>
          )}
        </div>
      )}

      <HtmlExerciseEditDialog open={dialogOpen} onOpenChange={setDialogOpen} exercise={editingExercise} onSaved={load} />
      <TagManagerDialog open={tagManagerOpen} onOpenChange={setTagManagerOpen} onChanged={load} />
    </>
  );
}

function StudentExerciseGrid({ exercises, opening, onOpen }: { exercises: VisibleHtmlExercise[]; opening: string | null; onOpen: (ex: VisibleHtmlExercise) => void }) {
  const th = useTh();
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
      {exercises.map((ex) => (
        <div key={ex.exerciseId} onClick={() => onOpen(ex)}
          className="group relative overflow-hidden rounded-2xl cursor-pointer flex flex-col transition-all duration-300 hover:scale-[1.02]"
          style={{ aspectRatio: "1/1", background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 4px 18px rgba(0,0,0,0.16)", opacity: opening && opening !== ex.exerciseId ? 0.5 : 1 }}>
          <div className="relative flex-1 overflow-hidden" style={{ background: "#0c0c13" }}>
            <HtmlPreview html={ex.previewHtml} />
            <div className="absolute inset-0" style={{ boxShadow: "inset 0 -24px 20px -20px rgba(0,0,0,0.35)" }} />
          </div>
          <div className="p-3 shrink-0">
            <div className="text-xs font-black truncate" style={{ color: th.fg }}>{ex.name}</div>
            <div className="text-[10px] truncate mt-0.5" style={{ color: th.fg3 }}>{ex.attemptCount > 0 ? `${ex.attemptCount} tentative${ex.attemptCount > 1 ? "s" : ""}` : "Pret a ouvrir"}</div>
            {ex.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ex.tags.map((t) => <ExerciseTagPill key={t.id} label={t.name} />)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
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
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());

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

  const toggleTagFilter = (id: string) => {
    setTagFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const availableTags = collectTags(exercises);
  const filtered = tagFilter.size ? exercises.filter((ex) => ex.tags.some((t) => tagFilter.has(t.id))) : exercises;

  // "Personnalisés" = attribués à cet élève précisément (visibility privée) —
  // le travail de son expert pour lui. "Autres" = le pool global commun à
  // tous les élèves. Les personnalisés passent en premier et bien mis en
  // avant : c'est le contenu qui a le plus de valeur pour lui.
  const personalized = filtered.filter((ex) => ex.visibility === "private");
  const others = filtered.filter((ex) => ex.visibility === "global");

  return (
    <div className="space-y-8">
      {availableTags.length > 0 && (
        <TagFilterBar tags={availableTags} selected={tagFilter} onToggle={toggleTagFilter} />
      )}

      {!filtered.length && (
        <GCard><div className="p-8 text-center"><p className="text-sm" style={{ color: th.fg3 }}>Aucun exercice avec ce tag.</p></div></GCard>
      )}

      {personalized.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: th.navAC }} />
            <h3 className="text-sm font-black" style={{ color: th.fg }}>Vos exercices personnalisés</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: th.fg3 }}>Développés par votre expert spécialement pour vous.</p>
          <StudentExerciseGrid exercises={personalized} opening={opening} onOpen={open} />
        </div>
      )}

      {others.length > 0 && (
        <div>
          {personalized.length > 0 && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: th.sep, opacity: 0.5 }} />
              <span className="text-[11px] font-bold uppercase tracking-widest shrink-0" style={{ color: th.fg3 }}>Autres exercices</span>
              <div className="flex-1 h-px" style={{ background: th.sep, opacity: 0.5 }} />
            </div>
          )}
          <StudentExerciseGrid exercises={others} opening={opening} onOpen={open} />
        </div>
      )}
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
