// Épreuve écrite de certification (élève) : introduction, 6 exercices puis
// validation. Réponses enregistrées en brouillon (bouton + sauvegarde
// automatique) ; la validation définitive impose de réserver d'abord la
// soutenance sur un créneau de l'examinateur (submit_certification_exam).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, Check, ChevronLeft, ChevronRight, Hourglass, Loader2, Save } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { useProfile } from "@/app/state/profile-context";
import { useCertification } from "@/app/state/certification-context";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn } from "@/app/components/common/Buttons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { ExamBlocks, ExerciseView } from "@/app/components/certification/CertificationExamView";
import { EXAM_ALL_FIELDS, EXAM_CERTIFICATION_TITLE, EXAM_EXERCISES, EXAM_IDENTITY_FIELDS, EXAM_INTRO } from "@/app/data/certificationExam";
import {
  countAnswered, daysLeft, formatSlotFR, isAnswered, saveExamDraft, submitExam,
  type ExamAnswers, type ExamAnswerValue,
} from "@/app/lib/certification";
import { addDays, firstBookableDate, listAvailableSlotsForBooking, syncMeetEvent, toISODate, type ExpertAvailableSlot } from "@/app/lib/availability";

const AUTOSAVE_MS = 20_000;
const STEPS = ["Introduction", ...EXAM_EXERCISES.map((e) => `Exercice ${e.number}`), "Validation"];

export function CertificationExamPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { exam, loading, refresh } = useCertification();
  const [answers, setAnswers] = useState<ExamAnswers>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [step, setStep] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const initialized = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Prénom/nom et organisme pré-remplis au premier passage.
  useEffect(() => {
    if (!exam || initialized.current) return;
    initialized.current = true;
    setAnswers({
      "identity.fullName": profile.name,
      "identity.organisme": "Les Formateurs IA",
      ...exam.answers,
    });
  }, [exam, profile.name]);

  const save = useCallback(async (silent = false) => {
    if (!exam || saving) return;
    setSaving(true);
    try {
      await saveExamDraft(exam.id, answers);
      setDirty(false);
      setSavedAt(new Date());
      void refresh();
      if (!silent) toast.success("Brouillon enregistré.");
    } catch (err) {
      console.error(err);
      if (!silent) toast.error("Enregistrement impossible. Vérifie ta connexion.");
    } finally {
      setSaving(false);
    }
  }, [exam, answers, saving, refresh]);

  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => void save(true), AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [dirty, save]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setAnswer = (id: string, value: ExamAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setDirty(true);
  };

  const goTo = (i: number) => {
    setStep(i);
    if (dirty) void save(true);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const missing = useMemo(() => EXAM_ALL_FIELDS.filter((f) => !isAnswered(f, answers[f.id])), [answers]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: th.fg3 }} /></div>;
  if (!exam || exam.status !== "in_progress") return <Navigate to="/certification" replace />;

  const left = daysLeft(exam.deadlineAt);
  const { answered, total } = countAnswered(answers);
  const exercise = step >= 1 && step <= EXAM_EXERCISES.length ? EXAM_EXERCISES[step - 1] : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div ref={topRef} />
      {/* Barre d'épreuve : décompte, avancement, brouillon. */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-3 flex-wrap" style={{ background: th.card, borderBottom: `1px solid ${th.sep}` }}>
        <button type="button" onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: th.fg2 }}>
          <ChevronLeft className="w-4 h-4" />Accueil
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: left <= 2 ? th.danger : th.fg }}>
          <Hourglass className="w-4 h-4" />{left} jour{left > 1 ? "s" : ""} restant{left > 1 ? "s" : ""}
        </span>
        <span className="text-sm" style={{ color: th.fg3 }}>{answered}/{total} réponses</span>
        <span className="ml-auto text-xs" style={{ color: th.fg3 }}>
          {saving ? "Enregistrement…" : dirty ? "Modifications non enregistrées" : savedAt ? `Enregistré à ${savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </span>
        <button type="button" onClick={() => void save()} disabled={saving || !dirty}
          className="inline-flex items-center gap-2 px-4 min-h-9 rounded-[2px] text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40" style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
          <Save className="w-4 h-4" />Enregistrer le brouillon
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <button key={label} type="button" onClick={() => goTo(i)}
              className="shrink-0 px-3.5 py-2 rounded-[2px] text-[13px] font-semibold transition-colors"
              style={step === i ? { background: th.ink, color: th.onInk } : { color: th.fg2, border: `1px solid ${th.sep}` }}>
              {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <GCard>
            <div className="p-5 sm:p-8 space-y-6">
              <div className="text-center space-y-3">
                <p className="text-sm font-bold underline" style={{ color: "#e8916b" }}>CERTIFICATION :</p>
                <p className="text-lg font-bold" style={{ color: th.fg }}>{EXAM_CERTIFICATION_TITLE}.</p>
                <p className="text-2xl font-black" style={{ color: th.fg }}>SUJET DE VOTRE EVALUATION</p>
              </div>
              <div className="space-y-4">
                <p className="text-[15px] font-bold" style={{ color: th.fg }}>Veuillez indiquer :</p>
                {EXAM_IDENTITY_FIELDS.map((f) => (
                  <label key={f.id} className="block space-y-1.5">
                    <span className="text-sm" style={{ color: th.fg2 }}>{f.label}</span>
                    <input value={typeof answers[f.id] === "string" ? answers[f.id] as string : ""} onChange={(e) => setAnswer(f.id, e.target.value)}
                      className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
                  </label>
                ))}
              </div>
              <ExamBlocks blocks={EXAM_INTRO} />
              <p className="text-sm italic" style={{ color: "#e8916b" }}>Toutes les réponses à apporter sont indiquées en couleur.</p>
            </div>
          </GCard>
        )}

        {exercise && <ExerciseView exercise={exercise} answers={answers} onChange={setAnswer} userId={user?.id} />}

        {step === STEPS.length - 1 && (
          <GCard>
            <div className="p-5 sm:p-8 space-y-5">
              <h2 className="text-2xl font-black" style={{ color: th.fg }}>Valider mon écrit</h2>
              <p className="text-[15px] leading-relaxed" style={{ color: th.fg2 }}>
                Une fois validé, ton écrit est transmis à ton examinateur et ne peut plus être modifié. Tu dois choisir dès maintenant le créneau de ta soutenance orale (environ 20 minutes).
              </p>
              {missing.length > 0 ? (
                <div className="rounded-[6px] p-4 space-y-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <p className="text-sm font-bold flex items-center gap-2" style={{ color: th.danger }}><AlertTriangle className="w-4 h-4" />{missing.length} réponse{missing.length > 1 ? "s" : ""} encore vide{missing.length > 1 ? "s" : ""}</p>
                  <ul className="text-sm space-y-1" style={{ color: th.fg2 }}>
                    {missing.map((f) => <li key={f.id}>· {fieldLocation(f.id)}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: th.success }}><Check className="w-4 h-4" />Toutes les questions ont une réponse.</p>
              )}
              <ShimBtn onClick={() => setBookingOpen(true)}>
                <span className="flex items-center gap-2"><CalendarClock className="w-4 h-4" />Choisir mon créneau et valider</span>
              </ShimBtn>
            </div>
          </GCard>
        )}

        <div className="flex justify-between gap-3 pb-6">
          <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0}
            className="inline-flex items-center gap-1.5 px-4 min-h-10 rounded-[2px] text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-30" style={{ color: th.fg, border: `1px solid ${th.sep}` }}>
            <ChevronLeft className="w-4 h-4" />Précédent
          </button>
          {step < STEPS.length - 1 && (
            <button type="button" onClick={() => goTo(step + 1)}
              className="inline-flex items-center gap-1.5 px-4 min-h-10 rounded-[2px] text-sm font-semibold transition-opacity hover:opacity-80" style={{ background: th.ink, color: th.onInk }}>
              {STEPS[step + 1]}<ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {bookingOpen && exam.examinerId && (
        <SoutenanceBookingDialog
          examinerId={exam.examinerId}
          missingCount={missing.length}
          onClose={() => setBookingOpen(false)}
          onConfirm={async (slot) => {
            const rdvId = await submitExam(answers, slot.slotDate, slot.startTime);
            setDirty(false);
            void syncMeetEvent(rdvId);
            await refresh();
            toast.success("Écrit validé, soutenance réservée !");
            navigate("/certification", { replace: true });
          }}
        />
      )}
      {bookingOpen && !exam.examinerId && (
        <Dialog open onOpenChange={() => setBookingOpen(false)}>
          <DialogContent><DialogHeader><DialogTitle>Aucun examinateur</DialogTitle><DialogDescription>Aucun examinateur n'est désigné pour ta soutenance : contacte ton formateur.</DialogDescription></DialogHeader></DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function fieldLocation(id: string): string {
  if (id.startsWith("identity.")) return `Introduction — ${EXAM_IDENTITY_FIELDS.find((f) => f.id === id)?.label.replace(" :", "")}`;
  for (const ex of EXAM_EXERCISES) {
    for (const part of ex.parts) {
      const f = part.fields.find((x) => x.id === id);
      if (f) return `Exercice ${ex.number}${part.heading ? ` (${part.heading.split(" - ")[0]})` : ""} — question ${f.label.split("/")[0]}`;
    }
  }
  return id;
}

const SLOTS_WINDOW_DAYS = 45;

function SoutenanceBookingDialog({ examinerId, missingCount, onClose, onConfirm }: {
  examinerId: string;
  missingCount: number;
  onClose: () => void;
  onConfirm: (slot: ExpertAvailableSlot) => Promise<void>;
}) {
  const th = useTh();
  const [slots, setSlots] = useState<ExpertAvailableSlot[] | null>(null);
  const [selected, setSelected] = useState<ExpertAvailableSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const from = firstBookableDate();
    listAvailableSlotsForBooking(examinerId, toISODate(from), toISODate(addDays(from, SLOTS_WINDOW_DAYS)))
      .then(setSlots)
      .catch((err) => { console.error(err); setSlots([]); });
  }, [examinerId]);

  const byDay = useMemo(() => {
    const map = new Map<string, ExpertAvailableSlot[]>();
    for (const s of slots ?? []) map.set(s.slotDate, [...(map.get(s.slotDate) ?? []), s]);
    return [...map.entries()];
  }, [slots]);

  const confirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation impossible.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Réserve ta soutenance</DialogTitle>
          <DialogDescription>
            Choisis un créneau avec ton examinateur{slots?.[0] ? `, ${slots[0].formateurName}` : ""}. La soutenance dure environ 20 minutes, en visio.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[45vh] overflow-y-auto space-y-4">
          {slots === null && <p className="text-sm" style={{ color: th.fg3 }}>Chargement des créneaux…</p>}
          {slots?.length === 0 && (
            <p className="text-sm" style={{ color: th.fg2 }}>Aucun créneau n'est disponible pour le moment. Enregistre ton brouillon et reviens un peu plus tard, ou préviens ton formateur.</p>
          )}
          {byDay.map(([day, list]) => (
            <div key={day}>
              <p className="text-sm font-bold mb-2 first-letter:uppercase" style={{ color: th.fg }}>
                {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day}T00:00:00`))}
              </p>
              <div className="flex flex-wrap gap-2">
                {list.map((s) => {
                  const active = selected?.slotDate === s.slotDate && selected.startTime === s.startTime;
                  return (
                    <button key={s.startTime} type="button" onClick={() => setSelected(s)}
                      className="px-3 py-2 rounded-[2px] text-sm font-semibold transition-colors"
                      style={active ? { background: th.ink, color: th.onInk } : { color: th.fg, border: `1px solid ${th.inputB}` }}>
                      {s.startTime.replace(":", "h")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="rounded-[6px] p-3 text-sm" style={{ background: th.inputBg, color: th.fg }}>
            Soutenance le <strong>{formatSlotFR(selected.slotDate, selected.startTime)}</strong>.
            {missingCount > 0 && <span style={{ color: th.danger }}> Attention : {missingCount} réponse{missingCount > 1 ? "s" : ""} vide{missingCount > 1 ? "s" : ""}.</span>}
            {" "}Ton écrit ne sera plus modifiable.
          </div>
        )}
        {error && <p className="text-sm" style={{ color: th.danger }}>{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2.5 rounded-[2px] text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: th.fg2 }}>
            Annuler
          </button>
          <ShimBtn onClick={confirm} disabled={!selected || submitting}>
            {submitting ? "Validation…" : "Valider mon écrit et réserver"}
          </ShimBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}

