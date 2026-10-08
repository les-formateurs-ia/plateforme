import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Plus, Building2 } from "lucide-react";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { PageHero, HueButton, EmptyState, Loading, ErrorText, DialogHero, HUE_ORDER } from "@/app/components/entreprise/EntrepriseKit";
import { SectionTile, SectionGrid } from "@/app/components/entreprise/SectionTiles";
import { listCompanies, createCompany, type CompanyRow } from "@/app/lib/entreprise/companies";

export function CompaniesListPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const admin = isAdmin(role);

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setCompanies(await listCompanies());
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les entreprises.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async () => {
    if (!user || !name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createCompany(name.trim(), user.id);
      setCompanies((rows) => [created, ...rows]);
      setDialogOpen(false);
      setName("");
      toast.success("Entreprise créée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-8">
      <PageHero Icon={Building2} title="Entreprises" eyebrow="Espace entreprise"
        desc={admin ? "Créez une entreprise et gérez ses collaborateurs." : "Entreprises créées par l'administrateur."}
        actions={admin ? <HueButton Icon={Plus} onClick={() => setDialogOpen(true)}>Créer une entreprise</HueButton> : undefined} />

      {loading && <Loading />}

      {!loading && companies.length === 0 && (
        <EmptyState Icon={Building2} title="Aucune entreprise pour l'instant"
          hint={admin ? "Créez la première entreprise pour y ajouter des collaborateurs et du contenu." : "L'administrateur n'a pas encore créé d'entreprise."}
          action={admin ? <HueButton Icon={Plus} onClick={() => setDialogOpen(true)}>Créer une entreprise</HueButton> : undefined} />
      )}

      <SectionGrid>
        {companies.map((c, i) => (
          <SectionTile key={c.id} index={i} label={c.name} Icon={Building2} hue={HUE_ORDER[i % HUE_ORDER.length]}
            desc="Collaborateurs, contenus, résultats."
            badge={c.employeeCount ? { label: `${c.employeeCount} collaborateur${c.employeeCount > 1 ? "s" : ""}` } : { label: "Aucun collaborateur", tone: "muted" }}
            onClick={() => navigate(`/entreprise/${c.id}`)} />
        ))}
      </SectionGrid>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent>
          <DialogHero Icon={Building2} title="Nouvelle entreprise" desc="Le nom de l'entreprise. Les collaborateurs s'ajoutent une fois l'entreprise créée." />
          <input
            value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex. Acme SAS"
            className="w-full rounded-[4px] px-4 py-3 text-base font-semibold g-input"
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
          />
          {error && <ErrorText>{error}</ErrorText>}
          <DialogFooter>
            <HueButton onClick={handleCreate} disabled={!name.trim() || saving}>{saving ? "Création..." : "Créer"}</HueButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
