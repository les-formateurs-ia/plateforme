import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { Checkbox } from "@/app/components/ui/checkbox";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { listStudentCards, type PersonCard } from "@/app/lib/planning";
import {
  createHtmlExercise, updateHtmlExercise, deleteHtmlExercise, getExerciseAssignees,
  type HtmlExerciseRow,
} from "@/app/lib/htmlExercises";
import type { ExerciseVisibility } from "@/app/lib/supabase/database.types";

function personName(p: PersonCard): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.email;
}

export function HtmlExerciseEditDialog({
  open, onOpenChange, exercise, defaultCheckedStudentId, onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: HtmlExerciseRow;
  defaultCheckedStudentId?: string;
  onSaved: () => void;
}) {
  const th = useTh();
  const { user } = useAuth();
  const isEditing = !!exercise;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ExerciseVisibility>("private");
  const [students, setStudents] = useState<PersonCard[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(exercise?.name ?? "");
    setDescription(exercise?.description ?? "");
    setVisibility(exercise?.visibility ?? "private");
    setError(null);
    setLoading(true);
    (async () => {
      const [studentRows, assigneeIds] = await Promise.all([
        listStudentCards(),
        exercise ? getExerciseAssignees(exercise.id) : Promise.resolve<string[]>([]),
      ]);
      setStudents(studentRows);
      setSelected(new Set(exercise ? assigneeIds : defaultCheckedStudentId ? [defaultCheckedStudentId] : []));
      setLoading(false);
    })();
  }, [open, exercise, defaultCheckedStudentId]);

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user || !name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await updateHtmlExercise(exercise.id, {
          name: name.trim(), description: description.trim() || null, visibility,
          studentIds: Array.from(selected), updatedBy: user.id,
        });
      } else {
        await createHtmlExercise({
          name: name.trim(), description: description.trim() || null, visibility,
          studentIds: Array.from(selected), createdBy: user.id,
        });
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
    if (!exercise || deleting) return;
    if (!confirm("Supprimer définitivement cet exercice ? L'historique des élèves sur cet exercice sera aussi supprimé.")) return;
    setDeleting(true);
    try {
      await deleteHtmlExercise(exercise.id);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && !deleting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'exercice" : "Nouvel exercice HTML"}</DialogTitle>
          <DialogDescription>Défini l'énoncé et choisis qui peut le voir dans "Exercices pour vous".</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex. Landing page SaaS" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Consigne (affichée à l'élève)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ce que l'élève doit construire…" className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Visibilité</label>
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
              {([["global", "Globale"], ["private", "Privée"]] as const).map(([v, label]) => {
                const active = visibility === v;
                return (
                  <button key={v} type="button" onClick={() => setVisibility(v)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={active
                      ? { background: "linear-gradient(135deg,#b58de0,#dbacf0)", color: "#fff" }
                      : { color: th.fg2, background: "transparent" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {visibility === "private" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Élèves concernés</label>
              {loading ? (
                <p className="text-xs" style={{ color: th.fg3 }}>Chargement…</p>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl p-2" style={{ border: `1px solid ${th.sep}` }}>
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:opacity-80" style={{ color: th.fg2 }}>
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                      <span className="text-sm truncate">{personName(s)}</span>
                    </label>
                  ))}
                  {!students.length && <p className="text-xs px-2 py-1" style={{ color: th.fg3 }}>Aucun élève pour l'instant.</p>}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
        </div>

        <DialogFooter className="flex items-center sm:justify-between gap-2">
          {isEditing ? (
            <VBtn sm onClick={handleDelete} disabled={saving || deleting}>
              <span className="flex items-center gap-1.5" style={{ color: "#fbc2ad" }}><Trash2 className="w-3.5 h-3.5" />{deleting ? "Suppression…" : "Supprimer"}</span>
            </VBtn>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenChange(false)} disabled={saving || deleting} className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ background: "transparent", border: `1px solid ${th.sep}`, color: th.fg3 }}>
              Annuler
            </button>
            <ShimBtn sm onClick={handleSave} disabled={saving || deleting || !name.trim()}>{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
