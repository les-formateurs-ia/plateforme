// Missions validées par un élève, pour sa fiche admin/formateur — placé
// avant les galeries "Créations Studio" (cf. AdminStudentDetailPage.tsx).
// Lecture seule ; RLS (mission_submissions_select) restreint déjà l'accès du
// formateur à ses propres élèves. Le PDF est envoyé au formateur via
// notification (cloche) au moment de la validation ; ce container est
// l'endroit où le retrouver ensuite, avec un badge "Nouveau" tant qu'il n'a
// pas été ouvert.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { getSubmissionsForStudent, getMissionPdfSignedUrl, markMissionViewed, type MissionSubmissionForStaff } from "@/app/lib/missionSubmissions";

export function StudentMissionGallery({ studentId }: { studentId: string }) {
  const th = useTh();
  const [submissions, setSubmissions] = useState<MissionSubmissionForStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await getSubmissionsForStudent(studentId);
        if (!cancelled) setSubmissions(rows);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Impossible de charger les missions de cet élève.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const openPdf = async (sub: MissionSubmissionForStaff) => {
    if (!sub.pdfPath) return;
    setOpeningId(sub.id);
    try {
      const url = await getMissionPdfSignedUrl(sub.pdfPath);
      window.open(url, "_blank", "noopener,noreferrer");
      if (!sub.viewedAt) {
        await markMissionViewed(sub.id);
        setSubmissions((rows) => rows.map((r) => (r.id === sub.id ? { ...r, viewedAt: new Date().toISOString() } : r)));
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'ouvrir ce PDF.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <GCard><div className="p-6">
      <h3 className="text-sm font-black mb-4" style={{ color: th.fg }}>Missions</h3>
      {loading && <p className="text-xs" style={{ color: th.fg3 }}>Chargement…</p>}
      {!loading && !submissions.length && (
        <div className="text-center py-6">
          <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: th.fg3 }} />
          <p className="text-xs" style={{ color: th.fg3 }}>Aucune mission envoyée pour l'instant.</p>
        </div>
      )}
      {!!submissions.length && (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <button
              key={sub.id}
              onClick={() => void openPdf(sub)}
              disabled={openingId === sub.id}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: th.isDark ? "rgba(255,255,255,0.03)" : `${th.gradShadow(0.04)}`, border: `1px solid ${th.sep}` }}
            >
              {openingId === sub.id ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: th.fg3 }} /> : <FileText className="w-4 h-4 shrink-0" style={{ color: th.navAC }} />}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{ color: th.fg }}>{sub.lessonTitle}</div>
                <div className="text-xs" style={{ color: th.fg3 }}>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("fr-FR") : ""}</div>
              </div>
              {!sub.viewedAt && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: "rgba(251,194,173,0.15)", color: "#fbc2ad", border: "1px solid rgba(251,194,173,0.3)" }}>
                  Nouveau
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div></GCard>
  );
}
