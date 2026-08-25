import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Video, CheckCircle, Clock, Calendar as CalendarIcon, ExternalLink, XCircle } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useCourseProgress } from "@/app/state/useCourseProgress";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { getMyAppointments, requestAppointment, type Appointment } from "@/app/lib/appointments";

const STATUS_LABEL: Record<Appointment["status"], { label: string; color: string; bg: string }> = {
  requested: { label: "Demande envoyée", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
  preparing: { label: "En préparation", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
  confirmed: { label: "Confirmé", color: "#6adeb1", bg: "rgba(106,222,177,0.1)" },
  completed: { label: "Terminé", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  cancelled: { label: "Annulé", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function CalendarPage() {
  const th = useTh();
  const { user } = useAuth();
  const course = useCourseProgress();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setAppointments(await getMyAppointments(user.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger vos rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user]);

  const handleRequest = async (sectionId: string) => {
    if (!user || !course.outline) return;
    setRequesting(sectionId);
    try {
      const appt = await requestAppointment(user.id, course.outline.formationId, sectionId);
      setAppointments((a) => [appt, ...a]);
      toast.success("Ta demande a bien été envoyée à ton expert IA.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer la demande.");
    } finally {
      setRequesting(null);
    }
  };

  const completedSections = (course.outline?.sections ?? []).filter((section) => {
    if (!section.lessons.length) return false;
    return section.lessons.every((l) => course.lessonStates.find((s) => s.lesson.id === l.id)?.state === "completed");
  });

  const activeAppointmentSectionIds = new Set(
    appointments.filter((a) => a.status !== "cancelled").map((a) => a.sectionId).filter((id): id is string => !!id),
  );
  const bookableSections = completedSections.filter((s) => !activeAppointmentSectionIds.has(s.id));

  if (loading || course.loading) {
    return <div className="flex-1 flex items-center justify-center"><span className="text-sm" style={{ color: th.fg3 }}>Chargement…</span></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Planning</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Réserve un point avec ton expert IA à la fin de chaque module.</p>
      </div>

      {bookableSections.length > 0 && (
        <div className="space-y-3">
          {bookableSections.map((section) => (
            <div key={section.id} className="rounded-2xl p-5" style={{ background: th.isDark ? "linear-gradient(135deg,rgba(181,141,224,0.18),rgba(219,172,240,0.08))" : "linear-gradient(135deg,rgba(181,141,224,0.1),rgba(219,172,240,0.04))", border: "1px solid rgba(181,141,224,0.28)" }}>
              <Video className="w-5 h-5 mb-3" style={{ color: th.navAC }} />
              <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: th.navAC }}>Module terminé : {section.title}</div>
              <h4 className="text-sm font-black mb-2" style={{ color: th.fg }}>Planifie un échange 1:1 avec un expert IA</h4>
              <p className="text-xs leading-relaxed mb-4" style={{ color: th.fg3 }}>Pose tes questions, débloque tes situations et prépare ta certification.</p>
              <ShimBtn sm onClick={() => handleRequest(section.id)} disabled={requesting === section.id}>
                <span className="flex items-center justify-center gap-2"><CalendarIcon className="w-4 h-4" />{requesting === section.id ? "Envoi…" : "Réserver ma session"}</span>
              </ShimBtn>
            </div>
          ))}
        </div>
      )}

      <GCard><div className="p-5">
        <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Mes rendez-vous</h3>
        {appointments.length === 0 && (
          <p className="text-xs" style={{ color: th.fg3 }}>Aucune demande pour l'instant — termine un module pour débloquer une session avec ton expert IA.</p>
        )}
        <div className="space-y-3">
          {appointments.map((a) => {
            const sc = STATUS_LABEL[a.status];
            const section = course.outline?.sections.find((s) => s.id === a.sectionId);
            return (
              <div key={a.id} className="rounded-xl p-4" style={{ border: `1px solid ${th.sep}` }}>
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: th.fg }}>{section?.title ?? "Point avec l'expert"}</div>
                    <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>Demandé le {formatDateTime(a.requestedAt)}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                </div>

                {(a.status === "requested" || a.status === "preparing") && (
                  <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: th.navAC }}><Clock className="w-3.5 h-3.5" />Votre expert IA prépare votre rendez-vous.</p>
                )}

                {a.status === "confirmed" && (
                  <div className="mt-2 space-y-2">
                    {a.scheduledAt && <p className="text-xs flex items-center gap-1.5" style={{ color: th.fg2 }}><CalendarIcon className="w-3.5 h-3.5" style={{ color: th.navAC }} />{formatDateTime(a.scheduledAt)}</p>}
                    {a.adminMessage && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(181,141,224,0.06)", color: th.fg2, border: `1px solid ${th.sep}` }}>{a.adminMessage}</p>}
                    {a.googleMeetLink && (
                      <a href={a.googleMeetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold hover:opacity-80" style={{ color: th.navAC }}>
                        <ExternalLink className="w-3.5 h-3.5" />Rejoindre sur Google Meet
                      </a>
                    )}
                  </div>
                )}

                {a.status === "cancelled" && (
                  <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "#fbc2ad" }}><XCircle className="w-3.5 h-3.5" />Ce rendez-vous a été annulé.</p>
                )}
              </div>
            );
          })}
        </div>
      </div></GCard>
    </div>
  );
}
