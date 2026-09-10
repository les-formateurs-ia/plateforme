import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Eye, Users, ClipboardList, FileText, Code2, Star, Tag, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { VBtn } from "@/app/components/common/Buttons";
import { getCompany } from "@/app/lib/entreprise/companies";
import { CompanyEmployeesTab } from "@/app/components/entreprise/CompanyEmployeesTab";
import { CompanyPositioningTab } from "@/app/components/entreprise/CompanyPositioningTab";
import { CompanyFilesTab } from "@/app/components/entreprise/CompanyFilesTab";
import { CompanyHtmlExercisesTab } from "@/app/components/entreprise/CompanyHtmlExercisesTab";
import { CompanySatisfactionTab } from "@/app/components/entreprise/CompanySatisfactionTab";
import { CompanyCategoriesTab } from "@/app/components/entreprise/CompanyCategoriesTab";

type TabId = "employees" | "positioning" | "files" | "html" | "satisfaction" | "categories";

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: "employees", label: "Collaborateurs", Icon: Users },
  { id: "positioning", label: "Positionnement", Icon: ClipboardList },
  { id: "files", label: "Fichiers", Icon: FileText },
  { id: "html", label: "Exercices HTML", Icon: Code2 },
  { id: "satisfaction", label: "Satisfaction", Icon: Star },
  { id: "categories", label: "Catégories", Icon: Tag },
];

export function CompanyDetailPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("employees");

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const company = await getCompany(companyId);
      if (!cancelled) { setName(company?.name ?? null); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  if (!companyId) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate("/entreprise")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
            <ArrowLeft className="w-4 h-4" />Entreprises
          </button>
          <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}>
            <GT>{loading ? "Chargement…" : (name ?? "Entreprise introuvable")}</GT>
          </h2>
        </div>
        {name && (
          <VBtn onClick={() => navigate(`/entreprise/${companyId}/preview`)}>
            <span className="flex items-center gap-2"><Eye className="w-4 h-4" />Aperçu élève</span>
          </VBtn>
        )}
      </div>

      {name && (
        <div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-90"
                  style={active
                    ? { background: `linear-gradient(135deg,${th.grad1},${th.grad2})`, color: "#fff", boxShadow: `0 3px 12px ${th.gradShadow(0.32)}` }
                    : { background: th.card, border: `1px solid ${th.sep}`, color: th.fg2 }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={active ? { color: "#fff" } : { color: th.navAC }} />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            {tab === "employees" && <CompanyEmployeesTab companyId={companyId} />}
            {tab === "positioning" && <CompanyPositioningTab companyId={companyId} />}
            {tab === "files" && <CompanyFilesTab companyId={companyId} />}
            {tab === "html" && <CompanyHtmlExercisesTab companyId={companyId} />}
            {tab === "satisfaction" && <CompanySatisfactionTab companyId={companyId} />}
            {tab === "categories" && <CompanyCategoriesTab companyId={companyId} />}
          </div>
        </div>
      )}
    </div>
  );
}
