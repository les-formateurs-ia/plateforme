import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { VSwitch } from "@/app/components/common/VSwitch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import {
  listCompanyHtmlExercises, createCompanyHtmlExercise, updateCompanyHtmlExercise,
  toggleCompanyHtmlExerciseVisibility, deleteCompanyHtmlExercise,
  type CompanyHtmlExerciseRow,
} from "@/app/lib/entreprise/companyHtmlExercises";

export function CompanyHtmlExercisesTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const { user } = useAuth();

  const [exercises, setExercises] = useState<CompanyHtmlExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyHtmlExerciseRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [html, setHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setExercises(await listCompanyHtmlExercises(companyId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les exercices HTML.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setHtml("");
    setPreviewHtml("");
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: CompanyHtmlExerciseRow) => {
    setEditing(row);
    setName(row.name);
    setDescription(row.description ?? "");
    setHtml(row.htmlContent);
    setPreviewHtml(row.htmlContent);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim() || !html.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), description: description.trim() || null, htmlContent: html.trim() };
      if (editing) await updateCompanyHtmlExercise(editing.id, payload);
      else await createCompanyHtmlExercise(companyId, payload, user.id);
      setDialogOpen(false);
      await load();
      toast.success("Exercice HTML enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row: CompanyHtmlExerciseRow, visible: boolean) => {
    setExercises((rows) => rows.map((r) => (r.id === row.id ? { ...r, isVisible: visible } : r)));
    try {
      await toggleCompanyHtmlExerciseVisibility(row.id, visible);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour la visibilité.");
      setExercises((rows) => rows.map((r) => (r.id === row.id ? { ...r, isVisible: !visible } : r)));
    }
  };

  const handleDelete = async (row: CompanyHtmlExerciseRow) => {
    if (!confirm(`Supprimer "${row.name}" ?`)) return;
    try {
      await deleteCompanyHtmlExercise(row.id);
      setExercises((rows) => rows.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer cet exercice.");
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: th.fg3 }}>{exercises.length} exercice{exercises.length > 1 ? "s" : ""} HTML</p>
        <ShimBtn sm onClick={openCreate}><span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" />Nouvel exercice</span></ShimBtn>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && !exercises.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucun exercice pour l'instant.</div></GCard>}

      <div className="space-y-3">
        {exercises.map((ex) => (
          <GCard key={ex.id}>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{ex.name}</div>
                {ex.description && <div className="text-xs mt-0.5 truncate" style={{ color: th.fg3 }}>{ex.description}</div>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: th.fg3 }}>
                  Afficher <VSwitch checked={ex.isVisible} onCheckedChange={(v) => void handleToggle(ex, v)} />
                </label>
                <VBtn sm onClick={() => openEdit(ex)}><Pencil className="w-3.5 h-3.5" /></VBtn>
                <button onClick={() => void handleDelete(ex)} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ color: "#fbc2ad" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </GCard>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'exercice HTML" : "Nouvel exercice HTML"}</DialogTitle>
            <DialogDescription>Colle le code HTML de l'exercice — l'élève l'ouvrira tel quel.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="space-y-3 min-w-0">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'exercice" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Consigne affichée à l'élève (optionnel)" className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none" />
              <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={12} placeholder="Colle le code HTML ici..." className="w-full rounded-xl px-4 py-3 text-xs g-input resize-none font-mono" />
              <VBtn sm onClick={() => setPreviewHtml(html)} disabled={!html.trim()}>
                <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Aperçu</span>
              </VBtn>
              {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
            </div>
            <div className="min-h-[320px] rounded-xl overflow-hidden relative" style={{ background: "#fff", border: `1px solid ${th.sep}` }}>
              {previewHtml ? (
                <iframe key={previewHtml} srcDoc={previewHtml} sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox" title="Aperçu" className="absolute inset-0 w-full h-full border-0 bg-white" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: "#64748b" }}>Aperçu</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <ShimBtn onClick={handleSave} disabled={!name.trim() || !html.trim() || saving}>{saving ? "Enregistrement..." : "Enregistrer"}</ShimBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
