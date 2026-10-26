// Document imprimable d'une mission remplie : c'est ce HTML qui est
// enregistré dans mission_submissions.html_content et transformé en PDF pour
// le formateur (cf. generateMissionPdf). Même rendu que l'impression de
// l'ancienne page HTML des missions : cas, textes de travail, questions et
// réponses, grille de notation — sans les encadrés de consignes ni de
// vocabulaire, réservés à l'écran.
import { Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MissionAnswers, MissionBlock, MissionDefinition, MissionField, MissionAnswer } from "@/app/data/missions/types";
import { MISSION_ANSWERS_SCRIPT_ID, emptyAnswer } from "@/app/lib/missionAnswers";

const EMPTY = "(réponse non renseignée)";

function PrintBlock({ block }: { block: MissionBlock }) {
  if (block.variant !== "case" && block.variant !== "prompt") return null;
  return (
    <div className={block.variant === "case" ? "casebox" : "promptbox"}>
      {block.label && <span className="exlab">{block.label}</span>}
      {block.body}
    </div>
  );
}

function PrintAnswer({ field, value }: { field: MissionField; value: MissionAnswer }) {
  if (field.type === "table") {
    const rows = value as string[][];
    return (
      <table className="answers">
        <thead><tr>{field.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody id={field.id}>
          {rows.map((row, r) => (
            <tr key={r}>{field.columns.map((_, c) => <td key={c}><div className="cell">{row[c] ?? ""}</div></td>)}</tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (field.type === "image") {
    return (
      <div className="visualpreview" id={field.id}>
        {value ? <img src={value as string} alt="Visuel importé par l'élève" /> : <span className="empty">Aucun visuel importé.</span>}
      </div>
    );
  }
  const text = (value as string).trim();
  return <div className={text ? "answer" : "answer empty"} data-pdf-field="">{text ? value as string : EMPTY}</div>;
}

function MissionPrintDocument({ mission, answers, studentName }: { mission: MissionDefinition; answers: MissionAnswers; studentName: string }) {
  const json = JSON.stringify(answers).replace(/</g, "\\u003c");
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <title>{mission.title}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap" />
        <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
        <script type="application/json" id={MISSION_ANSWERS_SCRIPT_ID} dangerouslySetInnerHTML={{ __html: json }} />
      </head>
      <body>
        <div className="wrap">
          <header className="top">
            <h1>{mission.title}</h1>
            <div className="sub">{mission.intro}</div>
            <p className="meta">{studentName} · {date}</p>
          </header>
          {mission.exercises.map((e, ex) => (
            <section className="ex-block" key={ex}>
              <h2><span className="num">{e.eyebrow}</span>{e.title}</h2>
              {e.context.map((b, i) => <PrintBlock key={i} block={b} />)}
              {e.questions.map((q, qi) => (
                <Fragment key={q.field.id}>
                  {q.part && q.part !== e.questions[qi - 1]?.part && <h3>{q.part}</h3>}
                  <div className="qbox">
                    <div className="qtext"><span className="qnum">{q.num}/</span>{q.prompt}</div>
                    <PrintAnswer field={q.field} value={answers[q.field.id] ?? emptyAnswer(q.field)} />
                  </div>
                </Fragment>
              ))}
            </section>
          ))}
          <section className="ex-block grading">
            <h2><span className="num">{mission.grading.eyebrow}</span>{mission.grading.title}</h2>
            {mission.grading.body}
          </section>
          <footer>{mission.footnote}</footer>
        </div>
      </body>
    </html>
  );
}

export function buildMissionDocument(mission: MissionDefinition, answers: MissionAnswers, studentName: string): string {
  return `<!doctype html>\n${renderToStaticMarkup(<MissionPrintDocument mission={mission} answers={answers} studentName={studentName} />)}`;
}

// Charte d'impression des missions d'origine (papier, encre, vert d'accent).
const PRINT_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Funnel Display',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15.5px;line-height:1.65;color:#1b1a17;background:#fff;padding:0 4px 40px}
.wrap{width:100%}
header.top{padding:8px 0 22px;border-bottom:1px solid #bdb9ae}
header.top h1{font-size:30px;line-height:1.2;font-weight:400;letter-spacing:-.01em;margin-bottom:10px}
header.top .sub{font-size:15px;color:#4a4741}
header.top .meta{margin-top:10px;font-size:12.5px;color:#7c786f;letter-spacing:.02em}
h2{font-size:23px;font-weight:400;line-height:1.3;margin:38px 0 6px;padding-bottom:10px;border-bottom:1px solid #bdb9ae;break-after:avoid-page}
h2 .num{display:block;font-size:12px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:#1f4e46;margin-bottom:6px}
h3{font-size:17px;font-weight:500;margin:26px 0 10px;break-after:avoid-page}
p+p{margin-top:10px}
strong{font-weight:600}
em{font-style:italic}
ul,ol{margin:12px 0 12px 20px}
li{margin-bottom:5px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13.5px;table-layout:fixed}
th,td{border:1px solid #bdb9ae;padding:8px 10px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
th{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#4a4741;font-weight:600;background:#efece5}
td.note,th.note{width:70px;text-align:center}
tr.total td{background:#eef3f1}
.grading td:first-child{font-weight:600}
.grading th:first-child{width:22%}
.casebox,.promptbox{border:1px solid #bdb9ae;padding:18px 20px;margin:16px 0;break-inside:avoid-page}
.casebox{color:#4a4741;font-size:15px}
.promptbox p{font-style:italic}
.exlab{display:block;font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:600;color:#1f4e46;margin-bottom:8px}
.qbox{margin:22px 0}
.qnum{float:left;font-weight:600;color:#1f4e46;margin-right:6px}
.qtext{break-after:avoid-page}
.answer{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #d6d2c8;border-radius:3px;padding:10px 12px;margin-top:8px;font-size:13.5px;line-height:1.5;min-height:1.4em}
.answer.empty,.visualpreview .empty{font-style:italic;color:#6b675f}
table.answers .cell{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.5;min-height:1.4em}
tr{break-inside:avoid-page}
.visualpreview{margin-top:10px;border:1px solid #d6d2c8;padding:12px;text-align:center}
.visualpreview img{max-width:100%;max-height:520px}
footer{margin-top:30px;padding-top:18px;border-top:1px solid #bdb9ae;font-size:12.5px;color:#7c786f}
`;
