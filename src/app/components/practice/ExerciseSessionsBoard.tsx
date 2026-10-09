import { useState, type ReactNode } from "react";
import { ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { ShimBtn } from "@/app/components/common/Buttons";
import { SessionEditDialog } from "@/app/components/practice/SessionEditDialog";
import { ExerciseHeader, ScoreRing, Stage, StageButton } from "@/app/components/practice/ExerciseKit";

// Historique d'un exercice noté (Exercices prompts, Images & vidéos) : bilan
// en chiffres, tests en cartes avec leur dernière note, et une scène
// « comment ça marche » tant qu'il n'y a encore rien.

export interface BoardSession {
  id: string;
  title: string;
  preview: string | null;
  badge?: ReactNode;
  createdAt: string;
  attemptCount: number;
  lastScore: number | null;
  bestScore: number | null;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ExerciseSessionsBoard({
  eyebrow, icon, title, intro, steps, sessions, loading, loadError, creating, onCreate, onOpen, onRename, onDelete,
}: {
  eyebrow: string; icon: ReactNode; title: string; intro: string;
  steps: { title: string; text: string }[];
  sessions: BoardSession[]; loading: boolean; loadError: string | null; creating: boolean;
  onCreate: () => void; onOpen: (id: string) => void;
  onRename: (id: string, name: string) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const th = useTh();
  const [editing, setEditing] = useState<BoardSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const scored = sessions.filter((s) => s.lastScore !== null);
  const attempts = sessions.reduce((n, s) => n + s.attemptCount, 0);
  const best = scored.length ? Math.max(...scored.map((s) => s.bestScore ?? s.lastScore ?? 0)) : null;
  const average = scored.length ? Math.round((scored.reduce((n, s) => n + (s.lastScore ?? 0), 0) / scored.length) * 10) / 10 : null;

  const remove = async (s: BoardSession) => {
    if (!confirm(`Supprimer « ${s.title} » et toutes ses tentatives ?`)) return;
    setDeletingId(s.id);
    try {
      await onDelete(s.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de supprimer ce test.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-8">
      <ExerciseHeader backTo="/practice" backLabel="Exercez-vous !" eyebrow={eyebrow} icon={icon} title={title} intro={intro}
        action={sessions.length > 0 ? <ShimBtn onClick={onCreate} disabled={creating}><Plus className="w-4 h-4" />{creating ? "Création…" : "Nouveau test"}</ShimBtn> : undefined} />

      {loading && <div className="h-40 rounded-[10px] animate-pulse" style={{ background: th.navA }} aria-busy="true" aria-label="Chargement" />}
      {!loading && loadError && <p className="text-sm" style={{ color: th.danger }}>{loadError}</p>}

      {!loading && !loadError && sessions.length === 0 && (
        <Stage>
          <div className="px-5 sm:px-8 py-8 sm:py-10">
            <p className="eyebrow text-white/55">Comment ça marche</p>
            <ol className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-black shrink-0" style={{ background: "var(--grad-iris)" }}>{i + 1}</span>
                  <div>
                    <p className="font-bold">{s.title}</p>
                    <p className="text-sm text-white/65 leading-relaxed mt-1">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <StageButton onClick={onCreate} disabled={creating}><Plus className="w-4 h-4" />{creating ? "Création…" : "Commencer mon premier test"}</StageButton>
            </div>
          </div>
        </Stage>
      )}

      {!loading && !loadError && sessions.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["Tests", String(sessions.length)],
              ["Tentatives", String(attempts)],
              ["Meilleure note", best !== null ? `${best}/20` : "—"],
              ["Moyenne actuelle", average !== null ? `${String(average).replace(".", ",")}/20` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[10px] px-4 py-3.5" style={{ border: `1px solid ${th.sep}` }}>
                <p className="eyebrow text-[11px]" style={{ color: th.fg3 }}>{label}</p>
                <p className="text-2xl font-black mt-1 tabular-nums" style={{ color: th.fg }}>{value}</p>
              </div>
            ))}
          </div>

          <section className="space-y-3">
            <p className="eyebrow" style={{ color: th.fg3 }}>Tes tests</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {sessions.map((s) => (
                <div key={s.id} className="group relative rounded-[10px] transition-colors hover-fine:[border-color:var(--ink)]!" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
                  <button type="button" onClick={() => onOpen(s.id)} className="w-full text-left p-4 flex gap-4 items-center">
                    {s.lastScore !== null
                      ? <ScoreRing score={s.lastScore} size={58} />
                      : <span className="w-[58px] h-[58px] rounded-full flex items-center justify-center text-xs shrink-0" style={{ border: `1px dashed ${th.inputB}`, color: th.fg3 }}>—</span>}
                    <span className="min-w-0 flex-1 pr-14">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-black truncate" style={{ color: th.fg }}>{s.title}</span>
                        {s.badge}
                      </span>
                      <span className="block text-xs truncate mt-0.5" style={{ color: th.fg3 }}>{s.preview ?? "Pas encore de tentative"}</span>
                      <span className="block text-[11px] mt-1.5" style={{ color: th.fg3 }}>
                        {formatDate(s.createdAt)} · {s.attemptCount} tentative{s.attemptCount > 1 ? "s" : ""}
                        {s.bestScore !== null && s.attemptCount > 1 ? ` · record ${s.bestScore}/20` : ""}
                      </span>
                    </span>
                  </button>
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button onClick={() => setEditing(s)} title="Renommer" aria-label="Renommer"
                      className="w-7 h-7 rounded-[4px] flex items-center justify-center transition-opacity opacity-60 hover-fine:opacity-100" style={{ color: th.fg3 }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => void remove(s)} disabled={deletingId === s.id} title="Supprimer" aria-label="Supprimer"
                      className="w-7 h-7 rounded-[4px] flex items-center justify-center transition-opacity opacity-60 hover-fine:opacity-100 disabled:opacity-30" style={{ color: th.fg3 }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: th.fg3 }} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {editing && (
        <SessionEditDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          initialName={editing.title}
          onSave={async ({ name }) => { await onRename(editing.id, name); }}
        />
      )}
    </div>
  );
}
