// Catalogue de voix MiniMax Speech 2.8 (audioInference) partagé par les 3
// modules du Studio qui en dépendent : "Faites parler vos images" (TTS ->
// avatar), "Du texte à l'audio" (TTS seul) et "Parlez n'importe quelle
// langue" (TTS de traduction -> lip-sync).
//
// Catalogue complet (250 voix, 15 langues + 2 voix "spéciales") extrait le
// 2026-09-20 du HTML brut de https://runware.ai/docs/models/minimax-speech-2-8
// (grep direct des identifiants "Lang_NomVoix" dans la page — PAS un résumé
// IA de la doc, qui s'est avéré peu fiable : une première passe via un
// fetch résumé par un modèle annonçait à tort du néerlandais/thaï/hindi/
// polonais/etc. absents de la page réelle). Les labels par voix sont dérivés
// automatiquement du nom Runware (ex. "CalmWoman" -> "Calm Woman") plutôt que
// traduits à la main : à 250 entrées, une traduction FR fiable (genre inclus)
// n'est pas réaliste à maintenir, contrairement aux 9 voix d'origine
// (2026-09-18/19) qui avaient un label FR travaillé — ce sont des noms
// d'archétypes de personnage, pas du texte fonctionnel, donc les garder en
// anglais reste lisible. Deux corrections trouvées au passage par rapport à
// l'ancien catalogue codé en dur : "English_expressive_narrator" et
// "Spanish_narrator" n'existent pas dans la doc réelle (respectivement
// "English_ExplorativeGirl"-like id inexistant et "Spanish_Narrator" avec un
// N majuscule) — remplacés ici par des ids réels.
//
// Toujours pas vérifié par un appel Runware réel bout en bout (même réserve
// que le reste du catalogue Runware de ce projet, cf. runware.ts) : à
// corriger dès qu'un élève déclenche une erreur "voice not found" sur un id
// précis.
export interface TtsVoiceOption {
  id: string;
  label: string; // nom d'archétype Runware, non traduit (cf. commentaire ci-dessus)
}

export interface TtsLanguageGroup {
  code: string; // code langue indicatif (pas transmis à Runware, cf. buildTtsTask)
  label: string; // nom de la langue en français, pour l'UI
  voices: TtsVoiceOption[];
}

// Ordre : les 7 langues du catalogue "curé" d'origine d'abord (public
// francophone en priorité), puis le reste du catalogue Runware par taille
// décroissante, "Voix spéciales" en dernier.
export const TTS_LANGUAGES: TtsLanguageGroup[] = [
  {
    code: "fr-FR",
    label: "Français",
    voices: [
      { id: "French_CasualMan", label: "Casual Man" },
      { id: "French_FemaleAnchor", label: "Female Anchor" },
      { id: "French_MaleNarrator", label: "Male Narrator" },
      { id: "French_MovieLeadFemale", label: "Movie Lead Female" },
    ],
  },
  {
    code: "en-US",
    label: "Anglais",
    voices: [
      { id: "English_AnimeCharacter", label: "Anime Character" },
      { id: "English_AssertiveQueen", label: "Assertive Queen" },
      { id: "English_BossyLeader", label: "Bossy Leader" },
      { id: "English_CalmWoman", label: "Calm Woman" },
      { id: "English_CaptivatingStoryteller", label: "Captivating Storyteller" },
      { id: "English_Comedian", label: "Comedian" },
      { id: "English_ConfidentWoman", label: "Confident Woman" },
      { id: "English_Debator", label: "Debator" },
      { id: "English_DecentYoungMan", label: "Decent Young Man" },
      { id: "English_FriendlyPerson", label: "Friendly Person" },
      { id: "English_ImposingManner", label: "Imposing Manner" },
      { id: "English_Jovialman", label: "Jovialman" },
      { id: "English_LovelyGirl", label: "Lovely Girl" },
      { id: "English_ManWithDeepVoice", label: "Man With Deep Voice" },
      { id: "English_MatureBoss", label: "Mature Boss" },
      { id: "English_MaturePartner", label: "Mature Partner" },
      { id: "English_PassionateWarrior", label: "Passionate Warrior" },
      { id: "English_PatientMan", label: "Patient Man" },
      { id: "English_PlayfulGirl", label: "Playful Girl" },
      { id: "English_ReservedYoungMan", label: "Reserved Young Man" },
      { id: "English_SadTeen", label: "Sad Teen" },
      { id: "English_SentimentalLady", label: "Sentimental Lady" },
      { id: "English_SereneWoman", label: "Serene Woman" },
      { id: "English_Steadymentor", label: "Steadymentor" },
      { id: "English_StressedLady", label: "Stressed Lady" },
      { id: "English_UpsetGirl", label: "Upset Girl" },
      { id: "English_WhimsicalGirl", label: "Whimsical Girl" },
      { id: "English_WiseScholar", label: "Wise Scholar" },
      { id: "English_Wiselady", label: "Wiselady" },
    ],
  },
  {
    code: "es-ES",
    label: "Espagnol",
    voices: [
      { id: "Spanish_AngryMan", label: "Angry Man" },
      { id: "Spanish_AnimeCharacter", label: "Anime Character" },
      { id: "Spanish_Arnold", label: "Arnold" },
      { id: "Spanish_AssertiveQueen", label: "Assertive Queen" },
      { id: "Spanish_BossyLeader", label: "Bossy Leader" },
      { id: "Spanish_CaptivatingStoryteller", label: "Captivating Storyteller" },
      { id: "Spanish_CaringGirlfriend", label: "Caring Girlfriend" },
      { id: "Spanish_ChattyGirl", label: "Chatty Girl" },
      { id: "Spanish_Comedian", label: "Comedian" },
      { id: "Spanish_CompellingGirl", label: "Compelling Girl" },
      { id: "Spanish_ConfidentWoman", label: "Confident Woman" },
      { id: "Spanish_Debator", label: "Debator" },
      { id: "Spanish_DeterminedManager", label: "Determined Manager" },
      { id: "Spanish_EnergeticBoy", label: "Energetic Boy" },
      { id: "Spanish_FrankLady", label: "Frank Lady" },
      { id: "Spanish_Fussyhostess", label: "Fussyhostess" },
      { id: "Spanish_Ghost", label: "Ghost" },
      { id: "Spanish_HumorousElder", label: "Humorous Elder" },
      { id: "Spanish_Intonategirl", label: "Intonategirl" },
      { id: "Spanish_Jovialman", label: "Jovialman" },
      { id: "Spanish_MaturePartner", label: "Mature Partner" },
      { id: "Spanish_Narrator", label: "Narrator" },
      { id: "Spanish_PassionateWarrior", label: "Passionate Warrior" },
      { id: "Spanish_PowerfulSoldier", label: "Powerful Soldier" },
      { id: "Spanish_PowerfulVeteran", label: "Powerful Veteran" },
      { id: "Spanish_RationalMan", label: "Rational Man" },
      { id: "Spanish_ReliableMan", label: "Reliable Man" },
      { id: "Spanish_ReservedYoungMan", label: "Reserved Young Man" },
      { id: "Spanish_RomanticHusband", label: "Romantic Husband" },
      { id: "Spanish_Rudolph", label: "Rudolph" },
      { id: "Spanish_SantaClaus", label: "Santa Claus" },
      { id: "Spanish_SensibleManager", label: "Sensible Manager" },
      { id: "Spanish_SereneElder", label: "Serene Elder" },
      { id: "Spanish_SereneWoman", label: "Serene Woman" },
      { id: "Spanish_SincereTeen", label: "Sincere Teen" },
      { id: "Spanish_SophisticatedLady", label: "Sophisticated Lady" },
      { id: "Spanish_Steadymentor", label: "Steadymentor" },
      { id: "Spanish_StrictBoss", label: "Strict Boss" },
      { id: "Spanish_ThoughtfulLady", label: "Thoughtful Lady" },
      { id: "Spanish_ThoughtfulMan", label: "Thoughtful Man" },
      { id: "Spanish_ToughBoss", label: "Tough Boss" },
      { id: "Spanish_WhimsicalGirl", label: "Whimsical Girl" },
      { id: "Spanish_WiseScholar", label: "Wise Scholar" },
      { id: "Spanish_Wiselady", label: "Wiselady" },
    ],
  },
  {
    code: "de-DE",
    label: "Allemand",
    voices: [
      { id: "German_FriendlyMan", label: "Friendly Man" },
      { id: "German_PlayfulMan", label: "Playful Man" },
      { id: "German_SweetLady", label: "Sweet Lady" },
    ],
  },
  {
    code: "it-IT",
    label: "Italien",
    voices: [
      { id: "Italian_BraveHeroine", label: "Brave Heroine" },
      { id: "Italian_DiligentLeader", label: "Diligent Leader" },
      { id: "Italian_Narrator", label: "Narrator" },
      { id: "Italian_WanderingSorcerer", label: "Wandering Sorcerer" },
    ],
  },
  {
    code: "pt-PT",
    label: "Portugais",
    voices: [
      { id: "Portuguese_AngryMan", label: "Angry Man" },
      { id: "Portuguese_AnimeCharacter", label: "Anime Character" },
      { id: "Portuguese_Arnold", label: "Arnold" },
      { id: "Portuguese_AssertiveQueen", label: "Assertive Queen" },
      { id: "Portuguese_AttractiveGirl", label: "Attractive Girl" },
      { id: "Portuguese_BossyLeader", label: "Bossy Leader" },
      { id: "Portuguese_CalmLeader", label: "Calm Leader" },
      { id: "Portuguese_CaptivatingStoryteller", label: "Captivating Storyteller" },
      { id: "Portuguese_CaringGirlfriend", label: "Caring Girlfriend" },
      { id: "Portuguese_CharmingLady", label: "Charming Lady" },
      { id: "Portuguese_CharmingQueen", label: "Charming Queen" },
      { id: "Portuguese_CharmingSanta", label: "Charming Santa" },
      { id: "Portuguese_ChattyGirl", label: "Chatty Girl" },
      { id: "Portuguese_Comedian", label: "Comedian" },
      { id: "Portuguese_CompellingGirl", label: "Compelling Girl" },
      { id: "Portuguese_ConfidentWoman", label: "Confident Woman" },
      { id: "Portuguese_Conscientiousinstructor", label: "Conscientiousinstructor" },
      { id: "Portuguese_Debator", label: "Debator" },
      { id: "Portuguese_DeterminedManager", label: "Determined Manager" },
      { id: "Portuguese_Dramatist", label: "Dramatist" },
      { id: "Portuguese_ElegantGirl", label: "Elegant Girl" },
      { id: "Portuguese_EnergeticBoy", label: "Energetic Boy" },
      { id: "Portuguese_FascinatingBoy", label: "Fascinating Boy" },
      { id: "Portuguese_FragileBoy", label: "Fragile Boy" },
      { id: "Portuguese_FrankLady", label: "Frank Lady" },
      { id: "Portuguese_FriendlyNeighbor", label: "Friendly Neighbor" },
      { id: "Portuguese_Fussyhostess", label: "Fussyhostess" },
      { id: "Portuguese_GentleTeacher", label: "Gentle Teacher" },
      { id: "Portuguese_Ghost", label: "Ghost" },
      { id: "Portuguese_Godfather", label: "Godfather" },
      { id: "Portuguese_GorgeousLady", label: "Gorgeous Lady" },
      { id: "Portuguese_GrimReaper", label: "Grim Reaper" },
      { id: "Portuguese_Grinch", label: "Grinch" },
      { id: "Portuguese_HumorousElder", label: "Humorous Elder" },
      { id: "Portuguese_InspiringLady", label: "Inspiring Lady" },
      { id: "Portuguese_Jovialman", label: "Jovialman" },
      { id: "Portuguese_LovelyLady", label: "Lovely Lady" },
      { id: "Portuguese_MaturePartner", label: "Mature Partner" },
      { id: "Portuguese_Narrator", label: "Narrator" },
      { id: "Portuguese_NaughtySchoolgirl", label: "Naughty Schoolgirl" },
      { id: "Portuguese_PassionateWarrior", label: "Passionate Warrior" },
      { id: "Portuguese_PlayfulGirl", label: "Playful Girl" },
      { id: "Portuguese_PlayfulSpirit", label: "Playful Spirit" },
      { id: "Portuguese_Pompouslady", label: "Pompouslady" },
      { id: "Portuguese_PowerfulSoldier", label: "Powerful Soldier" },
      { id: "Portuguese_PowerfulVeteran", label: "Powerful Veteran" },
      { id: "Portuguese_RationalMan", label: "Rational Man" },
      { id: "Portuguese_ReliableMan", label: "Reliable Man" },
      { id: "Portuguese_ReservedYoungMan", label: "Reserved Young Man" },
      { id: "Portuguese_RomanticHusband", label: "Romantic Husband" },
      { id: "Portuguese_Rudolph", label: "Rudolph" },
      { id: "Portuguese_SadTeen", label: "Sad Teen" },
      { id: "Portuguese_SantaClaus", label: "Santa Claus" },
      { id: "Portuguese_SensibleManager", label: "Sensible Manager" },
      { id: "Portuguese_SentimentalLady", label: "Sentimental Lady" },
      { id: "Portuguese_SereneElder", label: "Serene Elder" },
      { id: "Portuguese_SereneWoman", label: "Serene Woman" },
      { id: "Portuguese_SmartYoungGirl", label: "Smart Young Girl" },
      { id: "Portuguese_Steadymentor", label: "Steadymentor" },
      { id: "Portuguese_StressedLady", label: "Stressed Lady" },
      { id: "Portuguese_StrictBoss", label: "Strict Boss" },
      { id: "Portuguese_SweetGirl", label: "Sweet Girl" },
      { id: "Portuguese_TheatricalActor", label: "Theatrical Actor" },
      { id: "Portuguese_ThoughtfulLady", label: "Thoughtful Lady" },
      { id: "Portuguese_ThoughtfulMan", label: "Thoughtful Man" },
      { id: "Portuguese_ToughBoss", label: "Tough Boss" },
      { id: "Portuguese_UpsetGirl", label: "Upset Girl" },
      { id: "Portuguese_WhimsicalGirl", label: "Whimsical Girl" },
      { id: "Portuguese_WiseScholar", label: "Wise Scholar" },
      { id: "Portuguese_Wiselady", label: "Wiselady" },
    ],
  },
  {
    code: "ru-RU",
    label: "Russe",
    voices: [
      { id: "Russian_AmbitiousWoman", label: "Ambitious Woman" },
      { id: "Russian_AttractiveGuy", label: "Attractive Guy" },
      { id: "Russian_BrightHeroine", label: "Bright Heroine" },
      { id: "Russian_CrazyQueen", label: "Crazy Queen" },
      { id: "Russian_HandsomeChildhoodFriend", label: "Handsome Childhood Friend" },
      { id: "Russian_PessimisticGirl", label: "Pessimistic Girl" },
      { id: "Russian_ReliableMan", label: "Reliable Man" },
    ],
  },
  {
    code: "ar-SA",
    label: "Arabe",
    voices: [
      { id: "Arabic_CalmWoman", label: "Calm Woman" },
      { id: "Arabic_FriendlyGuy", label: "Friendly Guy" },
    ],
  },
  {
    code: "zh-CN",
    label: "Chinois (mandarin)",
    voices: [
      { id: "Chinese (Mandarin)_BashfulGirl", label: "Bashful Girl" },
      { id: "Chinese (Mandarin)_ExplorativeGirl", label: "Explorative Girl" },
      { id: "Chinese (Mandarin)_Gentleman", label: "Gentleman" },
      { id: "Chinese (Mandarin)_IntellectualGirl", label: "Intellectual Girl" },
    ],
  },
  {
    code: "yue-HK",
    label: "Cantonais",
    voices: [
      { id: "Cantonese_CuteGirl", label: "Cute Girl" },
      { id: "Cantonese_GentleLady", label: "Gentle Lady" },
      { id: "Cantonese_KindWoman", label: "Kind Woman" },
      { id: "Cantonese_PlayfulMan", label: "Playful Man" },
    ],
  },
  {
    code: "ja-JP",
    label: "Japonais",
    voices: [
      { id: "Japanese_CalmLady", label: "Calm Lady" },
      { id: "Japanese_ColdQueen", label: "Cold Queen" },
      { id: "Japanese_DecisivePrincess", label: "Decisive Princess" },
      { id: "Japanese_DependableWoman", label: "Dependable Woman" },
      { id: "Japanese_DominantMan", label: "Dominant Man" },
      { id: "Japanese_GenerousIzakayaOwner", label: "Generous Izakaya Owner" },
      { id: "Japanese_GentleButler", label: "Gentle Butler" },
      { id: "Japanese_GracefulMaiden", label: "Graceful Maiden" },
      { id: "Japanese_InnocentBoy", label: "Innocent Boy" },
      { id: "Japanese_IntellectualSenior", label: "Intellectual Senior" },
      { id: "Japanese_KindLady", label: "Kind Lady" },
      { id: "Japanese_LoyalKnight", label: "Loyal Knight" },
      { id: "Japanese_OptimisticYouth", label: "Optimistic Youth" },
      { id: "Japanese_SeriousCommander", label: "Serious Commander" },
      { id: "Japanese_SportyStudent", label: "Sporty Student" },
    ],
  },
  {
    code: "ko-KR",
    label: "Coréen",
    voices: [
      { id: "Korean_AirheadedGirl", label: "Airheaded Girl" },
      { id: "Korean_AthleticGirl", label: "Athletic Girl" },
      { id: "Korean_AthleticStudent", label: "Athletic Student" },
      { id: "Korean_BraveAdventurer", label: "Brave Adventurer" },
      { id: "Korean_BraveFemaleWarrior", label: "Brave Female Warrior" },
      { id: "Korean_BraveYouth", label: "Brave Youth" },
      { id: "Korean_CalmGentleman", label: "Calm Gentleman" },
      { id: "Korean_CalmLady", label: "Calm Lady" },
      { id: "Korean_CaringWoman", label: "Caring Woman" },
      { id: "Korean_CharmingElderSister", label: "Charming Elder Sister" },
      { id: "Korean_CharmingSister", label: "Charming Sister" },
      { id: "Korean_CheerfulBoyfriend", label: "Cheerful Boyfriend" },
      { id: "Korean_CheerfulCoolJunior", label: "Cheerful Cool Junior" },
      { id: "Korean_CheerfulLittleSister", label: "Cheerful Little Sister" },
      { id: "Korean_ChildhoodFriendGirl", label: "Childhood Friend Girl" },
      { id: "Korean_CockyGuy", label: "Cocky Guy" },
      { id: "Korean_ColdGirl", label: "Cold Girl" },
      { id: "Korean_ColdYoungMan", label: "Cold Young Man" },
      { id: "Korean_ConfidentBoss", label: "Confident Boss" },
      { id: "Korean_ConsiderateSenior", label: "Considerate Senior" },
      { id: "Korean_DecisiveQueen", label: "Decisive Queen" },
      { id: "Korean_DominantMan", label: "Dominant Man" },
      { id: "Korean_ElegantPrincess", label: "Elegant Princess" },
      { id: "Korean_EnchantingSister", label: "Enchanting Sister" },
      { id: "Korean_EnthusiasticTeen", label: "Enthusiastic Teen" },
      { id: "Korean_FriendlyBigSister", label: "Friendly Big Sister" },
      { id: "Korean_GentleBoss", label: "Gentle Boss" },
      { id: "Korean_GentleWoman", label: "Gentle Woman" },
      { id: "Korean_HaughtyLady", label: "Haughty Lady" },
      { id: "Korean_InnocentBoy", label: "Innocent Boy" },
      { id: "Korean_IntellectualMan", label: "Intellectual Man" },
      { id: "Korean_IntellectualSenior", label: "Intellectual Senior" },
      { id: "Korean_LonelyWarrior", label: "Lonely Warrior" },
      { id: "Korean_MatureLady", label: "Mature Lady" },
      { id: "Korean_MysteriousGirl", label: "Mysterious Girl" },
      { id: "Korean_OptimisticYouth", label: "Optimistic Youth" },
      { id: "Korean_PlayboyCharmer", label: "Playboy Charmer" },
      { id: "Korean_PossessiveMan", label: "Possessive Man" },
      { id: "Korean_QuirkyGirl", label: "Quirky Girl" },
      { id: "Korean_ReliableSister", label: "Reliable Sister" },
      { id: "Korean_ReliableYouth", label: "Reliable Youth" },
      { id: "Korean_SassyGirl", label: "Sassy Girl" },
      { id: "Korean_ShyGirl", label: "Shy Girl" },
      { id: "Korean_SoothingLady", label: "Soothing Lady" },
      { id: "Korean_StrictBoss", label: "Strict Boss" },
      { id: "Korean_SweetGirl", label: "Sweet Girl" },
      { id: "Korean_ThoughtfulWoman", label: "Thoughtful Woman" },
      { id: "Korean_WiseElf", label: "Wise Elf" },
      { id: "Korean_WiseTeacher", label: "Wise Teacher" },
    ],
  },
  {
    code: "id-ID",
    label: "Indonésien",
    voices: [
      { id: "Indonesian_BossyLeader", label: "Bossy Leader" },
      { id: "Indonesian_CalmWoman", label: "Calm Woman" },
      { id: "Indonesian_CaringMan", label: "Caring Man" },
      { id: "Indonesian_CharmingGirl", label: "Charming Girl" },
      { id: "Indonesian_ConfidentWoman", label: "Confident Woman" },
      { id: "Indonesian_DeterminedBoy", label: "Determined Boy" },
      { id: "Indonesian_GentleGirl", label: "Gentle Girl" },
      { id: "Indonesian_ReservedYoungMan", label: "Reserved Young Man" },
      { id: "Indonesian_SweetGirl", label: "Sweet Girl" },
    ],
  },
  {
    code: "tr-TR",
    label: "Turc",
    voices: [
      { id: "Turkish_CalmWoman", label: "Calm Woman" },
      { id: "Turkish_Trustworthyman", label: "Trustworthyman" },
    ],
  },
  {
    code: "uk-UA",
    label: "Ukrainien",
    voices: [
      { id: "Ukrainian_CalmWoman", label: "Calm Woman" },
      { id: "Ukrainian_WiseScholar", label: "Wise Scholar" },
    ],
  },
  {
    code: "special",
    label: "Voix spéciales",
    voices: [
      { id: "Arrogant_Miss", label: "Arrogant Miss" },
      { id: "Robot_Armor", label: "Robot Armor" },
    ],
  },
];

// Vue "plate" pour les consommateurs existants (studio-talkinghead-models.ts
// -> generate-studio-talkinghead / check-studio-talkinghead-status), qui ne
// connaissent que voice.id + language, pas la notion de groupe.
export interface TalkingHeadVoice {
  id: string;
  label: string;
  language: string; // code langue (indicatif, cf. buildTtsTask)
  languageLabel: string;
}

export const TTS_VOICES: TalkingHeadVoice[] = TTS_LANGUAGES.flatMap((group) =>
  group.voices.map((v) => ({
    id: v.id,
    label: `${group.label} — ${v.label}`,
    language: group.code,
    languageLabel: group.label,
  })),
);

export const DEFAULT_TTS_VOICE = "French_MaleNarrator";

export const TTS_MODEL_ID = "minimax:speech@2.8";

// Réglages expressifs (vitesse / volume / hauteur / émotion) — PAS documentés
// sur la page Runware du modèle (qui ne couvre que text/voice), mais acceptés
// par l'API : constaté en direct le 2026-09-19 via le message d'erreur "502"
// obtenu en envoyant un champ invalide ("speech[language]"), qui listait les
// clés réellement acceptées par `speech` : text, voice, speed, volume, pitch,
// emotion, tone. Runware ne documentant ni les bornes ni les valeurs
// acceptées pour ces 4 champs (tone en plus, mis de côté ci-dessous faute de
// toute source), on reprend celles de l'API MiniMax T2A sous-jacente
// (voice_setting.speed/vol/pitch/emotion — platform.minimax.io/docs/
// api-reference/speech-t2a-http), Runware étant un simple passe-plat vers les
// modèles tiers pour audioInference. À corriger si Runware renvoie une erreur
// de validation sur l'un de ces champs (nom différent, bornes différentes) ou
// si un test réel montre un comportement audible différent des bornes
// ci-dessous.
export const TTS_SPEED_RANGE = { min: 0.5, max: 2, default: 1 };
// Doc MiniMax : "(0, 10]" (strictement positif) — borne basse remontée à 0.1
// pour rester dans l'intervalle ouvert sans jamais envoyer 0.
export const TTS_VOLUME_RANGE = { min: 0.1, max: 10, default: 1 };
export const TTS_PITCH_RANGE = { min: -12, max: 12, default: 0 };

export interface TtsEmotion {
  id: string;
  label: string;
}

// 7 valeurs documentées côté MiniMax T2A (speech-02) ; "tone" laissé de côté
// (cf. commentaire ci-dessus, aucune source ne documente ses valeurs).
// Aucune valeur sélectionnée par défaut : MiniMax choisit alors l'émotion la
// "plus naturelle" selon le texte — recommandé par leur propre doc plutôt que
// de forcer une émotion à chaque génération.
export const TTS_EMOTIONS: TtsEmotion[] = [
  { id: "happy", label: "Joyeux" },
  { id: "sad", label: "Triste" },
  { id: "angry", label: "En colère" },
  { id: "fearful", label: "Apeuré" },
  { id: "disgusted", label: "Dégoûté" },
  { id: "surprised", label: "Surpris" },
  { id: "neutral", label: "Neutre" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface TtsControls {
  speed?: number;
  volume?: number;
  pitch?: number;
  emotion?: string;
}

// "language" N'EST PAS un champ accepté par "speech" pour ce modèle — bug
// constaté en direct le 2026-09-19 (502 sur les 3 modules TTS) : Runware
// renvoie "Unsupported use of 'speech[language]' parameter... Allowed
// values are: text, voice, speed, volume, pitch, emotion, tone". La langue
// est déjà portée par le choix de voix (ex. "French_MaleNarrator") — pas
// besoin de la répéter, corrigé en la retirant du payload envoyé à Runware
// (le champ `language` reste dans TalkingHeadVoice/la ligne en base pour
// l'UI et les prompts de traduction, juste plus transmis tel quel ici).
//
// speed/volume/pitch/emotion sont optionnels et omis du payload quand non
// fournis (plutôt que d'envoyer les valeurs par défaut explicitement) : pour
// `emotion` en particulier, l'omission déclenche le choix automatique de
// MiniMax, alors qu'envoyer "neutral" forcerait une émotion neutre même sur
// un texte manifestement joyeux ou triste — cf. TTS_EMOTIONS ci-dessus.
export function buildTtsTask({ text, voice, speed, volume, pitch, emotion }: { text: string; voice: string } & TtsControls): Record<string, unknown> {
  const speech: Record<string, unknown> = { text, voice };
  if (speed !== undefined) speech.speed = clamp(speed, TTS_SPEED_RANGE.min, TTS_SPEED_RANGE.max);
  if (volume !== undefined) speech.volume = clamp(volume, TTS_VOLUME_RANGE.min, TTS_VOLUME_RANGE.max);
  if (pitch !== undefined) speech.pitch = Math.round(clamp(pitch, TTS_PITCH_RANGE.min, TTS_PITCH_RANGE.max));
  if (emotion && TTS_EMOTIONS.some((e) => e.id === emotion)) speech.emotion = emotion;
  return {
    taskType: "audioInference",
    model: TTS_MODEL_ID,
    outputFormat: "MP3",
    speech,
  };
}
