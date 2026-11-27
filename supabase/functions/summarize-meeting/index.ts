// Résumé d'un rendez-vous client à partir de son document (compte rendu,
// notes, support : PDF ou Word). Le client ne voit jamais le fichier, seulement
// ce résumé, relu par l'administrateur avant d'être enregistré (onglet
// « Vos rendez-vous » de l'espace client). Mécanique commune (admin seul,
// envoi puis suivi) : _shared/claude-document-task.ts.
import { serveClaudeDocumentTask } from "../_shared/claude-document-task.ts";

const PROMPT = `Tu rédiges, pour un organisme de formation, le compte rendu d'un rendez-vous avec une entreprise cliente, à partir du document fourni (notes, compte rendu, support de réunion). Ce résumé sera lu par le client dans son espace en ligne.

Règles impératives :
- Fidélité totale : reprends toutes les informations du document (faits, chiffres, dates, noms, besoins, décisions, engagements, actions, échéances) sans en modifier le fond. N'ajoute rien qui n'y figure pas : aucune interprétation, aucune recommandation, aucun conseil, aucune information extérieure.
- N'omets aucune information utile ; tu peux seulement reformuler pour la clarté, regrouper ce qui se répète et corriger l'orthographe.
- Français professionnel, phrases courtes, vouvoiement si le texte s'adresse au client. Les noms et fonctions sont repris tels quels.
- Si une rubrique ne figure pas dans le document, ne l'écris pas (pas de « non précisé »).

Format : Markdown uniquement, sans préambule ni conclusion de ta part, sans bloc de code. Commence directement par le contenu, avec ces rubriques dans cet ordre quand elles s'appliquent :
## Objet du rendez-vous
## Participants
## Points abordés
(sous-titres ### par thème si le document en traite plusieurs ; listes à puces)
## Décisions
## Actions à mener
(une puce par action : **qui** : quoi, échéance s'il y en a une)
## Prochaines étapes`;

serveClaudeDocumentTask({
  name: "summarize-meeting",
  systemPrompt: PROMPT,
  intro: (fileName, context) => `Document du rendez-vous (fichier « ${fileName} »)${context ? `. Précisions : ${context}` : ""}. Rédige le compte rendu :`,
});
