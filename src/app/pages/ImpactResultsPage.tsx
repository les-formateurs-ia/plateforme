import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Download, MessageSquareQuote, SearchX, Star } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Notice, PublicShell, SurveyHero } from "@/app/pages/ImpactSurveyPage";
import { getImpactResults, type ImpactAnswer, type ImpactQuestion, type ImpactResponse, type ImpactResults } from "@/app/lib/impactSurveys";

// Tableau de bord des résultats d'une évaluation d'impact, ouvert par lien
// unique et sans compte : partagé au responsable de l'entreprise.
// Une seule teinte pour les barres (chaque graphique n'a qu'une série) ; les
// valeurs sont écrites en clair à côté de chaque barre et au survol.

const BAR = "#2A78D6";
const STAR = "#e0a526";

const answered = (a: ImpactAnswer | undefined): a is ImpactAnswer =>
  !!a && a.value !== "" && !(Array.isArray(a.value) && !a.value.length);
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
const fullName = (r: ImpactResponse) => `${r.firstName} ${r.lastName}`.trim();
const dateFr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });

function answerText(q: ImpactQuestion, a: ImpactAnswer | undefined): string {
  if (!answered(a)) return "";
  const label = (id: string) => q.options.find((o) => o.id === id)?.label ?? "(réponse retirée)";
  if (q.type === "qcm") return (Array.isArray(a.value) ? a.value : [String(a.value)]).map(label).join(", ");
  if (q.type === "rating") return `${a.value}/5`;
  if (q.type === "yes_no") return `${a.value === "yes" ? "Oui" : "Non"}${a.detail ? ` : ${a.detail}` : ""}`;
  return String(a.value);
}

function downloadCsv(results: ImpactResults) {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const head = ["Date", "Prénom", "Nom", ...results.questions.map((q) => q.question)];
  const rows = [...results.responses].reverse().map((r) => [
    new Date(r.createdAt).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }), r.firstName, r.lastName,
    ...results.questions.map((q) => answerText(q, r.answers.find((a) => a.questionId === q.id))),
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `evaluation-impact-${results.client.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Barre horizontale : libellé, barre, effectif et pourcentage écrits.
function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const th = useTh();
  const p = pct(count, total);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-baseline" title={`${label} : ${count} réponse${count > 1 ? "s" : ""} (${p} %)`}>
      <span className="text-sm truncate" style={{ color: th.fg2 }}>{label}</span>
      <span className="text-xs font-bold tabular-nums" style={{ color: th.fg }}>{p} %<span className="font-semibold" style={{ color: th.fg3 }}> · {count}</span></span>
      <div className="col-span-2 h-2.5 rounded-full overflow-hidden" style={{ background: th.navA }}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${p}%`, background: BAR, minWidth: count ? 6 : 0 }} />
      </div>
    </div>
  );
}

function Quotes({ items }: { items: { name: string; text: string }[] }) {
  const th = useTh();
  if (!items.length) return null;
  return (
    <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
      {items.map((x, i) => (
        <li key={i} className="text-sm rounded-[8px] px-3.5 py-2.5 whitespace-pre-line" style={{ background: th.navA, color: th.fg }}>
          “{x.text}”<span className="block text-[11px] font-semibold mt-1" style={{ color: th.fg3 }}>{x.name}</span>
        </li>
      ))}
    </ul>
  );
}

function Stars({ value }: { value: number }) {
  const th = useTh();
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - n + 1));
        return (
          <span key={n} className="relative w-5 h-5">
            <Star className="absolute inset-0 w-5 h-5" style={{ color: th.fg3, opacity: 0.35 }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}><Star className="w-5 h-5" style={{ color: STAR, fill: STAR }} /></span>
          </span>
        );
      })}
    </span>
  );
}

function QuestionResult({ q, index, responses }: { q: ImpactQuestion; index: number; responses: ImpactResponse[] }) {
  const th = useTh();
  const rows = responses.map((r) => ({ name: fullName(r), a: r.answers.find((x) => x.questionId === q.id) })).filter((x) => answered(x.a)) as { name: string; a: ImpactAnswer }[];
  const n = rows.length;

  let body;
  if (!n) body = <p className="text-sm" style={{ color: th.fg3 }}>Pas encore de réponse.</p>;
  else if (q.type === "rating") {
    const values = rows.map((x) => Number(x.a.value));
    const avg = values.reduce((s, v) => s + v, 0) / n;
    body = (
      <div className="space-y-4">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-black tabular-nums leading-none" style={{ color: th.fg }}>{avg.toFixed(1).replace(".", ",")}</span>
          <span className="text-sm font-semibold pb-0.5" style={{ color: th.fg3 }}>/ 5</span>
          <span className="pb-1 ml-1"><Stars value={avg} /></span>
        </div>
        <div className="space-y-2.5">{[5, 4, 3, 2, 1].map((v) => <Bar key={v} label={`${v} / 5`} count={values.filter((x) => x === v).length} total={n} />)}</div>
      </div>
    );
  } else if (q.type === "qcm") {
    const picks = rows.map((x) => (Array.isArray(x.a.value) ? x.a.value : [String(x.a.value)]));
    body = (
      <div className="space-y-2.5">
        {q.options.map((o) => <Bar key={o.id} label={o.label} count={picks.filter((ids) => ids.includes(o.id)).length} total={n} />)}
        {q.allowMultiple && <p className="text-[11px]" style={{ color: th.fg3 }}>Plusieurs réponses possibles : % des répondants.</p>}
      </div>
    );
  } else if (q.type === "yes_no") {
    const yes = rows.filter((x) => x.a.value === "yes").length;
    body = (
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between text-sm font-bold mb-1.5">
            <span style={{ color: th.fg }}>Oui {pct(yes, n)} %</span>
            <span style={{ color: th.fg2 }}>Non {pct(n - yes, n)} %</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-[2px]" style={{ background: th.card }} title={`Oui : ${yes} · Non : ${n - yes}`}>
            {yes > 0 && <div style={{ width: `${pct(yes, n)}%`, background: BAR }} />}
            {n - yes > 0 && <div style={{ flex: 1, background: th.navA }} />}
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: th.fg3 }}>{yes} oui · {n - yes} non</p>
        </div>
        <Quotes items={rows.filter((x) => x.a.detail).map((x) => ({ name: x.name, text: x.a.detail! }))} />
      </div>
    );
  } else {
    body = <Quotes items={rows.map((x) => ({ name: x.name, text: String(x.a.value) }))} />;
  }

  return (
    <section className={`fade-up rounded-[12px] p-5 sm:p-6 space-y-4 ${q.type === "text" ? "lg:col-span-2" : ""}`} style={{ background: th.card, border: `1px solid ${th.sep}` }}>
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black tabular-nums" style={{ background: th.ink, color: th.onInk }}>{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black leading-snug" style={{ color: th.fg }}>{q.question}</h3>
          <p className="text-[11px] mt-0.5" style={{ color: th.fg3 }}>{n} réponse{n > 1 ? "s" : ""}</p>
        </div>
        {q.type === "text" && <MessageSquareQuote className="w-4 h-4 shrink-0" style={{ color: th.fg3 }} />}
      </div>
      {body}
    </section>
  );
}

export function ImpactResultsPage() {
  const th = useTh();
  const { token = "" } = useParams();
  const [results, setResults] = useState<ImpactResults | null | undefined>(undefined);

  useEffect(() => {
    getImpactResults(token).then(setResults).catch((err) => { console.error(err); setResults(null); });
  }, [token]);

  const kpis = useMemo(() => {
    if (!results) return null;
    const n = results.responses.length;
    const ratings = results.questions.filter((q) => q.type === "rating").flatMap((q) =>
      results.responses.map((r) => r.answers.find((a) => a.questionId === q.id)).filter(answered).map((a) => Number(a.value)));
    const avg = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : null;
    const firstYesNo = results.questions.find((q) => q.type === "yes_no");
    const yesNoAnswers = firstYesNo ? results.responses.map((r) => r.answers.find((a) => a.questionId === firstYesNo.id)).filter(answered) : [];
    return {
      n, avg,
      participation: results.stagiaires ? Math.min(100, pct(n, results.stagiaires)) : null,
      yes: yesNoAnswers.length ? pct(yesNoAnswers.filter((a) => a.value === "yes").length, yesNoAnswers.length) : null,
      yesLabel: firstYesNo?.question ?? "",
      last: results.responses[0]?.createdAt ?? null,
    };
  }, [results]);

  if (results === undefined) return <PublicShell><p className="text-sm" style={{ color: th.fg3 }}>Chargement des résultats…</p></PublicShell>;
  if (!results || !kpis) return <PublicShell><Notice Icon={SearchX} title="Lien introuvable" text="Ce tableau de bord n’existe pas ou a été supprimé. Vérifiez l’adresse reçue, ou contactez contact@les-formateurs-ia.fr." /></PublicShell>;

  const tiles: { label: string; value: string; sub: string }[] = [
    { label: "Réponses", value: String(kpis.n), sub: results.stagiaires ? `sur ${results.stagiaires} participant${results.stagiaires > 1 ? "s" : ""}` : "reçues" },
    ...(kpis.participation !== null ? [{ label: "Taux de réponse", value: `${kpis.participation} %`, sub: "des participants" }] : []),
    ...(kpis.avg !== null ? [{ label: "Note moyenne", value: `${kpis.avg.toFixed(1).replace(".", ",")} / 5`, sub: "toutes questions notées" }] : []),
    ...(kpis.yes !== null ? [{ label: "Mise en pratique", value: `${kpis.yes} %`, sub: `de « oui » : ${kpis.yesLabel.length > 48 ? `${kpis.yesLabel.slice(0, 46)}…` : kpis.yesLabel}` }] : []),
  ];

  return (
    <PublicShell right={`Résultats · ${results.client}`}>
      <SurveyHero eyebrow={`Tableau de bord · ${results.client}`} title={results.title} survey={results}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-[10px] px-4 py-3 bg-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t.label}</p>
              <p className="text-2xl sm:text-3xl font-extrabold tabular-nums mt-1">{t.value}</p>
              <p className="text-[11px] text-white/60 mt-0.5">{t.sub}</p>
            </div>
          ))}
        </div>
      </SurveyHero>

      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm flex-1" style={{ color: th.fg2 }}>
          {kpis.n ? <>Mis à jour en direct · dernière réponse le <strong style={{ color: th.fg }}>{dateFr(kpis.last!)}</strong>{!results.isOpen && " · questionnaire clos"}</> : "Aucune réponse pour l’instant : les résultats s’afficheront ici au fil des réponses."}
        </p>
        {kpis.n > 0 && (
          <button type="button" onClick={() => downloadCsv(results)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-[2px] hover:opacity-70"
            style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
            <Download className="w-3.5 h-3.5" />Exporter les réponses
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {results.questions.map((q, i) => <QuestionResult key={q.id} q={q} index={i} responses={results.responses} />)}
      </div>

      {kpis.n > 0 && (
        <section className="rounded-[12px] p-5 sm:p-6" style={{ background: th.card, border: `1px solid ${th.sep}` }}>
          <h3 className="text-base font-black mb-3" style={{ color: th.fg }}>Participants ayant répondu</h3>
          <div className="flex flex-wrap gap-2">
            {results.responses.map((r) => (
              <span key={r.id} className="text-xs rounded-full px-3 py-1.5" style={{ background: th.navA, color: th.fg }} title={`Réponse du ${dateFr(r.createdAt)}`}>
                {fullName(r)}
              </span>
            ))}
          </div>
        </section>
      )}
    </PublicShell>
  );
}
