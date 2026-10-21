// Épreuve écrite de la certification RS6776, cf.
// supabase/migrations/20261021120000_certification_exams.sql et le sujet dans
// src/app/data/certificationExam.ts.
import { supabase } from "@/app/lib/supabase/client";
import type { Json } from "@/app/lib/supabase/database.types";
import { EXAM_ALL_FIELDS, type ExamField } from "@/app/data/certificationExam";
import {
  getMyInstances, getCourseOutline, getLessonProgressMap, computeLessonStates, flattenLessons, isLessonCompleted,
} from "@/app/lib/learning";
import { getStudioImageSignedUrl } from "@/app/lib/studioImages";

export const EXAM_DURATION_DAYS = 10;

// Texte libre (ligne / paragraphe), lignes du tableau (exercice 1) ou chemin
// d'image dans le bucket studio-images (exercice 2).
export type ExamAnswerValue = string | string[][];
export type ExamAnswers = Record<string, ExamAnswerValue>;

export interface CertificationExam {
  id: string;
  studentId: string;
  examinerId: string | null;
  launchedAt: string;
  deadlineAt: string;
  status: "in_progress" | "submitted";
  answers: ExamAnswers;
  submittedAt: string | null;
  rendezVousId: string | null;
}

export interface SoutenanceInfo {
  slotDate: string;
  startTime: string;
  endTime: string;
  meetLink: string | null;
  examinerName: string;
}

const EXAM_COLUMNS = "id, student_id, examiner_id, launched_at, deadline_at, status, answers, submitted_at, rendez_vous_id";

function mapExam(r: {
  id: string; student_id: string; examiner_id: string | null; launched_at: string; deadline_at: string;
  status: "in_progress" | "submitted"; answers: Json; submitted_at: string | null; rendez_vous_id: string | null;
}): CertificationExam {
  return {
    id: r.id, studentId: r.student_id, examinerId: r.examiner_id, launchedAt: r.launched_at, deadlineAt: r.deadline_at,
    status: r.status, answers: (r.answers ?? {}) as ExamAnswers, submittedAt: r.submitted_at, rendezVousId: r.rendez_vous_id,
  };
}

export async function getExamForStudent(studentId: string): Promise<CertificationExam | null> {
  const { data, error } = await supabase.from("certification_exams").select(EXAM_COLUMNS).eq("student_id", studentId).maybeSingle();
  if (error) throw error;
  return data ? mapExam(data) : null;
}

export async function saveExamDraft(examId: string, answers: ExamAnswers): Promise<void> {
  const { error } = await supabase.from("certification_exams").update({ answers: answers as Json }).eq("id", examId);
  if (error) throw error;
}

// Validation définitive + réservation de la soutenance, en un seul appel
// (submit_certification_exam vérifie le créneau de l'examinateur).
export async function submitExam(answers: ExamAnswers, slotDate: string, startTime: string): Promise<string> {
  const { data, error } = await supabase.rpc("submit_certification_exam", { p_answers: answers as Json, p_slot_date: slotDate, p_start_time: startTime });
  if (error) throw new Error(error.message);
  return data;
}

export async function launchExam(studentId: string): Promise<void> {
  const { error } = await supabase.rpc("launch_certification_exam", { p_student_id: studentId });
  if (error) throw new Error(error.message);
}

// Annulation par l'admin (l'élève retrouve son espace normal). Une soutenance
// déjà réservée est annulée avec.
export async function cancelExam(exam: CertificationExam): Promise<void> {
  if (exam.rendezVousId) {
    const { error: rdvError } = await supabase.from("rendez_vous").update({ status: "cancelled" }).eq("id", exam.rendezVousId);
    if (rdvError) throw rdvError;
  }
  const { error } = await supabase.from("certification_exams").delete().eq("id", exam.id);
  if (error) throw error;
}

export async function getSoutenance(rdvId: string): Promise<SoutenanceInfo | null> {
  const { data, error } = await supabase.from("rendez_vous").select("slot_date, start_time, end_time, meet_link, formateur_id, status").eq("id", rdvId).maybeSingle();
  if (error) throw error;
  if (!data || data.status === "cancelled") return null;
  return {
    slotDate: data.slot_date,
    startTime: data.start_time.slice(0, 5),
    endTime: data.end_time.slice(0, 5),
    meetLink: data.meet_link,
    examinerName: await getPersonName(data.formateur_id),
  };
}

export async function getPersonName(id: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("first_name, last_name, email").eq("id", id).maybeSingle();
  return [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() || data?.email || "";
}

// Progression de l'élève sur toutes ses formations actives — la certification
// ne peut être lancée qu'une fois la dernière leçon (mission) terminée.
export async function getStudentLessonCompletion(studentId: string): Promise<{ done: number; total: number }> {
  const instances = await getMyInstances(studentId);
  const outlines = await Promise.all(instances.map((i) => getCourseOutline(i.id)));
  const allLessons = outlines.flatMap((o) => (o ? flattenLessons(o) : []));
  const progress = await getLessonProgressMap(studentId, allLessons.map((l) => l.id));
  const states = outlines.flatMap((o) => (o ? computeLessonStates(o, progress) : []));
  return { done: states.filter(isLessonCompleted).length, total: states.length };
}

export function daysLeft(deadlineAt: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - now) / 86_400_000));
}

export function isAnswered(field: ExamField, value: ExamAnswerValue | undefined): boolean {
  if (field.kind === "table") return Array.isArray(value) && value.some((row) => row.some((cell) => cell.trim()));
  return typeof value === "string" && value.trim().length > 0;
}

export function countAnswered(answers: ExamAnswers): { answered: number; total: number } {
  return {
    answered: EXAM_ALL_FIELDS.filter((f) => isAnswered(f, answers[f.id])).length,
    total: EXAM_ALL_FIELDS.length,
  };
}

// Le visuel de l'exercice 2 est soit une image du Studio, soit un fichier
// importé — dans les deux cas un chemin du bucket studio-images. Les photos
// importées sont converties en JPEG : le HEIC des iPhone ne s'affiche pas
// dans la plupart des navigateurs.
const MAX_IMAGE_SIDE = 2400;

function isHeic(nameOrType: string): boolean {
  return /hei[cf]/i.test(nameOrType);
}

export async function toJpegBlob(blob: Blob, name = ""): Promise<Blob> {
  let source: Blob = blob;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch (err) {
    if (!isHeic(blob.type) && !isHeic(name)) throw err;
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob, toType: "image/jpeg", quality: 0.9 });
    source = Array.isArray(converted) ? converted[0] : converted;
    bitmap = await createImageBitmap(source);
  }
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return source;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion impossible."))), "image/jpeg", 0.9));
}

export async function uploadExamImage(userId: string, file: File): Promise<string> {
  const jpeg = await toJpegBlob(file, file.name);
  const path = `${userId}/certification/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("studio-images").upload(path, jpeg, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

// URL affichable dans une balise <img> : les HEIC importés avant la
// conversion à l'import sont convertis à la volée (URL blob locale).
export async function getExamImageUrl(path: string): Promise<string> {
  const signed = await getStudioImageSignedUrl(path);
  if (!isHeic(path)) return signed;
  const blob = await (await fetch(signed)).blob();
  return URL.createObjectURL(await toJpegBlob(blob, path));
}

export function formatDateFR(iso: string, withTime = false): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function formatSlotFR(slotDate: string, startTime: string): string {
  const d = new Date(`${slotDate}T00:00:00`);
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(d);
  return `${day} à ${startTime.replace(":", "h")}`;
}
