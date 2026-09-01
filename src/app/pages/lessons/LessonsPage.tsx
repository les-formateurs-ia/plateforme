import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Lock, ChevronDown, CheckCircle, Play, Clock, Pencil, Loader2, XCircle, Network, Headphones, Bot, GraduationCap } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import { formatDuration, type LessonWithState } from "@/app/lib/learning";
import { useAllCourseProgress, type CourseProgressEntry } from "@/app/state/useAllCourseProgress";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { requestAvatarVideoGeneration, pollAvatarVideoStatus } from "@/app/lib/avatarVideos";
import { requestPodcastGeneration, pollForPodcast } from "@/app/lib/podcasts";
import { DEFAULT_PODCAST_VARIANT } from "@/app/lib/podcastFormats";
import { requestMindmapGeneration } from "@/app/lib/mindmaps";

type SectionStatus = "complete" | "active" | "locked";
type GenType = "mindmap" | "podcast" | "avatar_video";
type GenStatus = "pending" | "running" | "done" | "error";

const GEN_TYPES: { id: GenType; label: string; hint: string; Icon: typeof Network }[] = [
  { id: "mindmap", label: "Mindmap", hint: "Carte mentale interactive de la leçon", Icon: Network },
  { id: "podcast", label: "Podcast", hint: "Dialogue audio à deux voix", Icon: Headphones },
  { id: "avatar_video", label: "Vidéo IA", hint: "Avatar vidéo qui explique la leçon", Icon: Bot },
];

const greenBtn = { background: "rgba(106,222,177,0.12)", border: "1px solid rgba(106,222,177,0.35)", color: "#6adeb1" };

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

  const toggle = (id: string) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm" style={{ color: th.fg3 }}>Chargement de vos leçons…</span></div>;
  }

  if (errorMsg) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm text-[#fbc2ad]">{errorMsg}</span></div>;
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Mes leçons</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>{courses.length} formation{courses.length > 1 ? "s" : ""} en cours</p>
      </div>

      <div className="space-y-4">
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
  const completedLessons = lessonStates.filter((s) => s.state === "completed").length;
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalTimeSeconds = lessonStates.reduce((sum, s) => sum + (s.progress?.timeSpentSeconds ?? 0), 0);
  const scores = lessonStates.map((s) => s.progress?.bestQuizScore).filter((s): s is number => s != null);
  const successRate = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const formationStatus: SectionStatus = totalLessons === 0 ? "locked" : completedLessons === totalLessons ? "complete" : "active";
  const FSC = {
    complete: { bg: "rgba(106,222,177,0.1)", text: "#6adeb1", border: "rgba(106,222,177,0.25)" },
    active: { bg: "rgba(181,141,224,0.1)", text: "#dbacf0", border: "rgba(181,141,224,0.3)" },
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
      const since = Date.now();
      try {
        if (genType === "mindmap") {
          await requestMindmapGeneration(id);
        } else if (genType === "podcast") {
          if (!user) throw new Error("Session invalide.");
          await requestPodcastGeneration(id, DEFAULT_PODCAST_VARIANT);
          const result = await pollForPodcast(user.id, id, DEFAULT_PODCAST_VARIANT, since);
          if (!result) throw new Error("Délai de génération dépassé.");
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

  return (
    <GCard>
      <button className="w-full text-left" onClick={onToggle}>
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: fsc.bg, border: `1px solid ${fsc.border}` }}>
            {formationStatus === "complete" ? <CheckCircle className="w-5 h-5 text-[#6adeb1]" /> : <GraduationCap className="w-5 h-5" style={{ color: fsc.text }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold mb-1" style={{ color: th.fg }}>{outline.instanceName}</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs" style={{ color: th.fg3 }}>{outline.sections.length} module{outline.sections.length !== 1 ? "s" : ""} · {completedLessons}/{totalLessons} leçons</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(181,141,224,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: formationStatus === "complete" ? "linear-gradient(90deg,#78d5e2,#6adeb1)" : "linear-gradient(90deg,#b58de0,#dbacf0)" }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: fsc.text }}>{overallPct}%</span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: th.fg3, transform: open ? "rotate(180deg)" : "none" }} />
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${th.sep}` }}>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-end gap-3 flex-wrap">
              {isStaff(role) && !editMode && (
                <button onClick={startEdit}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={greenBtn}>
                  <Pencil className="w-3.5 h-3.5" />Éditer
                </button>
              )}
              {isStaff(role) && editMode && (
                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-xs font-semibold" style={{ color: th.fg3 }}>{selected.size} sélectionnée{selected.size > 1 ? "s" : ""}</span>
                  <button onClick={cancelEdit} className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80" style={{ background: "transparent", border: `1px solid ${th.sep}`, color: th.fg3 }}>
                    Annuler
                  </button>
                  <button onClick={openGenDialog} disabled={selected.size === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40 disabled:pointer-events-none"
                    style={greenBtn}>
                    Valider
                  </button>
                </div>
              )}
            </div>

            {editMode && (
              <div className="px-4 py-2.5 rounded-xl text-xs" style={{ background: "rgba(106,222,177,0.08)", border: "1px solid rgba(106,222,177,0.25)", color: th.fg3 }}>
                Sélectionne les leçons pour lesquelles générer un contenu IA (mindmap, podcast ou vidéo avatar), puis clique sur <strong style={{ color: "#6adeb1" }}>Valider</strong>.
              </div>
            )}

            <div className="flex items-center gap-5 sm:gap-8 flex-wrap rounded-xl p-4" style={{ background: th.isDark ? "rgba(255,255,255,0.02)" : "rgba(181,141,224,0.03)", border: `1px solid ${th.sep}` }}>
              {[
                { val: String(completedLessons), sub: "Leçons terminées" },
                { val: successRate != null ? `${successRate}%` : "—", sub: "Taux de réussite" },
                { val: formatDuration(totalTimeSeconds), sub: "Temps de pratique" },
              ].map(({ val, sub }) => (
                <div key={sub} className="text-center">
                  <div className="text-xl font-black mb-0.5" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{val}</GT></div>
                  <div className="text-xs" style={{ color: th.fg3 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {outline.sections.map((mod) => {
                const modStates = mod.lessons.map((l) => stateFor(l.id)).filter((s): s is LessonWithState => !!s);
                const done = modStates.filter((s) => s.state === "completed").length;
                const total = mod.lessons.length;
                const status: SectionStatus = total === 0 ? "locked" : done === total ? "complete" : modStates.some((s) => s.state !== "locked") ? "active" : "locked";
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const modOpen = editMode || openSection === mod.id;
                const SC = {
                  complete: { bg: "rgba(106,222,177,0.1)", text: "#6adeb1", border: "rgba(106,222,177,0.25)", label: "Validé ✓" },
                  active: { bg: "rgba(181,141,224,0.1)", text: "#dbacf0", border: "rgba(181,141,224,0.3)", label: "En cours" },
                  locked: { bg: "transparent", text: th.fg3, border: th.sep, label: "Verrouillé" },
                };
                const sc = SC[status];
                const nextLesson = modStates.find((s) => s.state === "available");
                return (
                  <GCard key={mod.id}>
                    <button className="w-full text-left" onClick={() => !editMode && setOpenSection(modOpen ? null : mod.id)}>
                      <div className="px-5 py-4 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                          {status === "locked" ? <Lock className="w-4 h-4" style={{ color: th.fg3 }} /> : status === "complete" ? <CheckCircle className="w-5 h-5 text-[#6adeb1]" /> : <Play className="w-4 h-4" style={{ color: th.navAC }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold" style={{ color: status === "locked" ? th.fg3 : th.fg }}>{mod.title}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs" style={{ color: th.fg3 }}>{done}/{total} leçons</span>
                            {status !== "locked" && total > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(181,141,224,0.1)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: status === "complete" ? "linear-gradient(90deg,#78d5e2,#6adeb1)" : "linear-gradient(90deg,#b58de0,#dbacf0)" }} />
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: sc.text }}>{pct}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {!editMode && <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: th.fg3, transform: modOpen ? "rotate(180deg)" : "none" }} />}
                      </div>
                    </button>
                    {modOpen && (
                      <div style={{ borderTop: `1px solid ${th.sep}` }}>
                        {mod.lessons.length === 0 && (
                          <div className="px-5 py-4 text-xs" style={{ color: th.fg3 }}>Aucune leçon dans ce module pour le moment.</div>
                        )}
                        {mod.lessons.map((lesson, i) => {
                          const s = stateFor(lesson.id);
                          const state = s?.state ?? "locked";
                          const clickable = !editMode && state !== "locked";
                          return (
                            <div key={lesson.id} className={cx("flex items-center gap-4 px-5 py-3 transition-colors", (clickable || editMode) && "cursor-pointer hover:opacity-80")}
                              onClick={() => { if (editMode) toggleLesson(lesson.id); else if (clickable) goLesson(lesson.id); }}
                              style={i < mod.lessons.length - 1 ? { borderBottom: `1px solid ${th.sep}` } : {}}>
                              {editMode && (
                                <Checkbox checked={selected.has(lesson.id)} onCheckedChange={() => toggleLesson(lesson.id)} onClick={(e) => e.stopPropagation()} className="shrink-0" />
                              )}
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: state === "completed" ? "rgba(106,222,177,0.12)" : state === "available" ? "rgba(181,141,224,0.12)" : "transparent", border: `1px solid ${state === "completed" ? "rgba(106,222,177,0.3)" : state === "available" ? "rgba(181,141,224,0.35)" : th.sep}` }}>
                                {state === "completed" ? <CheckCircle className="w-3.5 h-3.5 text-[#6adeb1]" /> : state === "available" ? <Play className="w-3 h-3 ml-0.5" style={{ color: th.navAC }} /> : <Lock className="w-3 h-3" style={{ color: th.fg3 }} />}
                              </div>
                              <span className="flex-1 text-sm truncate" style={{ color: state === "completed" ? "rgba(106,222,177,0.7)" : state === "available" ? th.navAC : th.fg3 }}>{lesson.title}</span>
                              {state === "available" && !editMode && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: "rgba(181,141,224,0.1)", color: th.navAC, border: "1px solid rgba(181,141,224,0.25)" }}>En cours</span>}
                              <span className="text-xs font-mono shrink-0 flex items-center gap-1" style={{ color: th.fg3 }}>
                                {lesson.durationMinutes ? <><Clock className="w-3 h-3" />{lesson.durationMinutes}min</> : "—"}
                              </span>
                            </div>
                          );
                        })}
                        {nextLesson && !editMode && (
                          <div className="px-5 py-3" style={{ borderTop: `1px solid ${th.sep}` }}>
                            <VBtn onClick={() => goLesson(nextLesson.lesson.id)} sm><span className="flex items-center gap-2"><Play className="w-3.5 h-3.5" />Reprendre le module</span></VBtn>
                          </div>
                        )}
                      </div>
                    )}
                  </GCard>
                );
              })}
            </div>
          </div>
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
                    style={{ background: genType === id ? "rgba(181,141,224,0.1)" : "transparent", border: `1px solid ${genType === id ? "#dbacf0" : th.sep}` }}>
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
                      {st === "done" && <CheckCircle className="w-4 h-4 shrink-0 text-[#6adeb1]" />}
                      {st === "error" && <XCircle className="w-4 h-4 shrink-0 text-[#fbc2ad]" />}
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
    </GCard>
  );
}
