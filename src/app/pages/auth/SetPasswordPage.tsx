import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { Check, Eye, EyeOff, KeyRound, LinkIcon, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { PASSWORD_RULES, passwordProblem } from "@/app/lib/passwordPolicy";
import { completePasswordSetup, inspectPasswordLink, PasswordSetupError } from "@/app/lib/passwordSetup";

type LinkState =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "unavailable"; message: string }
  | { kind: "ready"; firstName: string | null; email: string };

// Page publique /definir-mot-de-passe#<jeton> : lien généré par l'admin
// depuis la fiche élève ("Générer le lien"). L'élève y remplace le mot de
// passe de test par le sien, sur son compte existant, puis est connecté.
// Toute la validation (jeton, expiration, usage unique, compte visé) se fait
// côté serveur — cf. supabase/functions/password-setup.
export function SetPasswordPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { signIn } = useAuth();
  const token = hash.replace(/^#/, "");
  const [linkState, setLinkState] = useState<LinkState>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLinkState({ kind: "loading" });
    if (!token) { setLinkState({ kind: "invalid" }); return; }
    inspectPasswordLink(token)
      .then((info) => { if (!cancelled) setLinkState(info.valid ? { kind: "ready", firstName: info.firstName, email: info.email } : { kind: "invalid" }); })
      .catch((err) => { if (!cancelled) setLinkState({ kind: "unavailable", message: err instanceof Error ? err.message : "Service indisponible." }); });
    return () => { cancelled = true; };
  }, [token, reloadCount]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (linkState.kind !== "ready") return;
    const problem = passwordProblem(password, linkState.email);
    if (problem) { setError(problem); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setError(null);
    setSaving(true);
    try {
      const email = await completePasswordSetup(token, password);
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError("Mot de passe enregistré, mais la connexion automatique a échoué. Connecte-toi avec ton nouveau mot de passe.");
        setSaving(false);
        return;
      }
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof PasswordSetupError && err.invalidLink) { setLinkState({ kind: "invalid" }); return; }
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setSaving(false);
    }
  };

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <div className="relative z-10 w-full max-w-[440px] fade-up">
        <div className="flex justify-center mb-10"><Logo h={30} /></div>
        <GCard glow>
          {linkState.kind === "loading" && (
            <p className="p-6 sm:p-8 lg:p-10 text-sm text-center" style={{ color: th.fg3 }}>Vérification du lien…</p>
          )}

          {linkState.kind === "invalid" && (
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(251,194,173,0.12)" }}>
                <LinkIcon className="w-5 h-5" style={{ color: "#fbc2ad" }} />
              </div>
              <h1 className="text-2xl font-black leading-tight mb-2"><GT>Lien invalide ou expiré</GT></h1>
              <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>
                Ce lien n'est plus valable : il a peut-être expiré, déjà servi, ou été remplacé par un lien plus récent.
              </p>
              <p className="text-sm leading-relaxed mt-3" style={{ color: th.fg2 }}>
                Contacte ton administrateur pour recevoir un nouveau lien.
              </p>
              <p className="text-xs mt-6" style={{ color: th.fg3 }}>
                Tu as déjà défini ton mot de passe ? <Link to="/login" style={{ color: th.navAC }} className="font-semibold hover:opacity-80">Se connecter</Link>
              </p>
            </div>
          )}

          {linkState.kind === "unavailable" && (
            <div className="p-6 sm:p-8 lg:p-10">
              <h1 className="text-2xl font-black leading-tight mb-2"><GT>Un instant…</GT></h1>
              <p className="text-sm mb-6" style={{ color: th.fg2 }}>{linkState.message}</p>
              <ShimBtn full onClick={() => setReloadCount((n) => n + 1)}>Réessayer</ShimBtn>
            </div>
          )}

          {linkState.kind === "ready" && (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10" noValidate>
              <h1 className="text-2xl font-black leading-tight mb-2 break-words">
                <GT>{linkState.firstName ? `Bonjour ${linkState.firstName} !` : "Bonjour !"}</GT>
              </h1>
              <p className="text-sm mb-6" style={{ color: th.fg3 }}>
                Choisis ton mot de passe personnel : il remplacera celui qui t'a été fourni. Ton profil et ta progression sont conservés.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="sp-email" className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Adresse e-mail</label>
                  <input id="sp-email" type="email" readOnly aria-readonly="true" autoComplete="username" value={linkState.email} className="w-full rounded-xl px-4 py-3 text-sm g-input cursor-not-allowed" style={{ opacity: 0.7 }} />
                </div>
                <div>
                  <label htmlFor="sp-password" className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Nouveau mot de passe</label>
                  <div className="relative">
                    <input id="sp-password" type={showPassword ? "text" : "password"} required autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" className="w-full rounded-xl pl-4 pr-11 py-3 text-sm g-input" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70" style={{ color: th.fg3 }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5" aria-label="Exigences du mot de passe">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <li key={rule.label} className="flex items-center gap-1.5 text-xs" style={{ color: ok ? th.fg2 : th.fg3 }}>
                          {ok ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#22c55e" }} /> : <X className="w-3.5 h-3.5 shrink-0" style={{ opacity: 0.6 }} />}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <label htmlFor="sp-confirm" className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Confirmer le mot de passe</label>
                  <input id="sp-confirm" type={showPassword ? "text" : "password"} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••••" className="w-full rounded-xl px-4 py-3 text-sm g-input" />
                  {mismatch && <p className="text-xs mt-1.5" style={{ color: "#fbc2ad" }}>Les deux mots de passe ne correspondent pas.</p>}
                </div>
              </div>

              {error && <p role="alert" className="text-xs mt-3" style={{ color: "#fbc2ad" }}>{error}</p>}

              <div className="pt-6">
                <ShimBtn full disabled={saving}>
                  <span className="flex items-center justify-center gap-2.5">
                    {saving ? "Enregistrement…" : <><KeyRound className="w-5 h-5" />Définir mon mot de passe</>}
                  </span>
                </ShimBtn>
              </div>
            </form>
          )}
        </GCard>
      </div>
    </div>
  );
}
