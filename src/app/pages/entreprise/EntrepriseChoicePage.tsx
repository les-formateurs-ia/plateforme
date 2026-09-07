import { Building2, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { useStaffBasePath } from "@/app/lib/staffBase";

export function EntrepriseChoicePage() {
  const th = useTh();
  const navigate = useNavigate();
  const staffBase = useStaffBasePath();

  const CHOICES = [
    { icon: GraduationCap, title: "E-learning CPF", desc: "Formations, leçons et suivi des élèves CPF.", path: `${staffBase}/courses` },
    { icon: Building2, title: "Entreprise", desc: "Entreprises, collaborateurs, contenu et suivi B2B.", path: "/entreprise" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-black text-center mb-2" style={{ fontFamily: "'Funnel Display',sans-serif" }}>
          <GT>Où souhaitez-vous aller ?</GT>
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: th.fg3 }}>Choisissez un espace pour continuer.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {CHOICES.map(({ icon: Icon, title, desc, path }) => (
            <GCard key={title} glow accent onClick={() => navigate(path)} className="p-6 flex flex-col items-start gap-3 transition-transform hover:scale-[1.02]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})` }}>
                <Icon className="w-5 h-5" style={{ color: "#fff" }} />
              </div>
              <div className="text-lg font-bold" style={{ color: th.fg }}>{title}</div>
              <p className="text-sm" style={{ color: th.fg3 }}>{desc}</p>
            </GCard>
          ))}
        </div>
      </div>
    </div>
  );
}
