import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle, Pencil } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { VSwitch } from "@/app/components/common/VSwitch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import {
  listPositioningTests, createPositioningTest, togglePositioningTestVisibility, deletePositioningTest, renamePositioningTest,
  getPositioningQuestions, savePositioningQuestions,
  type PositioningTestRow, type QuizQuestionDraft,
} from "@/app/lib/entreprise/companyPositioning";

const EMPTY_OPTION = () => ({ label: "", isCorrect: false });
const EMPTY_QUESTION = (): QuizQuestionDraft => ({ question: "", explanation: "", options: [EMPTY_OPTION(), EMPTY_OPTION()] });

export function CompanyPositioningTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const { user } = useAuth();

  const [tests, setTests] = useState<PositioningTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTests(await listPositioningTests(companyId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les tests de positionnement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setQuestions([EMPTY_QUESTION()]);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = async (test: PositioningTestRow) => {
    setEditingId(test.id);
    setTitle(test.title);
    setError(null);
    setDialogOpen(true);
    setQuestions(await getPositioningQuestions(test.id));
  };

  const addQuestion = () => setQuestions((qs) => [...qs, EMPTY_QUESTION()]);
  const removeQuestion = (qIndex: number) => setQuestions((qs) => qs.filter((_, i) => i !== qIndex));
  const updateQuestion = (qIndex: number, patch: Partial<QuizQuestionDraft>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, ...patch } : q)));
  const addOption = (qIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, EMPTY_OPTION()] } : q)));
  const removeOption = (qIndex: number, oIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q)));
  const updateOptionLabel = (qIndex: number, oIndex: number, label: string) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? { ...o, label } : o)) } : q)));
  const setCorrectOption = (qIndex: number, oIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oIndex })) } : q)));

  const handleSave = async () => {
    if (!user || !title.trim() || saving) return;
    for (const q of questions) {
      if (q.question.trim() && !q.options.some((o) => o.isCorrect)) {
        setError(`La question "${q.question}" n'a pas de bonne réponse cochée.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const testId = editingId ?? await createPositioningTest(companyId, title.trim(), user.id);
      if (editingId) await renamePositioningTest(testId, title.trim());
      await savePositioningQuestions(testId, questions);
      setDialogOpen(false);
      await load();
      toast.success("Test de positionnement enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: PositioningTestRow) => {
    if (!confirm(`Supprimer le test "${test.title}" ?`)) return;
    try {
      await deletePositioningTest(test.id);
      setTests((rows) => rows.filter((r) => r.id !== test.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer ce test.");
    }
  };

  const handleToggle = async (test: PositioningTestRow, visible: boolean) => {
    setTests((rows) => rows.map((r) => (r.id === test.id ? { ...r, isVisible: visible } : r)));
    try {
      await togglePositioningTestVisibility(test.id, visible);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour la visibilité.");
      setTests((rows) => rows.map((r) => (r.id === test.id ? { ...r, isVisible: !visible } : r)));
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: th.fg3 }}>{tests.length} test{tests.length > 1 ? "s" : ""} de positionnement</p>
        <ShimBtn sm onClick={openCreate}><span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" />Créer un test</span></ShimBtn>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && !tests.length && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Aucun test pour l'instant.</div></GCard>}

      <div className="space-y-3">
        {tests.map((t) => (
          <GCard key={t.id}>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{t.title}</div>
                <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>{t.questionCount} question{t.questionCount > 1 ? "s" : ""}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: th.fg3 }}>
                  Afficher <VSwitch checked={t.isVisible} onCheckedChange={(v) => void handleToggle(t, v)} />
                </label>
                <VBtn sm onClick={() => void openEdit(t)}><Pencil className="w-3.5 h-3.5" /></VBtn>
                <button onClick={() => void handleDelete(t)} className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ color: "#fbc2ad" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </GCard>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le test" : "Nouveau test de positionnement"}</DialogTitle>
            <DialogDescription>QCM à répondre par les collaborateurs avant la formation.</DialogDescription>
          </DialogHeader>

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du test" className="w-full rounded-xl px-4 py-2.5 text-sm g-input" />

          <div className="flex items-center justify-between mt-2">
            <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: th.fg3 }}>Questions</h4>
            <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}>
              <Plus className="w-3.5 h-3.5" />Ajouter une question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="rounded-xl p-4" style={{ border: `1px solid ${th.sep}` }}>
                <div className="flex items-start gap-2 mb-3">
                  <input value={q.question} onChange={(e) => updateQuestion(qIndex, { question: e.target.value })} placeholder="Intitulé de la question"
                    className="flex-1 rounded-xl px-3 py-2 text-sm g-input" />
                  <button onClick={() => removeQuestion(qIndex)}><Trash2 className="w-4 h-4" style={{ color: "#fbc2ad" }} /></button>
                </div>
                <div className="space-y-2 mb-3">
                  {q.options.map((o, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <button onClick={() => setCorrectOption(qIndex, oIndex)} title="Marquer comme bonne réponse">
                        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: o.isCorrect ? "#6adeb1" : th.fg3 }} />
                      </button>
                      <input value={o.label} onChange={(e) => updateOptionLabel(qIndex, oIndex, e.target.value)} placeholder={`Réponse ${oIndex + 1}`}
                        className="flex-1 rounded-lg px-3 py-2 text-xs g-input" />
                      <button onClick={() => removeOption(qIndex, oIndex)}><Trash2 className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qIndex)} className="text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}>+ Ajouter une réponse</button>
                </div>
                <textarea value={q.explanation} onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })} placeholder="Explication affichée après réponse (optionnel)"
                  rows={2} className="w-full rounded-xl px-3 py-2 text-xs g-input resize-none" />
              </div>
            ))}
            {!questions.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucune question pour l'instant.</p>}
          </div>

          {error && <p className="text-xs" style={{ color: "#fbc2ad" }}>{error}</p>}
          <DialogFooter>
            <ShimBtn onClick={handleSave} disabled={!title.trim() || saving}>{saving ? "Enregistrement..." : "Enregistrer"}</ShimBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
