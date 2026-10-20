import { useCallback, useEffect, useMemo, useState, type CSSProperties, type DragEvent } from "react";
import { toast } from "sonner";
import { addDays, endOfDay, formatDistanceToNowStrict, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlarmClock, Archive, BellRing, Building2, CalendarDays, Check, ChevronDown, ChevronRight, Columns3, Euro,
  Inbox, Mail, MessageSquareText, Phone, RefreshCw, Search, Target, Trophy, User, UserPlus,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { PageHero, Pill, Loading, ErrorText, GhostButton, HueButton } from "@/app/components/entreprise/EntrepriseKit";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cx } from "@/app/lib/cx";
import {
  dueLabel, loadBoard, setStage, setReminderDone, leadName, SOURCES, STAGES, STAGE_LABEL,
  type Board, type Lead, type ProspectStage, type Reminder,
} from "@/app/lib/prospects";
import { ProspectPanel } from "./ProspectPanel";
import { NewProspectDialog } from "./NewProspectDialog";

const euro = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: fr });
const overdue = (r: Reminder) => isBefore(new Date(r.due_at), new Date());

type View = "board" | "reminders";

export function ProspectsPage() {
  const th = useTh();
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("board");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"" | Lead["source"]>("");
  const [profile, setProfile] = useState<"" | Lead["profile"]>("");
  const [showArchived, setShowArchived] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<ProspectStage | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setBoard(await loadBoard());
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  // Nouvelles demandes du site : actualisation au retour sur l'onglet et chaque minute.
  useEffect(() => {
    const update = () => { if (document.visibilityState === "visible") void reload(); };
    const timer = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, [reload]);

  const leads = board?.leads ?? [];
  const reminders = board?.reminders ?? [];
  const leadById = useMemo(() => new Map(leads.map(l => [l.id, l])), [leads]);
  const nextReminder = useMemo(() => {
    const map = new Map<number, Reminder>();
    for (const r of reminders) if (!map.has(r.lead_id)) map.set(r.lead_id, r); // déjà triés par échéance
    return map;
  }, [reminders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(l => (!source || l.source === source) && (!profile || l.profile === profile)
      && (!q || [l.first_name, l.last_name, l.email, l.phone, l.company, l.sector].some(v => v?.toLowerCase().includes(q))));
  }, [leads, query, source, profile]);

  const columns = useMemo(() => {
    const byStage = new Map<ProspectStage, Lead[]>(STAGES.map(s => [s.id, []]));
    for (const l of filtered) byStage.get(l.pipeline_stage)?.push(l);
    // Dans chaque colonne : d'abord ceux qui ont un rappel (le plus proche en
    // haut), puis les plus récemment arrivés dans la colonne.
    for (const list of byStage.values()) list.sort((a, b) => {
      const ra = nextReminder.get(a.id)?.due_at, rb = nextReminder.get(b.id)?.due_at;
      if (ra && rb) return ra.localeCompare(rb);
      if (ra || rb) return ra ? -1 : 1;
      return b.stage_changed_at.localeCompare(a.stage_changed_at);
    });
    return byStage;
  }, [filtered, nextReminder]);

  const stats = useMemo(() => {
    const since30 = addDays(new Date(), -30).toISOString();
    const late = reminders.filter(overdue).length;
    const today = reminders.filter(r => !overdue(r) && isBefore(new Date(r.due_at), endOfDay(new Date()))).length;
    const proposals = leads.filter(l => l.pipeline_stage === "proposition");
    const won30 = leads.filter(l => l.pipeline_stage === "gagne" && l.stage_changed_at >= since30);
    const decided = leads.filter(l => l.pipeline_stage === "gagne" || l.pipeline_stage === "archive").length;
    const won = leads.filter(l => l.pipeline_stage === "gagne").length;
    return {
      fresh: leads.filter(l => l.pipeline_stage === "nouveau").length,
      late, today,
      proposals: proposals.length,
      proposalsValue: proposals.reduce((s, l) => s + (l.deal_value ?? 0), 0),
      won30: won30.length,
      won30Value: won30.reduce((s, l) => s + (l.deal_value ?? 0), 0),
      conversion: decided ? Math.round((won / decided) * 100) : null,
    };
  }, [leads, reminders]);

  // ── Mises à jour locales (le panneau et le glisser-déposer) ────────────
  const patchLead = (id: number, patch: Partial<Lead>) =>
    setBoard(b => b && { ...b, leads: b.leads.map(l => (l.id === id ? { ...l, ...patch } : l)) });

  const moveLead = async (lead: Lead, stage: ProspectStage) => {
    if (lead.pipeline_stage === stage) return;
    const previous = { pipeline_stage: lead.pipeline_stage, stage_changed_at: lead.stage_changed_at };
    patchLead(lead.id, { pipeline_stage: stage, stage_changed_at: new Date().toISOString() });
    try {
      await setStage(lead.id, stage);
      if (stage === "a_rappeler" && !nextReminder.has(lead.id)) {
        toast(`${leadName(lead)} est à rappeler`, { description: "Aucun rappel n’est encore planifié.", action: { label: "Planifier", onClick: () => setOpenId(lead.id) } });
      } else {
        toast.success(`${leadName(lead)} → ${STAGE_LABEL[stage]}`);
      }
    } catch (err) {
      console.error(err);
      patchLead(lead.id, previous);
      toast.error("Impossible de déplacer ce prospect.");
    }
  };

  const toggleReminder = async (r: Reminder) => {
    setBoard(b => b && { ...b, reminders: b.reminders.filter(x => x.id !== r.id) });
    try {
      await setReminderDone(r.id, true);
      toast.success("Rappel marqué comme fait.", { action: { label: "Annuler", onClick: () => void setReminderDone(r.id, false).then(reload) } });
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour le rappel.");
      void reload();
    }
  };

  const onDrop = (e: DragEvent, stage: ProspectStage) => {
    e.preventDefault();
    setDragOver(null);
    const lead = leadById.get(Number(e.dataTransfer.getData("text/prospect")));
    if (lead) void moveLead(lead, stage);
  };

  const openLead = openId !== null ? leadById.get(openId) ?? null : null;
  const visibleStages = STAGES.filter(s => s.id !== "archive" || showArchived);
  const selectStyle: CSSProperties = { background: th.inputBg, borderColor: th.inputB, color: th.fg };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6" style={{ color: th.fg }}>
      <PageHero Icon={Target} hue="peach" eyebrow="Espace prospects" title={<GT>Suivi des prospects</GT>}
        desc="Les demandes du site et les prospects que vous ajoutez (Google, MaFormation, réseaux sociaux, appels directs). Glissez une carte d’une colonne à l’autre, ouvrez-la pour noter un appel ou planifier un rappel."
        actions={<>
          <GhostButton Icon={RefreshCw} sm onClick={() => void reload()} disabled={loading}>Actualiser</GhostButton>
          <HueButton Icon={UserPlus} sm onClick={() => setCreating(true)}>Nouveau prospect</HueButton>
        </>} />

      {/* Tableau de bord */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi Icon={Inbox} label="Nouveaux à traiter" value={stats.fresh} onClick={() => { setView("board"); }} />
        <Kpi Icon={AlarmClock} label="Rappels en retard" value={stats.late} tone={stats.late ? "danger" : undefined} onClick={() => setView("reminders")} />
        <Kpi Icon={BellRing} label="Rappels aujourd’hui" value={stats.today} tone={stats.today ? "warn" : undefined} onClick={() => setView("reminders")} />
        <Kpi Icon={Euro} label="Propositions en cours" value={stats.proposals} sub={stats.proposalsValue ? euro(stats.proposalsValue) : undefined} />
        <Kpi Icon={Trophy} label="Gagnés (30 jours)" value={stats.won30} sub={stats.won30Value ? euro(stats.won30Value) : undefined} tone={stats.won30 ? "done" : undefined} />
        <Kpi Icon={Check} label="Taux de conversion" value={stats.conversion === null ? "—" : `${stats.conversion} %`} sub="gagnés / (gagnés + archivés)" />
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex rounded-[4px] p-0.5" style={{ border: `1px solid ${th.inputB}` }} role="tablist" aria-label="Vue">
          {([["board", "Tableau", Columns3], ["reminders", `Rappels${reminders.length ? ` (${reminders.length})` : ""}`, CalendarDays]] as const).map(([id, label, Icon]) => (
            <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
              className="inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-sm font-semibold transition-colors"
              style={view === id ? { background: th.ink, color: th.onInk } : { color: th.fg2 }}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
        <label className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="sr-only">Rechercher un prospect</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: th.fg3 }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom, e-mail, téléphone, entreprise…"
            className="w-full rounded-[4px] pl-9 pr-3 py-2 text-sm g-input" />
        </label>
        <select aria-label="Origine" value={source} onChange={e => setSource(e.target.value as "" | Lead["source"])} className="rounded-[4px] border px-3 py-2 text-sm" style={selectStyle}>
          <option value="">Toutes les origines</option>
          {Object.entries(SOURCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Profil" value={profile} onChange={e => setProfile(e.target.value as "" | Lead["profile"])} className="rounded-[4px] border px-3 py-2 text-sm" style={selectStyle}>
          <option value="">Tous les profils</option><option value="entreprise">Entreprises</option><option value="particulier">Particuliers</option>
        </select>
        {view === "board" && (
          <button onClick={() => setShowArchived(v => !v)} className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: showArchived ? th.ink : th.inputB, color: showArchived ? th.fg : th.fg2 }}>
            <Archive className="w-4 h-4" />{showArchived ? "Masquer" : "Afficher"} les archivés ({columns.get("archive")?.length ?? 0})
          </button>
        )}
      </div>

      {error && <ErrorText>Impossible de charger les prospects. Cliquez sur Actualiser pour réessayer.</ErrorText>}
      {!board && loading && <Loading label="Chargement des prospects…" />}

      {board && view === "board" && (
        <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-4">
          <div className="flex gap-3 items-start" style={{ minWidth: visibleStages.length * 272 }}>
            {visibleStages.map(stage => {
              const list = columns.get(stage.id) ?? [];
              const value = list.reduce((s, l) => s + (l.deal_value ?? 0), 0);
              const active = dragOver === stage.id;
              return (
                <section key={stage.id} aria-label={stage.label}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOver !== stage.id) setDragOver(stage.id); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
                  onDrop={e => onDrop(e, stage.id)}
                  className="flex-1 min-w-[260px] max-w-[340px] rounded-[10px] flex flex-col transition-colors"
                  style={{ background: active ? th.gradShadow(th.isDark ? 0.1 : 0.06) : th.navA, border: `1px ${active ? "dashed" : "solid"} ${active ? th.ink : "transparent"}` }}>
                  <header className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                      <h2 className="text-sm font-black uppercase tracking-wider">{stage.label}</h2>
                      <span className="ml-auto text-xs font-bold tabular-nums rounded-[2px] px-1.5 py-0.5" style={{ background: th.card, color: th.fg2 }}>{list.length}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: th.fg3 }}>{stage.hint}{value ? ` · ${euro(value)}` : ""}</p>
                  </header>
                  <div className="px-2 pb-2 space-y-2 min-h-24 max-h-[calc(100dvh-260px)] overflow-y-auto">
                    {list.map(lead => (
                      <LeadCard key={lead.id} lead={lead} reminder={nextReminder.get(lead.id)}
                        lastContact={board.lastContact.get(lead.id)} notes={board.activityCount.get(lead.id) ?? 0}
                        onOpen={() => setOpenId(lead.id)} onMove={s => void moveLead(lead, s)} />
                    ))}
                    {list.length === 0 && <p className="text-xs text-center py-6" style={{ color: th.fg3 }}>Déposez une carte ici</p>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {board && view === "reminders" && (
        <RemindersAgenda reminders={reminders.filter(r => filtered.some(l => l.id === r.lead_id))} leadById={leadById}
          onOpen={setOpenId} onDone={r => void toggleReminder(r)} />
      )}

      <ProspectPanel lead={openLead} onClose={() => setOpenId(null)}
        onLeadChange={patch => openLead && patchLead(openLead.id, patch)}
        onMove={s => openLead && void moveLead(openLead, s)}
        onBoardStale={() => void reload()}
        onDeleted={() => {
          if (openLead) setBoard(b => b && { ...b, leads: b.leads.filter(l => l.id !== openLead.id), reminders: b.reminders.filter(r => r.lead_id !== openLead.id) });
          setOpenId(null);
        }} />

      <NewProspectDialog open={creating} onOpenChange={setCreating} onCreated={lead => {
        setBoard(b => b && { ...b, leads: [lead, ...b.leads] });
        setCreating(false);
        if (lead.pipeline_stage === "archive") setShowArchived(true);
        setView("board");
        setOpenId(lead.id);
        toast.success(`${leadName(lead)} ajouté au tableau.`);
      }} />
    </div>
  );
}

function Kpi({ Icon, label, value, sub, tone, onClick }: {
  Icon: typeof Inbox; label: string; value: number | string; sub?: string; tone?: "danger" | "warn" | "done"; onClick?: () => void;
}) {
  const th = useTh();
  const color = tone === "danger" ? th.danger : tone === "warn" ? th.warn : tone === "done" ? th.success : th.fg;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={cx("flex flex-col justify-start text-left rounded-[10px] border px-4 py-3 transition-colors", onClick && "hover-fine:[border-color:var(--ink)]")}
      style={{ background: th.card, borderColor: tone === "danger" ? th.danger : th.sep }}>
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: th.fg3 }}>
        <Icon className="w-3.5 h-3.5" />{label}
      </div>
      <div className="text-2xl font-black tabular-nums mt-1" style={{ color, fontFamily: "'Funnel Display',sans-serif" }}>{value}</div>
      {sub && <div className="text-xs mt-0.5 truncate" style={{ color: th.fg3 }}>{sub}</div>}
    </Tag>
  );
}

function LeadCard({ lead, reminder, lastContact, notes, onOpen, onMove }: {
  lead: Lead; reminder?: Reminder; lastContact?: string; notes: number; onOpen: () => void; onMove: (s: ProspectStage) => void;
}) {
  const th = useTh();
  const late = reminder && overdue(reminder);
  const subtitle = lead.company || lead.sector || (lead.profile === "entreprise" ? "Entreprise" : "Particulier");
  return (
    <article draggable onDragStart={e => { e.dataTransfer.setData("text/prospect", String(lead.id)); e.dataTransfer.effectAllowed = "move"; }}
      onClick={onOpen} onKeyDown={e => { if (e.key === "Enter") onOpen(); }} tabIndex={0}
      className="group rounded-[8px] border p-3 cursor-grab active:cursor-grabbing transition-colors hover-fine:[border-color:var(--ink)] focus-visible:[border-color:var(--ink)] outline-none"
      style={{ background: th.card, borderColor: late ? th.danger : th.sep }}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold truncate">{leadName(lead)}</h3>
          <p className="text-xs truncate mt-0.5 flex items-center gap-1" style={{ color: th.fg3 }}>
            {lead.profile === "entreprise" ? <Building2 className="w-3 h-3 shrink-0" /> : <User className="w-3 h-3 shrink-0" />}{subtitle}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button onClick={e => e.stopPropagation()} aria-label="Déplacer vers…" title="Déplacer vers…"
              className="w-7 h-7 -mr-1 -mt-1 rounded-[4px] flex items-center justify-center shrink-0 opacity-60 hover:opacity-100" style={{ color: th.fg2 }}>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
            <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
            {STAGES.filter(s => s.id !== lead.pipeline_stage).map(s => (
              <DropdownMenuItem key={s.id} onSelect={() => onMove(s.id)}>
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        <Pill tone="muted">{SOURCES[lead.source] ?? lead.source}</Pill>
        {lead.status === "callback_requested" && <Pill tone="warn" Icon={Phone}>Rappel demandé</Pill>}
        {lead.deal_value ? <Pill tone="done">{euro(lead.deal_value)}</Pill> : null}
      </div>

      {reminder && (
        <p className="mt-2 text-xs font-semibold flex items-center gap-1.5 rounded-[4px] px-2 py-1"
          style={{ background: late ? "rgba(239,138,116,0.14)" : th.navA, color: late ? th.danger : th.fg2 }}>
          <AlarmClock className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{dueLabel(reminder.due_at)} · {reminder.title}</span>
        </p>
      )}

      <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: th.fg3 }}>
        <span title={new Date(lead.created_at).toLocaleString("fr-FR")}>Reçue {ago(lead.created_at)}</span>
        {notes > 0 && <span className="inline-flex items-center gap-1" title={lastContact ? `Dernier échange ${ago(lastContact)}` : undefined}><MessageSquareText className="w-3 h-3" />{notes}</span>}
        <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          {lead.phone && <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} title={`Appeler ${lead.phone}`} className="p-1 rounded-[3px] hover:bg-black/5" style={{ color: th.fg }}><Phone className="w-3.5 h-3.5" /></a>}
          {lead.email && <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} title={`Écrire à ${lead.email}`} className="p-1 rounded-[3px] hover:bg-black/5" style={{ color: th.fg }}><Mail className="w-3.5 h-3.5" /></a>}
        </span>
      </div>
    </article>
  );
}

function RemindersAgenda({ reminders, leadById, onOpen, onDone }: {
  reminders: Reminder[]; leadById: Map<number, Lead>; onOpen: (id: number) => void; onDone: (r: Reminder) => void;
}) {
  const th = useTh();
  const now = new Date();
  const groups: { label: string; tone?: string; items: Reminder[] }[] = [
    { label: "En retard", tone: th.danger, items: reminders.filter(r => isBefore(new Date(r.due_at), now)) },
    { label: "Aujourd’hui", items: reminders.filter(r => !isBefore(new Date(r.due_at), now) && isBefore(new Date(r.due_at), endOfDay(now))) },
    { label: "7 prochains jours", items: reminders.filter(r => !isBefore(new Date(r.due_at), endOfDay(now)) && isBefore(new Date(r.due_at), endOfDay(addDays(now, 7)))) },
    { label: "Plus tard", items: reminders.filter(r => !isBefore(new Date(r.due_at), endOfDay(addDays(now, 7)))) },
  ];
  if (!reminders.length) {
    return <p className="rounded-[10px] border px-6 py-10 text-center text-sm" style={{ borderColor: th.sep, color: th.fg3 }}>
      Aucun rappel planifié. Ouvrez un prospect pour en programmer un.
    </p>;
  }
  return (
    <div className="space-y-6 max-w-3xl">
      {groups.filter(g => g.items.length).map(g => (
        <section key={g.label}>
          <h2 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: g.tone ?? th.fg2 }}>
            {g.label}<span className="tabular-nums">({g.items.length})</span>
          </h2>
          <ul className="rounded-[10px] border divide-y overflow-hidden" style={{ borderColor: th.sep, background: th.card }}>
            {g.items.map(r => {
              const lead = leadById.get(r.lead_id);
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3" style={{ borderColor: th.sep }}>
                  <button onClick={() => onDone(r)} title="Marquer comme fait" aria-label="Marquer comme fait"
                    className="w-5 h-5 rounded-[4px] border shrink-0 flex items-center justify-center hover:opacity-70" style={{ borderColor: th.ink }} />
                  <button onClick={() => onOpen(r.lead_id)} className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-semibold truncate">{r.title}</div>
                    <div className="text-xs truncate" style={{ color: th.fg3 }}>
                      {lead ? `${leadName(lead)}${lead.company ? ` · ${lead.company}` : ""} · ${STAGE_LABEL[lead.pipeline_stage]}` : "Prospect"}
                    </div>
                  </button>
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: g.tone ?? th.fg2 }}>{dueLabel(r.due_at)}</span>
                  {lead?.phone && <a href={`tel:${lead.phone}`} title={`Appeler ${lead.phone}`} className="p-1.5 rounded-[4px] border" style={{ borderColor: th.inputB, color: th.fg }}><Phone className="w-3.5 h-3.5" /></a>}
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
