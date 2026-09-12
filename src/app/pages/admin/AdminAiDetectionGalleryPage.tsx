import { useEffect, useState, type ChangeEvent } from "react";
import { Plus, Pencil, Trash2, ScanEye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import {
  listAiDetectionImagesAdmin, createAiDetectionImage, updateAiDetectionImage, deleteAiDetectionImage,
  type AiDetectionImage,
} from "@/app/lib/aiDetectionImages";

const RED = "#f87171";

function ImageDialog({ open, onOpenChange, image, onSaved }: {
  open: boolean; onOpenChange: (open: boolean) => void; image?: AiDetectionImage; onSaved: () => void;
}) {
  const th = useTh();
  const isEditing = !!image;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAi, setIsAi] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreviewUrl(image?.imageUrl ?? null);
    setIsAi(image?.isAi ?? false);
    setExplanation(image?.explanation ?? "");
    setError(null);
  }, [open, image]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const isValid = (isEditing || !!file) && explanation.trim().length > 0;
  const busy = saving || deleting;

  const handleSave = async () => {
    if (!isValid || busy) return;
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateAiDetectionImage(image.id, { isAi, explanation: explanation.trim(), ...(file ? { file } : {}) });
      } else if (file) {
        await createAiDetectionImage({ file, isAi, explanation: explanation.trim() });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!image || busy) return;
    if (!confirm("Supprimer définitivement cette image ?")) return;
    setDeleting(true);
    try {
      await deleteAiDetectionImage(image.id);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'image" : "Ajouter une image"}</DialogTitle>
          <DialogDescription>Upload une image, indique si elle est générée par IA, et explique les indices à repérer.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.navAC }}>Image</label>
            <div className="rounded-xl overflow-hidden mb-2" style={{ background: "#000", aspectRatio: "1/1", maxWidth: 220 }}>
              {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" />}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)", border: `1px solid ${th.inputB}`, color: th.fg }}>
                {isEditing ? "Remplacer l'image" : "Choisir une image"}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.navAC }}>Statut</label>
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
              {([[false, "Réelle"], [true, "Générée par IA"]] as const).map(([v, label]) => {
                const active = isAi === v;
                return (
                  <button key={String(v)} type="button" onClick={() => setIsAi(v)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={active ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff" } : { color: th.fg2, background: "transparent" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.navAC }}>Explication</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={4}
              placeholder="Ex : Regarde le reflet dans les yeux et la déformation des doigts…"
              className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none" />
          </div>

          {error && <p className="text-xs" style={{ color: RED }}>{error}</p>}
        </div>

        <DialogFooter className="flex items-center sm:justify-between gap-2">
          {isEditing ? (
            <VBtn sm onClick={handleDelete} disabled={busy}>
              <span className="flex items-center gap-1.5" style={{ color: "#fbc2ad" }}><Trash2 className="w-3.5 h-3.5" />{deleting ? "Suppression…" : "Supprimer"}</span>
            </VBtn>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenChange(false)} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ background: "transparent", border: `1px solid ${th.sep}`, color: th.fg3 }}>
              Annuler
            </button>
            <ShimBtn sm onClick={handleSave} disabled={!isValid || busy}>{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminAiDetectionGalleryPage() {
  const th = useTh();
  const [images, setImages] = useState<AiDetectionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AiDetectionImage | undefined>(undefined);

  const reload = () => {
    setLoading(true);
    listAiDetectionImagesAdmin()
      .then(setImages)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Impossible de charger la galerie."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const openCreate = () => { setEditing(undefined); setDialogOpen(true); };
  const openEdit = (img: AiDetectionImage) => { setEditing(img); setDialogOpen(true); };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}><ScanEye className="w-5 h-5" /><GT>Galerie Détection Image IA</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Gère les images du quiz "Réelle ou générée par IA ?" côté élève.</p>
        </div>
        <ShimBtn sm onClick={openCreate}><span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Ajouter une image</span></ShimBtn>
      </div>

      {loading && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Chargement…</div></GCard>}
      {!loading && loadError && <GCard><div className="p-6 text-sm" style={{ color: RED }}>{loadError}</div></GCard>}
      {!loading && !loadError && images.length === 0 && (
        <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucune image pour le moment — ajoute la première.</div></GCard>
      )}

      {!loading && !loadError && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <GCard key={img.id}>
              <div className="relative" style={{ aspectRatio: "1/1", background: "#000" }}>
                <img src={img.imageUrl} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: img.isAi ? "rgba(251,194,173,0.9)" : "rgba(106,222,177,0.9)", color: "#06121c" }}>
                  {img.isAi ? "IA" : "Réelle"}
                </span>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs line-clamp-2" style={{ color: th.fg3 }}>{img.explanation}</p>
                <button onClick={() => openEdit(img)} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: th.navAC }}>
                  <Pencil className="w-3 h-3" />Modifier
                </button>
              </div>
            </GCard>
          ))}
        </div>
      )}

      <ImageDialog open={dialogOpen} onOpenChange={setDialogOpen} image={editing} onSaved={reload} />
    </div>
  );
}
