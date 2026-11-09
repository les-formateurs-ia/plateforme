import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router";
import { CalendarClock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useImpersonation } from "@/app/state/impersonation-context";
import { touchConnection } from "@/app/lib/connections";
import { getPendingAccess, type PendingAccess } from "@/app/lib/learning";

const HEARTBEAT_MS = 60_000;

// Élève particulier (CPF ou autofinancé) : ni équipe, ni collaborateur d'entreprise.
function useIsIndividualLearner(): boolean {
  const { role, companyId } = useAuth();
  return role === "student" && !companyId;
}

// Historique des connexions : signe de vie à l'ouverture, puis chaque minute
// tant que l'onglet est visible. Jamais pendant une usurpation par l'équipe
// (ce n'est pas l'élève qui est connecté).
export function LearnerPresence() {
  const learner = useIsIndividualLearner();
  const { isImpersonating } = useImpersonation();
  const active = learner && !isImpersonating;

  useEffect(() => {
    if (!active) return;
    const beat = () => { if (document.visibilityState === "visible") void touchConnection(); };
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", beat); };
  }, [active]);

  return null;
}

// Minuit (heure de Paris) du jour d'ouverture.
function parisMidnight(iso: string): number {
  const utcMidnight = new Date(`${iso}T00:00:00Z`);
  const parisHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(utcMidnight));
  return utcMidnight.getTime() - parisHour * 3_600_000;
}

// Formation pas encore ouverte : décompte à la place de l'espace élève
// (le profil reste accessible). Le jour J, tout s'ouvre sans recharger.
// redirectTo : pages hors du cadre de l'espace (leçon plein écran), renvoyées
// vers l'accueil qui affiche le décompte.
export function AccessGate({ children, allow = false, redirectTo }: { children: ReactNode; allow?: boolean; redirectTo?: string }) {
  const learner = useIsIndividualLearner();
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingAccess | null | undefined>(learner ? undefined : null);

  const refresh = useCallback(() => {
    if (!learner || !user) { setPending(null); return; }
    setPending((cur) => (cur === null ? undefined : cur));
    getPendingAccess(user.id).then(setPending).catch((err) => { console.error(err); setPending(null); });
  }, [learner, user]);

  useEffect(() => { refresh(); }, [refresh]);

  if (pending === undefined) return null;
  if (!pending || allow) return <>{children}</>;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <AccessCountdown pending={pending} onOpen={refresh} />;
}

function AccessCountdown({ pending, onOpen }: { pending: PendingAccess; onOpen: () => void }) {
  const th = useTh();
  const target = parisMidnight(pending.availableFrom);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const left = Math.max(0, target - now);
  useEffect(() => { if (left === 0) onOpen(); }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const units: [number, string][] = [
    [Math.floor(left / 86_400_000), "jours"],
    [Math.floor((left % 86_400_000) / 3_600_000), "heures"],
    [Math.floor((left % 3_600_000) / 60_000), "minutes"],
    [Math.floor((left % 60_000) / 1000), "secondes"],
  ];
  const dateLabel = new Date(target).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl text-center space-y-6">
        <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: th.ink, color: th.onInk }}>
          <CalendarClock className="w-6 h-6" />
        </span>
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: th.fg3 }}>Votre formation ouvre bientôt</p>
          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: th.fg }}>{pending.name}</h1>
          <p className="text-sm" style={{ color: th.fg2 }}>Ouverture le <strong style={{ color: th.fg }}>{dateLabel}</strong>. Votre compte est prêt : ce jour-là, toute la formation se débloque automatiquement.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-live="polite">
          {units.map(([value, label]) => (
            <div key={label} className="rounded-[10px] py-4" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
              <p className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: th.fg }}>{String(value).padStart(2, "0")}</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: th.fg3 }}>{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: th.fg3 }}>
          En attendant, vous pouvez compléter <Link to="/profile" className="underline font-semibold" style={{ color: th.fg2 }}>votre profil</Link>. Une question ? contact@les-formateurs-ia.fr
        </p>
      </div>
    </div>
  );
}
