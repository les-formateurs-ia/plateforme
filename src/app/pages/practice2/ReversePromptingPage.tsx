import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles, Target } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { VBtn } from "@/app/components/common/Buttons";
import {
  CompareSlider, ExerciseHeader, FeedbackBlock, IMAGE_CUES, PromptCues, Stage, StageButton, StageTextarea, ThinkingPanel,
} from "@/app/components/practice/ExerciseKit";
import { cx } from "@/app/lib/cx";
import {
  startReversePromptSession, submitReversePromptAttempt,
  type ReversePromptSession, type ReversePromptAttempt,
} from "@/app/lib/reversePrompting";

// Rétro-ingénierie : une image cible est générée, l'élève cherche le prompt
// qui permet de la reproduire. L'image cible reste toujours sous les yeux à
// côté de l'éditeur ; chaque essai se compare à la cible au curseur, et la
// frise des essais permet de revenir sur une version précédente (et de
// repartir de son prompt).

const MAX_PROMPT = 2000;

export function ReversePromptingPage() {
  const th = useTh();
  // Conteneur qui défile (pas la fenêtre) : on y remonte en haut quand
  // l'éditeur ou un nouveau résultat s'affiche.
  const pageRef = useRef<HTMLDivElement>(null);
  const toTop = () => pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  const [session, setSession] = useState<ReversePromptSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [attempts, setAttempts] = useState<ReversePromptAttempt[]>([]);
  const [viewIndex, setViewIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const startNewSession = () => {
    setLoadingSession(true);
    setSessionError(null);
    setAttempts([]);
    setViewIndex(-1);
    setPrompt("");
    setSubmitError(null);
    startReversePromptSession()
      .then(setSession)
      .catch((err) => setSessionError(err instanceof Error ? err.message : "Impossible de générer l'image cible."))
      .finally(() => setLoadingSession(false));
  };

  useEffect(() => { startNewSession(); }, []);

  const submit = async () => {
    if (!prompt.trim() || !session || submitting || prompt.length > MAX_PROMPT) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const attempt = await submitReversePromptAttempt(session.id, prompt.trim());
      setAttempts((prev) => [...prev, attempt]);
      setViewIndex(attempts.length);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de la génération.");
    } finally {
      setSubmitting(false);
    }
  };

  const viewed = viewIndex >= 0 ? attempts[viewIndex] : undefined;
  const target = session?.targetImageUrl ?? null;

  return (
    <div ref={pageRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <ExerciseHeader backTo="/practice" backLabel="Exercez-vous !" eyebrow="Reverse prompting" icon={<Target className="w-3.5 h-3.5" />}
        title="Rétro-ingénierie" intro="Observe l'image cible, devine le prompt qui l'a créée, et rapproche-toi d'essai en essai."
        action={<VBtn sm onClick={startNewSession} disabled={loadingSession || submitting}><RotateCcw className="w-3.5 h-3.5" />Nouvelle image</VBtn>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <FeedbackBlock title="Image cible">
          {loadingSession && <ThinkingPanel height={360} label="Génération de l'image cible…" hint="une trentaine de secondes" />}
          {!loadingSession && sessionError && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: th.danger }}>{sessionError}</p>
              <VBtn sm onClick={startNewSession}><RotateCcw className="w-3.5 h-3.5" />Réessayer</VBtn>
            </div>
          )}
          {!loadingSession && !sessionError && target && (
            <img src={target} alt="Image cible à reproduire" className="battle-in w-full rounded-[8px] bg-black" style={{ aspectRatio: "1/1", objectFit: "cover" }} />
          )}
        </FeedbackBlock>

        <Stage active={submitting}>
          <div className="px-5 sm:px-7 py-6 sm:py-7 space-y-5">
            <div>
              <label htmlFor="reverse-prompt" className="eyebrow text-white/55">
                {attempts.length ? `Essai n°${attempts.length + 1}` : "Ton prompt"}
              </label>
              <p className="text-sm text-white/65 mt-2 leading-relaxed">
                Décris tout ce que tu vois : le sujet, le style, la lumière, le cadrage, les couleurs, l'ambiance.
              </p>
              <div className="mt-3">
                <StageTextarea id="reverse-prompt" value={prompt} onChange={setPrompt} onSubmit={() => void submit()}
                  disabled={submitting || loadingSession || !session} rows={8} max={MAX_PROMPT}
                  placeholder="Ex : Photo réaliste d'un phare violet sous la pluie, plan large, lumière d'orage…" />
              </div>
              <PromptCues text={prompt} cues={IMAGE_CUES} />
            </div>
            {submitError && <p className="text-sm text-[#fbc2ad]">{submitError}</p>}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="hidden sm:block text-xs text-white/45">Cmd + Entrée pour générer</span>
              <StageButton onClick={() => void submit()} disabled={!prompt.trim() || submitting || !session || prompt.length > MAX_PROMPT}>
                <Sparkles className={submitting ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />{submitting ? "Génération de ton image…" : "Générer mon image"}
              </StageButton>
            </div>
          </div>
        </Stage>
      </div>

      {(submitting || viewed) && target && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <p className="eyebrow" style={{ color: th.fg3 }}>Comparaison avec la cible</p>
            {attempts.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Tes essais">
                {attempts.map((a, i) => (
                  <button key={a.id} type="button" role="tab" aria-selected={i === viewIndex} onClick={() => setViewIndex(i)}
                    title={a.promptText}
                    className={cx("relative shrink-0 w-12 h-12 rounded-[4px] overflow-hidden transition-opacity", i === viewIndex ? "opacity-100" : "opacity-55 hover-fine:opacity-90")}
                    style={{ outline: i === viewIndex ? `2px solid ${th.ink}` : "none", outlineOffset: 2 }}>
                    {a.imageUrl && <img src={a.imageUrl} alt={`Essai ${i + 1}`} className="w-full h-full object-cover" />}
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-white drop-shadow">{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] gap-5 items-start">
            {submitting
              ? <ThinkingPanel height={400} label="Génération de ton image…" hint="une trentaine de secondes" />
              : viewed?.imageUrl
                ? <div key={viewed.id} className="battle-in"><CompareSlider before={target} after={viewed.imageUrl} beforeLabel="Cible" afterLabel={`Essai ${viewIndex + 1}`} /></div>
                : <p className="text-sm" style={{ color: th.danger }}>{viewed?.error ?? "Cette image n'a pas pu être générée."}</p>}
            {viewed && !submitting && (
              <FeedbackBlock title={`Prompt de l'essai n°${viewIndex + 1}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: th.fg }}>{viewed.promptText}</p>
                <button type="button" onClick={() => { setPrompt(viewed.promptText); toTop(); }}
                  className="mt-4 text-xs font-semibold ink-link" style={{ color: th.fg3 }}>Repartir de ce prompt</button>
                <p className="mt-5 text-[13px] leading-relaxed" style={{ color: th.fg2 }}>
                  Fais glisser le curseur : qu'est-ce qui diffère le plus ? Le sujet, le style, la lumière, le cadrage ? Corrige ce point en priorité dans ton prochain essai.
                </p>
              </FeedbackBlock>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
