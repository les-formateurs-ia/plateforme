// Accès aux soumissions de leçons "Mission" (cf. supabase/migrations/0070_lesson_mission.sql) :
// brouillon enregistré par l'élève en cours de route (jamais notifié au formateur),
// puis validation définitive (HTML figé + PDF envoyé au formateur, plus aucune
// modification possible ensuite — verrouillé aussi côté RLS).
import { supabase } from "@/app/lib/supabase/client";
import type { MissionSubmissionStatus } from "@/app/lib/supabase/database.types";
import { createMissionNotification } from "@/app/lib/notifications";
import { completeMissionLesson } from "@/app/lib/learning";
import { generateMissionPdf } from "@/app/lib/missionPdf";

export interface MissionSubmission {
  id: string;
  lessonId: string;
  studentId: string;
  status: MissionSubmissionStatus;
  htmlContent: string;
  pdfPath: string | null;
  viewedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
}

function mapRow(row: {
  id: string; lesson_id: string; student_id: string; status: MissionSubmissionStatus; html_content: string;
  pdf_path: string | null; viewed_at: string | null; submitted_at: string | null; created_at: string;
}): MissionSubmission {
  return {
    id: row.id, lessonId: row.lesson_id, studentId: row.student_id, status: row.status, htmlContent: row.html_content,
    pdfPath: row.pdf_path, viewedAt: row.viewed_at, submittedAt: row.submitted_at, createdAt: row.created_at,
  };
}

export async function getMySubmission(lessonId: string, studentId: string): Promise<MissionSubmission | null> {
  const { data, error } = await supabase
    .from("mission_submissions")
    .select("id, lesson_id, student_id, status, html_content, pdf_path, viewed_at, submitted_at, created_at")
    .eq("lesson_id", lessonId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

// État intermédiaire : ne touche ni au statut ni au PDF, aucune notification
// envoyée au formateur — l'élève peut y revenir plus tard.
export async function saveMissionDraft(lessonId: string, studentId: string, htmlContent: string): Promise<void> {
  const { error } = await supabase
    .from("mission_submissions")
    .upsert(
      { lesson_id: lessonId, student_id: studentId, html_content: htmlContent, updated_at: new Date().toISOString() },
      { onConflict: "lesson_id,student_id" },
    );
  if (error) throw error;
}

// Validation définitive : génère le PDF à partir du snapshot HTML, l'envoie
// dans le bucket privé mission-pdfs, verrouille la soumission ("submitted" —
// la policy RLS refusera toute écriture ultérieure), notifie le formateur
// assigné (si renseigné) et débloque la leçon suivante.
export async function submitMission(params: {
  lessonId: string;
  studentId: string;
  htmlContent: string;
  lessonTitle: string;
  studentName: string;
}): Promise<void> {
  const { lessonId, studentId, htmlContent, lessonTitle, studentName } = params;

  const pdfBlob = await generateMissionPdf(htmlContent);
  const pdfPath = `${studentId}/${lessonId}.pdf`;
  const { error: uploadError } = await supabase.storage.from("mission-pdfs").upload(pdfPath, pdfBlob, {
    upsert: true,
    contentType: "application/pdf",
  });
  if (uploadError) throw uploadError;

  const { data: submissionRow, error: upsertError } = await supabase
    .from("mission_submissions")
    .upsert(
      {
        lesson_id: lessonId,
        student_id: studentId,
        html_content: htmlContent,
        status: "submitted",
        pdf_path: pdfPath,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lesson_id,student_id" },
    )
    .select("id")
    .single();
  if (upsertError) throw upsertError;

  const { data: profile } = await supabase.from("profiles").select("formateur_id").eq("id", studentId).maybeSingle();
  if (profile?.formateur_id) {
    await createMissionNotification(
      profile.formateur_id,
      submissionRow.id,
      "Mission envoyée",
      `${studentName} vient de valider la mission "${lessonTitle}".`,
    );
  }

  await completeMissionLesson(studentId, lessonId);
}

// Lecture staff (fiche élève admin/formateur) : RLS (mission_submissions_select)
// ne renvoie des lignes que pour ses propres élèves (ou tout pour l'admin).
export interface MissionSubmissionForStaff extends MissionSubmission {
  lessonTitle: string;
}

export async function getSubmissionsForStudent(studentId: string): Promise<MissionSubmissionForStaff[]> {
  const { data, error } = await supabase
    .from("mission_submissions")
    .select("id, lesson_id, student_id, status, html_content, pdf_path, viewed_at, submitted_at, created_at, instance_lessons(title)")
    .eq("student_id", studentId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...mapRow(row),
    lessonTitle: (row as unknown as { instance_lessons: { title: string } | null }).instance_lessons?.title ?? "Mission",
  }));
}

export async function getMissionPdfSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("mission-pdfs").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function markMissionViewed(id: string): Promise<void> {
  const { error } = await supabase.from("mission_submissions").update({ viewed_at: new Date().toISOString() }).eq("id", id).is("viewed_at", null);
  if (error) throw error;
}
