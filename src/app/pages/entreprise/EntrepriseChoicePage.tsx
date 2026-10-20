import { Building2, GraduationCap, Target } from "lucide-react";
import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { AuthShell } from "@/app/components/common/AuthShell";
import { SectionTile } from "@/app/components/entreprise/SectionTiles";
import { GT } from "@/app/components/common/GT";
import { useStaffBasePath } from "@/app/lib/staffBase";
import { isAdmin } from "@/app/lib/permissions";

// Porte d'entrée du staff (admin/formateur) — rendue seule, hors MainLayout
// (comme LoginPage), pour qu'aucune navigation de la plateforme (CPF ou
// Entreprise) ne soit accessible tant que le choix n'a pas été fait. Chaque
// carte mène vers son espace, qui lui affiche la barre latérale complète.
export function EntrepriseChoicePage() {
  const th = useTh();
  const navigate = useNavigate();
  const staffBase = useStaffBasePath();
  const { signOut, role } = useAuth();

  const CHOICES = [
    { icon: GraduationCap, title: "E-learning CPF", desc: "Formations, leçons et suivi des élèves CPF.", path: `${staffBase}/courses`, hue: "violet" as const },
    { icon: Building2, title: "Entreprise", desc: "Entreprises, collaborateurs, contenu et suivi B2B.", path: "/entreprise", hue: "teal" as const },
    // Suivi commercial des demandes du site : réservé à l'admin.
    ...(isAdmin(role) ? [{ icon: Target, title: "Prospects", desc: "Demandes du site, appels, rappels et suivi commercial.", path: "/prospects", hue: "peach" as const }] : []),
  ];

  return (
    <AuthShell width={CHOICES.length > 2 ? 900 : 640} aside={{ eyebrow: "Équipe pédagogique", title: CHOICES.length > 2 ? "Trois espaces, une même équipe." : "Deux espaces, une même équipe de formateurs.", lead: CHOICES.length > 2 ? "Le parcours e-learning CPF, la formation des entreprises et le suivi des prospects." : "Le parcours e-learning CPF d'un côté, la formation des entreprises de l'autre." }}>
        <p className="eyebrow mb-3" style={{ color: th.fg3 }}>Bienvenue</p>
        <h1 className="text-[2.1rem] sm:text-[2.5rem] font-black leading-[1.02] mb-3">
          Où souhaitez-vous <GT>aller ?</GT>
        </h1>
        <p className="text-base mb-8" style={{ color: th.fg2 }}>Choisissez un espace pour continuer.</p>
        <div className={CHOICES.length > 2 ? "grid sm:grid-cols-3 gap-4" : "grid sm:grid-cols-2 gap-4"}>
          {CHOICES.map(({ icon, title, desc, path, hue }, i) => (
            <SectionTile key={title} index={i} label={title} desc={desc} Icon={icon} hue={hue} onClick={() => navigate(path)} />
          ))}
        </div>
        <button onClick={() => void signOut()} className="ink-link mt-8 text-sm font-semibold" style={{ color: th.fg2 }}>
          Se déconnecter
        </button>
    </AuthShell>
  );
}
