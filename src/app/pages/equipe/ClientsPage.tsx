import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Building2, ChevronRight, Plus, Search, User, Users } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useStaffBasePath } from "@/app/lib/staffBase";
import { GCard } from "@/app/components/common/GCard";
import { Segmented } from "@/app/components/common/Buttons";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { PageHero, HueButton, DialogHero, ErrorText } from "@/app/components/entreprise/EntrepriseKit";
import { FIN_COLORS } from "@/app/components/sessions/hubUi";
import { sessionBadge, useFormationsHub } from "@/app/components/sessions/SessionCards";
import { createCompany } from "@/app/lib/entreprise/companies";
import { sessionStatus, type HubClient } from "@/app/lib/formationsHub";

// Annuaire unique des clients : entreprises et particuliers (CPF). Chaque
// client ouvre sa fiche — l'espace entreprise (collaborateurs, contenus,
// résultats) ou la fiche élève (parcours e-learning) — avec ses sessions.

type Filter = "tous" | "entreprise" | "cpf";

export function ClientsPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const staffBase = useStaffBasePath();
  const { hub, admin } = useFormationsHub();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => (params.get("type") === "entreprise" ? "entreprise" : params.get("type") === "cpf" ? "cpf" : "tous"));
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clients = useMemo(() => {
    if (!hub) return [];
    const q = query.trim().toLowerCase();
    return hub.clients
      .filter((c) => filter === "tous" || c.kind === filter)
      .filter((c) => !q || `${c.name} ${c.studentEmail ?? ""} ${c.detail}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const rank = (c: HubClient) => (c.sessions.some((s) => sessionStatus(s) !== "terminee") ? 0 : c.sessions.length ? 1 : 2);
        return rank(a) - rank(b) || a.name.localeCompare(b.name, "fr");
      });
  }, [hub, filter, query]);

  if (!hub) return <div className="p-8 text-sm" style={{ color: th.fg3 }}>Chargement…</div>;

  const open = (c: HubClient) => {
    if (c.companyId) navigate(`/clients/entreprises/${c.companyId}`);
    else if (c.studentId) navigate(`${staffBase}/planning/students/${c.studentId}`);
    else if (c.sessions[0]) navigate(`/sessions/${c.sessions[0].id}`);
  };

  const handleCreate = async () => {
    if (!user || !name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createCompany(name.trim(), user.id);
      toast.success("Entreprise créée.");
      navigate(`/clients/entreprises/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setSaving(false);
    }
  };

  const counts = { tous: hub.clients.length, entreprise: hub.clients.filter((c) => c.kind === "entreprise").length, cpf: hub.clients.filter((c) => c.kind === "cpf").length };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <PageHero Icon={Users} eyebrow="Formations" title={admin ? "Clients" : "Mes clients"}
        desc={admin ? "Entreprises et particuliers : ouvrez une fiche pour ses sessions, ses collaborateurs ou son parcours e-learning." : "Les entreprises et élèves de vos sessions, et vos élèves attitrés."}
        actions={admin ? <HueButton Icon={Plus} onClick={() => setDialogOpen(true)}>Créer une entreprise</HueButton> : undefined} />

      <div className="flex items-center gap-3 flex-wrap">
        <Segmented value={filter} onChange={(v) => setFilter(v as Filter)} options={[
          { value: "tous", label: `Tous (${counts.tous})` },
          { value: "entreprise", label: `Entreprises (${counts.entreprise})` },
          { value: "cpf", label: `Particuliers (${counts.cpf})` },
        ]} />
        <label className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: th.fg3 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un client"
            className="w-full rounded-[4px] pl-9 pr-3 py-2 text-sm g-input" />
        </label>
      </div>

      {!clients.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>{hub.clients.length ? "Aucun client ne correspond." : "Aucun client pour l'instant."}</div></GCard>}
      <div className="grid gap-2 lg:grid-cols-2">
        {clients.map((c) => {
          const Icon = c.kind === "entreprise" ? Building2 : User;
          const current = [...c.sessions].filter((s) => sessionStatus(s) !== "terminee").sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))[0];
          return (
            <GCard key={c.key}><div className="p-3.5 flex items-center gap-3">
              <button type="button" onClick={() => open(c)} className="flex-1 min-w-0 flex items-center gap-3 text-left hover:opacity-80">
                <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: th.navA, color: th.fg }}><Icon className="w-4 h-4" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-black truncate" style={{ color: th.fg }}>{c.name}</span>
                  <span className="block text-xs truncate" style={{ color: th.fg3 }}>
                    {c.kind === "entreprise" ? "Entreprise" : "Particulier"} · {c.detail}
                    {c.sessions.length ? ` · ${c.sessions.length} session${c.sessions.length > 1 ? "s" : ""}` : ""}
                  </span>
                </span>
                {current && (
                  <span className="hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 text-white" style={{ background: FIN_COLORS[current.financement] }}>{sessionBadge(current)}</span>
                )}
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
              </button>
              {admin && (c.companyId || c.studentId) && (
                <button type="button" onClick={() => navigate(`/sessions?nouvelle=1&client=${encodeURIComponent(c.key)}`)} title="Nouvelle session pour ce client"
                  className="w-9 h-9 rounded-[2px] flex items-center justify-center hover:opacity-70 shrink-0" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div></GCard>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent>
          <DialogHero Icon={Building2} title="Nouvelle entreprise" desc="Le nom de l'entreprise. Les collaborateurs et les contenus s'ajoutent depuis sa fiche." />
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex. Acme SAS"
            className="w-full rounded-[4px] px-4 py-3 text-base font-semibold g-input" onKeyDown={(e) => e.key === "Enter" && void handleCreate()} />
          {error && <ErrorText>{error}</ErrorText>}
          <DialogFooter>
            <HueButton onClick={handleCreate} disabled={!name.trim() || saving}>{saving ? "Création..." : "Créer"}</HueButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
