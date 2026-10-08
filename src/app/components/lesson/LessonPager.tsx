import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import type { LessonWithState, OutlineLesson } from "@/app/lib/learning";

// Bas de leçon : leçon précédente / suivante, pour avancer sans repasser par
// « Mes leçons ». Tant que la leçon n'est pas validée, la suivante reste
// visible mais verrouillée, avec la raison.
export function LessonPager({ lessons, states, currentId, nextLocked }: {
  lessons: OutlineLesson[]; states: LessonWithState[]; currentId?: string; nextLocked: boolean;
}) {
  const th = useTh();
  const navigate = useNavigate();
  const i = lessons.findIndex((l) => l.id === currentId);
  if (i < 0) return null;
  const prev = lessons[i - 1];
  const next = lessons[i + 1];
  const nextState = states.find((s) => s.lesson.id === next?.id)?.state;
  const locked = !!next && (nextLocked && nextState === "locked");
  if (!prev && !next) return null;

  return (
    <nav aria-label="Navigation entre les leçons" className="mt-14 mb-4 grid gap-3 sm:grid-cols-2" style={{ borderTop: `1px solid ${th.sep}`, paddingTop: 24 }}>
      {prev ? (
        <button type="button" onClick={() => navigate(`/lesson/${prev.id}`)}
          className="group text-left rounded-[6px] p-4 transition-colors hover-fine:[border-color:var(--ink)]!" style={{ border: `1px solid ${th.sep}` }}>
          <span className="eyebrow flex items-center gap-1.5" style={{ color: th.fg3 }}><ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />Leçon précédente</span>
          <span className="mt-1.5 block text-[15px] font-bold leading-snug" style={{ color: th.fg }}>{prev.title}</span>
        </button>
      ) : <span className="hidden sm:block" />}
      {next && (
        <button type="button" disabled={locked} onClick={() => navigate(`/lesson/${next.id}`)}
          className="group text-left sm:text-right rounded-[6px] p-4 transition-colors hover-fine:enabled:[border-color:var(--ink)]! disabled:cursor-default" style={{ border: `1px solid ${th.sep}` }}>
          <span className="eyebrow flex items-center sm:justify-end gap-1.5" style={{ color: th.fg3 }}>
            {locked ? <><Lock className="w-3 h-3" />Valide le quiz pour débloquer</> : <>Leçon suivante<ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" /></>}
          </span>
          <span className="mt-1.5 block text-[15px] font-bold leading-snug" style={{ color: locked ? th.fg3 : th.fg }}>{next.title}</span>
        </button>
      )}
    </nav>
  );
}
