import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, Download, RotateCcw, ClipboardList, Award, Star, Users, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import {
  Panel, IconBadge, Pill, GhostButton, IconAction, StatTile, KitHeading, EmptyState, Loading, ProgressBar, SubCard, SUCCESS, DANGER, HUES, type Hue,
} from "@/app/components/entreprise/EntrepriseKit";
import { SATISFACTION_TYPE_LABEL } from "@/app/components/entreprise/CompanySatisfactionTab";
import { listCompanyEmployees, studentNameMap, type CompanyEmployeeRow } from "@/app/lib/entreprise/companyEmployees";
import {
  listPositioningTests, listCompanyPositioningAttempts, deletePositioningAttempt, getPositioningQuestions, QUIZ_KIND_LABEL,
  type PositioningTestRow, type PositioningAttemptRow, type QuizQuestionDraft,
} from "@/app/lib/entreprise/companyPositioning";
import {
  listSatisfactionTests, listCompanySatisfactionResponses, deleteSatisfactionResponse, getSatisfactionQuestionsForResults,
  type SatisfactionTestRow, type SatisfactionResponseRow, type SatisfactionQuestionForStudent, type SatisfactionAnswer,
} from "@/app/lib/entreprise/companySatisfaction";

// ── Utilitaires ───────────────────────────────────────────────────────────

const GOOD = SUCCESS;
const MID = HUES.amber[0];
const LOW = DANGER;

const QUIZ_STYLE: Record<PositioningTestRow["kind"], { hue: Hue; Icon: LucideIcon }> = {
  positioning: { hue: "blue", Icon: ClipboardList },
  validation: { hue: "amber", Icon: Award },
};
const SURVEY_STYLE = { hue: "peach" as Hue, Icon: Star };
const scoreColor = (score: number) => (score >= 70 ? GOOD : score >= 40 ? MID : LOW);
const average = (values: number[]) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

// CSV au format Excel français : séparateur ";" et BOM UTF-8 pour les accents.
function downloadCsv(fileName: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + rows.map((r) => r.map(escape).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/[\\/:*?"<>|]/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatSurveyAnswer(q: SatisfactionQuestionForStudent, a: SatisfactionAnswer | undefined): string {
  if (!a || a.value === "" || (Array.isArray(a.value) && !a.value.length)) return "";
  const optionLabel = (id: string) => q.options.find((o) => o.id === id)?.label ?? "(réponse supprimée)";
  switch (q.type) {
    case "qcm": return (Array.isArray(a.value) ? a.value : [String(a.value)]).map(optionLabel).join(", ");
    case "rating": return `${a.value}/5`;
    case "yes_no": return `${a.value === "yes" ? "Oui" : "Non"}${a.detail ? ` — ${a.detail}` : ""}`;
    default: return String(a.value);
  }
}

// ── Petits composants ─────────────────────────────────────────────────────

function Bar({ label, count, total, hue }: { label: string; count: number; total: number; hue?: Hue }) {
  const th = useTh();
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate" style={{ color: th.fg2 }}>{label}</span>
        <span className="shrink-0 tabular-nums text-xs font-bold" style={{ color: th.fg3 }}>{count} · {pct}%</span>
      </div>
      <ProgressBar value={pct} hue={hue} />
    </div>
  );
}

function ResetButton({ onClick, title }: { onClick: () => void; title: string }) {
  // IconAction appelle preventDefault : le bouton vit aussi dans un <summary>, dont le clic replierait la ligne.
  return <IconAction Icon={RotateCcw} onClick={onClick} title={title} />;
}

// Carte repliable aux couleurs du type (positionnement, validation,
// questionnaire) : en-tête toujours visible, détail chargé à l'ouverture.
function ResultCard({ title, badge, summary, open, onToggle, onExport, hue, Icon, index, children }: {
  title: string; badge: string; summary: ReactNode; open: boolean; onToggle: () => void; onExport: () => void;
  hue: Hue; Icon: LucideIcon; index: number; children: ReactNode;
}) {
  const th = useTh();
  return (
    <Panel hue={hue} index={index}>
      <div className="p-4 sm:p-5 flex items-center gap-4 flex-wrap">
        <button type="button" onClick={onToggle} className="flex-1 min-w-[220px] flex items-center gap-4 text-left">
          <IconBadge Icon={Icon} hue={hue} />
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold truncate" style={{ color: th.fg }}>{title}</div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5"><Pill hue={hue}>{badge}</Pill><span className="text-sm" style={{ color: th.fg3 }}>{summary}</span></div>
          </div>
          <ChevronDown className="w-5 h-5 shrink-0 transition-transform duration-300" style={{ color: th.fg3, transform: open ? "rotate(180deg)" : undefined }} />
        </button>
        <GhostButton sm hue={hue} Icon={Download} onClick={onExport}>CSV</GhostButton>
      </div>
      {open && <div className="px-4 sm:px-5 pb-5" style={{ borderTop: `1px solid ${th.sep}` }}><div className="pt-5 space-y-6">{children}</div></div>}
    </Panel>
  );
}

// ── Onglet ────────────────────────────────────────────────────────────────

export function CompanyResultsTab({ companyId }: { companyId: string }) {
  const th = useTh();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<CompanyEmployeeRow[]>([]);
  const [quizzes, setQuizzes] = useState<PositioningTestRow[]>([]);
  const [attempts, setAttempts] = useState<PositioningAttemptRow[]>([]);
  const [surveys, setSurveys] = useState<SatisfactionTestRow[]>([]);
  const [responses, setResponses] = useState<SatisfactionResponseRow[]>([]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [quizQuestions, setQuizQuestions] = useState<Record<string, QuizQuestionDraft[]>>({});
  const [surveyQuestions, setSurveyQuestions] = useState<Record<string, SatisfactionQuestionForStudent[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [emps, qz, att, sv, resp] = await Promise.all([
          listCompanyEmployees(companyId), listPositioningTests(companyId), listCompanyPositioningAttempts(companyId),
          listSatisfactionTests(companyId), listCompanySatisfactionResponses(companyId),
        ]);
        if (cancelled) return;
        setEmployees(emps);
        // Positionnement d'abord, puis validation ; du plus ancien au plus récent.
        setQuizzes([...qz].reverse().sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "positioning" ? -1 : 1)));
        setAttempts(att);
        setSurveys([...sv].reverse());
        setResponses(resp);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger les résultats.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  const names = studentNameMap(employees);
  const nameOf = (studentId: string) => names.get(studentId) ?? "Collaborateur inconnu";
  const byName = (a: { studentId: string }, b: { studentId: string }) => nameOf(a.studentId).localeCompare(nameOf(b.studentId));
  const activeStudents = employees.filter((e) => e.profileId);

  const loadQuizQuestions = async (testId: string) => {
    if (quizQuestions[testId]) return quizQuestions[testId];
    const qs = await getPositioningQuestions(testId);
    setQuizQuestions((prev) => ({ ...prev, [testId]: qs }));
    return qs;
  };
  const loadSurveyQuestions = async (testId: string) => {
    if (surveyQuestions[testId]) return surveyQuestions[testId];
    const qs = await getSatisfactionQuestionsForResults(testId);
    setSurveyQuestions((prev) => ({ ...prev, [testId]: qs }));
    return qs;
  };

  const toggle = (id: string, loadQuestions: (id: string) => Promise<unknown>) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    loadQuestions(id).catch((err) => { console.error(err); toast.error("Impossible de charger les questions."); });
  };

  const resetAttempt = async (attempt: PositioningAttemptRow) => {
    if (!confirm(`Effacer le résultat de ${nameOf(attempt.studentId)} ? Il ou elle pourra repasser ce quiz.`)) return;
    try {
      await deletePositioningAttempt(attempt.id);
      setAttempts((rows) => rows.filter((r) => r.id !== attempt.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'effacer ce résultat.");
    }
  };

  const resetResponse = async (response: SatisfactionResponseRow) => {
    if (!confirm(`Effacer les réponses de ${nameOf(response.studentId)} ? Il ou elle pourra répondre à nouveau.`)) return;
    try {
      await deleteSatisfactionResponse(response.id);
      setResponses((rows) => rows.filter((r) => r.id !== response.id));
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'effacer ces réponses.");
    }
  };

  const exportQuiz = async (quiz: PositioningTestRow) => {
    try {
      const qs = await loadQuizQuestions(quiz.id);
      const rows = attempts.filter((a) => a.testId === quiz.id).sort(byName);
      downloadCsv(quiz.title, [
        ["Collaborateur", "Date", "Score (%)", ...qs.map((q, i) => `Q${i + 1}. ${q.question}`)],
        ...rows.map((a) => [
          nameOf(a.studentId), formatDate(a.createdAt), a.score,
          ...qs.map((q) => {
            const ans = a.answers.find((x) => x.questionId === q.id);
            if (!ans) return "";
            const label = q.options.find((o) => o.id === ans.selectedOptionId)?.label ?? "";
            return `${ans.correct ? "✓" : "✗"} ${label}`.trim();
          }),
        ]),
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Export impossible.");
    }
  };

  const exportSurvey = async (survey: SatisfactionTestRow) => {
    try {
      const qs = await loadSurveyQuestions(survey.id);
      const rows = responses.filter((r) => r.testId === survey.id).sort(byName);
      downloadCsv(survey.title, [
        ["Collaborateur", "Date", ...qs.map((q, i) => `Q${i + 1}. ${q.question}`)],
        ...rows.map((r) => [nameOf(r.studentId), formatDate(r.createdAt), ...qs.map((q) => formatSurveyAnswer(q, r.answers.find((a) => a.questionId === q.id)))]),
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Export impossible.");
    }
  };

  if (loading) return <Loading label="Chargement des résultats…" />;

  const scoreFor = (testId: string, studentId: string) => attempts.find((a) => a.testId === testId && a.studentId === studentId)?.score;
  const surveyDoneCount = (studentId: string) => surveys.filter((s) => responses.some((r) => r.testId === s.id && r.studentId === studentId)).length;

  return (
    <div className="space-y-10 pt-2">
      {/* ── Synthèse par collaborateur ── */}
      <section className="space-y-3">
        <KitHeading>Synthèse par collaborateur</KitHeading>
        {!activeStudents.length ? (
          <EmptyState Icon={Users} title="Aucun collaborateur actif" hint="Envoyez les accès depuis la rubrique Collaborateurs : leurs résultats apparaîtront ici." />
        ) : (
          <Panel halo={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${th.sep}` }}>
                    <th className="text-left font-semibold px-4 py-3 text-xs whitespace-nowrap" style={{ color: th.fg3 }}>Collaborateur</th>
                    {quizzes.map((q) => (
                      <th key={q.id} className="text-center font-semibold px-3 py-3 text-xs" style={{ color: th.fg3 }}>
                        <div className="max-w-[140px] mx-auto truncate" title={q.title}>{q.title}</div>
                        <div className="text-[10px] font-normal">{q.kind === "positioning" ? "Positionnement" : "Validation"}</div>
                      </th>
                    ))}
                    {!!surveys.length && <th className="text-center font-semibold px-3 py-3 text-xs whitespace-nowrap" style={{ color: th.fg3 }}>Questionnaires</th>}
                  </tr>
                </thead>
                <tbody>
                  {activeStudents.map((e) => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${th.sep}` }}>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: th.fg }}>{e.firstName} {e.lastName}</td>
                      {quizzes.map((q) => {
                        const score = scoreFor(q.id, e.profileId!);
                        return (
                          <td key={q.id} className="px-3 py-2.5 text-center tabular-nums font-semibold" style={{ color: score === undefined ? th.fg3 : scoreColor(score) }}>
                            {score === undefined ? "—" : `${Math.round(score)}%`}
                          </td>
                        );
                      })}
                      {!!surveys.length && (
                        <td className="px-3 py-2.5 text-center tabular-nums" style={{ color: th.fg2 }}>{surveyDoneCount(e.profileId!)}/{surveys.length}</td>
                      )}
                    </tr>
                  ))}
                  {!!quizzes.length && (
                    <tr>
                      <td className="px-4 py-2.5 text-xs font-black uppercase tracking-widest" style={{ color: th.fg3 }}>Moyenne</td>
                      {quizzes.map((q) => {
                        const avg = average(attempts.filter((a) => a.testId === q.id).map((a) => a.score));
                        return <td key={q.id} className="px-3 py-2.5 text-center tabular-nums font-black" style={{ color: avg === null ? th.fg3 : scoreColor(avg) }}>{avg === null ? "—" : `${avg}%`}</td>;
                      })}
                      {!!surveys.length && <td />}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </section>

      {/* ── Quiz ── */}
      <section className="space-y-3">
        <KitHeading>Quiz (positionnement et validation)</KitHeading>
        {!quizzes.length && <EmptyState Icon={ClipboardList} hue="blue" title="Aucun quiz créé pour l'instant" />}
        {quizzes.map((quiz, quizIndex) => {
          const rows = attempts.filter((a) => a.testId === quiz.id).sort(byName);
          const scores = rows.map((a) => a.score);
          const avg = average(scores);
          const qs = quizQuestions[quiz.id];
          return (
            <ResultCard key={quiz.id} index={quizIndex} hue={QUIZ_STYLE[quiz.kind].hue} Icon={QUIZ_STYLE[quiz.kind].Icon} title={quiz.title} badge={QUIZ_KIND_LABEL[quiz.kind].singular}
              summary={`${rows.length}/${activeStudents.length} répondu${rows.length > 1 ? "s" : ""}${avg !== null ? ` · moyenne ${avg}%` : ""}`}
              open={open.has(quiz.id)} onToggle={() => toggle(quiz.id, loadQuizQuestions)} onExport={() => void exportQuiz(quiz)}>
              {!rows.length ? <p className="text-sm" style={{ color: th.fg3 }}>Personne n'a encore répondu.</p> : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatTile hue={QUIZ_STYLE[quiz.kind].hue} label="Réponses" value={`${rows.length}/${activeStudents.length}`} />
                    <StatTile hue={QUIZ_STYLE[quiz.kind].hue} label="Moyenne" value={`${avg}%`} color={scoreColor(avg!)} />
                    <StatTile hue={QUIZ_STYLE[quiz.kind].hue} label="Minimum" value={`${Math.round(Math.min(...scores))}%`} />
                    <StatTile hue={QUIZ_STYLE[quiz.kind].hue} label="Maximum" value={`${Math.round(Math.max(...scores))}%`} />
                  </div>
                  <div>
                    <KitHeading hue={QUIZ_STYLE[quiz.kind].hue}>Scores</KitHeading>
                    <div className="space-y-1">
                      {rows.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 text-sm rounded-xl px-3 py-2" style={{ background: th.inputBg }}>
                          <span className="flex-1 min-w-0 truncate" style={{ color: th.fg }}>{nameOf(a.studentId)}</span>
                          <span className="text-xs shrink-0" style={{ color: th.fg3 }}>{formatDate(a.createdAt)}</span>
                          <span className="w-12 text-right font-black tabular-nums shrink-0" style={{ color: scoreColor(a.score) }}>{Math.round(a.score)}%</span>
                          <ResetButton onClick={() => void resetAttempt(a)} title="Effacer ce résultat (permet de repasser le quiz)" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <KitHeading hue={QUIZ_STYLE[quiz.kind].hue}>Taux de bonnes réponses par question</KitHeading>
                    {!qs ? <Loading /> : (
                      <div className="space-y-3">
                        {qs.map((q, i) => {
                          const answered = rows.map((a) => a.answers.find((x) => x.questionId === q.id)).filter(Boolean);
                          return <Bar key={q.id} hue={QUIZ_STYLE[quiz.kind].hue} label={`${i + 1}. ${q.question}`} count={answered.filter((x) => x!.correct).length} total={answered.length} />;
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </ResultCard>
          );
        })}
      </section>

      {/* ── Questionnaires ── */}
      <section className="space-y-3">
        <KitHeading>Questionnaires</KitHeading>
        {!surveys.length && <EmptyState Icon={Star} hue="peach" title="Aucun questionnaire créé pour l'instant" />}
        {surveys.map((survey, surveyIndex) => {
          const rows = responses.filter((r) => r.testId === survey.id).sort(byName);
          const qs = surveyQuestions[survey.id];
          return (
            <ResultCard key={survey.id} index={surveyIndex} hue={SURVEY_STYLE.hue} Icon={SURVEY_STYLE.Icon} title={survey.title} badge="Questionnaire"
              summary={`${rows.length}/${activeStudents.length} répondu${rows.length > 1 ? "s" : ""}`}
              open={open.has(survey.id)} onToggle={() => toggle(survey.id, loadSurveyQuestions)} onExport={() => void exportSurvey(survey)}>
              {!rows.length ? <p className="text-sm" style={{ color: th.fg3 }}>Personne n'a encore répondu.</p> : !qs ? <Loading /> : (
                <>
                  {qs.map((q, i) => (
                    <div key={q.id}>
                      <SubCard hue={SURVEY_STYLE.hue}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="text-sm font-bold" style={{ color: th.fg }}>{i + 1}. {q.question}</div>
                          <Pill hue={SURVEY_STYLE.hue}>{SATISFACTION_TYPE_LABEL[q.type]}{q.type === "qcm" && q.allowMultiple ? " multiple" : ""}</Pill>
                        </div>
                        <SurveyQuestionSummary question={q} rows={rows} nameOf={nameOf} />
                      </SubCard>
                    </div>
                  ))}
                  <div>
                    <KitHeading hue={SURVEY_STYLE.hue}>Répondants</KitHeading>
                    <div className="space-y-1">
                      {rows.map((r) => (
                        <details key={r.id} className="rounded-xl px-3.5 py-2.5" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                          <summary className="flex items-center gap-3 text-sm cursor-pointer list-none">
                            <span className="flex-1 min-w-0 truncate" style={{ color: th.fg }}>{nameOf(r.studentId)}</span>
                            <span className="text-xs shrink-0" style={{ color: th.fg3 }}>{formatDate(r.createdAt)} · voir les réponses</span>
                            <ResetButton onClick={() => void resetResponse(r)} title="Effacer ces réponses (permet de répondre à nouveau)" />
                          </summary>
                          <dl className="mt-2 space-y-2 text-xs">
                            {qs.map((q, i) => (
                              <div key={q.id}>
                                <dt style={{ color: th.fg3 }}>{i + 1}. {q.question}</dt>
                                <dd className="whitespace-pre-line" style={{ color: th.fg }}>{formatSurveyAnswer(q, r.answers.find((a) => a.questionId === q.id)) || "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </ResultCard>
          );
        })}
      </section>
    </div>
  );
}

function SurveyQuestionSummary({ question: q, rows, nameOf }: {
  question: SatisfactionQuestionForStudent; rows: SatisfactionResponseRow[]; nameOf: (id: string) => string;
}) {
  const th = useTh();
  const answered = rows
    .map((r) => ({ studentId: r.studentId, answer: r.answers.find((a) => a.questionId === q.id) }))
    .filter((x): x is { studentId: string; answer: SatisfactionAnswer } =>
      !!x.answer && x.answer.value !== "" && !(Array.isArray(x.answer.value) && !x.answer.value.length));

  if (!answered.length) return <p className="text-xs" style={{ color: th.fg3 }}>Aucune réponse.</p>;

  const textList = (items: { studentId: string; text: string }[]) => (
    <ul className="space-y-1.5 mt-2">
      {items.map((x, i) => (
        <li key={i} className="text-sm rounded-xl px-3.5 py-2.5 whitespace-pre-line" style={{ background: th.card, border: `1px solid ${th.sep}`, color: th.fg }}>
          <span className="font-semibold" style={{ color: th.fg3 }}>{nameOf(x.studentId)} : </span>{x.text}
        </li>
      ))}
    </ul>
  );

  if (q.type === "rating") {
    const values = answered.map((x) => Number(x.answer.value));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return (
      <div className="space-y-2">
        <p className="text-sm" style={{ color: th.fg }}>Moyenne : <strong>{avg.toFixed(1)}/5</strong> <span className="text-xs" style={{ color: th.fg3 }}>({values.length} réponse{values.length > 1 ? "s" : ""})</span></p>
        {[5, 4, 3, 2, 1].map((n) => <Bar hue="peach" key={n} label={`${n}/5`} count={values.filter((v) => v === n).length} total={values.length} />)}
      </div>
    );
  }

  if (q.type === "qcm") {
    const selected = answered.map((x) => (Array.isArray(x.answer.value) ? x.answer.value : [String(x.answer.value)]));
    return (
      <div className="space-y-2">
        {q.options.map((o) => <Bar hue="peach" key={o.id} label={o.label} count={selected.filter((ids) => ids.includes(o.id)).length} total={answered.length} />)}
        {q.allowMultiple && <p className="text-[11px]" style={{ color: th.fg3 }}>% calculé sur {answered.length} répondant{answered.length > 1 ? "s" : ""} (plusieurs choix possibles).</p>}
      </div>
    );
  }

  if (q.type === "yes_no") {
    const details = answered.filter((x) => x.answer.detail).map((x) => ({ studentId: x.studentId, text: x.answer.detail! }));
    return (
      <div className="space-y-2">
        <Bar hue="peach" label="Oui" count={answered.filter((x) => x.answer.value === "yes").length} total={answered.length} />
        <Bar hue="peach" label="Non" count={answered.filter((x) => x.answer.value === "no").length} total={answered.length} />
        {!!details.length && textList(details)}
      </div>
    );
  }

  return textList(answered.map((x) => ({ studentId: x.studentId, text: String(x.answer.value) })));
}
