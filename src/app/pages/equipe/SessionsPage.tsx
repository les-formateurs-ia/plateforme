import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ClipboardList, FileText, Plus, Search } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { Segmented } from "@/app/components/common/Buttons";
import { PageHero, HueButton, GhostButton } from "@/app/components/entreprise/EntrepriseKit";
import { NewSessionForm } from "@/app/components/sessions/NewSessionForm";
import { SessionsCalendar } from "@/app/components/sessions/hubUi";
import { SessionCard, pedagogyOf, useFormationsHub } from "@/app/components/sessions/SessionCards";
import type { Financement } from "@/app/lib/documents/types";
import { sessionStatus, type HubClient } from "@/app/lib/formationsHub";

// Toutes les sessions de formation (une action vendue à un client, avec ses
// séances, ses stagiaires et son dossier). Pour un formateur : les siennes.

type Period = "actives" | "terminees" | "toutes";
type FinFilter = "tous" | Financement;

export function SessionsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { hub, admin } = useFormationsHub();
  const [params, setParams] = useSearchParams();
  const [period, setPeriod] = useState<Period>("actives");
  const [fin, setFin] = useState<FinFilter>("tous");
  const [query, setQuery] = useState("");
  // ?nouvelle=1 (depuis le tableau de bord ou une fiche client) : formulaire ouvert.
  const [creatingFor, setCreatingFor] = useState<HubClient | null | undefined>(() => (params.get("nouvelle") ? null : undefined));

  const presetClient = useMemo(() => {
    const key = params.get("client");
    return key && hub ? hub.clients.find((c) => c.key === key) ?? null : null;
  }, [hub, params]);

  const sessions = useMemo(() => {
    if (!hub) return [];
    const q = query.trim().toLowerCase();
    return hub.sessions
      .filter((s) => fin === "tous" || s.financement === fin)
      .filter((s) => {
        if (period === "toutes") return true;
        const ended = sessionStatus(s) === "terminee";
        // Une session terminée reste « active » tant qu'il reste à faire.
        const pending = admin ? (hub.journeys[s.id]?.progress ?? 0) < 100 : pedagogyOf(hub, s).toSign > 0;
        const active = !ended || pending;
        return period === "actives" ? active : !active;
      })
      .filter((s) => !q || `${s.client.nom} ${s.formation.intitule} ${s.reference}`.toLowerCase().includes(q))
      .sort((a, b) => period === "terminees" ? b.dateDebut.localeCompare(a.dateDebut) : a.dateDebut.localeCompare(b.dateDebut));
  }, [hub, fin, period, query, admin]);

  if (!hub) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>Chargement…</div>;

  const finOptions: { value: FinFilter; label: string }[] = [
    { value: "tous", label: "Tous" }, { value: "entreprise", label: "Entreprise" }, { value: "opco", label: "OPCO" },
    { value: "cpf", label: "CPF" }, { value: "particulier", label: "Particulier" },
  ];
  const closeForm = () => { setCreatingFor(undefined); if (params.size) setParams({}, { replace: true }); };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <PageHero Icon={ClipboardList} eyebrow="Formations" title={admin ? "Sessions" : "Mes sessions"}
        desc={admin ? "Chaque formation vendue : dates, séances, stagiaires, émargement et dossier Qualiopi." : "Les formations qui vous sont attribuées : séances, stagiaires, émargement et évaluation."}
        actions={admin ? <>
          <GhostButton Icon={FileText} onClick={() => navigate("/sessions/modeles")}>Modèles de documents</GhostButton>
          <HueButton Icon={Plus} onClick={() => setCreatingFor(null)}>Nouvelle session</HueButton>
        </> : undefined} />

      {admin && creatingFor !== undefined && (
        <NewSessionForm key={presetClient?.key ?? creatingFor?.key ?? "new"} clients={hub.clients} sessions={hub.sessions}
          initial={presetClient ?? creatingFor} onCancel={closeForm} />
      )}

      <SessionsCalendar sessions={sessions} slots={hub.slots} />

      <section className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Segmented value={period} onChange={(v) => setPeriod(v as Period)} options={[
            { value: "actives", label: "En cours et à venir" }, { value: "terminees", label: "Terminées" }, { value: "toutes", label: "Toutes" },
          ]} />
          <Segmented value={fin} onChange={(v) => setFin(v as FinFilter)} options={finOptions} />
          <label className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: th.fg3 }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une session, un client"
              className="w-full rounded-[4px] pl-9 pr-3 py-2 text-sm g-input" />
          </label>
        </div>
        {!sessions.length && (
          <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>
            {hub.sessions.length ? "Aucune session ne correspond à ces filtres." : admin ? "Aucune session pour l'instant." : "Aucune session ne vous est attribuée pour le moment."}
          </div></GCard>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => <SessionCard key={s.id} hub={hub} session={s} admin={admin} />)}
        </div>
        {!admin && <p className="text-[11px]" style={{ color: th.fg3 }}>Les données financières et les documents administratifs sont gérés par l'administrateur.</p>}
      </section>
    </div>
  );
}
