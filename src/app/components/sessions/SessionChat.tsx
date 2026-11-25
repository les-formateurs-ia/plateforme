import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { MessagesSquare, Send } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import {
  getLastRead, listSessionMessages, MESSAGE_MAX_LENGTH, sendSessionMessage, setLastRead, subscribeSessionMessages, type SessionMessage,
} from "@/app/lib/sessionMessages";

// Échanges internes d'une session, entre l'administrateur et le formateur
// attribué : la demande du client, son besoin, le contexte, puis les notes
// du formateur. Le bouton du dossier ouvre la page /sessions/:id/echanges,
// pleine hauteur, faite pour des messages longs.

const dateHeure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

export const sessionChatPath = (sessionId: string) => `/sessions/${sessionId}/echanges`;

// Fil d'une session, chargé puis tenu à jour en direct.
function useSessionMessages(sessionId: string) {
  const [messages, setMessages] = useState<SessionMessage[] | null>(null);
  const add = (m: SessionMessage) => setMessages((prev) => (prev?.some((x) => x.id === m.id) ? prev : [...(prev ?? []), m]));
  useEffect(() => {
    setMessages(null);
    listSessionMessages(sessionId).then(setMessages).catch((err) => { console.error(err); setMessages([]); });
    return subscribeSessionMessages(sessionId, add);
  }, [sessionId]);
  return { messages, add };
}

// Bouton du dossier de session, avec le nombre de messages non lus.
export function SessionChatButton({ sessionId }: { sessionId: string }) {
  const th = useTh();
  const { user } = useAuth();
  const { messages } = useSessionMessages(sessionId);
  const lastRead = getLastRead(sessionId);
  const unread = (messages ?? []).filter((m) => m.createdAt > lastRead && m.authorId !== user?.id).length;
  return (
    <Link to={sessionChatPath(sessionId)}
      className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold hover:opacity-80 shrink-0"
      style={{ border: `1px solid ${th.sep}`, background: th.card, color: th.fg }}>
      <MessagesSquare className="w-4 h-4" />Échanges internes
      {unread > 0 && (
        <span className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center tabular-nums"
          style={{ background: th.danger, color: th.onInk }}>{unread}</span>
      )}
    </Link>
  );
}

// Le fil et la zone de saisie, sur toute la hauteur disponible.
export function SessionChatThread({ sessionId }: { sessionId: string }) {
  const th = useTh();
  const { user } = useAuth();
  const { messages, add } = useSessionMessages(sessionId);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Page ouverte : tout est lu, jusqu'au dernier message reçu.
  const latest = messages?.[messages.length - 1]?.createdAt ?? "";
  useEffect(() => { if (latest && latest > getLastRead(sessionId)) setLastRead(sessionId, latest); }, [latest]);

  // Défilement en bas au chargement et à chaque nouveau message.
  useLayoutEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages?.length]);

  // La zone de saisie grandit avec le texte, jusqu'à 45 % de l'écran.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, window.innerHeight * 0.45)}px`;
  }, [text]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      add(await sendSessionMessage(sessionId, body));
      setText("");
    } catch (err) {
      console.error(err);
      toast.error("Le message n'a pas pu être envoyé.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-[10px] overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
        {messages === null && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
        {messages?.length === 0 && (
          <div className="max-w-xl mx-auto text-center py-10 space-y-2">
            <MessagesSquare className="w-8 h-8 mx-auto" style={{ color: th.fg3 }} />
            <p className="text-sm font-bold" style={{ color: th.fg }}>Aucun message pour l'instant</p>
            <p className="text-sm" style={{ color: th.fg3 }}>Notez ici ce que le client a demandé, son besoin, son contexte, ce qu'il faut savoir avant la formation. Le formateur peut répondre et ajouter ses propres notes.</p>
          </div>
        )}
        {messages?.map((m) => {
          const mine = m.authorId === user?.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <p className="text-[11px] mb-1 px-1" style={{ color: th.fg3 }}>
                <strong style={{ color: th.fg2 }}>{mine ? "Vous" : m.authorName || "Compte supprimé"}</strong>
                {" · "}{m.authorRole === "admin" ? "Administrateur" : "Formateur"} · {dateHeure(m.createdAt)}
              </p>
              <div className="max-w-[min(85%,760px)] rounded-[10px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={mine ? { background: th.ink, color: th.onInk } : { background: th.navA, color: th.fg }}>
                {m.body}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 sm:p-4 space-y-2" style={{ borderTop: `1px solid ${th.sep}` }}>
        <div className="flex items-end gap-3">
          <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={MESSAGE_MAX_LENGTH} rows={3}
            placeholder="Écrire un message…"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }}
            className="flex-1 resize-none rounded-[6px] px-3 py-2.5 text-sm leading-relaxed g-input" />
          <button type="button" onClick={() => void send()} disabled={sending || !text.trim()}
            className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-bold hover:opacity-80 disabled:opacity-30 shrink-0"
            style={{ background: th.ink, color: th.onInk }}><Send className="w-4 h-4" />Envoyer</button>
        </div>
        <p className="text-[11px]" style={{ color: th.fg3 }}>
          Ctrl+Entrée pour envoyer · Invisible pour le client et les stagiaires · {text.length > MESSAGE_MAX_LENGTH * 0.8 ? `${text.length}/${MESSAGE_MAX_LENGTH} caractères` : "Messages conservés"}
        </p>
      </div>
    </div>
  );
}
