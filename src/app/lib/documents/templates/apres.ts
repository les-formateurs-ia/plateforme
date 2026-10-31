import type { DocumentContext, NatureAction, Stagiaire } from "../types";
import type { DocumentPage } from "../render";
import { checkbox, esc, faitA, heures, list, NATURE_LABELS, periodeFr, signatures, todo } from "../render";

// Documents remis à l'issue de la formation, un par stagiaire.

function nomStagiaire(st: Stagiaire): string {
  return `${esc(st.civilite)} ${esc(st.prenom)} ${esc(st.nom)}`;
}

function signatureOrganisme(ctx: DocumentContext): string {
  return signatures([{
    role: "organisme",
    titre: "Cachet et signature du responsable de l'organisme",
    nom: `${esc(ctx.organisme.representant.nom)}, ${esc(ctx.organisme.representant.qualite)}`,
  }]);
}

function heuresRealisees(ctx: DocumentContext, st: Stagiaire): string {
  return st.heuresRealisees !== null ? heures(st.heuresRealisees) : todo("heures réalisées");
}

export function attestationAssiduite(ctx: DocumentContext): DocumentPage[] {
  const f = ctx.formation;
  return ctx.stagiaires.map((st) => {
    const taux = st.heuresRealisees !== null ? `${Math.round((st.heuresRealisees / f.dureeHeures) * 100)} %` : todo("taux d'assiduité");
    return {
      titre: "Attestation d'assiduité",
      body: `
      <p>Je soussigné(e) ${esc(ctx.organisme.representant.nom)}, ${esc(ctx.organisme.representant.qualite)} de ${esc(ctx.organisme.nomCommercial)}, atteste que :</p>
      <p class="box"><strong>${nomStagiaire(st)}</strong>${ctx.client.type === "entreprise" ? `, salarié(e) de ${esc(ctx.client.nom)}` : ""}</p>
      <p>a suivi la formation « ${esc(f.intitule)} », ${periodeFr(ctx.session.dateDebut, ctx.session.dateFin)}.</p>
      <table class="kv">
        <tr><td>Durée prévue</td><td>${heures(f.dureeHeures)}</td></tr>
        <tr><td>Durée réalisée</td><td><strong>${heuresRealisees(ctx, st)}</strong></td></tr>
        <tr><td>Taux d'assiduité</td><td>${taux}</td></tr>
      </table>
      <p class="small muted">Établie d'après les feuilles d'émargement et, pour les parties à distance, les relevés de connexion de la plateforme.</p>
      ${faitA(ctx, ctx.session.dateFin)}
      ${signatureOrganisme(ctx)}`,
    };
  });
}

// Reprend le modèle de certificat de réalisation du ministère du Travail,
// exigé par les OPCO et la Caisse des dépôts.
export function certificatRealisation(ctx: DocumentContext): DocumentPage[] {
  const f = ctx.formation;
  const natures: NatureAction[] = ["formation", "bilan", "vae", "apprentissage"];
  return ctx.stagiaires.map((st) => ({
    titre: "Certificat de réalisation",
    body: `
    <p>Je soussigné(e) <strong>${esc(ctx.organisme.representant.nom)}</strong>, représentant légal du dispensateur de l'action concourant au développement des compétences <strong>${esc(ctx.organisme.nomCommercial)}</strong> (${esc(ctx.organisme.raisonSociale)}, déclaration d'activité n° ${esc(ctx.organisme.nda)}), atteste que :</p>
    <p class="box"><strong>${nomStagiaire(st)}</strong>${ctx.client.type === "entreprise" ? `, salarié(e) de l'entreprise <strong>${esc(ctx.client.nom)}</strong>` : ""}</p>
    <p>a suivi l'action <strong>${esc(f.intitule)}</strong></p>
    <p>Nature de l'action concourant au développement des compétences :</p>
    <p>${natures.map((n) => checkbox(f.nature === n, NATURE_LABELS[n])).join("<br>")}</p>
    <p>qui s'est déroulée ${periodeFr(ctx.session.dateDebut, ctx.session.dateFin)}, pour une durée de <strong>${heuresRealisees(ctx, st)}</strong>.</p>
    <p class="small">Sans préjudice des délais imposés par les règles fiscales, comptables ou commerciales, je m'engage à conserver l'ensemble des pièces justificatives qui ont permis d'établir le présent certificat pendant une durée de 3 ans à compter de la fin de l'année du dernier paiement. En cas de cofinancement des fonds européens, la durée de conservation est étendue conformément aux obligations conventionnelles spécifiques.</p>
    ${faitA(ctx, ctx.session.dateFin)}
    ${signatureOrganisme(ctx)}`,
  }));
}

export function attestationFinFormation(ctx: DocumentContext): DocumentPage[] {
  const f = ctx.formation;
  return ctx.stagiaires.map((st) => ({
    titre: "Attestation de fin de formation",
    sousTitre: "Article L6353-1 du Code du travail",
    body: `
    <p>${esc(ctx.organisme.nomCommercial)} atteste que <strong>${nomStagiaire(st)}</strong> a suivi la formation suivante :</p>
    <table class="kv">
      <tr><td>Intitulé</td><td><strong>${esc(f.intitule)}</strong></td></tr>
      <tr><td>Nature de l'action</td><td>${NATURE_LABELS[f.nature]} (art. L6313-1 du Code du travail)</td></tr>
      <tr><td>Dates</td><td>${periodeFr(ctx.session.dateDebut, ctx.session.dateFin)}</td></tr>
      <tr><td>Durée suivie</td><td>${heuresRealisees(ctx, st)} sur ${heures(f.dureeHeures)} prévues</td></tr>
    </table>
    <h2>Objectifs de la formation</h2>${list(f.objectifs)}
    <h2>Résultats de l'évaluation des acquis</h2>
    <p>${st.resultatEvaluation ? esc(st.resultatEvaluation) : todo("résultat de l'évaluation des acquis (acquis, en cours d'acquisition, non acquis, score…)")}</p>
    ${f.certification ? `<p class="small muted">La certification « ${esc(f.certification.intitule)} » (${esc(f.certification.code)}) est délivrée par ${esc(f.certification.certificateur)} selon ses propres modalités ; la présente attestation ne vaut pas certification.</p>` : ""}
    ${faitA(ctx, ctx.session.dateFin)}
    ${signatureOrganisme(ctx)}`,
  }));
}
