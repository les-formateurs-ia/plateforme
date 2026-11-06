import type { DocumentContext } from "../types";
import type { DocumentPage } from "../render";
import {
  aDistance, dateFr, dateLongueFr, esc, eur, faitA, FINANCEMENT_LABELS, heureFr, heures, identiteClient,
  identiteOrganisme, list, MODALITE_LABELS, NATURE_LABELS, periodeFr, signatures, tableTarifs, todo, totalHt, val,
} from "../render";

// Documents remis avant la formation : information (programme, CGV,
// règlement intérieur), engagement (devis, convention ou contrat) et
// convocation.

function lieuOuLien(ctx: DocumentContext): string {
  const s = ctx.session;
  if (ctx.formation.modalite === "foad") return "Plateforme e-learning Les Formateurs IA (accès personnel en ligne)";
  if (ctx.formation.modalite === "distanciel_synchrone") return s.lienConnexion ? `Classe virtuelle : ${esc(s.lienConnexion)}` : "Classe virtuelle (lien communiqué dans la convocation)";
  return esc(s.lieu);
}

function intervenants(ctx: DocumentContext): string {
  const l = ctx.session.intervenants;
  return l.length ? list(l.map((i) => `${i.nom}, ${i.qualite}`)) : `<p>${todo("intervenant(s) et qualifications")}</p>`;
}

function caracteristiques(ctx: DocumentContext): string {
  const f = ctx.formation;
  const s = ctx.session;
  return `
  <table class="kv">
    <tr><td>Intitulé</td><td><strong>${esc(f.intitule)}</strong></td></tr>
    <tr><td>Nature de l'action (art. L6313-1 du Code du travail)</td><td>${NATURE_LABELS[f.nature]}</td></tr>
    <tr><td>Durée</td><td>${heures(f.dureeHeures)} (${String(f.dureeJours).replace(".", ",")} jour${f.dureeJours > 1 ? "s" : ""})</td></tr>
    <tr><td>Dates</td><td>${periodeFr(s.dateDebut, s.dateFin)}</td></tr>
    <tr><td>Modalité</td><td>${MODALITE_LABELS[f.modalite]}</td></tr>
    <tr><td>Lieu</td><td>${lieuOuLien(ctx)}</td></tr>
    <tr><td>Effectif</td><td>${esc(s.effectif)} stagiaire${s.effectif > 1 ? "s" : ""}</td></tr>
    ${f.certification ? `<tr><td>Certification visée</td><td>${esc(f.certification.intitule)} (${esc(f.certification.code)})</td></tr>` : ""}
  </table>`;
}

function blocFoad(ctx: DocumentContext): string {
  const f = ctx.formation;
  if (!aDistance(f.modalite)) return "";
  const rows = f.activitesDistance.map((a) => `<tr><td>${esc(a.activite)}</td><td class="num">${esc(a.dureeEstimee)}</td></tr>`).join("");
  return `
  <h2>Formation à distance (art. D6313-3-1 du Code du travail)</h2>
  <p><strong>Assistance technique et pédagogique :</strong> ${val(f.assistance, "modalités d'assistance (qui, comment, délai de réponse)")}</p>
  <p><strong>Activités pédagogiques à distance et durée moyenne estimée :</strong></p>
  ${rows ? `<table class="grid"><thead><tr><th>Activité</th><th class="num">Durée estimée</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${todo("activités à distance et durées estimées")}</p>`}
  <p><strong>Évaluations :</strong> les évaluations qui jalonnent et concluent la formation sont décrites dans les modalités d'évaluation ci-dessus.</p>
  <p><strong>Justification de la réalisation :</strong> relevés de connexion à la plateforme, travaux réalisés et résultats des évaluations.</p>`;
}

export function devis(ctx: DocumentContext): DocumentPage[] {
  return [{
    titre: "Devis de formation professionnelle",
    sousTitre: `N° ${esc(ctx.numero)} · Établi le ${dateFr(ctx.dateDocument)}`,
    body: `
    <div class="box">
      <p><strong>Organisme de formation :</strong> ${identiteOrganisme(ctx.organisme)}.</p>
      <p><strong>Client :</strong> ${identiteClient(ctx)}.</p>
    </div>
    <h2>1. Objet, nature et durée de la formation</h2>
    ${caracteristiques(ctx)}
    <h2>2. Programme et intervenants</h2>
    <p>Le programme détaillé (objectifs, contenu, méthodes, modalités d'évaluation, accessibilité) est joint en annexe.</p>
    ${intervenants(ctx)}
    <h2>3. Prix de la formation</h2>
    ${tableTarifs(ctx.lignes)}
    <p class="small muted">Mode de financement envisagé : ${FINANCEMENT_LABELS[ctx.financement]}${ctx.financeur ? ` (${esc(ctx.financeur)})` : ""}.</p>
    <h2>4. Conditions</h2>
    <p>Ce devis est valable ${esc(ctx.validiteDevisJours)} jours à compter de sa date d'émission. Son acceptation vaut commande et entraîne l'établissement ${ctx.financement === "particulier" ? "d'un contrat de formation (art. L6353-3 du Code du travail)" : "d'une convention de formation"}. Les conditions générales de vente jointes s'appliquent.</p>
    <p>${esc(ctx.conditionsPaiement)}</p>
    ${signatures([
      { role: "organisme", titre: "Pour l'organisme de formation", nom: `${esc(ctx.organisme.representant.nom)}, ${esc(ctx.organisme.representant.qualite)}` },
      { role: "client", titre: "Bon pour accord, le client", nom: esc(ctx.client.nom), mention: "Date, nom du signataire, cachet et signature précédés de « Bon pour accord »" },
    ])}`,
  }];
}

export function programme(ctx: DocumentContext): DocumentPage[] {
  const f = ctx.formation;
  const o = ctx.organisme;
  const contenu = f.contenu.map((m) => `
    <h3>${esc(m.titre)}${m.duree ? ` <span class="muted">(${esc(m.duree)})</span>` : ""}</h3>
    ${m.objectif ? `<p class="muted">${esc(m.objectif)}</p>` : ""}
    ${list(m.points)}`).join("");
  const indicateurs = f.indicateurs.length
    ? `<table class="grid"><tbody>${f.indicateurs.map((i) => `<tr><td>${esc(i.libelle)}</td><td class="num">${esc(i.valeur)}</td></tr>`).join("")}</tbody></table>`
    : `<p>${todo("indicateurs de résultats (taux de satisfaction, de réussite…)")}</p>`;
  const c = f.certification;
  return [{
    titre: f.intitule,
    sousTitre: esc(f.accroche),
    body: `
    <table class="kv">
      <tr><td>Durée</td><td>${heures(f.dureeHeures)} (${String(f.dureeJours).replace(".", ",")} jour${f.dureeJours > 1 ? "s" : ""})</td></tr>
      <tr><td>Modalité</td><td>${MODALITE_LABELS[f.modalite]}</td></tr>
      <tr><td>Nature de l'action</td><td>${NATURE_LABELS[f.nature]} (art. L6313-1 du Code du travail)</td></tr>
      <tr><td>Tarif</td><td>${esc(f.tarif)}</td></tr>
    </table>
    <h2>Public visé</h2>${list(f.publicVise)}
    <h2>Prérequis</h2>${list(f.prerequis)}
    <h2>Objectifs pédagogiques</h2>
    <p>À l'issue de la formation, le stagiaire sera capable de :</p>${list(f.objectifs)}
    <h2>Contenu de la formation</h2>${contenu}
    <h2>Méthodes et moyens pédagogiques</h2>${list(f.methodes)}
    <h3>Moyens techniques</h3>${list(f.moyensTechniques)}
    <h3>Équipe pédagogique</h3>${intervenants(ctx)}
    <h2>Modalités d'évaluation et de suivi</h2>${list(f.modalitesEvaluation)}
    <p>Le suivi de l'exécution est assuré par ${aDistance(f.modalite) ? "les relevés de connexion et d'activité sur la plateforme" : "des feuilles d'émargement signées par demi-journée"}. Une attestation de fin de formation et un certificat de réalisation sont remis à l'issue.</p>
    ${blocFoad(ctx)}
    ${c ? `
    <h2>Certification</h2>
    <p><strong>${esc(c.intitule)}</strong>, enregistrée au Répertoire spécifique de France Compétences sous le n° ${esc(c.code)}${c.dateEnregistrement ? ` le ${dateFr(c.dateEnregistrement)}` : ""}, certificateur : ${esc(c.certificateur)}.</p>
    <p><strong>Modalités d'obtention :</strong> ${esc(c.modalites)}</p>
    <p><strong>Blocs de compétences :</strong> ${val(c.blocs, "validation par blocs de compétences")}</p>
    <p><strong>Équivalences et passerelles :</strong> ${val(c.equivalences, "équivalences et passerelles")}</p>
    <p><strong>Suites de parcours et débouchés :</strong> ${val(c.suitesDebouches, "suites de parcours et débouchés")}</p>` : ""}
    <h2>Modalités et délais d'accès</h2><p>${esc(f.delaiAcces)}</p>
    <h2>Accessibilité aux personnes en situation de handicap</h2>
    <p>${esc(f.accessibilite)}</p>
    <p>Référent handicap : ${esc(o.referentHandicap.nom)}, ${esc(o.referentHandicap.email)}, ${esc(o.referentHandicap.telephone)}.</p>
    <h2>Indicateurs de résultats</h2>${indicateurs}
    <h2>Qualité</h2>
    <p>${esc(o.nomCommercial)} est certifié Qualiopi${o.qualiopi.certificateur ? ` par ${esc(o.qualiopi.certificateur)}` : ""}. La certification qualité a été délivrée au titre de la catégorie d'action suivante : ${esc(o.qualiopi.categories.toLowerCase())}.</p>
    <h2>Contact</h2>
    <p>Référent pédagogique : ${esc(o.referentPedagogique.nom)}, ${esc(o.referentPedagogique.email)}, ${esc(o.referentPedagogique.telephone)}.</p>
    <p class="small muted">Programme mis à jour le ${dateFr(ctx.dateDocument)}.</p>`,
  }];
}

function articlesCommuns(ctx: DocumentContext, n: number): string {
  return `
    <h2>Article ${n} : Données personnelles</h2>
    <p>Les données des stagiaires sont traitées par ${esc(ctx.organisme.nomCommercial)} pour l'organisation, le suivi et la justification de la formation (exécution du contrat et obligations légales). Elles sont conservées pendant la durée nécessaire à ces finalités et aux contrôles (au moins 3 ans après la fin de l'année du dernier paiement). Chaque personne dispose d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition, en écrivant à ${esc(ctx.organisme.email)}, et peut saisir la CNIL.</p>
    <h2>Article ${n + 1} : Différends</h2>
    <p>En cas de différend, les parties recherchent d'abord une solution amiable. À défaut, ${ctx.client.type === "particulier" ? "le stagiaire peut recourir gratuitement au médiateur de la consommation mentionné ci-dessous, puis saisir la juridiction compétente." : "le litige est porté devant le tribunal de commerce de Lyon."}</p>`;
}

export function convention(ctx: DocumentContext): DocumentPage[] {
  const s = ctx.session;
  const stagiaires = ctx.stagiaires.map((st) => `<tr><td>${esc(st.civilite)} ${esc(st.prenom)} ${esc(st.nom)}</td><td>${st.fonction ? esc(st.fonction) : ""}</td><td>${esc(st.email)}</td></tr>`).join("");
  const opco = ctx.financement === "opco";
  return [{
    titre: "Convention de formation professionnelle",
    sousTitre: `N° ${esc(ctx.numero)} · Articles L6353-1, L6353-2 et D6353-1 du Code du travail`,
    body: `
    <p><strong>Entre les soussignés :</strong></p>
    <p>${identiteOrganisme(ctx.organisme)}, ci-après « l'organisme de formation »,</p>
    <p>et ${identiteClient(ctx)}, ci-après « le client ».</p>
    <h2>Article 1 : Objet</h2>
    <p>L'organisme de formation s'engage à organiser l'action ci-dessous au bénéfice du personnel du client, dans les conditions de la présente convention et du programme annexé.</p>
    <h2>Article 2 : Nature et caractéristiques de l'action</h2>
    ${caracteristiques(ctx)}
    <p>Objectifs, contenu et modalités de déroulement : voir le programme annexé, qui fait partie intégrante de la convention.</p>
    <h3>Stagiaires</h3>
    <table class="grid"><thead><tr><th>Nom</th><th>Fonction</th><th>E-mail</th></tr></thead><tbody>${stagiaires}</tbody></table>
    <h3>Horaires</h3>
    ${list(s.creneaux.map((c) => `${dateLongueFr(c.date)} : ${heureFr(c.debut)} à ${heureFr(c.fin)}`))}
    <h2>Article 3 : Moyens pédagogiques, techniques et d'encadrement</h2>
    ${list(ctx.formation.methodes)}
    ${list(ctx.formation.moyensTechniques)}
    <p>Intervenant(s) :</p>${intervenants(ctx)}
    <h2>Article 4 : Suivi de l'exécution, évaluation et sanction</h2>
    <p>La présence est attestée par ${aDistance(ctx.formation.modalite) ? "les relevés de connexion et d'activité, et par l'émargement des séances avec formateur" : "une feuille d'émargement signée par demi-journée par chaque stagiaire et l'intervenant"}.</p>
    ${list(ctx.formation.modalitesEvaluation)}
    <p>À l'issue de l'action, l'organisme remet à chaque stagiaire une attestation de fin de formation mentionnant les objectifs, la nature, la durée et les résultats de l'évaluation des acquis (art. L6353-1), et transmet au client le certificat de réalisation.</p>
    <h2>Article 5 : Prix</h2>
    ${tableTarifs(ctx.lignes)}
    <p class="small muted">Aucune contribution financière de personnes publiques n'est prévue, sauf mention contraire.</p>
    <h2>Article 6 : Modalités de règlement</h2>
    <p>${esc(ctx.conditionsPaiement)}</p>
    ${opco ? `<p>Le client fait la demande de prise en charge auprès de ${val(ctx.financeur, "nom de l'OPCO")} avant le début de la formation et en communique l'accord à l'organisme. En cas de prise en charge partielle ou de refus, la différence est facturée au client.</p>` : ""}
    <h2>Article 7 : Annulation, absence et dédit</h2>
    <p>Toute annulation par le client est notifiée par écrit. Annulée plus de 10 jours ouvrés avant le début, la formation n'est pas facturée. Annulée entre 10 jours ouvrés et le début de la formation, ou en cas d'absence non justifiée d'un stagiaire, un dédommagement de 50 % du prix est facturé. Ces sommes ne constituent pas le prix d'une action de formation : elles ne peuvent être imputées sur l'obligation de participation au financement de la formation professionnelle ni faire l'objet d'une demande de prise en charge par un OPCO.</p>
    <p>L'organisme peut reporter une session en cas d'empêchement de l'intervenant ou d'effectif insuffisant, en proposant de nouvelles dates sans frais.</p>
    <h2>Article 8 : Inexécution</h2>
    <p>Conformément à l'article L6354-1 du Code du travail, en cas d'inexécution totale ou partielle de l'action du fait de l'organisme, celui-ci rembourse au client les sommes perçues correspondant aux prestations non réalisées.</p>
    ${articlesCommuns(ctx, 9)}
    <p><strong>Annexes :</strong> programme de la formation, conditions générales de vente, règlement intérieur.</p>
    ${faitA(ctx)}
    <p>En deux exemplaires originaux, ou par signature électronique.</p>
    ${signatures([
      { role: "organisme", titre: "Pour l'organisme de formation", nom: `${esc(ctx.organisme.representant.nom)}, ${esc(ctx.organisme.representant.qualite)}` },
      { role: "client", titre: "Pour le client", nom: ctx.client.representant ? `${esc(ctx.client.representant.nom)}, ${esc(ctx.client.representant.qualite)}` : todo("signataire du client"), mention: "Cachet de l'entreprise" },
    ])}`,
  }];
}

export function contratParticulier(ctx: DocumentContext): DocumentPage[] {
  const f = ctx.formation;
  const o = ctx.organisme;
  const prix = totalHt(ctx.lignes);
  return [{
    titre: "Contrat de formation professionnelle",
    sousTitre: `N° ${esc(ctx.numero)} · Articles L6353-3 à L6353-7 du Code du travail`,
    body: `
    <p><strong>Entre les soussignés :</strong></p>
    <p>${identiteOrganisme(o)}, ci-après « l'organisme de formation »,</p>
    <p>et ${identiteClient(ctx)}, ci-après « le stagiaire », qui entreprend cette formation à titre individuel et à ses frais.</p>
    <h2>Article 1 : Objet, nature, durée et effectif</h2>
    ${caracteristiques(ctx)}
    <p>Le programme détaillé est annexé au présent contrat.</p>
    <h2>Article 2 : Niveau de connaissances préalables requis</h2>${list(f.prerequis)}
    <h2>Article 3 : Conditions de déroulement</h2>
    <p>Lieu : ${lieuOuLien(ctx)}.</p>
    ${list(f.methodes)}${list(f.moyensTechniques)}
    <h2>Article 4 : Diplôme, titre ou attestation délivré</h2>
    <p>${f.certification ? `Formation préparant à la certification « ${esc(f.certification.intitule)} » (${esc(f.certification.code)}, certificateur ${esc(f.certification.certificateur)}). ${esc(f.certification.modalites)}` : "Une attestation de fin de formation est délivrée au stagiaire."}</p>
    <h2>Article 5 : Contrôle des connaissances</h2>${list(f.modalitesEvaluation)}
    <h2>Article 6 : Intervenants</h2>${intervenants(ctx)}
    <h2>Article 7 : Délai de rétractation</h2>
    <p>À compter de la date de signature du présent contrat, le stagiaire dispose d'un délai de quatorze jours pour se rétracter, par lettre recommandée avec avis de réception adressée à ${esc(o.nomCommercial)}, ${esc(o.adresse)}, ${esc(o.codePostal)} ${esc(o.ville)} (art. L6353-5). Aucune somme ne peut être exigée avant l'expiration de ce délai.</p>
    <h2>Article 8 : Prix et modalités de paiement</h2>
    ${tableTarifs(ctx.lignes)}
    <p>À l'expiration du délai de rétractation, le stagiaire verse un acompte qui ne peut excéder 30 % du prix, soit au plus ${eur(prix * 0.3)}. Le solde est échelonné au fur et à mesure du déroulement de la formation (art. L6353-6).</p>
    <p>${esc(ctx.conditionsPaiement)}</p>
    <h2>Article 9 : Cessation anticipée ou abandon</h2>
    <p>Si, par suite de force majeure dûment reconnue, le stagiaire est empêché de suivre la formation, il peut rompre le contrat : seules les prestations effectivement dispensées sont dues, au prorata temporis de leur valeur prévue au contrat (art. L6353-7).</p>
    <p>En cas d'abandon pour un autre motif, les prestations effectivement dispensées restent dues au prorata temporis.</p>
    ${articlesCommuns(ctx, 10)}
    <p><strong>Médiateur de la consommation :</strong> ${o.mediateur.nom ? `${esc(o.mediateur.nom)}${o.mediateur.site ? `, ${esc(o.mediateur.site)}` : ""}` : todo("médiateur de la consommation (nom et site)")}.</p>
    <p><strong>Annexes :</strong> programme de la formation, conditions générales de vente, règlement intérieur.</p>
    ${faitA(ctx)}
    ${signatures([
      { role: "organisme", titre: "Pour l'organisme de formation", nom: `${esc(o.representant.nom)}, ${esc(o.representant.qualite)}` },
      { role: "client", titre: "Le stagiaire", nom: esc(ctx.client.nom), mention: "Date et signature précédées de « Lu et approuvé »" },
    ])}`,
  }];
}

export function convocation(ctx: DocumentContext): DocumentPage[] {
  const f = ctx.formation;
  const s = ctx.session;
  const o = ctx.organisme;
  return ctx.stagiaires.map((st) => ({
    titre: "Convocation à la formation",
    sousTitre: `${esc(f.intitule)} · Session ${esc(s.reference)}`,
    body: `
    <p>${esc(st.civilite)} ${esc(st.prenom)} ${esc(st.nom)},</p>
    <p>Nous avons le plaisir de vous confirmer votre inscription à la formation « ${esc(f.intitule)} ». Vous trouverez ci-dessous les informations pratiques.</p>
    <table class="kv">
      <tr><td>Dates</td><td>${periodeFr(s.dateDebut, s.dateFin)}</td></tr>
      <tr><td>Durée</td><td>${heures(f.dureeHeures)}</td></tr>
      <tr><td>Modalité</td><td>${MODALITE_LABELS[f.modalite]}</td></tr>
      <tr><td>Lieu ou accès</td><td>${lieuOuLien(ctx)}</td></tr>
      ${ctx.financement === "cpf" ? `<tr><td>Financement</td><td>${FINANCEMENT_LABELS.cpf}</td></tr>` : ""}
    </table>
    ${s.creneaux.length ? `<h2>Séances</h2>${list(s.creneaux.map((c) => `${dateLongueFr(c.date)} : ${heureFr(c.debut)} à ${heureFr(c.fin)}`))}` : ""}
    ${aDistance(f.modalite) ? `<h2>Accès à la plateforme</h2><p>Vos identifiants personnels vous sont envoyés par e-mail à l'adresse ${esc(st.email)}. Ils sont strictement personnels : votre activité sur la plateforme sert de justificatif de présence.</p>` : ""}
    <h2>À prévoir</h2>${list(f.prerequis)}
    <h2>Votre intervenant</h2>${intervenants(ctx)}
    <h2>Besoin d'un aménagement ?</h2>
    <p>Si vous êtes en situation de handicap ou avez un besoin particulier, contactez notre référent handicap avant le début de la formation : ${esc(o.referentHandicap.nom)}, ${esc(o.referentHandicap.email)}, ${esc(o.referentHandicap.telephone)}.</p>
    <p>Le programme et le règlement intérieur sont joints à cette convocation. Pour toute question : ${esc(o.referentPedagogique.email)} ou ${esc(o.referentPedagogique.telephone)}.</p>
    <p>Nous vous souhaitons une excellente formation.</p>
    <p>${esc(o.representant.nom)}, ${esc(o.nomCommercial)}</p>
    ${faitA(ctx)}`,
  }));
}

export function cgv(ctx: DocumentContext): DocumentPage[] {
  const o = ctx.organisme;
  return [{
    titre: "Conditions générales de vente",
    sousTitre: `Prestations de formation de ${esc(o.nomCommercial)} · Version du ${dateFr(ctx.dateDocument)}`,
    body: `
    <h2>1. Objet et champ d'application</h2>
    <p>Les présentes conditions s'appliquent à toutes les prestations de formation de ${identiteOrganisme(o)}. Toute commande implique leur acceptation sans réserve. Elles complètent la convention ou le contrat de formation, qui prévaut en cas de contradiction.</p>
    <h2>2. Commande</h2>
    <p>Entreprises : la commande est formée par l'acceptation du devis, puis la signature de la convention de formation. Particuliers finançant eux-mêmes leur formation : par la signature du contrat de formation (art. L6353-3). Formations financées par le CPF : par la validation de l'inscription sur la plateforme Mon Compte Formation, dont les conditions générales d'utilisation s'appliquent.</p>
    <h2>3. Prix</h2>
    <p>Les prix sont indiqués en euros hors taxes. Les prestations de formation professionnelle continue sont exonérées de TVA (article 261-4-4° a du CGI). Ils comprennent la formation, les supports et l'accès à la plateforme pendant la durée prévue.</p>
    <h2>4. Paiement</h2>
    <p>Sauf disposition contraire, les factures sont payables à 30 jours à compter de leur date d'émission, par virement. Pour les clients professionnels, tout retard entraîne des pénalités égales à trois fois le taux d'intérêt légal et une indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du Code de commerce). Aucun escompte n'est accordé pour paiement anticipé.</p>
    <p>En cas de prise en charge par un OPCO, le client fait la demande avant le début de la formation. Si l'accord n'est pas reçu au premier jour de la formation, ou en cas de prise en charge partielle, le client règle la différence.</p>
    <h2>5. Annulation et report</h2>
    <p>Entreprises : voir les conditions d'annulation et de dédit de la convention. Particuliers : délai de rétractation de 14 jours, acompte limité à 30 % du prix, et en cas de force majeure seules les prestations effectivement dispensées sont dues (art. L6353-5 à L6353-7). CPF : règles d'annulation des conditions générales de Mon Compte Formation.</p>
    <h2>6. Formation à distance</h2>
    <p>L'accès à la plateforme est personnel et confidentiel. Le stagiaire s'engage à ne pas partager ses identifiants : les relevés de connexion servent de justificatifs de réalisation. L'organisme assure une assistance technique et pédagogique pendant la durée de la formation.</p>
    <h2>7. Propriété intellectuelle</h2>
    <p>Les supports, vidéos, exercices et contenus de la plateforme restent la propriété de l'organisme. Ils sont réservés à l'usage personnel du stagiaire et ne peuvent être reproduits ou diffusés sans autorisation écrite.</p>
    <h2>8. Confidentialité et données personnelles</h2>
    <p>Les parties gardent confidentielles les informations échangées. Les données personnelles sont traitées pour l'exécution de la formation et le respect des obligations légales. Droits d'accès, de rectification, d'effacement, de limitation et d'opposition : ${esc(o.email)}. Réclamation possible auprès de la CNIL.</p>
    <h2>9. Accessibilité</h2>
    <p>Toute personne en situation de handicap peut contacter le référent handicap (${esc(o.referentHandicap.nom)}, ${esc(o.referentHandicap.email)}) pour étudier les adaptations possibles.</p>
    <h2>10. Réclamations</h2>
    <p>Toute réclamation peut être adressée par écrit à ${esc(o.email)}. Elle est enregistrée, fait l'objet d'un accusé de réception sous 5 jours ouvrés et d'une réponse sous 30 jours. Les réclamations sont analysées pour améliorer les prestations.</p>
    <h2>11. Médiation</h2>
    <p>Le stagiaire consommateur peut recourir gratuitement au médiateur de la consommation : ${o.mediateur.nom ? `${esc(o.mediateur.nom)}${o.mediateur.site ? `, ${esc(o.mediateur.site)}` : ""}` : todo("médiateur de la consommation (nom et site)")}.</p>
    <h2>12. Droit applicable</h2>
    <p>Les présentes conditions sont soumises au droit français. À défaut d'accord amiable, les litiges avec un professionnel relèvent du tribunal de commerce de Lyon.</p>`,
  }];
}

export function reglementInterieur(ctx: DocumentContext): DocumentPage[] {
  const o = ctx.organisme;
  return [{
    titre: "Règlement intérieur applicable aux stagiaires",
    sousTitre: `Articles L6352-3 à L6352-5 et R6352-1 à R6352-15 du Code du travail · Version du ${dateFr(ctx.dateDocument)}`,
    body: `
    <h2>Article 1 : Objet et champ d'application</h2>
    <p>Le présent règlement s'applique à tous les stagiaires de ${esc(o.nomCommercial)}, pour la durée de la formation, quels que soient le lieu et la modalité (présentiel, classe virtuelle, e-learning). Il précise les règles d'hygiène et de sécurité, les règles de discipline et les garanties de procédure applicables aux sanctions. Il est remis à chaque stagiaire avant son entrée en formation.</p>
    <h2>Article 2 : Hygiène et sécurité</h2>
    <p>Chaque stagiaire respecte les consignes générales et particulières d'hygiène et de sécurité. Lorsque la formation se déroule dans une entreprise ou un établissement déjà doté d'un règlement intérieur, les mesures d'hygiène et de sécurité applicables sont celles de ce règlement (art. R6352-1).</p>
    <p>Il est interdit d'introduire ou de consommer des boissons alcoolisées ou des substances illicites, et de pénétrer en état d'ivresse ou sous l'emprise de telles substances. Il est interdit de fumer et de vapoter dans les locaux.</p>
    <h2>Article 3 : Consignes d'incendie et accidents</h2>
    <p>Les consignes d'incendie et le plan d'évacuation sont affichés dans les locaux. Tout accident survenu pendant la formation ou le trajet est immédiatement signalé au formateur ou à l'organisme, qui en informe l'employeur ou le financeur pour les déclarations nécessaires.</p>
    <h2>Article 4 : Horaires, assiduité et absences</h2>
    <p>Les stagiaires respectent les horaires communiqués. Toute absence ou tout retard est signalé et justifié auprès de l'organisme, qui en informe l'employeur ou le financeur. Les stagiaires signent la feuille d'émargement par demi-journée. En formation à distance, les connexions et activités réalisées sur la plateforme sont enregistrées et valent justificatif d'assiduité.</p>
    <h2>Article 5 : Comportement et utilisation des moyens</h2>
    <p>Chaque stagiaire adopte une attitude respectueuse envers les autres participants et les intervenants. Le matériel et la documentation confiés sont utilisés conformément à leur objet. Les enregistrements audio ou vidéo des séances sont interdits sans accord. Les identifiants de la plateforme sont strictement personnels : leur partage et toute fraude aux évaluations constituent des fautes.</p>
    <h2>Article 6 : Sanctions</h2>
    <p>Constitue une sanction toute mesure, autre que les observations verbales, prise par le responsable de l'organisme à la suite d'un agissement du stagiaire considéré comme fautif, que cette mesure soit de nature à affecter immédiatement ou non la présence de l'intéressé dans la formation ou à mettre en cause la continuité de celle-ci (art. R6352-3). Selon la gravité des faits : avertissement écrit, blâme, exclusion temporaire, exclusion définitive. Les amendes et autres sanctions pécuniaires sont interdites.</p>
    <h2>Article 7 : Garanties disciplinaires</h2>
    <p>Aucune sanction ne peut être infligée sans que le stagiaire ait été informé au préalable, par écrit, des griefs retenus contre lui (art. R6352-4).</p>
    <p>Lorsqu'une sanction ayant une incidence sur la présence du stagiaire est envisagée, il est convoqué par lettre recommandée ou remise en main propre contre décharge, en précisant l'objet, la date, l'heure et le lieu de l'entretien. Il peut se faire assister par une personne de son choix. Au cours de l'entretien, le motif de la sanction envisagée est indiqué et ses explications sont recueillies (art. R6352-5 et R6352-6).</p>
    <p>La sanction ne peut intervenir moins d'un jour franc ni plus de quinze jours après l'entretien. Elle est motivée et notifiée par écrit (art. R6352-6). Lorsque l'agissement rend indispensable une mesure conservatoire d'exclusion temporaire à effet immédiat, aucune sanction définitive ne peut être prise sans que cette procédure ait été respectée (art. R6352-7).</p>
    <p>L'employeur, et le cas échéant le financeur, sont informés de la sanction prise (art. R6352-8).</p>
    <h2>Article 8 : Représentation des stagiaires</h2>
    <p>Pour les actions d'une durée supérieure à 500 heures, un délégué titulaire et un délégué suppléant sont élus au scrutin uninominal à deux tours, au plus tôt 20 heures et au plus tard 40 heures après le début de la formation (art. R6352-9 à R6352-15). Les formations proposées par l'organisme étant d'une durée inférieure, cette disposition ne s'applique qu'à titre éventuel.</p>
    <h2>Article 9 : Réclamations</h2>
    <p>Toute réclamation peut être adressée à ${esc(o.email)}. Elle reçoit une réponse écrite dans un délai de 30 jours.</p>
    ${faitA(ctx)}
    <p>${esc(o.representant.nom)}, ${esc(o.representant.qualite)}</p>`,
  }];
}
