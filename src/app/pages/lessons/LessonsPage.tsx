import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Lock, ChevronDown, CheckCircle, Play, Clock, Pencil, Loader2, XCircle, Network, Headphones } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";

import { cx } from "@/app/lib/cx";
import { moduleProgress, nextLessonOf, MODULE_STATUS_LABEL } from "@/app/lib/journey";
import { formatDuration, isLessonCompleted } from "@/app/lib/learning";
import { useAllCourseProgress, type CourseProgressEntry } from "@/app/state/useAllCourseProgress";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { requestAvatarVideoGeneration, pollAvatarVideoStatus } from "@/app/lib/avatarVideos";
import { generatePodcast } from "@/app/lib/podcasts";
import { DEFAULT_PODCAST_VARIANT } from "@/app/lib/podcastFormats";
import { requestMindmapGeneration } from "@/app/lib/mindmaps";

type SectionStatus = "complete" | "active" | "locked";
type GenType = "mindmap" | "podcast" | "avatar_video";
type GenStatus = "pending" | "running" | "done" | "error";

// Vidéo IA masquée partout pour le moment (cf. LessonPage TABS) — la génération
// et le code associé restent en place, seule l'entrée de la liste est retirée.
const GEN_TYPES: { id: GenType; label: string; hint: string; Icon: typeof Network }[] = [
  { id: "mindmap", label: "Mindmap", hint: "Carte mentale interactive de la leçon", Icon: Network },
  { id: "podcast", label: "Podcast", hint: "Dialogue audio à deux voix", Icon: Headphones },
];

const greenBtn = { background: "rgba(106,222,177,0.12)", border: "1px solid rgba(106,222,177,0.35)", color: "var(--success)" };

export function LessonsPage() {
  const th = useTh();
  const { loading, error: errorMsg, courses } = useAllCourseProgress();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  // La première formation est ouverte par défaut, les suivantes repliées —
  // l'élève déplie celles qu'il veut consulter.
  useEffect(() => {
    if (courses.length && openIds.size === 0) setOpenIds(new Set([courses[0].instance.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.length]);

  // Lien vers un module (frise de l'accueil : /lessons#module-…) : on y
  // descend une fois le parcours affiché.
  useEffect(() => {
    if (loading || !window.location.hash) return;
    const t = window.setTimeout(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => window.clearTimeout(t);
  }, [loading, openIds.size]);

  const toggle = (id: string) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm" style={{ color: th.fg3 }}>Chargement de vos leçons…</span></div>;
  }

  if (errorMsg) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm text-[var(--danger)]">{errorMsg}</span></div>;
  }

  if (!courses.length) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <GCard><div className="p-8 text-center max-w-sm">
          <p className="text-sm font-semibold mb-1" style={{ color: th.fg }}>Aucune formation en cours</p>
          <p className="text-xs" style={{ color: th.fg3 }}>Vous n'êtes inscrit·e à aucune formation pour le moment. Contactez votre administrateur.</p>
        </div></GCard>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      <div className="mb-10 fade-up">
        <p className="eyebrow" style={{ color: th.fg3 }}>Apprendre</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>Mes <GT>leçons</GT></h1>
        <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
          Ton parcours module par module. Les leçons s'ouvrent dans l'ordre : chaque leçon validée débloque la suivante.
        </p>
      </div>

      <div className="space-y-16">
        {courses.map((entry) => (
          <FormationAccordion key={entry.instance.id} entry={entry} open={openIds.has(entry.instance.id)} onToggle={() => toggle(entry.instance.id)} />
        ))}
      </div>
    </div>
  );
}

function FormationAccordion({ entry, open, onToggle }: { entry: CourseProgressEntry; open: boolean; onToggle: () => void }) {
  const th = useTh();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { outline, lessonStates } = entry;
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [genView, setGenView] = useState<"choose" | "progress">("choose");
  const [genType, setGenType] = useState<GenType>("mindmap");
  const [genStatuses, setGenStatuses] = useState<Record<string, GenStatus>>({});
  const [genRunning, setGenRunning] = useState(false);

  useEffect(() => {
    if (!open || openSection) return;
    const firstOpenable = outline.sections.find((s) => s.lessons.some((l) => lessonStates.find((st) => st.lesson.id === l.id)?.state !== "locked"));
    setOpenSection(firstOpenable?.id ?? outline.sections[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stateFor = (lessonId: string) => lessonStates.find((s) => s.lesson.id === lessonId);
  const totalLessons = lessonStates.length;
  const completedLessons = lessonStates.filter(isLessonCompleted).length;
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalTimeSeconds = lessonStates.reduce((sum, s) => sum + (s.progress?.timeSpentSeconds ?? 0), 0);
  const scores = lessonStates.map((s) => s.progress?.bestQuizScore).filter((s): s is number => s != null);
  const successRate = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const formationStatus: SectionStatus = totalLessons === 0 ? "locked" : completedLessons === totalLessons ? "complete" : "active";
  const FSC = {
    complete: { bg: "rgba(106,222,177,0.1)", text: "#6adeb1", border: "rgba(106,222,177,0.25)" },
    active: { bg: `${th.gradShadow(0.1)}`, text: `${th.grad2}`, border: `${th.gradShadow(0.3)}` },
    locked: { bg: "transparent", text: th.fg3, border: th.sep },
  };
  const fsc = FSC[formationStatus];

  const goLesson = (lessonId: string) => navigate(`/lesson/${lessonId}`);

  const toggleLesson = (lessonId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const startEdit = () => setEditMode(true);
  const cancelEdit = () => { setEditMode(false); setSelected(new Set()); };
  const openGenDialog = () => { setGenView("choose"); setGenDialogOpen(true); };

  const runBulkGeneration = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setGenRunning(true);
    setGenView("progress");
    const initial: Record<string, GenStatus> = {};
    ids.forEach((id) => { initial[id] = "pending"; });
    setGenStatuses(initial);

    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      setGenStatuses((s) => ({ ...s, [id]: "running" }));
      try {
        if (genType === "mindmap") {
          await requestMindmapGeneration(id);
        } else if (genType === "podcast") {
          if (!user) throw new Error("Session invalide.");
          await generatePodcast(id, DEFAULT_PODCAST_VARIANT);
        } else {
          await requestAvatarVideoGeneration(id);
          const result = await pollAvatarVideoStatus(id);
          if (!result) throw new Error("Délai de génération dépassé.");
          if (result.status === "failed") throw new Error(result.error ?? "Échec de la génération HeyGen.");
        }
        successCount += 1;
        setGenStatuses((s) => ({ ...s, [id]: "done" }));
      } catch (err) {
        console.error(err);
        failCount += 1;
        setGenStatuses((s) => ({ ...s, [id]: "error" }));
      }
    }

    setGenRunning(false);
    if (failCount === 0) toast.success(`${successCount} leçon(s) générée(s) avec succès.`);
    else toast.warning(`${successCount} réussie(s), ${failCount} échouée(s).`);
  };

  const finishGenDialog = () => {
    setGenDialogOpen(false);
    setGenView("choose");
    setGenStatuses({});
    setEditMode(false);
    setSelected(new Set());
  };

  const modules = moduleProgress(outline, lessonStates);
  const next = nextLessonOf(lessonStates);
  const currentIdx = modules.findIndex((m) => m.status === "current");

  return (
    <section className="fade-up" aria-labelledby={`course-${outline.instanceId}`}>
      {/* En-tête de la formation : titre, progression, temps, et la reprise. */}
      <div className="pb-7" style={{ borderBottom: `1px solid ${th.sep}` }}>
        <button type="button" className="w-full text-left group" onClick={onToggle} aria-expanded={open}>
          <p className="eyebrow" style={{ color: th.fg3 }}>
            Formation · {outline.sections.length} module{outline.sections.length !== 1 ? "s" : ""} · {totalLessons} leçon{totalLessons !== 1 ? "s" : ""}
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h3 id={`course-${outline.instanceId}`} className="text-[1.45rem] sm:text-[1.8rem] font-black leading-tight" style={{ color: th.fg }}>{outline.instanceName}</h3>
            <ChevronDown className="w-5 h-5 mt-2 shrink-0 transition-transform" style={{ color: th.fg3, transform: open ? "rotate(180deg)" : "none" }} />
          </div>
        </button>
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3 min-w-[220px] flex-1 max-w-md">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: th.navA }}>
              <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: th.iris }} />
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: th.fg }}>{overallPct}%</span>
          </div>
          <span className="text-sm tabular-nums" style={{ color: th.fg2 }}>{completedLessons}/{totalLessons} validées</span>
          {successRate != null && <span className="text-sm tabular-nums" style={{ color: th.fg2 }}>{successRate}% aux quiz</span>}
          {totalTimeSeconds > 0 && <span className="text-sm tabular-nums" style={{ color: th.fg2 }}>{formatDuration(totalTimeSeconds)} de formation</span>}
          {next && !editMode && (
            <button type="button" onClick={() => goLesson(next.lesson.id)}
              className="sweep w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-[2px] text-sm font-semibold whitespace-nowrap"
              style={{ background: th.ink, color: th.onInk }}>
              <Play className="w-3.5 h-3.5" fill="currentColor" />{next.progress ? "Reprendre" : "Commencer"}
              <span className="hidden sm:inline">: {next.lesson.title.length > 34 ? `${next.lesson.title.slice(0, 32)}…` : next.lesson.title}</span>
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="pt-6">
          {isStaff(role) && (
            <div className="flex items-center justify-end gap-3 flex-wrap mb-5">
              {!editMode ? (
                <button onClick={startEdit} className="sweep inline-flex items-center gap-2 px-4 min-h-9 rounded-[2px] text-sm font-semibold" style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
                  <Pencil className="w-3.5 h-3.5" />Générer du contenu IA
                </button>
              ) : (
                <>
                  <span className="text-xs font-semibold" style={{ color: th.fg3 }}>{selected.size} sélectionnée{selected.size > 1 ? "s" : ""}</span>
                  <button onClick={cancelEdit} className="px-3.5 min-h-9 rounded-[2px] text-sm font-semibold" style={{ border: `1px solid ${th.inputB}`, color: th.fg2 }}>Annuler</button>
                  <button onClick={openGenDialog} disabled={selected.size === 0} className="sweep inline-flex items-center gap-2 px-4 min-h-9 rounded-[2px] text-sm font-semibold disabled:opacity-40" style={{ background: th.ink, color: th.onInk }}>Valider</button>
                </>
              )}
            </div>
          )}
          {editMode && (
            <p className="mb-5 px-4 py-3 rounded-[4px] text-sm" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}>
              Sélectionne les leçons pour lesquelles générer un contenu IA (mindmap ou podcast), puis clique sur <strong style={{ color: th.fg }}>Valider</strong>.
            </p>
          )}

          {/* Les modules en chapitres numérotés, sur un fil vertical qui passe au
              dégradé iris jusqu'au module en cours. */}
          <ol className="relative">
            {modules.map((m, mi) => {
              const reached = currentIdx >= 0 ? mi < currentIdx : m.status === "done";
              const last = mi === modules.length - 1;
              return (
                <li key={m.section.id} id={`module-${m.section.id}`} className="relative grid grid-cols-[40px_minmax(0,1fr)] sm:grid-cols-[56px_minmax(0,1fr)] gap-x-3 sm:gap-x-5 scroll-mt-6">
                  {!last && <span aria-hidden className="absolute left-[19px] sm:left-[27px] top-11 bottom-0 w-[2px]" style={{ background: reached ? "var(--grad-iris)" : th.sep }} />}
                  <span className="relative z-10 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-base font-black tabular-nums"
                    style={m.status === "done" ? { background: "var(--grad-bleu)", color: "#000" }
                      : m.status === "current" ? { background: th.ink, color: th.onInk }
                      : { background: th.bg, color: m.status === "locked" ? th.fg3 : th.fg, border: `1px solid ${m.status === "locked" ? th.sep : th.inputB}` }}>
                    {m.status === "done" ? <CheckCircle className="w-5 h-5" /> : m.status === "locked" ? <Lock className="w-4 h-4" /> : String(mi + 1).padStart(2, "0")}
                  </span>
                  <div className={cx("min-w-0", !last && "pb-10")}>
                    <div className="pt-1.5 sm:pt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h4 className="text-lg sm:text-xl font-black leading-snug" style={{ color: m.status === "locked" ? th.fg3 : th.fg }}>{m.section.title}</h4>
                      <span className="eyebrow" style={{ color: m.status === "current" ? th.fg : th.fg3 }}>{MODULE_STATUS_LABEL[m.status]}</span>
                    </div>
                    <p className="mt-1 text-sm tabular-nums" style={{ color: th.fg3 }}>
                      {m.done}/{m.total} leçon{m.total > 1 ? "s" : ""}{m.minutes ? ` · ${m.minutes} min` : ""}
                    </p>
                    {m.status === "locked" && !m.section.isUnlocked && (
                      <p className="mt-2 text-sm" style={{ color: th.fg2 }}>Ton formateur ouvrira ce module le moment venu.</p>
                    )}
                    {m.section.lessons.length === 0 && (
                      <p className="mt-3 text-sm" style={{ color: th.fg3 }}>Aucune leçon dans ce module pour le moment.</p>
                    )}
                    {m.section.lessons.length > 0 && (
                      <ul className="mt-4 rounded-[6px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
                        {m.section.lessons.map((lesson, i) => {
                          const s = stateFor(lesson.id);
                          const state = s?.state ?? "locked";
                          const isNext = next?.lesson.id === lesson.id;
                          const clickable = !editMode && state !== "locked";
                          return (
                            <li key={lesson.id} style={i > 0 ? { borderTop: `1px solid ${th.sep}` } : undefined}>
                              <div role={clickable || editMode ? "button" : undefined} tabIndex={clickable || editMode ? 0 : undefined}
                                onKeyDown={(e) => { if (e.key === "Enter") { if (editMode) toggleLesson(lesson.id); else if (clickable) goLesson(lesson.id); } }}
                                onClick={() => { if (editMode) toggleLesson(lesson.id); else if (clickable) goLesson(lesson.id); }}
                                className={cx("group relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 transition-colors", (clickable || editMode) && "cursor-pointer hover-fine:bg-[var(--hover-row)]")}
                                style={{ ["--hover-row" as string]: th.navA, background: isNext && !editMode ? th.navA : undefined }}>
                                {isNext && !editMode && <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "var(--grad-iris)" }} />}
                                {editMode && <Checkbox checked={selected.has(lesson.id)} onCheckedChange={() => toggleLesson(lesson.id)} onClick={(e) => e.stopPropagation()} className="shrink-0" />}
                                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                  style={state === "completed" ? { background: "rgba(106,222,177,0.2)" } : isNext ? { background: th.ink, color: th.onInk } : { border: `1px solid ${th.sep}` }}>
                                  {state === "completed" ? <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" /> : state === "locked" ? <Lock className="w-3 h-3" style={{ color: th.fg3 }} /> : <Play className="w-2.5 h-2.5 ml-0.5" fill="currentColor" style={{ color: isNext ? th.onInk : th.fg }} />}
                                </span>
                                <span className={cx("flex-1 min-w-0 text-[15px] leading-snug break-words", isNext && "font-bold")} style={{ color: state === "locked" ? th.fg3 : th.fg }}>{lesson.title}</span>
                                {isNext && !editMode && <span className="hidden sm:inline eyebrow shrink-0" style={{ color: th.fg }}>{s?.progress ? "À reprendre" : "À suivre"}</span>}
                                <span className="text-xs tabular-nums shrink-0 flex items-center gap-1" style={{ color: th.fg3 }}>
                                  {lesson.durationMinutes ? <><Clock className="w-3 h-3" />{lesson.durationMinutes} min</> : "—"}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <Dialog open={genDialogOpen} onOpenChange={(v) => { if (!genRunning) setGenDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          {genView === "choose" ? (
            <>
              <DialogHeader>
                <DialogTitle>Générer un contenu IA</DialogTitle>
                <DialogDescription>
                  Pour {selected.size} leçon{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""} — personnalisé automatiquement à partir du cours et du profil de l'élève, comme dans une leçon normale.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                {GEN_TYPES.map(({ id, label, hint, Icon }) => (
                  <button key={id} onClick={() => setGenType(id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{ background: genType === id ? `${th.gradShadow(0.1)}` : "transparent", border: `1px solid ${genType === id ? th.navAC : th.sep}` }}>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: genType === id ? th.navAC : th.fg3 }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold" style={{ color: th.fg }}>{label}</div>
                      <div className="text-xs" style={{ color: th.fg3 }}>{hint}</div>
                    </div>
                  </button>
                ))}
              </div>
              <DialogFooter>
                <button onClick={() => setGenDialogOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "transparent", border: `1px solid ${th.sep}`, color: th.fg3 }}>
                  Annuler
                </button>
                <button onClick={() => void runBulkGeneration()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={greenBtn}>
                  Générer
                </button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Génération en cours</DialogTitle>
                <DialogDescription>
                  {genRunning ? "Ne ferme pas cette fenêtre — chaque leçon est générée l'une après l'autre." : "Terminé."}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-72 overflow-y-auto space-y-1.5 py-1">
                {Array.from(selected).map((id) => {
                  const lesson = outline.sections.flatMap((s) => s.lessons).find((l) => l.id === id);
                  const st = genStatuses[id] ?? "pending";
                  return (
                    <div key={id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      {st === "done" && <CheckCircle className="w-4 h-4 shrink-0 text-[var(--success)]" />}
                      {st === "error" && <XCircle className="w-4 h-4 shrink-0 text-[var(--danger)]" />}
                      {st === "running" && <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: th.navAC }} />}
                      {st === "pending" && <div className="w-4 h-4 shrink-0 rounded-full" style={{ border: `1px solid ${th.sep}` }} />}
                      <span className="flex-1 text-xs truncate" style={{ color: th.fg }}>{lesson?.title ?? id}</span>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <button onClick={finishGenDialog} disabled={genRunning}
                  className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none" style={greenBtn}>
                  Terminer
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
