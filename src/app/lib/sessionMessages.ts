// Messagerie interne d'une session (migration 20261125120000) : un fil par
// session entre l'administrateur et le formateur attribué (la demande du
// client, le besoin, le contexte). Auteur et heure sont fixés par la base.
import { supabase } from "@/app/lib/supabase/client";
import type { Database } from "@/app/lib/supabase/database.types";

type Row = Database["public"]["Tables"]["session_messages"]["Row"];

export type SessionMessage = {
  id: string; sessionId: string; authorId: string | null; authorName: string;
  authorRole: "admin" | "formateur"; body: string; createdAt: string;
};

export const MESSAGE_MAX_LENGTH = 5000;

const map = (r: Row): SessionMessage => ({
  id: r.id, sessionId: r.session_id, authorId: r.author_id, authorName: r.author_name,
  authorRole: r.author_role, body: r.body, createdAt: r.created_at,
});

export async function listSessionMessages(sessionId: string): Promise<SessionMessage[]> {
  const { data, error } = await supabase.from("session_messages").select("*").eq("session_id", sessionId).order("created_at");
  if (error) throw error;
  return (data ?? []).map(map);
}

export async function sendSessionMessage(sessionId: string, body: string): Promise<SessionMessage> {
  const { data, error } = await supabase.from("session_messages").insert({ session_id: sessionId, body }).select("*").single();
  if (error) throw error;
  return map(data);
}

// Nouveaux messages de la session en direct ; renvoie la désinscription.
export function subscribeSessionMessages(sessionId: string, onMessage: (m: SessionMessage) => void): () => void {
  const channel = supabase
    .channel(`session_messages:${sessionId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_messages", filter: `session_id=eq.${sessionId}` },
      (payload) => onMessage(map(payload.new as Row)))
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

// Dernier message lu, par session et par appareil : sert la pastille
// « non lus » du bouton.
const readKey = (sessionId: string) => `session-messages-read:${sessionId}`;
export const getLastRead = (sessionId: string) => localStorage.getItem(readKey(sessionId)) ?? "";
export const setLastRead = (sessionId: string, iso: string) => localStorage.setItem(readKey(sessionId), iso);
