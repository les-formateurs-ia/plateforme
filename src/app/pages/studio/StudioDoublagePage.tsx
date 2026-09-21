// Module "Parlez n'importe quelle langue" (Le Studio) — traduction &
// doublage vidéo via l'API Runware pour la génération (voix + lip-sync),
// Gemini pour transcrire/traduire ce qui est dit dans la vidéo uploadée
// (Runware n'a aucune capacité de transcription audio, cf.
// supabase/functions/_shared/gemini-video.ts). L'élève choisit juste la
// vidéo, la langue d'origine et la langue cible — aucune saisie de texte.
// Même charpente que StudioTalkingHeadPage.tsx (barre flottante en bas,
// galerie en colonnes au-dessus).
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Eye, Languages, Loader2, Play, Upload, X } from "lucide-react";
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
  STUDIO_DOUBLAGE_MODELS, DOUBLAGE_LANGUAGES, DEFAULT_SOURCE_LANGUAGE, DEFAULT_TARGET_LANGUAGE,
  getMyDoublageGenerations, getStudioDoublageSignedUrl, uploadStudioDoublageSourceVideo,
  requestDoublageGeneration, pollDoublageGenerationStatus, type StudioDoublageGeneration,
} from "@/app/lib/studioDoublage";

// Vidéo plus courte que le lip-sync avatar : le pipeline ajoute une étape
// de transcription/traduction Gemini avant même d'arriver au rendu vidéo,
// on garde donc une marge de temps confortable.
const MAX_VIDEO_DURATION_S = 60;
const MAX_VIDEO_SIZE_BYTES = 40 * 1024 * 1024;

function languageLabel(code: string | null): string {
  return DOUBLAGE_LANGUAGES.find((l) => l.code === code)?.label ?? code ?? "—";
}

function DoublageCard({ gen, onOpen, onRetry, retryDisabled }: { gen: MediaGeneration<StudioDoublageGeneration>; onOpen: () => void; onRetry: () => void; retryDisabled: boolean }) {
  const th = useTh();
  const media = useGeneratedMedia(gen.status === "ready" ? gen.videoPath : null, getStudioDoublageSignedUrl);
  const error = gen.trackingError || (gen.status === "failed" ? gen.errorMessage || "La génération a échoué." : null) || media.error || (gen.status === "ready" && !gen.videoPath ? "Le média généré est indisponible." : null);

  return (
    <div onClick={gen.status === "ready" ? onOpen : undefined}
      className={cx("group relative rounded-3xl overflow-hidden transition-transform mb-4 break-inside-avoid", gen.status === "ready" && "cursor-pointer hover:scale-[1.01]")}
      style={{ aspectRatio: "16 / 9", background: th.isDark ? "rgba(255,255,255,0.03)" : th.gradShadow(0.04), border: `1px solid ${th.sep}` }}>
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
          <p className="text-xs text-white truncate">{gen.translatedText || `${languageLabel(gen.sourceLanguage)} → ${languageLabel(gen.targetLanguage)}`}</p>
        </div>
      )}
    </div>
  );
}

export function StudioDoublagePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modelId, setModelId] = useState(STUDIO_DOUBLAGE_MODELS[0].id);
  const [sourceLanguage, setSourceLanguage] = useState(DEFAULT_SOURCE_LANGUAGE);
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_TARGET_LANGUAGE);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generations, generating, loading, historyError, start, retry } = useMediaGenerations(user?.id, getMyDoublageGenerations, pollDoublageGenerationStatus, (result) => ({ videoPath: result.videoPath }));
  const [detail, setDetail] = useState<StudioDoublageGeneration | null>(null);
  const [detailUrl, setDetailUrl] = useState<string | null>(null);
  const [sourcePreviewOpen, setSourcePreviewOpen] = useState(false);

  const removeSourceVideo = () => {
    setSourceFile(null);
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSourcePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) { toast.error("Le fichier doit être une vidéo."); return; }
    if (file.size > MAX_VIDEO_SIZE_BYTES) { toast.error("La vidéo ne doit pas dépasser 40 Mo."); return; }
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      if (probe.duration > MAX_VIDEO_DURATION_S) {
        toast.error(`La vidéo ne doit pas dépasser ${MAX_VIDEO_DURATION_S} secondes.`);
        URL.revokeObjectURL(url);
        return;
      }
      setSourceFile(file);
      setSourcePreview(url);
    };
    probe.onerror = () => { toast.error("Impossible de lire cette vidéo."); URL.revokeObjectURL(url); };
    probe.src = url;
  };

  const handleGenerate = async () => {
    if (!user || !sourceFile || generating) return;
    const draft: StudioDoublageGeneration = {
      id: crypto.randomUUID(), status: "pending", model: modelId, scriptText: null, translatedText: null,
      sourceLanguage, targetLanguage, sourceVideoPath: "", videoPath: null, errorMessage: null, createdAt: new Date().toISOString(),
    };
    await start(draft, async () => {
      const sourceVideoPath = await uploadStudioDoublageSourceVideo(user.id, sourceFile);
      const result = await requestDoublageGeneration({ model: modelId, sourceVideoPath, sourceLanguage, targetLanguage });
      return result.id;
    });
    removeSourceVideo();
  };

  const openDetail = async (gen: StudioDoublageGeneration) => {
    setDetail(gen);
    setDetailUrl(null);
    if (gen.videoPath) {
      try { setDetailUrl(await getStudioDoublageSignedUrl(gen.videoPath)); } catch { /* ignore */ }
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
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>Parlez n'importe quelle langue</h2>
            <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Upload une vidéo, choisis sa langue d'origine et la langue cible : l'IA transcrit, traduit et double automatiquement en resynchronisant les lèvres. Le rendu prend en général 1 à 5 minutes.</p>
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
            <GCard><div className="p-8 text-center"><Languages className="w-8 h-8 mx-auto mb-2" style={{ color: th.fg3 }} /><p className="text-sm" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p></div></GCard>
          )}
          {!!generations.length && (
            <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
              {generations.map((gen) => <DoublageCard key={gen.clientKey ?? gen.id} gen={gen} onOpen={() => void openDetail(gen)} retryDisabled={generating}
                onRetry={() => void retry(gen, () => requestDoublageGeneration({ model: gen.model, sourceVideoPath: gen.sourceVideoPath, sourceLanguage: gen.sourceLanguage ?? DEFAULT_SOURCE_LANGUAGE, targetLanguage: gen.targetLanguage }).then((r) => r.id))} />)}
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 sm:px-6 lg:px-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2">
        <div className="pointer-events-auto rounded-3xl overflow-hidden max-w-[96%] mx-auto" style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
          <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold shrink-0" style={{ color: th.fg3 }}>Modèle</span>
              <div className="w-[176px]"><VSelect sm value={modelId} onValueChange={setModelId} options={STUDIO_DOUBLAGE_MODELS.map((m) => ({ value: m.id, label: m.label }))} disabled={generating} /></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold shrink-0" style={{ color: th.fg3 }}>Langue d'origine</span>
              <div className="w-[150px]"><VSelect sm value={sourceLanguage} onValueChange={setSourceLanguage} options={DOUBLAGE_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} disabled={generating} /></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold shrink-0" style={{ color: th.fg3 }}>Langue cible</span>
              <div className="w-[150px]"><VSelect sm value={targetLanguage} onValueChange={setTargetLanguage} options={DOUBLAGE_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} disabled={generating} /></div>
            </div>
            <div className="flex-1 min-w-0" />
            {sourcePreview ? (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 group cursor-pointer" title="Voir la vidéo" onClick={() => setSourcePreviewOpen(true)}>
                <video src={sourcePreview} muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.35)" }}>
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeSourceVideo(); }} disabled={generating} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} disabled={generating} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 shrink-0"
                style={{ background: th.inputBg, border: `1px dashed ${th.inputB}`, color: th.fg2 }}>
                <Upload className="w-3.5 h-3.5" />Ajouter une vidéo<span className="opacity-70">(requis, {MAX_VIDEO_DURATION_S}s max)</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
          </div>

          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
            <p className="text-xs" style={{ color: th.fg3 }}>L'IA écoute la vidéo, traduit et double automatiquement — rien d'autre à saisir.</p>
            <ShimBtn sm onClick={handleGenerate} disabled={!sourceFile || generating}>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {generating ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> : <Languages className="w-4 h-4" />}
                {generating ? "Génération…" : "Générer"}
              </span>
            </ShimBtn>
          </div>
        </div>
      </div>

      {sourcePreviewOpen && sourcePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setSourcePreviewOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            <video src={sourcePreview} controls autoPlay className="w-full max-h-[70vh]" style={{ background: "#000" }} />
            <div className="p-5 space-y-2">
              <p className="text-sm" style={{ color: th.fg }}>Vidéo source utilisée pour le doublage.</p>
              <div className="pt-2"><VBtn sm onClick={() => setSourcePreviewOpen(false)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            {detailUrl && <video src={detailUrl} controls autoPlay className="w-full max-h-[60vh]" style={{ background: "#000" }} />}
            <div className="p-5 space-y-2">
              {detail.translatedText && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Texte doublé ({languageLabel(detail.targetLanguage)})</label>
                  <p className="text-sm" style={{ color: th.fg }}>{detail.translatedText}</p>
                </div>
              )}
              {detail.scriptText && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Texte original (saisi manuellement)</label>
                  <p className="text-sm" style={{ color: th.fg2 }}>{detail.scriptText}</p>
                </div>
              )}
              <p className="text-xs" style={{ color: th.fg3 }}>
                {STUDIO_DOUBLAGE_MODELS.find((m) => m.id === detail.model)?.label ?? detail.model} · {languageLabel(detail.sourceLanguage)} → {languageLabel(detail.targetLanguage)} · {new Date(detail.createdAt).toLocaleString("fr-FR")}
              </p>
              <div className="pt-2"><VBtn sm onClick={() => setDetail(null)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
