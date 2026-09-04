import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { listExerciseTags, createExerciseTag, renameExerciseTag, deleteExerciseTag, type ExerciseTag } from "@/app/lib/exerciseTags";

const RED = "#e5484d";

// Référentiel des tags "Exercices pour vous" — réservé à l'admin (voir
// is_admin() côté RLS). Admin et formateur les attribuent ensuite librement
// aux exercices depuis HtmlExerciseEditDialog.
export function TagManagerDialog({ open, onOpenChange, onChanged }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const th = useTh();
  const { user } = useAuth();
  const [tags, setTags] = useState<ExerciseTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTags(await listExerciseTags());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les tags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setNewName("");
    setEditingId(null);
    setError(null);
    void load();
  }, [open]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || !user || creating) return;
    setCreating(true);
    setError(null);
    try {
      const tag = await createExerciseTag(name, user.id);
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer ce tag.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (tag: ExerciseTag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setError(null);
  };

  const handleRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setBusyId(id);
    setError(null);
    try {
      await renameExerciseTag(id, name);
      setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de renommer ce tag.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (tag: ExerciseTag) => {
    if (!confirm(`Supprimer le tag "${tag.name}" ? Il sera retiré de tous les exercices.`)) return;
    setBusyId(tag.id);
    setError(null);
    try {
      await deleteExerciseTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer ce tag.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les tags</DialogTitle>
          <DialogDescription>Crée, renomme ou supprime les tags utilisés pour classer les exercices HTML.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
            placeholder="Nouveau tag..."
            className="flex-1 rounded-xl px-4 py-2.5 text-sm g-input"
          />
          <ShimBtn sm onClick={handleCreate} disabled={!newName.trim() || creating}>
            <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Ajouter</span>
          </ShimBtn>
        </div>

        {error && <p className="text-xs" style={{ color: RED }}>{error}</p>}

        {loading ? (
          <p className="text-xs py-4 text-center" style={{ color: th.fg3 }}>Chargement...</p>
        ) : tags.length ? (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                {editingId === tag.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleRename(tag.id); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                      className="flex-1 rounded-lg px-2.5 py-1.5 text-sm g-input"
                    />
                    <button onClick={() => handleRename(tag.id)} disabled={busyId === tag.id || !editingName.trim()} className="text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}>OK</button>
                    <button onClick={() => setEditingId(null)} className="hover:opacity-70"><X className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold truncate" style={{ color: th.fg }}>{tag.name}</span>
                    <button onClick={() => startEdit(tag)} disabled={busyId === tag.id} className="hover:opacity-70"><Pencil className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
                    <button onClick={() => handleDelete(tag)} disabled={busyId === tag.id} className="hover:opacity-70"><Trash2 className="w-3.5 h-3.5" style={{ color: "#fbc2ad" }} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs py-4 text-center" style={{ color: th.fg3 }}>Aucun tag pour l'instant.</p>
        )}

        <div className="flex justify-end pt-1">
          <VBtn sm onClick={() => onOpenChange(false)}>Fermer</VBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
