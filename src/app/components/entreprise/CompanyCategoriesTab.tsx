import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Tag, FileText } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { listCompanyFileCategories, createCompanyFileCategory, deleteCompanyFileCategory, type CompanyFileCategoryRow } from "@/app/lib/entreprise/companyFileCategories";
import { listCompanyStudentUploads, getCompanyStudentUploadUrl, type CompanyStudentUploadRow } from "@/app/lib/entreprise/companyStudentUploads";

export function CompanyCategoriesTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const [categories, setCategories] = useState<CompanyFileCategoryRow[]>([]);
  const [uploads, setUploads] = useState<CompanyStudentUploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cats, ups] = await Promise.all([listCompanyFileCategories(companyId), listCompanyStudentUploads(companyId)]);
      setCategories(cats);
      setUploads(ups);
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

  const handleOpenUpload = async (upload: CompanyStudentUploadRow) => {
    try {
      const url = await getCompanyStudentUploadUrl(upload.storagePath);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'ouvrir ce fichier.");
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: th.fg3 }}>Catégories de fichiers élève</h4>
        </div>
        <GCard>
          <div className="p-4 flex items-center gap-2 flex-wrap">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Photo Générée" className="flex-1 min-w-[200px] rounded-xl px-4 py-2.5 text-sm g-input" onKeyDown={(e) => e.key === "Enter" && void handleCreate()} />
            <ShimBtn sm onClick={handleCreate} disabled={!name.trim() || saving}><span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" />Ajouter</span></ShimBtn>
          </div>
        </GCard>

        {loading && <p className="text-sm mt-3" style={{ color: th.fg3 }}>Chargement…</p>}
        {!loading && (
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}>
                <Tag className="w-3 h-3" style={{ color: th.navAC }} />{c.name}
                <button onClick={() => void handleDelete(c)} title="Supprimer"><Trash2 className="w-3 h-3" style={{ color: th.fg3 }} /></button>
              </span>
            ))}
            {!categories.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucune catégorie pour l'instant.</p>}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: th.fg3 }}>Fichiers uploadés par les élèves</h4>
        {!loading && !uploads.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucun fichier élève pour l'instant.</div></GCard>}
        <div className="space-y-2">
          {uploads.map((u) => (
            <GCard key={u.id}>
              <button onClick={() => void handleOpenUpload(u)} className="w-full p-3.5 flex items-center gap-3 text-left hover:opacity-80">
                <FileText className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{u.fileName}</div>
                  <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>{u.categoryName ?? "Sans catégorie"}</div>
                </div>
              </button>
            </GCard>
          ))}
        </div>
      </div>
    </div>
  );
}
