import type { Creneau, DocumentContext } from "../types";
import type { DocumentPage } from "../render";
import { creneauDuree, dateLongueFr, demiJournee, esc, heureFr, heures, MODALITE_LABELS, periodeFr, todo } from "../render";

// Justificatifs de réalisation : feuille d'émargement par demi-journée pour
// les séances avec formateur, relevé de connexions pour l'e-learning.

function entete(ctx: DocumentContext): string {
  const f = ctx.formation;
  const s = ctx.session;
  return `
  <table class="kv">
    <tr><td>Formation</td><td><strong>${esc(f.intitule)}</strong></td></tr>
    <tr><td>Client</td><td>${esc(ctx.client.nom)}</td></tr>
    <tr><td>Session</td><td>${esc(s.reference)} · ${periodeFr(s.dateDebut, s.dateFin)}</td></tr>
    <tr><td>Modalité et lieu</td><td>${MODALITE_LABELS[f.modalite]}${f.modalite === "foad" ? "" : ` · ${esc(f.modalite === "distanciel_synchrone" ? "Classe virtuelle" : s.lieu)}`}</td></tr>
  </table>`;
}

function parJour(creneaux: Creneau[]): [string, Creneau[]][] {
  const jours = new Map<string, Creneau[]>();
  for (const c of creneaux) jours.set(c.date, [...(jours.get(c.date) ?? []), c]);
  return [...jours.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function emargement(ctx: DocumentContext): DocumentPage[] {
  const jours = parJour(ctx.session.creneaux);
  if (!jours.length) {
    return [{ titre: "Feuille d'émargement", body: `${entete(ctx)}<p>${todo("séances (dates et horaires)")}</p>` }];
  }
  const intervenant = ctx.session.intervenants.map((i) => esc(i.nom)).join(", ") || todo("intervenant");
  return jours.map(([date, creneaux]) => {
    const cols = creneaux.map((c) => `<th>${demiJournee(c)}<br><span class="muted small">${heureFr(c.debut)} à ${heureFr(c.fin)} (${heures(creneauDuree(c))})</span></th>`).join("");
    const rows = ctx.stagiaires.map((st) => `
      <tr><td>${esc(st.prenom)} ${esc(st.nom)}</td>${creneaux.map(() => `<td class="sig"></td>`).join("")}</tr>`).join("");
    return {
      titre: "Feuille d'émargement",
      sousTitre: dateLongueFr(date),
      body: `
      ${entete(ctx)}
      <p class="small muted">Chaque stagiaire signe au début de chaque demi-journée. Un stagiaire absent est indiqué « Absent » par l'intervenant.</p>
      <table class="grid">
        <thead><tr><th>Stagiaire</th>${cols}</tr></thead>
        <tbody>${rows}
          <tr class="strong"><td>Intervenant : ${intervenant}</td>${creneaux.map(() => `<td class="sig"></td>`).join("")}</tr>
        </tbody>
      </table>
      ${ctx.formation.modalite === "distanciel_synchrone" || ctx.formation.modalite === "hybride" ? `<p class="small muted">Classe virtuelle : la signature électronique est horodatée et associée à l'adresse IP et à l'identité du stagiaire connecté.</p>` : ""}`,
    };
  });
}

export function releveConnexions(ctx: DocumentContext): DocumentPage[] {
  const f = ctx.formation;
  return ctx.stagiaires.map((st) => {
    const rows = st.connexions.map((c) => `<tr><td>${esc(c.date)}</td><td>${esc(c.activite)}</td><td class="num">${esc(c.duree)}</td></tr>`).join("");
    return {
      titre: "Relevé de connexions et d'activités",
      sousTitre: `${esc(st.civilite)} ${esc(st.prenom)} ${esc(st.nom)} · Formation à distance (art. D6313-3-1 du Code du travail)`,
      body: `
      ${entete(ctx)}
      <h2>Activités réalisées sur la plateforme</h2>
      ${rows ? `<table class="grid"><thead><tr><th>Date</th><th>Activité</th><th class="num">Durée</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${todo("connexions extraites de la plateforme")}</p>`}
      <table class="kv">
        <tr><td>Temps réalisé</td><td><strong>${st.heuresRealisees !== null ? heures(st.heuresRealisees) : todo("total des heures réalisées")}</strong></td></tr>
        <tr><td>Durée prévue</td><td>${heures(f.dureeHeures)}</td></tr>
        <tr><td>Résultat des évaluations</td><td>${st.resultatEvaluation ? esc(st.resultatEvaluation) : todo("résultat des évaluations")}</td></tr>
      </table>
      <p class="small muted">Relevé établi à partir des journaux horodatés de la plateforme e-learning (connexions, leçons consultées, exercices et missions remis). Les données brutes sont conservées et tenues à disposition des financeurs et des auditeurs.</p>
      ${f.modalite === "hybride" ? `<p class="small muted">Les séances avec formateur font l'objet d'une feuille d'émargement distincte.</p>` : ""}`,
    };
  });
}
