import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Bot, Send, Plus, Sparkles, Phone, PhoneOff, Mic, AudioLines } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { useMyInstances } from "@/app/state/useMyInstances";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { cx } from "@/app/lib/cx";
import {
  listAgentConversations, getAgentMessages, sendAgentMessage, ensureConversation, insertAgentVoiceMessage,
  type AgentConversation, type AgentMessageRow,
} from "@/app/lib/agentChat";
import { startGeminiVoiceSession, type GeminiVoiceSession } from "@/app/lib/geminiVoice";

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function AgentPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { instances } = useMyInstances();
  const firstName = profile.name.split(" ")[0] || "Alex";

  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messages, setMessages] = useState<AgentMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [sending, setSending] = useState(false);

  const [agentStatus, setAgentStatus] = useState<"idle" | "connecting" | "connected">("idle");
  const [agentMode, setAgentMode] = useState<"listening" | "speaking">("listening");
  const [agentError, setAgentError] = useState<string | null>(null);
  const [pttActive, setPttActive] = useState(false);
  const voiceRef = useRef<GeminiVoiceSession | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const instanceNameById = useMemo(() => new Map(instances.map((i) => [i.id, i.name])), [instances]);
  const currentConversation = conversations.find((c) => c.id === conversationId) ?? null;
  const activeProjectId = currentConversation ? currentConversation.formationInstanceId : draftProjectId;

  const refreshConversations = async () => {
    if (!user) return;
    try {
      setConversations(await listAgentConversations(user.id));
    } catch (err) {
      console.error(err);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => { void refreshConversations(); }, [user]);

  const endVoiceCall = async () => {
    await voiceRef.current?.endSession();
    voiceRef.current = null;
    setAgentStatus("idle");
    setPttActive(false);
  };

  // Change de conversation (ou retour à la liste) : on raccroche un éventuel
  // appel en cours, pas de micro qui reste ouvert sur le mauvais fil.
  useEffect(() => {
    if (voiceRef.current) void endVoiceCall();
    setAgentError(null);
    if (!conversationId) { setMessages([]); return; }
    let cancelled = false;
    setMessagesLoading(true);
    (async () => {
      try {
        const rows = await getAgentMessages(conversationId);
        if (!cancelled) setMessages(rows);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [conversationId]);

  useEffect(() => {
    return () => { void voiceRef.current?.endSession(); };
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const grouped = useMemo(() => {
    const map = new Map<string, AgentConversation[]>();
    for (const c of conversations) {
      const key = c.formationInstanceId ?? "general";
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return [...map.entries()]
      .map(([key, list]) => ({
        key,
        list,
        label: key === "general" ? "Discussion générale" : instanceNameById.get(key) ?? "Formation",
        latest: list[0]?.lastMessageAt ?? "",
      }))
      .sort((a, b) => (a.latest < b.latest ? 1 : -1));
  }, [conversations, instanceNameById]);

  const startNewConversation = () => {
    if (voiceRef.current) void endVoiceCall();
    setDraftProjectId(null);
    navigate("/agent");
  };

  const sendText = async () => {
    const question = textInput.trim();
    if (!question || sending || !user) return;
    setSending(true);
    setTextInput("");
    const optimisticUser: AgentMessageRow = { id: `tmp-${Date.now()}`, role: "user", content: question, modality: "text", isOffTopic: false, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, optimisticUser]);
    try {
      const { conversationId: newId, reply } = await sendAgentMessage(conversationId ?? null, conversationId ? null : draftProjectId, question);
      setMessages((m) => [...m, { id: `tmp-${Date.now()}-ai`, role: "ai", content: reply, modality: "text", isOffTopic: false, createdAt: new Date().toISOString() }]);
      if (!conversationId) navigate(`/agent/${newId}`, { replace: true });
      void refreshConversations();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer ce message.");
      setMessages((m) => [...m, { id: `tmp-${Date.now()}-err`, role: "ai", content: "Désolé, je n'ai pas pu répondre — réessaie dans un instant.", modality: "text", isOffTopic: false, createdAt: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const startVoiceCall = async () => {
    if (!user || agentStatus !== "idle") return;
    setAgentError(null);
    setAgentStatus("connecting");
    try {
      let convId = conversationId ?? null;
      if (!convId) {
        const conv = await ensureConversation(user.id, draftProjectId);
        convId = conv.id;
        navigate(`/agent/${convId}`, { replace: true });
        void refreshConversations();
      }
      const projectTitle = activeProjectId ? (instanceNameById.get(activeProjectId) ?? "ta formation") : "l'ensemble de tes formations";
      const session = await startGeminiVoiceSession({
        student_name: firstName,
        profession: profile.profession || "non renseigné",
        objectif_professionnel: profile.goalFinal || profile.goal || "non renseigné",
        lesson_title: projectTitle,
        lesson_content: `Conversation avec ton agent portant sur ${projectTitle} — pas une leçon précise, appuie-toi sur la vue d'ensemble de son parcours.`,
        depth_mode: "expert",
        pedagogy_style: profile.tutor || "soft",
        conversation_id: convId,
        onConnect: () => setAgentStatus("connected"),
        onDisconnect: () => { setAgentStatus("idle"); setPttActive(false); voiceRef.current = null; },
        onModeChange: ({ mode }) => setAgentMode(mode),
        onMessage: ({ source, message }) => {
          const role = source === "user" ? "user" : "ai";
          setMessages((m) => [...m, { id: `tmp-voice-${Date.now()}-${Math.random()}`, role, content: message, modality: "voice", isOffTopic: false, createdAt: new Date().toISOString() }]);
          void insertAgentVoiceMessage(convId!, role, message).then(refreshConversations).catch(console.error);
        },
        onError: (message) => {
          console.error(message);
          setAgentError(typeof message === "string" ? message : "Erreur de connexion à l'agent.");
        },
      });
      voiceRef.current = session;
      session.setMicMuted(true);
    } catch (err) {
      console.error(err);
      setAgentStatus("idle");
      if (err instanceof DOMException && err.name === "NotFoundError") setAgentError("Aucun microphone détecté sur cet appareil.");
      else if (err instanceof DOMException && err.name === "NotAllowedError") setAgentError("Accès au microphone refusé — autorise-le dans les paramètres du navigateur.");
      else setAgentError(err instanceof Error ? err.message : "Impossible de démarrer l'agent vocal.");
    }
  };

  const startPushToTalk = () => {
    if (agentStatus !== "connected" || !voiceRef.current) return;
    voiceRef.current.sendUserActivity();
    voiceRef.current.setMicMuted(false);
    setPttActive(true);
  };
  const stopPushToTalk = () => {
    if (!voiceRef.current) return;
    voiceRef.current.setMicMuted(true);
    setPttActive(false);
  };

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Sidebar conversations */}
      <div className="w-full max-w-[300px] shrink-0 hidden md:flex flex-col border-r overflow-hidden" style={{ borderColor: th.sep }}>
        <div className="p-4 shrink-0 space-y-3">
          <h2 className="text-lg font-black flex items-center gap-2" style={{ color: th.fg }}><Bot className="w-5 h-5" style={{ color: th.navAC }} /><GT>Mon Agent IA</GT></h2>
          <button onClick={startNewConversation} className="w-full flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff" }}>
            <Plus className="w-4 h-4" />Nouvelle conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
          {conversationsLoading && <p className="text-xs px-2" style={{ color: th.fg3 }}>Chargement…</p>}
          {!conversationsLoading && conversations.length === 0 && (
            <p className="text-xs px-2 leading-relaxed" style={{ color: th.fg3 }}>Aucune conversation pour l'instant — écris un premier message pour démarrer.</p>
          )}
          {grouped.map((g) => (
            <div key={g.key}>
              <div className="text-[11px] font-bold uppercase tracking-wide px-2 mb-1.5" style={{ color: th.fg3 }}>{g.label}</div>
              <div className="space-y-1">
                {g.list.map((c) => (
                  <button key={c.id} onClick={() => navigate(`/agent/${c.id}`)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
                    style={{ background: c.id === conversationId ? (th.isDark ? "rgba(181,141,224,0.15)" : "rgba(181,141,224,0.1)") : "transparent" }}>
                    <div className="text-sm font-medium truncate" style={{ color: c.id === conversationId ? th.navAC : th.fg }}>{c.title || "Nouvelle conversation"}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: th.fg3 }}>{formatRelative(c.lastMessageAt)}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fil de conversation */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!conversationId && (
          <div className="shrink-0 px-4 sm:px-6 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <span className="text-xs shrink-0" style={{ color: th.fg3 }}>Nouvelle conversation à propos de :</span>
            <select value={draftProjectId ?? ""} onChange={(e) => setDraftProjectId(e.target.value || null)}
              className="text-sm rounded-lg px-2.5 py-1.5 g-input" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}>
              <option value="">Discussion générale</option>
              {instances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3">
          {messagesLoading && <p className="text-sm text-center" style={{ color: th.fg3 }}>Chargement…</p>}
          {!messagesLoading && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-10">
              <Sparkles className="w-8 h-8" style={{ color: th.navAC, opacity: 0.6 }} />
              <p className="text-sm max-w-sm" style={{ color: th.fg3 }}>
                Pose une question par écrit ou lance un appel vocal — ton agent connaît ta progression sur toutes tes formations et se souvient de vos échanges précédents.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line flex items-start gap-2"
                style={m.role === "user"
                  ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff", borderRadius: "16px 16px 4px 16px" }
                  : { background: th.card, border: `1px solid ${th.sep}`, color: th.fg, borderRadius: "16px 16px 16px 4px" }}>
                {m.modality === "voice" && <AudioLines className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />}
                <span>{m.content}</span>
              </div>
            </div>
          ))}
          <div ref={chatEnd} />
        </div>

        {agentError && <div className="px-4 sm:px-6 pb-1 text-xs shrink-0" style={{ color: "#fbc2ad" }}>{agentError}</div>}

        <div className="shrink-0 px-4 sm:px-6 pb-5 pt-2 space-y-2.5">
          {(agentStatus !== "idle") && (
            <GCard className="px-4 py-2.5 flex items-center gap-3">
              <span className="text-xs flex-1" style={{ color: th.fg3 }}>
                {agentStatus === "connecting" ? "Connexion à l'agent vocal…" : agentMode === "speaking" ? "L'agent parle…" : pttActive ? "Je t'écoute…" : "Maintiens le micro pour parler"}
              </span>
              {agentStatus === "connected" && (
                <button onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); startPushToTalk(); }}
                  onPointerUp={stopPushToTalk} onPointerCancel={stopPushToTalk}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 select-none touch-none"
                  style={{ background: pttActive ? "linear-gradient(135deg,#2792dc,#9ce6e6)" : th.inputBg, border: `1px solid ${th.inputB}` }}>
                  <Mic className="w-4 h-4" style={{ color: pttActive ? "#06121c" : th.fg }} />
                </button>
              )}
              <button onClick={endVoiceCall} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#e5484d" }}>
                <PhoneOff className="w-4 h-4 text-white" />
              </button>
            </GCard>
          )}
          <div className="flex items-center gap-2">
            <button onClick={startVoiceCall} disabled={agentStatus !== "idle"} title="Démarrer un appel vocal"
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#2792dc,#9ce6e6)" }}>
              <Phone className="w-4 h-4 text-white" />
            </button>
            <input value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !sending && sendText()}
              placeholder="Écris à ton agent…" className="flex-1 rounded-full px-4 py-3 text-sm g-input" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }} />
            <button onClick={sendText} disabled={!textInput.trim() || sending} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30"
              style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)" }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
