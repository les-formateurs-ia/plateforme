import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ClipboardList, FileText, Code2, Star, Upload, Download, CheckCircle2, Eye } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { getCompany } from "@/app/lib/entreprise/companies";
import { listVisiblePositioningTests, type VisiblePositioningTest } from "@/app/lib/entreprise/companyPositioning";
import { listVisibleCompanyFiles, getCompanyFileDownloadUrl, type CompanyFileRow } from "@/app/lib/entreprise/companyFiles";
import { listVisibleCompanyHtmlExercises, type CompanyHtmlExerciseRow } from "@/app/lib/entreprise/companyHtmlExercises";
import { listVisibleSatisfactionTests, type VisibleSatisfactionTest } from "@/app/lib/entreprise/companySatisfaction";
import { listCompanyFileCategories, type CompanyFileCategoryRow } from "@/app/lib/entreprise/companyFileCategories";
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

export function CompanyStudentHome({ companyId, studentId, preview = false }: CompanyStudentHomeProps) {
  const th = useTh();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [positioning, setPositioning] = useState<VisiblePositioningTest[]>([]);
  const [files, setFiles] = useState<CompanyFileRow[]>([]);
  const [exercises, setExercises] = useState<CompanyHtmlExerciseRow[]>([]);
  const [satisfaction, setSatisfaction] = useState<VisibleSatisfactionTest[]>([]);
  const [categories, setCategories] = useState<CompanyFileCategoryRow[]>([]);
  const [myUploads, setMyUploads] = useState<CompanyStudentUploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [company, pos, fls, exs, sat, cats, mine] = await Promise.all([
        getCompany(companyId),
        listVisiblePositioningTests(companyId, studentId),
        listVisibleCompanyFiles(companyId),
        listVisibleCompanyHtmlExercises(companyId),
        listVisibleSatisfactionTests(companyId, studentId),
        listCompanyFileCategories(companyId),
        preview ? Promise.resolve([]) : listMyCompanyUploads(companyId, studentId),
      ]);
      setCompanyName(company?.name ?? null);
      setPositioning(pos);
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPendingFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!pendingFile || uploading) return;
    setUploading(true);
    try {
      const created = await uploadCompanyStudentFile(companyId, studentId, categoryId || null, pendingFile);
      const category = categories.find((c) => c.id === categoryId);
      setMyUploads((rows) => [{ ...created, categoryName: category?.name ?? null }, ...rows]);
      setPendingFile(null);
      toast.success("Fichier envoyé.");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer ce fichier.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-8">
      {preview && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: th.gradShadow(0.1), border: `1px solid ${th.gradShadow(0.3)}`, color: th.fg }}>
          <Eye className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />
          Aperçu formateur — c'est exactement ce qu'un collaborateur de cette entreprise voit. Les tests peuvent être testés (réponses non enregistrées) ; l'envoi de fichier est réservé aux élèves.
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{companyName ?? "Entreprise"}</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>{preview ? "Espace de formation entreprise." : "Ton espace de formation entreprise."}</p>
      </div>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && (
        <>
          <section>
            <h3 className="text-sm font-black flex items-center gap-2 mb-3" style={{ color: th.fg }}><ClipboardList className="w-4 h-4" style={{ color: th.navAC }} />Tests de positionnement</h3>
            {!positioning.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun test pour l'instant.</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {positioning.map((t) => (
                <GCard key={t.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{t.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>{t.questionCount} question{t.questionCount > 1 ? "s" : ""}{t.done ? ` · Score ${t.score}%` : ""}</div>
                  </div>
                  {t.done ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#6adeb1" }} /> : <ShimBtn sm onClick={() => navigate(`/entreprise/positioning/${t.id}`)}>Répondre</ShimBtn>}
                </GCard>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black flex items-center gap-2 mb-3" style={{ color: th.fg }}><FileText className="w-4 h-4" style={{ color: th.navAC }} />Fichiers</h3>
            {!files.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun fichier pour l'instant.</p>}
            <div className="space-y-2">
              {files.map((f) => (
                <GCard key={f.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{f.name}</div>
                    {f.description && <div className="text-xs mt-0.5 truncate" style={{ color: th.fg3 }}>{f.description}</div>}
                  </div>
                  <VBtn sm onClick={() => void handleDownload(f)}><span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Télécharger</span></VBtn>
                </GCard>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black flex items-center gap-2 mb-3" style={{ color: th.fg }}><Code2 className="w-4 h-4" style={{ color: th.navAC }} />Exercices HTML</h3>
            {!exercises.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun exercice pour l'instant.</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {exercises.map((ex) => (
                <GCard key={ex.id} onClick={() => navigate(`/entreprise/html/${ex.id}`)} className="p-4 hover:scale-[1.01] transition-transform">
                  <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{ex.name}</div>
                  {ex.description && <div className="text-xs mt-0.5 truncate" style={{ color: th.fg3 }}>{ex.description}</div>}
                </GCard>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black flex items-center gap-2 mb-3" style={{ color: th.fg }}><Star className="w-4 h-4" style={{ color: th.navAC }} />Test de satisfaction</h3>
            {!satisfaction.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun test pour l'instant.</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {satisfaction.map((t) => (
                <GCard key={t.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{t.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: th.fg3 }}>{t.questionCount} question{t.questionCount > 1 ? "s" : ""}</div>
                  </div>
                  {t.done ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#6adeb1" }} /> : <ShimBtn sm onClick={() => navigate(`/entreprise/satisfaction/${t.id}`)}>Répondre</ShimBtn>}
                </GCard>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black flex items-center gap-2 mb-3" style={{ color: th.fg }}><Upload className="w-4 h-4" style={{ color: th.navAC }} />Mes fichiers</h3>
            {preview ? (
              <GCard><div className="p-4 text-xs" style={{ color: th.fg3 }}>Réservé aux collaborateurs de l'entreprise — un élève peut envoyer un fichier ici (avec une catégorie parmi : {categories.length ? categories.map((c) => c.name).join(", ") : "aucune pour l'instant"}).</div></GCard>
            ) : (
              <>
                <GCard>
                  <div className="p-4 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <VSelect
                        value={categoryId} onValueChange={setCategoryId}
                        options={categories.map((c) => ({ value: c.id, label: c.name }))}
                        placeholder="Catégorie (optionnel)"
                      />
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" onChange={handleFileChange} />
                        <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                          style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: th.fg }}>
                          <Upload className="w-3.5 h-3.5" />{pendingFile ? pendingFile.name : "Choisir un fichier"}
                        </span>
                      </label>
                    </div>
                    <ShimBtn sm onClick={handleUpload} disabled={!pendingFile || uploading}>{uploading ? "Envoi..." : "Envoyer"}</ShimBtn>
                  </div>
                </GCard>
                <div className="space-y-2 mt-3">
                  {myUploads.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}>
                      <span className="truncate">{u.fileName}</span>
                      <span className="text-xs shrink-0" style={{ color: th.fg3 }}>{u.categoryName ?? "Sans catégorie"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function CompanyStudentHomePage() {
  const { user, companyId } = useAuth();
  if (!companyId || !user) return null;
  return <CompanyStudentHome companyId={companyId} studentId={user.id} />;
}
