import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowRight, ClipboardList, FileText, Code2, Star, Upload, Eye, Award, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { SectionRow, SectionHeader, useSectionParam, sectionMorphName, type Hue, type TileBadge } from "@/app/components/entreprise/SectionTiles";
import { HueProvider, EmptyState, Loading } from "@/app/components/entreprise/EntrepriseKit";
import { NeuralField } from "@/app/components/particles/NeuralField";
import { SectionHead } from "@/app/components/common/SectionHead";
import { useProfile } from "@/app/state/profile-context";
import { getCompany } from "@/app/lib/entreprise/companies";
import { listVisiblePositioningTests, type VisiblePositioningTest } from "@/app/lib/entreprise/companyPositioning";
import { listVisibleCompanyFiles, getCompanyFileDownloadUrl, type CompanyFileRow } from "@/app/lib/entreprise/companyFiles";
import { listVisibleCompanyHtmlExercises, type CompanyHtmlExerciseRow } from "@/app/lib/entreprise/companyHtmlExercises";
import { listVisibleSatisfactionTests, type VisibleSatisfactionTest } from "@/app/lib/entreprise/companySatisfaction";
import { listCompanyFileCategories, type CompanyFileCategoryRow } from "@/app/lib/entreprise/companyFileCategories";
import { FeaturedQuizzes, DocumentShelf, ExerciseTiles, CategoryUploads } from "@/app/components/entreprise/StudentSections";
import { listMyCompanyUploads, uploadCompanyStudentFile, type CompanyStudentUploadRow } from "@/app/lib/entreprise/companyStudentUploads";

interface CompanyStudentHomeProps {
  companyId: string;
  studentId: string;
  // true quand un membre du staff consulte l'espace d'une entreprise dont il
  // n'est pas lui-même collaborateur (voir CompanyPreviewPage) : les actions
  // d'écriture (upload élève) sont désactivées, RLS les rejetterait de toute
  // façon (same_company() est faux pour un compte staff).
  preview?: boolean;
}

const SECTION_IDS = ["positioning", "files", "html", "validation", "satisfaction", "uploads"] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTION_META: Record<SectionId, { label: string; desc: string; Icon: LucideIcon; hue: Hue }> = {
  positioning: { label: "Positionnement", desc: "Fais le point sur ton niveau avant de commencer.", Icon: ClipboardList, hue: "blue" },
  files: { label: "Supports de cours", desc: "Les supports et documents de ta formation.", Icon: FileText, hue: "teal" },
  html: { label: "Exercices", desc: "Mets en pratique ce que tu apprends.", Icon: Code2, hue: "pink" },
  validation: { label: "Quiz de validation", desc: "Valide tes acquis en fin de formation.", Icon: Award, hue: "amber" },
  satisfaction: { label: "Questionnaires", desc: "Donne ton avis sur la formation.", Icon: Star, hue: "peach" },
  uploads: { label: "Espace de dépôt", desc: "Envoie tes productions à ton formateur.", Icon: Upload, hue: "violet" },
};

const plural = (n: number, word: string, pluralWord = `${word}s`) => `${n} ${n > 1 ? pluralWord : word}`;

// Badge d'une rubrique à faire (quiz, questionnaires) : nombre restant, ou terminé.
function todoBadge(items: { done: boolean }[]): TileBadge {
  if (!items.length) return { label: "Bientôt disponible", tone: "muted" };
  const todo = items.filter((i) => !i.done).length;
  return todo ? { label: `${todo} à faire`, tone: "todo" } : { label: "Terminé ✓", tone: "done" };
}

export function CompanyStudentHome({ companyId, studentId, preview = false }: CompanyStudentHomeProps) {
  const th = useTh();
  const navigate = useNavigate();
  const { section, open, close } = useSectionParam(SECTION_IDS);
  const { profile } = useProfile();
  const firstName = profile.name.split(" ")[0] || "";

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [positioning, setPositioning] = useState<VisiblePositioningTest[]>([]);
  const [validation, setValidation] = useState<VisiblePositioningTest[]>([]);
  const [files, setFiles] = useState<CompanyFileRow[]>([]);
  const [exercises, setExercises] = useState<CompanyHtmlExerciseRow[]>([]);
  const [satisfaction, setSatisfaction] = useState<VisibleSatisfactionTest[]>([]);
  const [categories, setCategories] = useState<CompanyFileCategoryRow[]>([]);
  const [myUploads, setMyUploads] = useState<CompanyStudentUploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [company, pos, val, fls, exs, sat, cats, mine] = await Promise.all([
        getCompany(companyId),
        listVisiblePositioningTests(companyId, studentId, "positioning"),
        listVisiblePositioningTests(companyId, studentId, "validation"),
        listVisibleCompanyFiles(companyId),
        listVisibleCompanyHtmlExercises(companyId),
        listVisibleSatisfactionTests(companyId, studentId),
        listCompanyFileCategories(companyId),
        preview ? Promise.resolve([]) : listMyCompanyUploads(companyId, studentId),
      ]);
      setCompanyName(company?.name ?? null);
      setPositioning(pos);
      setValidation(val);
      setFiles(fls);
      setExercises(exs);
      setSatisfaction(sat);
      setCategories(cats);
      setMyUploads(mine);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger l'espace entreprise.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [companyId, studentId]);

  const handleDownload = async (file: CompanyFileRow) => {
    try {
      const url = await getCompanyFileDownloadUrl(file.storagePath);
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de télécharger ce fichier.");
    }
  };

  // Catégorie obligatoire : CategoryUploads ne propose l'envoi qu'une fois
  // une catégorie choisie. Renvoie true si l'envoi a réussi (vide le champ).
  const handleUpload = async (categoryId: string, file: File): Promise<boolean> => {
    if (uploading) return false;
    setUploading(true);
    try {
      const created = await uploadCompanyStudentFile(companyId, studentId, categoryId, file);
      const category = categories.find((c) => c.id === categoryId);
      setMyUploads((rows) => [{ ...created, categoryName: category?.name ?? null }, ...rows]);
      toast.success(`Fichier envoyé dans « ${category?.name ?? "la catégorie"} ».`);
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer ce fichier.");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const badges: Record<SectionId, TileBadge> = {
    positioning: todoBadge(positioning),
    files: files.length ? { label: plural(files.length, "document") } : { label: "Bientôt disponible", tone: "muted" },
    html: exercises.length ? { label: plural(exercises.length, "exercice") } : { label: "Bientôt disponible", tone: "muted" },
    validation: todoBadge(validation),
    satisfaction: todoBadge(satisfaction),
    uploads: myUploads.length ? { label: plural(myUploads.length, "envoyé") } : { label: "Envoyer un fichier" },
  };
  // Une rubrique sans contenu ne mène nulle part : sa tuile est grisée.
  const isEmpty: Record<SectionId, boolean> = {
    positioning: !positioning.length, files: !files.length, html: !exercises.length,
    validation: !validation.length, satisfaction: !satisfaction.length, uploads: false,
  };

  const previewBanner = preview && (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: th.gradShadow(0.1), border: `1px solid ${th.ink}`, color: th.fg }}>
      <Eye className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />
      Aperçu formateur — c'est exactement ce qu'un collaborateur de cette entreprise voit. Les tests peuvent être testés (réponses non enregistrées) ; l'envoi de fichier est réservé aux élèves.
    </div>
  );

  if (section) {
    const meta = SECTION_META[section];
    return (
      <div data-morph-scope="" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {previewBanner}
        <SectionHeader morphName={sectionMorphName(section)} backLabel="Mon espace" onBack={close} label={meta.label} desc={meta.desc} Icon={meta.Icon} hue={meta.hue} />
        <HueProvider hue={meta.hue}>
          {loading ? <Loading /> : (
            <div>
              {section === "positioning" && (
                <FeaturedQuizzes tests={positioning} Icon={meta.Icon} kindLabel="Test de positionnement" onStart={(id) => navigate(`/entreprise/positioning/${id}`)}
                  intro="Avant de commencer la formation, fais le point sur ton niveau. Réponds sincèrement : ce test sert à adapter la formation, pas à te noter."
                  emptyHint="Ton formateur publiera ici ton test de positionnement." />
              )}
              {section === "validation" && (
                <FeaturedQuizzes tests={validation} Icon={meta.Icon} kindLabel="Quiz de validation" onStart={(id) => navigate(`/entreprise/positioning/${id}`)}
                  intro="La formation touche à sa fin : valide tes acquis avec ce quiz."
                  emptyHint="Ton formateur publiera ici le quiz de fin de formation." />
              )}
              {section === "satisfaction" && (
                <FeaturedQuizzes tests={satisfaction} Icon={meta.Icon} kindLabel="Questionnaire" variant="survey" onStart={(id) => navigate(`/entreprise/satisfaction/${id}`)}
                  intro="Ton avis nous aide à améliorer la formation. Quelques minutes suffisent."
                  emptyTitle="Aucun questionnaire pour l'instant" emptyHint="Ton formateur les publiera ici." />
              )}
              {section === "files" && <DocumentShelf files={files} onOpen={(f) => void handleDownload(f)} />}
              {section === "html" && <ExerciseTiles exercises={exercises} Icon={meta.Icon} onOpen={(id) => navigate(`/entreprise/html/${id}`)} />}
              {section === "uploads" && (preview ? (
                <EmptyState Icon={meta.Icon} title="Réservé aux collaborateurs"
                  hint={`Un élève peut envoyer un fichier ici, avec une catégorie parmi : ${categories.length ? categories.map((c) => c.name).join(", ") : "aucune pour l'instant"}.`} />
              ) : (
                <CategoryUploads categories={categories} uploads={myUploads} uploading={uploading} onUpload={handleUpload} />
              ))}
            </div>
          )}
        </HueProvider>
      </div>
    );
  }

  // Ce qui reste à faire (tests et questionnaires), dans l'ordre de la formation.
  const tasks = [
    ...positioning.map((t) => ({ section: "positioning" as const, done: t.done })),
    ...validation.map((t) => ({ section: "validation" as const, done: t.done })),
    ...satisfaction.map((t) => ({ section: "satisfaction" as const, done: t.done })),
  ];
  const doneCount = tasks.filter((t) => t.done).length;
  const nextTask = tasks.find((t) => !t.done)?.section ?? null;
  const nextSection: SectionId | null = nextTask ?? (files.length ? "files" : exercises.length ? "html" : null);
  const NEXT_COPY: Record<SectionId, { eyebrow: string; title: string; cta: string }> = {
    positioning: { eyebrow: "Pour commencer", title: "Fais le point sur ton niveau", cta: "Passer le test de positionnement" },
    files: { eyebrow: "Pendant la formation", title: "Tes supports de cours t'attendent", cta: "Voir les supports" },
    html: { eyebrow: "Pendant la formation", title: "Mets en pratique ce que tu apprends", cta: "Ouvrir les exercices" },
    validation: { eyebrow: "Fin de formation", title: "Valide tes acquis", cta: "Passer le quiz de validation" },
    satisfaction: { eyebrow: "Dernière étape", title: "Dis-nous ce que tu en as pensé", cta: "Répondre au questionnaire" },
    uploads: { eyebrow: "Pendant la formation", title: "Envoie tes productions", cta: "Ouvrir l'espace de dépôt" },
  };
  const next = nextSection ? NEXT_COPY[nextSection] : null;

  // La formation en trois temps : chaque rubrique trouve sa place.
  const PHASES: { n: string; title: string; desc: string; ids: SectionId[] }[] = [
    { n: "01", title: "Avant", desc: "Fais le point pour adapter la formation.", ids: ["positioning"] },
    { n: "02", title: "Pendant", desc: "Les supports, la pratique, tes productions.", ids: ["files", "html", "uploads"] },
    { n: "03", title: "Après", desc: "Valide tes acquis et donne ton avis.", ids: ["validation", "satisfaction"] },
  ];

  return (
    <div data-morph-scope="" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
      {previewBanner}

      {/* Panneau noir au réseau de la marque : où en est le collaborateur, et la suite. */}
      <section className="relative overflow-hidden rounded-[10px] bg-black text-white fade-up" style={{ border: th.isDark ? `1px solid ${th.sep}` : undefined }}>
        <NeuralField dark density={3.6} band={0.9} />
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.6) 45%,rgba(0,0,0,0.05) 80%)" }} />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:p-11 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-white/60">Espace entreprise{companyName ? ` · ${companyName}` : ""}</p>
            <h1 className="mt-4 text-[2rem] sm:text-[2.7rem] font-extrabold leading-[1.02] tracking-[-0.035em]">
              {loading ? "Chargement…" : preview ? "Aperçu de l'espace collaborateur" : `Bonjour ${firstName}`}
            </h1>
            <p className="mt-4 text-base text-white/65 leading-relaxed">
              {next ? <><span className="text-white/90 font-semibold">{next.eyebrow} :</span> {next.title.charAt(0).toLowerCase() + next.title.slice(1)}.</> : "Ton formateur publiera bientôt le contenu de ta formation."}
            </p>
            {next && nextSection && (
              <button type="button" onClick={() => open(nextSection)}
                className="sweep mt-8 inline-flex items-center gap-2.5 min-h-[50px] px-6 rounded-[2px] bg-white text-black text-base font-semibold">
                {next.cta}<ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          {tasks.length > 0 && (
            <div className="lg:text-right">
              <p className="text-[3.2rem] sm:text-[4rem] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{doneCount}<span className="text-white/45 text-[0.5em]">/{tasks.length}</span></p>
              <p className="mt-2 text-sm text-white/60">test{tasks.length > 1 ? "s" : ""} et questionnaire{tasks.length > 1 ? "s" : ""} faits</p>
              <div className="mt-4 h-1.5 w-full lg:w-56 lg:ml-auto rounded-full overflow-hidden bg-white/15">
                <div className="h-full rounded-full" style={{ width: `${(doneCount / tasks.length) * 100}%`, background: th.iris }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {loading ? <Loading /> : (
        <section aria-labelledby="phases-title">
          <SectionHead id="phases-title" eyebrow="Ta formation" title="En trois temps" />
          <ol className="grid gap-8 lg:gap-6 lg:grid-cols-3">
            {PHASES.map((phase, pi) => (
              <li key={phase.n} className="fade-up" style={{ animationDelay: `${80 + pi * 70}ms` }}>
                <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: `1px solid ${th.sep}` }}>
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black tabular-nums" style={{ background: th.ink, color: th.onInk }}>{phase.n}</span>
                  <span>
                    <span className="block text-lg font-black leading-tight" style={{ color: th.fg }}>{phase.title}</span>
                    <span className="block text-sm" style={{ color: th.fg2 }}>{phase.desc}</span>
                  </span>
                </div>
                <div className="space-y-2.5">
                  {phase.ids.map((id, i) => {
                    const meta = SECTION_META[id];
                    return (
                      <SectionRow key={id} morphName={sectionMorphName(id)} index={pi * 3 + i} label={meta.label} desc={meta.desc} Icon={meta.Icon} hue={meta.hue}
                        badge={badges[id]} disabled={isEmpty[id]} onClick={() => open(id)} />
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export function CompanyStudentHomePage() {
  const { user, companyId } = useAuth();
  if (!companyId || !user) return null;
  return <CompanyStudentHome companyId={companyId} studentId={user.id} />;
}
