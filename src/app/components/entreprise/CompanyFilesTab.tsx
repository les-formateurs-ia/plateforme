import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Eye, FileText } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { VSwitch } from "@/app/components/common/VSwitch";
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
    <div className="space-y-4 pt-4">
      <GCard>
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: th.fg3 }}>Déposer un fichier</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du fichier" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optionnel)" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileChange} />
              <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)", border: `1px solid ${th.inputB}`, color: th.fg }}>
                <Upload className="w-3.5 h-3.5" />{pendingFile ? pendingFile.name : "Choisir un fichier"}
              </span>
            </label>
            <ShimBtn sm onClick={handleUpload} disabled={!pendingFile || !name.trim() || uploading}>{uploading ? "Envoi..." : "Déposer"}</ShimBtn>
          </div>
          {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
        </div>
      </GCard>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && !files.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucun fichier pour l'instant.</div></GCard>}

      <div className="space-y-3">
        {files.map((f) => (
          <GCard key={f.id}>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{f.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>{f.description || formatSize(f.fileSize)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: th.fg3 }}>
                  Afficher <VSwitch checked={f.isVisible} onCheckedChange={(v) => void handleToggle(f, v)} />
                </label>
                <VBtn sm onClick={() => void handleDownload(f)}><Eye className="w-3.5 h-3.5" /></VBtn>
                <button onClick={() => void handleDelete(f)} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ color: "#fbc2ad" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </GCard>
        ))}
      </div>
    </div>
  );
}
