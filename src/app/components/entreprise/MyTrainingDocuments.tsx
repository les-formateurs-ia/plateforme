import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, BadgeCheck, Download, FileText, Send } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { getMyTrainingDocumentHtml, listMyTrainingDocuments, type MyTrainingDocument } from "@/app/lib/trainingSessions";

// Documents individuels de l'apprenant (convocation, attestations, certificat
// de réalisation), émis depuis le dossier de sa formation. Rien n'est affiché
// tant qu'aucun document n'a été émis pour lui.

const ICONS: Record<string, typeof FileText> = {
  convocation: Send, "certificat-realisation": Award, "attestation-fin-formation": BadgeCheck, "attestation-assiduite": BadgeCheck,
};

export function MyTrainingDocuments() {
  const th = useTh();
  const [docs, setDocs] = useState<MyTrainingDocument[]>([]);

  useEffect(() => { listMyTrainingDocuments().then(setDocs).catch(console.error); }, []);
  if (!docs.length) return null;

  // Dernière version de chaque document.
  const latest = docs.filter((d, i) => docs.findIndex((x) => x.templateId === d.templateId) === i);

  const open = async (d: MyTrainingDocument) => {
    try {
      const html = await getMyTrainingDocumentHtml(d.id);
      if (!html) return toast.error("Document introuvable.");
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'ouvrir ce document.");
    }
  };

  return (
    <GCard><div className="p-5 sm:p-6 space-y-4">
      <div>
        <p className="eyebrow" style={{ color: th.fg3 }}>Mes documents</p>
        <p className="text-lg font-black mt-1" style={{ color: th.fg }}>{latest[0].intitule || "Ma formation"}</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((d) => {
          const Icon = ICONS[d.templateId] ?? FileText;
          const isCert = d.templateId === "certificat-realisation";
          return (
            <button key={d.id} type="button" onClick={() => void open(d)}
              className="group text-left rounded-[10px] p-4 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
              style={{ background: isCert ? th.ink : th.navA, color: isCert ? th.onInk : th.fg }}>
              <Icon className="w-5 h-5" />
              <span className="text-sm font-black leading-tight">{d.title.split(" · ")[0]}</span>
              <span className="mt-auto flex items-center justify-between text-[11px] opacity-70">
                {new Date(d.issuedAt).toLocaleDateString("fr-FR")}
                <Download className="w-3.5 h-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div></GCard>
  );
}
