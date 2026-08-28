import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { ShimBtn } from "@/app/components/common/Buttons";
import { useTh } from "@/app/theme/theme";

export function SessionEditDialog({
  open, onOpenChange, initialName, initialDescription, withDescription, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialDescription?: string;
  withDescription?: boolean;
  onSave: (patch: { name: string; description?: string }) => Promise<void>;
}) {
  const th = useTh();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription ?? "");
    }
  }, [open, initialName, initialDescription]);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), ...(withDescription ? { description: description.trim() } : {}) });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renommer ce dossier</DialogTitle>
          <DialogDescription>Donne-lui un nom qui te parle, tu le retrouveras plus facilement dans ton historique.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Nom</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSave(); } }}
              placeholder="Ex. Landing page SaaS" className="w-full rounded-xl px-4 py-2.5 text-sm g-input"
            />
          </div>
          {withDescription && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: th.fg3 }}>Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="À quoi sert cette page ?" className="w-full rounded-xl px-4 py-2.5 text-sm g-input resize-none"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ background: "transparent", border: `1px solid ${th.sep}`, color: th.fg3 }}>
            Annuler
          </button>
          <ShimBtn sm onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
