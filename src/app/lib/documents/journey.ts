// Parcours d'un dossier de formation, de la prise de contact à la clôture
// Qualiopi : où en est la session, ce qui manque pour avancer, et l'action
// suivante. Pur (sans Supabase) : testé dans scripts/documents.test.mjs.
import { creneauDuree, heures } from "./render";
import { isSlotOpen, type ActivityRow, type SessionBundle, type SessionSlot } from "./session";

export type JourneyAction =
  // Ouvre le panneau de l'étape dans le tableau de bord.
  | { kind: "open"; label: string }
  | { kind: "issue"; templateIds: string[]; label: string }
  | { kind: "share"; documentId: string; label: string }
  | { kind: "sign-slot"; slotId: string; label: string };

export type StepStatus = "done" | "current" | "todo" | "locked";

export type JourneyStep = {
  id: string;
  titre: string;
  description: string;
  status: StepStatus;
  detail: string | null;
  missing: string[];
  actions: JourneyAction[];
};

// Champs saisissables directement depuis le parcours.
export type MissingField =
  | "client.nom" | "client.adresse" | "client.codePostal" | "client.ville" | "client.siret"
  | "client.representant.nom" | "client.representant.qualite" | "client.email" | "lieu";

export const MISSING_FIELD_LABELS: Record<MissingField, string> = {
  "client.nom": "Nom du client",
  "client.adresse": "Adresse",
  "client.codePostal": "Code postal",
  "client.ville": "Ville",
  "client.siret": "SIRET",
  "client.representant.nom": "Nom du signataire",
  "client.representant.qualite": "Fonction du signataire",
  "client.email": "E-mail du signataire",
  lieu: "Lieu de la formation",
};

export type JourneyDocument = { id: string; template_id: string; requires_signature: boolean; signed_at: string | null };

export type Journey = {
  steps: JourneyStep[];
  progress: number;
  done: number;
  next: JourneyStep | null;
  missingFields: MissingField[];
  level: { label: string; emoji: string };
  timeline: { label: string; ratio: number };
};

const LEVELS = [
  { min: 0, label: "Lancement", emoji: "🚀" },
  { min: 25, label: "Préparation", emoji: "🧭" },
  { min: 50, label: "En formation", emoji: "🎓" },
  { min: 75, label: "Dernière ligne droite", emoji: "🏁" },
  { min: 100, label: "Dossier Qualiopi complet", emoji: "🏆" },
];

const blank = (v: string | null | undefined) => !v || !v.trim();

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

function slotEnded(slot: SessionSlot, now: Date): boolean {
  return `${slot.date}T${slot.fin}` < parisIso(now);
}

function parisIso(now: Date): string {
  const p = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.getFullYear()}-${pad(p.getMonth() + 1)}-${pad(p.getDate())}T${pad(p.getHours())}:${pad(p.getMinutes())}`;
}

export function computeJourney(bundle: SessionBundle, documents: JourneyDocument[], activity: Record<string, ActivityRow[]>, now = new Date()): Journey {
  const { session, slots, trainees, signatures } = bundle;
  const today = parisIso(now).slice(0, 10);
  const f = session.formation;
  const c = session.client;
  const b2b = session.financement === "entreprise" || session.financement === "opco";
  const distance = f.modalite === "foad" || f.modalite === "hybride";
  const ended = today > session.dateFin;
  const started = today >= session.dateDebut;
  const issued = (id: string) => documents.filter((d) => d.template_id === id);
  const steps: JourneyStep[] = [];

  // Dossier client
  const missingFields: MissingField[] = [];
  const need = (cond: boolean, field: MissingField) => { if (cond) missingFields.push(field); };
  need(blank(c.nom), "client.nom");
  if (b2b || session.financement === "particulier") {
    need(blank(c.adresse), "client.adresse");
    need(blank(c.codePostal), "client.codePostal");
    need(blank(c.ville), "client.ville");
  }
  if (b2b) {
    need(blank(c.siret), "client.siret");
    need(blank(c.representant?.nom), "client.representant.nom");
    need(blank(c.representant?.qualite), "client.representant.qualite");
  }
  need(blank(c.email), "client.email");
  need(f.modalite !== "foad" && blank(session.lieu), "lieu");
  steps.push({
    id: "client", titre: "Dossier client", description: b2b ? "Coordonnées de l'entreprise et du signataire de la convention." : "Coordonnées du stagiaire.",
    status: missingFields.length ? "current" : "done", detail: missingFields.length ? null : `${c.nom}${c.ville ? `, ${c.ville}` : ""}`,
    missing: missingFields.map((m) => MISSING_FIELD_LABELS[m]), actions: missingFields.length ? [{ kind: "open", label: "Compléter le dossier client" }] : [],
  });

  // Programme
  const programmeMissing = [
    ...(f.objectifs.length ? [] : ["Objectifs pédagogiques"]),
    ...(f.contenu.length ? [] : ["Contenu de la formation"]),
    ...(f.publicVise.length ? [] : ["Public visé"]),
    ...(f.prerequis.length ? [] : ["Prérequis"]),
    ...(f.modalitesEvaluation.length ? [] : ["Modalités d'évaluation"]),
    ...(f.indicateurs.length ? [] : ["Indicateurs de résultats"]),
    ...(session.intervenants.length ? [] : ["Intervenant"]),
    ...(distance && blank(f.assistance) ? ["Assistance à distance"] : []),
    ...(distance && !f.activitesDistance.length ? ["Activités à distance"] : []),
  ];
  steps.push({
    id: "programme", titre: "Programme", description: "Objectifs, contenu, méthodes et évaluation, conformes Qualiopi.",
    status: programmeMissing.length ? "current" : "done",
    detail: programmeMissing.length ? null : `${f.intitule} · ${heures(f.dureeHeures)}`,
    missing: programmeMissing, actions: programmeMissing.length ? [{ kind: "open", label: "Compléter le programme" }] : [],
  });

  // Documents à faire signer par le client. Le devis précède le planning ;
  // la convention et le contrat listent stagiaires et horaires, ils le suivent.
  const contractStep = (templateId: string, titre: string, prerequisManquants: boolean): JourneyStep => {
    const docs = issued(templateId);
    const signed = docs.find((d) => d.signed_at);
    const pending = docs.find((d) => !d.signed_at);
    return {
      id: templateId, titre, description: templateId === "devis" ? "Le client accepte la proposition en un clic." : "Signature en ligne : une case à cocher et « Signer ».",
      status: signed ? "done" : prerequisManquants ? "locked" : "current",
      detail: signed ? "Signé en ligne" : pending ? "Envoyé, en attente de signature"
        : prerequisManquants ? (templateId === "devis" ? "Complète d'abord le dossier client et le programme" : "Complète d'abord le dossier, le programme et le planning") : null,
      missing: [],
      actions: signed || prerequisManquants ? [] : pending
        ? [{ kind: "share", documentId: pending.id, label: "Renvoyer le lien de signature" }]
        : [{ kind: "issue", templateIds: [templateId], label: `Émettre ${templateId === "devis" ? "le devis" : templateId === "convention" ? "la convention" : "le contrat"}` }],
    };
  };
  const dossierManquant = missingFields.length > 0 || programmeMissing.length > 0;
  if (b2b) steps.push(contractStep("devis", "Devis signé", dossierManquant));

  // Planning : stagiaires et séances
  const plannedHours = slots.reduce((s, sl) => s + creneauDuree(sl), 0);
  const needSlots = f.modalite !== "foad";
  const planningMissing = [
    ...(trainees.length ? [] : ["Stagiaires"]),
    ...(needSlots && !slots.length ? ["Séances"] : []),
  ];
  const sansCompte = trainees.filter((t) => !t.profileId).length;
  steps.push({
    id: "planning", titre: "Planning", description: "Stagiaires inscrits et séances planifiées.",
    status: planningMissing.length ? "current" : "done",
    detail: `${trainees.length} stagiaire${trainees.length > 1 ? "s" : ""} · ${slots.length} séance${slots.length > 1 ? "s" : ""}${needSlots ? ` · ${heures(plannedHours)} planifiées sur ${heures(f.dureeHeures)}` : ""}${sansCompte ? ` · ${sansCompte} sans compte plateforme` : ""}`,
    missing: planningMissing, actions: planningMissing.length ? [{ kind: "open", label: "Ajouter stagiaires et séances" }] : [],
  });

  if (b2b) steps.push(contractStep("convention", "Convention signée", dossierManquant || planningMissing.length > 0));
  if (session.financement === "particulier") steps.push(contractStep("contrat-particulier", "Contrat signé", dossierManquant || planningMissing.length > 0));

  // Documents d'accueil remis aux stagiaires
  const accueil = ["programme", "cgv", "reglement-interieur", "convocation"];
  const accueilMissing = accueil.filter((id) => !issued(id).length);
  const accueilLocked = planningMissing.length > 0;
  steps.push({
    id: "accueil", titre: "Convocations", description: "Convocation, programme, CGV et règlement intérieur remis avant le début.",
    status: !accueilMissing.length ? "done" : accueilLocked ? "locked" : "current",
    detail: !accueilMissing.length ? "Documents d'accueil émis" : accueilLocked ? "Ajoute d'abord les stagiaires et les séances" : `${accueil.length - accueilMissing.length}/${accueil.length} documents émis`,
    missing: [], actions: accueilMissing.length && !accueilLocked ? [{ kind: "issue", templateIds: accueilMissing, label: "Tout émettre en un clic" }] : [],
  });

  // Réalisation : émargement ou relevés de connexion
  const pastSlots = slots.filter((s) => slotEnded(s, now) || isSlotOpen(s, now));
  const toSign = pastSlots.find((s) => !signatures.some((g) => g.slotId === s.id && g.role === "intervenant"));
  const traineeSigs = signatures.filter((g) => g.role === "stagiaire" && pastSlots.some((s) => s.id === g.slotId)).length;
  const expected = pastSlots.length * trainees.length;
  const distanceHours = trainees.reduce((sum, t) => sum + (activity[t.id] ?? []).reduce((s, r) => s + r.seconds, 0), 0) / 3600 / Math.max(trainees.length, 1);
  const realisationDetail = !started
    ? `Démarre dans ${daysBetween(today, session.dateDebut)} jour${daysBetween(today, session.dateDebut) > 1 ? "s" : ""}`
    : [
      ...(slots.length ? [`${pastSlots.length}/${slots.length} séances passées`, expected ? `présence ${Math.round((traineeSigs / expected) * 100)} %` : null] : []),
      ...(distance ? [`${heures(Math.round(distanceHours * 10) / 10)} en ligne en moyenne sur ${heures(f.dureeHeures)}`] : []),
    ].filter(Boolean).join(" · ");
  steps.push({
    id: "realisation", titre: distance && !slots.length ? "Suivi à distance" : "Émargement",
    description: distance ? "Relevés de connexion et séances avec le formateur." : "Chaque demi-journée signée par les stagiaires et l'intervenant.",
    status: ended && !toSign ? "done" : started ? "current" : "locked",
    detail: realisationDetail, missing: toSign ? ["Signature de l'intervenant"] : [],
    actions: toSign ? [{ kind: "sign-slot", slotId: toSign.id, label: "Signer la séance en tant qu'intervenant" }] : started ? [{ kind: "open", label: "Voir l'émargement" }] : [],
  });

  // Évaluation des acquis
  const sansResultat = trainees.filter((t) => blank(t.resultatEvaluation));
  steps.push({
    id: "evaluation", titre: "Évaluation des acquis", description: "Le résultat de chaque stagiaire, repris sur l'attestation de fin de formation.",
    status: trainees.length && !sansResultat.length ? "done" : started ? "current" : "locked",
    detail: trainees.length ? `${trainees.length - sansResultat.length}/${trainees.length} résultats saisis` : null,
    missing: started ? sansResultat.map((t) => `Résultat de ${t.prenom} ${t.nom}`) : [],
    actions: started && sansResultat.length ? [{ kind: "open", label: "Saisir les résultats" }] : [],
  });

  // Clôture
  const cloture = ["attestation-assiduite", "certificat-realisation", "attestation-fin-formation", ...(distance ? ["releve-connexions"] : [])];
  const clotureMissing = cloture.filter((id) => !issued(id).length);
  steps.push({
    id: "cloture", titre: "Clôture", description: "Attestations et certificat de réalisation remis au client et au financeur.",
    status: !clotureMissing.length ? "done" : ended ? "current" : "locked",
    detail: !clotureMissing.length ? "Dossier complet" : ended ? `${cloture.length - clotureMissing.length}/${cloture.length} documents émis` : `Disponible à la fin de la formation`,
    missing: [], actions: ended && clotureMissing.length ? [{ kind: "issue", templateIds: clotureMissing, label: "Générer les documents de fin" }] : [],
  });

  // Dossier mené jusqu'au bout dans Digiforma : ses justificatifs (devis,
  // convention, émargements, certificats) sont dans l'archive de la session.
  if (session.archive?.cloture) {
    for (const [i, s] of steps.entries()) {
      if (s.status !== "done") steps[i] = { ...s, status: "done", detail: "Traité dans Digiforma (voir l'archive)", missing: [], actions: [] };
    }
  }

  const done = steps.filter((s) => s.status === "done").length;
  const progress = Math.round((done / steps.length) * 100);
  const next = steps.find((s) => s.status === "current") ?? null;
  const level = [...LEVELS].reverse().find((l) => progress >= l.min)!;
  const total = Math.max(daysBetween(session.dateDebut, session.dateFin) + 1, 1);
  const timeline = !started
    ? { label: `J-${daysBetween(today, session.dateDebut)}`, ratio: 0 }
    : ended
      ? { label: "Formation terminée", ratio: 1 }
      : { label: `Jour ${daysBetween(session.dateDebut, today) + 1} sur ${total}`, ratio: (daysBetween(session.dateDebut, today) + 1) / total };

  return { steps, progress, done, next, missingFields: session.archive?.cloture ? [] : missingFields, level: { label: level.label, emoji: level.emoji }, timeline };
}
