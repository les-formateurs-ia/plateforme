// Fiche élève (admin) : génère le lien "Définir votre mot de passe" à
// transmettre à l'élève pour qu'il remplace le mot de passe de test par le
// sien (cf. src/app/lib/passwordSetup.ts). Le lien n'est affiché qu'ici, au
// moment de sa création : la base n'en garde que le hash, il ne peut donc
// pas être réaffiché — en générer un nouveau annule le précédent.
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Link2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { ShimBtn } from "@/app/components/common/Buttons";
import { generatePasswordLink } from "@/app/lib/passwordSetup";

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export function GeneratePasswordLinkButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const th = useTh();
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try {
      setLink(await generatePasswordLink(studentId));
      setCopied(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de générer le lien.");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success("Lien copié.");
    } catch {
      toast.error("Copie impossible : sélectionne le lien et copie-le à la main.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={generating}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
        style={{ background: th.navA, border: `1px solid ${th.gradShadow(0.35)}`, color: th.navAC }}
      >
        <Link2 className="w-4 h-4" />{generating ? "Génération…" : "Générer le lien"}
      </button>

      <Dialog open={!!link} onOpenChange={(v) => { if (!v) setLink(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lien « Définir votre mot de passe »</DialogTitle>
            <DialogDescription>
              À envoyer à {studentName} : il lui permet de choisir son propre mot de passe, sur son compte actuel.
            </DialogDescription>
          </DialogHeader>

          {link && (
            <div className="space-y-4 text-sm min-w-0">
              <div className="flex gap-2 min-w-0">
                <input
                  readOnly
                  value={link.url}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Lien à transmettre à l'élève"
                  className="flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-xs g-input"
                />
                <ShimBtn sm onClick={copy}>
                  <span className="flex items-center gap-1.5">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? "Copié" : "Copier"}</span>
                </ShimBtn>
              </div>
              <ul className="space-y-1.5" style={{ color: th.fg2 }}>
                <li>Valable jusqu'au <strong style={{ color: th.fg }}>{formatExpiry(link.expiresAt)}</strong> (72 h).</li>
                <li>Utilisable une seule fois, uniquement pour ce compte.</li>
                <li>Tout lien généré auparavant pour cet élève ne fonctionne plus.</li>
                <li>Ce lien ne sera plus affiché après fermeture : copie-le maintenant.</li>
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
