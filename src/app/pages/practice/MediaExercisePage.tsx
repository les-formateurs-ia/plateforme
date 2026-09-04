import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Send, Sparkles, AlertTriangle, RotateCcw,
  Image as ImageIcon, Video,
} from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import {
  listMediaExerciseAttempts, submitMediaExercise, pollMediaExerciseAttempt,
  type MediaExerciseAttempt, type MediaMode,
} from "@/app/lib/mediaExercise";
import { locateCorrections, renderAnnotatedText, scoreTone, ANNOTATION_RED as RED, ANNOTATION_GREEN as GREEN } from "@/app/lib/textAnnotation";

// Le mode vidéo (Veo, coût réel, plusieurs minutes par tentative) est
// désactivé jusqu'à validation manuelle côté serveur (cf. VIDEO_MODE_ENABLED
// dans evaluate-media-exercise) — on le grise ici en cohérence, plutôt que
// de laisser l'élève cliquer dessus pour rien.
const VIDEO_MODE_ENABLED = false;
const MODES: { id: MediaMode; label: string; Icon: typeof ImageIcon; disabled?: boolean }[] = [
  { id: "image", label: "Image", Icon: ImageIcon },
  { id: "video", label: "Vidéo", Icon: Video, disabled: !VIDEO_MODE_ENABLED },
];

export function MediaExercisePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [attempts, setAttempts] = useState<MediaExerciseAttempt[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<MediaMode>("image");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rows = await listMediaExerciseAttempts(user.id, sessionId);
        if (cancelled) return;
        setAttempts(rows);
        if (rows.length === 0) setComposing(true);
        else setViewIndex(rows.length - 1);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, sessionId]);

  const current = attempts[viewIndex];
  const { anchored, unanchored } = useMemo(
    () => (current ? locateCorrections(current.promptText, current.corrections) : { anchored: [], unanchored: [] }),
    [current],
  );
  const allCorrections = [...anchored, ...unanchored];

  // Tant que la tentative affichée est en cours de génération (surtout la
  // vidéo, qui peut prendre plusieurs minutes), on rappelle le statut jusqu'à
  // aboutissement puis on remplace l'entrée dans la liste locale.
  useEffect(() => {
    if (!current || current.status !== "generating") return;
    let cancelled = false;
    (async () => {
      try {
        const updated = await pollMediaExerciseAttempt(current.id);
        if (cancelled) return;
        setAttempts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } catch (err) {
        if (cancelled) return;
        setAttempts((prev) => prev.map((a) => (a.id === current.id
          ? { ...a, status: "failed", error: err instanceof Error ? err.message : "Erreur de génération." }
          : a)));
      }
    })();
    return () => { cancelled = true; };
  }, [current?.id, current?.status]);

  const handleVerify = async () => {
    if (!draft.trim() || submitting || !sessionId) return;
    setSubmitting(true);
    setSubmitError(null);
    const newIndex = attempts.length;
    try {
      const attempt = await submitMediaExercise(draft.trim(), sessionId, mode);
      setAttempts((prev) => [...prev, attempt]);
      setViewIndex(newIndex);
      setComposing(false);
      setDraft("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = () => {
    setDraft(current?.promptText ?? "");
    if (current) setMode(current.mode);
    setSubmitError(null);
    setComposing(true);
  };

  const cancelEdit = () => {
    setComposing(false);
    setSubmitError(null);
  };

  const tone = current ? scoreTone(current.score) : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice/media")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Historique des tentatives
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Génération images & vidéos</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Écris un prompt, l'IA le note sur 20, le corrige, et génère les deux versions pour comparer.</p>
      </div>

      {loading && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Chargement…</div></GCard>}
      {!loading && loadError && <GCard><div className="p-6 text-sm" style={{ color: RED }}>{loadError}</div></GCard>}

      {!loading && !loadError && composing && (
        <GCard><div className="p-6 space-y-4">
          <label className="text-sm font-bold block" style={{ color: th.fg }}>
            {attempts.length === 0 ? "Ton prompt" : `Nouvelle tentative (n°${attempts.length + 1})`}
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder="Décris l'image ou la vidéo que tu voudrais générer…"
            className="w-full rounded-xl px-4 py-3 text-sm g-input resize-y"
            style={{ minHeight: 160 }}
          />
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: th.fg3 }}>Type de génération</div>
            <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : `${th.gradShadow(0.06)}`, border: `1px solid ${th.sep}` }}>
              {MODES.map(({ id, label, Icon, disabled }) => (
                <button key={id} type="button" onClick={() => setMode(id)} disabled={submitting || disabled}
                  title={disabled ? "Bientôt disponible" : undefined}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                  style={mode === id
                    ? { background: th.isDark ? `${th.gradShadow(0.14)}` : "rgba(255,255,255,0.8)", color: th.navAC, border: `1px solid ${th.gradShadow(0.25)}` }
                    : { color: th.fg3, background: "transparent", border: "1px solid transparent" }}>
                  <Icon className="w-3.5 h-3.5" />{label}{disabled && <span className="text-[9px] opacity-70">· bientôt</span>}
                </button>
              ))}
            </div>
          </div>
          {submitError && <p className="text-xs" style={{ color: RED }}>{submitError}</p>}
          <div className="flex items-center gap-3">
            <ShimBtn onClick={handleVerify} disabled={!draft.trim() || submitting}>
              <span className="flex items-center gap-2">
                {submitting ? <><Sparkles className="w-4 h-4 animate-pulse" />Analyse en cours…</> : <><Send className="w-4 h-4" />Vérifier</>}
              </span>
            </ShimBtn>
            {attempts.length > 0 && <VBtn onClick={cancelEdit} disabled={submitting}>Annuler</VBtn>}
          </div>
        </div></GCard>
      )}

      {!loading && !loadError && !composing && current && tone && (
        <>
          <GCard glow><div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: th.navAC }}>
                  {current.mode === "image" ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                  Tentative n°{current.attemptNumber} · {current.mode === "image" ? "Image" : "Vidéo"}
                </div>
                <h3 className="text-sm font-black" style={{ color: th.fg }}>Ton prompt, annoté</h3>
              </div>
              <div className="flex items-center px-4 py-2 rounded-xl text-sm font-black shrink-0" style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.color}40` }}>
                {current.score}/20
              </div>
            </div>
            <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}>
              {renderAnnotatedText(current.promptText, anchored, th)}
            </div>
          </div></GCard>

          <GCard><div className="p-5 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: th.navAC }}>Prompt corrigé par l'IA</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: th.fg }}>{current.correctedPromptText}</p>
          </div></GCard>

          {allCorrections.length > 0 && (
            <GCard><div className="p-6 space-y-4">
              <h3 className="text-sm font-black" style={{ color: th.fg }}>Corrections détaillées</h3>
              <div className="space-y-4">
                {allCorrections.map((c) => (
                  <div key={c.index} className="flex gap-3">
                    <span className="shrink-0 rounded-full flex items-center justify-center font-bold text-xs" style={{ width: 22, height: 22, background: th.navAC, color: th.isDark ? "#06121c" : "#fff" }}>{c.index}</span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs leading-relaxed">
                        <span style={{ color: RED, textDecoration: "line-through" }}>{c.excerpt}</span>
                        <span style={{ color: th.fg3 }}> → </span>
                        <span style={{ color: GREEN, fontWeight: 600 }}>{c.suggestion}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: th.fg2 }}>{c.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div></GCard>
          )}

          {current.missing.length > 0 && (
            <GCard><div className="p-6 space-y-4">
              <h3 className="text-sm font-black flex items-center gap-2" style={{ color: th.fg }}><AlertTriangle className="w-4 h-4" style={{ color: "#fbc2ad" }} />Ce qu'il manque</h3>
              <div className="space-y-4">
                {current.missing.map((m, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: "#fbc2ad" }} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs font-bold" style={{ color: th.fg }}>{m.title}</div>
                      <p className="text-xs leading-relaxed" style={{ color: th.fg2 }}>{m.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div></GCard>
          )}

          <GCard accent><div className="p-6 space-y-2">
            <h3 className="text-sm font-black" style={{ color: th.fg }}>Verdict</h3>
            <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>{current.verdict}</p>
          </div></GCard>

          <GCard><div className="p-6 space-y-4">
            <h3 className="text-sm font-black" style={{ color: th.fg }}>Résultat généré</h3>

            {current.status === "generating" && (
              <div className="rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, minHeight: 160 }}>
                <Sparkles className="w-5 h-5 animate-pulse" style={{ color: th.navAC }} />
                <p className="text-xs" style={{ color: th.fg3 }}>
                  {current.mode === "video" ? "Génération de la vidéo en cours… ça peut prendre plusieurs minutes." : "Génération de l'image en cours…"}
                </p>
              </div>
            )}

            {current.status === "failed" && (
              <p className="text-xs" style={{ color: RED }}>{current.error ?? "Échec de la génération."}</p>
            )}

            {current.status === "ready" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: th.fg3 }}>Avec ton prompt original</div>
                  {current.mode === "image"
                    ? <img src={current.originalUrl ?? undefined} className="w-full rounded-xl bg-black" style={{ aspectRatio: "1/1", objectFit: "cover" }} />
                    : <video src={current.originalUrl ?? undefined} controls className="w-full rounded-xl bg-black" style={{ aspectRatio: "16/9" }} />}
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold" style={{ color: th.navAC }}>Avec le prompt corrigé</div>
                  {current.mode === "image"
                    ? <img src={current.correctedUrl ?? undefined} className="w-full rounded-xl bg-black" style={{ aspectRatio: "1/1", objectFit: "cover" }} />
                    : <video src={current.correctedUrl ?? undefined} controls className="w-full rounded-xl bg-black" style={{ aspectRatio: "16/9" }} />}
                </div>
              </div>
            )}
          </div></GCard>

          <div className="flex items-center justify-between">
            <VBtn onClick={startEdit}><span className="flex items-center gap-2"><RotateCcw className="w-4 h-4" />Corriger et renvoyer</span></VBtn>
            {attempts.length > 1 && (
              <div className="flex items-center gap-3">
                <button onClick={() => setViewIndex((i) => Math.max(0, i - 1))} disabled={viewIndex === 0}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-80"
                  style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                  <ChevronLeft className="w-4 h-4" style={{ color: th.fg }} />
                </button>
                <span className="text-xs font-semibold" style={{ color: th.fg3 }}>{viewIndex + 1} / {attempts.length}</span>
                <button onClick={() => setViewIndex((i) => Math.min(attempts.length - 1, i + 1))} disabled={viewIndex === attempts.length - 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-80"
                  style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                  <ChevronRight className="w-4 h-4" style={{ color: th.fg }} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
