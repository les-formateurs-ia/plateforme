import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, Upload, Video as VideoIcon, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import {
  STUDIO_VIDEO_MODELS, getMyVideoGenerations, getStudioVideoSignedUrl,
  uploadStudioVideoSourceImage, requestVideoGeneration, pollVideoGenerationStatus,
  type StudioVideoGeneration,
} from "@/app/lib/studioVideos";

function VideoCard({ gen, onOpen }: { gen: StudioVideoGeneration; onOpen: () => void }) {
  const th = useTh();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (gen.status === "ready" && gen.videoPath) {
      getStudioVideoSignedUrl(gen.videoPath).then((u) => { if (!cancelled) setUrl(u); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [gen.status, gen.videoPath]);

  return (
    <GCard onClick={gen.status === "ready" ? onOpen : undefined} className="hover:scale-[1.02] transition-transform">
      <div className="aspect-video flex items-center justify-center relative" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : `${th.gradShadow(0.04)}` }}>
        {gen.status === "pending" && <Loader2 className="w-6 h-6 animate-spin" style={{ color: th.fg3 }} />}
        {gen.status === "failed" && <p className="text-xs text-center px-3" style={{ color: "#fbc2ad" }}>Échec</p>}
        {gen.status === "ready" && url && <video src={url} muted preload="metadata" className="w-full h-full object-cover" />}
      </div>
      <div className="p-2.5">
        <p className="text-xs truncate" style={{ color: th.fg2 }}>{gen.prompt}</p>
      </div>
    </GCard>
  );
}

export function StudioVideosPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modelId, setModelId] = useState(STUDIO_VIDEO_MODELS[0].id);
  const model = STUDIO_VIDEO_MODELS.find((m) => m.id === modelId)!;
  const [optionValues, setOptionValues] = useState<Record<string, string>>(
    Object.fromEntries(model.options.map((o) => [o.key, o.default])),
  );
  const [prompt, setPrompt] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<StudioVideoGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<StudioVideoGeneration | null>(null);
  const [detailUrl, setDetailUrl] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setGenerations(await getMyVideoGenerations(user.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user]);

  const changeModel = (id: string) => {
    setModelId(id);
    const next = STUDIO_VIDEO_MODELS.find((m) => m.id === id)!;
    setOptionValues(Object.fromEntries(next.options.map((o) => [o.key, o.default])));
    if (!next.supportsSourceImage) removeSourceImage();
  };

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
    if (!user || !prompt.trim() || generating) return;
    if (model.requiresSourceImage && !sourceFile) { toast.error("Ce modèle nécessite une image de référence."); return; }
    setGenerating(true);
    try {
      let sourceImagePath: string | undefined;
      if (sourceFile && model.supportsSourceImage) {
        sourceImagePath = await uploadStudioVideoSourceImage(user.id, sourceFile);
      }
      const id = await requestVideoGeneration({ model: modelId, prompt: prompt.trim(), sourceImagePath, options: optionValues });
      await load();
      const result = await pollVideoGenerationStatus(id);
      await load();
      if (result.status === "failed") toast.error(result.error || "La génération a échoué.");
      else if (result.status === "ready") toast.success("Vidéo générée.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de générer cette vidéo.");
    } finally {
      setGenerating(false);
    }
  };

  const openDetail = async (gen: StudioVideoGeneration) => {
    setDetail(gen);
    setDetailUrl(null);
    if (gen.videoPath) {
      try { setDetailUrl(await getStudioVideoSignedUrl(gen.videoPath)); } catch { /* ignore */ }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Le Studio
      </button>

      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}>Imaginez vos vidéos</h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Génère des vidéos avec de vrais modèles d'IA (Text-to-Video / Image-to-Video). Le rendu prend en général 1 à 5 minutes.</p>
      </div>

      <GCard>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Modèle d'IA</label>
              <VSelect value={modelId} onValueChange={changeModel} options={STUDIO_VIDEO_MODELS.map((m) => ({ value: m.id, label: m.label }))} disabled={generating} />
              <p className="text-[11px] mt-1.5" style={{ color: th.fg3 }}>{model.description}</p>
            </div>
            {model.options.map((opt) => (
              <div key={opt.key}>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>{opt.label}</label>
                <VSelect
                  value={optionValues[opt.key] ?? opt.default}
                  onValueChange={(v) => setOptionValues((prev) => ({ ...prev, [opt.key]: v }))}
                  options={opt.choices.map((c) => ({ value: c, label: opt.key === "duration" ? `${c}s` : c }))}
                  disabled={generating}
                />
              </div>
            ))}
          </div>

          {model.supportsSourceImage && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>
                Photo de référence {model.requiresSourceImage ? <span className="normal-case font-normal">(obligatoire)</span> : <span className="normal-case font-normal">(optionnel — Image-to-Video)</span>}
              </label>
              {sourcePreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                  <img src={sourcePreview} alt="Référence" className="w-full h-full object-cover" />
                  <button onClick={removeSourceImage} disabled={generating} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: th.inputBg, border: `1px dashed ${th.inputB}`, color: th.fg2 }}>
                  <Upload className="w-3.5 h-3.5" />Ajouter une image
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={generating}
              placeholder="Décris la scène et les mouvements que tu veux générer…"
              className="w-full rounded-xl px-4 py-3 text-sm g-input resize-none"
            />
          </div>

          <ShimBtn onClick={handleGenerate} disabled={!prompt.trim() || generating || (model.requiresSourceImage && !sourceFile)}>
            <span className="flex items-center justify-center gap-2">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Génération en cours… (peut prendre plusieurs minutes)</> : <><Sparkles className="w-4 h-4" />Générer</>}
            </span>
          </ShimBtn>
        </div>
      </GCard>

      <div>
        <h3 className="text-sm font-black mb-3" style={{ color: th.fg }}>Mes créations</h3>
        {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
        {!loading && !generations.length && (
          <GCard><div className="p-8 text-center"><VideoIcon className="w-8 h-8 mx-auto mb-2" style={{ color: th.fg3 }} /><p className="text-sm" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p></div></GCard>
        )}
        {!!generations.length && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {generations.map((gen) => <VideoCard key={gen.id} gen={gen} onOpen={() => void openDetail(gen)} />)}
          </div>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            {detailUrl && <video src={detailUrl} controls autoPlay className="w-full max-h-[60vh]" style={{ background: "#000" }} />}
            <div className="p-5 space-y-2">
              <p className="text-sm" style={{ color: th.fg }}>{detail.prompt}</p>
              <p className="text-xs" style={{ color: th.fg3 }}>
                {STUDIO_VIDEO_MODELS.find((m) => m.id === detail.model)?.label ?? detail.model} · {new Date(detail.createdAt).toLocaleString("fr-FR")}
              </p>
              <div className="pt-2"><VBtn sm onClick={() => setDetail(null)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
