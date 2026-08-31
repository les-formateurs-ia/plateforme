import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronDown, CheckCircle, X, Lightbulb } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VSelect } from "@/app/components/common/Select";
import { useMyInstances } from "@/app/state/useMyInstances";
import { getAllQuizQuestions, type QuizQuestionWithLesson } from "@/app/lib/learning";

function QuestionCard({ q, selected, onSelect }: { q: QuizQuestionWithLesson; selected: string | null; onSelect: (optionId: string) => void }) {
  const th = useTh();
  return (
    <div className="rounded-xl p-4" style={{ border: `1px solid ${th.sep}` }}>
      <p className="text-sm font-semibold mb-3" style={{ color: th.fg }}>{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let bg = th.isDark ? "rgba(255,255,255,0.03)" : th.inputBg, border = th.inputB, color = th.fg2;
          if (selected !== null) {
            if (opt.isCorrect) { bg = "rgba(106,222,177,0.1)"; border = "rgba(106,222,177,0.35)"; color = "#6adeb1"; }
            else if (opt.id === selected) { bg = "rgba(251,194,173,0.1)"; border = "rgba(251,194,173,0.35)"; color = "#fbc2ad"; }
            else { bg = "transparent"; border = th.sep; color = th.fg3; }
          }
          return (
            <button key={opt.id} onClick={() => onSelect(opt.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-all"
              style={{ background: bg, border: `1px solid ${border}`, color }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(181,141,224,0.06)" }}>
                {selected !== null && opt.isCorrect ? <CheckCircle className="w-4 h-4 text-[#6adeb1]" /> : selected !== null && opt.id === selected ? <X className="w-4 h-4 text-[#fbc2ad]" /> : String.fromCharCode(65 + i)}
              </span>{opt.label}
            </button>
          );
        })}
      </div>
      {selected !== null && q.explanation && (
        <div className="rounded-xl p-3.5 mt-3" style={{ background: "rgba(106,222,177,0.07)", border: "1px solid rgba(106,222,177,0.2)" }}>
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-[#78d5e2]"><Lightbulb className="w-3.5 h-3.5" />Explication</div>
          <p className="text-xs leading-relaxed" style={{ color: th.fg2 }}>{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function BasicExercisesPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { instances, selectedId, setSelectedId, loading: instancesLoading } = useMyInstances();
  const [questions, setQuestions] = useState<QuizQuestionWithLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    if (instancesLoading) return;
    const instanceId = selectedId ?? instances[0]?.id;
    if (!instanceId) { setQuestions([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const rows = await getAllQuizQuestions(instanceId);
      if (!cancelled) { setQuestions(rows); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [instancesLoading, selectedId, instances]);

  const sections = useMemo(() => {
    const bySection = new Map<string, { title: string; lessons: Map<string, { title: string; questions: QuizQuestionWithLesson[] }> }>();
    for (const q of questions) {
      if (!bySection.has(q.sectionId)) bySection.set(q.sectionId, { title: q.sectionTitle, lessons: new Map() });
      const sec = bySection.get(q.sectionId)!;
      if (!sec.lessons.has(q.lessonId)) sec.lessons.set(q.lessonId, { title: q.lessonTitle, questions: [] });
      sec.lessons.get(q.lessonId)!.questions.push(q);
    }
    return Array.from(bySection.entries()).map(([id, s]) => ({ id, title: s.title, lessons: Array.from(s.lessons.entries()).map(([lessonId, l]) => ({ lessonId, ...l })) }));
  }, [questions]);

  useEffect(() => {
    if (!openSection && sections.length) setOpenSection(sections[0].id);
  }, [sections, openSection]);

  const select = (questionId: string, optionId: string) => setAnswers((a) => ({ ...a, [questionId]: optionId }));

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate("/practice")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
            <ArrowLeft className="w-4 h-4" />Pratique IA
          </button>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Exercices basiques</GT></h2>
          <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Toutes les questions de quiz de ta formation, terminées ou non — révise à volonté.</p>
        </div>
        {instances.length > 1 && (
          <div className="w-56 shrink-0">
            <VSelect sm value={selectedId ?? instances[0].id} onValueChange={setSelectedId} options={instances.map((i) => ({ value: i.id, label: i.name }))} />
          </div>
        )}
      </div>

      {(loading || instancesLoading) && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && !instancesLoading && !questions.length && (
        <GCard><div className="p-8 text-center">
          <p className="text-sm font-semibold mb-1" style={{ color: th.fg }}>Aucune question pour l'instant</p>
          <p className="text-xs" style={{ color: th.fg3 }}>{instances.length ? "Ta formation n'a pas encore de quiz." : "Aucune formation ne t'a encore été attribuée."}</p>
        </div></GCard>
      )}

      <div className="space-y-3">
        {sections.map((sec) => {
          const open = openSection === sec.id;
          const total = sec.lessons.reduce((n, l) => n + l.questions.length, 0);
          return (
            <GCard key={sec.id}>
              <button className="w-full text-left" onClick={() => setOpenSection(open ? null : sec.id)}>
                <div className="px-5 py-4 flex items-center gap-3">
                  <span className="text-sm font-bold flex-1" style={{ color: th.fg }}>{sec.title}</span>
                  <span className="text-xs" style={{ color: th.fg3 }}>{total} question{total > 1 ? "s" : ""}</span>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: th.fg3, transform: open ? "rotate(180deg)" : "none" }} />
                </div>
              </button>
              {open && (
                <div className="px-5 pb-5 space-y-5" style={{ borderTop: `1px solid ${th.sep}` }}>
                  {sec.lessons.map((l) => (
                    <div key={l.lessonId} className="pt-4">
                      <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: th.navAC }}>{l.title}</h4>
                      <div className="space-y-3">
                        {l.questions.map((q) => (
                          <QuestionCard key={q.id} q={q} selected={answers[q.id] ?? null} onSelect={(optId) => select(q.id, optId)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GCard>
          );
        })}
      </div>
    </div>
  );
}
