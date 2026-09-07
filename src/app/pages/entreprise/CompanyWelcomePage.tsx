import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { KeyRound } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { supabase } from "@/app/lib/supabase/client";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";

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
    <div className="relative min-h-screen flex items-center justify-center p-4" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <div className="relative z-10 w-full max-w-[440px] fade-up">
        <div className="flex justify-center mb-10"><Logo h={30} /></div>
        <GCard glow>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10">
            <h1 className="text-2xl font-black leading-tight mb-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}>
              <GT>Bienvenue !</GT>
            </h1>
            <p className="text-sm mb-6" style={{ color: th.fg3 }}>Choisis ton mot de passe pour accéder à ton espace entreprise.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Mot de passe</label>
                <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Confirmer</label>
                <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
              </div>
            </div>

            {error && <p className="text-xs mt-3" style={{ color: "#fbc2ad" }}>{error}</p>}

            <div className="pt-6">
              <ShimBtn full disabled={loading}>
                <span className="flex items-center justify-center gap-2.5">
                  {loading ? "Enregistrement…" : <><KeyRound className="w-5 h-5" />Définir mon mot de passe</>}
                </span>
              </ShimBtn>
            </div>
          </form>
        </GCard>
      </div>
    </div>
  );
}
