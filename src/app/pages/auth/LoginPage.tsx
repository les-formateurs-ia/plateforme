import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { AuthShell, AuthField } from "@/app/components/common/AuthShell";
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
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <p className="eyebrow mb-3" style={{ color: th.fg3 }}>Espace apprenant</p>
        <h1 className="text-[2.1rem] sm:text-[2.5rem] font-black leading-[1.02] mb-3">
          Content de te <GT>revoir</GT>
        </h1>
        <p className="text-base mb-8" style={{ color: th.fg2 }}>Connecte-toi pour reprendre ton parcours.</p>

        <div className="space-y-5">
          <AuthField label="Email">
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@exemple.com" className="w-full rounded-[4px] px-4 py-3 text-base g-input" />
          </AuthField>
          <AuthField label="Mot de passe">
            <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-[4px] px-4 py-3 text-base g-input" />
          </AuthField>
        </div>

        {error && <p role="alert" className="text-sm mt-4 rounded-[4px] px-3.5 py-2.5" style={{ background: "rgba(239,138,116,0.12)", color: th.isDark ? "#fbc2ad" : "#b4442b" }}>{error}</p>}

        <div className="pt-7">
          <ShimBtn full disabled={loading}>
            {loading ? "Connexion…" : <>Se connecter<ArrowRight className="w-5 h-5" /></>}
          </ShimBtn>
        </div>

        <p className="text-sm mt-6 pt-6" style={{ color: th.fg2, borderTop: `1px solid ${th.sep}` }}>
          Pas encore de compte ? <Link to="/signup" className="ink-link font-semibold" style={{ color: th.fg, backgroundSize: "100% 1px" }}>Créer un compte</Link>
        </p>
      </form>
    </AuthShell>
  );
}
