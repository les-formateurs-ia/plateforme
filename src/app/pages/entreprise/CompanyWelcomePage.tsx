import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { KeyRound } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { supabase } from "@/app/lib/supabase/client";
import { AuthShell } from "@/app/components/common/AuthShell";
import { IconBadge, HueButton, ErrorText } from "@/app/components/entreprise/EntrepriseKit";
import { GT } from "@/app/components/common/GT";

// Suite du lien d'invitation envoyé par le formateur (voir Edge Function
// send-company-invite) : la session est déjà active à ce stade (supabase-js
// parse le lien d'invite dans le hash au chargement), il ne reste qu'à
// définir le mot de passe puis lever must_onboard.
export function CompanyWelcomePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, markOnboarded } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Mot de passe trop court (6 caractères minimum)."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!user) { setError("Session invalide — réouvre le lien reçu par email."); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw pwError;
      const { error: profileError } = await supabase.from("profiles").update({ must_onboard: false }).eq("id", user.id);
      if (profileError) throw profileError;
      markOnboarded();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell aside={{ eyebrow: "Espace entreprise", title: "La formation IA de votre équipe, au même endroit.", lead: "Contenus, quiz de positionnement, exercices et suivi des résultats de vos collaborateurs." }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-5"><IconBadge Icon={KeyRound} size="lg" /></div>
            <h1 className="text-[2.1rem] sm:text-[2.5rem] font-black leading-[1.02] mb-3">
              <GT>Bienvenue !</GT>
            </h1>
            <p className="text-base mb-8" style={{ color: th.fg2 }}>Choisis ton mot de passe pour accéder à ton espace entreprise.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: th.fg }}>Mot de passe</label>
                <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-[4px] px-4 py-3 text-base g-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: th.fg }}>Confirmer</label>
                <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="w-full rounded-[4px] px-4 py-3 text-base g-input" />
              </div>
            </div>

            {error && <div className="mt-3"><ErrorText>{error}</ErrorText></div>}

            <div className="pt-6">
              <HueButton type="submit" full Icon={loading ? undefined : KeyRound} disabled={loading}>
                {loading ? "Enregistrement…" : "Définir mon mot de passe"}
              </HueButton>
            </div>
          </form>
    </AuthShell>
  );
}
