import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { VSwitch } from "@/app/components/common/VSwitch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import {
  listSatisfactionTests, createSatisfactionTest, toggleSatisfactionTestVisibility, deleteSatisfactionTest, renameSatisfactionTest,
  getSatisfactionQuestions, saveSatisfactionQuestions,
  type SatisfactionTestRow, type SatisfactionQuestionDraft, type SatisfactionQuestionType,
} from "@/app/lib/entreprise/companySatisfaction";

const TYPE_LABEL: Record<SatisfactionQuestionType, string> = { qcm: "QCM", rating: "Note 1 à 5", text: "Texte libre" };
const EMPTY_QUESTION = (): SatisfactionQuestionDraft => ({ question: "", type: "text", options: [] });

export function CompanySatisfactionTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const { user } = useAuth();

  const [tests, setTests] = useState<SatisfactionTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<SatisfactionQuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTests(await listSatisfactionTests(companyId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les tests de satisfaction.");
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

  const openEdit = async (test: SatisfactionTestRow) => {
    setEditingId(test.id);
    setTitle(test.title);
    setError(null);
    setDialogOpen(true);
    setQuestions(await getSatisfactionQuestions(test.id));
  };

  const addQuestion = () => setQuestions((qs) => [...qs, EMPTY_QUESTION()]);
  const removeQuestion = (qIndex: number) => setQuestions((qs) => qs.filter((_, i) => i !== qIndex));
  const updateQuestion = (qIndex: number, patch: Partial<SatisfactionQuestionDraft>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, ...patch } : q)));
  const setType = (qIndex: number, type: SatisfactionQuestionType) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, type, options: type === "qcm" ? (q.options.length ? q.options : [{ label: "" }, { label: "" }]) : [] } : q)));
  const addOption = (qIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, { label: "" }] } : q)));
  const removeOption = (qIndex: number, oIndex: number) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q)));
  const updateOptionLabel = (qIndex: number, oIndex: number, label: string) =>
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? { ...o, label } : o)) } : q)));

  const handleSave = async () => {
    if (!user || !title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const testId = editingId ?? await createSatisfactionTest(companyId, title.trim(), user.id);
      if (editingId) await renameSatisfactionTest(testId, title.trim());
      await saveSatisfactionQuestions(testId, questions);
      setDialogOpen(false);
      await load();
      toast.success("Test de satisfaction enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: SatisfactionTestRow) => {
    if (!confirm(`Supprimer le test "${test.title}" ?`)) return;
    try {
      await deleteSatisfactionTest(test.id);
      setTests((rows) => rows.filter((r) => r.id !== test.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer ce test.");
    }
  };

  const handleToggle = async (test: SatisfactionTestRow, visible: boolean) => {
    setTests((rows) => rows.map((r) => (r.id === test.id ? { ...r, isVisible: visible } : r)));
    try {
      await toggleSatisfactionTestVisibility(test.id, visible);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de mettre à jour la visibilité.");
      setTests((rows) => rows.map((r) => (r.id === test.id ? { ...r, isVisible: !visible } : r)));
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: th.fg3 }}>{tests.length} test{tests.length > 1 ? "s" : ""} de satisfaction</p>
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
            <DialogTitle>{editingId ? "Modifier le test" : "Nouveau test de satisfaction"}</DialogTitle>
            <DialogDescription>QCM, note de 1 à 5, ou texte libre.</DialogDescription>
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
                <div className="inline-flex items-center gap-1.5 p-1 rounded-full mb-3" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                  {(Object.entries(TYPE_LABEL) as [SatisfactionQuestionType, string][]).map(([type, label]) => {
                    const active = q.type === type;
                    return (
                      <button key={type} type="button" onClick={() => setType(qIndex, type)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={active ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff" } : { color: th.fg2, background: "transparent" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {q.type === "qcm" && (
                  <div className="space-y-2">
                    {q.options.map((o, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input value={o.label} onChange={(e) => updateOptionLabel(qIndex, oIndex, e.target.value)} placeholder={`Réponse ${oIndex + 1}`}
                          className="flex-1 rounded-lg px-3 py-2 text-xs g-input" />
                        <button onClick={() => removeOption(qIndex, oIndex)}><Trash2 className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
                      </div>
                    ))}
                    <button onClick={() => addOption(qIndex)} className="text-xs font-semibold hover:opacity-70" style={{ color: th.navAC }}>+ Ajouter une réponse</button>
                  </div>
                )}
                {q.type === "rating" && <p className="text-xs" style={{ color: th.fg3 }}>L'élève répondra avec une note de 1 à 5.</p>}
                {q.type === "text" && <p className="text-xs" style={{ color: th.fg3 }}>L'élève répondra en texte libre.</p>}
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
