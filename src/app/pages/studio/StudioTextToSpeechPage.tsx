// Module "Du texte à l'audio" (Le Studio) — synthèse vocale (Text-to-Speech)
// via l'API Runware (MiniMax Speech 2.8, cf. src/app/lib/studioTextToSpeech.ts).
// Layout à deux volets (formulaire + galerie), même parti pris que
// StudioMusicPage.tsx : pas de format/image à gérer, un panneau latéral
// compact colle mieux qu'une barre flottante.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, Loader2, Volume2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { MediaGenerationPlaceholder } from "@/app/components/common/MediaGenerationPlaceholder";
import { useMediaGenerations, type MediaGeneration } from "@/app/lib/useMediaGenerations";
import { useGeneratedMedia } from "@/app/lib/useGeneratedMedia";
import {
  TTS_VOICES, SCRIPT_MAX_LENGTH, getMyTtsGenerations, getStudioTtsSignedUrl,
  requestTtsGeneration, pollTtsGenerationStatus, type StudioTtsGeneration,
} from "@/app/lib/studioTextToSpeech";

const PROMPT_MAX_HEIGHT = 160;

function TtsCard({ gen, onRetry, retryDisabled }: { gen: MediaGeneration<StudioTtsGeneration>; onRetry: () => void; retryDisabled: boolean }) {
  const th = useTh();
  const audio = useGeneratedMedia(gen.status === "ready" ? gen.audioPath : null, getStudioTtsSignedUrl);
  const error = gen.trackingError || (gen.status === "failed" ? gen.errorMessage || "La génération a échoué." : null) || audio.error || (gen.status === "ready" && !gen.audioPath ? "Le média généré est indisponible." : null);
  const ready = gen.status === "ready" && audio.loaded && !error;
  const voiceLabel = TTS_VOICES.find((v) => v.id === gen.voice)?.label ?? gen.voice;

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
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg3 }}>{voiceLabel}</span>
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
  const [voiceId, setVoiceId] = useState(TTS_VOICES[0].id);
  const scriptRef = useRef<HTMLTextAreaElement>(null);
  const { generations, generating, loading, historyError, start, retry } = useMediaGenerations(user?.id, getMyTtsGenerations, pollTtsGenerationStatus, (result) => ({ audioPath: result.audioPath }));

  useEffect(() => {
    const el = scriptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, PROMPT_MAX_HEIGHT)}px`;
  }, [script]);

  const pendingCount = generations.filter((g) => g.status === "pending").length;

  const handleGenerate = async () => {
    if (!user || !script.trim() || generating) return;
    const voice = TTS_VOICES.find((v) => v.id === voiceId) ?? TTS_VOICES[0];
    const draft: StudioTtsGeneration = { id: crypto.randomUUID(), status: "pending", scriptText: script.trim(), voice: voice.id, language: voice.language, audioPath: null, errorMessage: null, createdAt: new Date().toISOString() };
    await start(draft, () => requestTtsGeneration({ script: draft.scriptText, voice: draft.voice }));
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

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Voix</label>
              <VSelect value={voiceId} onValueChange={setVoiceId} options={TTS_VOICES.map((v) => ({ value: v.id, label: v.label }))} disabled={generating} />
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
              {generations.map((gen) => <TtsCard key={gen.clientKey ?? gen.id} gen={gen} retryDisabled={generating}
                onRetry={() => void retry(gen, () => requestTtsGeneration({ script: gen.scriptText, voice: gen.voice }))} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
