import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronRight, ChevronLeft, Mic, Send,
  Sparkles, MessageSquare, CheckCircle, X,
  Lightbulb, Monitor,
  Network, RotateCcw, Play, Brain, Zap, Clock, PartyPopper, BookOpen, Headphones, Wand2, Bot, Code, Upload, Pencil,
  Phone, PhoneOff,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { supabase } from "@/app/lib/supabase/client";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { useProfile } from "@/app/state/profile-context";
import { useCourseProgress } from "@/app/state/useCourseProgress";
import { Background } from "@/app/components/common/Background";
import { GCard } from "@/app/components/common/GCard";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { cx } from "@/app/lib/cx";
import type { ChatMsg } from "@/app/types";
import {
  getLessonDetail, ensureLessonStarted, addTimeSpent, submitQuiz, flattenLessons, QUIZ_PASS_THRESHOLD,
  updateLessonCustomHtml, type LessonDetail, type QuizAnswer,
} from "@/app/lib/learning";
import { getMyPodcasts, getPodcastSignedUrl, requestPodcastGeneration, pollForPodcast, type Podcast } from "@/app/lib/podcasts";
import { PODCAST_FORMATS, type PodcastVariantId } from "@/app/lib/podcastFormats";
import { getMyMindmap, requestMindmapGeneration, type MindmapTree } from "@/app/lib/mindmaps";
import { findLatestConversationForInstance, getAgentMessages, sendAgentMessage, ensureConversation, insertAgentVoiceMessage } from "@/app/lib/agentChat";
import { getMyAvatarVideo, getAvatarVideoSignedUrl, requestAvatarVideoGeneration, pollAvatarVideoStatus, type AvatarVideo } from "@/app/lib/avatarVideos";
import { startGeminiVoiceSession, type GeminiVoiceSession } from "@/app/lib/geminiVoice";
import { injectPlatformAuth, normalizeSmartQuotes } from "@/app/lib/platformHtml";
import { MindmapView } from "@/app/components/lesson/MindmapView";

const DEFAULT_AI = "Je suis ton Copilote IA. Pose-moi n'importe quelle question sur cette leçon ou sur comment l'appliquer à ton métier 👋";

// Le contenu de cours est rédigé par les formateurs et mentionne parfois les critères de
// certification (ex: "Lien avec la certification — Cr1.3 : ..."), une info interne qui ne
// doit pas apparaître côté élève. On la retire à l'affichage plutôt qu'en base, pour ne pas
// devoir ré-éditer chaque leçon existante.
function stripCertificationMentions(markdown: string): string {
  const lines = markdown.split("\n");
  const kept: string[] = [];
  let skipping = false;
  let skipLevel = 0;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      if (skipping && level <= skipLevel) skipping = false;
      if (!skipping && /lien avec la certification/i.test(heading[2])) {
        skipping = true;
        skipLevel = level;
        continue;
      }
    }
    if (!skipping) kept.push(line);
  }
  return kept
    .join("\n")
    .split(/\n{2,}/)
    .filter((block) => !/^[\s>*_-]*\**\s*lien avec la certification/i.test(block.trim()))
    .join("\n\n")
    .trim();
}

export function LessonPage() {
  const th = useTh();
  const { profile } = useProfile();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const goBack = () => navigate("/lessons");

  type LTab = "video" | "mindmap" | "podcast" | "avatar" | "html";
  const [tab, setTab] = useState<LTab>("video");
  const [htmlEditing, setHtmlEditing] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");
  const [htmlSaving, setHtmlSaving] = useState(false);
  const [htmlFileError, setHtmlFileError] = useState<string | null>(null);
  const [platformAccessToken, setPlatformAccessToken] = useState<string | null>(null);
  const [platformAuthChecked, setPlatformAuthChecked] = useState(false);
  const [htmlIframeLoaded, setHtmlIframeLoaded] = useState(false);
  const [agentStatus, setAgentStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [agentMode, setAgentMode] = useState<"listening" | "speaking">("listening");
  const [agentError, setAgentError] = useState<string | null>(null);
  const [pttActive, setPttActive] = useState(false);
  const conversationRef = useRef<GeminiVoiceSession | null>(null);

  type PodcastVariantState = { podcast: Podcast; audioUrl: string };
  const [podcastByVariant, setPodcastByVariant] = useState<Partial<Record<PodcastVariantId, PodcastVariantState>>>({});
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastGeneratingVariant, setPodcastGeneratingVariant] = useState<PodcastVariantId | null>(null);

  const [avatarVideo, setAvatarVideo] = useState<AvatarVideo | null>(null);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarGenerating, setAvatarGenerating] = useState(false);

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
  const course = useCourseProgress(lesson?.instanceId);
  useEffect(() => {
    if (lesson && !lesson.videoUrl && tab === "video") setTab("mindmap");
  }, [lesson, tab]);

  const [quizStep, setQuizStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retaking, setRetaking] = useState(false);

  const [msgs, setMsgs] = useState<ChatMsg[]>([{ role: "ai", text: DEFAULT_AI }]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatIn, setChatIn] = useState("");
  const [typing, setTyping] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const chatEnd = useRef<HTMLDivElement>(null);
  const firstName = profile.name.split(" ")[0] || "Alex";

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  // Le copilote de la leçon pointe vers la conversation Agent de SA formation
  // (pas un fil isolé par leçon) : mémoire continue sur tout le cours,
  // consultable/poursuivie depuis /agent. Rien à charger pour une leçon
  // TEMPLATE (prévisualisation staff, pas de formation_instance réelle).
  useEffect(() => {
    if (!user || !lesson || lesson.isTemplate || !lesson.instanceId) return;
    let cancelled = false;
    (async () => {
      try {
        const conv = await findLatestConversationForInstance(user.id, lesson.instanceId);
        if (cancelled) return;
        setConversationId(conv?.id ?? null);
        if (!conv) { setMsgs([{ role: "ai", text: DEFAULT_AI }]); return; }
        const history = await getAgentMessages(conv.id);
        if (cancelled) return;
        setMsgs(history.length ? history.map((h) => ({ role: h.role, text: h.content })) : [{ role: "ai", text: DEFAULT_AI }]);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [user, lesson?.instanceId, lesson?.isTemplate]);

  const sendMsg = async (text: string) => {
    if (!text.trim() || !lesson || lesson.isTemplate) return;
    const question = text.trim();
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setChatIn("");
    // Un appel vocal en cours reste la même conversation Agent : le texte tapé
    // part directement dans la session live (réponse parlée) plutôt que par
    // l'edge function texte, pour ne pas dédoubler le tour de parole.
    if (agentStatus === "connected" && conversationRef.current) {
      conversationRef.current.sendUserMessage(question);
      return;
    }
    setTyping(true);
    try {
      const { conversationId: newId, reply } = await sendAgentMessage(conversationId, lesson.instanceId || null, question);
      setConversationId(newId);
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
      setPodcastByVariant({});
      setMindmap(null);
      setAvatarVideo(null); setAvatarVideoUrl(null);
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
  // admin/formateur peuvent toujours prévisualiser n'importe quelle leçon (pas
  // de verrouillage par ordre) — ils doivent pouvoir tester le contenu sans
  // suivre le parcours élève.
  useEffect(() => {
    if (!lessonId || course.loading || !user) return;
    const state = course.lessonStates.find((s) => s.lesson.id === lessonId);
    if (!state) {
      if (isStaff(role)) setAccess("granted");
      return;
    }
    if (state.state === "locked" && !isStaff(role)) {
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
      const podcasts = await getMyPodcasts(user.id, lessonId);
      const entries = await Promise.all(
        podcasts.map(async (p) => [p.variant, { podcast: p, audioUrl: await getPodcastSignedUrl(p.storagePath) }] as const),
      );
      setPodcastByVariant(Object.fromEntries(entries));
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

  const handleGeneratePodcast = async (variant: PodcastVariantId) => {
    if (!lessonId || !user) return;
    setPodcastGeneratingVariant(variant);
    const startedAt = Date.now();
    try {
      await requestPodcastGeneration(lessonId, variant);
      toast.info("Génération du podcast en cours — ça peut prendre 1 à 2 minutes.");
      const result = await pollForPodcast(user.id, lessonId, variant, startedAt);
      if (!result) {
        toast.error("La génération prend plus de temps que prévu. Réessaie dans un instant.");
        return;
      }
      const audioUrl = await getPodcastSignedUrl(result.storagePath);
      setPodcastByVariant((prev) => ({ ...prev, [variant]: { podcast: result, audioUrl } }));
      toast.success("Podcast généré avec succès.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de générer le podcast.");
    } finally {
      setPodcastGeneratingVariant(null);
    }
  };

  const loadAvatarVideo = async () => {
    if (!user || !lessonId) return;
    setAvatarLoading(true);
    try {
      const v = await getMyAvatarVideo(user.id, lessonId);
      setAvatarVideo(v);
      setAvatarVideoUrl(v?.status === "ready" && v.storagePath ? await getAvatarVideoSignedUrl(v.storagePath) : null);
    } catch (err) {
      console.error(err);
    } finally {
      setAvatarLoading(false);
    }
  };

  useEffect(() => { void loadAvatarVideo(); }, [user, lessonId]);

  const handleGenerateAvatarVideo = async () => {
    if (!lessonId || !user) return;
    setAvatarGenerating(true);
    try {
      await requestAvatarVideoGeneration(lessonId);
      setAvatarVideo({ status: "pending", storagePath: null, transcript: "", error: null });
      toast.info("Génération de la vidéo en cours — ça peut prendre plusieurs minutes.");
      const result = await pollAvatarVideoStatus(lessonId);
      if (!result) {
        toast.error("La génération prend plus de temps que prévu. Réessaie dans un instant.");
        return;
      }
      if (result.status === "failed") {
        toast.error(result.error ?? "La génération de la vidéo a échoué.");
        setAvatarVideo(result);
        return;
      }
      setAvatarVideo(result);
      setAvatarVideoUrl(result.storagePath ? await getAvatarVideoSignedUrl(result.storagePath) : null);
      toast.success("Vidéo générée avec succès.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de générer la vidéo.");
    } finally {
      setAvatarGenerating(false);
    }
  };

  useEffect(() => {
    setHtmlIframeLoaded(false);
    setPlatformAuthChecked(false);
  }, [lesson?.customHtmlContent]);

  useEffect(() => {
    if (tab !== "html" || !lesson?.customHtmlContent || htmlEditing || platformAuthChecked) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setPlatformAccessToken(data.session?.access_token ?? null);
      setPlatformAuthChecked(true);
    })();
    return () => { cancelled = true; };
  }, [tab, lesson?.customHtmlContent, htmlEditing, platformAuthChecked]);

  // Filet de sécurité : si l'iframe ne déclenche jamais onLoad (ressource
  // externe bloquée, etc.), on ne veut jamais rester bloqué indéfiniment
  // derrière l'overlay de chargement — on force son affichage après 4s.
  useEffect(() => {
    if (tab !== "html" || !lesson?.customHtmlContent || htmlEditing || !platformAuthChecked || htmlIframeLoaded) return;
    const timer = setTimeout(() => setHtmlIframeLoaded(true), 4000);
    return () => clearTimeout(timer);
  }, [tab, lesson?.customHtmlContent, htmlEditing, platformAuthChecked, htmlIframeLoaded]);

  // Onglet Agent (voix Gemini Live) : UI custom au lieu d'un widget
  // préfabriqué, pour contrôler la taille relative de l'orbe vs des boutons.
  // startGeminiVoiceSession gère elle-même la permission micro (getUserMedia).
  const startAgentCall = async () => {
    if (agentStatus !== "idle" || !user) return;
    setAgentError(null);
    setAgentStatus("connecting");
    try {
      // Rattache la session vocale à la même conversation Agent que le
      // copilote texte de la leçon (mémoire continue, transcripts persistés
      // au lieu d'être perdus au changement d'onglet).
      let convId = conversationId;
      if (!convId && lesson && !lesson.isTemplate && lesson.instanceId) {
        const conv = await ensureConversation(user.id, lesson.instanceId);
        convId = conv.id;
        setConversationId(convId);
      }
      const conversation = await startGeminiVoiceSession({
        student_name: firstName,
        profession: profile.profession || "non renseigné",
        objectif_professionnel: profile.goalFinal || profile.goal || "non renseigné",
        lesson_title: lesson?.title || "cette leçon",
        lesson_content: lesson?.referenceContent || "(pas de contenu de référence pour cette leçon)",
        depth_mode: "expert",
        pedagogy_style: profile.tutor || "soft",
        conversation_id: convId ?? undefined,
        onConnect: () => setAgentStatus("connected"),
        onDisconnect: () => {
          setAgentStatus("idle");
          setPttActive(false);
          conversationRef.current = null;
        },
        onModeChange: ({ mode }) => setAgentMode(mode),
        onMessage: ({ source, message }) => {
          setMsgs((prev) => [...prev, { role: source === "user" ? "user" : "ai", text: message }]);
          if (convId) void insertAgentVoiceMessage(convId, source === "user" ? "user" : "ai", message).catch(console.error);
        },
        onError: (message) => {
          console.error(message);
          setAgentError(typeof message === "string" ? message : "Erreur de connexion à l'agent.");
        },
      });
      conversationRef.current = conversation;
      // Micro coupé par défaut : conversation en push-to-talk, on ne capte
      // l'audio que pendant l'appui sur le bouton micro (cf. startPushToTalk).
      conversation.setMicMuted(true);
      setPttActive(false);
    } catch (err) {
      console.error(err);
      setAgentStatus("idle");
      if (err instanceof DOMException && err.name === "NotFoundError") {
        setAgentError("Aucun microphone détecté sur cet appareil.");
      } else if (err instanceof DOMException && err.name === "NotAllowedError") {
        setAgentError("Accès au microphone refusé — autorise-le dans les paramètres du navigateur pour ce site.");
      } else {
        setAgentError(err instanceof Error ? err.message : "Impossible de démarrer l'agent vocal.");
      }
    }
  };

  const endAgentCall = async () => {
    await conversationRef.current?.endSession();
    conversationRef.current = null;
    setAgentStatus("idle");
    setPttActive(false);
  };

  // Push-to-talk : le micro reste coupé tant qu'on ne maintient pas le
  // bouton. sendUserActivity() prévient l'agent qu'on s'apprête à parler,
  // ce qui l'aide à couper court à sa réponse en cours (barge-in) dès que
  // le flux audio du micro arrive.
  const startPushToTalk = () => {
    if (agentStatus !== "connected" || !conversationRef.current) return;
    conversationRef.current.sendUserActivity();
    conversationRef.current.setMicMuted(false);
    setPttActive(true);
  };

  const stopPushToTalk = () => {
    if (!conversationRef.current) return;
    conversationRef.current.setMicMuted(true);
    setPttActive(false);
  };

  // Coupe l'appel si on ferme le panneau Copilote ou si on quitte la page —
  // pas de micro qui reste ouvert en arrière-plan à l'insu de l'élève.
  useEffect(() => {
    if (!assistantOpen && conversationRef.current) {
      void conversationRef.current.endSession();
      conversationRef.current = null;
      setAgentStatus("idle");
      setPttActive(false);
    }
  }, [assistantOpen]);

  useEffect(() => {
    return () => { void conversationRef.current?.endSession(); };
  }, []);

  const startEditHtml = () => {
    setHtmlDraft(lesson?.customHtmlContent ?? "");
    setHtmlFileError(null);
    setHtmlEditing(true);
  };

  const cancelEditHtml = () => {
    setHtmlEditing(false);
    setHtmlFileError(null);
  };

  const handleHtmlFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setHtmlFileError(null);
    try {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setHtmlDraft(normalizeSmartQuotes(value));
      } else {
        setHtmlDraft(normalizeSmartQuotes(await file.text()));
      }
    } catch (err) {
      console.error(err);
      setHtmlFileError("Impossible de lire ce fichier — vérifie qu'il s'agit bien d'un .txt ou .docx.");
    }
  };

  const saveHtml = async () => {
    if (!lessonId) return;
    setHtmlSaving(true);
    try {
      const html = htmlDraft.trim() || null;
      await updateLessonCustomHtml(lessonId, html, lesson?.isTemplate ?? false);
      setLesson((prev) => (prev ? { ...prev, customHtmlContent: html } : prev));
      setHtmlEditing(false);
      toast.success("Page HTML enregistrée.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer la page HTML.");
    } finally {
      setHtmlSaving(false);
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

  // Playground et Agent sont visibles par tous les rôles/profils — seule
  // l'édition du Playground reste réservée à l'admin (cf. plus bas).
  const TABS: { id: LTab; Icon: typeof Monitor; label: string }[] = [
    ...(lesson?.videoUrl ? [{ id: "video" as const, Icon: Monitor, label: "Vidéo" }] : []),
    { id: "mindmap", Icon: Network, label: "Mindmap" }, { id: "podcast", Icon: Headphones, label: "Podcast" },
    { id: "avatar", Icon: Bot, label: "Vidéo IA" },
    { id: "html", Icon: Code, label: "Playground" },
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
        <span className="text-sm text-[#fbc2ad]">{lessonError ?? "Leçon introuvable."}</span>
        <VBtn onClick={goBack}>Retour aux leçons</VBtn>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <div className="relative z-10 shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3" style={{ borderBottom: `1px solid ${th.sep}`, background: th.topbar, backdropFilter: "blur(24px)" }}>
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm shrink-0 transition-colors hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Mes leçons</button>
          <div className="w-px h-4 shrink-0 hidden sm:block" style={{ background: th.sep }} />
          <div className="hidden sm:flex items-center min-w-0">
            <span className="text-xs shrink-0" style={{ color: th.fg3 }}>{lesson.sectionTitle}</span><span className="text-xs mx-1 shrink-0" style={{ color: th.fg3 }}>›</span><span className="text-xs font-medium truncate" style={{ color: th.fg }}>{lesson.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs" style={{ color: th.fg3 }}>
            Progression
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: th.isDark ? "rgba(255,255,255,0.07)" : `${th.gradShadow(0.1)}` }}>
              <div className="h-full rounded-full" style={{ width: `${overallPct}%`, background: `linear-gradient(90deg,${th.grad1},${th.grad2})` }} />
            </div>
            <span className="font-bold" style={{ color: th.navAC }}>{overallPct}%</span>
          </div>
          {isCompleted && nextLesson && <VBtn sm onClick={() => navigate(`/lesson/${nextLesson.id}`)}>Leçon suivante <ChevronRight className="inline w-4 h-4" /></VBtn>}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 lg:px-16 py-5 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-black mb-4" style={{ color: th.fg }}>{lesson.title}</h1>

          <div className="flex shrink-0 mb-4 rounded-2xl overflow-x-auto" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            {TABS.map(({ id, Icon, label }) => (
              <button key={id} onClick={() => setTab(id)} className="flex items-center gap-2 px-3.5 sm:px-5 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px shrink-0 whitespace-nowrap"
                style={{ borderColor: tab === id ? th.navAC : "transparent", color: tab === id ? th.navAC : th.fg3 }}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
            {lesson.durationMinutes && (
              <span className="ml-auto hidden sm:flex items-center gap-1.5 px-5 text-xs shrink-0 whitespace-nowrap" style={{ color: th.fg3 }}><Clock className="w-3.5 h-3.5" />{lesson.durationMinutes} min</span>
            )}
          </div>

          {tab === "html" ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ height: "78vh", background: "#060410", border: `1px solid ${th.sep}` }}>
              {htmlEditing ? (
                <div className="absolute inset-0 flex flex-col gap-3 p-5">
                  <textarea
                    value={htmlDraft}
                    onChange={(e) => setHtmlDraft(e.target.value)}
                    placeholder="Colle le HTML ici (Ctrl+V)…"
                    className="flex-1 w-full rounded-xl px-4 py-3 text-xs g-input resize-none font-mono"
                    style={{ minHeight: 0 }}
                  />
                  {htmlFileError && <p className="text-xs text-[#fbc2ad]">{htmlFileError}</p>}
                  <p className="text-[11px] leading-relaxed" style={{ color: th.fg3 }}>
                    Pour appeler l'IA sans exposer de clé : dans ce HTML, lis <code>window.__PLATFORM_AUTH__</code> (<code>supabaseUrl</code>, <code>supabaseAnonKey</code>, <code>accessToken</code>) et fais un POST JSON vers <code>{"{supabaseUrl}"}/functions/v1/ai-proxy</code> avec les headers <code>apikey</code> (=supabaseAnonKey) et <code>Authorization: Bearer {"{accessToken}"}</code>, et un corps <code>{"{ contents: [...] }"}</code> (format Gemini). La clé Gemini reste côté serveur.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap gap-y-2">
                    <label className="cursor-pointer">
                      <input type="file" accept=".txt,.docx" className="hidden" onChange={handleHtmlFileChange} />
                      <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                        style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)", border: `1px solid ${th.inputB}`, color: th.fg }}>
                        <Upload className="w-3.5 h-3.5" />Charger un fichier (.txt / .docx)
                      </span>
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <VBtn sm onClick={cancelEditHtml} disabled={htmlSaving}>Annuler</VBtn>
                      <ShimBtn sm onClick={saveHtml} disabled={htmlSaving}>{htmlSaving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
                    </div>
                  </div>
                </div>
              ) : lesson.customHtmlContent ? (
                <>
                  {!htmlIframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm bg-white" style={{ color: "#94a3b8" }}>
                      Chargement de la page…
                    </div>
                  )}
                  {platformAuthChecked && (
                    <iframe
                      key={lesson.customHtmlContent}
                      onLoad={() => setHtmlIframeLoaded(true)}
                      srcDoc={platformAccessToken ? injectPlatformAuth(lesson.customHtmlContent, platformAccessToken) : lesson.customHtmlContent}
                      sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                      title={`${lesson.title} — HTML`}
                      className="absolute inset-0 w-full h-full border-0 bg-white"
                      style={{ opacity: htmlIframeLoaded ? 1 : 0 }}
                    />
                  )}
                  {role === "admin" && (
                    <button onClick={startEditHtml} className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg"
                      style={{ background: "#fff", border: "1px solid rgba(15,14,20,0.12)", color: "#0f0e14" }}>
                      <Pencil className="w-3 h-3" />Modifier
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <Code className="w-6 h-6" style={{ color: th.fg3 }} />
                  <p className="text-sm" style={{ color: th.fg3 }}>Pas encore de page Playground pour cette leçon.</p>
                  {role === "admin" ? (
                    <ShimBtn sm onClick={startEditHtml}>Insérer HTML</ShimBtn>
                  ) : (
                    <p className="text-xs" style={{ color: th.fg3, opacity: 0.7 }}>Bientôt disponible.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
          <>
          <div className="relative rounded-2xl overflow-hidden mb-5" style={{ paddingBottom: "40%", background: "#060410", border: `1px solid ${th.sep}` }}>
            <div className="absolute inset-0 overflow-hidden">
              {tab === "video" && lesson.videoUrl && (
                <video src={lesson.videoUrl} controls className="absolute inset-0 w-full h-full bg-black" />
              )}
              {tab === "video" && !lesson.videoUrl && (
                <>
                  <div className="absolute inset-0" style={{ background: "#101017" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border border-white/15" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                    <span className="text-xs text-white/40">Vidéo pas encore ajoutée pour cette leçon</span>
                  </div>
                </>
              )}
              {tab === "mindmap" && (
                <div className="absolute inset-0" style={{ background: "#101017" }}>
                  {mindmapLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center"><p className="text-sm text-white/60">Chargement…</p></div>
                  ) : mindmap ? (
                    <>
                      <MindmapView tree={mindmap} />
                      {isStaff(role) && (
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
                        {!isStaff(role) && <p className="text-xs text-white/30">Bientôt disponible.</p>}
                        {isStaff(role) && (
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
              {tab === "podcast" && (() => {
                const generatedVariants = Object.keys(podcastByVariant) as PodcastVariantId[];
                const remainingFormats = PODCAST_FORMATS.filter((f) => !generatedVariants.includes(f.id));
                return (
                  <div className="absolute inset-0 overflow-y-auto p-6" style={{ background: "#101017" }}>
                    <div className="max-w-md w-full mx-auto space-y-4">
                      {podcastLoading && (
                        <div className="text-center pt-6"><Headphones className="w-6 h-6 mx-auto mb-2 text-white/30" /><p className="text-sm text-white/60">Chargement…</p></div>
                      )}

                      {!podcastLoading && generatedVariants.map((variantId) => {
                        const format = PODCAST_FORMATS.find((f) => f.id === variantId);
                        const entry = podcastByVariant[variantId];
                        if (!format || !entry) return null;
                        const isGeneratingThis = podcastGeneratingVariant === variantId;
                        return (
                          <div key={variantId} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="flex items-center gap-2 mb-2">
                              <format.Icon className="w-4 h-4 text-white/50 shrink-0" />
                              <span className="text-sm font-semibold text-white">{format.label}</span>
                              {isStaff(role) && (
                                <button onClick={() => handleGeneratePodcast(variantId)} disabled={podcastGeneratingVariant !== null}
                                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:opacity-80 disabled:opacity-50 shrink-0"
                                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                                  <Wand2 className="w-3 h-3" />{isGeneratingThis ? "Génération…" : "Régénérer"}
                                </button>
                              )}
                            </div>
                            <audio src={entry.audioUrl} controls className="w-full" />
                          </div>
                        );
                      })}

                      {!podcastLoading && remainingFormats.length > 0 && (
                        <div>
                          <p className="text-sm text-white/60 mb-3 text-center">
                            {generatedVariants.length === 0 ? "Choisis un format de podcast pour cette leçon :" : "Générer un autre format :"}
                          </p>
                          <div className="space-y-2">
                            {remainingFormats.map(({ id, label, hint, Icon }) => (
                              <button key={id} onClick={() => handleGeneratePodcast(id)} disabled={podcastGeneratingVariant !== null}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-80 disabled:opacity-50"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}>
                                <Icon className="w-4 h-4 shrink-0 text-white/60" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-white">{label}</div>
                                  <div className="text-xs text-white/40">{hint}</div>
                                </div>
                                {podcastGeneratingVariant === id && <span className="text-[11px] text-white/50 shrink-0">Génération…</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              {tab === "avatar" && (
                avatarVideoUrl ? (
                  <div className="absolute inset-0">
                    <video src={avatarVideoUrl} controls className="absolute inset-0 w-full h-full bg-black" />
                    {isStaff(role) && (
                      <button onMouseDown={(e) => e.stopPropagation()} onClick={handleGenerateAvatarVideo} disabled={avatarGenerating}
                        className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 z-10"
                        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                        <Wand2 className="w-3.5 h-3.5" />{avatarGenerating ? "Génération…" : "Régénérer"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: "#101017" }}>
                    <div className="text-center max-w-md w-full">
                      <Bot className="w-6 h-6 mx-auto mb-2 text-white/30" />
                      {avatarLoading ? (
                        <p className="text-sm text-white/60">Chargement…</p>
                      ) : avatarVideo?.status === "pending" ? (
                        <p className="text-sm text-white/60">Génération en cours…</p>
                      ) : avatarVideo?.status === "failed" ? (
                        <p className="text-sm text-[#fbc2ad]">{avatarVideo.error ?? "Échec de la génération."}</p>
                      ) : (
                        <>
                          <p className="text-sm text-white/60">Pas encore de vidéo personnalisée pour cette leçon.</p>
                          {!isStaff(role) && <p className="text-xs text-white/30 mt-1">Bientôt disponible.</p>}
                        </>
                      )}
                      {isStaff(role) && (
                        <button onClick={handleGenerateAvatarVideo} disabled={avatarGenerating}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
                          <Wand2 className="w-4 h-4" />{avatarGenerating ? "Génération en cours…" : "Générer la vidéo"}
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="space-y-5">
            {lesson.referenceContent && stripCertificationMentions(lesson.referenceContent) && (
              <GCard><div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${th.gradShadow(0.1)}`, border: `1px solid ${th.gradShadow(0.2)}` }}><BookOpen className="w-4 h-4" style={{ color: th.navAC }} /></div>
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
                      code: (p) => <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : `${th.gradShadow(0.08)}` }} {...p} />,
                      hr: () => <hr className="my-5" style={{ borderColor: th.sep }} />,
                      table: (p) => <div className="overflow-x-auto mb-3"><table className="w-full text-xs border-collapse" {...p} /></div>,
                      th: (p) => <th className="text-left px-3 py-2 font-bold" style={{ color: th.fg, borderBottom: `1px solid ${th.sep}` }} {...p} />,
                      td: (p) => <td className="px-3 py-2 align-top" style={{ borderBottom: `1px solid ${th.sep}` }} {...p} />,
                    }}
                  >
                    {stripCertificationMentions(lesson.referenceContent)}
                  </ReactMarkdown>
                </div>
              </div></GCard>
            )}

            <GCard><div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${th.gradShadow(0.1)}`, border: `1px solid ${th.gradShadow(0.2)}` }}><Brain className="w-4 h-4" style={{ color: th.navAC }} /></div>
                <span className="text-sm font-black" style={{ color: th.fg }}>Quiz de la leçon</span>
                {lesson.questions.length > 0 && !quizResult && (retaking || currentLessonState?.state !== "completed") && (
                  <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${th.gradShadow(0.06)}`, color: th.navAC, border: `1px solid ${th.gradShadow(0.15)}` }}>
                    Question {quizStep + 1}/{lesson.questions.length}
                  </span>
                )}
              </div>

              {lesson.questions.length === 0 && (
                <p className="text-sm" style={{ color: th.fg3 }}>Aucun quiz n'a encore été configuré pour cette leçon.</p>
              )}

              {lesson.questions.length > 0 && !quizResult && !retaking && currentLessonState?.state === "completed" && (
                <div className="rounded-xl p-5 text-center" style={{ background: "rgba(106,222,177,0.08)", border: "1px solid rgba(106,222,177,0.3)" }}>
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-[#6adeb1]" />
                  <p className="text-sm font-semibold mb-1" style={{ color: "#6adeb1" }}>Leçon déjà validée</p>
                  <p className="text-xs mb-4" style={{ color: th.fg3 }}>
                    {currentLessonState.progress?.bestQuizScore != null ? `Meilleur score : ${currentLessonState.progress.bestQuizScore}%` : ""}
                  </p>
                  <VBtn onClick={() => setRetaking(true)} sm><span className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" />Refaire le quiz</span></VBtn>
                </div>
              )}

              {lesson.questions.length > 0 && quizResult && (
                <div className="rounded-xl p-5 text-center" style={{ background: quizResult.passed ? "rgba(106,222,177,0.08)" : "rgba(251,194,173,0.08)", border: `1px solid ${quizResult.passed ? "rgba(106,222,177,0.3)" : "rgba(251,194,173,0.3)"}` }}>
                  {quizResult.passed ? <PartyPopper className="w-6 h-6 mx-auto mb-2 text-[#6adeb1]" /> : <X className="w-6 h-6 mx-auto mb-2 text-[#fbc2ad]" />}
                  <p className="text-lg font-black mb-1" style={{ color: quizResult.passed ? "#6adeb1" : "#fbc2ad" }}>{quizResult.score}%</p>
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
                        if (opt.isCorrect) { bg = "rgba(106,222,177,0.1)"; border = "rgba(106,222,177,0.35)"; color = "#6adeb1"; }
                        else if (opt.id === selected) { bg = "rgba(251,194,173,0.1)"; border = "rgba(251,194,173,0.35)"; color = "#fbc2ad"; }
                        else { bg = "transparent"; border = th.sep; color = th.fg3; }
                      }
                      return (
                        <button key={opt.id} onClick={() => selectOption(opt.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                          style={{ background: bg, border: `1px solid ${border}`, color }}>
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : `${th.gradShadow(0.06)}` }}>
                            {selected !== null && opt.isCorrect ? <CheckCircle className="w-4 h-4 text-[#6adeb1]" /> : selected !== null && opt.id === selected ? <X className="w-4 h-4 text-[#fbc2ad]" /> : String.fromCharCode(65 + i)}
                          </span>{opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {selected !== null && (
                    <div className="rounded-xl p-4" style={{ background: "rgba(106,222,177,0.07)", border: "1px solid rgba(106,222,177,0.2)" }}>
                      {currentQuestion.explanation && (
                        <>
                          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-[#78d5e2]"><Lightbulb className="w-3.5 h-3.5" />Explication</div>
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
          </>
          )}
        </div>

        {/* Copilot */}
        {assistantOpen ? (
        <div className="fixed inset-0 z-30 bg-black/50 lg:bg-transparent p-4 lg:static lg:z-auto lg:p-0 lg:w-[27rem] lg:shrink-0 lg:py-6 lg:pr-6" onClick={(e) => { if (e.target === e.currentTarget) setAssistantOpen(false); }}>
        <div className="h-full flex flex-col rounded-2xl overflow-hidden" style={{ background: `linear-gradient(165deg,${th.grad1},${th.grad2})`, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}>
          <div className="shrink-0 px-5 py-4">
            <div className="flex items-center gap-2.5 mb-3">
              <Sparkles className="w-5 h-5 text-white shrink-0" />
              <div className="min-w-0 flex-1"><div className="text-base font-black text-white">Copilote IA</div><div className="text-[11px] truncate text-white/60">Ton formateur pour cette leçon</div></div>
              <span className="text-[10px] font-bold shrink-0 text-white/50">Bêta</span>
              <button onClick={() => setAssistantOpen(false)} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-white/10">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-2" style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{
                background: agentStatus === "connected" ? (agentMode === "speaking" ? "#2792dc" : "#6adeb1") : agentStatus === "connecting" ? "#f5a623" : "rgba(255,255,255,0.3)",
              }} />
              <span className="flex-1 text-xs text-white/80 truncate">
                {agentStatus === "connecting" ? "Connexion…"
                  : agentStatus === "connected" ? (agentMode === "speaking" ? "L'agent parle…" : pttActive ? "Je t'écoute…" : "Maintiens le micro pour parler")
                  : "Discute aussi à la voix"}
              </span>
              <button
                onClick={agentStatus === "idle" ? startAgentCall : endAgentCall}
                disabled={agentStatus === "connecting"}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: agentStatus === "idle" ? "rgba(255,255,255,0.2)" : "#e5484d" }}
                title={agentStatus === "idle" ? "Démarrer l'appel vocal" : "Raccrocher"}
              >
                {agentStatus === "idle" ? <Phone className="w-3.5 h-3.5 text-white" /> : <PhoneOff className="w-3.5 h-3.5 text-white" />}
              </button>
              <button
                onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); startPushToTalk(); }}
                onPointerUp={stopPushToTalk}
                onPointerCancel={stopPushToTalk}
                disabled={agentStatus !== "connected"}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-30 select-none touch-none"
                style={{ background: pttActive ? "#fff" : "rgba(255,255,255,0.2)" }}
                title="Maintenir appuyé pour parler (push-to-talk)"
              >
                <Mic className="w-3.5 h-3.5" style={{ color: pttActive ? `${th.grad1}` : "#fff" }} />
              </button>
            </div>
            {agentError && <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#fbc2ad" }}>{agentError}</p>}
            <div className="rounded-xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs leading-relaxed text-white/85">💡 <strong>Pour {firstName} :</strong> Chaque concept → applique-le immédiatement en pratique.</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "ai" && <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}><Sparkles className="w-3 h-3 text-white" /></div>}
                <div className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                  style={m.role === "user" ? { background: "rgba(255,255,255,0.92)", color: `${th.grad1}`, fontWeight: 600, borderRadius: "16px 16px 4px 16px" } : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", borderRadius: "16px 16px 16px 4px" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && <div className="flex"><div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}><Sparkles className="w-3 h-3 text-white" /></div><div className="px-4 py-3 rounded-2xl flex gap-1 items-center" style={{ background: "rgba(255,255,255,0.1)" }}>{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}</div></div>}
            <div ref={chatEnd} />
          </div>
          <div className="px-5 py-4 shrink-0">
            <div className="text-[11px] font-bold mb-2.5 text-white/60">Actions rapides</div>
            <div className="space-y-2">
              {[{ Icon: MessageSquare, label: "Reformule simplement", cmd: "reformule simplement" }, { Icon: Lightbulb, label: "Exemple pour mon métier", cmd: "exemple concret métier" }, { Icon: Zap, label: "Crash test 2 min", cmd: "crash test" }].map(({ Icon, label, cmd }) => (
                <button key={label} onClick={() => sendMsg(cmd)} className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors hover:bg-white/15" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}><Icon className="w-4 h-4 text-white" /></div>
                  <span className="text-sm font-semibold text-white">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 pb-5 pt-1 shrink-0">
            <div className="flex gap-2">
              <input value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === "Enter" && !typing && sendMsg(chatIn)} placeholder="Pose ta question…"
                className="flex-1 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }} />
              <button onClick={() => sendMsg(chatIn)} disabled={!chatIn.trim() || typing} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30" style={{ background: "#fff" }}>
                <Send className="w-4 h-4" style={{ color: `${th.grad1}` }} />
              </button>
            </div>
          </div>
        </div>
        </div>
        ) : (
          <button onClick={() => setAssistantOpen(true)}
            className="absolute right-6 top-20 z-20 w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, boxShadow: `0 4px 16px ${th.gradShadow(0.4)}` }}>
            <Sparkles className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
