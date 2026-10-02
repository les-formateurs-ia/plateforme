import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Eye, FileText, CloudUpload } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import {
  Panel, ItemCard, ItemList, Toolbar, Pill, HueButton, IconAction, VisibilityToggle, EmptyState, Loading, ErrorText, KitHeading, useHue,
} from "@/app/components/entreprise/EntrepriseKit";
import {
  listCompanyFiles, uploadCompanyFile, toggleCompanyFileVisibility, deleteCompanyFile, getCompanyFileDownloadUrl,
  type CompanyFileRow,
} from "@/app/lib/entreprise/companyFiles";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function CompanyFilesTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const h = useHue();
  const { user } = useAuth();

  const [files, setFiles] = useState<CompanyFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setFiles(await listCompanyFiles(companyId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les fichiers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPendingFile(file);
    if (file && !name.trim()) setName(file.name);
  };

  const handleUpload = async () => {
    if (!user || !pendingFile || !name.trim() || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const created = await uploadCompanyFile(companyId, name.trim(), description.trim() || null, pendingFile, user.id);
      setFiles((rows) => [created, ...rows]);
      setName("");
      setDescription("");
      setPendingFile(null);
      toast.success("Fichier déposé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'envoi.");
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (file: CompanyFileRow, visible: boolean) => {
    setFiles((rows) => rows.map((r) => (r.id === file.id ? { ...r, isVisible: visible } : r)));
    try {
      await toggleCompanyFileVisibility(file.id, visible);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour la visibilité.");
      setFiles((rows) => rows.map((r) => (r.id === file.id ? { ...r, isVisible: !visible } : r)));
    }
  };

  const handleDelete = async (file: CompanyFileRow) => {
    if (!confirm(`Supprimer "${file.name}" ?`)) return;
    try {
      await deleteCompanyFile(file.id, file.storagePath);
      setFiles((rows) => rows.filter((r) => r.id !== file.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer ce fichier.");
    }
  };

  const handleDownload = async (file: CompanyFileRow) => {
    try {
      const url = await getCompanyFileDownloadUrl(file.storagePath);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de générer le lien de téléchargement.");
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <Panel watermark={CloudUpload}>
        <div className="p-5 sm:p-6 space-y-4">
          <KitHeading>Déposer un fichier pour les élèves</KitHeading>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du fichier" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optionnel)" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
          </div>
          <label className="block cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileChange} />
            <span className="flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-6 text-sm font-semibold text-center transition-all duration-200 hover:opacity-85"
              style={{ background: h.alpha(0.06), border: `1.5px dashed ${h.alpha(0.45)}`, color: th.fg }}>
              <Upload className="w-5 h-5" style={{ color: h.text }} />
              <span className="truncate max-w-full">{pendingFile ? pendingFile.name : "Cliquez pour choisir un fichier"}</span>
              {pendingFile && <span className="text-xs font-normal" style={{ color: th.fg3 }}>{formatSize(pendingFile.size)}</span>}
            </span>
          </label>
          {error && <ErrorText>{error}</ErrorText>}
          <HueButton Icon={Upload} onClick={handleUpload} disabled={!pendingFile || !name.trim() || uploading}>{uploading ? "Envoi..." : "Déposer"}</HueButton>
        </div>
      </Panel>

      <div>
        <Toolbar summary={`${files.length} fichier${files.length > 1 ? "s" : ""} déposé${files.length > 1 ? "s" : ""}`} />
        <div className="mt-3">
          {loading && <Loading />}
          {!loading && !files.length && <EmptyState Icon={FileText} title="Aucun fichier pour l'instant" hint="Les fichiers déposés ici apparaissent chez les élèves une fois rendus visibles." />}
          <ItemList>
            {files.map((f, i) => (
              <ItemCard key={f.id} index={i} Icon={FileText} title={f.name} subtitle={f.description ?? undefined}
                pills={f.fileSize ? <Pill>{formatSize(f.fileSize)}</Pill> : undefined}
                actions={<>
                  <VisibilityToggle checked={f.isVisible} onChange={(v) => void handleToggle(f, v)} />
                  <IconAction Icon={Eye} onClick={() => void handleDownload(f)} title="Ouvrir" />
                  <IconAction Icon={Trash2} tone="danger" onClick={() => void handleDelete(f)} title="Supprimer" />
                </>} />
            ))}
          </ItemList>
        </div>
      </div>
    </div>
  );
}
