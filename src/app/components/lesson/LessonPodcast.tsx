import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, Wand2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { PODCAST_FORMATS, type PodcastFormatUi, type PodcastVariantId } from "@/app/lib/podcastFormats";
import type { PodcastProgress } from "@/app/lib/podcasts";
import { cx } from "@/app/lib/cx";

// Onglet Podcast d'une leçon : les épisodes déjà générés, chacun avec un
// lecteur maison (lecture, progression au dégradé iris qu'on fait glisser,
// vitesse), puis les autres formats à générer, présentés comme des cartes.
// Pendant une génération, la carte du format montre le réseau de la marque
// au travail.
const GRADS = ["var(--grad-violet)", "var(--grad-bleu)", "var(--grad-beige)"];

export function LessonPodcast({ episodes, loading, generating, progress, onGenerate, canRegenerate }: {
  episodes: Partial<Record<PodcastVariantId, { audioUrl: string }>>;
  loading: boolean;
  generating: PodcastVariantId | null;
  progress?: PodcastProgress | null;
  onGenerate: (id: PodcastVariantId) => void;
  canRegenerate: boolean;
}) {
  const th = useTh();
  const ready = PODCAST_FORMATS.filter((f) => episodes[f.id]);
  const remaining = PODCAST_FORMATS.filter((f) => !episodes[f.id]);

  if (loading) {
    return <div className="h-48 rounded-[10px] animate-pulse" style={{ background: th.navA }} aria-busy="true" aria-label="Chargement du podcast" />;
  }

  return (
    <div className="space-y-8 mb-8">
      <div>
        <p className="eyebrow flex items-center gap-2" style={{ color: th.fg3 }}><Headphones className="w-3.5 h-3.5" />Podcast de la leçon</p>
        <h2 className="mt-2 text-[1.4rem] sm:text-[1.7rem] font-black leading-tight" style={{ color: th.fg }}>
          {ready.length ? "Écoute ta leçon comme une émission" : "Transforme ta leçon en émission audio"}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed max-w-2xl" style={{ color: th.fg2 }}>
          Deux animateurs IA discutent du cours, adapté à ton profil. Idéal pour réviser dans les transports ou en marchant.
        </p>
      </div>

      {ready.length > 0 && (
        <div className="space-y-3">
          {ready.map((f, i) => (
            <PodcastPlayer key={f.id} format={f} src={episodes[f.id]!.audioUrl} grad={GRADS[i % GRADS.length]}
              action={canRegenerate ? (
                <button type="button" onClick={() => onGenerate(f.id)} disabled={generating !== null}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover-fine:text-white disabled:opacity-40">
                  {generating === f.id ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span className="ink-link">{generating === f.id ? "Génération…" : "Régénérer"}</span>
                </button>
              ) : undefined} />
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div>
          <p className="eyebrow mb-3" style={{ color: th.fg3 }}>{ready.length ? "Autres formats" : "Choisis un format"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {remaining.map((f, i) => {
              const busy = generating === f.id;
              return (
                <button key={f.id} type="button" onClick={() => onGenerate(f.id)} disabled={generating !== null}
                  className={cx("group relative overflow-hidden text-left rounded-[10px] p-5 transition-colors disabled:cursor-default", !generating && "hover-fine:[border-color:var(--ink)]!")}
                  style={{ border: `1px solid ${busy ? th.ink : th.sep}`, background: th.card, opacity: generating && !busy ? 0.5 : 1 }}>
                  {busy && <NeuralField dark={th.isDark} density={5} band={0.9} active className="opacity-70" />}
                  <span className="relative flex items-start gap-4">
                    <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: GRADS[i % GRADS.length] }}>
                      <f.Icon className="w-5 h-5" style={{ color: "#000" }} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-bold" style={{ color: th.fg }}>{f.label}</span>
                      <span className="block mt-1 text-sm leading-snug" style={{ color: th.fg2 }}>{f.hint}</span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: th.fg }}>
                        {busy ? <><RotateCcw className="w-3.5 h-3.5 animate-spin" />{progressLabel(progress)}</> : <><Wand2 className="w-3.5 h-3.5" /><span className="ink-link">Générer cet épisode</span></>}
                      </span>
                      {busy && (
                        <>
                          <span className="mt-3 block h-1.5 rounded-full overflow-hidden" style={{ background: th.navA }}>
                            <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${progressPct(progress)}%`, background: "var(--grad-iris)" }} />
                          </span>
                          <span className="mt-2 block text-xs" style={{ color: th.fg3 }}>Garde cette page ouverte pendant l'enregistrement.</span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Avancement : écriture du script (≈10 %), enregistrement des morceaux
// (10 → 90 %), assemblage (90 → 100 %).
function progressPct(p?: PodcastProgress | null) {
  if (!p) return 3;
  if (p.step === "script") return 8;
  if (p.step === "final") return 95;
  return 10 + (p.total ? (p.done / p.total) * 80 : 0);
}

function progressLabel(p?: PodcastProgress | null) {
  if (!p || p.step === "script") return "Écriture du script…";
  if (p.step === "final") return "Montage de l'épisode…";
  return `Les animateurs enregistrent… ${p.done}/${p.total}`;
}

const SPEEDS = [1, 1.25, 1.5, 2];

// Lecteur d'un épisode : panneau noir, ondes stylisées qui s'animent pendant
// la lecture, progression iris qu'on peut faire glisser, vitesse de lecture.
function PodcastPlayer({ format, src, grad, action }: { format: PodcastFormatUi; src: string; grad: string; action?: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => { if (audio.current) audio.current.playbackRate = speed; }, [speed]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  };
  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-[10px] bg-black text-white p-5 sm:p-6">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: grad }} />
      <audio ref={audio} src={src} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)} />
      <div className="flex items-center gap-4 sm:gap-5">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : `Écouter : ${format.label}`}
          className="sweep w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-white text-black">
          {playing ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2 text-[16px] font-bold"><format.Icon className="w-4 h-4 text-white/70" />{format.label}</span>
            <span className="ml-auto">{action}</span>
          </div>
          {/* Ondes stylisées : s'animent pendant la lecture. */}
          <div aria-hidden className={cx("mt-3 flex items-end gap-[3px] h-7", playing && "podcast-wave-on")}>
            {Array.from({ length: 48 }, (_, i) => (
              <span key={i} className="podcast-bar flex-1 rounded-full" style={{
                height: `${22 + Math.abs(Math.sin(i * 1.7) * 60 + Math.sin(i * 0.6) * 18)}%`,
                background: (i / 48) * 100 <= pct ? grad : "rgba(255,255,255,0.18)",
                animationDelay: `${(i % 8) * 90}ms`,
              }} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs tabular-nums text-white/60 w-10">{fmt(time)}</span>
            <input type="range" min={0} max={duration || 0} step={0.1} value={time} aria-label="Position dans l'épisode"
              onChange={(e) => { const a = audio.current; if (a) { a.currentTime = Number(e.target.value); setTime(a.currentTime); } }}
              className="podcast-range flex-1" style={{ ["--pct" as string]: `${pct}%` }} />
            <span className="text-xs tabular-nums text-white/60 w-10 text-right">{fmt(duration)}</span>
            <button type="button" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label="Vitesse de lecture"
              className="text-xs font-bold tabular-nums px-2 h-7 rounded-[2px] border border-white/25 hover-fine:border-white">
              {speed.toString().replace(".", ",")}×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}
