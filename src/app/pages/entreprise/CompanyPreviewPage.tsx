import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { CompanyStudentHome } from "@/app/pages/entreprise/CompanyStudentHomePage";

// Permet au formateur/admin de voir exactement ce qu'un collaborateur voit,
// sans créer de faux compte élève ni envoyer d'invitation — répond au retour
// "il manque un accès élève pour voir comment ça rend chez eux". Réutilise
// CompanyStudentHome avec le companyId de la route (pas celui, inexistant,
// du compte staff) et son propre user.id pour l'état "test déjà fait".
export function CompanyPreviewPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId } = useParams<{ companyId: string }>();

  if (!companyId || !user) return null;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        <button onClick={() => navigate(`/entreprise/${companyId}`)} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Retour à l'entreprise
        </button>
      </div>
      <CompanyStudentHome companyId={companyId} studentId={user.id} preview />
    </div>
  );
}
