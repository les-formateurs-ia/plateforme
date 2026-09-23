// Fiche élève (admin) : remet le compte à zéro après un parcours de test,
// avant de le confier au vrai élève. La liste affichée ici doit rester
// alignée sur admin_reset_student_stats (migration 20260923200000).
import { useState } from "react";
import { toast } from "sonner";
import { Check, RotateCcw, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { resetStudentStats } from "@/app/lib/students";

const RESET_ITEMS = [
  "La progression : leçons et modules terminés — l'élève repart du module 1, leçon 1",
  "Les résultats des QCM et les badges obtenus",
  "Les missions enregistrées ou rendues (et leurs PDF)",
  "Les conversations avec l'Agent IA et sa mémoire de l'élève",
  "Tout Le Studio : images, vidéos, musiques, voix, doublages, talking heads et conversations ChatGPT / Gemini / Claude",
  "La consommation de crédits IA (remise à 0 $)",
];

const KEPT_ITEMS = [
  "Le compte de l'élève et son profil",
  "Les formations personnalisées attribuées, leur contenu et leurs réglages",
  "Le plafond de crédits IA et l'historique des recharges",
  "Le formateur, les rendez-vous et les exercices pratiques",
];

export function ResetStudentStatsButton({ studentId, studentName, onReset }: { studentId: string; studentName: string; onReset: () => void }) {
  const th = useTh();
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const confirm = async () => {
    setResetting(true);
    try {
      await resetStudentStats(studentId);
      toast.success("Statistiques réinitialisées : l'élève repart de zéro.");
      setOpen(false);
      onReset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
      >
        <RotateCcw className="w-4 h-4" />Réinitialiser les statistiques
      </button>

      <Dialog open={open} onOpenChange={(v) => !resetting && setOpen(v)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Réinitialiser les statistiques ?</DialogTitle>
            <DialogDescription>
              Le compte de {studentName} sera remis comme au premier jour de formation. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-bold mb-1.5" style={{ color: th.fg }}>Sera réinitialisé</p>
              <ul className="space-y-1">
                {RESET_ITEMS.map((item) => (
                  <li key={item} className="flex gap-2" style={{ color: th.fg2 }}><X className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold mb-1.5" style={{ color: th.fg }}>Sera conservé</p>
              <ul className="space-y-1">
                {KEPT_ITEMS.map((item) => (
                  <li key={item} className="flex gap-2" style={{ color: th.fg2 }}><Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} disabled={resetting} className="px-4 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: th.fg2 }}>
              Annuler
            </button>
            <button type="button" onClick={confirm} disabled={resetting} className="px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60" style={{ background: "#ef4444" }}>
              {resetting ? "Réinitialisation…" : "Confirmer la réinitialisation"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
