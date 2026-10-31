import type { Organisme } from "./types";

// Identité légale de l'organisme : documents Digiforma (devis et programme
// Heling ENR, mars 2026) et informations confirmées par la direction le
// 31/10/2026. Les valeurs à null s'affichent en surligné « À compléter ».
export const ORGANISME: Organisme = {
  nomCommercial: "Les Formateurs IA",
  raisonSociale: "MY ACADEMIA",
  formeJuridique: null,
  capitalSocial: null,
  rcs: null,
  adresse: "29 chemin de Villeneuve",
  codePostal: "69130",
  ville: "Écully",
  email: "contact@les-formateurs-ia.fr",
  telephone: "09 80 87 40 46",
  siteWeb: "les-formateurs-ia.fr",
  siret: "933 773 608 00015",
  tvaIntracom: "FR24933773608",
  nda: "84692541069",
  // Le préfixe 84 du numéro de déclaration correspond à Auvergne-Rhône-Alpes.
  ndaRegion: "Auvergne-Rhône-Alpes",
  qualiopi: {
    // Le numéro figure sur le certificat BCI France ; il n'est pas exigé sur les documents.
    numero: null,
    certificateur: "BCI France",
    dateValidite: null,
    categories: "Actions de formation",
  },
  representant: { nom: "Yanis SOUICI", qualite: "Dirigeant" },
  referentPedagogique: { nom: "Yanis SOUICI", email: "contact@les-formateurs-ia.fr", telephone: "09 80 87 40 46" },
  referentHandicap: { nom: "Yanis SOUICI", email: "contact@les-formateurs-ia.fr", telephone: "09 80 87 40 46" },
  // Obligatoire pour les contrats avec un particulier (art. L612-1 Code de la consommation).
  mediateur: { nom: null, site: null },
  villeSignature: "Écully",
};
