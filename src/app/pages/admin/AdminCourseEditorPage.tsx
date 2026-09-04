import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import {
  ChevronLeft, Plus, Trash2, ChevronUp, ChevronDown,
  ChevronRight as ChevronRightIcon, GripVertical, Eye,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { SaveButton, type SaveButtonState } from "@/app/components/common/SaveButton";
import { VSelect } from "@/app/components/common/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { HtmlExerciseEditDialog } from "@/app/components/practice/HtmlExerciseEditDialog";
import { listExercisesForStudent, type HtmlExerciseRow } from "@/app/lib/htmlExercises";
import { useStaffBasePath } from "@/app/lib/staffBase";
import { useBulkGeneration } from "@/app/state/bulk-generation-context";
import type { FormationStatus } from "@/app/lib/supabase/database.types";

interface CourseForm {
  name: string;
  slug: string;
  description: string;
  duration_minutes: string;
  status: FormationStatus;
}

interface SectionRow { id: string; title: string; order_index: number; }
interface LessonRow { id: string; section_id: string; title: string; duration_minutes: number | null; order_index: number; }

const EMPTY_COURSE: CourseForm = {
  name: "", slug: "", description: "", duration_minutes: "", status: "draft",
};

const slugify = (s: string) => s.toLowerCase().trim()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Cette page édite soit un TEMPLATE (/admin/courses/:courseId, tables
// formations/sections/lessons) soit un DUPLICATA personnalisé pour un élève
// (/admin/instances/:instanceId, tables formation_instances/instance_sections/
// instance_lessons) — même formulaire, tables différentes selon la route. Un
// duplicata n'a ni slug ni statut de publication (ça se gère depuis la fiche
// élève), donc ces champs sont masqués en mode instance.
export function AdminCourseEditorPage() {
  const th = useTh();
  const navigate = useNavigate();
  const base = useStaffBasePath();
  const { courseId: routeCourseId, instanceId: routeInstanceId } = useParams();
  const isInstance = !!routeInstanceId;
  const routeId = routeInstanceId ?? routeCourseId;
  const isNew = !routeId;

  const gen = useBulkGeneration();
  const [courseId, setCourseId] = useState<string | undefined>(routeId);
  const [course, setCourse] = useState<CourseForm>(EMPTY_COURSE);
  // Statut tel que chargé depuis la base — sert à détecter une transition
  // vers "publié" (saveCourse) sans jamais changer au fil des simples
  // modifications du formulaire (cf. règle "modifier ne change pas le statut").
  const [initialStatus, setInitialStatus] = useState<FormationStatus>("draft");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | undefined>();
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [lessonsBySection, setLessonsBySection] = useState<Record<string, LessonRow[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentExercises, setStudentExercises] = useState<HtmlExerciseRow[]>([]);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<HtmlExerciseRow | undefined>(undefined);

  const loadStudentExercises = async (id: string) => {
    setStudentExercises(await listExercisesForStudent(id));
  };

  // Un duplicata élève est déjà une vraie instance : on l'ouvre directement.
  // (Pour un template, le bouton "œil" équivalent vit désormais dans la
  // liste Gestion des formations — cf. AdminCoursesPage.)
  const openPreview = () => {
    if (!courseId) return;
    window.open(`${base}/instances/${courseId}/preview`, "_blank", "noopener");
  };

  useEffect(() => {
    if (isInstance && studentId) void loadStudentExercises(studentId);
  }, [isInstance, studentId]);

  const loadSections = async (id: string) => {
    if (isInstance) {
      const { data: sectionRows } = await supabase.from("instance_sections").select("id, title, order_index").eq("instance_id", id).order("order_index");
      setSections(sectionRows ?? []);
      if (!sectionRows?.length) { setLessonsBySection({}); return; }
      const { data: lessonRows } = await supabase.from("instance_lessons").select("id, section_id, title, duration_minutes, order_index")
        .in("section_id", sectionRows.map((s) => s.id)).order("order_index");
      const grouped: Record<string, LessonRow[]> = {};
      for (const l of lessonRows ?? []) (grouped[l.section_id] ??= []).push(l);
      setLessonsBySection(grouped);
      return;
    }
    const { data: sectionRows } = await supabase.from("sections").select("id, title, order_index").eq("formation_id", id).order("order_index");
    setSections(sectionRows ?? []);
    if (!sectionRows?.length) { setLessonsBySection({}); return; }
    const { data: lessonRows } = await supabase.from("lessons").select("id, section_id, title, duration_minutes, order_index")
      .in("section_id", sectionRows.map((s) => s.id)).order("order_index");
    const grouped: Record<string, LessonRow[]> = {};
    for (const l of lessonRows ?? []) (grouped[l.section_id] ??= []).push(l);
    setLessonsBySection(grouped);
  };

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (isInstance) {
        const { data: instance } = await supabase.from("formation_instances").select("*").eq("id", routeId).single();
        if (cancelled || !instance) { setLoading(false); return; }
        setCourse({
          name: instance.name,
          slug: "",
          description: instance.description ?? "",
          duration_minutes: instance.duration_minutes?.toString() ?? "",
          status: "draft",
        });
        setStudentId(instance.user_id);
      } else {
        const { data: formation } = await supabase.from("formations").select("*").eq("id", routeId).single();
        if (cancelled || !formation) { setLoading(false); return; }
        setCourse({
          name: formation.name,
          slug: formation.slug,
          description: formation.description ?? "",
          duration_minutes: formation.duration_minutes?.toString() ?? "",
          status: formation.status,
        });
        setInitialStatus(formation.status);
        setSlugTouched(true);
      }
      await loadSections(routeId!);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, isInstance]);

  const handleNameChange = (name: string) => {
    setCourse((c) => ({ ...c, name, slug: slugTouched ? c.slug : slugify(name) }));
  };

  const canSave = !!course.name.trim() && (isInstance || !!course.slug.trim());

  const flashSaved = (after?: () => void) => {
    setSaving(false);
    setJustSaved(true);
    setTimeout(() => { setJustSaved(false); after?.(); }, 900);
  };

  // Persiste vraiment le cours — statusOverride permet à
  // handlePublishAndGenerate d'enregistrer avec un statut ('generating')
  // différent de celui affiché dans le formulaire ('published').
  const persistCourse = async (statusOverride?: FormationStatus) => {
    setSaving(true);
    setError(null);

    if (isInstance) {
      const payload = {
        name: course.name.trim(),
        description: course.description || null,
        duration_minutes: course.duration_minutes ? parseInt(course.duration_minutes, 10) : null,
      };
      const { error: updateError } = await supabase.from("formation_instances").update(payload).eq("id", courseId);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
      flashSaved();
      return;
    }

    const status = statusOverride ?? course.status;
    const payload = {
      name: course.name.trim(),
      slug: course.slug.trim(),
      description: course.description || null,
      duration_minutes: course.duration_minutes ? parseInt(course.duration_minutes, 10) : null,
      status,
    };

    if (courseId) {
      const { error: updateError } = await supabase.from("formations").update(payload).eq("id", courseId);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
      setCourse((c) => ({ ...c, status }));
      setInitialStatus(status);
      flashSaved();
    } else {
      const { data, error: insertError } = await supabase.from("formations").insert(payload).select("id").single();
      if (insertError || !data) { setError(insertError?.message ?? "Erreur inconnue"); setSaving(false); return; }
      setCourseId(data.id);
      setInitialStatus(status);
      flashSaved(() => navigate(`${base}/courses/${data.id}`, { replace: true }));
    }
  };

  // Transition vers "publié" (depuis n'importe quel autre statut) : on
  // suspend l'enregistrement pour demander si la génération groupée des
  // mindmaps doit être lancée, plutôt que de publier silencieusement.
  const saveCourse = async () => {
    if (!canSave || saving) return;
    if (!isInstance && initialStatus !== "published" && initialStatus !== "generating" && course.status === "published") {
      setPublishDialogOpen(true);
      return;
    }
    await persistCourse();
  };

  const cancelPublish = () => {
    setCourse((c) => ({ ...c, status: initialStatus }));
    setPublishDialogOpen(false);
  };

  const publishWithoutGeneration = async () => {
    setPublishDialogOpen(false);
    await persistCourse("published");
  };

  const publishAndGenerate = async () => {
    setPublishDialogOpen(false);
    if (!courseId) return;
    const allLessonIds = Object.values(lessonsBySection).flat().map((l) => l.id);
    if (!allLessonIds.length) { await persistCourse("published"); return; }
    await persistCourse("generating");
    gen.startCourseMindmapGeneration(courseId, course.name.trim() || "Formation", allLessonIds);
  };

  const saveButtonState: SaveButtonState = saving ? "saving" : justSaved ? "saved" : canSave ? "active" : "disabled";

  const addSection = async () => {
    if (!courseId) return;
    if (isInstance) {
      const { data, error: insertError } = await supabase
        .from("instance_sections").insert({ instance_id: courseId, title: "Nouveau module", order_index: sections.length })
        .select("id, title, order_index").single();
      if (insertError || !data) { setError(insertError?.message ?? "Erreur inconnue"); return; }
      setSections((s) => [...s, data]);
      return;
    }
    const { data, error: insertError } = await supabase
      .from("sections").insert({ formation_id: courseId, title: "Nouveau module", order_index: sections.length })
      .select("id, title, order_index").single();
    if (insertError || !data) { setError(insertError?.message ?? "Erreur inconnue"); return; }
    setSections((s) => [...s, data]);
  };

  const renameSection = (id: string, title: string) => {
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, title } : sec)));
  };

  const persistSectionTitle = async (id: string, title: string) => {
    await supabase.from(isInstance ? "instance_sections" : "sections").update({ title }).eq("id", id);
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const a = sections[index], b = sections[target];
    const next = [...sections];
    next[index] = { ...b, order_index: a.order_index };
    next[target] = { ...a, order_index: b.order_index };
    next.sort((x, y) => x.order_index - y.order_index);
    setSections(next);
    const table = isInstance ? "instance_sections" : "sections";
    await Promise.all([
      supabase.from(table).update({ order_index: a.order_index }).eq("id", b.id),
      supabase.from(table).update({ order_index: b.order_index }).eq("id", a.id),
    ]);
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Supprimer ce module et toutes ses leçons ?")) return;
    await supabase.from(isInstance ? "instance_sections" : "sections").delete().eq("id", id);
    setSections((s) => s.filter((sec) => sec.id !== id));
  };

  const deleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm("Supprimer cette leçon ?")) return;
    await supabase.from(isInstance ? "instance_lessons" : "lessons").delete().eq("id", lessonId);
    setLessonsBySection((m) => ({ ...m, [sectionId]: (m[sectionId] ?? []).filter((l) => l.id !== lessonId) }));
  };

  const lessonsBase = isInstance ? `${base}/instances/${courseId}/lessons` : `${base}/courses/${courseId}/lessons`;

  const backHref = isInstance ? (studentId ? `${base}/planning/students/${studentId}` : `${base}/planning`) : `${base}/courses`;
  const backLabel = isInstance ? "Élève" : "Cours";

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p></div>;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to={backHref} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />{backLabel}</Link>
        {courseId && isInstance && (
          <button type="button" onClick={openPreview} title="Visualiser comme un élève" className="flex items-center hover:opacity-70" style={{ color: th.navAC }}>
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      <GCard glow><div className="p-6 space-y-4">
        <h2 className="text-lg font-black" style={{ color: th.fg }}>
          <GT>{isNew ? "Nouvelle formation" : isInstance ? "Personnaliser la formation" : "Informations du cours"}</GT>
        </h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Nom</label>
          <input value={course.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Maîtriser l'IA Générative" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
          {!isInstance && (!slugEditing ? (
            <p className="text-xs mt-1.5" style={{ color: th.fg3 }}>
              URL : <span className="font-mono">{course.slug || "…"}</span>{" "}
              <button type="button" onClick={() => setSlugEditing(true)} className="underline hover:opacity-70">modifier</button>
            </p>
          ) : (
            <input value={course.slug} onChange={(e) => { setSlugTouched(true); setCourse((c) => ({ ...c, slug: e.target.value })); }} placeholder="maitriser-ia-generative"
              className="w-full mt-2 rounded-xl px-4 py-2 text-xs g-input font-mono" />
          ))}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Description</label>
          <textarea value={course.description} onChange={(e) => setCourse((c) => ({ ...c, description: e.target.value }))} rows={3} className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none" />
        </div>

        <div className={isInstance ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Durée (min)</label>
            <input type="number" value={course.duration_minutes} onChange={(e) => setCourse((c) => ({ ...c, duration_minutes: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm g-input" />
          </div>
          {!isInstance && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Statut</label>
              <VSelect
                value={course.status}
                onValueChange={(v) => setCourse((c) => ({ ...c, status: v as CourseForm["status"] }))}
                // Verrouillé seulement pendant une génération réellement en
                // cours DANS CETTE SESSION (gen.courseId) — pas simplement
                // parce que le statut chargé vaut "generating" : sinon un
                // job mort (onglet fermé, page rechargée pendant la
                // génération) laisserait le select bloqué à jamais, sans
                // aucun moyen de repasser la formation à "Publié" à la main.
                disabled={gen.running && gen.courseId === courseId}
                options={[
                  { value: "draft", label: "Brouillon" },
                  { value: "published", label: "Publié" },
                  { value: "archived", label: "Archivé" },
                  // Jamais choisi manuellement — n'apparaît que le temps de la
                  // génération groupée, pour que le select ne semble pas vide.
                  ...(course.status === "generating" ? [{ value: "generating", label: "Génération en cours…" }] : []),
                ]}
              />
            </div>
          )}
        </div>

        {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
      </div></GCard>

      {!courseId && (
        <p className="text-xs" style={{ color: th.fg3 }}>Enregistre d'abord le cours pour pouvoir ajouter des modules.</p>
      )}

      {courseId && (
        <GCard><div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black" style={{ color: th.fg }}>Modules</h3>
            <VBtn sm onClick={addSection}><span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Ajouter un module</span></VBtn>
          </div>

          <div className="space-y-2">
            {sections.map((section, index) => {
              const lessons = lessonsBySection[section.id] ?? [];
              const isOpen = !!expanded[section.id];
              return (
                <div key={section.id} className="rounded-xl" style={{ border: `1px solid ${th.sep}` }}>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <GripVertical className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
                    <input value={section.title} onChange={(e) => renameSection(section.id, e.target.value)} onBlur={(e) => persistSectionTitle(section.id, e.target.value)}
                      className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none" style={{ color: th.fg }} />
                    <span className="text-xs shrink-0" style={{ color: th.fg3 }}>{lessons.length} leçon{lessons.length !== 1 ? "s" : ""}</span>
                    <button onClick={() => moveSection(index, -1)} disabled={index === 0} className="disabled:opacity-20"><ChevronUp className="w-4 h-4" style={{ color: th.fg3 }} /></button>
                    <button onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="disabled:opacity-20"><ChevronDown className="w-4 h-4" style={{ color: th.fg3 }} /></button>
                    <button onClick={() => deleteSection(section.id)}><Trash2 className="w-4 h-4" style={{ color: "#fbc2ad" }} /></button>
                    <button onClick={() => setExpanded((m) => ({ ...m, [section.id]: !isOpen }))}>
                      <ChevronRightIcon className="w-4 h-4 transition-transform" style={{ color: th.fg3, transform: isOpen ? "rotate(90deg)" : "none" }} />
                    </button>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${th.sep}` }}>
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
                          <button onClick={() => navigate(`${lessonsBase}/${lesson.id}`)} className="flex-1 min-w-0 truncate text-left text-sm hover:opacity-70" style={{ color: th.fg2 }}>{lesson.title}</button>
                          <span className="text-xs font-mono" style={{ color: th.fg3 }}>{lesson.duration_minutes ? `${lesson.duration_minutes} min` : "—"}</span>
                          <button onClick={() => deleteLesson(section.id, lesson.id)}><Trash2 className="w-3.5 h-3.5" style={{ color: "#fbc2ad" }} /></button>
                        </div>
                      ))}
                      <div className="px-4 py-2.5">
                        <button onClick={() => navigate(`${lessonsBase}/new`, { state: { sectionId: section.id } })}
                          className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}>
                          <Plus className="w-3.5 h-3.5" />Ajouter une leçon
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!sections.length && <p className="text-xs py-4 text-center" style={{ color: th.fg3 }}>Aucun module. Commence par en ajouter un.</p>}
          </div>
        </div></GCard>
      )}

      {courseId && isInstance && studentId && (
        <GCard><div className="p-6">
          <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Exercices pour vous</h3>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            <button onClick={() => { setEditingExercise(undefined); setExerciseDialogOpen(true); }}
              className="group relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 hover:scale-[1.02]"
              style={{ aspectRatio: "1/1", background: th.isDark ? `${th.gradShadow(0.06)}` : `${th.gradShadow(0.05)}`, border: `1.5px dashed ${th.gradShadow(0.4)}` }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, boxShadow: `0 6px 20px ${th.gradShadow(0.4)}` }}>
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-black" style={{ color: th.fg }}>Nouvel exercice</div>
            </button>
            {studentExercises.map((ex) => (
              <div key={ex.id} onClick={() => { setEditingExercise(ex); setExerciseDialogOpen(true); }}
                className="cursor-pointer rounded-2xl p-3 flex flex-col transition-all duration-300 hover:scale-[1.02]"
                style={{ aspectRatio: "1/1", background: th.card, border: `1px solid ${th.sep}` }}>
                <div className="text-xs font-black mb-1" style={{ color: th.fg }}>{ex.name}</div>
                <div className="text-[11px] leading-relaxed flex-1 overflow-hidden" style={{ color: th.fg3 }}>{ex.description || "Pas de consigne."}</div>
              </div>
            ))}
          </div>
          {!studentExercises.length && <p className="text-xs mt-3" style={{ color: th.fg3 }}>Aucun exercice privé attribué à cet élève pour l'instant.</p>}
        </div></GCard>
      )}

      <div className="flex justify-end">
        <SaveButton state={saveButtonState} onClick={saveCourse} />
      </div>

      <Dialog open={publishDialogOpen} onOpenChange={(v) => !v && cancelPublish()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publier la formation ?</DialogTitle>
            <DialogDescription>
              La publication peut lancer la génération de la mindmap sur toutes les leçons déjà créées de cette formation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <ShimBtn full onClick={publishAndGenerate}>Publier et générer</ShimBtn>
            <VBtn full onClick={publishWithoutGeneration}>Publier sans génération</VBtn>
            <button type="button" onClick={cancelPublish} className="w-full px-4 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: th.fg3 }}>
              Annuler
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {isInstance && studentId && (
        <HtmlExerciseEditDialog
          open={exerciseDialogOpen}
          onOpenChange={setExerciseDialogOpen}
          exercise={editingExercise}
          defaultCheckedStudentId={studentId}
          onSaved={() => void loadStudentExercises(studentId)}
        />
      )}
    </div>
  );
}
