import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Download, Eye, FileText, Loader2, Paperclip, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { MarkdownText } from "@/app/components/common/MarkdownText";
import {
  addMeeting, deleteMeeting, listMeetings, meetingFileUrl, MEETING_FILE_ACCEPT, summarizeMeetingFile, updateMeetingSummary, type SessionMeeting,
} from "@/app/lib/sessionMeetings";
import type { DocumentStep } from "@/app/lib/claudeDocumentTask";
import { todayIso } from "@/app/lib/documents/session";
import { Field, TextArea, TextInput } from "./fields";

// Rendez-vous avec le client (admin) : date, objet et document (PDF ou
// Word). Claude en rédige un compte rendu structuré, fidèle au document, que
// l'on relit avant d'enregistrer. Le client ne voit que ce compte rendu,
// dans l'onglet « Vos rendez-vous » de son espace ; le fichier reste ici.

const dateFr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const STEP_LABELS: Record<DocumentStep, string> = { lecture: "Lecture du document…", analyse: "Claude rédige le compte rendu (30 s à 1 min)…" };

// Compte rendu en Markdown : saisie ou aperçu tel que le client le verra.
function SummaryEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const th = useTh();
  const [preview, setPreview] = useState(true);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold flex-1" style={{ color: th.fg2 }}>Compte rendu visible par le client</span>
        <button type="button" onClick={() => setPreview((p) => !p)} className="inline-flex items-center gap-1 text-[11px] font-bold hover:opacity-70" style={{ color: th.fg2 }}>
          {preview ? <><Pencil className="w-3 h-3" />Corriger</> : <><Eye className="w-3 h-3" />Aperçu</>}
        </button>
      </div>
      {preview ? (
        <div className="rounded-[4px] p-3 max-h-80 overflow-y-auto" style={{ border: `1px solid ${th.sep}` }}><MarkdownText>{value}</MarkdownText></div>
      ) : (
        <TextArea rows={12} value={value} onChange={onChange} />
      )}
    </div>
  );
}

export function MeetingsCard({ sessionId }: { sessionId: string }) {
  const th = useTh();
  const [meetings, setMeetings] = useState<SessionMeeting[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: todayIso(), title: "", summary: "" });
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<DocumentStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ id: string; summary: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = () => listMeetings(sessionId).then(setMeetings).catch((err) => { console.error(err); setMissing(true); });
  useEffect(() => { void load(); }, [sessionId]);

  const reset = () => { setAdding(false); setForm({ date: todayIso(), title: "", summary: "" }); setFile(null); };

  const summarize = async (f: File) => {
    setStep("lecture");
    try {
      const summary = await summarizeMeetingFile(f, { title: form.title, date: form.date }, setStep);
      setForm((x) => ({ ...x, summary }));
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Le compte rendu n'a pas pu être rédigé.");
    } finally {
      setStep(null);
    }
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    void summarize(f);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Indiquez l'objet du rendez-vous.");
    if (!form.date) return toast.error("Indiquez la date du rendez-vous.");
    if (!form.summary.trim()) return toast.error("Joignez le document du rendez-vous pour en rédiger le compte rendu, ou écrivez-le.");
    setSaving(true);
    try {
      await addMeeting(sessionId, { date: form.date, title: form.title, notes: form.summary, file });
      reset();
      await load();
      toast.success("Rendez-vous ajouté : son compte rendu apparaît dans l'espace client.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Ajout impossible.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateMeetingSummary(editing.id, editing.summary);
      setEditing(null);
      await load();
      toast.success("Compte rendu mis à jour.");
    } catch (err) {
      console.error(err);
      toast.error("Enregistrement impossible.");
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

      {missing && <p className="text-xs" style={{ color: th.fg3 }}>Indisponible : migrations 20261128120000 et 20261129120000 à appliquer.</p>}

      {adding && (
        <div className="rounded-[6px] p-3 space-y-3" style={{ border: `1px solid ${th.sep}` }}>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <Field label="Date"><TextInput type="date" value={form.date} onChange={(date) => setForm((f) => ({ ...f, date }))} /></Field>
            <Field label="Objet"><TextInput value={form.title} placeholder="Réunion de cadrage" onChange={(title) => setForm((f) => ({ ...f, title }))} /></Field>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" disabled={!!step} onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[2px] hover:opacity-70 disabled:opacity-50"
              style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
              <Paperclip className="w-3.5 h-3.5" />{file ? "Changer le document" : "Joindre le document (PDF ou Word)"}
            </button>
            {file && !step && (
              <>
                <span className="inline-flex items-center gap-1 text-[11px] min-w-0" style={{ color: th.fg2 }}>
                  <span className="truncate max-w-[160px]">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} aria-label="Retirer le document" className="hover:opacity-70"><X className="w-3 h-3" /></button>
                </span>
                <button type="button" onClick={() => void summarize(file)} className="inline-flex items-center gap-1 text-[11px] font-bold hover:opacity-70" style={{ color: th.fg2 }}>
                  <Sparkles className="w-3 h-3" />Rédiger à nouveau
                </button>
              </>
            )}
            <input ref={input} type="file" accept={MEETING_FILE_ACCEPT} className="hidden"
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          {step && (
            <p className="text-xs flex items-center gap-2" style={{ color: th.fg2 }}><Loader2 className="w-3.5 h-3.5 animate-spin" />{STEP_LABELS[step]}</p>
          )}
          {form.summary && !step && (
            <>
              <SummaryEditor value={form.summary} onChange={(summary) => setForm((f) => ({ ...f, summary }))} />
              <p className="text-[11px]" style={{ color: th.fg3 }}>Rédigé par Claude à partir du document, sans en changer le fond : relisez avant d'ajouter. Le client ne reçoit pas le fichier.</p>
            </>
          )}
          <div className="flex gap-2">
            <ShimBtn sm onClick={() => void save()} disabled={saving || !!step}>{saving ? "Ajout…" : "Ajouter"}</ShimBtn>
            <VBtn sm onClick={reset} disabled={saving}>Annuler</VBtn>
          </div>
        </div>
      )}

      {meetings && !meetings.length && !adding && (
        <p className="text-xs" style={{ color: th.fg2 }}>Joignez le document d'un rendez-vous tenu avec le client (cadrage, bilan…) : Claude en rédige le compte rendu, que le client lit dans son espace.</p>
      )}

      {meetings?.map((m) => (
        <div key={m.id} className="rounded-[6px] p-3 space-y-2" style={{ border: `1px solid ${th.sep}` }}>
          <div className="flex items-start gap-2">
            <button type="button" onClick={() => setOpenId(openId === m.id ? null : m.id)} className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate" style={{ color: th.fg }}>{m.title}</p>
              <p className="text-[11px]" style={{ color: th.fg3 }}>{dateFr(m.date)} · {m.notes ? (openId === m.id ? "masquer le compte rendu" : "voir le compte rendu") : "sans compte rendu"}</p>
            </button>
            <button type="button" onClick={() => { setOpenId(m.id); setEditing({ id: m.id, summary: m.notes ?? "" }); }} title="Corriger le compte rendu" className="p-1 hover:opacity-70"><Pencil className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
            <button type="button" onClick={() => void remove(m)} title="Supprimer" className="p-1 hover:opacity-70"><Trash2 className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
          </div>
          {editing?.id === m.id ? (
            <div className="space-y-2">
              <SummaryEditor value={editing.summary} onChange={(summary) => setEditing({ id: m.id, summary })} />
              <div className="flex gap-2">
                <ShimBtn sm onClick={() => void saveEdit()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
                <VBtn sm onClick={() => setEditing(null)} disabled={saving}>Annuler</VBtn>
              </div>
            </div>
          ) : openId === m.id && m.notes ? (
            <div className="rounded-[4px] p-3 max-h-80 overflow-y-auto" style={{ background: th.navA }}><MarkdownText>{m.notes}</MarkdownText></div>
          ) : null}
          {m.fileName && (
            <button type="button" onClick={() => void download(m)} className="inline-flex items-center gap-1.5 text-[11px] font-bold hover:underline max-w-full" style={{ color: th.fg2 }}
              title="Document d'origine, visible par l'équipe seulement">
              <FileText className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{m.fileName}</span><Download className="w-3 h-3 shrink-0" />
            </button>
          )}
        </div>
      ))}
    </div></GCard>
  );
}
