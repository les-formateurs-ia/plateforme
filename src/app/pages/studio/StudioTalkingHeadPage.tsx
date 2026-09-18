import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Eye, Loader2, Play, Speech, Upload, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { cx } from "@/app/lib/cx";
import { MediaGenerationPlaceholder } from "@/app/components/common/MediaGenerationPlaceholder";
import { useMediaGenerations, type MediaGeneration } from "@/app/lib/useMediaGenerations";
import { useGeneratedMedia } from "@/app/lib/useGeneratedMedia";
import {
  STUDIO_TALKINGHEAD_MODELS, TTS_VOICES, SCRIPT_MAX_LENGTH, getMyTalkingHeadGenerations, getStudioTalkingHeadSignedUrl,
  uploadStudioTalkingHeadSourceImage, requestTalkingHeadGeneration, pollTalkingHeadGenerationStatus,
  type StudioTalkingHeadGeneration,
} from "@/app/lib/studioTalkingHead";

function TalkingHeadCard({ gen, onOpen, onRetry, retryDisabled }: { gen: MediaGeneration<StudioTalkingHeadGeneration>; onOpen: () => void; onRetry: () => void; retryDisabled: boolean }) {
  const th = useTh();
  const media = useGeneratedMedia(gen.status === "ready" ? gen.videoPath : null, getStudioTalkingHeadSignedUrl);
  const error = gen.trackingError || (gen.status === "failed" ? gen.errorMessage || "La génération a échoué." : null) || media.error || (gen.status === "ready" && !gen.videoPath ? "Le média généré est indisponible." : null);

  return (
    <div onClick={gen.status === "ready" ? onOpen : undefined}
      className={cx("group relative rounded-3xl overflow-hidden transition-transform mb-4 break-inside-avoid", gen.status === "ready" && "cursor-pointer hover:scale-[1.01]")}
      style={{ aspectRatio: "3 / 4", background: th.isDark ? "rgba(255,255,255,0.03)" : th.gradShadow(0.04), border: `1px solid ${th.sep}` }}>
      <MediaGenerationPlaceholder kind="video" ready={gen.status === "ready" && media.loaded && !error} error={error} onRetry={media.error ? media.retry : onRetry} retryDisabled={retryDisabled && !media.error} />
      {gen.status === "ready" && media.url && (
        <video key={media.url} src={media.url} onLoadedData={media.onLoad} onError={media.onError} muted playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-105" />
      )}
      {gen.status === "ready" && (
        <span className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(10,10,16,0.55)", backdropFilter: "blur(4px)" }}>
          <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
        </span>
      )}
      {gen.status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(180deg,rgba(10,10,16,0) 0%,rgba(10,10,16,0.8) 100%)" }}>
          <p className="text-xs text-white truncate">{gen.scriptText}</p>
        </div>
      )}
    </div>
  );
}

export function StudioTalkingHeadPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modelId, setModelId] = useState(STUDIO_TALKINGHEAD_MODELS[0].id);
  const [voiceId, setVoiceId] = useState(TTS_VOICES[0].id);
  const [script, setScript] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scriptRef = useRef<HTMLTextAreaElement>(null);
  const { generations, generating, loading, historyError, start, retry } = useMediaGenerations(user?.id, getMyTalkingHeadGenerations, pollTalkingHeadGenerationStatus, (result) => ({ videoPath: result.videoPath }));
  const [detail, setDetail] = useState<StudioTalkingHeadGeneration | null>(null);
  const [detailUrl, setDetailUrl] = useState<string | null>(null);
  const [sourcePreviewOpen, setSourcePreviewOpen] = useState(false);

  useEffect(() => {
    const el = scriptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [script]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Le fichier doit être une image."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 8 Mo."); return; }
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
  };

  const removeSourceImage = () => {
    setSourceFile(null);
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSourcePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!user || !script.trim() || !sourceFile || generating) return;
    const voice = TTS_VOICES.find((v) => v.id === voiceId) ?? TTS_VOICES[0];
    const draft: StudioTalkingHeadGeneration = {
      id: crypto.randomUUID(), status: "pending", model: modelId, scriptText: script.trim(), voice: voice.id, language: voice.language,
      sourceImagePath: "", videoPath: null, errorMessage: null, createdAt: new Date().toISOString(),
    };
    await start(draft, async () => {
      const sourceImagePath = await uploadStudioTalkingHeadSourceImage(user.id, sourceFile);
      return requestTalkingHeadGeneration({ model: modelId, script: draft.scriptText, sourceImagePath, voice: voice.id, language: voice.language });
    });
    removeSourceImage();
    setScript("");
  };

  const openDetail = async (gen: StudioTalkingHeadGeneration) => {
    setDetail(gen);
    setDetailUrl(null);
    if (gen.videoPath) {
      try { setDetailUrl(await getStudioTalkingHeadSignedUrl(gen.videoPath)); } catch { /* ignore */ }
    }
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-64 sm:pb-56 space-y-6">
        <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Le Studio
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>Faites parler vos images</h2>
            <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Anime une photo et synchronise les lèvres sur un texte que tu écris. Le rendu prend en général 1 à 5 minutes.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: generating ? th.fg3 : "#22c55e" }} />
            {generating ? "Génération en cours…" : "Génération disponible"}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-black mb-3" style={{ color: th.fg }}>Mes créations</h3>
          {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
          {historyError && <p role="alert" className="text-sm" style={{ color: th.fg2 }}>{historyError}</p>}
          {!loading && !generations.length && (
            <GCard><div className="p-8 text-center"><Speech className="w-8 h-8 mx-auto mb-2" style={{ color: th.fg3 }} /><p className="text-sm" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p></div></GCard>
          )}
          {!!generations.length && (
            <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
              {generations.map((gen) => <TalkingHeadCard key={gen.clientKey ?? gen.id} gen={gen} onOpen={() => void openDetail(gen)} retryDisabled={generating}
                onRetry={() => void retry(gen, () => requestTalkingHeadGeneration({ model: gen.model, script: gen.scriptText, sourceImagePath: gen.sourceImagePath, voice: gen.voice, language: gen.language }))} />)}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6 pt-2">
        <div className="pointer-events-auto rounded-3xl overflow-hidden max-w-[96%] mx-auto" style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
          <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold shrink-0" style={{ color: th.fg3 }}>Modèle</span>
              <div className="w-[176px]"><VSelect sm value={modelId} onValueChange={setModelId} options={STUDIO_TALKINGHEAD_MODELS.map((m) => ({ value: m.id, label: m.label }))} disabled={generating} /></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold shrink-0" style={{ color: th.fg3 }}>Voix</span>
              <div className="w-[192px]"><VSelect sm value={voiceId} onValueChange={setVoiceId} options={TTS_VOICES.map((v) => ({ value: v.id, label: v.label }))} disabled={generating} /></div>
            </div>
            <div className="flex-1 min-w-0" />
            {sourcePreview ? (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 group cursor-pointer" title="Voir la photo" onClick={() => setSourcePreviewOpen(true)}>
                <img src={sourcePreview} alt="Photo source" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.35)" }}>
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeSourceImage(); }} disabled={generating} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} disabled={generating} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 shrink-0"
                style={{ background: th.inputBg, border: `1px dashed ${th.inputB}`, color: th.fg2 }}>
                <Upload className="w-3.5 h-3.5" />Ajouter une photo<span className="opacity-70">(requis)</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
          </div>

          <div className="flex items-end gap-3 px-4 sm:px-5 py-3">
            <Speech className="w-4 h-4 shrink-0 mb-1.5" style={{ color: th.fg3 }} />
            <div className="flex-1 min-w-0">
              <textarea
                ref={scriptRef}
                value={script}
                onChange={(e) => setScript(e.target.value.slice(0, SCRIPT_MAX_LENGTH))}
                rows={1}
                disabled={generating}
                placeholder="Écris le texte que la personne doit prononcer…"
                className="w-full bg-transparent outline-none text-sm resize-none py-1.5"
                style={{ color: th.fg, maxHeight: 160, overflowY: "auto" }}
              />
              <p className="text-[11px] text-right" style={{ color: th.fg3 }}>{script.length}/{SCRIPT_MAX_LENGTH}</p>
            </div>
            <ShimBtn sm onClick={handleGenerate} disabled={!script.trim() || !sourceFile || generating}>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {generating ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> : <Speech className="w-4 h-4" />}
                {generating ? "Génération…" : "Générer"}
              </span>
            </ShimBtn>
          </div>
        </div>
      </div>

      {sourcePreviewOpen && sourcePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setSourcePreviewOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            <img src={sourcePreview} alt="Photo source" className="w-full max-h-[70vh] object-contain" style={{ background: "#000" }} />
            <div className="p-5 space-y-2">
              <p className="text-sm" style={{ color: th.fg }}>Photo utilisée pour animer l'avatar.</p>
              <div className="pt-2"><VBtn sm onClick={() => setSourcePreviewOpen(false)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            {detailUrl && <video src={detailUrl} controls autoPlay className="w-full max-h-[60vh]" style={{ background: "#000" }} />}
            <div className="p-5 space-y-2">
              <p className="text-sm" style={{ color: th.fg }}>{detail.scriptText}</p>
              <p className="text-xs" style={{ color: th.fg3 }}>
                {STUDIO_TALKINGHEAD_MODELS.find((m) => m.id === detail.model)?.label ?? detail.model} · {new Date(detail.createdAt).toLocaleString("fr-FR")}
              </p>
              <div className="pt-2"><VBtn sm onClick={() => setDetail(null)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
