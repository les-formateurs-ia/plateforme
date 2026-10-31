import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { previewFormationEmail, sendFormationEmail, type EmailKind, type EmailRecipient } from "@/app/lib/trainingSessions";

// Fenêtre de confirmation avant tout envoi d'e-mail : destinataires à
// cocher, aperçu exact de l'e-mail de chacun (généré par la fonction qui
// l'enverra), puis envoi aux seuls destinataires retenus.

export const EMAIL_KIND_LABELS: Record<EmailKind, string> = {
  convocation: "Convocations", rappel: "Rappel de séance", certificat: "Certificats", "espace-client": "Espace client",
};

export function EmailComposer({ sessionId, kind, onClose, onSent, onFallback }: {
  sessionId: string;
  kind: EmailKind | null;
  onClose: () => void;
  onSent: () => void;
  // Espace client : e-mail pré-rempli si l'envoi par Gmail est impossible.
  onFallback?: () => void;
}) {
  const th = useTh();
  const [recipients, setRecipients] = useState<EmailRecipient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!kind) return;
    setRecipients(null);
    setError(null);
    previewFormationEmail(sessionId, kind)
      .then((r) => {
        setRecipients(r);
        setSelected(new Set(r.filter((x) => x.eligible).map((x) => x.key)));
        setFocus(r.find((x) => x.eligible)?.key ?? r[0]?.key ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Aperçu impossible."));
  }, [sessionId, kind]);

  const eligible = recipients?.filter((r) => r.eligible) ?? [];
  const allChecked = eligible.length > 0 && eligible.every((r) => selected.has(r.key));
  const focused = recipients?.find((r) => r.key === focus) ?? null;

  const toggle = (key: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const send = async () => {
    if (!kind) return;
    setSending(true);
    try {
      const r = await sendFormationEmail(sessionId, kind, [...selected]);
      if (r.errors.length) toast.error(`Échec pour ${r.errors.map((e) => e.email).join(", ")} : ${r.errors[0].message}`);
      if (r.sent.length) toast.success(`${r.sent.length} e-mail${r.sent.length > 1 ? "s envoyés" : " envoyé"}.`);
      onSent();
      if (!r.errors.length) onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Envoi impossible.";
      toast.error(message);
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={!!kind} onOpenChange={(open) => { if (!open && !sending) onClose(); }}>
      <DialogContent className="sm:max-w-5xl w-full p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${th.sep}` }}>
          <DialogTitle className="flex items-center gap-2 text-lg font-black"><Mail className="w-5 h-5" />{kind ? EMAIL_KIND_LABELS[kind] : ""}</DialogTitle>
          <p className="text-xs mt-1" style={{ color: th.fg3 }}>Vérifie l'e-mail et les destinataires avant l'envoi depuis le compte Gmail de la plateforme.</p>
        </div>

        {!recipients && !error && <p className="p-8 text-sm" style={{ color: th.fg3 }}>Préparation de l'aperçu…</p>}
        {error && (
          <div className="p-6 space-y-3">
            <p className="text-sm font-semibold" style={{ color: th.danger }}>{error}</p>
            {kind === "espace-client" && onFallback && <VBtn sm onClick={() => { onFallback(); onClose(); }}>Ouvrir un e-mail pré-rempli à la place</VBtn>}
          </div>
        )}

        {recipients && (
          <div className="grid md:grid-cols-[290px_minmax(0,1fr)]" style={{ height: "min(68dvh, 640px)" }}>
            <div className="flex flex-col min-h-0" style={{ borderRight: `1px solid ${th.sep}` }}>
              <label className="flex items-center gap-2.5 px-4 py-3 text-xs font-bold cursor-pointer" style={{ borderBottom: `1px solid ${th.sep}`, color: th.fg2 }}>
                <input type="checkbox" className="w-4 h-4" checked={allChecked} disabled={!eligible.length}
                  onChange={() => setSelected(allChecked ? new Set() : new Set(eligible.map((r) => r.key)))} />
                Destinataires · {selected.size}/{eligible.length}
              </label>
              <div className="flex-1 overflow-y-auto">
                {!recipients.length && <p className="p-4 text-xs" style={{ color: th.fg3 }}>Aucun destinataire : ajoute des stagiaires à la formation.</p>}
                {recipients.map((r) => (
                  <div key={r.key} className="flex items-start gap-2.5 px-4 py-2.5 cursor-pointer"
                    style={{ background: focus === r.key ? th.navA : "transparent", opacity: r.eligible ? 1 : 0.55 }}
                    onClick={() => setFocus(r.key)}>
                    <input type="checkbox" className="w-4 h-4 mt-0.5 shrink-0" disabled={!r.eligible} checked={selected.has(r.key)}
                      onClick={(e) => e.stopPropagation()} onChange={() => toggle(r.key)} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: th.fg }}>{r.name}</p>
                      <p className="text-[11px] truncate" style={{ color: th.fg3 }}>{r.email || "—"}</p>
                      {r.reason && <p className="text-[11px]" style={{ color: th.danger }}>{r.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col min-h-0">
              {focused ? (
                <>
                  <div className="px-4 py-3 text-xs space-y-0.5" style={{ borderBottom: `1px solid ${th.sep}` }}>
                    <p style={{ color: th.fg3 }}>À : <span style={{ color: th.fg }}>{focused.name} &lt;{focused.email || "—"}&gt;</span></p>
                    <p style={{ color: th.fg3 }}>Objet : <span className="font-semibold" style={{ color: th.fg }}>{focused.subject}</span></p>
                  </div>
                  <iframe title="Aperçu de l'e-mail" srcDoc={focused.html} sandbox="" className="flex-1 w-full" style={{ border: 0, background: "#f2f3f7" }} />
                </>
              ) : <p className="p-6 text-sm" style={{ color: th.fg3 }}>Sélectionne un destinataire pour voir son e-mail.</p>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${th.sep}` }}>
          <VBtn sm onClick={onClose} disabled={sending}>Annuler</VBtn>
          <ShimBtn sm onClick={() => void send()} disabled={sending || !selected.size}>
            <Send className="w-4 h-4" />{sending ? "Envoi…" : `Envoyer à ${selected.size} destinataire${selected.size > 1 ? "s" : ""}`}
          </ShimBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}
