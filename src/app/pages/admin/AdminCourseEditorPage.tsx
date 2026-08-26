import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import {
  ChevronLeft, Plus, Trash2, ChevronUp, ChevronDown,
  ChevronRight as ChevronRightIcon, GripVertical, UserPlus, X, ExternalLink,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";

interface CourseForm {
  name: string;
  slug: string;
  description: string;
  duration_minutes: string;
  price: string;
  certification_enabled: boolean;
  certification_prompt: string;
  status: "draft" | "published" | "archived";
}

interface SectionRow { id: string; title: string; order_index: number; }
interface LessonRow { id: string; section_id: string; title: string; duration_minutes: number | null; order_index: number; }
interface StudentRow { id: string; email: string; first_name: string | null; }

const EMPTY_COURSE: CourseForm = {
  name: "", slug: "", description: "", duration_minutes: "", price: "",
  certification_enabled: false, certification_prompt: "", status: "draft",
};

const slugify = (s: string) => s.toLowerCase().trim()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function AdminCourseEditorPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courseId: routeCourseId } = useParams();
  const isNew = !routeCourseId;

  const [courseId, setCourseId] = useState<string | undefined>(routeCourseId);
  const [course, setCourse] = useState<CourseForm>(EMPTY_COURSE);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [lessonsBySection, setLessonsBySection] = useState<Record<string, LessonRow[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [enrolled, setEnrolled] = useState<StudentRow[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [studentToEnroll, setStudentToEnroll] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: formation } = await supabase.from("formations").select("*").eq("id", routeCourseId).single();
      if (cancelled || !formation) { setLoading(false); return; }
      setCourse({
        name: formation.name,
        slug: formation.slug,
        description: formation.description ?? "",
        duration_minutes: formation.duration_minutes?.toString() ?? "",
        price: formation.price_cents ? (formation.price_cents / 100).toString() : "",
        certification_enabled: formation.certification_enabled,
        certification_prompt: formation.certification_prompt ?? "",
        status: formation.status,
      });
      setSlugTouched(true);
      await Promise.all([loadSections(routeCourseId!), loadStudents(routeCourseId!)]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCourseId]);

  const loadSections = async (fid: string) => {
    const { data: sectionRows } = await supabase.from("sections").select("id, title, order_index").eq("formation_id", fid).order("order_index");
    setSections(sectionRows ?? []);
    if (!sectionRows?.length) { setLessonsBySection({}); return; }
    const { data: lessonRows } = await supabase.from("lessons").select("id, section_id, title, duration_minutes, order_index")
      .in("section_id", sectionRows.map((s) => s.id)).order("order_index");
    const grouped: Record<string, LessonRow[]> = {};
    for (const l of lessonRows ?? []) (grouped[l.section_id] ??= []).push(l);
    setLessonsBySection(grouped);
  };

  const loadStudents = async (fid: string) => {
    const [{ data: enrollments }, { data: students }] = await Promise.all([
      supabase.from("enrollments").select("user_id").eq("formation_id", fid),
      supabase.from("profiles").select("id, email, first_name").eq("role", "student"),
    ]);
    const enrolledIds = new Set((enrollments ?? []).map((e) => e.user_id));
    setAllStudents(students ?? []);
    setEnrolled((students ?? []).filter((s) => enrolledIds.has(s.id)));
  };

  const handleNameChange = (name: string) => {
    setCourse((c) => ({ ...c, name, slug: slugTouched ? c.slug : slugify(name) }));
  };

  const saveCourse = async () => {
    if (!course.name.trim() || !course.slug.trim()) { setError("Nom et slug sont obligatoires."); return; }
    setSaving(true);
    setError(null);
    const payload = {
      name: course.name.trim(),
      slug: course.slug.trim(),
      description: course.description || null,
      duration_minutes: course.duration_minutes ? parseInt(course.duration_minutes, 10) : null,
      price_cents: course.price ? Math.round(parseFloat(course.price) * 100) : null,
      certification_enabled: course.certification_enabled,
      certification_prompt: course.certification_prompt || null,
      status: course.status,
    };

    if (courseId) {
      const { error: updateError } = await supabase.from("formations").update(payload).eq("id", courseId);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
    } else {
      const { data, error: insertError } = await supabase.from("formations").insert(payload).select("id").single();
      if (insertError || !data) { setError(insertError?.message ?? "Erreur inconnue"); setSaving(false); return; }
      setCourseId(data.id);
      // Le créateur du cours s'y inscrit automatiquement, comme un élève,
      // pour pouvoir tester le parcours réel sans compte séparé.
      if (user) await supabase.from("enrollments").insert({ user_id: user.id, formation_id: data.id });
      navigate(`/admin/courses/${data.id}`, { replace: true });
    }
    setSaving(false);
  };

  const addSection = async () => {
    if (!courseId) return;
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
    await supabase.from("sections").update({ title }).eq("id", id);
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
    await Promise.all([
      supabase.from("sections").update({ order_index: a.order_index }).eq("id", b.id),
      supabase.from("sections").update({ order_index: b.order_index }).eq("id", a.id),
    ]);
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Supprimer ce module et toutes ses leçons ?")) return;
    await supabase.from("sections").delete().eq("id", id);
    setSections((s) => s.filter((sec) => sec.id !== id));
  };

  const deleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm("Supprimer cette leçon ?")) return;
    await supabase.from("lessons").delete().eq("id", lessonId);
    setLessonsBySection((m) => ({ ...m, [sectionId]: (m[sectionId] ?? []).filter((l) => l.id !== lessonId) }));
  };

  const enrollStudent = async () => {
    if (!courseId || !studentToEnroll) return;
    const { error: enrollError } = await supabase.from("enrollments").insert({ user_id: studentToEnroll, formation_id: courseId });
    if (enrollError) { setError(enrollError.message); return; }
    const student = allStudents.find((s) => s.id === studentToEnroll);
    if (student) setEnrolled((e) => [...e, student]);
    setStudentToEnroll("");
  };

  const unenroll = async (userId: string) => {
    if (!courseId) return;
    await supabase.from("enrollments").delete().eq("formation_id", courseId).eq("user_id", userId);
    setEnrolled((e) => e.filter((s) => s.id !== userId));
  };

  const availableStudents = allStudents.filter((s) => !enrolled.some((e) => e.id === s.id));

  if (loading) return <div className="flex-1 flex items-center justify-center"><p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p></div>;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/courses" className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Cours</Link>
      </div>

      <GCard glow><div className="p-6 space-y-4">
        <h2 className="text-lg font-black" style={{ color: th.fg }}><GT>{isNew ? "Nouveau cours" : "Informations du cours"}</GT></h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Nom</label>
          <input value={course.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Maîtriser l'IA Générative" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
          {!slugEditing ? (
            <p className="text-xs mt-1.5" style={{ color: th.fg3 }}>
              URL : <span className="font-mono">{course.slug || "…"}</span>{" "}
              <button type="button" onClick={() => setSlugEditing(true)} className="underline hover:opacity-70">modifier</button>
            </p>
          ) : (
            <input value={course.slug} onChange={(e) => { setSlugTouched(true); setCourse((c) => ({ ...c, slug: e.target.value })); }} placeholder="maitriser-ia-generative"
              className="w-full mt-2 rounded-xl px-4 py-2 text-xs g-input font-mono" />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Description</label>
          <textarea value={course.description} onChange={(e) => setCourse((c) => ({ ...c, description: e.target.value }))} rows={3} className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Durée (min)</label>
            <input type="number" value={course.duration_minutes} onChange={(e) => setCourse((c) => ({ ...c, duration_minutes: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm g-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Prix (€)</label>
            <input type="number" value={course.price} onChange={(e) => setCourse((c) => ({ ...c, price: e.target.value }))} className="w-full rounded-xl px-4 py-3 text-sm g-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Statut</label>
            <VSelect
              value={course.status}
              onValueChange={(v) => setCourse((c) => ({ ...c, status: v as CourseForm["status"] }))}
              options={[
                { value: "draft", label: "Brouillon" },
                { value: "published", label: "Publié" },
                { value: "archived", label: "Archivé" },
              ]}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm" style={{ color: th.fg2 }}>
          <input type="checkbox" checked={course.certification_enabled} onChange={(e) => setCourse((c) => ({ ...c, certification_enabled: e.target.checked }))} />
          Préparation à la certification activée
        </label>

        {course.certification_enabled && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Prompt de référence pour la certification</label>
            <textarea value={course.certification_prompt} onChange={(e) => setCourse((c) => ({ ...c, certification_prompt: e.target.value }))} rows={2} className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none" />
          </div>
        )}

        {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}

        <ShimBtn onClick={saveCourse} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
      </div></GCard>

      {!courseId && (
        <p className="text-xs" style={{ color: th.fg3 }}>Enregistre d'abord le cours pour pouvoir ajouter des modules et inscrire des élèves.</p>
      )}

      {courseId && (
        <>
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
                        className="flex-1 bg-transparent text-sm font-semibold outline-none" style={{ color: th.fg }} />
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
                            <button onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.id}`)} className="flex-1 text-left text-sm hover:opacity-70" style={{ color: th.fg2 }}>{lesson.title}</button>
                            <span className="text-xs font-mono" style={{ color: th.fg3 }}>{lesson.duration_minutes ? `${lesson.duration_minutes} min` : "—"}</span>
                            <a href={`/lesson/${lesson.id}`} target="_blank" rel="noreferrer" title="Voir la leçon comme un élève" onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}>
                              <ExternalLink className="w-3.5 h-3.5" />Aperçu
                            </a>
                            <button onClick={() => deleteLesson(section.id, lesson.id)}><Trash2 className="w-3.5 h-3.5" style={{ color: "#fbc2ad" }} /></button>
                          </div>
                        ))}
                        <div className="px-4 py-2.5">
                          <button onClick={() => navigate(`/admin/courses/${courseId}/lessons/new`, { state: { sectionId: section.id } })}
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

          <GCard><div className="p-6">
            <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Élèves inscrits</h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1">
                <VSelect
                  value={studentToEnroll}
                  onValueChange={setStudentToEnroll}
                  placeholder="Choisir un élève…"
                  options={availableStudents.map((s) => ({ value: s.id, label: `${s.first_name || s.email} (${s.email})` }))}
                />
              </div>
              <VBtn sm onClick={enrollStudent}><span className="flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" />Inscrire</span></VBtn>
            </div>
            <div className="space-y-2">
              {enrolled.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : "rgba(181,141,224,0.04)", border: `1px solid ${th.sep}` }}>
                  <span className="flex-1 text-sm" style={{ color: th.fg2 }}>{s.first_name || s.email} <span style={{ color: th.fg3 }}>({s.email})</span></span>
                  <button onClick={() => unenroll(s.id)}><X className="w-4 h-4" style={{ color: th.fg3 }} /></button>
                </div>
              ))}
              {!enrolled.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun élève inscrit à ce cours.</p>}
            </div>
          </div></GCard>
        </>
      )}
    </div>
  );
}
