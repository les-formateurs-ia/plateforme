// Accès direct d'un stagiaire depuis un e-mail de formation (bouton
// « Accéder à mon espace » → /acces/:jeton → ici). Le jeton personnel et
// durable de l'inscription (training_session_trainees.access_token) fait
// foi : la fonction prépare le compte apprenant si besoin (formation
// entreprise : compte créé et rattaché à l'entreprise, sans mot de passe à
// choisir), puis génère un lien de connexion à usage unique et y redirige.
// Ne connecte jamais un compte admin ou formateur.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";

Deno.serve(async (req) => {
  const frontendUrl = (Deno.env.get("FRONTEND_URL") ?? "https://plateforme.les-formateurs-ia.fr").replace(/\/$/, "");
  const fail = (reason: string) => {
    console.error("learner-access:", reason);
    return Response.redirect(`${frontendUrl}/login?acces=${encodeURIComponent(reason.split(":")[0])}`, 302);
  };

  try {
    const token = new URL(req.url).searchParams.get("t") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(token)) return fail("lien_invalide");

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: trainee } = await db.from("training_session_trainees")
      .select("id, session_id, profile_id, prenom, nom, email").eq("access_token", token).maybeSingle();
    if (!trainee) return fail("lien_invalide");
    const { data: session } = await db.from("training_sessions").select("company_id").eq("id", trainee.session_id).maybeSingle();
    const companyId: string | null = session?.company_id ?? null;
    const email = trainee.email.trim().toLowerCase();

    // Compte apprenant : celui déjà rattaché, sinon celui de même e-mail,
    // sinon (formation entreprise) un nouveau compte confirmé sans mot de passe.
    let profileId: string | null = trainee.profile_id;
    let createdNow = false;
    if (!profileId) {
      const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
      profileId = existing?.id ?? null;
    }
    if (!profileId) {
      if (!companyId) return fail("compte_absent");
      const { data: created, error } = await db.auth.admin.createUser({
        email, email_confirm: true, user_metadata: { company_id: companyId, first_name: trainee.prenom, last_name: trainee.nom },
      });
      if (error || !created?.user) return fail(`creation_impossible: ${error?.message}`);
      profileId = created.user.id;
      createdNow = true;
    }

    const { data: profile } = await db.from("profiles").select("id, role, email, company_id, must_onboard").eq("id", profileId).maybeSingle();
    if (!profile) return fail("compte_absent");
    if (profile.role !== "student") return fail("compte_non_apprenant");

    // Un compte existant (élève CPF…) n'est jamais converti : seul un compte
    // créé ici, ou déjà collaborateur de cette entreprise, y est rattaché.
    if (companyId && (createdNow || profile.company_id === companyId)) {
      // Rattachement à l'entreprise ; pas d'étape « mot de passe » : l'accès
      // passe par les liens reçus par e-mail.
      await db.from("profiles").update({ company_id: companyId, first_name: trainee.prenom, last_name: trainee.nom, must_onboard: false }).eq("id", profileId);
      const nowIso = new Date().toISOString();
      await db.from("company_employees").upsert(
        { company_id: companyId, first_name: trainee.prenom, last_name: trainee.nom, email, profile_id: profileId, invite_accepted_at: nowIso },
        { onConflict: "company_id,email" },
      );
    }
    if (!trainee.profile_id) await db.from("training_session_trainees").update({ profile_id: profileId }).eq("id", trainee.id);

    const { data: link, error: linkError } = await db.auth.admin.generateLink({
      type: "magiclink", email: profile.email, options: { redirectTo: `${frontendUrl}/` },
    });
    const actionLink = link?.properties?.action_link;
    if (linkError || !actionLink) return fail(`lien_connexion: ${linkError?.message}`);
    return Response.redirect(actionLink, 302);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "erreur");
  }
});
