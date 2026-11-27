import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Download, FileText, Paperclip, Plus, Trash2, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { addMeeting, deleteMeeting, listMeetings, meetingFileUrl, MEETING_FILE_ACCEPT, type SessionMeeting } from "@/app/lib/sessionMeetings";
import { todayIso } from "@/app/lib/documents/session";
import { Field, TextArea, TextInput } from "./fields";

// Rendez-vous avec le client (admin) : date, objet, compte rendu et document
// joint. Le client les retrouve dans l'onglet « Vos rendez-vous » de son espace.

const dateFr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function MeetingsCard({ sessionId }: { sessionId: string }) {
  const th = useTh();
  const [meetings, setMeetings] = useState<SessionMeeting[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: todayIso(), title: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = () => listMeetings(sessionId).then(setMeetings).catch((err) => { console.error(err); setMissing(true); });
  useEffect(() => { void load(); }, [sessionId]);

  const reset = () => { setAdding(false); setForm({ date: todayIso(), title: "", notes: "" }); setFile(null); };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Indiquez l'objet du rendez-vous.");
    if (!form.date) return toast.error("Indiquez la date du rendez-vous.");
    setSaving(true);
    try {
      await addMeeting(sessionId, { ...form, file });
      reset();
      await load();
      toast.success("Rendez-vous ajouté : il apparaît dans l'espace client.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Ajout impossible.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m: SessionMeeting) => {
    if (!confirm(`Supprimer le rendez-vous « ${m.title} »${m.fileName ? " et son document" : ""} ? Le client ne le verra plus.`)) return;
    try { await deleteMeeting(m); await load(); } catch (err) { console.error(err); toast.error("Suppression impossible."); }
  };

  const download = async (m: SessionMeeting) => {
    try { window.open(await meetingFileUrl(m), "_blank", "noopener"); } catch (err) { console.error(err); toast.error("Téléchargement impossible."); }
  };

  return (
    <GCard><div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarCheck className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>Rendez-vous client</p>
        {!missing && !adding && (
          <button type="button" onClick={() => setAdding(true)} title="Ajouter un rendez-vous" className="p-1 hover:opacity-70"><Plus className="w-4 h-4" style={{ color: th.fg2 }} /></button>
        )}
      </div>

      {missing && <p className="text-xs" style={{ color: th.fg3 }}>Indisponible : migration 20261128120000_client_portal_tabs à appliquer.</p>}

      {adding && (
        <div className="rounded-[6px] p-3 space-y-3" style={{ border: `1px solid ${th.sep}` }}>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <Field label="Date"><TextInput type="date" value={form.date} onChange={(date) => setForm((f) => ({ ...f, date }))} /></Field>
            <Field label="Objet"><TextInput value={form.title} placeholder="Réunion de cadrage" onChange={(title) => setForm((f) => ({ ...f, title }))} /></Field>
          </div>
          <Field label="Compte rendu (facultatif)"><TextArea rows={3} value={form.notes} onChange={(notes) => setForm((f) => ({ ...f, notes }))} /></Field>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[2px] hover:opacity-70"
              style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
              <Paperclip className="w-3.5 h-3.5" />{file ? "Changer le document" : "Joindre un document (PDF ou Word)"}
            </button>
            {file && (
              <span className="inline-flex items-center gap-1 text-[11px] min-w-0" style={{ color: th.fg2 }}>
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)} aria-label="Retirer le document" className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}
            <input ref={input} type="file" accept={MEETING_FILE_ACCEPT} className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          </div>
          <div className="flex gap-2">
            <ShimBtn sm onClick={() => void save()} disabled={saving}>{saving ? "Ajout…" : "Ajouter"}</ShimBtn>
            <VBtn sm onClick={reset} disabled={saving}>Annuler</VBtn>
          </div>
        </div>
      )}

      {meetings && !meetings.length && !adding && (
        <p className="text-xs" style={{ color: th.fg2 }}>Consignez ici les rendez-vous tenus avec le client (cadrage, bilan…) et leur compte rendu : il les retrouve dans son espace.</p>
      )}

      {meetings?.map((m) => (
        <div key={m.id} className="rounded-[6px] p-3 space-y-1.5" style={{ border: `1px solid ${th.sep}` }}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: th.fg }}>{m.title}</p>
              <p className="text-[11px]" style={{ color: th.fg3 }}>{dateFr(m.date)}</p>
            </div>
            <button type="button" onClick={() => void remove(m)} title="Supprimer" className="p-1 hover:opacity-70"><Trash2 className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
          </div>
          {m.notes && <p className="text-[11px] whitespace-pre-line line-clamp-3" style={{ color: th.fg2 }}>{m.notes}</p>}
          {m.fileName && (
            <button type="button" onClick={() => void download(m)} className="inline-flex items-center gap-1.5 text-[11px] font-bold hover:underline max-w-full" style={{ color: th.fg }}>
              <FileText className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{m.fileName}</span><Download className="w-3 h-3 shrink-0" />
            </button>
          )}
        </div>
      ))}
    </div></GCard>
  );
}
