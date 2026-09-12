import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Eye, Image as ImageIcon, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { cx } from "@/app/lib/cx";
import {
  STUDIO_MODELS, aspectRatioLabel, getMyGenerations, getStudioImageSignedUrl,
  uploadStudioSourceImage, requestImageGeneration, pollGenerationStatus,
  type StudioImageGeneration,
} from "@/app/lib/studioImages";

const PROMPT_MAX_HEIGHT = 160;

function GenerationCard({ gen, onOpen }: { gen: StudioImageGeneration; onOpen: () => void }) {
  const th = useTh();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (gen.status === "ready" && gen.imagePath) {
      getStudioImageSignedUrl(gen.imagePath).then((u) => { if (!cancelled) setUrl(u); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [gen.status, gen.imagePath]);

  return (
    <div onClick={gen.status === "ready" ? onOpen : undefined}
      className={cx("group relative rounded-3xl overflow-hidden transition-transform", gen.status === "ready" && "cursor-pointer hover:scale-[1.01]")}
      style={{ aspectRatio: "1 / 1", background: th.isDark ? "rgba(255,255,255,0.03)" : th.gradShadow(0.04), border: `1px solid ${th.sep}` }}>
      {gen.status === "pending" && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: th.fg3 }} /></div>}
      {gen.status === "failed" && <div className="absolute inset-0 flex items-center justify-center px-4"><p className="text-xs text-center" style={{ color: "#fbc2ad" }}>Échec</p></div>}
      {gen.status === "ready" && url && (
        <img src={url} alt={gen.prompt} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      )}
      {gen.status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(180deg,rgba(10,10,16,0) 0%,rgba(10,10,16,0.8) 100%)" }}>
          <p className="text-xs text-white truncate">{gen.prompt}</p>
        </div>
      )}
    </div>
  );
}

export function StudioImagesPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modelId, setModelId] = useState(STUDIO_MODELS[0].id);
  const model = STUDIO_MODELS.find((m) => m.id === modelId)!;
  const [aspectRatio, setAspectRatio] = useState(model.defaultAspectRatio);
  const [prompt, setPrompt] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<StudioImageGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<StudioImageGeneration | null>(null);
  const [detailUrl, setDetailUrl] = useState<string | null>(null);
  const [sourcePreviewOpen, setSourcePreviewOpen] = useState(false);
  const [detailSourceUrl, setDetailSourceUrl] = useState<string | null>(null);
  const [detailSourceZoom, setDetailSourceZoom] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setGenerations(await getMyGenerations(user.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user]);

  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, PROMPT_MAX_HEIGHT)}px`;
  }, [prompt]);

  const changeModel = (id: string) => {
    setModelId(id);
    const next = STUDIO_MODELS.find((m) => m.id === id)!;
    setAspectRatio(next.defaultAspectRatio);
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
    setGenerating(true);
    try {
      let sourceImagePath: string | undefined;
      if (sourceFile && model.supportsSourceImage) {
        sourceImagePath = await uploadStudioSourceImage(user.id, sourceFile);
      }
      const id = await requestImageGeneration({ model: modelId, aspectRatio, prompt: prompt.trim(), sourceImagePath });
      await load();
      const result = await pollGenerationStatus(id);
      await load();
      if (result.status === "failed") toast.error(result.error || "La génération a échoué.");
      else if (result.status === "ready") toast.success("Image générée.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Impossible de générer cette image.");
    } finally {
      setGenerating(false);
    }
  };

  const openDetail = async (gen: StudioImageGeneration) => {
    setDetail(gen);
    setDetailUrl(null);
    setDetailSourceUrl(null);
    if (gen.imagePath) {
      try { setDetailUrl(await getStudioImageSignedUrl(gen.imagePath)); } catch { /* ignore */ }
    }
    if (gen.sourceImagePath) {
      try { setDetailSourceUrl(await getStudioImageSignedUrl(gen.sourceImagePath)); } catch { /* ignore */ }
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Le Studio
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>Créer vos images</h2>
            <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Génère des visuels avec de vrais modèles d'IA (Text-to-Image / Image-to-Image).</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full shrink-0" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg2 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: generating ? th.fg3 : "#22c55e" }} />
            {generating ? "Génération en cours…" : "Génération disponible"}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-black mb-3" style={{ color: th.fg }}>Mes créations</h3>
          {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
          {!loading && !generations.length && (
            <GCard><div className="p-8 text-center"><ImageIcon className="w-8 h-8 mx-auto mb-2" style={{ color: th.fg3 }} /><p className="text-sm" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p></div></GCard>
          )}
          {!!generations.length && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {generations.map((gen) => <GenerationCard key={gen.id} gen={gen} onOpen={() => void openDetail(gen)} />)}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6 pt-2">
        <div className="rounded-3xl overflow-hidden max-w-[46%] mx-auto" style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 2px 10px rgba(0,0,0,0.18)", opacity: 0.8 }}>
          <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3" style={{ borderBottom: `1px solid ${th.sep}` }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold shrink-0" style={{ color: th.fg3 }}>Modèle</span>
              <div className="w-[168px]"><VSelect sm value={modelId} onValueChange={changeModel} options={STUDIO_MODELS.map((m) => ({ value: m.id, label: m.label }))} disabled={generating} /></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold shrink-0" style={{ color: th.fg3 }}>Format</span>
              <div className="w-[104px]"><VSelect sm value={aspectRatio} onValueChange={setAspectRatio} options={model.aspectRatios.map((r) => ({ value: r, label: aspectRatioLabel(r) }))} disabled={generating} /></div>
            </div>
            <div className="flex-1 min-w-0" />
            {model.supportsSourceImage && (
              sourcePreview ? (
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 group cursor-pointer" title="Voir l'image source" onClick={() => setSourcePreviewOpen(true)}>
                  <img src={sourcePreview} alt="Source" className="w-full h-full object-cover" />
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
                  <Upload className="w-3.5 h-3.5" />Ajouter une image
                </button>
              )
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
          </div>

          <div className="flex items-end gap-3 px-4 sm:px-5 py-3">
            <Sparkles className="w-4 h-4 shrink-0 mb-1.5" style={{ color: th.fg3 }} />
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={1}
              disabled={generating}
              placeholder="Décris l'image que tu veux générer…"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm resize-none py-1.5"
              style={{ color: th.fg, maxHeight: PROMPT_MAX_HEIGHT, overflowY: "auto" }}
            />
            <ShimBtn sm onClick={handleGenerate} disabled={!prompt.trim() || generating}>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Génération…" : "Générer"}
              </span>
            </ShimBtn>
          </div>
        </div>
      </div>

      {sourcePreviewOpen && sourcePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setSourcePreviewOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            <img src={sourcePreview} alt="Image source" className="w-full max-h-[70vh] object-contain" style={{ background: "#000" }} />
            <div className="p-5 space-y-2">
              <p className="text-sm" style={{ color: th.fg }}>Image source ajoutée comme référence (Image-to-Image).</p>
              <div className="pt-2"><VBtn sm onClick={() => setSourcePreviewOpen(false)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            {detailUrl && <img src={detailUrl} alt={detail.prompt} className="w-full max-h-[60vh] object-contain" style={{ background: "#000" }} />}
            <div className="p-5 space-y-2">
              <div className="flex items-start gap-3">
                {detailSourceUrl && (
                  <button onClick={() => setDetailSourceZoom(true)} title="Voir l'image source utilisée" className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 group">
                    <img src={detailSourceUrl} alt="Image source" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.35)" }}>
                      <Eye className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                )}
                <p className="text-sm flex-1 min-w-0" style={{ color: th.fg }}>{detail.prompt}</p>
              </div>
              <p className="text-xs" style={{ color: th.fg3 }}>
                {STUDIO_MODELS.find((m) => m.id === detail.model)?.label ?? detail.model} · {aspectRatioLabel(detail.aspectRatio)} · {new Date(detail.createdAt).toLocaleString("fr-FR")}
              </p>
              <div className="pt-2"><VBtn sm onClick={() => setDetail(null)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}

      {detailSourceZoom && detailSourceUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setDetailSourceZoom(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            <img src={detailSourceUrl} alt="Image source" className="w-full max-h-[70vh] object-contain" style={{ background: "#000" }} />
            <div className="p-5 space-y-2">
              <p className="text-sm" style={{ color: th.fg }}>Image source utilisée pour cette génération.</p>
              <div className="pt-2"><VBtn sm onClick={() => setDetailSourceZoom(false)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
