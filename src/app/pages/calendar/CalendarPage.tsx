import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, XCircle, RefreshCw, Check, X as XIcon, Video, ClipboardList, Paperclip } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { SuccessCheck } from "@/app/components/common/SuccessCheck";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { SectionHead } from "@/app/components/common/SectionHead";
import { WeekBoard } from "@/app/pages/calendar/WeekBoard";
import { cx } from "@/app/lib/cx";
import {
  listAvailableSlotsForBooking, listMyBookingsAsStudent, bookSlot, changeBooking, cancelBooking, syncMeetEvent,
  acceptReschedule, declineReschedule, getAssignedFormateurId, getFormateurName, getBilanAttachmentUrl,
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
  const activeBooking = bookings.find((b) => b.status !== "cancelled" && b.slotDate >= today) ?? null;
  const pastBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" && b.slotDate < today).sort((a, b) => (b.slotDate + b.startTime).localeCompare(a.slotDate + a.startTime)),
    [bookings, today],
  );

  // Retry silencieux : si la réservation active n'a pas encore de lien Meet
  // (formateur pas encore connecté à Google au moment de la réservation,
  // erreur passagère…), on retente à chaque chargement de la page.
  useEffect(() => {
    if (activeBooking?.status === "confirmed" && !activeBooking.meetLink) void syncMeetEvent(activeBooking.id);
  }, [activeBooking?.id, activeBooking?.status, activeBooking?.meetLink]);


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
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-10">
      <div className="fade-up">
        <p className="eyebrow" style={{ color: th.fg3 }}>Être accompagné</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}><GT>Rendez-vous</GT></h1>
        <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
          {formateurName ? <>Un échange en visio avec <strong style={{ color: th.fg }}>{formateurName}</strong>, ton formateur, pour faire le point et avancer sur ton projet.</> : "Un échange en visio avec ton formateur, pour faire le point et avancer sur ton projet."}
        </p>
      </div>

      {/* Ce qu'il faut savoir avant de réserver. */}
      <ul className="grid sm:grid-cols-3 fade-up" style={{ borderTop: `1px solid ${th.sep}`, borderBottom: `1px solid ${th.sep}`, animationDelay: "60ms" }}>
        {[
          { Icon: Clock, grad: "var(--grad-violet)", title: "Environ 1 heure", text: "Le temps de faire le point et de répondre à tes questions." },
          { Icon: Video, grad: "var(--grad-bleu)", title: "Sur Google Meet", text: "Tu reçois l'invitation par e-mail dès la réservation, avec le lien pour te connecter." },
          { Icon: CalendarIcon, grad: "var(--grad-beige)", title: "Dès demain", text: "Un rendez-vous à la fois ; tu peux le déplacer ou l'annuler ici." },
        ].map(({ Icon, grad, title, text }, i) => (
          <li key={title} className={cx("flex gap-3.5 py-5 sm:px-5", i > 0 && "sm:border-l border-t sm:border-t-0")} style={{ borderColor: th.sep, paddingLeft: i === 0 ? 0 : undefined }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: grad }}><Icon className="w-4 h-4" style={{ color: "#000" }} /></span>
            <span>
              <span className="block text-[15px] font-bold" style={{ color: th.fg }}>{title}</span>
              <span className="block mt-0.5 text-sm leading-relaxed" style={{ color: th.fg2 }}>{text}</span>
            </span>
          </li>
        ))}
      </ul>

      {checkedAssignment && !assignedFormateurId && (
        <GCard><div className="p-8 text-center"><p className="text-[15px]" style={{ color: th.fg2 }}>Aucun formateur ne t'a encore été attribué. Reviens un peu plus tard.</p></div></GCard>
      )}

      {activeBooking?.proposedDate && (
        <div className="relative rounded-[10px] p-6 overflow-hidden fade-up" style={{ border: `1px solid ${th.ink}` }}>
          <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: th.iris }} />
          <p className="eyebrow flex items-center gap-2" style={{ color: th.fg }}><RefreshCw className="w-3.5 h-3.5" />Nouveau créneau proposé</p>
          <p className="mt-3 text-[15px] leading-relaxed" style={{ color: th.fg2 }}>
            Ton formateur propose de déplacer le rendez-vous du {formatDay(activeBooking.slotDate)} à {activeBooking.startTime} au{" "}
            <strong style={{ color: th.fg }}>{formatDay(activeBooking.proposedDate)} à {activeBooking.proposedStartTime}</strong>.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <ShimBtn sm onClick={() => respondToProposal(true)} disabled={respondingToProposal}><span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />Accepter</span></ShimBtn>
            <VBtn sm onClick={() => respondToProposal(false)} disabled={respondingToProposal}><span className="flex items-center gap-1.5"><XIcon className="w-3.5 h-3.5" />Garder mon créneau</span></VBtn>
          </div>
        </div>
      )}

      {activeBooking && (
        <section aria-labelledby="next-rdv" className="relative overflow-hidden rounded-[10px] bg-black text-white p-6 sm:p-8 fade-up" style={{ border: th.isDark ? `1px solid ${th.sep}` : undefined }}>
          <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: th.iris }} />
          <p className="eyebrow text-white/60">{activeBooking.status === "confirmed" ? "Ton prochain rendez-vous" : "Rendez-vous en attente de confirmation"}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p id="next-rdv" className="text-[1.7rem] sm:text-[2.2rem] font-extrabold leading-tight tracking-[-0.03em] first-letter:uppercase">{formatDay(activeBooking.slotDate)}</p>
              <p className="mt-1 text-lg text-white/75 tabular-nums">à {activeBooking.startTime} · avec {activeBooking.formateurName} · environ 1 h</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {activeBooking.meetLink ? (
                <a href={activeBooking.meetLink} target="_blank" rel="noreferrer" className="sweep inline-flex items-center gap-2 min-h-11 px-5 rounded-[2px] bg-white text-black text-sm font-semibold">
                  <Video className="w-4 h-4" />Rejoindre le Meet
                </a>
              ) : (
                <span className="text-sm text-white/60">Le lien Google Meet arrive par e-mail.</span>
              )}
              <button type="button" onClick={() => handleCancel(activeBooking)} className="ink-link text-sm font-semibold text-white/75 hover-fine:text-white">Annuler le rendez-vous</button>
            </div>
          </div>
          <p className="mt-5 text-sm text-white/55">Pour le déplacer, choisis simplement un autre créneau ci-dessous.</p>
        </section>
      )}

      {assignedFormateurId && (
        <section aria-labelledby="slots-title" className="fade-up" style={{ animationDelay: "120ms" }}>
          <SectionHead id="slots-title" eyebrow="Disponibilités" title={activeBooking ? "Choisir un autre créneau" : "Choisis ton créneau"} />
          <WeekBoard slots={slots} activeBooking={activeBooking} onPick={setPending} />
        </section>
      )}

      {pastBookings.length > 0 && (
        <section aria-labelledby="bilans-title">
          <SectionHead id="bilans-title" eyebrow="Après tes rendez-vous" title="Les bilans de ton formateur" />
          <div className="grid gap-4 md:grid-cols-2">
            {pastBookings.map((b) => (
              <article key={b.id} className="rounded-[10px] p-5" style={{ border: `1px solid ${th.sep}` }}>
                <p className="eyebrow first-letter:uppercase" style={{ color: th.fg3 }}>{formatDay(b.slotDate)} · {b.startTime}</p>
                <p className="mt-1.5 text-[17px] font-bold" style={{ color: th.fg }}>{b.formateurName}</p>
                {b.bilanFilledAt ? (
                  <dl className="mt-4 space-y-3">
                    {[["Sujet", b.bilanSujet], ["Point fort", b.bilanPointFort], ["Prochaine étape", b.bilanNextStep]].map(([label, value]) => (
                      <div key={label}><dt className="eyebrow" style={{ color: th.fg3 }}>{label}</dt><dd className="mt-1 text-sm leading-relaxed" style={{ color: th.fg2 }}>{value}</dd></div>
                    ))}
                    {b.bilanAttachmentPath && (
                      <button
                        onClick={async () => {
                          try {
                            const url = await getBilanAttachmentUrl(b.bilanAttachmentPath!);
                            window.open(url, "_blank", "noreferrer");
                          } catch {
                            toast.error("Impossible d'ouvrir la pièce jointe.");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: th.fg }}
                      >
                        <Paperclip className="w-3.5 h-3.5" /><span className="ink-link">{b.bilanAttachmentName ?? "Télécharger le PDF"}</span>
                      </button>
                    )}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm" style={{ color: th.fg3 }}>Ton formateur rédige le bilan de ce rendez-vous.</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeBooking ? "Modifier votre rendez-vous" : "Confirmer ce rendez-vous"}</DialogTitle>
            <DialogDescription>
              {pending && (
                <span className="flex items-center gap-1.5 mt-1" style={{ color: th.fg2 }}>
                  <Clock className="w-3.5 h-3.5" />
                  Avec {pending.formateurName}, le {formatDay(pending.slotDate)} à {pending.startTime} (environ 1 h). Tu recevras l'invitation Google Meet par e-mail.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <ShimBtn full onClick={confirmBooking} disabled={booking}>{booking ? "Confirmation…" : "Confirmer"}</ShimBtn>
        </DialogContent>
      </Dialog>

      <Dialog open={!!justBooked} onOpenChange={(open) => !open && setJustBooked(null)}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <SuccessCheck />
            <DialogTitle>Rendez-vous confirmé !</DialogTitle>
            {justBooked && (
              <DialogDescription className="text-center">
                Rendez-vous le <strong style={{ color: th.fg }}>{formatDay(justBooked.date)}</strong> à <strong style={{ color: th.fg }}>{justBooked.start}</strong>, pour environ 1 h. L'invitation Google Meet t'a été envoyée par e-mail, ainsi qu'à ton formateur.
              </DialogDescription>
            )}
            <ShimBtn sm onClick={() => setJustBooked(null)}>Parfait</ShimBtn>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
