// Crée les 2 comptes de démo (1 élève, 1 admin) via l'API Admin de Supabase.
// Nécessite la clé service_role (jamais utilisée côté client) — à faire tourner
// UNIQUEMENT en local :
//
//   1. Supabase Dashboard → Settings → API → copier la clé "service_role"
//   2. L'ajouter dans .env (déjà ignoré par git) :
//        SUPABASE_SERVICE_ROLE_KEY=xxxxx
//   3. npm run seed:users
//
// Si Supabase refuse "yulia"/"admin" comme mot de passe (politique par défaut :
// 6 caractères minimum), baisse le minimum dans Authentication → Policies,
// ou relance avec des mots de passe plus longs.

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Il manque SUPABASE_URL (ou VITE_SUPABASE_URL) et/ou SUPABASE_SERVICE_ROLE_KEY dans ton .env.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const SEED_USERS = [
  {
    email: "yulia@example.com",
    password: "yulia",
    role: "student",
    first_name: "Yulia",
    onboarding: {
      age: "22",
      profession: "Étudiante",
      goal: "Apprendre l'IA d'une manière efficace pour lancer une start-up et réussir dans le partenariat.",
      goal_detail: null,
      learning_style: null,
      ai_tutor_persona: null,
    },
  },
  {
    email: "admin@example.com",
    password: "admin",
    role: "admin",
    first_name: "Admin",
    onboarding: {
      age: "30",
      profession: "Admin",
      goal: null,
      goal_detail: null,
      learning_style: null,
      ai_tutor_persona: null,
    },
  },
];

for (const u of SEED_USERS) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });

  if (error) {
    console.error(`✗ ${u.email}: ${error.message}`);
    continue;
  }

  const userId = data.user.id;

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: u.role, first_name: u.first_name, must_onboard: false })
    .eq("id", userId);
  if (profileError) console.error(`  → mise à jour du profil échouée pour ${u.email}: ${profileError.message}`);

  const { error: onboardingError } = await admin
    .from("student_onboarding")
    .upsert({ user_id: userId, ...u.onboarding });
  if (onboardingError) console.error(`  → upsert onboarding échoué pour ${u.email}: ${onboardingError.message}`);

  console.log(`✓ ${u.email} (${u.role}) — mot de passe : ${u.password}`);
}
