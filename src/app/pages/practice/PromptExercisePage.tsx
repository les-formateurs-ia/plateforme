import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { PenLine, Sparkles, Wand2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import {
  AttemptTrail, CopyButton, CorrectionList, ExerciseHeader, FeedbackBlock, MissingList, PromptCues,
  ScoreDelta, ScoreRing, Stage, StageButton, StageChip, StageTextarea,
} from "@/app/components/practice/ExerciseKit";
import { listPromptExerciseAttempts, submitPromptExercise, type PromptExerciseAttempt } from "@/app/lib/promptExercise";
import { locateCorrections, renderAnnotatedText } from "@/app/lib/textAnnotation";

// Exercices prompts : écrire → être noté → améliorer, en boucle. Pour
// améliorer, l'éditeur s'ouvre prérempli avec les remarques de la
// tentative juste à côté : plus besoin de mémoriser les corrections avant de
// réécrire. Les missions donnent un point de départ concret (facultatif :
// l'évaluation note le prompt tel quel).

const MAX_PROMPT = 4000;

const MISSIONS: { tag: string; brief: string }[] = [
  { tag: "Offre d'emploi", brief: "Tu recrutes un(e) assistant(e) commercial(e) en CDI pour une PME de 30 personnes. Fais rédiger l'annonce par l'IA." },
  { tag: "Compte rendu", brief: "Tu sors d'une réunion d'équipe d'une heure avec des notes en vrac. Fais-en tirer un compte rendu clair avec les décisions et les actions." },
  { tag: "Réponse client", brief: "Un client mécontent se plaint d'un retard de livraison de 10 jours. Fais rédiger une réponse qui apaise sans promettre l'impossible." },
  { tag: "Post LinkedIn", brief: "Ton entreprise vient de remporter un prix d'innovation. Fais écrire un post LinkedIn qui donne envie de lire sans paraître prétentieux." },
  { tag: "Plan de formation", brief: "Tu dois former 8 collègues non techniques à l'IA générative en une demi-journée. Fais construire le programme." },
  { tag: "Analyse", brief: "Tu as les chiffres de ventes de 4 trimestres de 3 produits. Fais-les analyser pour préparer une réunion de direction." },
];

const CUES = [
  { label: "Rôle", test: /(tu es |tu seras|agis comme|agis en|en tant que|joue le rôle|incarne)/i, hint: "Donne un rôle à l'IA : « Tu es un recruteur expérimenté… »" },
  { label: "Contexte", test: /(je suis|nous sommes|contexte|mon entreprise|notre entreprise|notre équipe|pour un client|j'ai besoin|situation)/i, hint: "Explique la situation : qui tu es, pour qui, pourquoi." },
  { label: "Tâche", test: /(rédige|écris|crée|propose|analyse|résume|explique|génère|liste|compare|traduis|corrige|construis|prépare)/i, hint: "Dis clairement ce que l'IA doit produire." },
  { label: "Format", test: /(format|tableau|liste|puces|paragraphe|\d+\s*(mots|phrases|lignes|points|parties)|markdown|sections?|plan)/i, hint: "Précise la forme attendue : longueur, structure, tableau…" },
  { label: "Ton & public", test: /(ton |style|registre|public|cible|destinataire|lecteur|formel|courtois|professionnel|chaleureux)/i, hint: "À qui s'adresse le texte, et sur quel ton ?" },
  { label: "Contraintes", test: /(maximum|minimum|sans |évite|n'utilise pas|ne pas|ne dois|obligatoire|impératif|uniquement)/i, hint: "Ce qu'il faut absolument faire ou éviter." },
];

export function PromptExercisePage() {
  const th = useTh();
  // Conteneur qui défile (pas la fenêtre) : on y remonte en haut quand
  // l'éditeur ou un nouveau résultat s'affiche.
  const pageRef = useRef<HTMLDivElement>(null);
  const toTop = () => pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const { user } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [attempts, setAttempts] = useState<PromptExerciseAttempt[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [mission, setMission] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    listPromptExerciseAttempts(user.id, sessionId)
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

  const current = attempts[viewIndex] as PromptExerciseAttempt | undefined;
  const located = useMemo(
    () => (current ? locateCorrections(current.promptText, current.corrections) : { anchored: [], unanchored: [] }),
    [current],
  );
  const corrections = [...located.anchored, ...located.unanchored];
  const previous = viewIndex > 0 ? attempts[viewIndex - 1] : null;
  // Tentative dont on garde les remarques à côté de l'éditeur.
  const reference = composing && attempts.length > 0 ? current : undefined;

  const verify = async () => {
    if (!draft.trim() || submitting || !sessionId || draft.length > MAX_PROMPT) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const attempt = await submitPromptExercise(draft.trim(), sessionId);
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

  const improve = () => {
    setDraft(current?.promptText ?? "");
    setSubmitError(null);
    setComposing(true);
    toTop();
  };

  const missionBrief = MISSIONS.find((m) => m.tag === mission)?.brief;

  return (
    <div ref={pageRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <ExerciseHeader backTo="/practice/prompts" backLabel="Tes tests" eyebrow="Écriture de prompts" icon={<PenLine className="w-3.5 h-3.5" />}
        title="Exercices prompts" intro="Écris un prompt, l'IA le note sur 20 et t'explique précisément quoi corriger." />

      {loading && <div className="h-64 rounded-[10px] animate-pulse" style={{ background: th.navA }} aria-busy="true" aria-label="Chargement" />}
      {!loading && loadError && <p className="text-sm" style={{ color: th.danger }}>{loadError}</p>}

      {!loading && !loadError && attempts.length > 0 && (
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="eyebrow mb-2" style={{ color: th.fg3 }}>Ta progression</p>
            <AttemptTrail scores={attempts.map((a) => a.score)} active={composing ? -1 : viewIndex}
              onSelect={(i) => { setViewIndex(i); setComposing(false); }} />
          </div>
          {!composing && <ShimBtn sm onClick={improve}><Wand2 className="w-4 h-4" />Améliorer ce prompt</ShimBtn>}
        </div>
      )}

      {!loading && !loadError && composing && (
        <div className={reference ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start" : undefined}>
          <Stage active={submitting}>
            <div className="px-5 sm:px-7 py-6 sm:py-7 space-y-5">
              {!reference && (
                <div>
                  <p className="eyebrow text-white/55">1 · Choisis une mission, ou pars de ton propre besoin</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MISSIONS.map((m) => (
                      <StageChip key={m.tag} active={mission === m.tag} disabled={submitting} onClick={() => setMission((cur) => (cur === m.tag ? null : m.tag))}>{m.tag}</StageChip>
                    ))}
                  </div>
                  {missionBrief && (
                    <p className="battle-in mt-3 text-sm leading-relaxed text-white/80 pl-3" style={{ borderLeft: "2px solid rgba(255,255,255,0.5)" }}>{missionBrief}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="prompt-draft" className="eyebrow text-white/55">
                  {reference ? `Tentative n°${attempts.length + 1} · corrige ton prompt` : "2 · Écris ton prompt"}
                </label>
                <div className="mt-3">
                  <StageTextarea id="prompt-draft" value={draft} onChange={setDraft} onSubmit={() => void verify()} disabled={submitting}
                    rows={reference ? 12 : 9} max={MAX_PROMPT}
                    placeholder={missionBrief ? "Écris le prompt que tu enverrais à l'IA pour cette mission…" : "Écris ici le prompt que tu voudrais envoyer à une IA…"} />
                </div>
                <p className="text-[11px] text-white/45 mb-2">Repères d'un bon prompt</p>
                <PromptCues text={draft} cues={CUES} />
              </div>

              {submitError && <p className="text-sm text-[#fbc2ad]">{submitError}</p>}

              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                {attempts.length > 0
                  ? <button type="button" onClick={() => setComposing(false)} disabled={submitting} className="text-sm font-semibold text-white/60 hover-fine:text-white disabled:opacity-40">Annuler</button>
                  : <span className="hidden sm:block text-xs text-white/45">Cmd + Entrée pour envoyer</span>}
                <StageButton onClick={() => void verify()} disabled={!draft.trim() || submitting || draft.length > MAX_PROMPT}>
                  <Sparkles className={submitting ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />{submitting ? "L'IA analyse ton prompt…" : "Faire noter mon prompt"}
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
                  <p className="text-sm mt-1 leading-snug" style={{ color: th.fg2 }}>Corrige ces points pour gagner des points.</p>
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
                <p className="eyebrow" style={{ color: th.fg3 }}>Tentative n°{current.attemptNumber} · Verdict</p>
                <ScoreDelta delta={previous ? current.score - previous.score : null} />
              </div>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: th.fg }}>{current.verdict}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <FeedbackBlock title="Ton prompt, annoté">
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: th.fg }}>
                {renderAnnotatedText(current.promptText, located.anchored, th)}
              </div>
              <div className="mt-4"><CopyButton text={current.promptText} label="Copier le prompt" /></div>
            </FeedbackBlock>
            <div className="space-y-5">
              {corrections.length > 0 && <FeedbackBlock title={`Corrections détaillées · ${corrections.length}`}><CorrectionList corrections={corrections} /></FeedbackBlock>}
              {current.missing.length > 0 && <FeedbackBlock title="Ce qu'il manque"><MissingList items={current.missing} /></FeedbackBlock>}
              {corrections.length === 0 && current.missing.length === 0 && (
                <FeedbackBlock title="Corrections"><p className="text-sm" style={{ color: th.fg2 }}>Rien à corriger : ton prompt est solide.</p></FeedbackBlock>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ShimBtn onClick={improve}><Wand2 className="w-4 h-4" />Améliorer ce prompt</ShimBtn>
            <VBtn onClick={() => { setDraft(""); setSubmitError(null); setComposing(true); }}>Repartir de zéro</VBtn>
          </div>
        </div>
      )}
    </div>
  );
}
