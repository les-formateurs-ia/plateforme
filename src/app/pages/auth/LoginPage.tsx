import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";

export function LoginPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error); return; }
    navigate("/");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <div className="relative z-10 w-full max-w-[440px] fade-up">
        <div className="flex justify-center mb-10"><Logo h={30} /></div>
        <GCard glow>
          <form onSubmit={handleSubmit} className="p-8 sm:p-10">
            <h1 className="text-2xl font-black leading-tight mb-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}>
              <GT from={th.isDark ? "#FFFFFF" : "#b58de0"} to={th.isDark ? "#dbacf0" : "#dbacf0"}>Content de te revoir</GT>
            </h1>
            <p className="text-sm mb-6" style={{ color: th.fg3 }}>Connecte-toi pour reprendre ton parcours.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Email</label>
                <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@exemple.com" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Mot de passe</label>
                <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
              </div>
            </div>

            {error && <p className="text-xs mt-3" style={{ color: "#fbc2ad" }}>{error}</p>}

            <div className="pt-6">
              <ShimBtn full disabled={loading}>
                <span className="flex items-center justify-center gap-2.5">
                  {loading ? "Connexion…" : <><Sparkles className="w-5 h-5" />Se connecter</>}
                </span>
              </ShimBtn>
            </div>

            <p className="text-xs text-center mt-5" style={{ color: th.fg3 }}>
              Pas encore de compte ? <Link to="/signup" style={{ color: th.navAC }} className="font-semibold hover:opacity-80">Créer un compte</Link>
            </p>
          </form>
        </GCard>
      </div>
    </div>
  );
}
