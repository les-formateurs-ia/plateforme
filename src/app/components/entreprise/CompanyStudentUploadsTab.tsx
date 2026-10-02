import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Trash2, Inbox, User, Calendar } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { ItemCard, ItemList, Toolbar, Pill, GhostButton, IconAction, EmptyState, Loading } from "@/app/components/entreprise/EntrepriseKit";
import { VSelect } from "@/app/components/common/Select";
import { listCompanyEmployees, studentNameMap } from "@/app/lib/entreprise/companyEmployees";
import { listCompanyFileCategories, type CompanyFileCategoryRow } from "@/app/lib/entreprise/companyFileCategories";
import {
  listCompanyStudentUploads, getCompanyStudentUploadUrl, deleteCompanyStudentUpload,
  type CompanyStudentUploadRow,
} from "@/app/lib/entreprise/companyStudentUploads";

const ALL = "all";
const NONE = "none";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Documents envoyés par les collaborateurs depuis leur espace ("Mes
// fichiers"), avec le nom de l'expéditeur et des filtres. Les catégories
// proposées aux élèves se gèrent dans l'onglet "Catégories".
export function CompanyStudentUploadsTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const [uploads, setUploads] = useState<CompanyStudentUploadRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [categories, setCategories] = useState<CompanyFileCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentFilter, setStudentFilter] = useState(ALL);
  const [categoryFilter, setCategoryFilter] = useState(ALL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ups, employees, cats] = await Promise.all([
          listCompanyStudentUploads(companyId), listCompanyEmployees(companyId), listCompanyFileCategories(companyId),
        ]);
        if (cancelled) return;
        setUploads(ups);
        setNames(studentNameMap(employees));
        setCategories(cats);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger les documents des élèves.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  const nameOf = (studentId: string) => names.get(studentId) ?? "Collaborateur inconnu";

  const studentOptions = useMemo(() => {
    const ids = [...new Set(uploads.map((u) => u.studentId))];
    return [{ value: ALL, label: "Tous les collaborateurs" }, ...ids.map((id) => ({ value: id, label: nameOf(id) })).sort((a, b) => a.label.localeCompare(b.label))];
  }, [uploads, names]);
  const categoryOptions = [
    { value: ALL, label: "Toutes les catégories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
    { value: NONE, label: "Sans catégorie" },
  ];

  const visible = uploads.filter((u) =>
    (studentFilter === ALL || u.studentId === studentFilter)
    && (categoryFilter === ALL || (categoryFilter === NONE ? !u.categoryId : u.categoryId === categoryFilter)));

  const handleOpen = async (upload: CompanyStudentUploadRow) => {
    try {
      window.open(await getCompanyStudentUploadUrl(upload.storagePath), "_blank", "noopener");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'ouvrir ce fichier.");
    }
  };

  const handleDelete = async (upload: CompanyStudentUploadRow) => {
    if (!confirm(`Supprimer "${upload.fileName}" envoyé par ${nameOf(upload.studentId)} ?`)) return;
    try {
      await deleteCompanyStudentUpload(upload.id, upload.storagePath);
      setUploads((rows) => rows.filter((r) => r.id !== upload.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer ce fichier.");
    }
  };

  return (
    <div className="space-y-5 pt-2">
      <Toolbar summary={`${visible.length} document${visible.length > 1 ? "s" : ""}${visible.length !== uploads.length ? ` sur ${uploads.length}` : ""}`} />

      {!!uploads.length && (
        <div className="grid sm:grid-cols-2 gap-3">
          <VSelect sm value={studentFilter} onValueChange={setStudentFilter} options={studentOptions} />
          <VSelect sm value={categoryFilter} onValueChange={setCategoryFilter} options={categoryOptions} />
        </div>
      )}

      {loading && <Loading />}
      {!loading && !uploads.length && (
        <EmptyState Icon={Inbox} title="Aucun document reçu pour l'instant"
          hint="Les collaborateurs envoient leurs fichiers depuis la rubrique « Mes fichiers » de leur espace. Ils apparaîtront ici." />
      )}
      {!loading && !!uploads.length && !visible.length && <p className="text-sm" style={{ color: th.fg3 }}>Aucun document ne correspond à ces filtres.</p>}

      <ItemList>
        {visible.map((u, i) => (
          <ItemCard key={u.id} index={i} Icon={FileText} title={u.fileName} onClick={() => void handleOpen(u)}
            pills={<>
              <Pill Icon={User}>{nameOf(u.studentId)}</Pill>
              <Pill tone={u.categoryName ? "hue" : "muted"}>{u.categoryName ?? "Sans catégorie"}</Pill>
              <Pill tone="muted" Icon={Calendar}>{formatDate(u.createdAt)}</Pill>
            </>}
            actions={<>
              <GhostButton sm Icon={Download} onClick={() => void handleOpen(u)}>Ouvrir</GhostButton>
              <IconAction Icon={Trash2} tone="danger" onClick={() => void handleDelete(u)} title="Supprimer" />
            </>} />
        ))}
      </ItemList>
    </div>
  );
}
