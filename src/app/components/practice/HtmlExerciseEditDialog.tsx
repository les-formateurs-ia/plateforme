import { useEffect, useState, type ChangeEvent } from "react";
import { Eye, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { Checkbox } from "@/app/components/ui/checkbox";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { SaveButton, type SaveButtonState } from "@/app/components/common/SaveButton";
import { ExerciseTagPill } from "@/app/components/practice/ExerciseTagPill";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { listStudentCards, type PersonCard } from "@/app/lib/planning";
import { normalizeSmartQuotes } from "@/app/lib/platformHtml";
import {
  createHtmlExercise, updateHtmlExercise, deleteHtmlExercise, getExerciseAssignees,
  type HtmlExerciseRow,
} from "@/app/lib/htmlExercises";
import { listExerciseTags, getTagIdsForExercise, setExerciseTags, type ExerciseTag } from "@/app/lib/exerciseTags";
import type { ExerciseVisibility } from "@/app/lib/supabase/database.types";

function personName(p: PersonCard): string {
  return [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.email;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
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

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [htmlDraft, setHtmlDraft] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [visibility, setVisibility] = useState<ExerciseVisibility>("private");
  const [students, setStudents] = useState<PersonCard[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [availableTags, setAvailableTags] = useState<ExerciseTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [original, setOriginal] = useState<{
    name: string; description: string; htmlDraft: string; visibility: ExerciseVisibility; selected: Set<string>; selectedTags: Set<string>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [deleting, setDeleting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const sourceHtml = exercise?.htmlContent ?? "";
    setMode(exercise ? "view" : "edit");
    setName(exercise?.name ?? "");
    setDescription(exercise?.description ?? "");
    setHtmlDraft(sourceHtml);
    setPreviewHtml(sourceHtml);
    setVisibility(exercise?.visibility ?? "private");
    setFileError(null);
    setError(null);
    setSaveState("idle");
    setLoading(true);
    (async () => {
      const [studentRows, assigneeIds, tags, tagIds] = await Promise.all([
        listStudentCards(),
        exercise ? getExerciseAssignees(exercise.id) : Promise.resolve<string[]>([]),
        listExerciseTags(),
        exercise ? getTagIdsForExercise(exercise.id) : Promise.resolve<string[]>([]),
      ]);
      const initialSelected = new Set(exercise ? assigneeIds : defaultCheckedStudentId ? [defaultCheckedStudentId] : []);
      const initialSelectedTags = new Set(tagIds);
      setStudents(studentRows);
      setSelected(initialSelected);
      setAvailableTags(tags);
      setSelectedTags(initialSelectedTags);
      setOriginal({
        name: exercise?.name ?? "",
        description: exercise?.description ?? "",
        htmlDraft: sourceHtml,
        visibility: exercise?.visibility ?? "private",
        selected: initialSelected,
        selectedTags: initialSelectedTags,
      });
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

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    try {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        const normalized = normalizeSmartQuotes(value);
        setHtmlDraft(normalized);
        setPreviewHtml(normalized);
      } else {
        const text = normalizeSmartQuotes(await file.text());
        setHtmlDraft(text);
        setPreviewHtml(text);
      }
    } catch (err) {
      console.error(err);
      setFileError("Impossible de lire ce fichier. Utilise un fichier .txt, .html, .htm ou .docx.");
    }
  };

  const handlePreview = () => {
    setPreviewHtml(htmlDraft);
  };

  const isValid = !!name.trim() && !!htmlDraft.trim();
  const isDirty = !isEditing || !original
    ? true
    : name !== original.name
      || description !== original.description
      || htmlDraft !== original.htmlDraft
      || visibility !== original.visibility
      || !setsEqual(selected, original.selected)
      || !setsEqual(selectedTags, original.selectedTags);

  const buttonState: SaveButtonState =
    saveState === "saving" ? "saving"
    : saveState === "saved" ? "saved"
    : isDirty && isValid ? "active"
    : "disabled";

  const handleSave = async () => {
    if (!user || !isValid || buttonState !== "active") return;
    setSaveState("saving");
    setError(null);
    try {
      const tagIds = Array.from(selectedTags);
      if (isEditing) {
        await updateHtmlExercise(exercise.id, {
          name: name.trim(),
          description: description.trim() || null,
          htmlContent: htmlDraft.trim(),
          visibility,
          studentIds: Array.from(selected),
          updatedBy: user.id,
        });
        await setExerciseTags(exercise.id, tagIds, user.id);
      } else {
        const created = await createHtmlExercise({
          name: name.trim(),
          description: description.trim() || null,
          htmlContent: htmlDraft.trim(),
          visibility,
          studentIds: Array.from(selected),
          createdBy: user.id,
        });
        await setExerciseTags(created.id, tagIds, user.id);
      }
      onSaved();
      setSaveState("saved");
      setTimeout(() => onOpenChange(false), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setSaveState("idle");
    }
  };

  const handleCancelEdit = () => {
    if (!original) { onOpenChange(false); return; }
    setName(original.name);
    setDescription(original.description);
    setHtmlDraft(original.htmlDraft);
    setPreviewHtml(original.htmlDraft);
    setVisibility(original.visibility);
    setSelected(new Set(original.selected));
    setSelectedTags(new Set(original.selectedTags));
    setError(null);
    if (isEditing) setMode("view"); else onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!exercise || deleting) return;
    if (!confirm("Supprimer definitivement cet exercice ? L'historique des eleves sur cet exercice sera aussi supprime.")) return;
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

  const busy = saveState === "saving" || deleting;
  const assignedStudents = students.filter((s) => selected.has(s.id));
  const viewing = mode === "view" && isEditing;

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{viewing ? "Exercice HTML" : isEditing ? "Modifier l'exercice HTML" : "Nouvel exercice HTML"}</DialogTitle>
          <DialogDescription>
            {viewing ? "Consulte l'exercice et qui y a accès, ou modifie-le." : "Ajoute le HTML source, affiche-le comme dans le Playground, puis choisis qui peut l'utiliser."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-3 min-w-0">
            {viewing ? (
              <>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Nom</div>
                  <div className="text-sm font-semibold" style={{ color: th.fg }}>{name}</div>
                </div>
                {description && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Consigne affichee a l'eleve</div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: th.fg2 }}>{description}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Visibilite</div>
                  <p className="text-sm" style={{ color: th.fg2 }}>{visibility === "global" ? "Globale" : "Privee"}</p>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Tags</div>
                  {selectedTags.size ? (
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.filter((t) => selectedTags.has(t.id)).map((t) => <ExerciseTagPill key={t.id} label={t.name} />)}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: th.fg3 }}>Aucun tag.</p>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Eleves ayant acces</div>
                  {loading ? (
                    <p className="text-xs" style={{ color: th.fg3 }}>Chargement...</p>
                  ) : visibility === "global" ? (
                    <p className="text-sm" style={{ color: th.fg2 }}>Visible par tous les eleves.</p>
                  ) : assignedStudents.length ? (
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl p-2" style={{ border: `1px solid ${th.sep}` }}>
                      {assignedStudents.map((s) => (
                        <div key={s.id} className="px-2 py-1.5 text-sm truncate" style={{ color: th.fg2 }}>{personName(s)}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: th.fg3 }}>Aucun eleve pour l'instant.</p>
                  )}
                </div>
                {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Nom</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex. Landing page SaaS" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Consigne affichee a l'eleve</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ce que l'eleve doit faire dans cet exercice..." className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Code HTML de l'exercice</label>
                  <textarea
                    value={htmlDraft}
                    onChange={(e) => setHtmlDraft(e.target.value)}
                    rows={12}
                    placeholder="Colle le code HTML ici (Ctrl+V)..."
                    className="w-full rounded-xl px-4 py-3 text-xs g-input resize-none font-mono"
                  />
                  {fileError && <p className="text-xs mt-2 text-[#fbc2ad]">{fileError}</p>}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <label className="cursor-pointer">
                      <input type="file" accept=".txt,.html,.htm,.docx" className="hidden" onChange={handleFileChange} />
                      <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                        style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)", border: `1px solid ${th.inputB}`, color: th.fg }}>
                        <Upload className="w-3.5 h-3.5" />Charger un fichier
                      </span>
                    </label>
                    <VBtn sm onClick={handlePreview} disabled={!htmlDraft.trim()}>
                      <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Afficher</span>
                    </VBtn>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Visibilite</label>
                  <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                    {([["global", "Globale"], ["private", "Privee"]] as const).map(([v, label]) => {
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

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Tags</label>
                  {loading ? (
                    <p className="text-xs" style={{ color: th.fg3 }}>Chargement...</p>
                  ) : availableTags.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map((t) => (
                        <ExerciseTagPill key={t.id} label={t.name} active={selectedTags.has(t.id)} onClick={() => toggleTag(t.id)} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: th.fg3 }}>Aucun tag pour l'instant — un admin peut en creer.</p>
                  )}
                </div>

                {visibility === "private" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Eleves concernes</label>
                    {loading ? (
                      <p className="text-xs" style={{ color: th.fg3 }}>Chargement...</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl p-2" style={{ border: `1px solid ${th.sep}` }}>
                        {students.map((s) => (
                          <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:opacity-80" style={{ color: th.fg2 }}>
                            <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                            <span className="text-sm truncate">{personName(s)}</span>
                          </label>
                        ))}
                        {!students.length && <p className="text-xs px-2 py-1" style={{ color: th.fg3 }}>Aucun eleve pour l'instant.</p>}
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
              </>
            )}
          </div>

          <div className="min-h-[360px] rounded-xl overflow-hidden relative" style={{ background: "#fff", border: `1px solid ${th.sep}` }}>
            {previewHtml ? (
              <iframe
                key={previewHtml}
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                title="Apercu HTML"
                className="absolute inset-0 w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: "#64748b" }}>Apercu</div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center sm:justify-between gap-2">
          {isEditing ? (
            <VBtn sm onClick={handleDelete} disabled={busy}>
              <span className="flex items-center gap-1.5" style={{ color: "#fbc2ad" }}><Trash2 className="w-3.5 h-3.5" />{deleting ? "Suppression..." : "Supprimer"}</span>
            </VBtn>
          ) : <span />}
          <div className="flex items-center gap-2">
            {viewing ? (
              <>
                <button onClick={() => onOpenChange(false)} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: "transparent", border: `1px solid ${th.sep}`, color: th.fg3 }}>
                  Fermer
                </button>
                <ShimBtn sm onClick={() => setMode("edit")} disabled={busy}>Modifier</ShimBtn>
              </>
            ) : (
              <>
                <button onClick={handleCancelEdit} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ background: "transparent", border: `1px solid ${th.sep}`, color: th.fg3 }}>
                  Annuler
                </button>
                <SaveButton state={buttonState} onClick={handleSave} />
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
