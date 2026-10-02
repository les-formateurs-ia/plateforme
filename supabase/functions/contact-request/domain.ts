// Contact forms of the public site (les-formateurs-ia.fr): /contact/, /contact/entreprise/
// and /contact/particulier/. They save into the advisor's table (project_advisor_leads),
// tagged by `source`, so admins read every request in "Demandes IA".
// Validation, phone format and errors are shared with the advisor.
import { normalizePhone, PublicError, text } from "../project-advisor/domain.ts";

export { ORIGINS, PHONE, PublicError } from "../project-advisor/domain.ts";
export const NOTICE_VERSION = "2026-10-02";

export type Form = "general" | "entreprise" | "particulier";
export type Profile = "entreprise" | "particulier";

// Same values as the site's src/data/contact.ts and the admin page.
export const CHALLENGES = ["charge-equipes", "automatisation", "charte-conformite", "cadrage"] as const;
export const EMPLOYMENT_STATUSES = ["salarie", "demandeur-emploi", "independant-autre"] as const;
export const CPF_BALANCES = ["oui", "non", "aide"] as const;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

/** A row of project_advisor_leads, as saved by a contact form. */
export type ContactLead = {
  request_id: string;
  source: `contact-${Form}`;
  profile: Profile;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  need: string | null;
  company: string | null;
  challenges: string[] | null;
  employment_status: string | null;
  cpf_balance: string | null;
  utm: Record<string, string> | null;
  privacy_notice_version: string;
};

function oneOf<T extends string>(value: unknown, allowed: readonly T[], message: string): T {
  if (!allowed.includes(value as T)) throw new PublicError(400, "VALIDATION", message);
  return value as T;
}

function utm(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = UTM_KEYS.flatMap(key => {
    const raw = (value as Record<string, unknown>)[key];
    return typeof raw === "string" && raw.trim() ? [[key, raw.trim().slice(0, 100)]] : [];
  });
  return entries.length ? Object.fromEntries(entries) : null;
}

export function validateRequest(body: Record<string, unknown>): ContactLead {
  if (body.website) throw new PublicError(400, "VALIDATION", "Impossible d'envoyer ce formulaire.");
  if (body.contactAccepted !== true) throw new PublicError(400, "VALIDATION", "Veuillez accepter d'être recontacté au sujet de votre demande.");
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)) {
    throw new PublicError(400, "VALIDATION", "Formulaire invalide. Rechargez la page.");
  }
  const form = oneOf(body.form, ["general", "entreprise", "particulier"] as const, "Formulaire inconnu.");
  const email = text(body.email, "E-mail", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) {
    throw new PublicError(400, "VALIDATION", "Saisissez une adresse e-mail valide.");
  }
  const lead: ContactLead = {
    request_id: requestId.toLowerCase(),
    source: `contact-${form}`,
    profile: form === "general"
      ? oneOf(body.profile, ["entreprise", "particulier"] as const, "Indiquez si vous êtes une entreprise ou un particulier.")
      : form,
    first_name: text(body.firstName, "Prénom", 1, 100),
    last_name: text(body.lastName, "Nom", 1, 100),
    email,
    phone: normalizePhone(body.phone),
    need: null,
    company: null,
    challenges: null,
    employment_status: null,
    cpf_balance: null,
    utm: utm(body.utm),
    privacy_notice_version: NOTICE_VERSION,
  };
  if (form === "general") lead.need = text(body.need, "Votre besoin", 10, 2000);
  if (form === "entreprise") {
    lead.company = text(body.company, "Entreprise & taille", 2, 160);
    const challenges = Array.isArray(body.challenges) ? [...new Set(body.challenges)] : [];
    if (!challenges.length) throw new PublicError(400, "VALIDATION", "Choisissez au moins un enjeu.");
    lead.challenges = challenges.map(c => oneOf(c, CHALLENGES, "Enjeu inconnu."));
  }
  if (form === "particulier") {
    lead.employment_status = oneOf(body.employmentStatus, EMPLOYMENT_STATUSES, "Indiquez votre statut.");
    lead.cpf_balance = oneOf(body.cpfBalance, CPF_BALANCES, "Indiquez si vous connaissez votre solde CPF.");
  }
  return lead;
}
