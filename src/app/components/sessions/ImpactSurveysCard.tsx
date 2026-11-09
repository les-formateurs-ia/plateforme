import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Copy, ExternalLink, LineChart, Pencil, Plus, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { VSwitch } from "@/app/components/common/VSwitch";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { DialogHero, ErrorText, HueButton, HueProvider, KitHeading } from "@/app/components/entreprise/EntrepriseKit";
import { StickyEditorBar, useQuestionList } from "@/app/components/entreprise/QuestionListEditor";
import { EMPTY_QUESTION, SatisfactionQuestionCards } from "@/app/components/entreprise/SatisfactionQuestionsEditor";
import type { SatisfactionQuestionDraft } from "@/app/lib/entreprise/companySatisfaction";
import {
  DEFAULT_IMPACT_DESCRIPTION, DEFAULT_IMPACT_TITLE, defaultImpactQuestions, deleteImpactSurvey, impactAnswerUrl, impactResultsUrl,
  listImpactSurveys, saveImpactSurvey, setImpactSurveyOpen, toDrafts, type ImpactSurveyRow,
} from "@/app/lib/impactSurveys";

// Évaluation d'impact d'une session (admin) : questionnaire post-formation
// à lien unique pour les stagiaires (sans compte), et lien du tableau de bord
// des résultats pour le responsable de l'entreprise.
export function ImpactSurveysCard({ sessionId }: { sessionId: string }) {
  const th = useTh();
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<ImpactSurveyRow[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const questions = useQuestionList<SatisfactionQuestionDraft>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => listImpactSurveys(sessionId).then(setSurveys).catch((err) => { console.error(err); setSurveys([]); });
  useEffect(() => { void load(); }, [sessionId]);

  const openEditor = (survey: ImpactSurveyRow | null) => {
    setEditing({ id: survey?.id ?? null });
    setTitle(survey?.title ?? DEFAULT_IMPACT_TITLE);
    setDescription(survey ? survey.description : DEFAULT_IMPACT_DESCRIPTION);
    questions.reset(survey ? toDrafts(survey.questions) : defaultImpactQuestions());
    setError(null);
  };

  const save = async () => {
    if (!user || !editing || saving) return;
    if (!title.trim()) return setError("Donnez un titre au questionnaire.");
    for (const [i, q] of questions.items.entries()) {
      if (q.question.trim() && q.type === "qcm" && q.options.filter((o) => o.label.trim()).length < 2) {
        return setError(`La question ${i + 1} (QCM) doit proposer au moins 2 réponses.`);
      }
    }
    if (!questions.items.some((q) => q.question.trim())) return setError("Ajoutez au moins une question.");
    setSaving(true);
    setError(null);
    try {
      await saveImpactSurvey({ id: editing.id, sessionId, title, description, questions: questions.items, createdBy: user.id });
      setEditing(null);
      await load();
      toast.success(editing.id ? "Évaluation mise à jour." : "Évaluation créée : copiez le lien à envoyer aux stagiaires.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const copy = (url: string, what: string) => {
    void navigator.clipboard.writeText(url).then(() => toast.success(`${what} copié.`), () => toast.error("Copie impossible : " + url));
  };

  const toggleOpen = async (s: ImpactSurveyRow, open: boolean) => {
    setSurveys((rows) => rows?.map((r) => (r.id === s.id ? { ...r, isOpen: open } : r)) ?? rows);
    try { await setImpactSurveyOpen(s.id, open); } catch (err) {
      console.error(err);
      toast.error("Modification impossible.");
      setSurveys((rows) => rows?.map((r) => (r.id === s.id ? { ...r, isOpen: !open } : r)) ?? rows);
    }
  };

  const remove = async (s: ImpactSurveyRow) => {
    if (!confirm(`Supprimer « ${s.title} » et ses ${s.responseCount} réponse(s) ? Les deux liens cesseront de fonctionner.`)) return;
    try { await deleteImpactSurvey(s.id); await load(); } catch (err) { console.error(err); toast.error("Suppression impossible."); }
  };

  const linkButton = (Icon: typeof Copy, label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-[4px] hover:opacity-70"
      style={{ background: th.navA, color: th.fg }}>
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  );

  return (
    <GCard><div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <LineChart className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>Évaluation d’impact</p>
        {!!surveys?.length && (
          <button type="button" onClick={() => openEditor(null)} title="Nouvelle évaluation" className="p-1 hover:opacity-70"><Plus className="w-4 h-4" style={{ color: th.fg2 }} /></button>
        )}
      </div>

      {surveys && !surveys.length && (
        <div className="space-y-2.5">
          <p className="text-xs" style={{ color: th.fg2 }}>
            Questionnaire post-formation à lien unique : les stagiaires répondent sans compte (prénom et nom), le responsable suit les résultats sur un tableau de bord.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openEditor(null)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[2px] hover:opacity-70"
              style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
              <Plus className="w-3.5 h-3.5" />Créer l’évaluation
            </button>
            <a href="/evaluation/demo" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold px-1 py-1.5 hover:opacity-70" style={{ color: th.fg3 }}>
              Voir un exemple<ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {surveys?.map((s) => (
        <div key={s.id} className="rounded-[6px] p-3 space-y-2.5" style={{ border: `1px solid ${th.sep}` }}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: th.fg }}>{s.title}</p>
              <p className="text-[11px]" style={{ color: th.fg3 }}>{s.responseCount} réponse{s.responseCount > 1 ? "s" : ""} · {s.questions.length} questions</p>
            </div>
            <button type="button" onClick={() => openEditor(s)} title="Modifier" className="p-1 hover:opacity-70"><Pencil className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
            <button type="button" onClick={() => void remove(s)} title="Supprimer" className="p-1 hover:opacity-70"><Trash2 className="w-3.5 h-3.5" style={{ color: th.fg3 }} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {linkButton(Copy, "Lien stagiaires", () => copy(impactAnswerUrl(s.answerToken), "Lien du questionnaire"))}
            {linkButton(Copy, "Lien responsable", () => copy(impactResultsUrl(s.resultsToken), "Lien du tableau de bord"))}
            {linkButton(BarChart3, "Résultats", () => window.open(impactResultsUrl(s.resultsToken), "_blank", "noopener"))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <VSwitch checked={s.isOpen} onCheckedChange={(v) => void toggleOpen(s, v)} />
            <span className="text-[11px]" style={{ color: th.fg2 }}>{s.isOpen ? "Ouvert aux réponses" : "Clos : plus de nouvelles réponses"}</span>
          </label>
        </div>
      ))}

      <HueProvider hue="peach">
        <Dialog open={!!editing} onOpenChange={(v) => { if (!v && !saving) setEditing(null); }}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHero Icon={LineChart} title={editing?.id ? "Modifier l’évaluation d’impact" : "Nouvelle évaluation d’impact"}
              desc="Questionnaire post-formation pré-rempli : ajustez les questions (QCM, note 1 à 5, Oui / Non, texte libre). Les stagiaires répondent sans compte." />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du questionnaire" className="w-full rounded-[4px] px-4 py-3 text-base font-semibold g-input" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Texte d’introduction (optionnel)"
              rows={3} className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input resize-y" />
            <div className="mt-2"><KitHeading>Questions ({questions.items.length})</KitHeading></div>
            <SatisfactionQuestionCards list={questions} />
            {editing?.id && (surveys?.find((x) => x.id === editing.id)?.responseCount ?? 0) > 0 && (
              <p className="text-[11px]" style={{ color: th.fg3 }}>Des réponses ont déjà été reçues : les questions conservées gardent leurs résultats ; une question supprimée disparaît du tableau de bord.</p>
            )}
            {error && <ErrorText>{error}</ErrorText>}
            <StickyEditorBar onAdd={() => questions.add(EMPTY_QUESTION())}>
              <HueButton onClick={() => void save()} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</HueButton>
            </StickyEditorBar>
          </DialogContent>
        </Dialog>
      </HueProvider>
    </div></GCard>
  );
}
