import { useEffect } from "react";
import { useParams } from "react-router";
import { useTh } from "@/app/theme/theme";
import { Logo } from "@/app/components/common/Logo";
import { Background } from "@/app/components/common/Background";

// Bouton des e-mails de formation (/acces/:jeton) : passe la main à la
// fonction learner-access, qui connecte le stagiaire à son espace sans mot de
// passe. L'adresse reste celle de la plateforme dans l'e-mail.
export function LearnerAccessPage() {
  const th = useTh();
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    const base = import.meta.env.VITE_SUPABASE_URL;
    window.location.replace(`${base}/functions/v1/learner-access?t=${encodeURIComponent(token ?? "")}`);
  }, [token]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6" style={{ background: th.bg }}>
      <Background />
      <Logo h={28} />
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: th.sep, borderTopColor: th.ink }} />
      <p className="text-sm" style={{ color: th.fg2 }}>Connexion à votre espace formation…</p>
    </div>
  );
}
