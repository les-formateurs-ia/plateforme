import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, History } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { activateProgrammeVersion, listProgrammeVersions, type ProgrammeVersion } from "@/app/lib/trainingSessions";
import type { Formation, Intervenant } from "@/app/lib/documents/types";
import { previewProgramme } from "./ProgrammeImport";

// Versions du programme d'une session : chaque création, import ou
// modification enregistrée en ajoute une ; la version active est celle que
// le client reçoit (documents, espace client).

const SOURCE_LABELS: Record<ProgrammeVersion["source"], string> = {
  origine: "Programme d'origine",
  creation: "Création du dossier",
  import: "Importé",
  modification: "Modifié dans le dossier",
};

const dateHeure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

export function ProgrammeVersionsCard({ sessionId, refreshKey, dirty, intervenants, onActivated }: {
  sessionId: string;
  // Change à chaque nouvelle version enregistrée : la liste se recharge.
  refreshKey: number;
  // Saisie non enregistrée : changer de version l'écraserait.
  dirty: boolean;
  intervenants: Intervenant[];
  onActivated: (formation: Formation) => void;
}) {
  const th = useTh();
  const [versions, setVersions] = useState<ProgrammeVersion[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      setVersions(await listProgrammeVersions(sessionId));
    } catch (err) {
      console.error(err);
      setMissing(true);
    }
  };
  useEffect(() => { void load(); }, [sessionId, refreshKey]);

  const activate = async (v: ProgrammeVersion) => {
    if (dirty) return toast.error("Enregistrez ou annulez d'abord vos modifications du dossier.");
    setBusy(v.id);
    try {
      await activateProgrammeVersion(v.id);
      onActivated(v.formation);
      await load();
      toast.success(`Version ${v.numero} active : c'est celle que voit le client.`);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de changer de version.");
    } finally {
      setBusy(null);
    }
  };

  if (missing) {
    return <p className="text-xs" style={{ color: th.fg3 }}>Versions du programme indisponibles : migration 20261127120000_programme_versions à appliquer.</p>;
  }
  if (!versions) return null;

  return (
    <div className="rounded-[10px] p-4 space-y-3" style={{ border: `1px solid ${th.sep}` }}>
      <div className="flex items-center gap-2">
        <History className="w-4 h-4" style={{ color: th.fg2 }} />
        <p className="text-sm font-bold flex-1" style={{ color: th.fg }}>Versions du programme</p>
        <span className="text-[11px]" style={{ color: th.fg3 }}>La version active est celle que reçoit le client.</span>
      </div>
      {versions.length === 0 ? (
        <p className="text-xs" style={{ color: th.fg3 }}>Pas encore de version : la prochaine modification enregistrée ou le prochain import en créera une.</p>
      ) : (
        <ul className="space-y-1.5">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-[8px] px-3 py-2 flex-wrap"
              style={{ background: v.isActive ? "#1BAF7A14" : th.navA, border: `1px solid ${v.isActive ? "#1BAF7A55" : "transparent"}` }}>
              <span className="text-xs font-black tabular-nums" style={{ color: th.fg }}>V{v.numero}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold truncate" style={{ color: th.fg }}>
                  {SOURCE_LABELS[v.source]}{v.fileName ? ` : « ${v.fileName} »` : ""}
                </span>
                <span className="block text-[11px] truncate" style={{ color: th.fg3 }}>{dateHeure(v.createdAt)} · {v.formation.intitule}</span>
              </span>
              <button type="button" onClick={() => previewProgramme(v.formation, intervenants)}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-[2px] hover:opacity-70" style={{ border: `1px solid ${th.sep}`, color: th.fg }}>
                <Eye className="w-3 h-3" />Aperçu
              </button>
              {v.isActive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: "#1BAF7A" }}><CheckCircle2 className="w-3.5 h-3.5" />Active</span>
              ) : (
                <button type="button" disabled={!!busy} onClick={() => void activate(v)}
                  className="text-[11px] font-bold px-2 py-1 rounded-[2px] hover:opacity-70 disabled:opacity-40" style={{ background: th.ink, color: th.onInk }}>
                  {busy === v.id ? "…" : "Rendre active"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
