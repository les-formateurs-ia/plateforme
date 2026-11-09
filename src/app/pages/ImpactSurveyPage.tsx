import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useParams } from "react-router";
import { ArrowRight, CalendarDays, Heart, Lock, SearchX } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Logo } from "@/app/components/common/Logo";
import { Background } from "@/app/components/common/Background";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { DANGER, HueButton, HueProvider } from "@/app/components/entreprise/EntrepriseKit";
import { QuestionStepper } from "@/app/components/entreprise/QuestionStepper";
import { SatisfactionAnswerInput, isEmpty, needsFollowUp, type AnswerValue } from "@/app/components/entreprise/SatisfactionAnswerInput";
import { periodeFr } from "@/app/lib/documents/render";
import { getPublicImpactSurvey, submitImpactSurvey, type ImpactAnswer, type ImpactQuestion, type PublicImpactSurvey } from "@/app/lib/impactSurveys";

// Évaluation d'impact d'une formation, ouverte par lien unique et sans
// compte : le stagiaire indique son prénom et son nom, puis répond aux
// questions une à une.

export function PublicShell({ right, children }: { right?: ReactNode; children: ReactNode }) {
  const th = useTh();
  return (
    <div className="min-h-dvh relative" style={{ background: th.bg }}>
      <Background />
      <header className="relative z-10 px-5 sm:px-8 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${th.sep}` }}>
        <Logo h={24} />
        {right && <span className="text-xs font-semibold ml-auto truncate" style={{ color: th.fg3 }}>{right}</span>}
      </header>
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">{children}</main>
    </div>
  );
}

export function SurveyHero({ eyebrow, title, survey, children }: { eyebrow: string; title: string; survey: PublicImpactSurvey; children?: ReactNode }) {
  return (
    <section className="fade-up relative overflow-hidden rounded-[14px] bg-black text-white">
      <NeuralField dark density={3.2} band={0.9} />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.93) 0%,rgba(0,0,0,0.65) 60%,rgba(0,0,0,0.25) 100%)" }} />
      <div className="relative p-6 sm:p-8 space-y-5">
        <div>
          <p className="eyebrow text-white/55">{eyebrow}</p>
          <h1 className="text-[1.6rem] sm:text-[2.2rem] font-extrabold leading-[1.08] mt-2.5 tracking-[-0.03em]">{title}</h1>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-white/10 text-white/85">{survey.formation}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm bg-white/10 text-white/85"><CalendarDays className="w-4 h-4" />{periodeFr(survey.dateDebut, survey.dateFin)}</span>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

export function Notice({ Icon, title, text }: { Icon: typeof Lock; title: string; text: string }) {
  const th = useTh();
  return (
    <div className="fade-up rounded-[14px] p-8 sm:p-12 text-center space-y-3" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
      <span className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: th.ink, color: th.onInk }}><Icon className="w-5 h-5" /></span>
      <h2 className="text-xl font-black" style={{ color: th.fg }}>{title}</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: th.fg2 }}>{text}</p>
    </div>
  );
}

export function ImpactSurveyPage() {
  const th = useTh();
  const { token = "" } = useParams();
  const [survey, setSurvey] = useState<PublicImpactSurvey | null | undefined>(undefined);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicImpactSurvey(token).then(setSurvey).catch((err) => { console.error(err); setSurvey(null); });
  }, [token]);

  if (survey === undefined) return <PublicShell><p className="text-sm" style={{ color: th.fg3 }}>Chargement du questionnaire…</p></PublicShell>;
  if (!survey) return <PublicShell><Notice Icon={SearchX} title="Lien introuvable" text="Ce lien d’évaluation n’existe pas ou a été supprimé. Vérifiez l’adresse reçue, ou contactez contact@les-formateurs-ia.fr." /></PublicShell>;

  const questions = survey.questions;
  const isSatisfied = (q: ImpactQuestion) =>
    !q.isRequired || (!isEmpty(answers[q.id]) && !(needsFollowUp(q, answers[q.id]) && !details[q.id]?.trim()));
  const canSubmit = questions.length > 0 && questions.every(isSatisfied);
  const q = questions[current];

  const start = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return setError("Indiquez votre prénom et votre nom.");
    setError(null);
    setStarted(true);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: ImpactAnswer[] = questions.map((x) => {
        const value = answers[x.id] ?? (x.allowMultiple ? [] : "");
        const detail = needsFollowUp(x, value) ? details[x.id]?.trim() : undefined;
        return { questionId: x.id, type: x.type, value: typeof value === "string" ? value.trim() : value, ...(detail ? { detail } : {}) };
      });
      await submitImpactSurvey(token, firstName.trim(), lastName.trim(), payload);
      setDone(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message ? err.message : "Envoi impossible, réessayez dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMulti = (questionId: string, optionId: string) => setAnswers((prev) => {
    const cur = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
    return { ...prev, [questionId]: cur.includes(optionId) ? cur.filter((id) => id !== optionId) : [...cur, optionId] };
  });

  return (
    <HueProvider hue="peach">
      <PublicShell right={`Évaluation · ${survey.client}`}>
        <SurveyHero eyebrow="Évaluation de la formation" title={survey.title} survey={survey}>
          {!started && !done && survey.isOpen && survey.description && (
            <p className="text-sm sm:text-base text-white/80 max-w-3xl whitespace-pre-line">{survey.description}</p>
          )}
        </SurveyHero>

        {!survey.isOpen && !done && <Notice Icon={Lock} title="Ce questionnaire est clos" text="Il n’accepte plus de réponses. Merci de votre intérêt !" />}

        {done && <Notice Icon={Heart} title={`Merci ${firstName.trim()} !`} text="Vos réponses ont bien été enregistrées. Elles nous aident à mesurer l’impact de la formation et à l’améliorer." />}

        {survey.isOpen && !done && !started && (
          <form onSubmit={start} noValidate className="fade-up rounded-[14px] p-6 sm:p-8 space-y-5 max-w-2xl" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            <div>
              <h2 className="text-xl font-black" style={{ color: th.fg }}>Pour commencer</h2>
              <p className="text-sm mt-1" style={{ color: th.fg2 }}>
                {questions.length} question{questions.length > 1 ? "s" : ""} · environ {Math.max(2, Math.round(questions.length / 3))} minutes. Pas besoin de compte.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {([["Prénom", firstName, setFirstName, "given-name"], ["Nom", lastName, setLastName, "family-name"]] as const).map(([label, value, set, auto]) => (
                <label key={label} className="block">
                  <span className="block text-xs font-bold mb-1.5" style={{ color: th.fg2 }}>{label}</span>
                  <input value={value} onChange={(e) => set(e.target.value)} autoComplete={auto} maxLength={80}
                    className="w-full rounded-[4px] px-4 py-3 text-base g-input" />
                </label>
              ))}
            </div>
            {error && <p className="text-sm font-semibold" style={{ color: DANGER }}>{error}</p>}
            <HueButton type="submit" Icon={ArrowRight}>Commencer</HueButton>
          </form>
        )}

        {survey.isOpen && !done && started && q && (
          <>
            <QuestionStepper index={current} total={questions.length} answered={questions.map((x) => !isEmpty(answers[x.id]))} onJump={setCurrent}
              question={q.question}
              suffix={q.isRequired ? <span style={{ color: DANGER }}> *</span> : <span className="text-base font-semibold" style={{ color: th.fg3 }}> (facultatif)</span>}
              hint={q.type === "qcm" ? (q.allowMultiple ? "Plusieurs réponses possibles." : "Une seule réponse.") : q.type === "rating" ? "Donnez une note de 1 à 5." : undefined}
              canNext={current === questions.length - 1 ? canSubmit : isSatisfied(q)}
              submitting={submitting} submitLabel="Envoyer mes réponses" onSubmit={() => void submit()}>
              <SatisfactionAnswerInput formal q={q} value={answers[q.id]} detail={details[q.id] ?? ""}
                onValue={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))} onToggle={(id) => toggleMulti(q.id, id)}
                onDetail={(text) => setDetails((prev) => ({ ...prev, [q.id]: text }))} />
            </QuestionStepper>
            {error && <p className="text-sm font-semibold" style={{ color: DANGER }}>{error}</p>}
          </>
        )}
      </PublicShell>
    </HueProvider>
  );
}
