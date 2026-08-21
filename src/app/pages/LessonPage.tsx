import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronRight, ChevronLeft, Mic, Send,
  Sparkles, MessageSquare, CheckCircle, X,
  Lightbulb, Monitor, AlignLeft,
  Network, RotateCcw, Play, Brain, Zap, Clock, PartyPopper, BookOpen, Headphones, Wand2,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { useCourseProgress } from "@/app/state/useCourseProgress";
import { Background } from "@/app/components/common/Background";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import type { ChatMsg } from "@/app/types";
import {
  getLessonDetail, ensureLessonStarted, addTimeSpent, submitQuiz, flattenLessons, QUIZ_PASS_THRESHOLD,
  type LessonDetail, type QuizAnswer,
} from "@/app/lib/learning";
import { getMyPodcast, getPodcastSignedUrl, requestPodcastGeneration, pollForPodcast, type Podcast } from "@/app/lib/podcasts";
import { getMyMindmap, requestMindmapGeneration, type MindmapTree } from "@/app/lib/mindmaps";
import { getChatHistory, sendLessonChatMessage } from "@/app/lib/chat";
import { MindmapView } from "@/app/components/lesson/MindmapView";

const DEFAULT_AI = "Je suis ton Copilote IA. Pose-moi n'importe quelle question sur cette leçon ou sur comment l'appliquer à ton métier 👋";

export function LessonPage() {
  const th = useTh();
  const { profile } = useProfile();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const goBack = () => navigate("/lessons");

  type LTab = "video" | "transcript" | "mindmap" | "podcast";
  const [tab, setTab] = useState<LTab>("video");

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [podcastAudioUrl, setPodcastAudioUrl] = useState<string | null>(null);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastGenerating, setPodcastGenerating] = useState(false);

  const [mindmap, setMindmap] = useState<MindmapTree | null>(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapGenerating, setMindmapGenerating] = useState(false);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");
  // Scopé à la formation de CETTE leçon (pas "la formation active" de l'utilisateur) —
  // sinon un admin/élève inscrit à plusieurs cours resterait bloqué sur une leçon
  // d'un cours différent de celui utilisé pour calculer sa progression "active".
  const course = useCourseProgress(lesson?.formationId);

  const [quizStep, setQuizStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retaking, setRetaking] = useState(false);

  const [msgs, setMsgs] = useState<ChatMsg[]>([{ role: "ai", text: DEFAULT_AI }]);
  const [chatIn, setChatIn] = useState("");
  const [typing, setTyping] = useState(false);
  const [voice, setVoice] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const firstName = profile.name.split(" ")[0] || "Alex";

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  useEffect(() => {
    if (!user || !lessonId) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await getChatHistory(user.id, lessonId);
        if (cancelled) return;
        setMsgs(history.length ? history.map((h) => ({ role: h.role, text: h.content })) : [{ role: "ai", text: DEFAULT_AI }]);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [user, lessonId]);

  const sendMsg = async (text: string) => {
    if (!text.trim() || !lessonId) return;
    const question = text.trim();
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setChatIn(""); setTyping(true);
    try {
      const { reply } = await sendLessonChatMessage(lessonId, question);
      setMsgs((m) => [...m, { role: "ai", text: reply }]);
    } catch (err) {
      console.error(err);
      setMsgs((m) => [...m, { role: "ai", text: "Désolé, je n'ai pas pu répondre — réessaie dans un instant." }]);
    } finally {
      setTyping(false);
    }
  };

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    (async () => {
      setLessonLoading(true);
      setLessonError(null);
      setQuizStep(0); setSelected(null); setAnswers([]); setQuizResult(null); setRetaking(false); setTab("video");
      setPodcast(null); setPodcastAudioUrl(null);
      setMindmap(null);
      try {
        const detail = await getLessonDetail(lessonId);
        if (cancelled) return;
        if (!detail) { setLessonError("Cette leçon est introuvable."); return; }
        setLesson(detail);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLessonError("Impossible de charger cette leçon.");
      } finally {
        if (!cancelled) setLessonLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  // Vérifie que la leçon est déverrouillée (élève arrivé dans l'ordre) une fois la progression connue.
  // Un admin peut toujours prévisualiser n'importe quelle leçon (pas de verrouillage
  // par ordre) — il a besoin de tester son contenu sans suivre le parcours élève.
  useEffect(() => {
    if (!lessonId || course.loading || !user) return;
    const state = course.lessonStates.find((s) => s.lesson.id === lessonId);
    if (!state) {
      if (role === "admin") setAccess("granted");
      return;
    }
    if (state.state === "locked" && role !== "admin") {
      setAccess("denied");
      toast.error("Cette leçon n'est pas encore débloquée — termine les précédentes d'abord.");
      navigate("/lessons", { replace: true });
      return;
    }
    setAccess("granted");
    if (state.state === "available") {
      void ensureLessonStarted(user.id, lessonId);
    }
  }, [lessonId, course.loading, course.lessonStates, user, role, navigate]);

  const loadPodcast = async () => {
    if (!user || !lessonId) return;
    setPodcastLoading(true);
    try {
      const p = await getMyPodcast(user.id, lessonId);
      setPodcast(p);
      setPodcastAudioUrl(p ? await getPodcastSignedUrl(p.storagePath) : null);
    } catch (err) {
      console.error(err);
    } finally {
      setPodcastLoading(false);
    }
  };

  useEffect(() => { void loadPodcast(); }, [user, lessonId]);

  const loadMindmap = async () => {
    if (!user || !lessonId) return;
    setMindmapLoading(true);
    try {
      setMindmap(await getMyMindmap(user.id, lessonId));
    } catch (err) {
      console.error(err);
    } finally {
      setMindmapLoading(false);
    }
  };

  useEffect(() => { void loadMindmap(); }, [user, lessonId]);

  const handleGenerateMindmap = async () => {
    if (!lessonId) return;
    setMindmapGenerating(true);
    try {
      setMindmap(await requestMindmapGeneration(lessonId));
      toast.success("Mindmap générée avec succès.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de générer la mindmap.");
    } finally {
      setMindmapGenerating(false);
    }
  };

  const handleGeneratePodcast = async () => {
    if (!lessonId || !user) return;
    setPodcastGenerating(true);
    const startedAt = Date.now();
    try {
      await requestPodcastGeneration(lessonId);
      toast.info("Génération du podcast en cours — ça peut prendre 1 à 2 minutes.");
      const result = await pollForPodcast(user.id, lessonId, startedAt);
      if (!result) {
        toast.error("La génération prend plus de temps que prévu. Réessaie dans un instant.");
        return;
      }
      setPodcast(result);
      setPodcastAudioUrl(await getPodcastSignedUrl(result.storagePath));
      toast.success("Podcast généré avec succès.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de générer le podcast.");
    } finally {
      setPodcastGenerating(false);
    }
  };

  // Cumule le temps passé sur la leçon toutes les 30s + au démontage.
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  useEffect(() => {
    if (!user || !lessonId || access !== "granted") return;
    lastTickRef.current = Date.now();
    const flush = () => {
      const now = Date.now();
      elapsedRef.current += (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (elapsedRef.current >= 1) {
        const toSend = Math.round(elapsedRef.current);
        elapsedRef.current = 0;
        void addTimeSpent(user.id, lessonId, toSend);
      }
    };
    const interval = setInterval(flush, 30000);
    return () => { clearInterval(interval); flush(); };
  }, [user, lessonId, access]);

  const currentQuestion = lesson?.questions[quizStep] ?? null;
  const isLastQuestion = lesson ? quizStep === lesson.questions.length - 1 : true;

  const selectOption = (optionId: string) => {
    if (selected !== null) return;
    setSelected(optionId);
  };

  const finishQuiz = async (finalAnswers: QuizAnswer[]) => {
    if (!user || !lessonId) return;
    setSubmitting(true);
    try {
      const result = await submitQuiz(user.id, lessonId, finalAnswers);
      setQuizResult(result);
      if (result.passed) {
        toast.success(`Quiz validé — ${result.score}% de bonnes réponses !`);
        course.refresh();
      } else {
        toast.error(`Score : ${result.score}% — il faut ${QUIZ_PASS_THRESHOLD}% pour valider.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'enregistrer ce quiz. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestionOrFinish = () => {
    if (!currentQuestion || selected === null) return;
    const option = currentQuestion.options.find((o) => o.id === selected);
    const answer: QuizAnswer = { questionId: currentQuestion.id, selectedOptionId: selected, correct: !!option?.isCorrect };
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setSelected(null);
    if (isLastQuestion) void finishQuiz(nextAnswers);
    else setQuizStep((s) => s + 1);
  };

  const retryQuiz = () => { setQuizStep(0); setSelected(null); setAnswers([]); setQuizResult(null); setRetaking(true); };

  const orderedLessons = course.outline ? flattenLessons(course.outline) : [];
  const currentIndex = orderedLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = currentIndex >= 0 ? orderedLessons[currentIndex + 1] : undefined;
  const currentLessonState = course.lessonStates.find((s) => s.lesson.id === lessonId);
  const isCompleted = currentLessonState?.state === "completed" || !!quizResult?.passed;

  const totalLessons = course.lessonStates.length;
  const completedCount = course.lessonStates.filter((s) => s.state === "completed").length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const TABS: { id: LTab; Icon: typeof Monitor; label: string }[] = [
    { id: "video", Icon: Monitor, label: "Vidéo" }, { id: "transcript", Icon: AlignLeft, label: "Transcription" },
    { id: "mindmap", Icon: Network, label: "Mindmap" }, { id: "podcast", Icon: Headphones, label: "Podcast" },
  ];

  if (lessonLoading || access === "checking") {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: th.bg }}>
        <span className="text-sm" style={{ color: th.fg3 }}>Chargement de la leçon…</span>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3" style={{ background: th.bg }}>
        <span className="text-sm text-red-400">{lessonError ?? "Leçon introuvable."}</span>
        <VBtn onClick={goBack}>Retour aux leçons</VBtn>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: th.bg, fontFamily: "'Inter',sans-serif" }}>
      <Background />
      <div className="relative z-10 shrink-0 flex items-center justify-between px-6 py-3" style={{ borderBottom: `1px solid ${th.sep}`, background: th.topbar, backdropFilter: "blur(24px)" }}>
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Mes leçons</button>
          <div className="w-px h-4" style={{ background: th.sep }} />
          <span className="text-xs" style={{ color: th.fg3 }}>{lesson.sectionTitle}</span><span className="text-xs mx-1" style={{ color: th.fg3 }}>›</span><span className="text-xs font-medium" style={{ color: th.fg }}>{lesson.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: th.fg3 }}>
            Progression
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.07)" : "rgba(155,93,229,0.1)" }}>
              <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: "linear-gradient(90deg,#7C3AED,#DDAEEA)" }} />
            </div>
            <span className="font-bold" style={{ color: th.navAC }}>{overallPct}%</span>
          </div>
          {isCompleted && nextLesson && <VBtn sm onClick={() => navigate(`/lesson/${nextLesson.id}`)}>Leçon suivante <ChevronRight className="inline w-4 h-4" /></VBtn>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="relative" style={{ paddingBottom: "40%", background: "#060410" }}>
            <div className="absolute inset-0 overflow-hidden">
              {tab === "video" && lesson.videoUrl && (
                <video src={lesson.videoUrl} controls className="absolute inset-0 w-full h-full bg-black" />
              )}
              {tab === "video" && !lesson.videoUrl && (
                <>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0d0522,#1a0b3c 45%,#08060F)" }} />
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 28% 55%,rgba(155,93,229,0.25),transparent 55%)" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border border-white/15" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                    <span className="text-xs text-white/40">Vidéo pas encore ajoutée pour cette leçon</span>
                  </div>
                </>
              )}
              {tab === "transcript" && (
                <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg,#0d0522,#1a0b3c 45%,#08060F)" }}>
                  <div className="text-center max-w-sm">
                    <AlignLeft className="w-6 h-6 mx-auto mb-2 text-white/30" />
                    <p className="text-sm text-white/60">Transcription générée par IA</p>
                    <p className="text-xs text-white/30 mt-1">Bientôt disponible — en attente de l'activation du moteur IA.</p>
                  </div>
                </div>
              )}
              {tab === "mindmap" && (
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center,#150a2e,#08060F 75%)" }}>
                  {mindmapLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center"><p className="text-sm text-white/60">Chargement…</p></div>
                  ) : mindmap ? (
                    <>
                      <MindmapView tree={mindmap} />
                      {role === "admin" && (
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={handleGenerateMindmap} disabled={mindmapGenerating}
                          className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 z-10"
                          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                          <Wand2 className="w-3.5 h-3.5" />{mindmapGenerating ? "Génération…" : "Régénérer"}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <div className="text-center max-w-sm">
                        <Network className="w-6 h-6 mx-auto mb-2 text-white/30" />
                        <p className="text-sm text-white/60 mb-1">Pas encore de mindmap pour cette leçon.</p>
                        {role !== "admin" && <p className="text-xs text-white/30">Bientôt disponible.</p>}
                        {role === "admin" && (
                          <button onClick={handleGenerateMindmap} disabled={mindmapGenerating}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                            <Wand2 className="w-4 h-4" />{mindmapGenerating ? "Génération en cours…" : "Générer la mindmap"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {tab === "podcast" && (
                <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg,#0d0522,#1a0b3c 45%,#08060F)" }}>
                  <div className="text-center max-w-md w-full">
                    <Headphones className="w-6 h-6 mx-auto mb-2 text-white/30" />
                    {podcastLoading ? (
                      <p className="text-sm text-white/60">Chargement…</p>
                    ) : podcastAudioUrl ? (
                      <>
                        <p className="text-sm text-white/60 mb-3">Ton podcast personnalisé pour cette leçon</p>
                        <audio src={podcastAudioUrl} controls className="w-full" />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-white/60">Pas encore de podcast personnalisé pour cette leçon.</p>
                        {role !== "admin" && <p className="text-xs text-white/30 mt-1">Bientôt disponible.</p>}
                      </>
                    )}
                    {role === "admin" && (
                      <button onClick={handleGeneratePodcast} disabled={podcastGenerating}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                        <Wand2 className="w-4 h-4" />{podcastGenerating ? "Génération en cours…" : podcastAudioUrl ? "Régénérer le podcast" : "Générer le podcast"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0" style={{ background: th.topbar, backdropFilter: "blur(20px)", borderBottom: `1px solid ${th.sep}` }}>
            {TABS.map(({ id, Icon, label }) => (
              <button key={id} onClick={() => setTab(id)} className="flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px"
                style={{ borderColor: tab === id ? th.navAC : "transparent", color: tab === id ? th.navAC : th.fg3 }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
            {lesson.durationMinutes && (
              <span className="ml-auto flex items-center gap-1.5 px-5 text-xs" style={{ color: th.fg3 }}><Clock className="w-3.5 h-3.5" />{lesson.durationMinutes} min</span>
            )}
          </div>

          <div className="p-6 space-y-5">
            {lesson.referenceContent && (
              <GCard><div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(155,93,229,0.1)", border: "1px solid rgba(155,93,229,0.2)" }}><BookOpen className="w-4 h-4" style={{ color: th.navAC }} /></div>
                  <span className="text-sm font-black" style={{ color: th.fg }}>Cours</span>
                </div>
                <div style={{ color: th.fg2, fontSize: "0.9rem", lineHeight: 1.7 }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: (p) => <h2 className="text-lg font-black mt-6 mb-3 first:mt-0" style={{ color: th.fg }} {...p} />,
                      h2: (p) => <h3 className="text-base font-black mt-6 mb-2.5 first:mt-0" style={{ color: th.fg }} {...p} />,
                      h3: (p) => <h4 className="text-sm font-bold mt-5 mb-2" style={{ color: th.fg }} {...p} />,
                      p: (p) => <p className="mb-3" {...p} />,
                      ul: (p) => <ul className="list-disc pl-5 mb-3 space-y-1" {...p} />,
                      ol: (p) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...p} />,
                      strong: (p) => <strong style={{ color: th.fg }} {...p} />,
                      blockquote: (p) => <blockquote className="pl-4 my-3 italic" style={{ borderLeft: `3px solid ${th.navAC}`, color: th.fg3 }} {...p} />,
                      code: (p) => <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.08)" }} {...p} />,
                      hr: () => <hr className="my-5" style={{ borderColor: th.sep }} />,
                      table: (p) => <div className="overflow-x-auto mb-3"><table className="w-full text-xs border-collapse" {...p} /></div>,
                      th: (p) => <th className="text-left px-3 py-2 font-bold" style={{ color: th.fg, borderBottom: `1px solid ${th.sep}` }} {...p} />,
                      td: (p) => <td className="px-3 py-2 align-top" style={{ borderBottom: `1px solid ${th.sep}` }} {...p} />,
                    }}
                  >
                    {lesson.referenceContent}
                  </ReactMarkdown>
                </div>
              </div></GCard>
            )}

            <GCard><div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(155,93,229,0.1)", border: "1px solid rgba(155,93,229,0.2)" }}><Brain className="w-4 h-4" style={{ color: th.navAC }} /></div>
                <span className="text-sm font-black" style={{ color: th.fg }}>Quiz de la leçon</span>
                {lesson.questions.length > 0 && !quizResult && (retaking || currentLessonState?.state !== "completed") && (
                  <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(155,93,229,0.06)", color: th.navAC, border: "1px solid rgba(155,93,229,0.15)" }}>
                    Question {quizStep + 1}/{lesson.questions.length}
                  </span>
                )}
              </div>

              {lesson.questions.length === 0 && (
                <p className="text-sm" style={{ color: th.fg3 }}>Aucun quiz n'a encore été configuré pour cette leçon.</p>
              )}

              {lesson.questions.length > 0 && !quizResult && !retaking && currentLessonState?.state === "completed" && (
                <div className="rounded-xl p-5 text-center" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)" }}>
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <p className="text-sm font-semibold mb-1" style={{ color: "#4ADE80" }}>Leçon déjà validée</p>
                  <p className="text-xs mb-4" style={{ color: th.fg3 }}>
                    {currentLessonState.progress?.bestQuizScore != null ? `Meilleur score : ${currentLessonState.progress.bestQuizScore}%` : ""}
                  </p>
                  <VBtn onClick={() => setRetaking(true)} sm><span className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" />Refaire le quiz</span></VBtn>
                </div>
              )}

              {lesson.questions.length > 0 && quizResult && (
                <div className="rounded-xl p-5 text-center" style={{ background: quizResult.passed ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${quizResult.passed ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
                  {quizResult.passed ? <PartyPopper className="w-6 h-6 mx-auto mb-2 text-green-400" /> : <X className="w-6 h-6 mx-auto mb-2 text-red-400" />}
                  <p className="text-lg font-black mb-1" style={{ color: quizResult.passed ? "#4ADE80" : "#F87171" }}>{quizResult.score}%</p>
                  <p className="text-xs mb-4" style={{ color: th.fg3 }}>
                    {quizResult.passed ? "Leçon validée — bravo !" : `Il faut au moins ${QUIZ_PASS_THRESHOLD}% pour valider cette leçon.`}
                  </p>
                  {quizResult.passed
                    ? nextLesson && <VBtn onClick={() => navigate(`/lesson/${nextLesson.id}`)} sm><span className="flex items-center gap-2">Leçon suivante<ChevronRight className="w-3.5 h-3.5" /></span></VBtn>
                    : <VBtn onClick={retryQuiz} sm><span className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" />Réessayer le quiz</span></VBtn>}
                </div>
              )}

              {lesson.questions.length > 0 && !quizResult && currentQuestion && (retaking || currentLessonState?.state !== "completed") && (
                <>
                  <p className="text-sm font-semibold mb-4" style={{ color: th.fg }}>{currentQuestion.question}</p>
                  <div className="space-y-2 mb-4">
                    {currentQuestion.options.map((opt, i) => {
                      let bg = th.isDark ? "rgba(255,255,255,0.03)" : th.inputBg, border = th.inputB, color = th.fg2;
                      if (selected !== null) {
                        if (opt.isCorrect) { bg = "rgba(74,222,128,0.1)"; border = "rgba(74,222,128,0.35)"; color = "#4ADE80"; }
                        else if (opt.id === selected) { bg = "rgba(248,113,113,0.1)"; border = "rgba(248,113,113,0.35)"; color = "#F87171"; }
                        else { bg = "transparent"; border = th.sep; color = th.fg3; }
                      }
                      return (
                        <button key={opt.id} onClick={() => selectOption(opt.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                          style={{ background: bg, border: `1px solid ${border}`, color }}>
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(155,93,229,0.06)" }}>
                            {selected !== null && opt.isCorrect ? <CheckCircle className="w-4 h-4 text-green-400" /> : selected !== null && opt.id === selected ? <X className="w-4 h-4 text-red-400" /> : String.fromCharCode(65 + i)}
                          </span>{opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {selected !== null && (
                    <div className="rounded-xl p-4" style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)" }}>
                      {currentQuestion.explanation && (
                        <>
                          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-blue-400"><Lightbulb className="w-3.5 h-3.5" />Explication</div>
                          <p className="text-xs leading-relaxed mb-3" style={{ color: th.fg2 }}>{currentQuestion.explanation}</p>
                        </>
                      )}
                      <VBtn onClick={nextQuestionOrFinish} sm disabled={submitting}>
                        {submitting ? "Envoi…" : isLastQuestion ? "Valider le quiz" : "Question suivante"}
                      </VBtn>
                    </div>
                  )}
                </>
              )}
            </div></GCard>
          </div>
        </div>

        {/* Copilot */}
        <div className="w-80 shrink-0 flex flex-col" style={{ borderLeft: `1px solid ${th.sep}`, background: th.sidebar, backdropFilter: "blur(24px)" }}>
          <div className="shrink-0 px-4 py-4" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}><Sparkles className="w-4 h-4" style={{ color: "#08060F" }} /></div>
              <div><div className="text-sm font-black" style={{ color: th.fg }}>Copilote IA</div><div className="text-[10px]" style={{ color: th.fg3 }}>Ton formateur pour cette leçon</div></div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold" style={{ color: th.fg3 }}>Bêta</div>
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(155,93,229,0.07)", border: "1px solid rgba(155,93,229,0.15)" }}>
              <p className="text-[11px] leading-relaxed" style={{ color: th.navAC }}>💡 <strong>Pour {firstName} :</strong> Chaque concept → applique-le immédiatement en pratique.</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "ai" && <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}><Sparkles className="w-3 h-3" style={{ color: "#08060F" }} /></div>}
                <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                  style={m.role === "user" ? { background: "linear-gradient(135deg,#7C3AED,#DDAEEA)", color: "#08060F", fontWeight: 600, borderRadius: "16px 16px 4px 16px" } : { background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(155,93,229,0.06)", border: `1px solid ${th.sep}`, color: th.fg2, borderRadius: "16px 16px 16px 4px" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && <div className="flex"><div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}><Sparkles className="w-3 h-3" style={{ color: "#08060F" }} /></div><div className="px-4 py-3 rounded-2xl flex gap-1 items-center" style={{ background: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(155,93,229,0.06)", border: `1px solid ${th.sep}` }}>{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(155,93,229,0.6)", animation: `bounce-dot 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}</div></div>}
            <div ref={chatEnd} />
          </div>
          <div className="px-4 py-3 shrink-0" style={{ borderTop: `1px solid ${th.sep}` }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Actions rapides</div>
            {[{ Icon: MessageSquare, label: "Reformule simplement", cmd: "reformule simplement" }, { Icon: Lightbulb, label: "Exemple pour mon métier", cmd: "exemple concret métier" }, { Icon: Zap, label: "Crash test 2 min", cmd: "crash test" }].map(({ Icon, label, cmd }) => (
              <button key={label} onClick={() => sendMsg(cmd)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left mb-1.5 transition-opacity hover:opacity-70" style={{ background: th.isDark ? "rgba(255,255,255,0.025)" : "rgba(155,93,229,0.05)", border: `1px solid ${th.sep}`, color: th.fg2 }}>
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: th.navAC }} />{label}
              </button>
            ))}
          </div>
          <div className="px-4 pb-4 pt-1 shrink-0">
            <div className="flex gap-2">
              <input value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === "Enter" && !typing && sendMsg(chatIn)} placeholder="Pose ta question…" className="flex-1 rounded-xl px-3 py-2.5 text-sm g-input" />
              <button onClick={() => setVoice(v => !v)} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0" style={voice ? { background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" } : { background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                <Mic className="w-4 h-4" style={{ color: voice ? "#08060F" : th.fg3 }} />
              </button>
              <button onClick={() => sendMsg(chatIn)} disabled={!chatIn.trim() || typing} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30" style={{ background: "linear-gradient(135deg,#9B5DE5,#DDAEEA)" }}>
                <Send className="w-4 h-4" style={{ color: "#08060F" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
