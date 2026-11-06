// Conversion d'un prospect en dossier de formation (admin) :
//   * particulier : session « particulier » préremplie, le prospect en est le
//     stagiaire ; devis et programme émis aussitôt, le contrat suit ;
//   * entreprise : fiche entreprise créée (ou complétée), session rattachée ;
//     devis et programme émis aussitôt, puis convention, convocations…
// Le prospect garde le lien vers son dossier (migration 20261108120000).
import logoSvg from "@/imports/logo-les-formateurs-ia.svg?raw";
import { supabase } from "@/app/lib/supabase/client";
import { DOCUMENT_TEMPLATES } from "@/app/lib/documents/catalog";
import { computeJourney } from "@/app/lib/documents/journey";
import { FORMATION_PRESETS } from "@/app/lib/documents/samples";
import {
  addTrainee, buildDocumentContext, createSession, findProfileIdByEmail, getSessionBundle, issueDocument, listSessions, nextReference,
} from "@/app/lib/trainingSessions";
import {
  clientFromCompany, createCompany, getCompanyProfile, updateCompanyProfile, type CompanyContact, type CompanyProfile,
} from "@/app/lib/entreprise/companies";
import { addActivity, setStage, type Lead } from "@/app/lib/prospects";

export type ConversionCommon = { presetId: string; prixHt: number; dateDebut: string; dateFin: string };

export type ParticulierConversion = ConversionCommon & {
  kind: "particulier";
  prenom: string; nom: string; email: string; adresse: string; codePostal: string; ville: string;
};

export type EntrepriseConversion = ConversionCommon & {
  kind: "entreprise";
  financement: "entreprise" | "opco";
  companyId: string | null; // fiche existante, sinon une fiche est créée
  name: string; siret: string; address: string; postalCode: string; city: string;
  contact: CompanyContact; // le prospect, contact formation de l'entreprise
  signataire: CompanyContact | null; // null : le contact signe lui-même
};

export type ConversionInput = ParticulierConversion | EntrepriseConversion;
export type ConversionResult = { sessionId: string; reference: string; issued: string[]; companyCreated: boolean };

const INTERVENANT = { nom: "Yanis SOUICI", qualite: "Formateur IA générative, dirigeant de Les Formateurs IA" };
const PAIEMENT = {
  entreprise: "Facture émise à l'issue de la formation, payable à 30 jours par virement.",
  particulier: "Acompte de 30 % au plus à l'issue du délai de rétractation de 14 jours, solde échelonné au fil de la formation, par virement.",
};

/** Dossier déjà ouvert pour ce prospect (null avant la migration 20261108120000). */
export async function getLeadSessionId(leadId: number): Promise<string | null> {
  const { data, error } = await supabase.from("project_advisor_leads").select("session_id").eq("id", leadId).maybeSingle();
  if (error) return null;
  return (data as { session_id?: string | null } | null)?.session_id ?? null;
}

// Une valeur déjà saisie sur la fiche n'est jamais écrasée.
const keep = (current: string, next: string) => current.trim() || next.trim();

async function prepareCompany(input: EntrepriseConversion): Promise<{ profile: CompanyProfile; created: boolean }> {
  let companyId = input.companyId;
  let created = false;
  if (!companyId) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Session expirée, reconnectez-vous.");
    companyId = (await createCompany(input.name.trim(), auth.user.id)).id;
    created = true;
  }
  const current = await getCompanyProfile(companyId);
  if (!current) throw new Error("Fiche entreprise introuvable.");
  const profile: CompanyProfile = {
    ...current,
    siret: keep(current.siret, input.siret), address: keep(current.address, input.address),
    postalCode: keep(current.postalCode, input.postalCode), city: keep(current.city, input.city),
    email: keep(current.email, input.contact.email), phone: keep(current.phone, input.contact.telephone),
    contacts: {
      ...current.contacts,
      formation: current.contacts.formation ?? input.contact,
      representant: current.contacts.representant ?? input.signataire ?? input.contact,
    },
  };
  await updateCompanyProfile(profile);
  return { profile, created };
}

export async function convertProspect(lead: Lead, input: ConversionInput): Promise<ConversionResult> {
  const preset = FORMATION_PRESETS.find((p) => p.id === input.presetId);
  if (!preset) throw new Error("Programme inconnu.");
  const financement = input.kind === "particulier" ? "particulier" : input.financement;
  const sessions = await listSessions();
  const reference = nextReference(sessions, financement);

  let companyCreated = false;
  let companyId: string | null = null;
  let client;
  if (input.kind === "entreprise") {
    const { profile, created } = await prepareCompany(input);
    companyCreated = created;
    companyId = profile.id;
    client = clientFromCompany(profile);
  } else {
    client = {
      type: "particulier" as const, nom: `${input.prenom.trim()} ${input.nom.trim().toUpperCase()}`.trim(),
      adresse: input.adresse.trim(), codePostal: input.codePostal.trim(), ville: input.ville.trim(),
      siret: null, representant: null, email: input.email.trim().toLowerCase(),
    };
  }

  const sessionId = await createSession({
    reference, financement, financeur: null, companyId, client,
    formation: preset.formation,
    lignes: [{ designation: preset.formation.intitule, quantite: 1, prixUnitaireHt: input.prixHt }],
    conditionsPaiement: input.kind === "particulier" ? PAIEMENT.particulier : PAIEMENT.entreprise,
    dateDebut: input.dateDebut, dateFin: input.dateFin,
    lieu: preset.formation.modalite === "presentiel" ? "" : "Plateforme e-learning et visioconférence", lienConnexion: null,
    intervenants: [INTERVENANT], formateurId: null,
    statutCommercial: "devis", factures: [], chargesHt: 0,
  });

  // Le particulier est le stagiaire ; son compte plateforme, s'il en a un,
  // relie la session à ses relevés de connexion.
  if (input.kind === "particulier") {
    const email = input.email.trim().toLowerCase();
    await addTrainee(sessionId, {
      civilite: "", prenom: input.prenom.trim(), nom: input.nom.trim().toUpperCase(), email, fonction: null,
      profileId: await findProfileIdByEmail(email).catch(() => null),
    });
  }

  // Devis et programme, dès que le dossier client et le programme le permettent ;
  // sinon le parcours du dossier indique ce qu'il manque.
  const issued: string[] = [];
  const bundle = await getSessionBundle(sessionId);
  if (bundle) {
    const step = computeJourney(bundle, [], {}).steps.find((s) => s.id === "devis");
    const action = step?.actions[0];
    if (action?.kind === "issue") {
      const ctx = buildDocumentContext(bundle);
      for (const id of action.templateIds) {
        const template = DOCUMENT_TEMPLATES.find((t) => t.id === id);
        if (!template) continue;
        await issueDocument(sessionId, template, ctx, logoSvg, bundle.trainees.map((t) => t.id));
        issued.push(template.titre);
      }
    }
  }

  // Suivi du prospect : lien vers le dossier, étape « Proposition », trace au journal.
  const { error: linkError } = await supabase.from("project_advisor_leads").update({ session_id: sessionId }).eq("id", lead.id);
  if (linkError) console.warn("Lien prospect → dossier non enregistré (migration 20261108120000 à appliquer ?)", linkError);
  if (lead.pipeline_stage !== "proposition" && lead.pipeline_stage !== "gagne") await setStage(lead.id, "proposition");
  await addActivity(lead.id, "note", [
    `Converti en dossier ${input.kind === "particulier" ? "particulier" : "entreprise"} ${reference} (${preset.formation.intitule}).`,
    companyCreated ? "Fiche entreprise créée." : null,
    issued.length ? `Émis : ${issued.join(", ")}.` : "Devis à émettre depuis le dossier une fois le dossier client complété.",
  ].filter(Boolean).join(" "));

  return { sessionId, reference, issued, companyCreated };
}
