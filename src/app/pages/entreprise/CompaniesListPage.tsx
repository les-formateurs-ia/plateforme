import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Plus, Building2, Users } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { listCompanies, createCompany, type CompanyRow } from "@/app/lib/entreprise/companies";

export function CompaniesListPage() {
  const th = useTh();
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Entreprises</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>
            {admin ? "Crée une entreprise et gère ses collaborateurs." : "Entreprises créées par l'administrateur."}
          </p>
        </div>
        {admin && (
          <ShimBtn onClick={() => setDialogOpen(true)}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Créer une entreprise</span>
          </ShimBtn>
        )}
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && companies.length === 0 && (
        <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucune entreprise pour l'instant.</div></GCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <GCard key={c.id} onClick={() => navigate(`/entreprise/${c.id}`)} className="hover:scale-[1.01] transition-transform">
            <div className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})` }}>
                <Building2 className="w-4.5 h-4.5" style={{ color: "#fff" }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black truncate" style={{ color: th.fg }}>{c.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: th.fg3 }}>
                  <Users className="w-3.5 h-3.5" />{c.employeeCount} collaborateur{c.employeeCount > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </GCard>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle entreprise</DialogTitle>
            <DialogDescription>Le nom de l'entreprise. Les collaborateurs s'ajoutent une fois l'entreprise créée.</DialogDescription>
          </DialogHeader>
          <input
            value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex. Acme SAS"
            className="w-full rounded-xl px-4 py-2.5 text-sm g-input"
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
          />
          {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
          <DialogFooter>
            <ShimBtn onClick={handleCreate} disabled={!name.trim() || saving}>{saving ? "Création..." : "Créer"}</ShimBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
