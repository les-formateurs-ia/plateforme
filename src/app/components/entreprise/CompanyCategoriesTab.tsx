import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Panel, HueButton, EmptyState, Loading, KitHeading, useHue } from "@/app/components/entreprise/EntrepriseKit";
import { listCompanyFileCategories, createCompanyFileCategory, deleteCompanyFileCategory, type CompanyFileCategoryRow } from "@/app/lib/entreprise/companyFileCategories";

export function CompanyCategoriesTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const h = useHue();
  const [categories, setCategories] = useState<CompanyFileCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await listCompanyFileCategories(companyId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId]);

  const handleCreate = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const created = await createCompanyFileCategory(companyId, name.trim());
      setCategories((rows) => [...rows, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de créer cette catégorie (nom déjà utilisé ?).");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CompanyFileCategoryRow) => {
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    try {
      await deleteCompanyFileCategory(cat.id);
      setCategories((rows) => rows.filter((r) => r.id !== cat.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer cette catégorie.");
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <Panel watermark={Tag}>
        <div className="p-5 sm:p-6 space-y-4">
          <KitHeading>Nouvelle catégorie</KitHeading>
          <p className="text-sm" style={{ color: th.fg3 }}>Catégories proposées aux collaborateurs quand ils envoient un fichier. Les fichiers reçus sont dans la rubrique Documents élèves.</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Photo Générée" className="flex-1 min-w-[200px] rounded-[4px] px-4 py-2.5 text-sm g-input" onKeyDown={(e) => e.key === "Enter" && void handleCreate()} />
            <HueButton Icon={Plus} onClick={handleCreate} disabled={!name.trim() || saving}>Ajouter</HueButton>
          </div>
        </div>
      </Panel>

      <div>
        <KitHeading>{categories.length} catégorie{categories.length > 1 ? "s" : ""}</KitHeading>
        {loading && <Loading />}
        {!loading && !categories.length && <EmptyState Icon={Tag} title="Aucune catégorie pour l'instant" hint="Sans catégorie, les élèves peuvent quand même envoyer leurs fichiers." />}
        {!loading && !!categories.length && (
          <div className="flex flex-wrap gap-2.5">
            {categories.map((c, i) => (
              <span key={c.id} className="fade-up inline-flex items-center gap-2 rounded-2xl pl-3 pr-1.5 py-1.5 text-sm font-semibold"
                style={{ background: h.alpha(th.isDark ? 0.14 : 0.1), border: `1px solid ${h.alpha(0.35)}`, color: th.fg, animationDelay: `${i * 30}ms` }}>
                <Tag className="w-3.5 h-3.5" style={{ color: h.text }} />{c.name}
                <button onClick={() => void handleDelete(c)} title="Supprimer" aria-label={`Supprimer ${c.name}`}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10"><Trash2 className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
