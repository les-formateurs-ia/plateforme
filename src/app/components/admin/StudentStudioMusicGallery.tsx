// Galerie des créations "Le Studio > Concevez vos propres musiques" d'un
// élève, pour la fiche élève admin/formateur — même principe que
// StudentStudioGallery/StudentStudioVideoGallery. Lecture seule ; RLS
// (studio_music_select) restreint déjà l'accès du formateur à ses propres élèves.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Music2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import {
  getMusicGenerationsForStudent, getStudioMusicSignedUrl,
  type StudioMusicGeneration,
} from "@/app/lib/studioMusic";

function Thumb({ gen, onOpen }: { gen: StudioMusicGeneration; onOpen: () => void }) {
  const th = useTh();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (gen.coverImagePath) {
      getStudioMusicSignedUrl(gen.coverImagePath).then((u) => { if (!cancelled) setCoverUrl(u); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [gen.coverImagePath]);

  return (
    <GCard onClick={gen.status === "ready" ? onOpen : undefined} className="hover:scale-[1.02] transition-transform mb-3 break-inside-avoid">
      <div className="flex items-center justify-center" style={{ aspectRatio: "1 / 1", background: th.isDark ? "rgba(255,255,255,0.03)" : `${th.gradShadow(0.04)}` }}>
        {gen.status === "pending" && <Loader2 className="w-5 h-5 animate-spin" style={{ color: th.fg3 }} />}
        {gen.status === "failed" && <p className="text-[10px] text-center px-2" style={{ color: "#fbc2ad" }}>Échec</p>}
        {gen.status === "ready" && coverUrl && <img src={coverUrl} alt={gen.title ?? gen.prompt} className="w-full h-full object-cover" />}
        {gen.status === "ready" && !coverUrl && <Music2 className="w-5 h-5" style={{ color: th.fg3 }} />}
      </div>
    </GCard>
  );
}

export function StudentStudioMusicGallery({ studentId }: { studentId: string }) {
  const th = useTh();
  const [generations, setGenerations] = useState<StudioMusicGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<StudioMusicGeneration | null>(null);
  const [detailCoverUrl, setDetailCoverUrl] = useState<string | null>(null);
  const [detailAudioUrl, setDetailAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await getMusicGenerationsForStudent(studentId);
        if (!cancelled) setGenerations(rows);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Impossible de charger les créations musicales de cet élève.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const openDetail = async (gen: StudioMusicGeneration) => {
    setDetail(gen);
    setDetailCoverUrl(null);
    setDetailAudioUrl(null);
    if (gen.coverImagePath) {
      try { setDetailCoverUrl(await getStudioMusicSignedUrl(gen.coverImagePath)); } catch { /* ignore */ }
    }
    if (gen.audioPath) {
      try { setDetailAudioUrl(await getStudioMusicSignedUrl(gen.audioPath)); } catch { /* ignore */ }
    }
  };

  return (
    <GCard><div className="p-6">
      <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Créations Studio — Concevez vos propres musiques</h3>
      {loading && <p className="text-xs" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && !generations.length && (
        <div className="text-center py-6">
          <Music2 className="w-6 h-6 mx-auto mb-2" style={{ color: th.fg3 }} />
          <p className="text-xs" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p>
        </div>
      )}
      {!!generations.length && (
        <div className="columns-3 sm:columns-4 lg:columns-6 gap-3">
          {generations.map((gen) => <Thumb key={gen.id} gen={gen} onOpen={() => void openDetail(gen)} />)}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
            {detailCoverUrl && <img src={detailCoverUrl} alt={detail.title ?? detail.prompt} className="w-full max-h-[40vh] object-cover" style={{ background: "#000" }} />}
            <div className="p-5 space-y-3">
              <div>
                <h4 className="text-base font-black" style={{ color: th.fg }}>{detail.title || "Sans titre"}</h4>
                <p className="text-xs mt-0.5" style={{ color: th.fg3 }}>
                  {detail.instrumental ? "Instrumental" : "Chanson"} · {new Date(detail.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              {detailAudioUrl && <audio controls src={detailAudioUrl} className="w-full" />}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Description / style</label>
                <p className="text-sm" style={{ color: th.fg }}>{detail.prompt}</p>
              </div>
              {detail.lyricsStructured && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: th.fg3 }}>Paroles structurées</label>
                  <pre className="text-sm whitespace-pre-wrap font-sans" style={{ color: th.fg }}>{detail.lyricsStructured}</pre>
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
