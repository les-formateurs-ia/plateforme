import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarClock, User, CalendarCog } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import {
  listMyAvailability, saveAvailability, listMyBookingsAsFormateur, cancelRdvAsFormateur, proposeReschedule,
  toISODate, addDays, addMinutes, SESSION_MINUTES, type FormateurBooking,
} from "@/app/lib/availability";

const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_MINUTES = 15;

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let mins = START_HOUR * 60; mins < END_HOUR * 60; mins += SLOT_MINUTES) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day; // ramène au lundi
  return addDays(copy, diff);
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function tomorrowISO(): string {
  return toISODate(addDays(new Date(), 1));
}

export function AdminAvailabilityPage() {
  const th = useTh();
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [bookings, setBookings] = useState<FormateurBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [proposingId, setProposingId] = useState<string | null>(null);
  const [proposalDraft, setProposalDraft] = useState({ date: tomorrowISO(), time: "09:00" });
  const [sendingProposal, setSendingProposal] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = days[6];

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const keys = await listMyAvailability(user.id, toISODate(weekStart), toISODate(weekEnd));
      setSelected(new Set(keys));
      setDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger vos disponibilités.");
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      setBookings(await listMyBookingsAsFormateur(user.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger vos rendez-vous.");
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => { void load(); }, [user, weekStart]);
  useEffect(() => { void loadBookings(); }, [user]);

  // Toutes les cases de 15 min couvertes par une session confirmée d'1h,
  // pas seulement son heure de début, pour bien griser le bloc complet.
  const bookedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.status !== "confirmed") continue;
      for (let m = 0; m < SESSION_MINUTES; m += SLOT_MINUTES) {
        set.add(`${b.slotDate}_${addMinutes(b.startTime, m)}`);
      }
    }
    return set;
  }, [bookings]);

  const toggle = (key: string) => {
    if (bookedKeys.has(key)) return; // créneau déjà réservé, non modifiable ici
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveAvailability(user.id, toISODate(weekStart), toISODate(weekEnd), Array.from(selected));
      toast.success("Disponibilités enregistrées.");
      setDirty(false);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (b: FormateurBooking) => {
    if (!user) return;
    if (!window.confirm(`Annuler le rendez-vous avec ${b.studentName} ? L'élève sera prévenu et pourra reprendre un nouveau créneau.`)) return;
    try {
      await cancelRdvAsFormateur(b.id, user.id, b.studentId, b.slotDate, b.startTime);
      toast.success("Rendez-vous annulé, l'élève a été prévenu.");
      void loadBookings();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'annuler.");
    }
  };

  const openProposal = (b: FormateurBooking) => {
    setProposingId(proposingId === b.id ? null : b.id);
    setProposalDraft({ date: tomorrowISO(), time: "09:00" });
  };

  const sendProposal = async (b: FormateurBooking) => {
    if (!user) return;
    setSendingProposal(true);
    try {
      await proposeReschedule(b.id, user.id, b.studentId, proposalDraft.date, proposalDraft.time);
      toast.success("Nouveau créneau proposé à l'élève.");
      setProposingId(null);
      void loadBookings();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer la proposition.");
    } finally {
      setSendingProposal(false);
    }
  };

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" && b.slotDate >= toISODate(new Date()));

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Rendez-vous</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Déclare tes disponibilités, les élèves réservent directement dessus.</p>
      </div>

      <GCard>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4" style={{ color: th.navAC }} />
              <h3 className="text-sm font-black" style={{ color: th.fg }}>Mes disponibilités</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold min-w-[150px] text-center" style={{ color: th.fg2 }}>
                {weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – {weekEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs mb-4" style={{ color: th.fg3 }}>
            Clique sur les créneaux de 15 min où tu es disponible, puis enregistre. Une session réservée dure 1h. Les créneaux grisés sont déjà pris par un élève.
          </p>

          {loading ? (
            <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: "64px repeat(7, 1fr)", background: th.card }}>
                  <div />
                  {days.map((d) => (
                    <div key={d.toISOString()} className="text-center py-2">
                      <div className="text-[10px] font-black uppercase tracking-wide" style={{ color: th.fg3 }}>{DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
                      <div className="text-xs font-bold" style={{ color: th.fg }}>{d.getDate()}</div>
                    </div>
                  ))}
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
                      <div className="text-[10px] font-semibold pr-2 text-right py-1" style={{ color: th.fg3 }}>{time.endsWith(":00") ? time : ""}</div>
                      {days.map((d) => {
                        const key = `${toISODate(d)}_${time}`;
                        const isBooked = bookedKeys.has(key);
                        const isSelected = selected.has(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggle(key)}
                            title={isBooked ? "Réservé par un élève" : undefined}
                            className="h-4 border transition-colors"
                            style={{
                              borderColor: th.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                              background: isBooked ? "rgba(148,163,184,0.35)" : isSelected ? "linear-gradient(135deg,#b58de0,#dbacf0)" : "transparent",
                              cursor: isBooked ? "not-allowed" : "pointer",
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <ShimBtn sm onClick={save} disabled={saving || !dirty}>{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
          </div>
        </div>
      </GCard>

      <GCard>
        <div className="p-5">
          <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Rendez-vous à venir</h3>
          {loadingBookings && <p className="text-xs" style={{ color: th.fg3 }}>Chargement…</p>}
          {!loadingBookings && upcomingBookings.length === 0 && (
            <p className="text-xs" style={{ color: th.fg3 }}>Aucun rendez-vous à venir.</p>
          )}
          <div className="space-y-2">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="rounded-xl px-4 py-3" style={{ border: `1px solid ${th.sep}` }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <User className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{b.studentName}</div>
                      <div className="text-xs truncate" style={{ color: th.fg3 }}>
                        {new Date(`${b.slotDate}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {b.startTime}–{b.endTime}
                      </div>
                      {b.proposedDate && (
                        <div className="text-[11px] mt-1 font-semibold" style={{ color: "#fbc2ad" }}>
                          Proposition envoyée : {b.proposedDate} à {b.proposedStartTime} (en attente de réponse)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <VBtn sm onClick={() => openProposal(b)}><span className="flex items-center gap-1.5"><CalendarCog className="w-3.5 h-3.5" />Proposer un autre créneau</span></VBtn>
                    <VBtn sm onClick={() => handleCancel(b)}>Annuler</VBtn>
                  </div>
                </div>

                {proposingId === b.id && (
                  <div className="mt-3 pt-3 flex items-end gap-2 flex-wrap" style={{ borderTop: `1px solid ${th.sep}` }}>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: th.fg3 }}>Nouvelle date</label>
                      <input type="date" min={tomorrowISO()} value={proposalDraft.date} onChange={(e) => setProposalDraft((d) => ({ ...d, date: e.target.value }))} className="rounded-xl px-3 py-2 text-sm g-input" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: th.fg3 }}>Heure de début</label>
                      <input type="time" step={900} value={proposalDraft.time} onChange={(e) => setProposalDraft((d) => ({ ...d, time: e.target.value }))} className="rounded-xl px-3 py-2 text-sm g-input" />
                    </div>
                    <ShimBtn sm onClick={() => sendProposal(b)} disabled={sendingProposal}>{sendingProposal ? "Envoi…" : "Envoyer la proposition"}</ShimBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </GCard>
    </div>
  );
}
