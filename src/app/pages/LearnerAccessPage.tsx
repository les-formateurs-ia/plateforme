import { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useTh } from "@/app/theme/theme";
import { Logo } from "@/app/components/common/Logo";
import { Background } from "@/app/components/common/Background";
import { useAuth } from "@/app/state/auth-context";
import { supabase } from "@/app/lib/supabase/client";

function Waiting({ message }: { message: string }) {
  const th = useTh();
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6" style={{ background: th.bg }}>
      <Background />
      <Logo h={28} />
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: th.sep, borderTopColor: th.ink }} />
      <p className="text-sm" style={{ color: th.fg2 }}>{message}</p>
    </div>
  );
}

// Passe la main à une edge function publique (learner-access) qui connecte
// sans mot de passe puis redirige vers l'espace : l'adresse partagée reste
// celle de la plateforme.
function TokenRedirect({ fn, message }: { fn: string; message: string }) {
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    const base = import.meta.env.VITE_SUPABASE_URL;
    window.location.replace(`${base}/functions/v1/${fn}?t=${encodeURIComponent(token ?? "")}`);
  }, [fn, token]);

  return <Waiting message={message} />;
}

// visitor-access ouvre le compte de démonstration et renvoie un jeton de
// connexion à usage unique, échangé ici contre une session.
function OpenVisit({ message }: { message: string }) {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fail = (reason: string) => navigate(`/login?visite=${encodeURIComponent(reason)}`, { replace: true });
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visitor-access?t=${encodeURIComponent(token ?? "")}`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        });
        const body = await res.json().catch(() => null);
        if (!body?.tokenHash) return fail(body?.error ?? "creation");
        const { error } = await supabase.auth.verifyOtp({ token_hash: body.tokenHash, type: "magiclink" });
        if (error) return fail("lien_connexion");
        navigate("/", { replace: true });
      } catch {
        fail("creation");
      }
    })();
  }, [navigate, token]);

  return <Waiting message={message} />;
}

// Bouton des e-mails de formation (/acces/:jeton) : connecte le stagiaire à
// son espace.
export function LearnerAccessPage() {
  return <TokenRedirect fn="learner-access" message="Connexion à votre espace formation…" />;
}

// Lien Visiteur diffusé aux prospects (/visite/:jeton). Ce navigateur a déjà
// sa visite ouverte : on la reprend (même compte, mêmes crédits). Sinon,
// visitor-access ouvre un compte de démonstration (cf. lib/visitor.ts).
export function VisitorAccessPage() {
  const { status, isVisitor, profileLoading } = useAuth();
  const message = "Ouverture de votre visite de la plateforme…";
  if (status === "loading" || (status === "authenticated" && profileLoading)) return <Waiting message={message} />;
  if (status === "authenticated" && isVisitor) return <Navigate to="/" replace />;
  return <OpenVisit message={message} />;
}
