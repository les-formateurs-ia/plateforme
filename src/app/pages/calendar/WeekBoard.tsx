import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { addDays, toISODate, firstBookableDate, type ExpertAvailableSlot, type StudentBooking } from "@/app/lib/availability";

// Disponibilités du formateur, semaine par semaine : les jours côte à côte,
// les heures de début empilées sous chaque jour (un rendez-vous dure environ
// 1 h, inutile d'afficher la fin). Lundi → vendredi, plus le week-end s'il a
// des créneaux. Sur mobile, les colonnes défilent horizontalement.
export function WeekBoard({ slots, activeBooking, onPick }: {
  slots: ExpertAvailableSlot[]; activeBooking: StudentBooking | null; onPick: (slot: ExpertAvailableSlot) => void;
}) {
  const th = useTh();
  const firstDay = toISODate(firstBookableDate());

  const byDay = useMemo(() => {
    const map = new Map<string, ExpertAvailableSlot[]>();
    for (const s of slots) map.set(s.slotDate, [...(map.get(s.slotDate) ?? []), s]);
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [slots]);

  // Semaines (lundi) couvrant la fenêtre de réservation ; on ouvre sur la
  // première qui a au moins un créneau.
  const weeks = useMemo(() => {
    const start = mondayOf(firstBookableDate());
    const last = slots.reduce((m, s) => (s.slotDate > m ? s.slotDate : m), toISODate(addDays(start, 6)));
    const list: Date[] = [];
    for (let w = start; toISODate(w) <= last; w = addDays(w, 7)) list.push(w);
    return list;
  }, [slots]);
  const firstWithSlots = Math.max(0, weeks.findIndex((w) => weekDays(w).some((d) => byDay.has(toISODate(d)))));
  const [index, setIndex] = useState<number | null>(null);
  // Les créneaux tombent au quart d'heure : au-delà de MAX par jour, on replie.
  const [expanded, setExpanded] = useState(false);
  const week = Math.min(index ?? firstWithSlots, Math.max(0, weeks.length - 1));
  const monday = weeks[week] ?? mondayOf(firstBookableDate());
  // Jours passés (avant demain) retirés ; week-end seulement s'il a des créneaux.
  const days = weekDays(monday).filter((d, i) => toISODate(d) >= firstDay && (i < 5 || byDay.has(toISODate(d))));
  const weekCount = days.reduce((n, d) => n + (byDay.get(toISODate(d))?.length ?? 0), 0);
  const overflow = days.some((d) => (byDay.get(toISODate(d))?.length ?? 0) > MAX_PER_DAY);

  if (!slots.length) {
    return (
      <div className="rounded-[10px] p-8 text-center" style={{ border: `1px dashed ${th.inputB}` }}>
        <p className="text-[15px] font-bold" style={{ color: th.fg }}>Aucun créneau pour l'instant</p>
        <p className="mt-1 text-sm" style={{ color: th.fg2 }}>Ton formateur n'a pas encore ouvert de disponibilités sur les trois prochaines semaines. Reviens bientôt.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] overflow-hidden" style={{ border: `1px solid ${th.sep}` }}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
        <div>
          <p className="text-[15px] font-bold first-letter:uppercase" style={{ color: th.fg }}>{weekLabel(monday)}</p>
          <p className="text-xs mt-0.5" style={{ color: th.fg3 }}>{weekCount ? `${weekCount} créneau${weekCount > 1 ? "x" : ""} disponible${weekCount > 1 ? "s" : ""}` : "Aucun créneau cette semaine"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Semaine précédente" disabled={week === 0} onClick={() => setIndex(week - 1)}
            className="w-9 h-9 rounded-[4px] flex items-center justify-center transition-colors hover-fine:enabled:[border-color:var(--ink)]! disabled:opacity-30" style={{ border: `1px solid ${th.inputB}`, color: th.fg }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Semaine suivante" disabled={week >= weeks.length - 1} onClick={() => setIndex(week + 1)}
            className="w-9 h-9 rounded-[4px] flex items-center justify-center transition-colors hover-fine:enabled:[border-color:var(--ink)]! disabled:opacity-30" style={{ border: `1px solid ${th.inputB}`, color: th.fg }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto snap-x">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(104px, 1fr))`, minWidth: days.length * 104 }}>
          {days.map((d, i) => {
            const iso = toISODate(d);
            const list = byDay.get(iso) ?? [];
            const past = iso < firstDay;
            const mine = activeBooking && activeBooking.slotDate === iso ? activeBooking.startTime : null;
            return (
              <div key={iso} className="snap-start flex flex-col" style={{ borderLeft: i ? `1px solid ${th.sep}` : undefined }}>
                <div className="px-3 pt-4 pb-3 text-center" style={{ borderBottom: `1px solid ${th.sep}` }}>
                  <p className="eyebrow" style={{ color: past ? th.fg3 : th.fg2 }}>{d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}</p>
                  <p className="mt-1 text-[1.6rem] leading-none font-black tabular-nums" style={{ color: past ? th.fg3 : th.fg }}>{d.getDate()}</p>
                  <p className="mt-1 text-[11px]" style={{ color: th.fg3 }}>{d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}</p>
                </div>
                <div className="flex-1 p-2.5 min-h-[132px]">
                  {mine && (
                    <span className="block w-full mb-2 rounded-[4px] py-2 text-center text-sm font-bold tabular-nums" style={{ background: th.ink, color: th.onInk }}>
                      {mine}<span className="block text-[10px] font-semibold uppercase tracking-[0.06em] opacity-70">Ton rendez-vous</span>
                    </span>
                  )}
                  {(() => {
                    const free = list.filter((s) => s.startTime !== mine);
                    // Replié : la moitié du quota pour le matin, l'autre pour l'après-midi
                    // (le reste du quota passe à l'autre moitié si l'une est courte).
                    const am = free.filter((s) => s.startTime < "12:00"), pm = free.filter((s) => s.startTime >= "12:00");
                    const half = MAX_PER_DAY / 2;
                    const amN = expanded ? am.length : Math.min(am.length, Math.max(half, MAX_PER_DAY - pm.length));
                    const pmN = expanded ? pm.length : Math.min(pm.length, MAX_PER_DAY - amN);
                    const groups = [
                      { label: "Matin", items: am.slice(0, amN) },
                      { label: "Après-midi", items: pm.slice(0, pmN) },
                    ].filter((g) => g.items.length);
                    if (!free.length && !mine) return <p className="pt-6 text-center text-sm" style={{ color: th.fg3 }} aria-label="Aucun créneau">—</p>;
                    return groups.map((g) => (
                      <div key={g.label} className="mb-2 last:mb-0">
                        {groups.length > 1 && <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-center mb-1.5 mt-1" style={{ color: th.fg3 }}>{g.label}</p>}
                        <ul className="space-y-1.5">
                          {g.items.map((s) => (
                            <li key={s.startTime}>
                              <button type="button" onClick={() => onPick(s)} aria-label={`Réserver le ${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${s.startTime}`}
                                className="slot-btn w-full h-9 rounded-[4px] text-center text-sm font-bold tabular-nums transition-colors"
                                style={{ border: `1px solid ${th.inputB}`, color: th.fg, ["--slot-hover" as string]: th.ink, ["--slot-hover-fg" as string]: th.onInk }}>
                                {s.startTime}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ));
                  })()}
                  {!expanded && list.length > MAX_PER_DAY && (
                    <p className="mt-2 text-center text-[11px]" style={{ color: th.fg3 }}>+{list.length - MAX_PER_DAY} autre{list.length - MAX_PER_DAY > 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {overflow && (
        <div className="px-4 py-3 text-center" style={{ borderTop: `1px solid ${th.sep}` }}>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="ink-link text-sm font-semibold" style={{ color: th.fg }}>
            {expanded ? "Afficher moins d'horaires" : "Afficher tous les horaires"}
          </button>
        </div>
      )}
    </div>
  );
}

const MAX_PER_DAY = 8;

function mondayOf(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return addDays(d, -((d.getDay() + 6) % 7));
}

function weekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function weekLabel(monday: Date) {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const from = monday.toLocaleDateString("fr-FR", { day: "numeric", month: sameMonth ? undefined : "long" });
  const to = sunday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return `Semaine du ${from} au ${to}`;
}
