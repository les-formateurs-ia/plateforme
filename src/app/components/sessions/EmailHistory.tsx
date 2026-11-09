import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GREEN } from "@/app/components/sessions/JourneyView";
import { EMAIL_HISTORY_LABELS, listCompanyEmails, listProfileEmails, type LoggedEmailKind, type SessionEmail } from "@/app/lib/trainingSessions";

// Historique des e-mails du parcours client : date, heure et nom de chaque
// e-mail envoyé (journal session_emails, écrit par les fonctions d'envoi).

const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", {
  timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export function EmailHistoryList({ emails, compact = false }: { emails: SessionEmail[]; compact?: boolean }) {
  const th = useTh();
  if (!emails.length) return <p className="text-[11px]" style={{ color: th.fg3 }}>Aucun e-mail envoyé pour l’instant.</p>;
  return (
    <div className={`space-y-1 overflow-y-auto pr-1 ${compact ? "max-h-56" : "max-h-80"}`}>
      {emails.map((e) => (
        <div key={e.id} className="flex items-center gap-2 text-[11px]" title={e.error ?? e.subject ?? undefined}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.status === "sent" ? GREEN : th.danger }} />
          <span className="tabular-nums shrink-0" style={{ color: th.fg3 }}>{when(e.sent_at)}</span>
          <span className="font-semibold shrink-0" style={{ color: th.fg }}>{EMAIL_HISTORY_LABELS[e.kind as LoggedEmailKind] ?? e.kind}</span>
          <span className="truncate flex-1" style={{ color: th.fg3 }}>{e.status === "error" ? "échec de l’envoi" : e.recipient}</span>
          {e.automatic && <span className="px-1.5 rounded shrink-0" style={{ background: th.navA, color: th.fg3 }}>auto</span>}
        </div>
      ))}
    </div>
  );
}

// Carte « E-mails envoyés » d'une fiche élève ou entreprise (admin).
export function EmailHistoryCard({ profileId, companyId }: { profileId?: string; companyId?: string }) {
  const th = useTh();
  const [emails, setEmails] = useState<SessionEmail[] | null>(null);
  useEffect(() => {
    const load = profileId ? listProfileEmails(profileId) : companyId ? listCompanyEmails(companyId) : Promise.resolve([]);
    load.then(setEmails).catch((err) => { console.error(err); setEmails([]); });
  }, [profileId, companyId]);
  return (
    <GCard><div className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>E-mails envoyés</p>
        {emails && emails.length > 0 && <span className="text-[11px] tabular-nums" style={{ color: th.fg3 }}>{emails.length}</span>}
      </div>
      {emails ? <EmailHistoryList emails={emails} /> : <p className="text-[11px]" style={{ color: th.fg3 }}>Chargement…</p>}
    </div></GCard>
  );
}
