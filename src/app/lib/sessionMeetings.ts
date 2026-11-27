// Rendez-vous avec le client (migrations 20261128120000 et 20261129120000) :
// saisis par l'administrateur dans le dossier avec leur document (PDF ou
// Word). Le client n'en voit que le résumé (notes, Markdown), rédigé par
// Claude à partir du document puis relu : le fichier reste ici, côté admin.
import { supabase } from "@/app/lib/supabase/client";
import { DOCUMENT_ACCEPT, runDocumentTask, type DocumentStep } from "@/app/lib/claudeDocumentTask";

const BUCKET = "session-meetings";
export const MEETING_FILE_ACCEPT = DOCUMENT_ACCEPT;
const MAX_BYTES = 20 * 1024 * 1024;

export type SessionMeeting = {
  id: string; date: string; title: string; notes: string | null; filePath: string | null; fileName: string | null; createdAt: string;
};

export async function listMeetings(sessionId: string): Promise<SessionMeeting[]> {
  const { data, error } = await supabase.from("session_meetings").select("*").eq("session_id", sessionId)
    .order("meeting_date", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id, date: m.meeting_date, title: m.title, notes: m.notes, filePath: m.file_path, fileName: m.file_name, createdAt: m.created_at,
  }));
}

function fileKind(file: File): { ext: string; type: string } {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return { ext: "pdf", type: "application/pdf" };
  if (name.endsWith(".docx")) return { ext: "docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  throw new Error("Document au format PDF ou Word (.docx) seulement.");
}

export async function addMeeting(sessionId: string, input: { date: string; title: string; notes: string; file: File | null }): Promise<void> {
  let filePath: string | null = null;
  if (input.file) {
    if (input.file.size > MAX_BYTES) throw new Error("Document trop lourd (20 Mo au plus).");
    const { ext, type } = fileKind(input.file);
    filePath = `${sessionId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, input.file, { contentType: type });
    if (error) throw error;
  }
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("session_meetings").insert({
    session_id: sessionId, meeting_date: input.date, title: input.title.trim(), notes: input.notes.trim() || null,
    file_path: filePath, file_name: input.file?.name ?? null, created_by: auth.user?.id ?? null,
  });
  if (error) {
    if (filePath) await supabase.storage.from(BUCKET).remove([filePath]);
    throw error;
  }
}

export async function updateMeetingSummary(id: string, notes: string): Promise<void> {
  const { error } = await supabase.from("session_meetings").update({ notes: notes.trim() || null }).eq("id", id);
  if (error) throw error;
}

// Résumé structuré et fidèle du document, par Claude (fonction summarize-meeting).
export async function summarizeMeetingFile(file: File, context: { title: string; date: string }, onStep?: (s: DocumentStep) => void): Promise<string> {
  const quand = context.date ? new Date(`${context.date}T12:00:00`).toLocaleDateString("fr-FR", { dateStyle: "long" }) : "";
  const text = await runDocumentTask("summarize-meeting", file, {
    context: [context.title.trim() && `objet « ${context.title.trim()} »`, quand && `rendez-vous du ${quand}`].filter(Boolean).join(", "),
    onStep,
  });
  // Bloc de code éventuel autour de la réponse.
  return text.trim().replace(/^```(?:markdown|md)?\s*\n/i, "").replace(/\n```\s*$/, "").trim();
}

export async function deleteMeeting(m: SessionMeeting): Promise<void> {
  const { error } = await supabase.from("session_meetings").delete().eq("id", m.id);
  if (error) throw error;
  if (m.filePath) await supabase.storage.from(BUCKET).remove([m.filePath]);
}

export async function meetingFileUrl(m: SessionMeeting): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(m.filePath!, 300, { download: m.fileName ?? true });
  if (error || !data) throw error ?? new Error("Lien indisponible.");
  return data.signedUrl;
}
