import { Building2, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";
import { SectionTile } from "@/app/components/entreprise/SectionTiles";
import { GT } from "@/app/components/common/GT";
import { useStaffBasePath } from "@/app/lib/staffBase";

// Porte d'entrée du staff (admin/formateur) — rendue seule, hors MainLayout
// (comme LoginPage), pour qu'aucune navigation de la plateforme (CPF ou
// Entreprise) ne soit accessible tant que le choix n'a pas été fait. Chaque
// carte mène vers son espace, qui lui affiche la barre latérale complète.
export function EntrepriseChoicePage() {
  const th = useTh();
  const navigate = useNavigate();
  const staffBase = useStaffBasePath();
  const { signOut } = useAuth();

  const CHOICES = [
    { icon: GraduationCap, title: "E-learning CPF", desc: "Formations, leçons et suivi des élèves CPF.", path: `${staffBase}/courses`, hue: "violet" as const },
    { icon: Building2, title: "Entreprise", desc: "Entreprises, collaborateurs, contenu et suivi B2B.", path: "/entreprise", hue: "teal" as const },
  ];

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <div className="relative z-10 w-full max-w-2xl fade-up">
        <div className="flex justify-center mb-10"><Logo h={30} /></div>
        <h2 className="text-2xl font-black text-center mb-2">
          <GT>Où souhaitez-vous aller ?</GT>
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: th.fg3 }}>Choisissez un espace pour continuer.</p>
        <div className="grid sm:grid-cols-2 gap-5">
          {CHOICES.map(({ icon, title, desc, path, hue }, i) => (
            <SectionTile key={title} index={i} label={title} desc={desc} Icon={icon} hue={hue} onClick={() => navigate(path)} />
          ))}
        </div>
        <button onClick={() => void signOut()} className="block mx-auto mt-8 text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: th.fg3 }}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
