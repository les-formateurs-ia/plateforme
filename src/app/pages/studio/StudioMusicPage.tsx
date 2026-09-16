// Module "Concevez vos propres musiques" (Le Studio) — génération Text-to-Music
// via l'API Runware (MiniMax Music 2.6), avec restructuration des paroles,
// titre et pochette générés par un LLM (cf. src/app/lib/studioMusic.ts).
// Layout à deux volets fixe (formulaire à gauche, galerie/lecteur à droite) —
// contrairement aux pages image/vidéo (colonne unique + barre flottante), ce
// module n'a pas de format/modèle à choisir, un formulaire compact en volet
// latéral colle mieux à la maquette produit (ticket "Concevez vos propres
// musiques").
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Download, Loader2, Music2, Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn, Segmented } from "@/app/components/common/Buttons";
import { MediaGenerationPlaceholder } from "@/app/components/common/MediaGenerationPlaceholder";
import { useMediaGenerations, type MediaGeneration } from "@/app/lib/useMediaGenerations";
import { useGeneratedMedia } from "@/app/lib/useGeneratedMedia";
import {
  getMyMusicGenerations, getStudioMusicSignedUrl, requestMusicGeneration, pollMusicGenerationStatus,
  type StudioMusicGeneration,
} from "@/app/lib/studioMusic";

const PROMPT_MAX_HEIGHT = 140;
const MODE_OPTIONS = [{ value: "song", label: "Chansons" }, { value: "instrumental", label: "Instrumental" }];

function MusicCard({ gen, onOpen, onRetry, retryDisabled }: { gen: MediaGeneration<StudioMusicGeneration>; onOpen: () => void; onRetry: () => void; retryDisabled: boolean }) {
  const th = useTh();
  const cover = useGeneratedMedia(gen.status === "ready" ? gen.coverImagePath : null, getStudioMusicSignedUrl);
  const audio = useGeneratedMedia(gen.status === "ready" ? gen.audioPath : null, getStudioMusicSignedUrl);
  const coverUrl = cover.url;
  const audioUrl = audio.url;
  const error = gen.trackingError || (gen.status === "failed" ? gen.errorMessage || "La génération a échoué." : null) || audio.error || cover.error || (gen.status === "ready" && !gen.audioPath ? "Le média généré est indisponible." : null);
  const ready = gen.status === "ready" && audio.loaded && (!gen.coverImagePath || cover.loaded) && !error;

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 2px 10px rgba(0,0,0,0.18)" }}>
      <div className="relative w-full cursor-pointer" style={{ aspectRatio: "1 / 1" }} onClick={gen.status === "ready" ? onOpen : undefined}>
        {coverUrl ? (
          <img key={coverUrl} src={coverUrl} onLoad={cover.onLoad} onError={cover.onError} alt={gen.title ?? gen.prompt} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : th.gradShadow(0.06) }}>
            <Music2 className="w-8 h-8" style={{ color: th.fg3 }} />
          </div>
        )}
        <MediaGenerationPlaceholder kind="music" ready={ready} error={error}
          onRetry={audio.error || cover.error ? () => { audio.retry(); cover.retry(); } : onRetry} retryDisabled={retryDisabled && !audio.error && !cover.error} />
        {gen.status === "ready" && (
          <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: "linear-gradient(180deg,rgba(10,10,16,0) 0%,rgba(10,10,16,0.85) 100%)" }}>
            <p className="text-sm font-bold text-white truncate">{gen.title || "Sans titre"}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
              {gen.instrumental ? "Instrumental" : "Chanson"}
            </span>
          </div>
        )}
      </div>
      {gen.status === "ready" && (
        <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          {audioUrl ? <audio key={audioUrl} controls preload="metadata" src={audioUrl} onLoadedMetadata={audio.onLoad} onError={audio.onError} className="w-full h-9" /> : <p className="text-xs" style={{ color: th.fg3 }}>Chargement du lecteur…</p>}
          <div className="flex items-center justify-between gap-2">
            <button onClick={onOpen} className="text-xs font-semibold hover:opacity-70 transition-opacity" style={{ color: th.fg2 }}>Voir les paroles</button>
            {audioUrl && (
              <a href={audioUrl} download={`${gen.title || "musique"}.mp3`} className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity" style={{ color: th.fg2 }}>
                <Download className="w-3.5 h-3.5" />Télécharger
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StudioMusicPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"song" | "instrumental">("song");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const { generations, generating, loading, historyError, start, retry } = useMediaGenerations(user?.id, getMyMusicGenerations, pollMusicGenerationStatus, (result) => ({ audioPath: result.audioPath, coverImagePath: result.coverImagePath }));
  const [detail, setDetail] = useState<StudioMusicGeneration | null>(null);
  const [detailCoverUrl, setDetailCoverUrl] = useState<string | null>(null);
  const [detailAudioUrl, setDetailAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, PROMPT_MAX_HEIGHT)}px`;
  }, [prompt]);

  const pendingCount = generations.filter((g) => g.status === "pending").length;

  const handleGenerate = async () => {
    if (!user || !prompt.trim() || generating) return;
    const draft: StudioMusicGeneration = { id: crypto.randomUUID(), status: "pending", prompt: prompt.trim(), instrumental: mode === "instrumental", lyricsInput: mode === "instrumental" ? null : lyrics.trim() || null, title: null, lyricsStructured: null, coverPrompt: null, audioPath: null, coverImagePath: null, errorMessage: null, createdAt: new Date().toISOString() };
    await start(draft, () => requestMusicGeneration({ prompt: draft.prompt, instrumental: draft.instrumental, lyrics: draft.lyricsInput ?? undefined }));
  };

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
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Le Studio
      </button>

      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif", color: th.fg }}>Concevez vos propres musiques</h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Décris l'ambiance souhaitée et laisse l'IA composer pour toi (Text-to-Music).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        <GCard className="lg:sticky lg:top-5">
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Style & Ambiance</label>
              <textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                disabled={generating}
                placeholder="Ex : Synthwave 80s, synthés rétro, 120 BPM, ambiance nocturne…"
                className="w-full rounded-2xl px-3.5 py-2.5 text-sm outline-none resize-none"
                style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg, maxHeight: PROMPT_MAX_HEIGHT, overflowY: "auto" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Mode</label>
              <Segmented value={mode} onChange={(v) => setMode(v as "song" | "instrumental")} options={MODE_OPTIONS} disabled={generating} />
            </div>

            {mode === "song" && (
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: th.fg }}>Paroles</label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={5}
                  disabled={generating}
                  placeholder="Écris tes paroles ici, ou laisse l'IA les générer automatiquement…"
                  className="w-full rounded-2xl px-3.5 py-2.5 text-sm outline-none resize-none"
                  style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}
                />
              </div>
            )}

            <div className="rounded-2xl px-3.5 py-2.5 text-xs" style={{ background: th.isDark ? "rgba(255,255,255,0.04)" : th.gradShadow(0.06), color: th.fg2 }}>
              Plus votre description est précise (tempo, instruments, références artistiques), meilleur sera le résultat.
            </div>

            <ShimBtn full onClick={handleGenerate} disabled={!prompt.trim() || generating}>
              <span className="flex items-center justify-center gap-1.5">
                {generating ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Génération…" : "Générer la musique"}
              </span>
            </ShimBtn>
          </div>
        </GCard>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-black" style={{ color: th.fg }}>Vos créations musicales</h3>
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
            <GCard><div className="p-8 text-center"><Music2 className="w-8 h-8 mx-auto mb-2" style={{ color: th.fg3 }} /><p className="text-sm" style={{ color: th.fg3 }}>Aucune création pour l'instant.</p></div></GCard>
          )}
          {!!generations.length && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generations.map((gen) => <MusicCard key={gen.clientKey ?? gen.id} gen={gen} onOpen={() => void openDetail(gen)} retryDisabled={generating}
                onRetry={() => void retry(gen, () => requestMusicGeneration({ prompt: gen.prompt, instrumental: gen.instrumental, lyrics: gen.lyricsInput ?? undefined }))} />)}
            </div>
          )}
        </div>
      </div>

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
              <div className="pt-2"><VBtn sm onClick={() => setDetail(null)}>Fermer</VBtn></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
