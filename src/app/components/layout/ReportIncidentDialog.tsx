import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { VSelect } from "@/app/components/common/Select";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { reportIncident, INCIDENT_PAGE_OPTIONS } from "@/app/lib/incidents";
import type { IncidentPage } from "@/app/lib/supabase/database.types";

export function ReportIncidentDialog() {
  const th = useTh();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<IncidentPage | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setPage(""); setDescription(""); };

  const submit = async () => {
    if (!user || !page || !description.trim()) return;
    setSubmitting(true);
    try {
      await reportIncident(user.id, page, description);
      toast.success("Incident signalé — merci, on s'en occupe.");
      reset();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'envoyer le signalement. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}
        title="Signaler un incident"
      >
        <Flag className="w-4 h-4" style={{ color: th.fg3 }} />
      </button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler un incident</DialogTitle>
          <DialogDescription>Un bug technique à remonter ? Décris-le, on le corrige.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: th.fg3 }}>Page concernée</label>
            <VSelect value={page} onValueChange={(v) => setPage(v as IncidentPage)} options={INCIDENT_PAGE_OPTIONS} placeholder="Choisis une page…" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: th.fg3 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qu'est-ce qui ne fonctionne pas ?"
              rows={4}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm g-input resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <VBtn sm onClick={() => setOpen(false)} disabled={submitting}>Annuler</VBtn>
          <ShimBtn sm onClick={submit} disabled={submitting || !page || !description.trim()}>
            {submitting ? "Envoi…" : "Envoyer"}
          </ShimBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
