import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Star, Check, Heart, Info, SearchX } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { HueProvider, PageHero, Panel, ChoiceButton, LetterBadge, CompletionPanel, HueButton, EmptyState, Loading, HUES, DANGER } from "@/app/components/entreprise/EntrepriseKit";
import { QuestionStepper } from "@/app/components/entreprise/QuestionStepper";
import {
  getSatisfactionTestForTaking, submitSatisfactionResponse,
  type SatisfactionQuestionForStudent, type SatisfactionAnswer,
} from "@/app/lib/entreprise/companySatisfaction";

type AnswerValue = string | number | string[];

const isEmpty = (v: AnswerValue | undefined) => v === undefined || v === "" || (Array.isArray(v) && !v.length);
const needsFollowUp = (q: SatisfactionQuestionForStudent, v: AnswerValue | undefined) => q.type === "yes_no" && !!q.followUpOn && v === q.followUpOn;

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
  const STAR = HUES.amber[0];
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
            {q.type === "qcm" && (
              <div className="grid sm:grid-cols-2 gap-3">
                {q.options.map((o, i) => {
                  const value = answers[q.id];
                  const active = q.allowMultiple ? Array.isArray(value) && value.includes(o.id) : value === o.id;
                  const indicator = q.allowMultiple
                    ? <span className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center" style={{ border: `2px solid ${active ? "#fff" : th.fg3}` }}>{active && <Check className="w-4 h-4" />}</span>
                    : <LetterBadge letter={String.fromCharCode(65 + i)} active={active} />;
                  return (
                    <ChoiceButton key={o.id} big active={active} indicator={indicator}
                      onClick={() => (q.allowMultiple ? toggleMulti(q.id, o.id) : setAnswer(q.id, o.id))}>
                      {o.label}
                    </ChoiceButton>
                  );
                })}
              </div>
            )}

            {q.type === "rating" && (
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = (answers[q.id] as number) >= n;
                  return (
                    <button key={n} onClick={() => setAnswer(q.id, n)} aria-label={`Note ${n} sur 5`}
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-3xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:-translate-y-1"
                      style={{ background: on ? "rgba(238,184,90,0.16)" : th.inputBg, border: `1px solid ${on ? "rgba(238,184,90,0.55)" : th.inputB}` }}>
                      <Star className="w-7 h-7 sm:w-9 sm:h-9 transition-colors" style={{ color: on ? STAR : th.fg3, fill: on ? STAR : "none" }} />
                      <span className="text-[11px] font-black tabular-nums" style={{ color: on ? STAR : th.fg3 }}>{n}</span>
                    </button>
                  );
                })}
                {typeof answers[q.id] === "number" && <span className="ml-2 text-2xl font-black tabular-nums" style={{ color: th.fg }}>{answers[q.id]}/5</span>}
              </div>
            )}

            {q.type === "yes_no" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  {([["yes", "Oui"], ["no", "Non"]] as const).map(([value, label]) => (
                    <ChoiceButton key={value} big active={answers[q.id] === value} onClick={() => setAnswer(q.id, value)}>
                      <span className="w-full text-center text-lg">{label}</span>
                    </ChoiceButton>
                  ))}
                </div>
                {needsFollowUp(q, answers[q.id]) && (
                  <textarea
                    value={details[q.id] ?? ""}
                    onChange={(e) => setDetails((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    rows={4}
                    placeholder={q.followUpLabel || "Précise ta réponse..."}
                    className="w-full rounded-2xl px-5 py-4 text-base g-input resize-none"
                  />
                )}
              </div>
            )}

            {q.type === "text" && (
              <textarea
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                rows={6}
                placeholder="Ta réponse..."
                className="w-full rounded-2xl px-5 py-4 text-base g-input resize-none"
              />
            )}
          </QuestionStepper>
        )}
      </div>
    </HueProvider>
  );
}
