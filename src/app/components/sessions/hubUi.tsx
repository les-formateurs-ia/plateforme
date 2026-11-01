import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GREEN } from "@/app/components/sessions/JourneyView";
import { FINANCEMENT_LABELS, heureFr } from "@/app/lib/documents/render";
import type { Financement } from "@/app/lib/documents/types";
import { todayIso, type TrainingSession } from "@/app/lib/trainingSessions";
import type { HubSlot } from "@/app/lib/formationsHub";

// Briques partagées par le tableau de bord de l'équipe et la page Sessions.

export const FIN_COLORS: Record<Financement, string> = { entreprise: "#2A78D6", opco: "#1BAF7A", cpf: "#9b6fd6", particulier: "#EB6834" };
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function MiniRing({ value, size = 52, dark = false }: { value: number; size?: number; dark?: boolean }) {
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

export function FinancementLegend({ only }: { only?: Financement[] }) {
  const th = useTh();
  return (
    <div className="flex gap-4 flex-wrap">
      {(Object.keys(FIN_COLORS) as Financement[]).filter((f) => !only || only.includes(f)).map((f) => (
        <span key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: th.fg3 }}>
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: FIN_COLORS[f] }} />{FINANCEMENT_LABELS[f]}
        </span>
      ))}
    </div>
  );
}

// Calendrier du mois : chaque jour liste les sessions qui s'y déroulent.
export function SessionsCalendar({ sessions, slots, actions }: { sessions: TrainingSession[]; slots: HubSlot[]; actions?: React.ReactNode }) {
  const th = useTh();
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const today = todayIso();
  const offset = (new Date(month).getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + i));
  const navBtn = { border: `1px solid ${th.sep}`, color: th.fg };
  return (
    <GCard><div className="p-4 sm:p-5">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <p className="text-lg font-black mr-auto" style={{ color: th.fg }}>{MOIS[month.getMonth()]} {month.getFullYear()}</p>
        {actions}
        <button type="button" aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70" style={navBtn}><ChevronLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="text-xs font-bold px-3 h-9 rounded-full hover:opacity-70" style={navBtn}>Aujourd'hui</button>
        <button type="button" aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-70" style={navBtn}><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {JOURS.map((j) => <p key={j} className="text-[11px] font-bold text-center pb-1" style={{ color: th.fg3 }}>{j}</p>)}
        {days.map((d) => {
          const key = iso(d);
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = key === today;
          const daySessions = sessions.filter((s) => s.dateDebut <= key && key <= s.dateFin);
          const hasSlot = slots.some((sl) => sl.date === key && daySessions.some((s) => s.id === sl.sessionId));
          return (
            <div key={key} className="min-h-[86px] rounded-[6px] p-1.5 flex flex-col gap-1"
              style={{ background: inMonth ? th.navA : "transparent", outline: isToday ? `2px solid ${th.ink}` : undefined, opacity: inMonth ? 1 : 0.4 }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tabular-nums" style={{ color: isToday ? th.fg : th.fg2 }}>{d.getDate()}</span>
                {hasSlot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: th.ink }} title="Séance ce jour" />}
              </div>
              {daySessions.slice(0, 3).map((s) => (
                <button key={s.id} type="button" onClick={() => navigate(`/sessions/${s.id}`)} title={`${s.client.nom} · ${s.formation.intitule}`}
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
      <div className="mt-3"><FinancementLegend /></div>
    </div></GCard>
  );
}

export function UpcomingSlotsCard({ slots, sessions, limit = 7 }: { slots: HubSlot[]; sessions: TrainingSession[]; limit?: number }) {
  const th = useTh();
  const today = todayIso();
  const byId = new Map(sessions.map((s) => [s.id, s]));
  const upcoming = slots.filter((s) => s.date >= today && byId.has(s.sessionId)).slice(0, limit);
  return (
    <GCard><div className="p-4 space-y-2">
      <p className="text-sm font-black" style={{ color: th.fg }}>Prochaines séances</p>
      {!upcoming.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucune séance planifiée.</p>}
      {upcoming.map((slot) => {
        const s = byId.get(slot.sessionId);
        const d = daysBetween(today, slot.date);
        return (
          <Link key={slot.id} to={`/sessions/${slot.sessionId}`} className="flex items-center gap-3 py-1.5 hover:opacity-80" style={{ borderBottom: `1px solid ${th.sep}` }}>
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
  );
}
