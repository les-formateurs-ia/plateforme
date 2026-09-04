import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bug } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { listIncidents, updateIncidentStatus, INCIDENT_PAGE_LABEL, INCIDENT_STATUS_LABEL, type ReportedIncident } from "@/app/lib/incidents";

const STATUS_STYLE: Record<ReportedIncident["status"], { color: string; bg: string }> = {
  a_traiter: { color: "#fbc2ad", bg: "rgba(251,194,173,0.1)" },
  corrige: { color: "#6adeb1", bg: "rgba(106,222,177,0.1)" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminIncidentsPage() {
  const th = useTh();
  const [incidents, setIncidents] = useState<ReportedIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setIncidents(await listIncidents());
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const toggleStatus = async (incident: ReportedIncident) => {
    const nextStatus = incident.status === "a_traiter" ? "corrige" : "a_traiter";
    setUpdatingId(incident.id);
    try {
      await updateIncidentStatus(incident.id, nextStatus);
      setIncidents((rows) => rows.map((r) => (r.id === incident.id ? { ...r, status: nextStatus } : r)));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour le statut.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Incidents techniques</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Bugs signalés par les utilisateurs depuis le bouton de la topbar.</p>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && incidents.length === 0 && (
        <GCard><div className="p-8 text-center">
          <Bug className="w-6 h-6 mx-auto mb-2" style={{ color: th.fg3 }} />
          <p className="text-sm" style={{ color: th.fg3 }}>Aucun incident signalé pour l'instant.</p>
        </div></GCard>
      )}

      <div className="space-y-3">
        {incidents.map((incident) => {
          const sc = STATUS_STYLE[incident.status];
          return (
            <GCard key={incident.id}><div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : `${th.gradShadow(0.06)}`, color: th.navAC, border: `1px solid ${th.navAC}30` }}>
                    {INCIDENT_PAGE_LABEL[incident.page]}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                    {INCIDENT_STATUS_LABEL[incident.status]}
                  </span>
                </div>
                {incident.status === "a_traiter" ? (
                  <ShimBtn sm onClick={() => toggleStatus(incident)} disabled={updatingId === incident.id}>
                    {updatingId === incident.id ? "…" : "Marquer corrigé"}
                  </ShimBtn>
                ) : (
                  <VBtn sm onClick={() => toggleStatus(incident)} disabled={updatingId === incident.id}>
                    {updatingId === incident.id ? "…" : "Rouvrir"}
                  </VBtn>
                )}
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: th.fg }}>{incident.description}</p>
              <p className="text-xs" style={{ color: th.fg3 }}>{incident.reporterName}{incident.reporterEmail ? ` · ${incident.reporterEmail}` : ""} · {formatDate(incident.createdAt)}</p>
            </div></GCard>
          );
        })}
      </div>
    </div>
  );
}
