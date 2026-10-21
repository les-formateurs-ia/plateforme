// Réponses d'un élève à l'épreuve écrite de certification (admin), en lecture
// seule, avec téléchargement du PDF complet (sujet + réponses + visuel).
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { ChevronLeft, Download, Loader2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn } from "@/app/components/common/Buttons";
import { ExerciseView } from "@/app/components/certification/CertificationExamView";
import { EXAM_EXERCISES, EXAM_IDENTITY_FIELDS } from "@/app/data/certificationExam";
import {
  countAnswered, formatDateFR, formatSlotFR, getExamForStudent, getPersonName, getSoutenance,
  type CertificationExam, type SoutenanceInfo,
} from "@/app/lib/certification";
import { downloadCertificationPdf } from "@/app/lib/certificationPdf";

export function AdminCertificationAnswersPage() {
  const th = useTh();
  const { studentId } = useParams();
  const [exam, setExam] = useState<CertificationExam | null>(null);
  const [studentName, setStudentName] = useState("");
  const [soutenance, setSoutenance] = useState<SoutenanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      try {
        const [row, name] = await Promise.all([getExamForStudent(studentId), getPersonName(studentId)]);
        setExam(row);
        setStudentName(name);
        if (row?.rendezVousId) setSoutenance(await getSoutenance(row.rendezVousId));
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger l'épreuve.");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const download = async () => {
    if (!exam) return;
    setDownloading(true);
    try {
      await downloadCertificationPdf(exam, studentName);
    } catch (err) {
      console.error(err);
      toast.error("Génération du PDF impossible.");
    } finally {
      setDownloading(false);
    }
  };

  const backLink = (
    <Link to={`/admin/planning/students/${studentId}`} className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: th.fg2 }}>
      <ChevronLeft className="w-4 h-4" />Fiche élève
    </Link>
  );

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: th.fg3 }} /></div>;

  if (!exam) {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {backLink}
        <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>La certification n'a pas été lancée pour cet élève.</div></GCard>
      </div>
    );
  }

  const { answered, total } = countAnswered(exam.answers);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {backLink}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow" style={{ color: th.fg3 }}>Certification RS6776 · épreuve écrite</p>
          <h1 className="mt-2 text-[1.75rem] sm:text-[2.1rem] leading-[1.08] font-black" style={{ color: th.fg }}><GT>{studentName}</GT></h1>
          <div className="mt-2 text-sm space-y-0.5" style={{ color: th.fg2 }}>
            <p>{exam.status === "submitted" && exam.submittedAt ? `Écrit validé le ${formatDateFR(exam.submittedAt, true)}` : `Écrit en cours (brouillon) · à rendre avant le ${formatDateFR(exam.deadlineAt, true)}`}</p>
            <p>{answered}/{total} réponses{soutenance ? ` · Soutenance le ${formatSlotFR(soutenance.slotDate, soutenance.startTime)}` : ""}</p>
            {EXAM_IDENTITY_FIELDS.map((f) => {
              const v = exam.answers[f.id];
              return <p key={f.id}>{f.label} <strong style={{ color: th.fg }}>{typeof v === "string" && v.trim() ? v : "—"}</strong></p>;
            })}
          </div>
        </div>
        <ShimBtn onClick={download} disabled={downloading}>
          <span className="flex items-center gap-2">{downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Télécharger le PDF</span>
        </ShimBtn>
      </div>

      <div className="space-y-6">
        {EXAM_EXERCISES.map((ex) => <ExerciseView key={ex.number} exercise={ex} answers={exam.answers} />)}
      </div>
    </div>
  );
}
