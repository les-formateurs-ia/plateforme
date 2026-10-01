import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Eye, Users, ClipboardList, FileText, Code2, Star, Tag, Award, BarChart3, Inbox, Building2, type LucideIcon } from "lucide-react";
import { getCompany } from "@/app/lib/entreprise/companies";
import { getCompanyOverview, type CompanyOverview } from "@/app/lib/entreprise/companyOverview";
import { SectionTile, SectionGrid, SectionHeader, useSectionParam, sectionMorphName, type Hue, type TileBadge } from "@/app/components/entreprise/SectionTiles";
import { HueProvider, GhostButton, PageHero } from "@/app/components/entreprise/EntrepriseKit";
import { CompanyEmployeesTab } from "@/app/components/entreprise/CompanyEmployeesTab";
import { CompanyPositioningTab } from "@/app/components/entreprise/CompanyPositioningTab";
import { CompanyFilesTab } from "@/app/components/entreprise/CompanyFilesTab";
import { CompanyHtmlExercisesTab } from "@/app/components/entreprise/CompanyHtmlExercisesTab";
import { CompanySatisfactionTab } from "@/app/components/entreprise/CompanySatisfactionTab";
import { CompanyCategoriesTab } from "@/app/components/entreprise/CompanyCategoriesTab";
import { CompanyResultsTab } from "@/app/components/entreprise/CompanyResultsTab";
import { CompanyStudentUploadsTab } from "@/app/components/entreprise/CompanyStudentUploadsTab";

const SECTION_IDS = ["employees", "positioning", "files", "html", "validation", "satisfaction", "results", "uploads", "categories"] as const;
type SectionId = typeof SECTION_IDS[number];

const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n > 1 ? pluralWord : word}`;
const countBadge = (n: number, word: string, pluralWord?: string): TileBadge =>
  n ? { label: plural(n, word, pluralWord) } : { label: "Vide", tone: "muted" };

const SECTIONS: { id: SectionId; label: string; desc: string; Icon: LucideIcon; hue: Hue; badge: (o: CompanyOverview) => TileBadge }[] = [
  { id: "employees", label: "Collaborateurs", desc: "Liste des élèves, envoi des accès et mots de passe.", Icon: Users, hue: "violet",
    badge: (o) => (o.employees ? { label: `${o.activated}/${o.employees} activés`, tone: o.activated === o.employees ? "done" : "default" } : { label: "Aucun", tone: "muted" }) },
  { id: "positioning", label: "Positionnement", desc: "Quiz à passer avant la formation.", Icon: ClipboardList, hue: "blue", badge: (o) => countBadge(o.positioning, "quiz", "quiz") },
  { id: "files", label: "Fichiers", desc: "Documents mis à disposition des élèves.", Icon: FileText, hue: "teal", badge: (o) => countBadge(o.files, "fichier") },
  { id: "html", label: "Exercices HTML", desc: "Exercices interactifs de la formation.", Icon: Code2, hue: "pink", badge: (o) => countBadge(o.html, "exercice") },
  { id: "validation", label: "Quiz de validation", desc: "Quiz de fin de formation pour valider les acquis.", Icon: Award, hue: "amber", badge: (o) => countBadge(o.validation, "quiz", "quiz") },
  { id: "satisfaction", label: "Questionnaires", desc: "Questionnaires de satisfaction et retours.", Icon: Star, hue: "peach", badge: (o) => countBadge(o.surveys, "questionnaire") },
  { id: "results", label: "Résultats", desc: "Scores, synthèses et exports CSV.", Icon: BarChart3, hue: "violet", badge: (o) => countBadge(o.results, "réponse") },
  { id: "uploads", label: "Documents élèves", desc: "Fichiers envoyés par les élèves.", Icon: Inbox, hue: "teal", badge: (o) => countBadge(o.uploads, "reçu") },
  { id: "categories", label: "Catégories", desc: "Catégories proposées pour les envois des élèves.", Icon: Tag, hue: "blue", badge: (o) => countBadge(o.categories, "catégorie") },
];

export function CompanyDetailPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { section: sectionId, open, close } = useSectionParam(SECTION_IDS);
  const section = SECTIONS.find((s) => s.id === sectionId) ?? null;
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CompanyOverview | null>(null);

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

  // Rechargé à chaque retour sur la grille pour refléter ce qui vient d'être modifié.
  useEffect(() => {
    if (!companyId || section) return;
    let cancelled = false;
    getCompanyOverview(companyId)
      .then((o) => { if (!cancelled) setOverview(o); })
      .catch((err) => console.error(err)); // tuiles affichées sans compteurs
    return () => { cancelled = true; };
  }, [companyId, section]);

  if (!companyId) return null;

  const previewButton = name && (
    <GhostButton Icon={Eye} onClick={() => navigate(`/entreprise/${companyId}/preview`)}>Aperçu élève</GhostButton>
  );

  if (name && section) {
    return (
      <div data-morph-scope="" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        <SectionHeader morphName={sectionMorphName(section.id)} backLabel={name} onBack={close} label={section.label} desc={section.desc} Icon={section.Icon} hue={section.hue} actions={previewButton} />
        <HueProvider hue={section.hue}>
          {section.id === "employees" && <CompanyEmployeesTab companyId={companyId} />}
          {section.id === "positioning" && <CompanyPositioningTab companyId={companyId} kind="positioning" />}
          {section.id === "files" && <CompanyFilesTab companyId={companyId} />}
          {section.id === "html" && <CompanyHtmlExercisesTab companyId={companyId} />}
          {section.id === "validation" && <CompanyPositioningTab companyId={companyId} kind="validation" />}
          {section.id === "satisfaction" && <CompanySatisfactionTab companyId={companyId} />}
          {section.id === "results" && <CompanyResultsTab companyId={companyId} />}
          {section.id === "uploads" && <CompanyStudentUploadsTab companyId={companyId} />}
          {section.id === "categories" && <CompanyCategoriesTab companyId={companyId} />}
        </HueProvider>
      </div>
    );
  }

  return (
    <div data-morph-scope="" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-8">
      <PageHero back={{ label: "Entreprises", onClick: () => navigate("/entreprise") }} eyebrow="Entreprise" Icon={Building2}
        title={loading ? "Chargement…" : (name ?? "Entreprise introuvable")} desc={name ? "Choisissez une rubrique à gérer." : undefined} actions={previewButton} />

      {name && (
        <SectionGrid>
          {SECTIONS.map((s, i) => (
            <SectionTile key={s.id} morphName={sectionMorphName(s.id)} index={i} label={s.label} desc={s.desc} Icon={s.Icon} hue={s.hue}
              badge={overview ? s.badge(overview) : undefined} onClick={() => open(s.id)} />
          ))}
        </SectionGrid>
      )}
    </div>
  );
}
