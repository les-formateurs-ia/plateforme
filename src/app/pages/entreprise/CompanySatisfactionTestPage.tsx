import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Star, Heart, Info, SearchX } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { HueProvider, PageHero, Panel, CompletionPanel, HueButton, EmptyState, Loading, HUES, DANGER } from "@/app/components/entreprise/EntrepriseKit";
import { QuestionStepper } from "@/app/components/entreprise/QuestionStepper";
import {
  getSatisfactionTestForTaking, submitSatisfactionResponse,
  type SatisfactionQuestionForStudent, type SatisfactionAnswer,
} from "@/app/lib/entreprise/companySatisfaction";

import { SatisfactionAnswerInput, isEmpty, needsFollowUp, type AnswerValue } from "@/app/components/entreprise/SatisfactionAnswerInput";

export function CompanySatisfactionTestPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, companyId, role } = useAuth();
  // Voir CompanyPositioningTestPage : même logique d'aperçu formateur.
  const isPreview = isStaff(role) && !companyId;
  const { testId } = useParams<{ testId: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SatisfactionQuestionForStudent[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await getSatisfactionTestForTaking(testId);
        if (cancelled) return;
        setTitle(result.title);
        setDescription(result.description);
        setQuestions(result.questions);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [testId]);

  const setAnswer = (questionId: string, value: AnswerValue) => setAnswers((prev) => ({ ...prev, [questionId]: value }));
  const toggleMulti = (questionId: string, optionId: string) => setAnswers((prev) => {
    const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
    return { ...prev, [questionId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId] };
  });

  const handleSubmit = async () => {
    if (!user || !testId || submitting) return;
    setSubmitting(true);
    try {
      const payload: SatisfactionAnswer[] = questions.map((q) => {
        const value = answers[q.id] ?? (q.allowMultiple ? [] : "");
        const detail = needsFollowUp(q, value) ? details[q.id]?.trim() : undefined;
        return { questionId: q.id, type: q.type, value, ...(detail ? { detail } : {}) };
      });
      if (!isPreview) {
        if (!companyId) return;
        await submitSatisfactionResponse(testId, companyId, user.id, payload);
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Une question obligatoire Oui/Non dont la réponse ouvre le champ texte
  // exige aussi cette précision.
  const isSatisfied = (q: SatisfactionQuestionForStudent) =>
    !q.isRequired || (!isEmpty(answers[q.id]) && !(needsFollowUp(q, answers[q.id]) && !details[q.id]?.trim()));
  const missing = questions.filter((q) => !isSatisfied(q));
  const canSubmit = questions.length > 0 && missing.length === 0;

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"));
  const q = questions[current];

  return (
    <HueProvider hue="peach">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        <PageHero back={{ label: "Retour", onClick: goBack }} eyebrow="Questionnaire" title={title || "Questionnaire"} Icon={Star}
          desc={!done && questions.length ? `${questions.length} question${questions.length > 1 ? "s" : ""} · les questions marquées * sont obligatoires` : undefined} />

        {loading && <Loading />}

        {!loading && done && (
          <CompletionPanel Icon={Heart} title="Merci pour ton retour !" message={isPreview ? "Aperçu — réponses non enregistrées." : "Tes réponses ont bien été envoyées."}>
            <HueButton onClick={goBack}>Revenir à mon espace</HueButton>
          </CompletionPanel>
        )}

        {!loading && !done && description && (
          <Panel watermark={Info}>
            <div className="p-5 sm:p-6 flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: HUES.peach[0] }} />
              <p className="text-sm sm:text-base whitespace-pre-line" style={{ color: th.fg2 }}>{description}</p>
            </div>
          </Panel>
        )}

        {!loading && !done && !questions.length && <EmptyState Icon={SearchX} title="Ce questionnaire ne contient pas encore de question" />}

        {!loading && !done && q && (
          <QuestionStepper index={current} total={questions.length} answered={questions.map((x) => !isEmpty(answers[x.id]))} onJump={setCurrent}
            question={q.question}
            suffix={q.isRequired ? <span style={{ color: DANGER }}> *</span> : <span className="text-base font-semibold" style={{ color: th.fg3 }}> (facultatif)</span>}
            hint={q.type === "qcm" ? (q.allowMultiple ? "Plusieurs réponses possibles." : "Une seule réponse.") : q.type === "rating" ? "Donne une note de 1 à 5." : undefined}
            canNext={current === questions.length - 1 ? canSubmit : isSatisfied(q)}
            submitting={submitting} submitLabel="Envoyer mes réponses" onSubmit={() => void handleSubmit()}>
            <SatisfactionAnswerInput q={q} value={answers[q.id]} detail={details[q.id] ?? ""}
              onValue={(v) => setAnswer(q.id, v)} onToggle={(id) => toggleMulti(q.id, id)}
              onDetail={(text) => setDetails((prev) => ({ ...prev, [q.id]: text }))} />
          </QuestionStepper>
        )}
      </div>
    </HueProvider>
  );
}
