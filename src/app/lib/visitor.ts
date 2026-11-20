// Mode Visiteur (cf. migration 20261119120000_visitor_mode.sql) : lien de
// démonstration à diffuser aux prospects. Quiconque ouvre /visite/:jeton
// découvre la plateforme, sans compte à créer, sur un compte élève de
// démonstration ouvert pour lui en coulisse. Ce fichier regroupe ce que le visiteur peut voir, et l'API
// admin des liens (page « Liens visiteurs »).
//
// Garde-fous serveur : modules suivants fermés (instance_sections), budget IA
// (checkAiBudget), Agent IA en mode test, pas de réservation de rendez-vous.
// Le reste (Hub, Guide, Exercices) est un aperçu limité côté interface.
import { supabase } from "@/app/lib/supabase/client";
import { ASTUCE_CAS } from "@/app/data/astuces";

export const VISITOR_PATH = "/visite";

// Leçons ouvertes : seulement la première du programme.
export const VISITOR_OPEN_LESSONS = 1;
// Vidéo de la leçon ouverte au visiteur : null tant qu'aucune vidéo de
// démonstration n'est prête (emplacement affiché à la place, et la vidéo
// habituelle de la leçon n'est pas chargée).
export const VISITOR_LESSON_VIDEO_URL: string | null = null;
// Hub IA : les premiers modèles de chaque catégorie.
export const VISITOR_HUB_MODELS = 3;
// Exercices : Battle Ground uniquement.
export const VISITOR_PRACTICE_PATHS = ["/practice/battle-ground"];
// Budget IA proposé par défaut : filet de sécurité, la vraie limite est un
// essai par outil (cf. Essais IA plus bas).
export const VISITOR_DEFAULT_BUDGET_USD = 3;
// Nombre maximal de visiteurs proposé par défaut pour un lien.
export const VISITOR_DEFAULT_MAX_ACCOUNTS = 50;

// Guide IA : le premier cas pratique de chaque type (Images, Vidéos, Web).
const VISITOR_CAS_IDS = new Set(
  [...new Set(ASTUCE_CAS.map((c) => c.domain))].map((domain) => ASTUCE_CAS.find((c) => c.domain === domain)!.id),
);
export function isCasOpenToVisitor(casId: string): boolean {
  return VISITOR_CAS_IDS.has(casId);
}

// Pages réservées à la formation : remplacées par un encart pour le visiteur.
export const VISITOR_CLOSED_FEATURES = {
  certification: "La certification",
  calendar: "Les rendez-vous avec votre formateur",
  practice: "Cet exercice",
  briques: "La bibliothèque des briques de prompt",
  builder: "Le constructeur de prompt",
  guide: "Ce cas pratique",
} as const;
export type VisitorClosedFeature = keyof typeof VISITOR_CLOSED_FEATURES;

export function visitorLinkUrl(token: string): string {
  return `${window.location.origin}${VISITOR_PATH}/${token}`;
}

// ── API admin ─────────────────────────────────────────────────────────────
// Un lien se diffuse librement : chaque personne qui l'ouvre reçoit son propre
// compte de démonstration (cf. edge function visitor-access).
export interface VisitorLink {
  id: string;
  token: string;
  label: string;
  templateName: string | null;
  budgetUsd: number;
  maxAccounts: number | null;
  accountsCount: number;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  // Crédits IA consommés par l'ensemble des comptes ouverts par ce lien.
  spentUsd: number;
}

export async function listVisitorLinks(): Promise<VisitorLink[]> {
  const { data, error } = await supabase
    .from("visitor_links")
    .select("id, token, label, template_id, budget_usd, max_accounts, accounts_count, created_at, expires_at, revoked_at, open_count, last_opened_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const templateIds = [...new Set(rows.map((r) => r.template_id).filter((id): id is string => !!id))];
  const [{ data: accounts, error: aErr }, { data: templates, error: tErr }] = await Promise.all([
    rows.length ? supabase.from("visitor_accounts").select("link_id, profile_id").in("link_id", rows.map((r) => r.id)) : Promise.resolve({ data: [], error: null }),
    templateIds.length ? supabase.from("formations").select("id, name").in("id", templateIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (aErr) throw aErr;
  if (tErr) throw tErr;
  const profileIds = (accounts ?? []).map((a) => a.profile_id);
  const { data: profiles, error: pErr } = profileIds.length
    ? await supabase.from("profiles").select("id, spent_usd").in("id", profileIds)
    : { data: [], error: null };
  if (pErr) throw pErr;
  const spentByProfile = new Map((profiles ?? []).map((p) => [p.id, Number(p.spent_usd ?? 0)]));
  const spentByLink = new Map<string, number>();
  for (const a of accounts ?? []) spentByLink.set(a.link_id, (spentByLink.get(a.link_id) ?? 0) + (spentByProfile.get(a.profile_id) ?? 0));
  const templateById = new Map((templates ?? []).map((t) => [t.id, t.name]));
  return rows.map((r) => ({
    id: r.id,
    token: r.token,
    label: r.label,
    templateName: r.template_id ? templateById.get(r.template_id) ?? null : null,
    budgetUsd: Number(r.budget_usd),
    maxAccounts: r.max_accounts,
    accountsCount: r.accounts_count,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    revokedAt: r.revoked_at,
    openCount: r.open_count,
    lastOpenedAt: r.last_opened_at,
    spentUsd: spentByLink.get(r.id) ?? 0,
  }));
}

async function functionError(error: { message: string; context?: Response }): Promise<string> {
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) return body.error;
    } catch {
      // corps non-JSON
    }
  }
  return error.message;
}

export interface CreateVisitorLinkInput {
  label: string;
  templateId: string;
  budgetUsd: number;
  maxAccounts: number | null;
  expiresInDays: number | null;
}

export async function createVisitorLink(input: CreateVisitorLinkInput): Promise<{ token: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("visitor_links").insert({
    label: input.label,
    template_id: input.templateId,
    budget_usd: input.budgetUsd,
    max_accounts: input.maxAccounts,
    created_by: userData.user?.id ?? null,
    expires_at: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString() : null,
  }).select("token").single();
  if (error) throw error;
  return { token: data.token };
}

// Désactiver ferme aussi les visites déjà ouvertes (cf. visitor_link_active) ;
// réactiver les rouvre telles quelles.
export async function setVisitorLinkRevoked(id: string, revoked: boolean): Promise<void> {
  const { error } = await supabase.from("visitor_links").update({ revoked_at: revoked ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
}

// Supprime le lien et tous les comptes visiteurs qu'il a ouverts.
export async function deleteVisitorLink(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("delete-visitor-link", { body: { linkId: id } });
  if (error) throw new Error(await functionError(error));
  if (data?.error) throw new Error(data.error);
}

// ── Essais IA ─────────────────────────────────────────────────────────────
// Le visiteur teste chaque outil IA une fois (garde-fou serveur :
// claim_visitor_trial, cf. _shared/visitor-trial.ts). Au-delà, la fonction
// répond 403 avec ce code : le client Supabase émet VISITOR_TRIAL_EVENT et
// VisitorTrialDialog présente l'outil et invite à s'inscrire.
export { VISITOR_TRIAL_CODE, VISITOR_TRIAL_EVENT } from "@/app/lib/visitorTrialEvent";

export interface VisitorToolInfo {
  name: string;
  what: string;
  inFormation: string[];
}

const STUDIO_FORMATION = [
  "Écrire des prompts précis pour obtenir exactement le rendu voulu",
  "Choisir le bon modèle d'IA selon votre projet",
  "Produire des contenus professionnels pour votre activité, sans limite d'essais",
];

export const VISITOR_TOOLS: Record<string, VisitorToolInfo> = {
  studio_image: {
    name: "Créer vos images",
    what: "Le Studio transforme une simple description en image : visuels pour vos réseaux, vos présentations ou vos supports de communication, avec plusieurs modèles d'IA au choix.",
    inFormation: STUDIO_FORMATION,
  },
  studio_video: {
    name: "Créer vos vidéos",
    what: "Générez des vidéos à partir d'un texte ou d'une image, pour animer vos réseaux, vos présentations et vos campagnes.",
    inFormation: STUDIO_FORMATION,
  },
  studio_music: {
    name: "Créer vos musiques",
    what: "Composez une musique originale à partir d'une description : style, ambiance, instruments.",
    inFormation: STUDIO_FORMATION,
  },
  studio_talkinghead: {
    name: "Avatar parlant",
    what: "Faites parler un visage à partir d'une image et d'un texte : idéal pour des vidéos de présentation ou de formation.",
    inFormation: STUDIO_FORMATION,
  },
  studio_tts: {
    name: "Du texte à l'audio",
    what: "Transformez un texte en voix off naturelle, avec plusieurs voix au choix.",
    inFormation: STUDIO_FORMATION,
  },
  studio_doublage: {
    name: "Parlez n'importe quelle langue",
    what: "Doublez une vidéo dans une autre langue, avec la synchronisation des lèvres.",
    inFormation: STUDIO_FORMATION,
  },
  studio_chat_openai: {
    name: "ChatGPT",
    what: "Discutez avec ChatGPT directement depuis la plateforme, documents et images à l'appui.",
    inFormation: ["Rédiger, résumer, analyser vos documents en quelques secondes", "Écrire des prompts efficaces pour des réponses fiables", "Intégrer ChatGPT dans votre quotidien professionnel"],
  },
  studio_chat_gemini: {
    name: "Gemini",
    what: "Discutez avec Gemini, l'IA de Google, directement depuis la plateforme, documents et images à l'appui.",
    inFormation: ["Rédiger, résumer, analyser vos documents en quelques secondes", "Écrire des prompts efficaces pour des réponses fiables", "Intégrer Gemini dans votre quotidien professionnel"],
  },
  studio_chat_anthropic: {
    name: "Claude",
    what: "Discutez avec Claude, l'IA d'Anthropic, directement depuis la plateforme, documents et images à l'appui.",
    inFormation: ["Rédiger, résumer, analyser vos documents en quelques secondes", "Écrire des prompts efficaces pour des réponses fiables", "Intégrer Claude dans votre quotidien professionnel"],
  },
  agent_chat: {
    name: "L'Agent IA",
    what: "Votre assistant personnel de formation, disponible à l'écrit comme à la voix, à tout moment.",
    inFormation: [
      "Il connaît votre profil, vos objectifs et vos résultats de formation",
      "Il vous réexplique chaque leçon à votre rythme et répond à vos questions",
      "Il vous aide spécifiquement à progresser et à atteindre vos objectifs",
    ],
  },
  battle_ground: {
    name: "Battle Ground",
    what: "Envoyez le même prompt à plusieurs IA et comparez leurs réponses côte à côte.",
    inFormation: ["Comprendre les forces de chaque IA", "Améliorer vos prompts en voyant ce qui fonctionne", "Choisir le bon outil pour chaque tâche"],
  },
  practice: {
    name: "Les exercices pratiques",
    what: "Des exercices concrets, corrigés par l'IA, pour vous entraîner sur des cas réels.",
    inFormation: ["Une correction détaillée de chaque exercice", "Des mises en situation proches de votre métier", "Une progression suivie par votre formateur"],
  },
  lesson_podcast: {
    name: "Le podcast de la leçon",
    what: "Chaque leçon en version audio, sous forme de dialogue, pour apprendre où que vous soyez.",
    inFormation: ["Tous les podcasts de la formation", "Plusieurs formats d'écoute", "Réviser en déplacement"],
  },
  playground: {
    name: "Les Playgrounds",
    what: "Des ateliers interactifs, intégrés aux leçons, pour mettre l'IA en pratique immédiatement.",
    inFormation: ["Un Playground dans chaque leçon", "Des ateliers sans limite d'essais", "Une pratique guidée, pas à pas"],
  },
};
VISITOR_TOOLS.agent_voice = VISITOR_TOOLS.agent_chat;
VISITOR_TOOLS.reverse_prompt = VISITOR_TOOLS.practice;

export const VISITOR_FALLBACK_TOOL: VisitorToolInfo = {
  name: "Cet outil IA",
  what: "En mode visiteur, chaque outil IA se teste une fois.",
  inFormation: ["Tous les outils IA de la plateforme, sans limite d'essais", "Un parcours complet de leçons et d'exercices", "Le suivi de votre formateur et de l'Agent IA"],
};
