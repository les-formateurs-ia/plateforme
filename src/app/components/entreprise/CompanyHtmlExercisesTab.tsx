import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, Code2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import {
  ItemCard, ItemList, Toolbar, HueButton, GhostButton, IconAction, VisibilityToggle, EmptyState, Loading, ErrorText, DialogHero,
} from "@/app/components/entreprise/EntrepriseKit";
import {
  listCompanyHtmlExercises, createCompanyHtmlExercise, updateCompanyHtmlExercise,
  toggleCompanyHtmlExerciseVisibility, deleteCompanyHtmlExercise,
  type CompanyHtmlExerciseRow,
} from "@/app/lib/entreprise/companyHtmlExercises";
import { useHtmlTheme } from "@/app/lib/useHtmlTheme";

export function CompanyHtmlExercisesTab({ companyId }: { companyId: string }) {
  const th = useTh();
  // Aperçu dans la modale : fond racine = fond de la modale (carte).
  const htmlTheme = useHtmlTheme("card");
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
    <div className="space-y-5 pt-2">
      <Toolbar summary={`${exercises.length} exercice${exercises.length > 1 ? "s" : ""} HTML`}>
        <HueButton Icon={Plus} onClick={openCreate}>Nouvel exercice</HueButton>
      </Toolbar>

      {loading && <Loading />}
      {!loading && !exercises.length && (
        <EmptyState Icon={Code2} title="Aucun exercice pour l'instant" hint="Collez le code HTML d'un exercice interactif : l'élève l'ouvrira tel quel."
          action={<HueButton Icon={Plus} onClick={openCreate}>Nouvel exercice</HueButton>} />
      )}

      <ItemList>
        {exercises.map((ex, i) => (
          <ItemCard key={ex.id} index={i} Icon={Code2} title={ex.name} subtitle={ex.description ?? undefined} onClick={() => openEdit(ex)}
            actions={<>
              <VisibilityToggle checked={ex.isVisible} onChange={(v) => void handleToggle(ex, v)} />
              <IconAction Icon={Pencil} onClick={() => openEdit(ex)} title="Modifier" />
              <IconAction Icon={Trash2} tone="danger" onClick={() => void handleDelete(ex)} title="Supprimer" />
            </>} />
        ))}
      </ItemList>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHero Icon={Code2} title={editing ? "Modifier l'exercice HTML" : "Nouvel exercice HTML"} desc="Colle le code HTML de l'exercice — l'élève l'ouvrira tel quel." />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="space-y-3 min-w-0">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'exercice" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Consigne affichée à l'élève (optionnel)" className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none" />
              <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={12} placeholder="Colle le code HTML ici..." className="w-full rounded-xl px-4 py-3 text-xs g-input resize-none font-mono" />
              <GhostButton sm Icon={Eye} onClick={() => setPreviewHtml(html)} disabled={!html.trim()}>Aperçu</GhostButton>
              {error && <ErrorText>{error}</ErrorText>}
            </div>
            <div className="min-h-[320px] rounded-2xl overflow-hidden relative" style={{ background: htmlTheme.background, border: `1px solid ${th.sep}` }}>
              {previewHtml ? (
                <iframe key={previewHtml} srcDoc={htmlTheme.withTheme(previewHtml)} sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-downloads" title="Aperçu" className="absolute inset-0 w-full h-full border-0" style={{ background: htmlTheme.background }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: th.fg3 }}>Aperçu</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <HueButton onClick={handleSave} disabled={!name.trim() || !html.trim() || saving}>{saving ? "Enregistrement..." : "Enregistrer"}</HueButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
