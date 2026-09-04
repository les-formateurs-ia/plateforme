import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, XCircle, RefreshCw, Check, X as XIcon, Video, ClipboardList } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { SuccessCheck } from "@/app/components/common/SuccessCheck";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import {
  listAvailableSlotsForBooking, listMyBookingsAsStudent, bookSlot, changeBooking, cancelBooking, syncMeetEvent,
  acceptReschedule, declineReschedule, getAssignedFormateurId, getFormateurName,
  toISODate, addDays, firstBookableDate, type ExpertAvailableSlot, type StudentBooking,
} from "@/app/lib/availability";

const BOOKING_WINDOW_DAYS = 21;

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function CalendarPage() {
  const th = useTh();
  const { user } = useAuth();
  const [assignedFormateurId, setAssignedFormateurId] = useState<string | null>(null);
  const [formateurName, setFormateurName] = useState("");
  const [checkedAssignment, setCheckedAssignment] = useState(false);
  const [slots, setSlots] = useState<ExpertAvailableSlot[]>([]);
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ExpertAvailableSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [justBooked, setJustBooked] = useState<{ date: string; start: string; end: string } | null>(null);
  const [respondingToProposal, setRespondingToProposal] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const formateurId = await getAssignedFormateurId(user.id);
      setAssignedFormateurId(formateurId);
      setCheckedAssignment(true);

      const myBookings = await listMyBookingsAsStudent(user.id);
      setBookings(myBookings);

      if (formateurId) {
        const from = firstBookableDate();
        const to = addDays(from, BOOKING_WINDOW_DAYS);
        const [availableSlots, name] = await Promise.all([
          listAvailableSlotsForBooking(formateurId, toISODate(from), toISODate(to)),
          getFormateurName(formateurId),
        ]);
        setSlots(availableSlots);
        setFormateurName(name);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger le planning.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user]);

  const today = toISODate(new Date());
  const activeBooking = bookings.find((b) => b.status === "confirmed" && b.slotDate >= today) ?? null;
  const pastBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" && b.slotDate < today).sort((a, b) => (b.slotDate + b.startTime).localeCompare(a.slotDate + a.startTime)),
    [bookings, today],
  );

  // Retry silencieux : si la réservation active n'a pas encore de lien Meet
  // (formateur pas encore connecté à Google au moment de la réservation,
  // erreur passagère…), on retente à chaque chargement de la page.
  useEffect(() => {
    if (activeBooking && !activeBooking.meetLink) void syncMeetEvent(activeBooking.id);
  }, [activeBooking?.id, activeBooking?.meetLink]);

  const byDay = useMemo(() => {
    const map = new Map<string, ExpertAvailableSlot[]>();
    for (const s of slots) {
      if (!map.has(s.slotDate)) map.set(s.slotDate, []);
      map.get(s.slotDate)!.push(s);
    }
    return map;
  }, [slots]);

  const confirmBooking = async () => {
    if (!user || !pending) return;
    setBooking(true);
    try {
      if (activeBooking) {
        await changeBooking(activeBooking.id, user.id, pending.formateurId, pending.slotDate, pending.startTime);
      } else {
        await bookSlot(user.id, pending.formateurId, pending.slotDate, pending.startTime);
      }
      setJustBooked({ date: pending.slotDate, start: pending.startTime, end: pending.endTime });
      setPending(null);
      void load();
    } catch (err) {
      console.error(err);
      toast.error("Ce créneau vient d'être pris ou n'est plus disponible, choisis-en un autre.");
      setPending(null);
      void load();
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (booking: StudentBooking) => {
    if (!user) return;
    try {
      await cancelBooking(booking.id, booking.formateurId, user.id, booking.slotDate, booking.startTime);
      toast.success("Rendez-vous annulé.");
      void load();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'annuler.");
    }
  };

  const respondToProposal = async (accept: boolean) => {
    if (!activeBooking || !activeBooking.proposedDate || !activeBooking.proposedStartTime || !activeBooking.proposedEndTime) return;
    setRespondingToProposal(true);
    try {
      if (accept) {
        await acceptReschedule(activeBooking.id, activeBooking.formateurId, activeBooking.proposedDate, activeBooking.proposedStartTime, activeBooking.proposedEndTime);
        toast.success("Nouveau créneau confirmé !");
      } else {
        await declineReschedule(activeBooking.id, activeBooking.formateurId);
        toast.success("Proposition refusée, votre rendez-vous initial est conservé.");
      }
      void load();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'enregistrer votre réponse.");
    } finally {
      setRespondingToProposal(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm" style={{ color: th.fg3 }}>Chargement…</span></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Rendez-vous</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Réserve un échange 1h avec ton expert — à partir de demain.</p>
      </div>

      {checkedAssignment && !assignedFormateurId && (
        <GCard><div className="p-8 text-center"><p className="text-sm" style={{ color: th.fg3 }}>Aucun formateur ne vous a encore été attribué — revenez un peu plus tard.</p></div></GCard>
      )}

      {activeBooking?.proposedDate && (
        <GCard accent>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4" style={{ color: th.navAC }} />
              <h3 className="text-sm font-black" style={{ color: th.fg }}>Votre formateur propose un nouveau créneau</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: th.fg3 }}>
              Déplacer votre rendez-vous du {formatDay(activeBooking.slotDate)} ({activeBooking.startTime}–{activeBooking.endTime}) au{" "}
              <strong style={{ color: th.fg }}>{formatDay(activeBooking.proposedDate)} de {activeBooking.proposedStartTime} à {activeBooking.proposedEndTime}</strong> ?
            </p>
            <div className="flex items-center gap-2">
              <ShimBtn sm onClick={() => respondToProposal(true)} disabled={respondingToProposal}><span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />Accepter</span></ShimBtn>
              <VBtn sm onClick={() => respondToProposal(false)} disabled={respondingToProposal}><span className="flex items-center gap-1.5"><XIcon className="w-3.5 h-3.5" />Refuser</span></VBtn>
            </div>
          </div>
        </GCard>
      )}

      {assignedFormateurId && (
        <GCard>
          <div className="p-5">
            <h3 className="text-sm font-black mb-1" style={{ color: th.fg }}>
              Disponibilités de votre expert {formateurName}
            </h3>
            {activeBooking && (
              <p className="text-xs mb-4" style={{ color: th.fg3 }}>
                Vous avez déjà un rendez-vous confirmé — choisissez un créneau ci-dessous pour le déplacer (vous ne pouvez en avoir qu'un seul à la fois).
              </p>
            )}
            {byDay.size === 0 && (
              <p className="text-xs mt-2" style={{ color: th.fg3 }}>Aucun créneau disponible pour l'instant.</p>
            )}
            <div className="space-y-4 mt-3">
              {[...byDay.entries()].map(([date, daySlots]) => (
                <div key={date}>
                  <div className="text-xs font-bold capitalize mb-2" style={{ color: th.fg2 }}>{formatDay(date)}</div>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((s) => (
                      <button
                        key={s.startTime}
                        onClick={() => setPending(s)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                        style={{ border: `1px solid ${th.navAC}`, color: th.navAC }}
                      >
                        {s.startTime}–{s.endTime}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GCard>
      )}

      <GCard><div className="p-5">
        <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Mes rendez-vous</h3>
        {!activeBooking && (
          <p className="text-xs" style={{ color: th.fg3 }}>Aucun rendez-vous prévu pour l'instant.</p>
        )}
        {activeBooking && (
          <div className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ border: `1px solid ${th.sep}` }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: th.fg }}>{activeBooking.formateurName}</div>
              <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: th.fg3 }}>
                <CalendarIcon className="w-3.5 h-3.5" style={{ color: th.navAC }} />
                {formatDay(activeBooking.slotDate)} · {activeBooking.startTime}–{activeBooking.endTime}
              </div>
              {activeBooking.meetLink && (
                <a href={activeBooking.meetLink} target="_blank" rel="noreferrer" className="text-xs mt-1.5 flex items-center gap-1.5 font-semibold hover:opacity-80" style={{ color: th.navAC }}>
                  <Video className="w-3.5 h-3.5" />Rejoindre le Meet
                </a>
              )}
            </div>
            <VBtn sm onClick={() => handleCancel(activeBooking)}>
              <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" />Annuler</span>
            </VBtn>
          </div>
        )}
      </div></GCard>

      {pastBookings.length > 0 && (
        <GCard><div className="p-5">
          <h3 className="text-sm font-black mb-4 flex items-center gap-2" style={{ color: th.fg }}>
            <ClipboardList className="w-4 h-4" style={{ color: th.navAC }} />Bilans de vos rendez-vous
          </h3>
          <div className="space-y-3">
            {pastBookings.map((b) => (
              <div key={b.id} className="rounded-xl p-4" style={{ border: `1px solid ${th.sep}` }}>
                <div className="text-sm font-semibold" style={{ color: th.fg }}>{b.formateurName}</div>
                <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>{formatDay(b.slotDate)} · {b.startTime}–{b.endTime}</div>
                {b.bilanFilledAt ? (
                  <div className="mt-3 space-y-2">
                    <div><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Sujet</span><p className="text-xs mt-0.5" style={{ color: th.fg2 }}>{b.bilanSujet}</p></div>
                    <div><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Point fort</span><p className="text-xs mt-0.5" style={{ color: th.fg2 }}>{b.bilanPointFort}</p></div>
                    <div><span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Next step</span><p className="text-xs mt-0.5" style={{ color: th.fg2 }}>{b.bilanNextStep}</p></div>
                  </div>
                ) : (
                  <p className="text-xs mt-2 italic" style={{ color: th.fg3 }}>En attente du bilan de votre formateur.</p>
                )}
              </div>
            ))}
          </div>
        </div></GCard>
      )}

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeBooking ? "Modifier votre rendez-vous" : "Confirmer le rendez-vous"}</DialogTitle>
            <DialogDescription>
              {pending && (
                <span className="flex items-center gap-1.5 mt-1" style={{ color: th.fg2 }}>
                  <Clock className="w-3.5 h-3.5" />
                  Avec {pending.formateurName}, le {formatDay(pending.slotDate)} de {pending.startTime} à {pending.endTime}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <ShimBtn full onClick={confirmBooking} disabled={booking}>{booking ? "Confirmation…" : activeBooking ? "Confirmer le changement" : "Confirmer le rendez-vous"}</ShimBtn>
        </DialogContent>
      </Dialog>

      <Dialog open={!!justBooked} onOpenChange={(open) => !open && setJustBooked(null)}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <SuccessCheck />
            <DialogTitle>Rendez-vous confirmé !</DialogTitle>
            {justBooked && (
              <DialogDescription className="text-center">
                Votre rendez-vous est pris le <strong style={{ color: th.fg }}>{formatDay(justBooked.date)}</strong> de <strong style={{ color: th.fg }}>{justBooked.start} à {justBooked.end}</strong>.
              </DialogDescription>
            )}
            <ShimBtn sm onClick={() => setJustBooked(null)}>Parfait</ShimBtn>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
