// Contenus du Playground 1.1, par profil. "" = version commune.
// Toutes les entreprises, personnes et données sont fictives.

import { TOOL_SHEETS, type ToolId } from "./tools";

export type { ToolId };
export const TOOLS: { id: ToolId; label: string }[] = TOOL_SHEETS.map((t) => ({ id: t.id, label: t.name }));

type Round = { stem: string; cands: { w: string; p: number }[] };
type Lab = { question: string; source: string };
// `alsoOk` : autre choix défendable, accepté avec une nuance.
type Case = { task: string; answer: ToolId; alsoOk?: ToolId[]; why: string };
type Content = { intro: string; rounds: Round[]; lab: Lab; cases: Case[]; studioQuestion: string };

const AUTH = "À condition que l'outil soit autorisé par l'entreprise et que les données soient préparées.";

export const CONTENT: Record<string, Content> = {
  "": {
    intro: "Quatre activités pour observer ce que la vidéo vient d'expliquer : comment l'outil choisit ses mots, pourquoi il peut inventer, ce qui distingue les cinq outils de référence, et comment choisir selon le contexte.",
    rounds: [
      { stem: "Bonjour, je vous confirme la bonne réception de votre", cands: [{ w: "message", p: 34 }, { w: "dossier", p: 27 }, { w: "demande", p: 22 }, { w: "courrier", p: 17 }] },
      { stem: "Le compte-rendu vous sera transmis", cands: [{ w: "dans les meilleurs délais", p: 32 }, { w: "après validation", p: 27 }, { w: "cette semaine", p: 24 }, { w: "prochainement", p: 17 }] },
      { stem: "Nous recherchons un profil", cands: [{ w: "motivé", p: 31 }, { w: "expérimenté", p: 26 }, { w: "rigoureux", p: 23 }, { w: "polyvalent", p: 20 }] },
      { stem: "Merci de nous transmettre", cands: [{ w: "votre disponibilité", p: 30 }, { w: "les documents demandés", p: 27 }, { w: "votre réponse", p: 25 }, { w: "un retour", p: 18 }] },
    ],
    lab: {
      question: "Quelle est la date du prochain comité de pilotage du projet avec la société Verlane & Associés ?",
      source: "Objet : Projet Verlane & Associés — prochaines étapes\nBonjour à tous,\nLe prochain comité de pilotage aura lieu le mardi 14 octobre à 10 h, en visioconférence. L'ordre du jour suivra.\nBien cordialement,\nClaire",
    },
    cases: [
      { task: "Votre entreprise travaille sous Microsoft 365. Vous devez résumer un long échange de mails dans Outlook.", answer: "copilot", why: `Copilot est intégré à Outlook et peut s'appuyer sur les mails de votre environnement professionnel, selon la licence. ${AUTH}` },
      { task: "Vous devez créer une illustration pour une plaquette, qui sera ensuite retouchée dans Photoshop.", answer: "firefly", why: "Firefly est orienté création visuelle et intégré à l'écosystème Adobe. Vérifiez quand même les conditions d'usage de votre offre, le droit à l'image et les marques." },
      { task: "Votre équipe travaille dans Gmail et Google Docs. Vous préparez le brouillon d'une réponse à un client.", answer: "gemini", why: `Gemini est intégré à Gmail et Docs : le brouillon se fait là où vous travaillez déjà. ${AUTH}` },
      { task: "Aucun environnement n'est imposé. Vous voulez reformuler un texte, puis en tirer un tableau de synthèse à partir d'un fichier joint.", answer: "chatgpt", alsoOk: ["claude"], why: `ChatGPT est le plus polyvalent hors écosystème : rédaction, analyse de fichiers, tableaux. Claude est aussi un choix défendable. ${AUTH}` },
      { task: "Vous devez analyser un rapport de quarante pages et en tirer une synthèse structurée, fidèle au texte, en respectant un plan imposé.", answer: "claude", alsoOk: ["chatgpt"], why: `Claude est réputé pour sa rigueur sur les longs documents et le respect de consignes détaillées. ChatGPT reste défendable. ${AUTH}` },
    ],
    studioQuestion: "Explique en trois phrases ce qu'est une hallucination d'une IA générative, avec un exemple tiré de mon métier.",
  },

  sirh: {
    intro: "Quatre activités tirées du quotidien d'une consultante SIRH : comment l'outil choisit ses mots, pourquoi il peut inventer une information sur une offre d'emploi, ce qui distingue les cinq outils, et lequel utiliser selon l'environnement du client.",
    rounds: [
      { stem: "Suite à notre échange, je vous transmets le paramétrage de votre", cands: [{ w: "logiciel de recrutement", p: 36 }, { w: "espace candidat", p: 25 }, { w: "tableau de bord", p: 22 }, { w: "outil", p: 17 }] },
      { stem: "La formation de vos équipes au nouvel outil aura lieu", cands: [{ w: "la semaine prochaine", p: 33 }, { w: "en deux sessions", p: 26 }, { w: "à distance", p: 23 }, { w: "dès validation", p: 18 }] },
      { stem: "Nous recherchons un chargé de recrutement", cands: [{ w: "expérimenté", p: 30 }, { w: "polyvalent", p: 26 }, { w: "rigoureux", p: 24 }, { w: "motivé", p: 20 }] },
      { stem: "Merci de me confirmer la liste des", cands: [{ w: "utilisateurs à créer", p: 35 }, { w: "offres à publier", p: 26 }, { w: "étapes du processus", p: 22 }, { w: "accès nécessaires", p: 17 }] },
    ],
    lab: {
      question: "Quelle est la rémunération proposée pour le poste de chargé de recrutement chez Verlane & Associés ?",
      source: "Fiche de poste — Chargé de recrutement (CDI), Verlane & Associés, Lyon\nMissions : sourcing, préqualification téléphonique, suivi des candidatures dans le logiciel de recrutement.\nRémunération : 36 000 à 40 000 euros bruts annuels selon expérience.\nPrise de poste : janvier.",
    },
    cases: [
      { task: "Votre client travaille sous Microsoft 365. Vous devez synthétiser les retours de ses équipes après la formation au logiciel, échangés dans Teams.", answer: "copilot", why: `Copilot est intégré à Teams et Outlook dans un environnement Microsoft 365, selon la licence du client. ${AUTH}` },
      { task: "Votre client travaille sous Google Workspace. Vous préparez dans Gmail un mail de relance à ses recruteurs pour finaliser le paramétrage.", answer: "gemini", why: `Gemini est intégré à Gmail : le brouillon se fait dans l'environnement du client. ${AUTH}` },
      { task: "Vous devez créer un visuel pour annoncer un poste sur la page carrières d'un client.", answer: "firefly", why: "Firefly est orienté création visuelle. Vérifiez la charte du client, le droit à l'image et les conditions d'usage de l'offre." },
      { task: "Aucun environnement n'est imposé. Vous reformulez une offre d'emploi à partir de la fiche de poste fournie par le client.", answer: "chatgpt", alsoOk: ["claude"], why: `C'est votre usage quotidien : ChatGPT transforme très bien un texte fourni. Claude est aussi défendable. Relisez chaque critère de sélection. ${AUTH}` },
      { task: "Vous devez analyser le long cahier des charges de paramétrage d'un client et en tirer la liste des points à valider avec lui.", answer: "claude", alsoOk: ["chatgpt"], why: `Claude est un bon choix pour sa rigueur sur les longs documents et le respect d'un format imposé. ChatGPT reste défendable. ${AUTH}` },
    ],
    studioQuestion: "Reformule cette phrase d'offre d'emploi de façon neutre et inclusive : « Nous recherchons un jeune chargé de recrutement dynamique. »",
  },
};
