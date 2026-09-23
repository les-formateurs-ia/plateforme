// Modules "Discutez avec ChatGPT / Gemini / Claude" (Le Studio) — une même
// page pour les trois fournisseurs (prop `provider`), cf. src/app/lib/studioChat.ts.
// Historique des conversations à gauche (repliable sur mobile), fil de
// discussion + zone de saisie avec choix du modèle et fichiers joints à droite.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, FileText, History, ImageIcon, Loader2, MessageSquarePlus, Paperclip, SendHorizontal, Trash2, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { VSelect } from "@/app/components/common/Select";
import { MarkdownText } from "@/app/components/common/MarkdownText";
import { AiBudgetExhaustedNotice, useAiBudgetExhausted } from "@/app/components/common/AiBudgetGate";
import {
  CHAT_PROVIDERS, CHAT_MAX_FILES, CHAT_MAX_FILE_BYTES, CHAT_FILE_ACCEPT,
  listMyChatConversations, sendChatMessage, checkChatStatus, uploadChatAttachment, deleteChatConversation, modelLabel, getChatTraces,
  type ChatProvider, type ChatConversation, type ChatMessage, type ChatAttachment, type ChatTraceStep,
} from "@/app/lib/studioChat";

const INPUT_MAX_HEIGHT = 200;
const POLL_INTERVAL_MS = 3000;
// Le serveur abandonne à 10 min (CHAT_REPLY_TIMEOUT_MS) ; marge pour recevoir son verdict.
const POLL_CLIENT_DEADLINE_MS = 11 * 60 * 1000;

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function AttachmentChip({ name, mimeType, size, onRemove }: { name: string; mimeType: string; size?: number; onRemove?: () => void }) {
  const th = useTh();
  const Icon = isImage(mimeType) ? ImageIcon : FileText;
  return (
    <span className="inline-flex items-center gap-1.5 max-w-[220px] text-xs px-2.5 py-1 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{name}</span>
      {size != null && <span className="shrink-0" style={{ color: th.fg3 }}>{formatSize(size)}</span>}
      {onRemove && (
        <button type="button" onClick={onRemove} className="shrink-0 hover:opacity-70" aria-label={`Retirer ${name}`}>
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}

function ProviderLogo({ provider, className }: { provider: ChatProvider; className: string }) {
  const th = useTh();
  const { logo, logoZoom, name } = CHAT_PROVIDERS[provider];
  return (
    <div
      role="img"
      aria-label={name}
      className={`shrink-0 ${className}`}
      style={{ background: `#fff url("${logo}") center / ${logoZoom} no-repeat`, border: `1px solid ${th.sep}` }}
    />
  );
}

const VIA_LABEL ={ google: "Google direct", runware: "via Runware" } as const;

function fileList(files: ChatTraceStep["files"], modes: ChatTraceStep["files"][number]["mode"][]) {
  return files.filter((f) => modes.includes(f.mode)).map((f) => f.name).join(", ");
}

// Admin uniquement : quels modèles ont réellement traité la requête et ses fichiers.
function TraceNote({ steps }: { steps: ChatTraceStep[] }) {
  const th = useTh();
  const response = steps.find((s) => s.task === "reponse");
  const extractions = steps.filter((s) => s.task === "extraction_pdf");
  if (!response) return null;
  const extractedFiles = extractions.flatMap((s) => s.files.map((f) => (f.mode === "cache" ? `${f.name} (déjà retranscrit)` : f.name)));
  const native = fileList(response.files, ["natif"]);
  const asText = fileList(response.files, ["texte"]);
  const paged = fileList(response.files, ["pages_images"]);
  const docx = fileList(response.files, ["texte_converti"]);
  const responder = `${modelLabel(response.provider, response.model)} (${VIA_LABEL[response.via]})`;

  return (
    <div className="mt-2 rounded-xl px-3 py-2 text-[11px] leading-relaxed space-y-0.5" style={{ background: th.inputBg, border: `1px dashed ${th.inputB}`, color: th.fg3 }}>
      <p className="font-bold uppercase tracking-wide text-[10px]">Trace admin</p>
      {extractions.length === 0 ? (
        <p>Traité entièrement par <strong style={{ color: th.fg2 }}>{responder}</strong>{response.files.length ? " — fichiers compris" : ""}.</p>
      ) : (
        <>
          <p>PDF → texte : <strong style={{ color: th.fg2 }}>{modelLabel("gemini", extractions[0].model)} ({VIA_LABEL.google})</strong> — {extractedFiles.join(", ")}</p>
          <p>Réponse : <strong style={{ color: th.fg2 }}>{responder}</strong>, à partir de la retranscription Gemini.</p>
        </>
      )}
      {native && <p>Lu directement par le modèle : {native}</p>}
      {paged && <p>PDF converti en images de pages dans le navigateur (sans IA), puis lu par le modèle comme un document : {paged}</p>}
      {docx && <p>Word converti en texte dans le navigateur (sans IA) : {docx}</p>}
      {asText && <p>Fichiers texte insérés dans le message : {asText}</p>}
      {response.note && <p style={{ color: "#f59e0b" }}>{response.note}</p>}
    </div>
  );
}

function MessageBubble({ msg, provider, trace }: { msg: ChatMessage; provider: ChatProvider; trace?: ChatTraceStep[] }) {
  const th = useTh();
  const config = CHAT_PROVIDERS[provider];
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] space-y-1.5">
          {msg.attachments?.length ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              {msg.attachments.map((a) => <AttachmentChip key={a.path} name={a.name} mimeType={a.mimeType} size={a.size} />)}
            </div>
          ) : null}
          <div className="rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap break-words" style={{ background: th.navA, color: th.fg }}>{msg.content}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <ProviderLogo provider={provider} className="w-8 h-8 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] font-semibold" style={{ color: th.fg3 }}>{msg.model ? modelLabel(provider, msg.model) : config.name}</p>
        <div className="break-words"><MarkdownText>{msg.content}</MarkdownText></div>
        {trace && <TraceNote steps={trace} />}
      </div>
    </div>
  );
}

export function StudioChatPage({ provider }: { provider: ChatProvider }) {
  const th = useTh();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const config = CHAT_PROVIDERS[provider];
  const [traces, setTraces] = useState<Record<string, ChatTraceStep[]>>({});

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [model, setModel] = useState(config.defaultModel);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Fichiers déjà uploadés pour la tentative en cours : un nouvel essai après
  // une erreur ne les renvoie pas une deuxième fois dans le bucket.
  const uploadedRef = useRef<Map<File, ChatAttachment>>(new Map());

  // Une promesse de suivi par conversation : handleSend et la reprise après
  // rechargement de la page attendent le même polling, jamais deux en parallèle.
  const pollsRef = useRef<Map<string, Promise<boolean>>>(new Map());
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  // Envoi local (upload + soumission) ou réponse GPT/Claude encore en cours côté serveur.
  const sending = pending !== null || !!active?.pending;
  // GPT/Claude passent par Runware : bloqués au-delà du plafond IA, Gemini (Google direct) reste ouvert.
  const budgetExhausted = useAiBudgetExhausted();
  const budgetLocked = provider !== "gemini" && budgetExhausted;
  const composerDisabled = sending || budgetLocked;
  const shownPending = active?.pending?.message ?? pending;
  const messages = [...(active?.messages ?? []), ...(shownPending ? [shownPending] : [])];

  const upsertConversation = (conv: ChatConversation) => setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);

  // Résout true quand la réponse est arrivée, false en cas d'échec (erreur affichée).
  const waitForReply = (id: string): Promise<boolean> => {
    const running = pollsRef.current.get(id);
    if (running) return running;
    const run = (async () => {
      const deadline = Date.now() + POLL_CLIENT_DEADLINE_MS;
      while (aliveRef.current && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        let res;
        try {
          res = await checkChatStatus(id);
        } catch {
          continue;
        }
        if (!res.conversation) {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          setActiveId((cur) => (cur === id ? null : cur));
          setError(res.error ?? "La conversation est introuvable.");
          return false;
        }
        upsertConversation(res.conversation);
        if (res.error) {
          setError(res.error);
          return false;
        }
        if (!res.conversation.pending) return true;
      }
      return false;
    })().finally(() => pollsRef.current.delete(id));
    pollsRef.current.set(id, run);
    return run;
  };

  useEffect(() => {
    for (const c of conversations) if (c.pending) waitForReply(c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    setActiveId(null);
    setModel(config.defaultModel);
    setError(null);
    if (!user) return;
    setLoadingHistory(true);
    listMyChatConversations(user.id, provider)
      .then(setConversations)
      .catch((err) => setError(err instanceof Error ? err.message : "Impossible de charger l'historique."))
      .finally(() => setLoadingHistory(false));
  }, [user, provider, config.defaultModel]);

  const activeUpdatedAt = active?.updatedAt;
  useEffect(() => {
    if (!isAdmin || !activeId) return;
    getChatTraces(activeId)
      .then((t) => setTraces((prev) => ({ ...prev, ...t })))
      .catch((err) => console.error("studio_chat_traces:", err));
  }, [isAdmin, activeId, activeUpdatedAt]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_HEIGHT)}px`;
  }, [input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  const openConversation = (conv: ChatConversation | null) => {
    if (pending) return;
    setActiveId(conv?.id ?? null);
    setModel(conv && config.models.some((m) => m.id === conv.model) ? conv.model : config.defaultModel);
    setError(null);
    setShowHistory(false);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > CHAT_MAX_FILE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" dépasse 10 Mo.`);
      return;
    }
    const next = [...files, ...incoming];
    if (next.length > CHAT_MAX_FILES) setError(`${CHAT_MAX_FILES} fichiers maximum par message.`);
    else setError(null);
    setFiles(next.slice(0, CHAT_MAX_FILES));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!user || !text || composerDisabled) return;
    setError(null);
    setPending({
      id: "pending",
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      attachments: files.map((f) => ({ path: f.name, name: f.name, mimeType: f.type, size: f.size })),
    });
    const sentFiles = files;
    let conv: ChatConversation;
    try {
      const attachments: ChatAttachment[] = [];
      for (const file of sentFiles) {
        let uploaded = uploadedRef.current.get(file);
        if (!uploaded) {
          uploaded = await uploadChatAttachment(user.id, file, provider);
          uploadedRef.current.set(file, uploaded);
        }
        attachments.push(uploaded);
      }
      conv = await sendChatMessage({ conversationId: activeId, provider, model, message: text, attachments });
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi a échoué.");
      setPending(null);
      return;
    }
    upsertConversation(conv);
    setActiveId(conv.id);
    setPending(null);
    setInput("");
    setFiles([]);

    const ok = conv.pending ? await waitForReply(conv.id) : true;
    if (ok) {
      uploadedRef.current.clear();
    } else if (aliveRef.current) {
      // Échec après coup : on rend le message et ses fichiers pour réessayer.
      setInput(text);
      setFiles(sentFiles);
    }
  };

  const handleDelete = async (conv: ChatConversation) => {
    if (pending || conv.pending || !window.confirm(`Supprimer la conversation « ${conv.title} » ?`)) return;
    try {
      await deleteChatConversation(conv);
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      if (activeId === conv.id) openConversation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    }
  };

  const historyPanel = (
    <div className="p-3 space-y-1.5">
      <button
        type="button"
        onClick={() => openConversation(null)}
        disabled={pending !== null}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: config.gradient, color: "#fff" }}
      >
        <MessageSquarePlus className="w-4 h-4" />Nouvelle conversation
      </button>
      {loadingHistory ? (
        <p className="text-xs px-2 py-3" style={{ color: th.fg3 }}>Chargement…</p>
      ) : conversations.length === 0 ? (
        <p className="text-xs px-2 py-3" style={{ color: th.fg3 }}>Aucune conversation pour l'instant.</p>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.id}
            className="group flex items-center gap-1 rounded-xl transition-colors"
            style={{ background: conv.id === activeId ? th.navA : "transparent" }}
          >
            <button type="button" onClick={() => openConversation(conv)} disabled={pending !== null} className="flex-1 min-w-0 text-left px-3 py-2">
              <p className="text-sm truncate" style={{ color: th.fg }}>{conv.title}</p>
              <p className="text-[11px]" style={{ color: th.fg3 }}>{new Date(conv.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {modelLabel(provider, conv.model)}</p>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(conv)}
              className="p-2 mr-1 rounded-lg opacity-60 lg:opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
              style={{ color: th.fg3 }}
              aria-label="Supprimer la conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Le Studio
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>Discutez avec {config.name}</h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Échange librement avec les vrais modèles {config.name} ({config.company}) — choisis le modèle et joins tes fichiers (images, PDF, textes).</p>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="lg:hidden shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full"
          style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}
        >
          <History className="w-3.5 h-3.5" />Historique
        </button>
      </div>

      {showHistory && <GCard className="lg:hidden">{historyPanel}</GCard>}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-stretch">
        <GCard className="hidden lg:block">
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 220px)" }}>{historyPanel}</div>
        </GCard>

        <GCard>
          <div className="flex flex-col" style={{ height: "calc(100dvh - 220px)", minHeight: 480 }}>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-4">
                  <ProviderLogo provider={provider} className="w-14 h-14 rounded-2xl" />
                  <p className="text-base font-bold" style={{ color: th.fg }}>Que veux-tu demander à {config.name} ?</p>
                  <p className="text-sm max-w-md" style={{ color: th.fg3 }}>Pose une question, demande un texte, analyse un document ou une image : tu parles directement au modèle {modelLabel(provider, model)}.</p>
                </div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} provider={provider} trace={isAdmin ? traces[msg.id] : undefined} />)
              )}
              {sending && (
                <div className="flex items-center gap-2 text-sm" style={{ color: th.fg3 }}>
                  <Loader2 className="w-4 h-4 animate-spin" />{config.name} réfléchit…
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 space-y-2.5" style={{ borderTop: `1px solid ${th.sep}` }}>
              {budgetLocked && <AiBudgetExhaustedNotice compact />}
              {error && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{error}</p>
              )}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {files.map((f, i) => (
                    <AttachmentChip key={`${f.name}-${i}`} name={f.name} mimeType={f.type} size={f.size} onRemove={sending ? undefined : () => setFiles((prev) => prev.filter((_, j) => j !== i))} />
                  ))}
                </div>
              )}
              <div className="rounded-2xl" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  onPaste={(e) => {
                    if (e.clipboardData.files.length) {
                      e.preventDefault();
                      addFiles(e.clipboardData.files);
                    }
                  }}
                  rows={1}
                  disabled={composerDisabled}
                  placeholder={`Écris ton message à ${config.name}… (Entrée pour envoyer, Maj+Entrée pour aller à la ligne)`}
                  className="w-full bg-transparent px-4 pt-3 pb-1 text-sm outline-none resize-none"
                  style={{ color: th.fg, maxHeight: INPUT_MAX_HEIGHT, overflowY: "auto" }}
                />
                <div className="flex items-center gap-2 px-2.5 pb-2.5">
                  <input ref={fileRef} type="file" multiple accept={CHAT_FILE_ACCEPT} className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={composerDisabled || files.length >= CHAT_MAX_FILES}
                    className="p-2 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40"
                    style={{ color: th.fg2 }}
                    aria-label="Joindre un fichier"
                    title="Joindre un fichier (images, PDF, textes — 10 Mo max)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <div className="w-[210px] max-w-[55%]">
                    <VSelect value={model} onValueChange={setModel} options={config.models.map((m) => ({ value: m.id, label: m.label }))} disabled={composerDisabled} sm />
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={composerDisabled || !input.trim()}
                    className="ml-auto w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40"
                    style={{ background: config.gradient }}
                    aria-label="Envoyer"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GCard>
      </div>
    </div>
  );
}
