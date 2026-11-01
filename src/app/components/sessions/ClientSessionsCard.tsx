import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronRight, ClipboardList, Plus } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { FIN_COLORS } from "@/app/components/sessions/hubUi";
import { sessionBadge } from "@/app/components/sessions/SessionCards";
import { FINANCEMENT_LABELS, periodeFr } from "@/app/lib/documents/render";
import { listSessions, type TrainingSession } from "@/app/lib/trainingSessions";

// Sessions d'un client, en tête de sa fiche (entreprise ou élève) : la
// fiche client réunit ainsi le dossier et le parcours pédagogique.
// Un formateur n'y voit que les sessions qui lui sont attribuées.
export function ClientSessionsCard({ companyId, profileId, onLoaded }: {
  companyId?: string; profileId?: string; onLoaded?: (sessions: TrainingSession[]) => void;
}) {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const admin = isAdmin(role);
  const [sessions, setSessions] = useState<TrainingSession[] | null>(null);

  useEffect(() => {
    if (!role) return;
    let cancelled = false;
    (async () => {
      const all = await listSessions(!admin);
      let mine = all.filter((s) => companyId && s.companyId === companyId);
      if (profileId) {
        const { data, error } = await supabase.from("training_session_trainees").select("session_id").eq("profile_id", profileId);
        if (error) throw error;
        const ids = new Set((data ?? []).map((t) => t.session_id));
        mine = all.filter((s) => ids.has(s.id));
      }
      if (!cancelled) { setSessions(mine); onLoaded?.(mine); }
    })().catch((err) => { console.error(err); if (!cancelled) setSessions([]); });
    return () => { cancelled = true; };
  }, [companyId, profileId, role, admin]);

  if (!sessions) return null;
  const clientKey = companyId ? `c:${companyId}` : `p:${profileId}`;

  return (
    <GCard><div className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>Sessions</p>
        {admin && (
          <button type="button" onClick={() => navigate(`/sessions?nouvelle=1&client=${encodeURIComponent(clientKey)}`)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[2px] hover:opacity-70" style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
            <Plus className="w-3.5 h-3.5" />Nouvelle session
          </button>
        )}
      </div>
      {!sessions.length && <p className="text-xs" style={{ color: th.fg3 }}>{admin ? "Aucune session pour ce client." : "Aucune session de ce client ne vous est attribuée."}</p>}
      <div className="grid gap-2 md:grid-cols-2">
        {sessions.map((s) => (
          <Link key={s.id} to={`/sessions/${s.id}`} className="flex items-center gap-3 rounded-[6px] px-3 py-2.5 hover:opacity-80" style={{ background: th.navA }}>
            <span className="w-1.5 self-stretch rounded-full shrink-0" style={{ background: FIN_COLORS[s.financement] }} />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold truncate" style={{ color: th.fg }}>{s.formation.intitule}</span>
              <span className="block text-[11px] truncate" style={{ color: th.fg3 }}>{periodeFr(s.dateDebut, s.dateFin)} · {FINANCEMENT_LABELS[s.financement]}</span>
            </span>
            <span className="text-[11px] font-bold shrink-0" style={{ color: th.fg2 }}>{sessionBadge(s)}</span>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
          </Link>
        ))}
      </div>
    </div></GCard>
  );
}
