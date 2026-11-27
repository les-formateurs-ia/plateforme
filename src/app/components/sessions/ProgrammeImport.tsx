import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Eye, FileUp, Loader2 } from "lucide-react";
import logoSvg from "@/imports/logo-les-formateurs-ia.svg?raw";
import { useTh } from "@/app/theme/theme";
import { importProgramme, PROGRAMME_ACCEPT, type ImportStep } from "@/app/lib/programmeImportClient";
import type { ProgrammeImport as ImportResult } from "@/app/lib/documents/programmeImport";
import { DOCUMENT_TEMPLATES, renderTemplate } from "@/app/lib/documents/catalog";
import { openDocument } from "@/app/lib/documents/openDocument";
import { SAMPLE_ENTREPRISE } from "@/app/lib/documents/samples";
import { todayIso } from "@/app/lib/documents/session";
import type { Formation, Intervenant } from "@/app/lib/documents/types";

// Import d'un programme existant (PDF ou Word) : Claude remplit les champs
// du programme, que l'on vérifie avant d'enregistrer. Le programme remis au
// client est le modèle de la plateforme, rempli avec ces champs.

const STEP_LABELS: Record<ImportStep, string> = {
  lecture: "Lecture du document…",
  analyse: "Claude relève le programme (30 s à 1 min)…",
};

export function ProgrammeImportZone({ base, onImported }: {
  base: Formation;
  onImported: (result: ImportResult, fileName: string) => void;
}) {
  const th = useTh();
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep | null>(null);
  const [over, setOver] = useState(false);

  const run = async (file: File | undefined) => {
    if (!file || step) return;
    try {
      const result = await importProgramme(file, base, setStep);
      onImported(result, file.name);
      toast.success("Programme importé : vérifiez les champs avant d'enregistrer.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Import du programme impossible.");
    } finally {
      setStep(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div role="button" tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") input.current?.click(); }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void run(e.dataTransfer.files[0]); }}
      className="rounded-[10px] p-4 flex items-center gap-3 cursor-pointer transition-colors"
      style={{ border: `1.5px dashed ${over ? "#2A78D6" : th.sep}`, background: over ? "#2A78D610" : "transparent" }}>
      <span className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "#2A78D61f", color: "#2A78D6" }}>
        {step ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold" style={{ color: th.fg }}>{step ? STEP_LABELS[step] : "Importer un programme (PDF ou Word)"}</span>
        <span className="block text-[11px] mt-0.5" style={{ color: th.fg3 }}>
          Déposez le fichier ici ou cliquez. Les champs du programme se remplissent, puis le PDF suit la charte de la plateforme.
        </span>
      </span>
      <input ref={input} type="file" accept={PROGRAMME_ACCEPT} className="hidden" onChange={(e) => void run(e.target.files?.[0])} />
    </div>
  );
}

// Le programme tel que le client le recevra (modèle de la plateforme), dans un nouvel onglet.
export function previewProgramme(formation: Formation, intervenants?: Intervenant[]) {
  const template = DOCUMENT_TEMPLATES.find((t) => t.id === "programme")!;
  const ctx = {
    ...SAMPLE_ENTREPRISE, formation, dateDocument: todayIso(),
    session: { ...SAMPLE_ENTREPRISE.session, intervenants: intervenants ?? SAMPLE_ENTREPRISE.session.intervenants },
  };
  openDocument(renderTemplate(template, ctx, logoSvg)).catch((err) => toast.error(err instanceof Error ? err.message : String(err)));
}

// Ce que l'import a trouvé, et ce qu'il reste à vérifier.
export function ProgrammeImportSummary({ result, fileName, formation, intervenants }: {
  result: ImportResult; fileName: string; formation: Formation; intervenants?: Intervenant[];
}) {
  const th = useTh();
  const preview = () => previewProgramme(formation, intervenants);
  return (
    <div className="rounded-[10px] p-4 space-y-2.5" style={{ background: th.navA }}>
      <div className="flex items-center gap-2 flex-wrap">
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#1BAF7A" }} />
        <p className="text-sm font-bold flex-1 min-w-0 truncate" style={{ color: th.fg }}>« {fileName} » importé</p>
        <button type="button" onClick={preview} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-[2px] hover:opacity-70"
          style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
          <Eye className="w-3.5 h-3.5" />Aperçu du PDF
        </button>
      </div>
      {result.manquants.length > 0 && (
        <p className="text-xs flex gap-1.5" style={{ color: "#c2410c" }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span><strong>Absent du document (Qualiopi) :</strong> {result.manquants.join(", ")}.</span>
        </p>
      )}
      {result.reprises.length > 0 && (
        <p className="text-xs" style={{ color: th.fg2 }}>
          <strong>Repris du modèle, à vérifier :</strong> {result.reprises.join(", ")}.
        </p>
      )}
      {result.prixHt != null && (
        <p className="text-xs" style={{ color: th.fg2 }}>Prix relevé : {result.prixHt.toLocaleString("fr-FR")} € HT, reporté sur le devis.</p>
      )}
    </div>
  );
}
