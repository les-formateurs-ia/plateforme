import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Star, HelpCircle } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import {
  ItemCard, ItemList, Toolbar, Pill, HueButton, IconAction, VisibilityToggle, EmptyState, Loading, ErrorText, DialogHero, SubCard, KitHeading,
  HueSegmented, HueCheckbox, useHue,
} from "@/app/components/entreprise/EntrepriseKit";
import { useQuestionList, QuestionCardHeader, StickyEditorBar } from "@/app/components/entreprise/QuestionListEditor";
import {
  listSatisfactionTests, createSatisfactionTest, toggleSatisfactionTestVisibility, deleteSatisfactionTest, updateSatisfactionTestHeader,
  getSatisfactionTestForEditing, saveSatisfactionQuestions,
  type SatisfactionTestRow, type SatisfactionQuestionDraft, type SatisfactionQuestionType,
} from "@/app/lib/entreprise/companySatisfaction";

export const SATISFACTION_TYPE_LABEL: Record<SatisfactionQuestionType, string> = {
  qcm: "QCM", rating: "Note 1 à 5", yes_no: "Oui / Non", text: "Texte libre",
};
const EMPTY_QUESTION = (): SatisfactionQuestionDraft => ({
  question: "", type: "text", isRequired: true, allowMultiple: false, followUpOn: null, followUpLabel: "", options: [],
});
const DESCRIPTION_PLACEHOLDER = "Texte d'introduction affiché en haut du questionnaire (optionnel) : finalité, barème des notes…\nEx. : Ce questionnaire nous aide à améliorer la formation. Pour les notes : 1 = Pas du tout, 5 = Tout à fait.";

export function CompanySatisfactionTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const h = useHue();
  const { user } = useAuth();

  const [tests, setTests] = useState<SatisfactionTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const questions = useQuestionList<SatisfactionQuestionDraft>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTests(await listSatisfactionTests(companyId));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les questionnaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    questions.reset([EMPTY_QUESTION()]);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = async (test: SatisfactionTestRow) => {
    setEditingId(test.id);
    setTitle(test.title);
    setDescription("");
    setError(null);
    questions.reset([]);
    setDialogOpen(true);
    try {
      const result = await getSatisfactionTestForEditing(test.id);
      setDescription(result.description);
      questions.reset(result.questions);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les questions.");
    }
  };

  const setType = (qIndex: number, type: SatisfactionQuestionType) =>
    questions.update(qIndex, (q) => ({
      type,
      options: type === "qcm" ? (q.options.length ? q.options : [{ label: "" }, { label: "" }]) : [],
    }));
  const updateOptions = (qIndex: number, map: (options: SatisfactionQuestionDraft["options"]) => SatisfactionQuestionDraft["options"]) =>
    questions.update(qIndex, (q) => ({ options: map(q.options) }));

  const handleSave = async () => {
    if (!user || !title.trim() || saving) return;
    for (const [i, q] of questions.items.entries()) {
      if (q.question.trim() && q.type === "qcm" && q.options.filter((o) => o.label.trim()).length < 2) {
        setError(`La question ${i + 1} (QCM) doit proposer au moins 2 réponses.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const desc = description.trim() || null;
      const testId = editingId ?? await createSatisfactionTest(companyId, title.trim(), desc, user.id);
      if (editingId) await updateSatisfactionTestHeader(testId, title.trim(), desc);
      await saveSatisfactionQuestions(testId, questions.items);
      setDialogOpen(false);
      await load();
      toast.success("Questionnaire enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: SatisfactionTestRow) => {
    if (!confirm(`Supprimer le questionnaire "${test.title}" ? Les réponses des collaborateurs seront aussi supprimées.`)) return;
    try {
      await deleteSatisfactionTest(test.id);
      setTests((rows) => rows.filter((r) => r.id !== test.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer ce questionnaire.");
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
    <div className="space-y-5 pt-2">
      <Toolbar summary={`${tests.length} questionnaire${tests.length > 1 ? "s" : ""}`}>
        <HueButton Icon={Plus} onClick={openCreate}>Créer un questionnaire</HueButton>
      </Toolbar>

      {loading && <Loading />}
      {!loading && !tests.length && (
        <EmptyState Icon={Star} title="Aucun questionnaire pour l'instant" hint="Recueillez l'avis des collaborateurs : QCM, notes de 1 à 5, Oui / Non ou texte libre."
          action={<HueButton Icon={Plus} onClick={openCreate}>Créer un questionnaire</HueButton>} />
      )}

      <ItemList>
        {tests.map((t, i) => (
          <ItemCard key={t.id} index={i} Icon={Star} title={t.title} onClick={() => void openEdit(t)}
            pills={<Pill Icon={HelpCircle}>{t.questionCount} question{t.questionCount > 1 ? "s" : ""}</Pill>}
            actions={<>
              <VisibilityToggle checked={t.isVisible} onChange={(v) => void handleToggle(t, v)} />
              <IconAction Icon={Pencil} onClick={() => void openEdit(t)} title="Modifier" />
              <IconAction Icon={Trash2} tone="danger" onClick={() => void handleDelete(t)} title="Supprimer" />
            </>} />
        ))}
      </ItemList>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHero Icon={Star} title={editingId ? "Modifier le questionnaire" : "Nouveau questionnaire"} desc="QCM, note de 1 à 5, Oui / Non ou texte libre." />

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du questionnaire" className="w-full rounded-xl px-4 py-3 text-base font-semibold g-input" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={DESCRIPTION_PLACEHOLDER}
            rows={3} className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-y" />

          <div className="mt-2"><KitHeading>Questions ({questions.items.length})</KitHeading></div>

          <div className="space-y-4">
            {questions.items.map((q, qIndex) => (
              <div key={q._key} ref={questions.registerNode(q._key)}>
                <SubCard>
                  <QuestionCardHeader index={qIndex} count={questions.items.length}
                    onMove={(delta) => questions.move(qIndex, delta)} onRemove={() => questions.remove(qIndex)} />
                  <input value={q.question} onChange={(e) => questions.update(qIndex, { question: e.target.value })} placeholder="Intitulé de la question"
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold g-input mb-3" />

                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <HueSegmented value={q.type} onChange={(v) => setType(qIndex, v)}
                      options={(Object.entries(SATISFACTION_TYPE_LABEL) as [SatisfactionQuestionType, string][]).map(([value, label]) => ({ value, label }))} />
                    <HueCheckbox checked={q.isRequired} onChange={(v) => questions.update(qIndex, { isRequired: v })}>Réponse obligatoire</HueCheckbox>
                  </div>

                  {q.type === "qcm" && (
                    <div className="space-y-2">
                      {q.options.map((o, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input value={o.label} onChange={(e) => updateOptions(qIndex, (opts) => opts.map((x, j) => (j === oIndex ? { ...x, label: e.target.value } : x)))}
                            placeholder={`Réponse ${oIndex + 1}`} className="flex-1 rounded-lg px-3 py-2 text-sm g-input" />
                          <IconAction Icon={Trash2} onClick={() => updateOptions(qIndex, (opts) => opts.filter((_, j) => j !== oIndex))} title="Supprimer la réponse" />
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                        <button type="button" onClick={() => updateOptions(qIndex, (opts) => [...opts, { label: "" }])}
                          className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-70" style={{ color: h.text }}><Plus className="w-3.5 h-3.5" />Ajouter une réponse</button>
                        <HueCheckbox checked={q.allowMultiple} onChange={(v) => questions.update(qIndex, { allowMultiple: v })}>Plusieurs réponses possibles</HueCheckbox>
                      </div>
                    </div>
                  )}

                  {q.type === "yes_no" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: th.fg2 }}>
                        <span className="font-semibold">Demander une précision (champ texte) si la réponse est :</span>
                        <HueSegmented value={q.followUpOn ?? "none"} onChange={(v) => questions.update(qIndex, { followUpOn: v === "none" ? null : v })}
                          options={[{ value: "none", label: "Jamais" }, { value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
                      </div>
                      {q.followUpOn && (
                        <input value={q.followUpLabel} onChange={(e) => questions.update(qIndex, { followUpLabel: e.target.value })}
                          placeholder="Libellé du champ texte (ex. Précisez pourquoi)" className="w-full rounded-lg px-3 py-2 text-sm g-input" />
                      )}
                    </div>
                  )}
                  {q.type === "rating" && <p className="text-xs" style={{ color: th.fg3 }}>L'élève répondra avec une note de 1 à 5. Précisez le barème dans le texte d'introduction.</p>}
                  {q.type === "text" && <p className="text-xs" style={{ color: th.fg3 }}>L'élève répondra en texte libre.</p>}
                </SubCard>
              </div>
            ))}
            {!questions.items.length && <p className="text-sm" style={{ color: th.fg3 }}>Aucune question pour l'instant.</p>}
          </div>

          {error && <ErrorText>{error}</ErrorText>}
          <StickyEditorBar onAdd={() => questions.add(EMPTY_QUESTION())}>
            <HueButton onClick={handleSave} disabled={!title.trim() || saving}>{saving ? "Enregistrement..." : "Enregistrer"}</HueButton>
          </StickyEditorBar>
        </DialogContent>
      </Dialog>
    </div>
  );
}
