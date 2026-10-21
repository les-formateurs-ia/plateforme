// Fiche élève (admin) : lancement de l'épreuve écrite de certification une
// fois toutes les leçons terminées, suivi (décompte, avancement, soutenance)
// et accès aux réponses / au PDF.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Award, CalendarClock, Download, Eye, Loader2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import {
  cancelExam, countAnswered, daysLeft, formatDateFR, formatSlotFR, getExamForStudent, getSoutenance,
  getStudentLessonCompletion, launchExam, EXAM_DURATION_DAYS, type CertificationExam, type SoutenanceInfo,
} from "@/app/lib/certification";
import { downloadCertificationPdf } from "@/app/lib/certificationPdf";

export function StudentCertificationCard({ studentId, studentName }: { studentId: string; studentName: string }) {
  const th = useTh();
  const navigate = useNavigate();
  const [exam, setExam] = useState<CertificationExam | null>(null);
  const [completion, setCompletion] = useState<{ done: number; total: number } | null>(null);
  const [soutenance, setSoutenance] = useState<SoutenanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"launch" | "cancel" | "pdf" | null>(null);
  const [confirm, setConfirm] = useState<"launch" | "cancel" | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [examRow, comp] = await Promise.all([getExamForStudent(studentId), getStudentLessonCompletion(studentId)]);
      setExam(examRow);
      setCompletion(comp);
      setSoutenance(examRow?.rendezVousId ? await getSoutenance(examRow.rendezVousId) : null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [studentId]);

  const run = async (kind: "launch" | "cancel") => {
    setBusy(kind);
    try {
      if (kind === "launch") {
        await launchExam(studentId);
        toast.success("Certification lancée : l'élève a 10 jours pour rendre son écrit.");
      } else if (exam) {
        await cancelExam(exam);
        toast.success("Certification annulée.");
      }
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!exam) return;
    setBusy("pdf");
    try {
      await downloadCertificationPdf(exam, studentName);
    } catch (err) {
      console.error(err);
      toast.error("Génération du PDF impossible.");
    } finally {
      setBusy(null);
    }
  };

  const eligible = !!completion && completion.total > 0 && completion.done === completion.total;
  const answered = exam ? countAnswered(exam.answers) : null;

  return (
    <GCard><div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4" style={{ color: th.fg }} />
        <h3 className="text-sm font-black" style={{ color: th.fg }}>Certification RS6776</h3>
      </div>

      {loading && <p className="text-xs" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && !exam && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm flex-1" style={{ color: th.fg2 }}>
            {eligible
              ? "L'élève a terminé toutes ses leçons, dernière mission comprise. Tu peux lancer son épreuve écrite : il aura 10 jours pour la rendre."
              : `L'épreuve pourra être lancée quand l'élève aura terminé sa dernière mission (${completion?.done ?? 0}/${completion?.total ?? 0} leçons terminées).`}
          </p>
          <ShimBtn sm onClick={() => setConfirm("launch")} disabled={!eligible}>Lancer la certification</ShimBtn>
        </div>
      )}

      {!loading && exam && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Stat label="Statut" value={exam.status === "submitted" ? "Écrit validé" : "Écrit en cours"} accent={exam.status === "submitted" ? th.success : th.fg} />
            <Stat
              label={exam.status === "submitted" ? "Rendu le" : "Temps restant"}
              value={exam.status === "submitted" && exam.submittedAt
                ? formatDateFR(exam.submittedAt)
                : `${daysLeft(exam.deadlineAt)} jour${daysLeft(exam.deadlineAt) > 1 ? "s" : ""} (sur ${EXAM_DURATION_DAYS})`}
            />
            <Stat label="Réponses" value={`${answered?.answered}/${answered?.total}`} />
          </div>
          {exam.status === "submitted" && exam.submittedAt && new Date(exam.submittedAt) > new Date(exam.deadlineAt) && (
            <p className="text-xs font-semibold" style={{ color: th.danger }}>Rendu après la date limite ({formatDateFR(exam.deadlineAt, true)}).</p>
          )}
          {soutenance && (
            <p className="text-sm flex items-center gap-2" style={{ color: th.fg }}>
              <CalendarClock className="w-4 h-4 shrink-0" />Soutenance le <strong>{formatSlotFR(soutenance.slotDate, soutenance.startTime)}</strong>
              {soutenance.meetLink && <a href={soutenance.meetLink} target="_blank" rel="noreferrer" className="underline">visio</a>}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <ShimBtn sm onClick={() => navigate(`/admin/planning/students/${studentId}/certification`)}>
              <span className="flex items-center gap-2"><Eye className="w-3.5 h-3.5" />Voir les réponses</span>
            </ShimBtn>
            <button type="button" onClick={downloadPdf} disabled={busy === "pdf"}
              className="inline-flex items-center gap-2 px-4 min-h-9 rounded-[2px] text-[13px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50" style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
              {busy === "pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Télécharger le PDF
            </button>
            <button type="button" onClick={() => setConfirm("cancel")}
              className="inline-flex items-center px-4 min-h-9 rounded-[2px] text-[13px] font-semibold transition-opacity hover:opacity-70" style={{ color: th.danger }}>
              Annuler la certification
            </button>
          </div>
        </div>
      )}

      <Dialog open={!!confirm} onOpenChange={(v) => { if (!v && !busy) setConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm === "launch" ? "Lancer la certification ?" : "Annuler la certification ?"}</DialogTitle>
            <DialogDescription>
              {confirm === "launch"
                ? `${studentName} verra son accueil remplacé par l'épreuve écrite, avec un décompte de 10 jours. Pendant l'épreuve, seul Le Studio (texte et image) reste accessible.`
                : `Les réponses de ${studentName} seront supprimées${exam?.rendezVousId ? " et sa soutenance annulée" : ""}. L'élève retrouvera son espace habituel.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" onClick={() => setConfirm(null)} disabled={!!busy} className="px-4 py-2.5 rounded-[2px] text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: th.fg2 }}>
              Retour
            </button>
            {confirm === "launch" ? (
              <ShimBtn onClick={() => void run("launch")} disabled={!!busy}>{busy === "launch" ? "Lancement…" : "Lancer l'épreuve"}</ShimBtn>
            ) : (
              <button type="button" onClick={() => void run("cancel")} disabled={!!busy} className="px-4 py-2.5 rounded-[2px] text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ background: "#ef4444" }}>
                {busy === "cancel" ? "Annulation…" : "Annuler la certification"}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div></GCard>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const th = useTh();
  return (
    <div className="rounded-[6px] px-3.5 py-3" style={{ background: th.inputBg }}>
      <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: th.fg3 }}>{label}</div>
      <div className="text-sm font-bold mt-0.5" style={{ color: accent ?? th.fg }}>{value}</div>
    </div>
  );
}
