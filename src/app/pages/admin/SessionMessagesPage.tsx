import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { SessionChatThread } from "@/app/components/sessions/SessionChat";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { getSession, type TrainingSession } from "@/app/lib/trainingSessions";
import { periodeFr } from "@/app/lib/documents/render";

// Échanges internes d'une session (admin et formateur attribué), sur toute
// la hauteur de la page : la demande du client, son besoin, le contexte.
export function SessionMessagesPage() {
  const th = useTh();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { role } = useAuth();
  const admin = isAdmin(role);
  const [session, setSession] = useState<TrainingSession | null | undefined>(undefined);

  useEffect(() => {
    if (!sessionId || !role) return;
    getSession(sessionId, !admin).then(setSession).catch((err) => { console.error(err); setSession(null); });
  }, [sessionId, role]);

  if (session === undefined) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>Chargement…</div>;
  if (!session) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>{admin ? "Formation introuvable." : "Cette session est introuvable ou ne vous est pas attribuée."}</div>;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
      <div>
        <Link to={`/sessions/${session.id}`} className="flex items-center gap-1.5 text-sm w-fit hover:opacity-70 mb-3" style={{ color: th.fg3 }}>
          <ChevronLeft className="w-4 h-4" />Dossier de la session
        </Link>
        <p className="text-xs font-bold" style={{ color: th.fg3 }}>{session.reference} · Échanges internes</p>
        <h1 className="text-[1.5rem] sm:text-[1.8rem] leading-[1.1] font-black mt-1" style={{ color: th.fg }}><GT>{session.client.nom}</GT></h1>
        <p className="text-sm mt-1" style={{ color: th.fg2 }}>{session.formation.intitule} · {periodeFr(session.dateDebut, session.dateFin)}</p>
      </div>
      <SessionChatThread sessionId={session.id} />
    </div>
  );
}
