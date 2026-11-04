import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowRight, PenLine } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { GCard } from "@/app/components/common/GCard";
import { GREEN } from "@/app/components/sessions/JourneyView";
import { FIN_COLORS, MiniRing, daysBetween } from "@/app/components/sessions/hubUi";
import { eur, FINANCEMENT_LABELS, periodeFr, totalHt } from "@/app/lib/documents/render";
import { STATUT_COMMERCIAL_LABELS, todayIso, type TrainingSession } from "@/app/lib/trainingSessions";
import { loadFormationsHub, sessionStatus, type FormationsHub } from "@/app/lib/formationsHub";

// Chargement du hub selon le rôle : tout pour l'admin, seulement ses
// sessions (sans données financières) pour un formateur.
export function useFormationsHub() {
  const { role, user } = useAuth();
  const [hub, setHub] = useState<FormationsHub | null>(null);
  const admin = isAdmin(role);
  useEffect(() => {
    if (!role || !user) return;
    let cancelled = false;
    loadFormationsHub(admin ? null : { formateurId: user.id })
      .then((h) => { if (!cancelled) setHub(h); })
      .catch((err) => { console.error(err); toast.error("Impossible de charger les formations."); });
    return () => { cancelled = true; };
  }, [role, user, admin]);
  return { hub, admin };
}

// Avancement pédagogique d'une session : séances passées et émargées par
// l'intervenant (ce que voit un formateur, sans le dossier administratif).
export function pedagogyOf(hub: FormationsHub, s: TrainingSession, today = todayIso()) {
  const slots = hub.slots.filter((sl) => sl.sessionId === s.id);
  const past = slots.filter((sl) => sl.date <= today);
  const toSign = past.filter((sl) => !hub.trainerSignedSlotIds.has(sl.id));
  const progress = slots.length ? Math.round((past.length / slots.length) * 100) : 0;
  return { total: slots.length, past: past.length, toSign: toSign.length, progress };
}

// toClose : session terminée dont le dossier n'est pas complet.
// Prospect, devis en attente ou affaire perdue : le statut commercial prime sur les dates.
export function sessionBadge(s: TrainingSession, toClose = false, today = todayIso()) {
  if (s.statutCommercial !== "gagne") return STATUT_COMMERCIAL_LABELS[s.statutCommercial];
  const status = sessionStatus(s, today);
  const d = daysBetween(today, s.dateDebut);
  return status === "en_cours" ? "En cours" : status === "a_venir" ? (d === 0 ? "Aujourd'hui" : `J-${d}`) : toClose ? "À clôturer" : "Terminée";
}

// Carte d'une session. L'admin y suit le dossier (progression Qualiopi et
// prochaine étape) ; le formateur, les séances et l'émargement.
export function SessionCard({ hub, session: s, admin }: { hub: FormationsHub; session: TrainingSession; admin: boolean }) {
  const th = useTh();
  const j = hub.journeys[s.id];
  const p = pedagogyOf(hub, s);
  const value = admin ? (j?.progress ?? 0) : p.progress;
  return (
    <Link to={`/sessions/${s.id}`} className="block transition-transform hover:-translate-y-0.5">
      <GCard><div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="relative">
            <MiniRing value={value} />
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums" style={{ color: th.fg }}>{value}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate" style={{ color: th.fg }}>{s.client.nom}</p>
            <p className="text-xs truncate" style={{ color: th.fg3 }}>{s.formation.intitule}</p>
            <p className="text-[11px] mt-1" style={{ color: th.fg2 }}>
              {admin ? <>{j?.level.emoji} {j?.level.label}</> : `${p.past}/${p.total} séance${p.total > 1 ? "s" : ""} réalisée${p.past > 1 ? "s" : ""}`}
            </p>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 text-white" style={{ background: FIN_COLORS[s.financement] }}>{sessionBadge(s, admin && (j?.progress ?? 0) < 100)}</span>
        </div>
        {admin && (
          <div className="flex gap-1">
            {j?.steps.map((st) => (
              <span key={st.id} title={st.titre} className="h-1.5 flex-1 rounded-full"
                style={{ background: st.status === "done" ? GREEN : st.status === "current" ? th.ink : th.navA }} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs rounded-[6px] px-3 py-2" style={{ background: th.navA }}>
          {admin || !p.toSign ? <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: th.fg }} /> : <PenLine className="w-3.5 h-3.5 shrink-0" style={{ color: th.danger }} />}
          <span className="truncate" style={{ color: th.fg }}>
            {admin && s.statutCommercial !== "gagne"
              ? <><strong>{STATUT_COMMERCIAL_LABELS[s.statutCommercial]}</strong>{totalHt(s.lignes) ? ` · ${eur(totalHt(s.lignes))} HT` : ""}</>
              : admin
              ? (j?.next ? <><strong>{j.next.titre}</strong>{j.next.missing.length ? ` · ${j.next.missing.length} à compléter` : j.next.actions[0] ? ` · ${j.next.actions[0].label}` : ""}</> : "Dossier complet 🏆")
              : p.toSign ? <><strong>{p.toSign} séance{p.toSign > 1 ? "s" : ""} à émarger</strong></> : p.total ? "Émargement à jour" : "Aucune séance planifiée"}
          </span>
        </div>
        <p className="text-[11px]" style={{ color: th.fg3 }}>{periodeFr(s.dateDebut, s.dateFin)}{admin ? ` · ${FINANCEMENT_LABELS[s.financement]}` : ""}</p>
      </div></GCard>
    </Link>
  );
}
