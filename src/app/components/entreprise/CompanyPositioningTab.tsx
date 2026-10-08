import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Circle, Pencil, ClipboardList, Award, HelpCircle, Upload, Download } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import {
  ItemCard, ItemList, Toolbar, Pill, HueButton, IconAction, VisibilityToggle, EmptyState, Loading, ErrorText, DialogHero, SubCard, KitHeading,
  GhostButton, useHue, SUCCESS,
} from "@/app/components/entreprise/EntrepriseKit";
import { useQuestionList, QuestionCardHeader, StickyEditorBar } from "@/app/components/entreprise/QuestionListEditor";
import {
  listPositioningTests, createPositioningTest, togglePositioningTestVisibility, deletePositioningTest, renamePositioningTest,
  getPositioningQuestions, savePositioningQuestions, QUIZ_KIND_LABEL,
  type PositioningTestRow, type QuizQuestionDraft, type CompanyQuizKind,
} from "@/app/lib/entreprise/companyPositioning";
import { parseQuizCsv, downloadQuizCsvTemplate } from "@/app/lib/entreprise/quizCsv";

const EMPTY_OPTION = () => ({ label: "", isCorrect: false });
const EMPTY_QUESTION = (): QuizQuestionDraft => ({ question: "", explanation: "", options: [EMPTY_OPTION(), EMPTY_OPTION()] });

const KIND_DESCRIPTION: Record<CompanyQuizKind, string> = {
  positioning: "QCM à répondre par les collaborateurs avant la formation.",
  validation: "QCM de fin de formation, pour valider les acquis des collaborateurs.",
};

// Gère les quiz d'une entreprise d'un type donné : test de positionnement
// (onglet "Positionnement") ou quiz de validation (onglet "Quiz de validation").
export function CompanyPositioningTab({ companyId, kind }: { companyId: string; kind: CompanyQuizKind }) {
  const th = useTh();
  const { user } = useAuth();
  const h = useHue();
  const { singular, plural } = QUIZ_KIND_LABEL[kind];
  const KindIcon = kind === "validation" ? Award : ClipboardList;

  const [tests, setTests] = useState<PositioningTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const questions = useQuestionList<QuizQuestionDraft>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csvInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTests(await listPositioningTests(companyId, kind));
    } catch (err) {
      console.error(err);
      toast.error(`Impossible de charger les ${plural.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId, kind]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    questions.reset([EMPTY_QUESTION()]);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = async (test: PositioningTestRow) => {
    setEditingId(test.id);
    setTitle(test.title);
    setError(null);
    questions.reset([]);
    setDialogOpen(true);
    try {
      questions.reset(await getPositioningQuestions(test.id));
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les questions.");
    }
  };

  const updateOptions = (qIndex: number, map: (options: QuizQuestionDraft["options"]) => QuizQuestionDraft["options"]) =>
    questions.update(qIndex, (q) => ({ options: map(q.options) }));

  // Les questions importées remplacent l'éditeur s'il ne contient que des
  // questions vides (nouveau quiz), sinon elles s'ajoutent à la suite.
  const handleCsvImport = async (file: File) => {
    try {
      const { questions: imported, errors } = await parseQuizCsv(file);
      if (!imported.length) {
        setError(errors.length ? `Aucune question importée.\n${errors.slice(0, 5).join("\n")}` : "Le fichier ne contient aucune question.");
        return;
      }
      const kept = questions.items.filter((q) => q.question.trim() || q.options.some((o) => o.label.trim()));
      questions.reset([...kept, ...imported]);
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
      setError(errors.length ? `${errors.length} ligne${errors.length > 1 ? "s" : ""} ignorée${errors.length > 1 ? "s" : ""} :\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? "\n…" : ""}` : null);
      toast.success(`${imported.length} question${imported.length > 1 ? "s" : ""} importée${imported.length > 1 ? "s" : ""}. Vérifiez puis enregistrez.`);
    } catch (err) {
      console.error(err);
      setError("Impossible de lire ce fichier CSV.");
    }
  };

  const handleSave = async () => {
    if (!user || !title.trim() || saving) return;
    for (const [i, q] of questions.items.entries()) {
      if (q.question.trim() && !q.options.some((o) => o.isCorrect && o.label.trim())) {
        setError(`La question ${i + 1} n'a pas de bonne réponse cochée.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const testId = editingId ?? await createPositioningTest(companyId, title.trim(), user.id, kind);
      if (editingId) await renamePositioningTest(testId, title.trim());
      await savePositioningQuestions(testId, questions.items);
      setDialogOpen(false);
      await load();
      toast.success(`${singular} enregistré.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: PositioningTestRow) => {
    if (!confirm(`Supprimer "${test.title}" ? Les résultats des collaborateurs seront aussi supprimés.`)) return;
    try {
      await deletePositioningTest(test.id);
      setTests((rows) => rows.filter((r) => r.id !== test.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer ce quiz.");
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
    <div className="space-y-5 pt-2">
      <Toolbar summary={`${tests.length} ${tests.length > 1 ? plural.toLowerCase() : singular.toLowerCase()}`}>
        <HueButton Icon={Plus} onClick={openCreate}>Créer un quiz</HueButton>
      </Toolbar>

      {loading && <Loading />}
      {!loading && !tests.length && (
        <EmptyState Icon={KindIcon} title="Aucun quiz pour l'instant" hint={KIND_DESCRIPTION[kind]}
          action={<HueButton Icon={Plus} onClick={openCreate}>Créer un quiz</HueButton>} />
      )}

      <ItemList>
        {tests.map((t, i) => (
          <ItemCard key={t.id} index={i} Icon={KindIcon} title={t.title} onClick={() => void openEdit(t)}
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
          <DialogHero Icon={KindIcon} title={editingId ? "Modifier le quiz" : `Nouveau ${singular.toLowerCase()}`}
            desc={`${KIND_DESCRIPTION[kind]} Cochez la bonne réponse de chaque question.`} />

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du quiz" className="w-full rounded-[4px] px-4 py-3 text-base font-semibold g-input" />

          <div className="mt-2">
            <KitHeading right={
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={downloadQuizCsvTemplate} className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-70" style={{ color: th.fg3 }}
                  title="Format : question;reponse_1;…;reponse_5;bonne_reponse;explication">
                  <Download className="w-3.5 h-3.5" />Modèle CSV
                </button>
                <GhostButton sm Icon={Upload} onClick={() => csvInput.current?.click()}>Importer un CSV</GhostButton>
                <input ref={csvInput} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void handleCsvImport(file); }} />
              </div>
            }>Questions ({questions.items.length})</KitHeading>
          </div>

          <div className="space-y-4">
            {questions.items.map((q, qIndex) => (
              <div key={q._key} ref={questions.registerNode(q._key)}>
                <SubCard>
                  <QuestionCardHeader index={qIndex} count={questions.items.length}
                    onMove={(delta) => questions.move(qIndex, delta)} onRemove={() => questions.remove(qIndex)} />
                  <input value={q.question} onChange={(e) => questions.update(qIndex, { question: e.target.value })} placeholder="Intitulé de la question"
                    className="w-full rounded-[4px] px-3.5 py-2.5 text-sm font-semibold g-input mb-3" />
                  <div className="space-y-2 mb-3">
                    {q.options.map((o, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <button type="button" onClick={() => updateOptions(qIndex, (opts) => opts.map((x, j) => ({ ...x, isCorrect: j === oIndex })))}
                          title={o.isCorrect ? "Bonne réponse" : "Marquer comme bonne réponse"} className="shrink-0 transition-transform hover:scale-110">
                          {o.isCorrect ? <CheckCircle2 className="w-5 h-5" style={{ color: SUCCESS }} /> : <Circle className="w-5 h-5" style={{ color: th.fg3 }} />}
                        </button>
                        <input value={o.label} onChange={(e) => updateOptions(qIndex, (opts) => opts.map((x, j) => (j === oIndex ? { ...x, label: e.target.value } : x)))}
                          placeholder={`Réponse ${oIndex + 1}`} className="flex-1 rounded-[4px] px-3 py-2 text-sm g-input"
                          style={o.isCorrect ? { borderColor: "rgba(106,222,177,0.55)" } : undefined} />
                        <IconAction Icon={Trash2} onClick={() => updateOptions(qIndex, (opts) => opts.filter((_, j) => j !== oIndex))} title="Supprimer la réponse" />
                      </div>
                    ))}
                    <button type="button" onClick={() => updateOptions(qIndex, (opts) => [...opts, EMPTY_OPTION()])}
                      className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-70" style={{ color: h.text }}><Plus className="w-3.5 h-3.5" />Ajouter une réponse</button>
                  </div>
                  <textarea value={q.explanation} onChange={(e) => questions.update(qIndex, { explanation: e.target.value })} placeholder="Explication affichée après réponse (optionnel)"
                    rows={2} className="w-full rounded-[4px] px-3 py-2 text-xs g-input resize-none" />
                </SubCard>
              </div>
            ))}
            {!questions.items.length && <p className="text-sm" style={{ color: th.fg3 }}>Aucune question pour l'instant.</p>}
          </div>

          {error && <ErrorText><span className="whitespace-pre-line">{error}</span></ErrorText>}
          <StickyEditorBar onAdd={() => questions.add(EMPTY_QUESTION())}>
            <HueButton onClick={handleSave} disabled={!title.trim() || saving}>{saving ? "Enregistrement..." : "Enregistrer"}</HueButton>
          </StickyEditorBar>
        </DialogContent>
      </Dialog>
    </div>
  );
}
