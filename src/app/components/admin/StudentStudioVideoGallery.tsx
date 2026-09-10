// Galerie des créations "Le Studio > Imaginez vos vidéos" d'un élève, pour
// la fiche élève admin/formateur — même principe que StudentStudioGallery
// (images). Lecture seule ; RLS (studio_videos_select) restreint déjà
// l'accès du formateur à ses propres élèves.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Video as VideoIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import {
  STUDIO_VIDEO_MODELS, getVideoGenerationsForStudent, getStudioVideoSignedUrl,
  type StudioVideoGeneration,
} from "@/app/lib/studioVideos";

function Thumb({ gen, onOpen }: { gen: StudioVideoGeneration; onOpen: () => void }) {
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
      <div className="aspect-video flex items-center justify-center" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : `${th.gradShadow(0.04)}` }}>
        {gen.status === "pending" && <Loader2 className="w-5 h-5 animate-spin" style={{ color: th.fg3 }} />}
        {gen.status === "failed" && <p className="text-[10px] text-center px-2" style={{ color: "#fbc2ad" }}>Échec</p>}
        {gen.status === "ready" && url && <video src={url} muted preload="metadata" className="w-full h-full object-cover" />}
      </div>
    </GCard>
  );
}

export function StudentStudioVideoGallery({ studentId }: { studentId: string }) {
  const th = useTh();
  const [generations, setGenerations] = useState<StudioVideoGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<StudioVideoGeneration | null>(null);
  const [detailUrl, setDetailUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await getVideoGenerationsForStudent(studentId);
        if (!cancelled) setGenerations(rows);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Impossible de charger les vidéos Studio de cet élève.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const openDetail = async (gen: StudioVideoGeneration) => {
    setDetail(gen);
    setDetailUrl(null);
    setSourceUrl(null);
    if (gen.videoPath) {
      try { setDetailUrl(await getStudioVideoSignedUrl(gen.videoPath)); } catch { /* ignore */ }
    }
    if (gen.sourceImagePath) {
      try { setSourceUrl(await getStudioVideoSignedUrl(gen.sourceImagePath)); } catch { /* ignore */ }
    }
  };

  return (
    <GCard><div className="p-6">
      <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Créations Studio — Imaginez vos vidéos</h3>
      {loading && <p className="text-xs" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && !generations.length && (
        <div className="text-center py-6">
          <VideoIcon className="w-6 h-6 mx-auto mb-2" style={{ color: th.fg3 }} />
          <p className="text-xs" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p>
        </div>
      )}
      {!!generations.length && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {generations.map((gen) => <Thumb key={gen.id} gen={gen} onOpen={() => void openDetail(gen)} />)}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            {detailUrl && <video src={detailUrl} controls autoPlay className="w-full max-h-[55vh]" style={{ background: "#000" }} />}
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Prompt</label>
                <p className="text-sm" style={{ color: th.fg }}>{detail.prompt}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: th.fg3 }}>
                <span>Modèle : {STUDIO_VIDEO_MODELS.find((m) => m.id === detail.model)?.label ?? detail.model}</span>
                {Object.entries(detail.options || {}).map(([k, v]) => <span key={k}>{k} : {String(v)}</span>)}
                <span>{new Date(detail.createdAt).toLocaleString("fr-FR")}</span>
              </div>
              {sourceUrl && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Image de référence</label>
                  <img src={sourceUrl} alt="Image de référence" className="w-20 h-20 object-cover rounded-lg" />
                </div>
              )}
              <VBtn sm onClick={() => setDetail(null)}>Fermer</VBtn>
            </div>
          </div>
        </div>
      )}
    </div></GCard>
  );
}
