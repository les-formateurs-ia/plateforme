import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { addDays, addHours, nextMonday, setHours, setMinutes, startOfHour } from "date-fns";
import {
  AlarmClock, ArrowRightLeft, CalendarCheck, Check, Copy, Mail, MessageSquareText, Phone, PhoneCall, Plus, StickyNote, Trash2,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/app/components/ui/sheet";
import { Pill, HueButton, GhostButton } from "@/app/components/entreprise/EntrepriseKit";
import {
  addActivity, addReminder, deleteActivity, deleteProspect, dueLabel, isManual, deleteReminder, leadAnswers, leadName, listActivities, listLeadReminders,
  setDealValue, setReminderDone, ACTIVITY_KINDS, SOURCES, STAGES, STAGE_LABEL,
  type Activity, type Lead, type ProspectActivityKind, type ProspectStage, type Reminder,
} from "@/app/lib/prospects";

const KIND_ICONS: Record<ProspectActivityKind, typeof StickyNote> = {
  note: StickyNote, appel: PhoneCall, email: Mail, rdv: CalendarCheck, etape: ArrowRightLeft,
};
const KIND_LABELS: Record<ProspectActivityKind, string> = { note: "Note", appel: "Appel", email: "E-mail", rdv: "Rendez-vous", etape: "Étape" };

// Raccourcis de date pour un rappel, à 9 h quand ce n'est pas "dans 2 h".
const at9 = (d: Date) => setMinutes(setHours(d, 9), 0);
const PRESETS: { label: string; date: () => Date }[] = [
  { label: "Dans 2 h", date: () => startOfHour(addHours(new Date(), 3)) },
  { label: "Demain 9 h", date: () => at9(addDays(new Date(), 1)) },
  { label: "Dans 3 jours", date: () => at9(addDays(new Date(), 3)) },
  { label: "Lundi 9 h", date: () => at9(nextMonday(new Date())) },
  { label: "Dans 1 semaine", date: () => at9(addDays(new Date(), 7)) },
];
// Valeur d'un <input type="datetime-local"> (heure locale, sans fuseau).
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function ProspectPanel({ lead, onClose, onLeadChange, onMove, onBoardStale, onDeleted }: {
  lead: Lead | null;
  onClose: () => void;
  onLeadChange: (patch: Partial<Lead>) => void;
  onMove: (stage: ProspectStage) => void;
  onBoardStale: () => void; // rappels / journal modifiés : le tableau doit se recharger
  onDeleted: () => void;
}) {
  const th = useTh();
  return (
    <Sheet open={!!lead} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 gap-0 overflow-y-auto" style={{ background: th.bg, color: th.fg, borderColor: th.sep }}>
        {lead && <PanelBody key={lead.id} lead={lead} onLeadChange={onLeadChange} onMove={onMove} onBoardStale={onBoardStale} onDeleted={onDeleted} />}
      </SheetContent>
    </Sheet>
  );
}

function PanelBody({ lead, onLeadChange, onMove, onBoardStale, onDeleted }: {
  lead: Lead; onLeadChange: (patch: Partial<Lead>) => void; onMove: (stage: ProspectStage) => void; onBoardStale: () => void; onDeleted: () => void;
}) {
  const th = useTh();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [kind, setKind] = useState<Exclude<ProspectActivityKind, "etape">>("note");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [remTitle, setRemTitle] = useState(`Rappeler ${lead.first_name}`);
  const [remDate, setRemDate] = useState(() => toLocalInput(at9(addDays(new Date(), 1))));
  const [value, setValue] = useState(lead.deal_value?.toString() ?? "");

  const loadDetails = async () => {
    try {
      const [a, r] = await Promise.all([listActivities(lead.id), listLeadReminders(lead.id)]);
      setActivities(a);
      setReminders(r);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger le suivi de ce prospect.");
    }
  };
  // Un changement d'étape (ici ou par glisser-déposer) ajoute une ligne au journal.
  useEffect(() => { void loadDetails(); }, [lead.id, lead.pipeline_stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitActivity = async () => {
    const text = body.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const created = await addActivity(lead.id, kind, text);
      setActivities(list => [created, ...(list ?? [])]);
      setBody("");
      onBoardStale();
      // Premier appel ou e-mail : proposer de faire avancer la carte.
      if ((kind === "appel" || kind === "email" || kind === "rdv") && (lead.pipeline_stage === "nouveau" || lead.pipeline_stage === "a_rappeler")) {
        toast.success(`${KIND_LABELS[kind]} enregistré.`, { action: { label: "Passer en Contactés", onClick: () => onMove("contacte") } });
      } else {
        toast.success(`${KIND_LABELS[kind]} enregistré${kind === "note" ? "e" : ""}.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible d’enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  const removeActivity = async (a: Activity) => {
    if (!window.confirm("Supprimer cette entrée du journal ?")) return;
    try {
      await deleteActivity(a.id);
      setActivities(list => list?.filter(x => x.id !== a.id) ?? null);
      onBoardStale();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer.");
    }
  };

  const submitReminder = async () => {
    const due = new Date(remDate);
    if (!remTitle.trim() || Number.isNaN(due.getTime())) return;
    try {
      const created = await addReminder(lead.id, due, remTitle.trim());
      setReminders(list => [...(list ?? []), created].sort((a, b) => a.due_at.localeCompare(b.due_at)));
      onBoardStale();
      if (lead.pipeline_stage === "nouveau") {
        toast.success("Rappel planifié.", { action: { label: "Passer en À rappeler", onClick: () => onMove("a_rappeler") } });
      } else {
        toast.success("Rappel planifié.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de planifier ce rappel.");
    }
  };

  const toggleReminder = async (r: Reminder) => {
    const done = !r.done_at;
    setReminders(list => list?.map(x => (x.id === r.id ? { ...x, done_at: done ? new Date().toISOString() : null } : x)) ?? null);
    try {
      await setReminderDone(r.id, done);
      onBoardStale();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour le rappel.");
      void loadDetails();
    }
  };

  const removeReminder = async (r: Reminder) => {
    try {
      await deleteReminder(r.id);
      setReminders(list => list?.filter(x => x.id !== r.id) ?? null);
      onBoardStale();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer le rappel.");
    }
  };

  const saveValue = async () => {
    const parsed = value.trim() === "" ? null : Math.round(Number(value.replace(/\s/g, "").replace(",", ".")));
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) { toast.error("Montant invalide."); return; }
    if (parsed === lead.deal_value) return;
    try {
      await setDealValue(lead.id, parsed);
      onLeadChange({ deal_value: parsed });
    } catch (err) {
      console.error(err);
      toast.error("Impossible d’enregistrer le montant.");
    }
  };

  // Seuls les prospects saisis à la main se suppriment ; ceux du site s'archivent.
  const remove = async () => {
    if (!window.confirm(`Supprimer définitivement ${leadName(lead)}, son journal et ses rappels ?`)) return;
    try {
      await deleteProspect(lead.id);
      onDeleted();
      toast.success("Prospect supprimé.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer ce prospect.");
    }
  };

  const copy = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copié.`));
  };

  const open = reminders?.filter(r => !r.done_at) ?? [];
  const done = reminders?.filter(r => r.done_at) ?? [];
  const answers = leadAnswers(lead);

  return (
    <div className="flex flex-col">
      {/* En-tête */}
      <div className="px-6 pt-6 pb-5 pr-12" style={{ borderBottom: `1px solid ${th.sep}` }}>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Pill tone="muted">{SOURCES[lead.source] ?? lead.source}</Pill>
          <Pill>{lead.profile === "entreprise" ? "Entreprise" : "Particulier"}</Pill>
          {lead.status === "callback_requested" && <Pill tone="warn" Icon={Phone}>Rappel sous 24 h demandé</Pill>}
        </div>
        <SheetTitle className="text-2xl font-black leading-tight" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>{leadName(lead)}</SheetTitle>
        <SheetDescription style={{ color: th.fg3 }}>
          {[lead.company, lead.sector].filter(Boolean).join(" · ") || "—"} · reçue le {when(lead.created_at)}
        </SheetDescription>
        <div className="flex flex-wrap gap-2 mt-4">
          {lead.phone && <>
            <a href={`tel:${lead.phone}`} className="sweep inline-flex items-center gap-2 rounded-[2px] min-h-9 px-4 text-sm font-semibold" style={{ background: th.ink, color: th.onInk }}>
              <Phone className="w-4 h-4" />{lead.phone}
            </a>
            <IconBtn title="Copier le numéro" onClick={() => copy(lead.phone!, "Numéro")}><Copy className="w-4 h-4" /></IconBtn>
          </>}
          {lead.email && <>
            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 rounded-[2px] min-h-9 px-4 text-sm font-semibold border min-w-0" style={{ borderColor: th.ink, color: th.fg }}>
              <Mail className="w-4 h-4 shrink-0" /><span className="truncate max-w-[220px]">{lead.email}</span>
            </a>
            <IconBtn title="Copier l’e-mail" onClick={() => copy(lead.email!, "E-mail")}><Copy className="w-4 h-4" /></IconBtn>
          </>}
        </div>
      </div>

      {/* Étape + montant */}
      <Section title="Étape">
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map(s => {
            const active = s.id === lead.pipeline_stage;
            return (
              <button key={s.id} onClick={() => onMove(s.id)} aria-pressed={active}
                className="inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 text-xs font-bold transition-colors"
                style={active ? { background: th.ink, color: th.onInk, borderColor: th.ink } : { borderColor: th.inputB, color: th.fg2 }}>
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-3 mt-4 text-sm">
          <span className="font-semibold shrink-0">Montant estimé</span>
          <span className="relative w-40">
            <input inputMode="numeric" value={value} onChange={e => setValue(e.target.value)} onBlur={() => void saveValue()}
              onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="0" className="w-full rounded-[4px] pl-3 pr-8 py-2 text-sm g-input tabular-nums" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: th.fg3 }}>€</span>
          </span>
        </label>
      </Section>

      {/* Demande */}
      {answers.length > 0 && (
        <Section title={lead.source === "conseiller-ia" ? "Besoin exprimé" : "Demande"}>
          <ul className="space-y-1.5 text-sm">
            {answers.map((line, i) => <li key={i} className="whitespace-pre-wrap break-words" style={{ color: th.fg2 }}>{line}</li>)}
          </ul>
        </Section>
      )}

      {/* Rappels */}
      <Section title="Rappels" icon={<AlarmClock className="w-3.5 h-3.5" />}>
        {open.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {open.map(r => <ReminderRow key={r.id} r={r} onToggle={() => void toggleReminder(r)} onDelete={() => void removeReminder(r)} />)}
          </ul>
        )}
        <div className="rounded-[8px] border p-3 space-y-2.5" style={{ borderColor: th.sep, background: th.card }}>
          <input value={remTitle} onChange={e => setRemTitle(e.target.value)} placeholder="Objet du rappel" aria-label="Objet du rappel"
            className="w-full rounded-[4px] px-3 py-2 text-sm g-input" />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => setRemDate(toLocalInput(p.date()))}
                className="rounded-[3px] border px-2 py-1 text-xs font-semibold"
                style={remDate === toLocalInput(p.date()) ? { background: th.ink, color: th.onInk, borderColor: th.ink } : { borderColor: th.inputB, color: th.fg2 }}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="datetime-local" value={remDate} onChange={e => setRemDate(e.target.value)} aria-label="Date du rappel"
              className="flex-1 min-w-[200px] rounded-[4px] px-3 py-2 text-sm g-input" />
            <HueButton sm Icon={Plus} onClick={() => void submitReminder()} disabled={!remTitle.trim() || !remDate}>Planifier</HueButton>
          </div>
        </div>
        {done.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs font-semibold cursor-pointer" style={{ color: th.fg3 }}>{done.length} rappel{done.length > 1 ? "s" : ""} fait{done.length > 1 ? "s" : ""}</summary>
            <ul className="space-y-1.5 mt-2">
              {done.map(r => <ReminderRow key={r.id} r={r} onToggle={() => void toggleReminder(r)} onDelete={() => void removeReminder(r)} />)}
            </ul>
          </details>
        )}
      </Section>

      {/* Journal */}
      <Section title="Journal" icon={<MessageSquareText className="w-3.5 h-3.5" />}>
        <div className="rounded-[8px] border p-3 space-y-2.5" style={{ borderColor: th.sep, background: th.card }}>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Type d’entrée">
            {ACTIVITY_KINDS.map(k => {
              const Icon = KIND_ICONS[k.id];
              return (
                <button key={k.id} role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-xs font-semibold"
                  style={kind === k.id ? { background: th.ink, color: th.onInk, borderColor: th.ink } : { borderColor: th.inputB, color: th.fg2 }}>
                  <Icon className="w-3.5 h-3.5" />{k.label}
                </button>
              );
            })}
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} aria-label="Contenu"
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submitActivity(); }}
            placeholder={kind === "appel" ? "Ce qui s’est dit, la suite à donner…" : kind === "email" ? "Objet / résumé de l’e-mail…" : kind === "rdv" ? "Date, lieu, participants…" : "Votre note…"}
            className="w-full rounded-[4px] px-3 py-2 text-sm g-input resize-y" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px]" style={{ color: th.fg3 }}>⌘ / Ctrl + Entrée pour enregistrer</span>
            <HueButton sm Icon={Plus} onClick={() => void submitActivity()} disabled={!body.trim() || saving}>Ajouter</HueButton>
          </div>
        </div>

        <ol className="mt-4 space-y-0">
          {activities === null && <li className="text-sm" style={{ color: th.fg3 }}>Chargement…</li>}
          {activities?.length === 0 && <li className="text-sm" style={{ color: th.fg3 }}>Aucune entrée pour le moment.</li>}
          {activities?.map(a => {
            const Icon = KIND_ICONS[a.kind];
            const stage = a.kind === "etape";
            return (
              <li key={a.id} className="group relative pl-8 pb-4">
                <span className="absolute left-[11px] top-6 bottom-0 w-px" style={{ background: th.sep }} />
                <span className="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: stage ? th.navA : th.ink, color: stage ? th.fg3 : th.onInk }}>
                  <Icon className="w-3 h-3" />
                </span>
                <div className="flex items-baseline gap-2 text-xs" style={{ color: th.fg3 }}>
                  <span className="font-bold" style={{ color: stage ? th.fg3 : th.fg }}>{KIND_LABELS[a.kind]}</span>
                  <span>{when(a.created_at)}</span>
                  {!stage && (
                    <button onClick={() => void removeActivity(a)} title="Supprimer" aria-label="Supprimer"
                      className="ml-auto opacity-0 group-hover:opacity-60 hover:!opacity-100 focus:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap break-words" style={{ color: stage ? th.fg3 : th.fg2 }}>
                  {stage ? `Déplacé vers « ${STAGE_LABEL[a.body as ProspectStage] ?? a.body} »` : a.body}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      <div className="px-6 py-6 flex flex-wrap items-center gap-3">
        <GhostButton sm onClick={() => onMove(lead.pipeline_stage === "archive" ? "nouveau" : "archive")}>
          {lead.pipeline_stage === "archive" ? "Désarchiver" : "Archiver ce prospect"}
        </GhostButton>
        {isManual(lead) && (
          <button onClick={() => void remove()} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: th.danger }}>
            <Trash2 className="w-4 h-4" />Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  const th = useTh();
  return (
    <section className="px-6 py-5" style={{ borderBottom: `1px solid ${th.sep}` }}>
      <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-3" style={{ color: th.fg2 }}>{icon}{title}</h3>
      {children}
    </section>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  const th = useTh();
  return (
    <button onClick={onClick} title={title} aria-label={title} className="w-9 h-9 rounded-[2px] border flex items-center justify-center" style={{ borderColor: th.inputB, color: th.fg2 }}>
      {children}
    </button>
  );
}

function ReminderRow({ r, onToggle, onDelete }: { r: Reminder; onToggle: () => void; onDelete: () => void }) {
  const th = useTh();
  const late = !r.done_at && new Date(r.due_at) < new Date();
  return (
    <li className="group flex items-center gap-2.5 rounded-[6px] border px-3 py-2" style={{ borderColor: late ? th.danger : th.sep, background: th.card }}>
      <button onClick={onToggle} title={r.done_at ? "Marquer comme à faire" : "Marquer comme fait"} aria-label={r.done_at ? "Marquer comme à faire" : "Marquer comme fait"}
        className="w-5 h-5 rounded-[4px] border shrink-0 flex items-center justify-center"
        style={r.done_at ? { background: th.ink, borderColor: th.ink, color: th.onInk } : { borderColor: th.ink }}>
        {r.done_at && <Check className="w-3.5 h-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate" style={{ textDecoration: r.done_at ? "line-through" : undefined, color: r.done_at ? th.fg3 : th.fg }}>{r.title}</div>
        <div className="text-xs" style={{ color: late ? th.danger : th.fg3 }}>{late ? "En retard · " : ""}{dueLabel(r.due_at)}</div>
      </div>
      <button onClick={onDelete} title="Supprimer le rappel" aria-label="Supprimer le rappel" className="opacity-0 group-hover:opacity-60 hover:!opacity-100 focus:opacity-100" style={{ color: th.fg2 }}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}
