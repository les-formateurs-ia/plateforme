import { useEffect } from "react";
import { useParams } from "react-router";
import { useTh } from "@/app/theme/theme";
import { Logo } from "@/app/components/common/Logo";
import { Background } from "@/app/components/common/Background";

// Passe la main à une edge function publique (learner-access, visitor-access)
// qui connecte sans mot de passe puis redirige vers l'espace : l'adresse
// partagée reste celle de la plateforme.
function TokenRedirect({ fn, message }: { fn: string; message: string }) {
  const th = useTh();
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    const base = import.meta.env.VITE_SUPABASE_URL;
    window.location.replace(`${base}/functions/v1/${fn}?t=${encodeURIComponent(token ?? "")}`);
  }, [fn, token]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6" style={{ background: th.bg }}>
      <Background />
      <Logo h={28} />
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: th.sep, borderTopColor: th.ink }} />
      <p className="text-sm" style={{ color: th.fg2 }}>{message}</p>
    </div>
  );
}

// Bouton des e-mails de formation (/acces/:jeton) : connecte le stagiaire à
// son espace.
export function LearnerAccessPage() {
  return <TokenRedirect fn="learner-access" message="Connexion à votre espace formation…" />;
}

// Lien Visiteur envoyé à un prospect (/visite/:jeton) : ouvre le compte de
// démonstration (cf. lib/visitor.ts).
export function VisitorAccessPage() {
  return <TokenRedirect fn="visitor-access" message="Ouverture de votre visite de la plateforme…" />;
}
