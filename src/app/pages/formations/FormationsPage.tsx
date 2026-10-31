import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowRight, Building2, ChevronLeft, ChevronRight, FileText, Pencil, Plus, Search, User } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { useStaffBasePath } from "@/app/lib/staffBase";
import { GCard } from "@/app/components/common/GCard";
import { Segmented } from "@/app/components/common/Buttons";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { NewSessionForm } from "@/app/components/sessions/NewSessionForm";
import { GREEN } from "@/app/components/sessions/JourneyView";
import { eur, FINANCEMENT_LABELS, heureFr, periodeFr, totalHt } from "@/app/lib/documents/render";
import type { Financement } from "@/app/lib/documents/types";
import { todayIso, type TrainingSession } from "@/app/lib/trainingSessions";
import { loadFormationsHub, sessionStatus, type FormationsHub, type HubClient } from "@/app/lib/formationsHub";

// Espace « Formations » (staff) : un tableau de bord pour piloter toutes les
// formations, entreprises comme élèves CPF. Score global des dossiers,
// calendrier, dossiers en cours avec leur progression et leur prochaine
// étape, puis l'annuaire des clients pour ouvrir ou créer une formation.

type Filter = "tous" | "entreprise" | "cpf";

const FIN_COLORS: Record<Financement, string> = { entreprise: "#2A78D6", opco: "#1BAF7A", cpf: "#9b6fd6", particulier: "#EB6834" };
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

function MiniRing({ value, size = 52, dark = false }: { value: number; size?: number; dark?: boolean }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke={dark ? "rgba(255,255,255,0.15)" : "rgba(127,127,127,0.18)"} strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={value === 100 ? GREEN : "#2A78D6"} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset 800ms ease" }} />
    </svg>
  );
}

export function FormationsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const staffBase = useStaffBasePath();
  const [hub, setHub] = useState<FormationsHub | null>(null);
  const [filter, setFilter] = useState<Filter>("tous");
  const [query, setQuery] = useState("");
  const [creatingFor, setCreatingFor] = useState<HubClient | null | undefined>(undefined);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [entrepriseOnly, setEntrepriseOnly] = useState(true);

  useEffect(() => {
    loadFormationsHub().then(setHub).catch((err) => { console.error(err); toast.error("Impossible de charger l'espace Formations."); });
  }, []);

  const clients = useMemo(() => {
    if (!hub) return [];
    const q = query.trim().toLowerCase();
    return hub.clients
      .filter((c) => filter === "tous" || c.kind === filter)
      .filter((c) => !q || `${c.name} ${c.studentEmail ?? ""} ${c.detail}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const rank = (c: HubClient) => (c.sessions.some((s) => sessionStatus(s) !== "terminee") ? 0 : c.sessions.length ? 1 : 2);
        return rank(a) - rank(b) || a.name.localeCompare(b.name, "fr");
      });
  }, [hub, filter, query]);

  if (!hub) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>Chargement…</div>;

  const today = todayIso();
  const sessionById = new Map(hub.sessions.map((s) => [s.id, s]));
  const journeyOf = (s: TrainingSession) => hub.journeys[s.id];
  const actives = hub.sessions.filter((s) => sessionStatus(s) !== "terminee" || (journeyOf(s)?.progress ?? 0) < 100);
  const score = actives.length ? Math.round(actives.reduce((sum, s) => sum + (journeyOf(s)?.progress ?? 0), 0) / actives.length) : 100;
  const complets = hub.sessions.filter((s) => journeyOf(s)?.progress === 100).length;
  const signe = (s: TrainingSession) => journeyOf(s)?.steps.some((st) => ["devis", "convention", "contrat-particulier"].includes(st.id) && st.status === "done") ?? false;
  const caSigne = hub.sessions.filter((s) => new Date(s.dateDebut).getFullYear() === new Date().getFullYear() && signe(s))
    .reduce((sum, s) => sum + totalHt(s.lignes), 0);
  const enCours = hub.sessions.filter((s) => sessionStatus(s) === "en_cours").length;
  const aVenir = hub.sessions.filter((s) => sessionStatus(s) === "a_venir").length;
  const level = score >= 90 ? "🏆 Organisme exemplaire" : score >= 70 ? "🏁 Dossiers bien tenus" : score >= 40 ? "🎓 En bonne voie" : "🚀 Au démarrage";

  // Calendrier du mois : chaque jour liste les formations qui s'y déroulent.
  const calSessions = hub.sessions.filter((s) => !entrepriseOnly || s.financement === "entreprise" || s.financement === "opco");
  const first = new Date(month);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + i));
  const upcoming = hub.slots.filter((s) => s.date >= today).slice(0, 7);

  const editFormation = (c: HubClient) => {
    if (c.companyId) navigate(`/entreprise/${c.companyId}`);
    else if (c.activeInstanceId) navigate(`${staffBase}/instances/${c.activeInstanceId}`);
    else if (c.studentId) navigate(`${staffBase}/planning/students/${c.studentId}`);
  };
  const counts = { tous: hub.clients.length, entreprise: hub.clients.filter((c) => c.kind === "entreprise").length, cpf: hub.clients.filter((c) => c.kind === "cpf").length };
  const dossiers = [...actives].sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      {/* Score global et chiffres clés. */}
      <section className="relative overflow-hidden rounded-[12px] bg-black text-white">
        <NeuralField dark density={3.4} band={0.9} />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.6) 55%,rgba(0,0,0,0.15) 100%)" }} />
        <div className="relative p-6 sm:p-8 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="relative w-fit">
            <MiniRing value={score} size={128} dark />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[2.1rem] font-extrabold leading-none tabular-nums">{score}<span className="text-sm text-white/60">%</span></span>
              <span className="text-[10px] text-white/60 mt-1">score Qualiopi</span>
            </div>
          </div>
          <div>
            <p className="eyebrow text-white/55">Espace formations</p>
            <p className="text-[1.7rem] sm:text-[2.2rem] font-extrabold leading-tight mt-1">{level}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { label: "en cours", value: enCours, emoji: "🔥" },
                { label: "à venir", value: aVenir, emoji: "📅" },
                { label: "dossiers complets", value: complets, emoji: "🏆" },
                { label: "à signer", value: hub.pendingSignatures.length, emoji: "✍️" },
              ].map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-white/10">
                  <span>{b.emoji}</span><span className="font-bold tabular-nums">{b.value}</span><span className="text-white/65">{b.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="lg:text-right space-y-3">
            <div>
              <p className="text-xs text-white/55">Signé en {new Date().getFullYear()}</p>
              <p className="text-[1.8rem] font-extrabold leading-none tabular-nums mt-1">{eur(caSigne)}</p>
            </div>
            <div className="flex gap-2 lg:justify-end flex-wrap">
              {isAdmin(role) && (
                <Link to="/formations/modeles" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 min-h-9 rounded-[2px] border border-white/30 hover:bg-white/10">
                  <FileText className="w-3.5 h-3.5" />Modèles
                </Link>
              )}
              <button type="button" onClick={() => setCreatingFor(null)} className="sweep inline-flex items-center gap-1.5 text-sm font-semibold px-4 min-h-9 rounded-[2px] bg-white text-black">
                <Plus className="w-4 h-4" />Nouvelle formation
              </button>
            </div>
          </div>
        </div>
      </section>

      {creatingFor !== undefined && (
        <NewSessionForm key={creatingFor?.key ?? "new"} clients={hub.clients} sessions={hub.sessions} initial={creatingFor} onCancel={() => setCreatingFor(undefined)} />
      )}

      {/* Calendrier et agenda. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <GCard><div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <p className="text-lg font-black mr-auto" style={{ color: th.fg }}>{MOIS[month.getMonth()]} {month.getFullYear()}</p>
            <Segmented value={entrepriseOnly ? "ent" : "tout"} onChange={(v) => setEntrepriseOnly(v === "ent")}
              options={[{ value: "ent", label: "Entreprises" }, { value: "tout", label: "Toutes" }]} />
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}><ChevronLeft className="w-4 h-4" /></button>
            <button type="button" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="text-xs font-bold px-3 h-9 rounded-full hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>Aujourd'hui</button>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {JOURS.map((j) => <p key={j} className="text-[11px] font-bold text-center pb-1" style={{ color: th.fg3 }}>{j}</p>)}
            {days.map((d) => {
              const key = iso(d);
              const inMonth = d.getMonth() === month.getMonth();
              const isToday = key === today;
              const daySessions = calSessions.filter((s) => s.dateDebut <= key && key <= s.dateFin);
              const hasSlot = hub.slots.some((sl) => sl.date === key && daySessions.some((s) => s.id === sl.sessionId));
              return (
                <div key={key} className="min-h-[86px] rounded-[6px] p-1.5 flex flex-col gap-1"
                  style={{ background: inMonth ? th.navA : "transparent", outline: isToday ? `2px solid ${th.ink}` : undefined, opacity: inMonth ? 1 : 0.4 }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: isToday ? th.fg : th.fg2 }}>{d.getDate()}</span>
                    {hasSlot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: th.ink }} title="Séance ce jour" />}
                  </div>
                  {daySessions.slice(0, 3).map((s) => (
                    <button key={s.id} type="button" onClick={() => navigate(`/formations/sessions/${s.id}`)} title={`${s.client.nom} · ${s.formation.intitule}`}
                      className="text-left text-[10.5px] font-semibold leading-tight rounded-[3px] px-1.5 py-1 truncate text-white hover:brightness-110"
                      style={{ background: FIN_COLORS[s.financement] }}>
                      {s.client.nom}
                    </button>
                  ))}
                  {daySessions.length > 3 && <span className="text-[10px]" style={{ color: th.fg3 }}>+{daySessions.length - 3}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 flex-wrap mt-3">
            {(Object.keys(FIN_COLORS) as Financement[]).filter((f) => !entrepriseOnly || f === "entreprise" || f === "opco").map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: th.fg3 }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: FIN_COLORS[f] }} />{FINANCEMENT_LABELS[f]}
              </span>
            ))}
          </div>
        </div></GCard>

        <aside className="space-y-4">
          <GCard><div className="p-4 space-y-2">
            <p className="text-sm font-black" style={{ color: th.fg }}>Prochaines séances</p>
            {!upcoming.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucune séance planifiée.</p>}
            {upcoming.map((slot) => {
              const s = sessionById.get(slot.sessionId);
              const d = daysBetween(today, slot.date);
              return (
                <Link key={slot.id} to={`/formations/sessions/${slot.sessionId}`} className="flex items-center gap-3 py-1.5 hover:opacity-80" style={{ borderBottom: `1px solid ${th.sep}` }}>
                  <span className="w-11 shrink-0 text-center rounded-[6px] py-1" style={{ background: d === 0 ? th.ink : th.navA, color: d === 0 ? th.onInk : th.fg }}>
                    <span className="block text-[10px] font-bold uppercase">{new Date(`${slot.date}T12:00:00`).toLocaleDateString("fr-FR", { month: "short" })}</span>
                    <span className="block text-base font-black leading-none">{Number(slot.date.slice(8))}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold truncate" style={{ color: th.fg }}>{s?.client.nom}</span>
                    <span className="block text-[11px]" style={{ color: th.fg3 }}>{d === 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `Dans ${d} jours`} · {heureFr(slot.debut)}–{heureFr(slot.fin)}</span>
                  </span>
                </Link>
              );
            })}
          </div></GCard>
          <GCard><div className="p-4 space-y-2">
            <p className="text-sm font-black" style={{ color: th.fg }}>✍️ En attente de signature</p>
            {!hub.pendingSignatures.length && <p className="text-xs" style={{ color: th.fg3 }}>Tout est signé.</p>}
            {hub.pendingSignatures.slice(0, 6).map((d) => (
              <Link key={d.documentId} to={`/formations/sessions/${d.sessionId}`} className="block py-1.5 hover:opacity-80" style={{ borderBottom: `1px solid ${th.sep}` }}>
                <p className="text-xs font-bold truncate" style={{ color: th.fg }}>{d.title.split(" · ")[0]} · {sessionById.get(d.sessionId)?.client.nom}</p>
                <p className="text-[11px]" style={{ color: th.fg3 }}>Envoyé il y a {Math.max(daysBetween(d.issuedAt.slice(0, 10), today), 0)} j</p>
              </Link>
            ))}
          </div></GCard>
        </aside>
      </div>

      {/* Dossiers en cours : progression et prochaine étape. */}
      <section>
        <div className="flex items-baseline gap-3 mb-3">
          <p className="text-lg font-black" style={{ color: th.fg }}>Dossiers en cours</p>
          <p className="text-xs" style={{ color: th.fg3 }}>{dossiers.length} formation{dossiers.length > 1 ? "s" : ""}</p>
        </div>
        {!dossiers.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucune formation en cours. Créez-en une pour commencer.</div></GCard>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {dossiers.map((s) => {
            const j = journeyOf(s);
            const status = sessionStatus(s);
            const d = daysBetween(today, s.dateDebut);
            const badge = status === "en_cours" ? "En cours" : status === "a_venir" ? (d === 0 ? "Aujourd'hui" : `J-${d}`) : "À clôturer";
            return (
              <Link key={s.id} to={`/formations/sessions/${s.id}`} className="block transition-transform hover:-translate-y-0.5">
                <GCard><div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <MiniRing value={j?.progress ?? 0} />
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums" style={{ color: th.fg }}>{j?.progress ?? 0}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: th.fg }}>{s.client.nom}</p>
                      <p className="text-xs truncate" style={{ color: th.fg3 }}>{s.formation.intitule}</p>
                      <p className="text-[11px] mt-1" style={{ color: th.fg2 }}>{j?.level.emoji} {j?.level.label}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 text-white" style={{ background: FIN_COLORS[s.financement] }}>{badge}</span>
                  </div>
                  <div className="flex gap-1">
                    {j?.steps.map((st) => (
                      <span key={st.id} title={st.titre} className="h-1.5 flex-1 rounded-full"
                        style={{ background: st.status === "done" ? GREEN : st.status === "current" ? th.ink : th.navA }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs rounded-[6px] px-3 py-2" style={{ background: th.navA }}>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: th.fg }} />
                    <span className="truncate" style={{ color: th.fg }}>
                      {j?.next ? <><strong>{j.next.titre}</strong>{j.next.missing.length ? ` · ${j.next.missing.length} à compléter` : j.next.actions[0] ? ` · ${j.next.actions[0].label}` : ""}</> : "Dossier complet 🏆"}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: th.fg3 }}>{periodeFr(s.dateDebut, s.dateFin)} · {FINANCEMENT_LABELS[s.financement]}</p>
                </div></GCard>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Annuaire des clients. */}
      <section className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-lg font-black mr-2" style={{ color: th.fg }}>Clients</p>
          <Segmented value={filter} onChange={(v) => setFilter(v as Filter)} options={[
            { value: "tous", label: `Tous (${counts.tous})` },
            { value: "entreprise", label: `Entreprises (${counts.entreprise})` },
            { value: "cpf", label: `Élèves CPF (${counts.cpf})` },
          ]} />
          <label className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: th.fg3 }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un client"
              className="w-full rounded-[4px] pl-9 pr-3 py-2 text-sm g-input" />
          </label>
        </div>
        {!clients.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucun client.</div></GCard>}
        <div className="grid gap-2 lg:grid-cols-2">
          {clients.map((c) => {
            const Icon = c.kind === "entreprise" ? Building2 : User;
            const canEdit = !!(c.companyId || c.studentId);
            const last = c.sessions[0];
            const j = last ? journeyOf(last) : null;
            return (
              <GCard key={c.key}><div className="p-3.5 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: th.navA, color: th.fg }}><Icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: th.fg }}>{c.name}</p>
                  <p className="text-xs truncate" style={{ color: th.fg3 }}>
                    {c.kind === "entreprise" ? "Entreprise" : "Élève CPF"} · {c.sessions.length ? `${c.sessions.length} formation${c.sessions.length > 1 ? "s" : ""}${j ? ` · ${j.progress} %` : ""}` : c.detail}
                  </p>
                </div>
                {last && (
                  <Link to={`/formations/sessions/${last.id}`} className="text-xs font-bold px-3 py-2 rounded-[2px] hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>Dossier</Link>
                )}
                {canEdit && (
                  <button type="button" onClick={() => editFormation(c)} title={c.kind === "entreprise" ? "Backoffice entreprise" : "Modifier la formation"}
                    className="w-9 h-9 rounded-[2px] flex items-center justify-center hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {canEdit && (
                  <button type="button" onClick={() => { setCreatingFor(c); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="Nouvelle formation"
                    className="w-9 h-9 rounded-[2px] flex items-center justify-center hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div></GCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
