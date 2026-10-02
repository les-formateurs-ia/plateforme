// Règles de mot de passe du lien "Définir votre mot de passe" (Edge Function
// password-setup). Dupliqué côté client dans src/app/lib/passwordPolicy.ts
// pour la checklist en direct — à garder en phase : c'est cette version
// serveur qui fait foi.
export const PASSWORD_MIN_LENGTH = 10;
// bcrypt (utilisé par Supabase Auth) ignore tout au-delà de 72 octets, et
// Supabase Auth refuse ces mots de passe : on le signale avant.
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: `Au moins ${PASSWORD_MIN_LENGTH} caractères`, test: (p) => [...p].length >= PASSWORD_MIN_LENGTH },
  { label: "Une lettre minuscule", test: (p) => /\p{Ll}/u.test(p) },
  { label: "Une lettre majuscule", test: (p) => /\p{Lu}/u.test(p) },
  { label: "Un chiffre", test: (p) => /\d/.test(p) },
];

// Premier problème rencontré, formulé pour l'élève — null si le mot de passe convient.
export function passwordProblem(password: string, email: string): string | null {
  if (!password) return "Choisis un mot de passe.";
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `Mot de passe trop long (${PASSWORD_MAX_BYTES} caractères maximum, moins avec des accents).`;
  }
  const missing = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label.toLowerCase());
  if (missing.length) return `Mot de passe trop faible — il manque : ${missing.join(", ")}.`;
  if (password.trim().toLowerCase() === email.trim().toLowerCase()) {
    return "Ton mot de passe ne doit pas être ton adresse e-mail.";
  }
  return null;
}
