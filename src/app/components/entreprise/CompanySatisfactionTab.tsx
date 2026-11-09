import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Star, HelpCircle, Globe, UserRound } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isAdmin } from "@/app/lib/permissions";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import {
  ItemCard, ItemList, Toolbar, Pill, HueButton, IconAction, VisibilityToggle, EmptyState, Loading, ErrorText, DialogHero, KitHeading,
  HueCheckbox, GhostButton,
} from "@/app/components/entreprise/EntrepriseKit";
import { useQuestionList, StickyEditorBar } from "@/app/components/entreprise/QuestionListEditor";
import { EMPTY_QUESTION, SATISFACTION_TYPE_LABEL, SatisfactionQuestionCards } from "@/app/components/entreprise/SatisfactionQuestionsEditor";
import {
  listSatisfactionTests, createSatisfactionTest, toggleSatisfactionTestVisibility, deleteSatisfactionTest, updateSatisfactionTestHeader,
  getSatisfactionTestForEditing, saveSatisfactionQuestions,
  listSatisfactionTemplates, createSatisfactionTemplate, updateSatisfactionTemplate, deleteSatisfactionTemplate,
  type SatisfactionTestRow, type SatisfactionTemplateRow, type SatisfactionQuestionDraft,
} from "@/app/lib/entreprise/companySatisfaction";

export { SATISFACTION_TYPE_LABEL };
const DESCRIPTION_PLACEHOLDER = "Texte d'introduction affiché en haut du questionnaire (optionnel) : finalité, barème des notes…\nEx. : Ce questionnaire nous aide à améliorer la formation. Pour les notes : 1 = Pas du tout, 5 = Tout à fait.";

// Ce que l'éditeur enregistre : un questionnaire de l'entreprise (id null =
// création) ou un questionnaire global (modèle partagé entre entreprises).
type EditorTarget = { kind: "company"; id: string | null } | { kind: "template"; id: string };

// Copie sans id : un questionnaire pré-rempli depuis un modèle (ou un modèle
// créé depuis un questionnaire) reçoit ses propres questions en base.
const withoutIds = (questions: SatisfactionQuestionDraft[]): SatisfactionQuestionDraft[] =>
  questions.map(({ id: _id, options, ...q }) => ({ ...q, options: options.map(({ label }) => ({ label })) }));

export function CompanySatisfactionTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const { user, role } = useAuth();

  const [tests, setTests] = useState<SatisfactionTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<EditorTarget>({ kind: "company", id: null });
  const [alsoSaveGlobal, setAlsoSaveGlobal] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templates, setTemplates] = useState<SatisfactionTemplateRow[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
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

  const openEditor = (next: EditorTarget, header: { title: string; description: string }, items: SatisfactionQuestionDraft[]) => {
    setTarget(next);
    setTitle(header.title);
    setDescription(header.description);
    questions.reset(items);
    setAlsoSaveGlobal(false);
    setError(null);
    setDialogOpen(true);
  };

  const openCreate = () => openEditor({ kind: "company", id: null }, { title: "", description: "" }, [EMPTY_QUESTION()]);

  const openEdit = async (test: SatisfactionTestRow) => {
    setTarget({ kind: "company", id: test.id });
    setAlsoSaveGlobal(false);
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
      if (target.kind === "template") {
        await updateSatisfactionTemplate(target.id, title.trim(), desc, questions.items);
        setDialogOpen(false);
        await loadTemplates();
        toast.success("Questionnaire global enregistré.");
        return;
      }
      const testId = target.id ?? await createSatisfactionTest(companyId, title.trim(), desc, user.id);
      if (target.id) await updateSatisfactionTestHeader(testId, title.trim(), desc);
      await saveSatisfactionQuestions(testId, questions.items);
      if (alsoSaveGlobal) await createSatisfactionTemplate(title.trim(), desc, questions.items, user.id, testId);
      setDialogOpen(false);
      await load();
      toast.success(alsoSaveGlobal ? "Questionnaire enregistré, et ajouté aux questionnaires globaux." : "Questionnaire enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  // ── Questionnaires globaux ──
  const canManageTemplate = (t: SatisfactionTemplateRow) => isAdmin(role) || t.createdBy === user?.id;

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      setTemplates(await listSatisfactionTemplates());
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les questionnaires globaux.");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const openTemplates = () => {
    setTemplatesOpen(true);
    void loadTemplates();
  };

  // "Utiliser" : pré-remplit un NOUVEAU questionnaire de l'entreprise, à
  // ajuster puis enregistrer — le modèle global reste inchangé.
  const applyTemplate = (t: SatisfactionTemplateRow) => {
    setTemplatesOpen(false);
    openEditor({ kind: "company", id: null }, { title: t.title, description: t.description }, withoutIds(t.questions));
  };

  const editTemplate = (t: SatisfactionTemplateRow) => {
    setTemplatesOpen(false);
    openEditor({ kind: "template", id: t.id }, { title: t.title, description: t.description }, t.questions);
  };

  const handleDeleteTemplate = async (t: SatisfactionTemplateRow) => {
    if (!confirm(`Supprimer le questionnaire global "${t.title}" ? Les questionnaires déjà créés à partir de lui ne sont pas modifiés.`)) return;
    try {
      await deleteSatisfactionTemplate(t.id);
      setTemplates((rows) => rows.filter((r) => r.id !== t.id));
      await load(); // le questionnaire source peut de nouveau être mis en global
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de supprimer ce questionnaire global.");
    }
  };

  const saveAsTemplate = async (test: SatisfactionTestRow) => {
    if (!user) return;
    if (test.isGlobal) {
      toast.info(`"${test.title}" est déjà enregistré en global (voir « Questionnaires globaux »).`);
      return;
    }
    try {
      const result = await getSatisfactionTestForEditing(test.id);
      await createSatisfactionTemplate(test.title, result.description.trim() || null, withoutIds(result.questions), user.id, test.id);
      setTests((rows) => rows.map((r) => (r.id === test.id ? { ...r, isGlobal: true } : r)));
      toast.success(`"${test.title}" est maintenant disponible dans les questionnaires globaux.`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible d'enregistrer ce questionnaire en global.");
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
        <GhostButton Icon={Globe} onClick={openTemplates}>Questionnaires globaux</GhostButton>
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
              <IconAction Icon={Globe} active={t.isGlobal} onClick={() => void saveAsTemplate(t)}
                title={t.isGlobal ? "Déjà enregistré en global" : "Enregistrer en global (réutilisable dans toutes les entreprises)"} />
              <IconAction Icon={Pencil} onClick={() => void openEdit(t)} title="Modifier" />
              <IconAction Icon={Trash2} tone="danger" onClick={() => void handleDelete(t)} title="Supprimer" />
            </>} />
        ))}
      </ItemList>

      <Dialog open={dialogOpen} onOpenChange={(v) => !saving && setDialogOpen(v)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHero Icon={target.kind === "template" ? Globe : Star}
            title={target.kind === "template" ? "Modifier le questionnaire global" : target.id ? "Modifier le questionnaire" : "Nouveau questionnaire"}
            desc={target.kind === "template"
              ? "Modèle réutilisable dans toutes les entreprises. Les questionnaires déjà créés à partir de lui ne sont pas modifiés."
              : "QCM, note de 1 à 5, Oui / Non ou texte libre."} />

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du questionnaire" className="w-full rounded-[4px] px-4 py-3 text-base font-semibold g-input" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={DESCRIPTION_PLACEHOLDER}
            rows={3} className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input resize-y" />

          <div className="mt-2"><KitHeading>Questions ({questions.items.length})</KitHeading></div>

          <SatisfactionQuestionCards list={questions} />

          {error && <ErrorText>{error}</ErrorText>}
          <StickyEditorBar onAdd={() => questions.add(EMPTY_QUESTION())}>
            <div className="flex items-center gap-3 flex-wrap">
              {target.kind === "company" && !tests.find((t) => t.id === target.id)?.isGlobal && (
                <HueCheckbox checked={alsoSaveGlobal} onChange={setAlsoSaveGlobal}>Enregistrer aussi en global</HueCheckbox>
              )}
              <HueButton onClick={handleSave} disabled={!title.trim() || saving}>{saving ? "Enregistrement..." : "Enregistrer"}</HueButton>
            </div>
          </StickyEditorBar>
        </DialogContent>
      </Dialog>

      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHero Icon={Globe} title="Questionnaires globaux"
            desc="Modèles partagés entre toutes les entreprises. « Utiliser » crée une copie dans cette entreprise, à ajuster avant d'enregistrer." />
          {templatesLoading && <Loading />}
          {!templatesLoading && !templates.length && (
            <p className="text-sm" style={{ color: th.fg3 }}>
              Aucun questionnaire global pour l'instant. Enregistrez-en un avec l'icône <Globe className="inline w-3.5 h-3.5 -mt-0.5" /> d'un questionnaire, ou la case « Enregistrer aussi en global » de l'éditeur.
            </p>
          )}
          <ItemList>
            {!templatesLoading && templates.map((t) => (
              <ItemCard key={t.id} Icon={Globe} title={t.title} subtitle={t.description || undefined}
                pills={<>
                  <Pill Icon={HelpCircle}>{t.questions.length} question{t.questions.length > 1 ? "s" : ""}</Pill>
                  {t.createdBy === user?.id && <Pill Icon={UserRound} tone="muted">Créé par vous</Pill>}
                </>}
                actions={<>
                  <HueButton sm onClick={() => applyTemplate(t)}>Utiliser</HueButton>
                  {canManageTemplate(t) && <>
                    <IconAction Icon={Pencil} onClick={() => editTemplate(t)} title="Modifier le questionnaire global" />
                    <IconAction Icon={Trash2} tone="danger" onClick={() => void handleDeleteTemplate(t)} title="Supprimer le questionnaire global" />
                  </>}
                </>} />
            ))}
          </ItemList>
        </DialogContent>
      </Dialog>
    </div>
  );
}
