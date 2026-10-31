import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CheckCircle2, PenLine } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Logo } from "@/app/components/common/Logo";
import { Background } from "@/app/components/common/Background";
import { ShimBtn } from "@/app/components/common/Buttons";
import { getDocumentForSigning, signDocument, type DocumentToSign } from "@/app/lib/trainingSessions";
import { stampSignature } from "@/app/lib/documents/render";

// Signature d'un devis, d'une convention ou d'un contrat par lien personnel,
// sans compte : le signataire coche une case puis clique sur « Signer ».
// L'heure, l'adresse IP et le navigateur sont relevés côté base.
export function SignDocumentPage() {
  const th = useTh();
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<DocumentToSign | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getDocumentForSigning(token)
      .then((d) => { setDoc(d); setState(d ? "ready" : "missing"); })
      .catch((err) => { console.error(err); setState("missing"); });
  }, [token]);

  const sign = async () => {
    if (!token || !doc) return;
    setSigning(true);
    setError(null);
    try {
      const signedAt = await signDocument(token);
      setDoc({ ...doc, signedAt });
    } catch (err) {
      console.error(err);
      setError("La signature n'a pas pu être enregistrée. Réessayez dans un instant.");
    } finally {
      setSigning(false);
    }
  };

  const signedLabel = doc?.signedAt
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(doc.signedAt))
    : null;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: th.bg }}>
      <Background />
      <header className="px-5 sm:px-8 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${th.sep}` }}>
        <Logo h={26} />
        {doc && <p className="text-sm font-semibold truncate" style={{ color: th.fg2 }}>{doc.title}</p>}
      </header>

      {state === "loading" && <p className="p-8 text-sm" style={{ color: th.fg3 }}>Chargement du document…</p>}
      {state === "missing" && (
        <div className="p-8 max-w-xl">
          <p className="text-lg font-black" style={{ color: th.fg }}>Lien invalide</p>
          <p className="text-sm mt-2" style={{ color: th.fg2 }}>Ce lien de signature n'existe pas ou n'est plus valable. Contactez Les Formateurs IA à contact@les-formateurs-ia.fr.</p>
        </div>
      )}

      {state === "ready" && doc && (
        <>
          <iframe title={doc.title} srcDoc={doc.signedAt ? stampSignature(doc.html, "client", doc.signerName ?? "", doc.signedAt) : doc.html} sandbox="allow-same-origin allow-modals" className="flex-1 w-full" style={{ minHeight: "60vh", border: 0, background: "#eef0f4" }} />
          <footer className="sticky bottom-0 px-5 sm:px-8 py-4" style={{ background: th.card, borderTop: `1px solid ${th.sep}` }}>
            {doc.signedAt ? (
              <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: th.fg }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "#1BAF7A" }} />
                Document signé{doc.signerName ? ` par ${doc.signerName}` : ""} le {signedLabel}. Merci, vous pouvez fermer cette page.
              </p>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-start gap-2.5 text-sm flex-1 min-w-[260px] cursor-pointer" style={{ color: th.fg }}>
                  <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
                  <span>
                    {doc.signerName ? <>Je soussigné(e) <strong>{doc.signerName}</strong>, </> : null}
                    j'ai lu le document et j'en accepte les termes. Je reconnais que cette validation vaut signature.
                  </span>
                </label>
                <ShimBtn sm onClick={sign} disabled={!accepted || signing}><PenLine className="w-4 h-4" />{signing ? "Signature…" : "Signer"}</ShimBtn>
                {error && <p className="w-full text-sm" style={{ color: th.danger }}>{error}</p>}
              </div>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
