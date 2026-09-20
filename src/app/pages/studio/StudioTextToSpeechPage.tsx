// Module "Du texte à l'audio" (Le Studio) — synthèse vocale (Text-to-Speech)
// via l'API Runware (MiniMax Speech 2.8, cf. src/app/lib/studioTextToSpeech.ts).
// Layout à deux volets (formulaire + galerie), même parti pris que
// StudioMusicPage.tsx : pas de format/image à gérer, un panneau latéral
// compact colle mieux qu'une barre flottante.
//
// Langue + voix séparées (2026-09-20) : le catalogue Runware complet (250
// voix, 15 langues + voix spéciales, cf. studioTextToSpeech.ts) rend un seul
// menu plat illisible — on choisit d'abord la langue, qui filtre la liste de
// voix. Réglages expressifs (vitesse/hauteur/émotion/volume) repliés sous
// "Réglages de la voix" : ce sont des champs avancés, pas la première chose
// qu'un élève doit remplir pour juste générer un audio.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronDown, Download, Loader2, Volume2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { MediaGenerationPlaceholder } from "@/app/components/common/MediaGenerationPlaceholder";
import { useMediaGenerations, type MediaGeneration } from "@/app/lib/useMediaGenerations";
import { useGeneratedMedia } from "@/app/lib/useGeneratedMedia";
import {
  TTS_LANGUAGES, TTS_VOICES, TTS_EMOTIONS, TTS_SPEED_RANGE, TTS_VOLUME_RANGE, TTS_PITCH_RANGE,
  DEFAULT_TTS_VOICE, SCRIPT_MAX_LENGTH, getMyTtsGenerations, getStudioTtsSignedUrl,
  requestTtsGeneration, pollTtsGenerationStatus, type StudioTtsGeneration,
} from "@/app/lib/studioTextToSpeech";

const PROMPT_MAX_HEIGHT = 160;
const DEFAULT_LANGUAGE = TTS_LANGUAGES.find((g) => g.voices.some((v) => v.id === DEFAULT_TTS_VOICE))!.code;

function Slider({ label, value, onChange, range, disabled, format }: {
  label: string; value: number; onChange: (v: number) => void;
  range: { min: number; max: number; step: number }; disabled: boolean; format: (v: number) => string;
}) {
  const th = useTh();
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold" style={{ color: th.fg }}>{label}</label>
        <span className="text-xs font-semibold tabular-nums" style={{ color: th.fg3 }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full disabled:opacity-50"
        style={{ accentColor: th.navAC }}
      />
    </div>
  );
}

function TtsCard({ gen, onRetry, retryDisabled }: { gen: MediaGeneration<StudioTtsGeneration>; onRetry: () => void; retryDisabled: boolean }) {
  const th = useTh();
  const audio = useGeneratedMedia(gen.status === "ready" ? gen.audioPath : null, getStudioTtsSignedUrl);
  const error = gen.trackingError || (gen.status === "failed" ? gen.errorMessage || "La génération a échoué." : null) || audio.error || (gen.status === "ready" && !gen.audioPath ? "Le média généré est indisponible." : null);
  const ready = gen.status === "ready" && audio.loaded && !error;
  const voiceLabel = TTS_VOICES.find((v) => v.id === gen.voice)?.label ?? gen.voice;
  const emotionLabel = gen.emotion ? TTS_EMOTIONS.find((e) => e.id === gen.emotion)?.label : null;

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
      <div className="relative w-full" style={{ minHeight: 96 }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : th.gradShadow(0.06) }}>
          <Volume2 className="w-7 h-7" style={{ color: th.fg3 }} />
        </div>
        <MediaGenerationPlaceholder kind="audio" ready={ready} error={error} onRetry={audio.error ? audio.retry : onRetry} retryDisabled={retryDisabled && !audio.error} />
      </div>
      <div className="p-4 space-y-2.5">
        <p className="text-sm line-clamp-3" style={{ color: th.fg }}>{gen.scriptText}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg3 }}>{voiceLabel}</span>
          {emotionLabel && (
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg3 }}>{emotionLabel}</span>
          )}
          {gen.speed != null && gen.speed !== TTS_SPEED_RANGE.default && (
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg3 }}>Vitesse ×{gen.speed}</span>
          )}
        </div>
        {gen.status === "ready" && (
          <div className="space-y-2 pt-1">
            {audio.url ? <audio key={audio.url} controls preload="metadata" src={audio.url} onLoadedMetadata={audio.onLoad} onError={audio.onError} className="w-full h-9" /> : <p className="text-xs" style={{ color: th.fg3 }}>Chargement du lecteur…</p>}
            {audio.url && (
              <a href={audio.url} download="audio.mp3" className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity" style={{ color: th.fg2 }}>
                <Download className="w-3.5 h-3.5" />Télécharger
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function StudioTextToSpeechPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [script, setScript] = useState("");
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE);
  const [voiceId, setVoiceId] = useState(DEFAULT_TTS_VOICE);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [speed, setSpeed] = useState(TTS_SPEED_RANGE.default);
  const [pitch, setPitch] = useState(TTS_PITCH_RANGE.default);
  const [volume, setVolume] = useState(TTS_VOLUME_RANGE.default);
  const [emotion, setEmotion] = useState<string>("auto");
  const scriptRef = useRef<HTMLTextAreaElement>(null);
  const { generations, generating, loading, historyError, start, retry } = useMediaGenerations(user?.id, getMyTtsGenerations, pollTtsGenerationStatus, (result) => ({ audioPath: result.audioPath }));

  const currentLanguage = useMemo(() => TTS_LANGUAGES.find((g) => g.code === languageCode) ?? TTS_LANGUAGES[0], [languageCode]);
  const voiceOptions = useMemo(() => currentLanguage.voices.map((v) => ({ value: v.id, label: v.label })), [currentLanguage]);
  const isDefaultControls = speed === TTS_SPEED_RANGE.default && pitch === TTS_PITCH_RANGE.default && volume === TTS_VOLUME_RANGE.default && emotion === "auto";

  useEffect(() => {
    const el = scriptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, PROMPT_MAX_HEIGHT)}px`;
  }, [script]);

  const handleLanguageChange = (code: string) => {
    setLanguageCode(code);
    const group = TTS_LANGUAGES.find((g) => g.code === code);
    if (group && !group.voices.some((v) => v.id === voiceId)) setVoiceId(group.voices[0].id);
  };

  const pendingCount = generations.filter((g) => g.status === "pending").length;

  const handleGenerate = async () => {
    if (!user || !script.trim() || generating) return;
    const controls = {
      speed: speed !== TTS_SPEED_RANGE.default ? speed : undefined,
      pitch: pitch !== TTS_PITCH_RANGE.default ? pitch : undefined,
      volume: volume !== TTS_VOLUME_RANGE.default ? volume : undefined,
      emotion: emotion !== "auto" ? emotion : undefined,
    };
    const draft: StudioTtsGeneration = {
      id: crypto.randomUUID(), status: "pending", scriptText: script.trim(), voice: voiceId, language: languageCode,
      speed: controls.speed ?? null, pitch: controls.pitch ?? null, volume: controls.volume ?? null, emotion: controls.emotion ?? null,
      audioPath: null, errorMessage: null, createdAt: new Date().toISOString(),
    };
    await start(draft, () => requestTtsGeneration({ script: draft.scriptText, voice: draft.voice, ...controls }));
    setScript("");
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Le Studio
      </button>

      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>Du texte à l'audio</h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Convertis instantanément un script écrit en voix naturelle (Text-to-Speech).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        <GCard className="lg:sticky lg:top-5">
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Texte à convertir</label>
              <textarea
                ref={scriptRef}
                value={script}
                onChange={(e) => setScript(e.target.value.slice(0, SCRIPT_MAX_LENGTH))}
                rows={4}
                disabled={generating}
                placeholder="Écris ou colle le texte que tu veux entendre à voix haute…"
                className="w-full rounded-2xl px-3.5 py-2.5 text-sm outline-none resize-none"
                style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg, maxHeight: PROMPT_MAX_HEIGHT, overflowY: "auto" }}
              />
              <p className="text-[11px] text-right mt-1" style={{ color: th.fg3 }}>{script.length}/{SCRIPT_MAX_LENGTH}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Langue</label>
                <VSelect value={languageCode} onValueChange={handleLanguageChange} options={TTS_LANGUAGES.map((g) => ({ value: g.code, label: g.label }))} disabled={generating} sm />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Voix</label>
                <VSelect value={voiceId} onValueChange={setVoiceId} options={voiceOptions} disabled={generating} sm />
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${th.inputB}` }}>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-colors"
                style={{ color: th.fg, background: th.inputBg }}
              >
                <span>Réglages de la voix{!isDefaultControls && <span style={{ color: th.navAC }}> · personnalisés</span>}</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: showAdvanced ? "rotate(180deg)" : undefined, color: th.fg3 }} />
              </button>
              {showAdvanced && (
                <div className="p-3.5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Émotion</label>
                    <VSelect
                      value={emotion}
                      onValueChange={setEmotion}
                      options={[{ value: "auto", label: "Automatique (selon le texte)" }, ...TTS_EMOTIONS.map((e) => ({ value: e.id, label: e.label }))]}
                      disabled={generating}
                      sm
                    />
                  </div>
                  <Slider label="Vitesse" value={speed} onChange={setSpeed} range={TTS_SPEED_RANGE} disabled={generating} format={(v) => `×${v.toFixed(1)}`} />
                  <Slider label="Tonalité (grave / aiguë)" value={pitch} onChange={setPitch} range={TTS_PITCH_RANGE} disabled={generating} format={(v) => (v > 0 ? `+${v}` : `${v}`)} />
                  <Slider label="Volume" value={volume} onChange={setVolume} range={TTS_VOLUME_RANGE} disabled={generating} format={(v) => `×${v.toFixed(1)}`} />
                  {!isDefaultControls && (
                    <button
                      type="button"
                      onClick={() => { setSpeed(TTS_SPEED_RANGE.default); setPitch(TTS_PITCH_RANGE.default); setVolume(TTS_VOLUME_RANGE.default); setEmotion("auto"); }}
                      className="text-xs font-semibold hover:opacity-70 transition-opacity"
                      style={{ color: th.fg2 }}
                    >
                      Réinitialiser les réglages
                    </button>
                  )}
                </div>
              )}
            </div>

            <ShimBtn full onClick={handleGenerate} disabled={!script.trim() || generating}>
              <span className="flex items-center justify-center gap-1.5">
                {generating ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> : <Volume2 className="w-4 h-4" />}
                {generating ? "Génération…" : "Générer la voix"}
              </span>
            </ShimBtn>
          </div>
        </GCard>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-black" style={{ color: th.fg }}>Vos créations audio</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg3 }}>{generations.length}</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg3 }}>
                <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" />{pendingCount} en cours
              </span>
            )}
          </div>

          {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
          {historyError && <p role="alert" className="text-sm" style={{ color: th.fg2 }}>{historyError}</p>}
          {!loading && !generations.length && (
            <GCard><div className="p-8 text-center"><Volume2 className="w-8 h-8 mx-auto mb-2" style={{ color: th.fg3 }} /><p className="text-sm" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p></div></GCard>
          )}
          {!!generations.length && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generations.map((gen) => (
                <TtsCard
                  key={gen.clientKey ?? gen.id}
                  gen={gen}
                  retryDisabled={generating}
                  onRetry={() => void retry(gen, () => requestTtsGeneration({
                    script: gen.scriptText, voice: gen.voice,
                    speed: gen.speed ?? undefined, pitch: gen.pitch ?? undefined, volume: gen.volume ?? undefined, emotion: gen.emotion ?? undefined,
                  }))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
