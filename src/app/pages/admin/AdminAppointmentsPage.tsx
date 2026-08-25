import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import {
  getAllAppointmentsForAdmin, updateAppointmentAsAdmin,
  type AdminAppointmentRow, type AppointmentStatus,
} from "@/app/lib/appointments";

const STATUS_LABEL: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  requested: { label: "Demande envoyée", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
  preparing: { label: "En préparation", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
  confirmed: { label: "Confirmé", color: "#6adeb1", bg: "rgba(106,222,177,0.1)" },
  completed: { label: "Terminé", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  cancelled: { label: "Annulé", color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
};

// input[type=datetime-local] veut "YYYY-MM-DDTHH:mm" en heure locale, pas un ISO UTC.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AdminAppointmentsPage() {
  const th = useTh();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ scheduledAt: string; googleMeetLink: string; adminMessage: string }>({ scheduledAt: "", googleMeetLink: "", adminMessage: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setAppointments(await getAllAppointmentsForAdmin());
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openRow = (a: AdminAppointmentRow) => {
    if (openId === a.id) { setOpenId(null); return; }
    setOpenId(a.id);
    setDraft({
      scheduledAt: toLocalInputValue(a.scheduledAt),
      googleMeetLink: a.googleMeetLink ?? "",
      adminMessage: a.adminMessage ?? "",
    });
  };

  const save = async (a: AdminAppointmentRow, nextStatus?: AppointmentStatus) => {
    setSaving(true);
    try {
      await updateAppointmentAsAdmin(a.id, {
        scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : null,
        googleMeetLink: draft.googleMeetLink || null,
        adminMessage: draft.adminMessage || null,
        status: nextStatus ?? a.status,
        handledBy: user?.id,
      });
      toast.success("Rendez-vous mis à jour.");
      await load();
      setOpenId(null);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Rendez-vous élèves</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Demandes de session avec un expert IA, en fin de module.</p>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && appointments.length === 0 && (
        <GCard><div className="p-8 text-center"><p className="text-sm" style={{ color: th.fg3 }}>Aucune demande de rendez-vous pour l'instant.</p></div></GCard>
      )}

      <div className="space-y-2">
        {appointments.map((a) => {
          const sc = STATUS_LABEL[a.status];
          const isOpen = openId === a.id;
          return (
            <GCard key={a.id}>
              <button className="w-full text-left" onClick={() => openRow(a)}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: th.fg }}>{a.studentName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                    </div>
                    <div className="text-xs" style={{ color: th.fg3 }}>{a.studentEmail} · {a.formationName}{a.sectionTitle ? ` · ${a.sectionTitle}` : ""}</div>
                  </div>
                  <div className="text-xs shrink-0" style={{ color: th.fg3 }}>Demandé le {formatDateTime(a.requestedAt)}</div>
                  <ChevronRight className="w-4 h-4 shrink-0 transition-transform" style={{ color: th.fg3, transform: isOpen ? "rotate(90deg)" : "none" }} />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-3" style={{ borderTop: `1px solid ${th.sep}` }}>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Date & heure</label>
                      <input type="datetime-local" value={draft.scheduledAt} onChange={(e) => setDraft((d) => ({ ...d, scheduledAt: e.target.value }))}
                        className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Lien Google Meet</label>
                      <input value={draft.googleMeetLink} onChange={(e) => setDraft((d) => ({ ...d, googleMeetLink: e.target.value }))} placeholder="https://meet.google.com/…"
                        className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Message personnalisé (affiché à l'élève)</label>
                    <textarea value={draft.adminMessage} onChange={(e) => setDraft((d) => ({ ...d, adminMessage: e.target.value }))} rows={2}
                      className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <VBtn sm onClick={() => save(a, "confirmed")} disabled={saving}><span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" />Confirmer</span></VBtn>
                    <VBtn sm onClick={() => save(a)} disabled={saving}>Enregistrer</VBtn>
                    {a.status !== "completed" && <VBtn sm onClick={() => save(a, "completed")} disabled={saving}>Marquer terminé</VBtn>}
                    {a.status !== "cancelled" && <VBtn sm onClick={() => save(a, "cancelled")} disabled={saving}>Annuler</VBtn>}
                  </div>
                </div>
              )}
            </GCard>
          );
        })}
      </div>
    </div>
  );
}
