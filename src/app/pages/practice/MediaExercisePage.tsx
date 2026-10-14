import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Image as ImageIcon, Sparkles, Video, Wand2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import {
  AttemptTrail, CompareSlider, CopyButton, CorrectionList, ExerciseHeader, FeedbackBlock, MissingList, PromptCues,
  IMAGE_CUES, ScoreDelta, ScoreRing, Stage, StageButton, StageChip, StageTextarea, ThinkingPanel,
} from "@/app/components/practice/ExerciseKit";
import {
  listMediaExerciseAttempts, submitMediaExercise, pollMediaExerciseAttempt,
  type MediaExerciseAttempt, type MediaMode,
} from "@/app/lib/mediaExercise";
import { locateCorrections, renderAnnotatedText } from "@/app/lib/textAnnotation";

// Images & vidéos : même boucle que les Exercices prompts (écrire → note →
// améliorer avec les remarques à côté), plus le résultat généré avec le
// prompt d'origine et avec le prompt corrigé, comparés au curseur.
//
// Le mode vidéo (Veo, coût réel, plusieurs minutes par tentative) est
// désactivé jusqu'à validation manuelle côté serveur (cf. VIDEO_MODE_ENABLED
// dans evaluate-media-exercise) — grisé ici en cohérence.
const VIDEO_MODE_ENABLED = false;
const MAX_PROMPT = 2000;

const IDEAS: { tag: string; brief: string }[] = [
  { tag: "Visuel produit", brief: "Une photo produit de ta tasse de café préférée, pour une boutique en ligne." },
  { tag: "Bannière LinkedIn", brief: "Une bannière qui illustre ton métier, sans texte, au format paysage." },
  { tag: "Illustration d'article", brief: "Une illustration pour un article de blog sur le télétravail." },
  { tag: "Affiche d'événement", brief: "Le visuel principal d'un afterwork d'entreprise sur un rooftop au coucher du soleil." },
];


export function MediaExercisePage() {
  const th = useTh();
  // Conteneur qui défile (pas la fenêtre) : on y remonte en haut quand
  // l'éditeur ou un nouveau résultat s'affiche.
  const pageRef = useRef<HTMLDivElement>(null);
  const toTop = () => pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const { user } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [attempts, setAttempts] = useState<MediaExerciseAttempt[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [idea, setIdea] = useState<string | null>(null);
  const [mode, setMode] = useState<MediaMode>("image");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    listMediaExerciseAttempts(user.id, sessionId)
      .then((rows) => {
        if (cancelled) return;
        setAttempts(rows);
        if (rows.length === 0) setComposing(true);
        else setViewIndex(rows.length - 1);
      })
      .catch((err) => { if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, sessionId]);

  const current = attempts[viewIndex] as MediaExerciseAttempt | undefined;
  const located = useMemo(
    () => (current ? locateCorrections(current.promptText, current.corrections) : { anchored: [], unanchored: [] }),
    [current],
  );
  const corrections = [...located.anchored, ...located.unanchored];
  const previous = viewIndex > 0 ? attempts[viewIndex - 1] : null;
  const reference = composing && attempts.length > 0 ? current : undefined;

  // Tant que la tentative affichée est en cours de génération, on rappelle
  // le statut jusqu'à aboutissement puis on remplace l'entrée locale.
  useEffect(() => {
    if (!current || current.status !== "generating") return;
    let cancelled = false;
    pollMediaExerciseAttempt(current.id)
      .then((updated) => { if (!cancelled) setAttempts((prev) => prev.map((a) => (a.id === updated.id ? updated : a))); })
      .catch((err) => {
        if (cancelled) return;
        setAttempts((prev) => prev.map((a) => (a.id === current.id
          ? { ...a, status: "failed", error: err instanceof Error ? err.message : "Erreur de génération." }
          : a)));
      });
    return () => { cancelled = true; };
  }, [current?.id, current?.status]);

  const verify = async () => {
    if (!draft.trim() || submitting || !sessionId || draft.length > MAX_PROMPT) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const attempt = await submitMediaExercise(draft.trim(), sessionId, mode);
      setAttempts((prev) => [...prev, attempt]);
      setViewIndex(attempts.length);
      setComposing(false);
      setDraft("");
      toTop();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
    } finally {
      setSubmitting(false);
    }
  };

  const improve = (text?: string) => {
    setDraft(text ?? current?.promptText ?? "");
    if (current) setMode(current.mode);
    setSubmitError(null);
    setComposing(true);
    toTop();
  };

  const ideaBrief = IDEAS.find((i) => i.tag === idea)?.brief;
  const MediaIcon = current?.mode === "video" ? Video : ImageIcon;

  return (
    <div ref={pageRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <ExerciseHeader backTo="/practice/media" backLabel="Tes tests" eyebrow="IA · Image & vidéo" icon={<ImageIcon className="w-3.5 h-3.5" />}
        title="Images & vidéos" intro="Écris un prompt, l'IA le note sur 20, le corrige, et génère les deux versions pour comparer." />

      {loading && <div className="h-64 rounded-[10px] animate-pulse" style={{ background: th.navA }} aria-busy="true" aria-label="Chargement" />}
      {!loading && loadError && <p className="text-sm" style={{ color: th.danger }}>{loadError}</p>}

      {!loading && !loadError && attempts.length > 0 && (
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="eyebrow mb-2" style={{ color: th.fg3 }}>Ta progression</p>
            <AttemptTrail scores={attempts.map((a) => a.score)} active={composing ? -1 : viewIndex}
              onSelect={(i) => { setViewIndex(i); setComposing(false); }} />
          </div>
          {!composing && <ShimBtn sm onClick={() => improve()}><Wand2 className="w-4 h-4" />Améliorer ce prompt</ShimBtn>}
        </div>
      )}

      {!loading && !loadError && composing && (
        <div className={reference ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start" : undefined}>
          <Stage active={submitting}>
            <div className="px-5 sm:px-7 py-6 sm:py-7 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="eyebrow text-white/55">Que veux-tu générer ?</p>
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-[4px]" style={{ border: "1px solid rgba(255,255,255,0.22)" }}>
                  {([["image", "Image", ImageIcon, false], ["video", "Vidéo", Video, !VIDEO_MODE_ENABLED]] as const).map(([id, label, Icon, off]) => (
                    <button key={id} type="button" onClick={() => setMode(id)} disabled={submitting || off} title={off ? "Bientôt disponible" : undefined}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-colors disabled:opacity-40"
                      style={mode === id ? { background: "#fff", color: "#000" } : { color: "rgba(255,255,255,0.7)" }}>
                      <Icon className="w-3.5 h-3.5" />{label}{off && <span className="text-[9px] opacity-70">· bientôt</span>}
                    </button>
                  ))}
                </div>
              </div>

              {!reference && (
                <div>
                  <p className="text-xs text-white/55">En panne d'idée ?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {IDEAS.map((i) => (
                      <StageChip key={i.tag} active={idea === i.tag} disabled={submitting} onClick={() => setIdea((cur) => (cur === i.tag ? null : i.tag))}>{i.tag}</StageChip>
                    ))}
                  </div>
                  {ideaBrief && <p className="battle-in mt-3 text-sm leading-relaxed text-white/80 pl-3" style={{ borderLeft: "2px solid rgba(255,255,255,0.5)" }}>{ideaBrief}</p>}
                </div>
              )}

              <div>
                <label htmlFor="media-draft" className="eyebrow text-white/55">
                  {reference ? `Tentative n°${attempts.length + 1} · corrige ton prompt` : "Décris ton image"}
                </label>
                <div className="mt-3">
                  <StageTextarea id="media-draft" value={draft} onChange={setDraft} onSubmit={() => void verify()} disabled={submitting}
                    rows={reference ? 10 : 7} max={MAX_PROMPT}
                    placeholder="Ex : Photo réaliste d'une tasse de café fumante sur un bureau en bois, lumière douce du matin, gros plan…" />
                </div>
                <p className="text-[11px] text-white/45 mb-2">Repères d'un bon prompt d'image</p>
                <PromptCues text={draft} cues={IMAGE_CUES} />
              </div>

              {submitError && <p className="text-sm text-[#fbc2ad]">{submitError}</p>}

              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                {attempts.length > 0
                  ? <button type="button" onClick={() => setComposing(false)} disabled={submitting} className="text-sm font-semibold text-white/60 hover-fine:text-white disabled:opacity-40">Annuler</button>
                  : <span className="hidden sm:block text-xs text-white/45">Cmd + Entrée pour envoyer</span>}
                <StageButton onClick={() => void verify()} disabled={!draft.trim() || submitting || draft.length > MAX_PROMPT}>
                  <Sparkles className={submitting ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />{submitting ? "L'IA analyse ton prompt…" : "Noter et générer"}
                </StageButton>
              </div>
            </div>
          </Stage>

          {reference && (
            <aside className="lg:sticky lg:top-4 space-y-4">
              <div className="rounded-[10px] p-5 flex items-center gap-4" style={{ border: `1px solid ${th.sep}` }}>
                <ScoreRing score={reference.score} size={64} />
                <div className="min-w-0">
                  <p className="eyebrow" style={{ color: th.fg3 }}>Tentative n°{reference.attemptNumber}</p>
                  <button type="button" onClick={() => setDraft(reference.correctedPromptText)} className="text-sm mt-1 font-semibold ink-link text-left" style={{ color: th.fg }}>
                    Partir du prompt corrigé par l'IA
                  </button>
                </div>
              </div>
              {corrections.length > 0 && <FeedbackBlock title="À corriger"><CorrectionList corrections={corrections} compact /></FeedbackBlock>}
              {reference.missing.length > 0 && <FeedbackBlock title="À ajouter"><MissingList items={reference.missing} /></FeedbackBlock>}
            </aside>
          )}
        </div>
      )}

      {!loading && !loadError && !composing && current && (
        <div key={current.id} className="battle-in space-y-5">
          <div className="rounded-[10px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5" style={{ border: `1px solid ${th.ink}` }}>
            <ScoreRing score={current.score} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="eyebrow flex items-center gap-1.5" style={{ color: th.fg3 }}><MediaIcon className="w-3 h-3" />Tentative n°{current.attemptNumber} · Verdict</p>
                <ScoreDelta delta={previous ? current.score - previous.score : null} />
              </div>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: th.fg }}>{current.verdict}</p>
            </div>
          </div>

          <FeedbackBlock title="Le résultat, avant et après correction">
            {current.status === "generating" && (
              <ThinkingPanel height={320} label={current.mode === "video" ? "Génération des deux vidéos…" : "Génération des deux images…"}
                hint={current.mode === "video" ? "plusieurs minutes" : "une trentaine de secondes"} />
            )}
            {current.status === "failed" && <p className="text-sm" style={{ color: th.danger }}>{current.error ?? "Échec de la génération."}</p>}
            {current.status === "ready" && current.mode === "image" && current.originalUrl && current.correctedUrl && (
              <div className="max-w-[560px] mx-auto">
                <CompareSlider before={current.originalUrl} after={current.correctedUrl} beforeLabel="Ton prompt" afterLabel="Prompt corrigé" />
                <p className="text-xs text-center mt-2" style={{ color: th.fg3 }}>Fais glisser le curseur pour comparer.</p>
              </div>
            )}
            {current.status === "ready" && current.mode === "video" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[["Ton prompt", current.originalUrl], ["Prompt corrigé", current.correctedUrl]].map(([label, url]) => (
                  <div key={label} className="space-y-2">
                    <p className="text-xs font-bold" style={{ color: th.fg3 }}>{label}</p>
                    <video src={url ?? undefined} controls className="w-full rounded-[8px] bg-black" style={{ aspectRatio: "16/9" }} />
                  </div>
                ))}
              </div>
            )}
          </FeedbackBlock>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <div className="space-y-5">
              <FeedbackBlock title="Ton prompt, annoté">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: th.fg }}>
                  {renderAnnotatedText(current.promptText, located.anchored, th)}
                </div>
              </FeedbackBlock>
              <FeedbackBlock title="Prompt corrigé par l'IA" accent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: th.fg }}>{current.correctedPromptText}</p>
                <div className="mt-4 flex items-center gap-4">
                  <CopyButton text={current.correctedPromptText} />
                  <button type="button" onClick={() => improve(current.correctedPromptText)} className="text-xs font-semibold ink-link" style={{ color: th.fg3 }}>Repartir de cette version</button>
                </div>
              </FeedbackBlock>
            </div>
            <div className="space-y-5">
              {corrections.length > 0 && <FeedbackBlock title={`Corrections détaillées · ${corrections.length}`}><CorrectionList corrections={corrections} /></FeedbackBlock>}
              {current.missing.length > 0 && <FeedbackBlock title="Ce qu'il manque"><MissingList items={current.missing} /></FeedbackBlock>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ShimBtn onClick={() => improve()}><Wand2 className="w-4 h-4" />Améliorer ce prompt</ShimBtn>
            <VBtn onClick={() => { setDraft(""); setSubmitError(null); setComposing(true); }}>Nouvelle image</VBtn>
          </div>
        </div>
      )}
    </div>
  );
}
