import { useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, Briefcase, ExternalLink, FolderUp, Star } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { eur, totalHt } from "@/app/lib/documents/render";
import {
  FACTURE_STATUT_LABELS, STATUT_COMMERCIAL_LABELS,
  type ArchiveDocument, type Facture, type StatutCommercial, type TrainingSession,
} from "@/app/lib/trainingSessions";
import { ARCHIVE_CATEGORY_LABELS, archiveDocumentUrl, uploadDigiformaFolder } from "@/app/lib/digiformaArchive";

// Suivi commercial d'une session (admin) : statut de la vente, chiffre
// d'affaires, factures et marge. Les modifications passent par le
// brouillon de la fiche (bouton « Enregistrer »).
export function CommercialCard({ draft, setDraft }: { draft: TrainingSession; setDraft: (s: TrainingSession) => void }) {
  const th = useTh();
  const ca = totalHt(draft.lignes);
  const facture = draft.factures.reduce((t, f) => t + f.montantHt, 0);
  const setFacture = (i: number, patch: Partial<Facture>) =>
    setDraft({ ...draft, factures: draft.factures.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  const stat = (label: string, value: string, color?: string) => (
    <div className="rounded-[6px] px-3 py-2" style={{ background: th.navA }}>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: th.fg3 }}>{label}</p>
      <p className="text-sm font-black tabular-nums" style={{ color: color ?? th.fg }}>{value}</p>
    </div>
  );
  return (
    <GCard><div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black" style={{ color: th.fg }}>Suivi commercial</p>
      </div>
      <VSelect value={draft.statutCommercial} onValueChange={(v) => setDraft({ ...draft, statutCommercial: v as StatutCommercial })}
        options={(Object.keys(STATUT_COMMERCIAL_LABELS) as StatutCommercial[]).map((k) => ({ value: k, label: STATUT_COMMERCIAL_LABELS[k] }))} sm />
      <div className="grid grid-cols-3 gap-2">
        {stat("CA HT", eur(ca))}
        {stat("Facturé", eur(facture))}
        {stat("Marge", eur(ca - draft.chargesHt), ca - draft.chargesHt < 0 ? th.danger : undefined)}
      </div>
      {draft.chargesHt > 0 && <p className="text-[11px]" style={{ color: th.fg3 }}>Charges (intervenants) : {eur(draft.chargesHt)} HT</p>}
      {draft.factures.map((f, i) => (
        <div key={f.numero} className="flex items-center gap-2 py-1.5" style={{ borderTop: `1px solid ${th.sep}` }}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: th.fg }}>Facture {f.numero} · {eur(f.montantHt)}</p>
            <p className="text-[11px] truncate" style={{ color: th.fg3 }}>
              {new Date(f.date).toLocaleDateString("fr-FR")}{f.destinataire ? ` · ${f.destinataire}` : ""}
            </p>
          </div>
          {f.fichier && <OpenArchive chemin={f.fichier} />}
          <div className="w-[118px] shrink-0">
            <VSelect sm value={f.statut} onValueChange={(v) => {
              const statut = v as Facture["statut"];
              setFacture(i, { statut, payeHt: statut === "payee" ? f.montantHt : 0 });
            }} options={(Object.keys(FACTURE_STATUT_LABELS) as Facture["statut"][]).map((k) => ({ value: k, label: FACTURE_STATUT_LABELS[k] }))} />
          </div>
        </div>
      ))}
      {!draft.factures.length && draft.statutCommercial === "gagne" && <p className="text-[11px]" style={{ color: th.fg3 }}>Aucune facture enregistrée.</p>}
    </div></GCard>
  );
}

function OpenArchive({ chemin, label }: { chemin: string; label?: string }) {
  const th = useTh();
  const [busy, setBusy] = useState(false);
  const open = async () => {
    // La fenêtre s'ouvre tout de suite (sinon le navigateur la bloque), puis reçoit le lien signé.
    const w = window.open("about:blank", "_blank");
    if (w) w.opener = null;
    setBusy(true);
    try {
      const url = await archiveDocumentUrl(chemin);
      if (w) w.location.href = url; else window.open(url, "_blank", "noopener");
    } catch (err) {
      w?.close();
      toast.error(err instanceof Error ? err.message : "Document introuvable.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={open} disabled={busy} title="Ouvrir le document"
      className="inline-flex items-center gap-1 text-[11px] font-bold hover:opacity-70 disabled:opacity-40 shrink-0" style={{ color: th.fg }}>
      <ExternalLink className="w-3.5 h-3.5" />{label}
    </button>
  );
}

// Dossier repris de Digiforma : étape, satisfaction, notes et documents
// d'origine (devis signés, conventions, émargements, certificats).
export function ArchiveCard({ session }: { session: TrainingSession }) {
  const th = useTh();
  const a = session.archive;
  const [openCat, setOpenCat] = useState<string | null>(null);
  if (!a) return null;
  const docs = a.documents ?? [];
  const groups = docs.reduce<Record<string, ArchiveDocument[]>>((g, d) => ({ ...g, [d.categorie]: [...(g[d.categorie] ?? []), d] }), {});
  const ETAPES: Record<string, string> = { prospect: "Opportunité CRM", projet: "Projet", planification: "Planification en cours", terminee: "Terminée" };
  return (
    <GCard><div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Archive className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>Archive Digiforma</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: th.navA, color: th.fg2 }}>{a.code}</span>
      </div>
      <p className="text-xs" style={{ color: th.fg2 }}>
        Étape dans Digiforma : <strong style={{ color: th.fg }}>{ETAPES[a.etape] ?? a.etape}</strong>
        {a.cloture ? " · dossier clôturé, ses justificatifs sont ci-dessous." : "."}
      </p>
      {a.satisfaction && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: th.fg2 }}>
          <Star className="w-3.5 h-3.5" style={{ color: th.fg }} />
          Satisfaction à chaud : <strong style={{ color: th.fg }}>{String(a.satisfaction.moyenne).replace(".", ",")}/10</strong> ({a.satisfaction.repondants} réponse{a.satisfaction.repondants > 1 ? "s" : ""})
        </p>
      )}
      {a.notes.map((n) => <p key={n} className="text-[11px]" style={{ color: th.fg3 }}>{n}</p>)}
      {!docs.length && <p className="text-[11px]" style={{ color: th.fg3 }}>Aucun document dans l'export.</p>}
      <div className="space-y-1">
        {Object.entries(groups).map(([cat, list]) => (
          <div key={cat} style={{ borderTop: `1px solid ${th.sep}` }}>
            <button type="button" onClick={() => setOpenCat(openCat === cat ? null : cat)} className="w-full flex items-center gap-2 py-1.5 text-left hover:opacity-70">
              <span className="flex-1 text-xs font-bold" style={{ color: th.fg }}>{ARCHIVE_CATEGORY_LABELS[cat] ?? cat}</span>
              <span className="text-[11px] tabular-nums" style={{ color: th.fg3 }}>{list.length}</span>
            </button>
            {openCat === cat && list.map((d) => (
              <div key={d.chemin} className="flex items-center gap-2 pl-2 pb-1.5">
                <span className="flex-1 min-w-0 text-[11px] truncate" style={{ color: th.fg2 }}>{d.nom}</span>
                <OpenArchive chemin={d.chemin} label="Ouvrir" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div></GCard>
  );
}

// Dépôt des PDF de l'export Digiforma : l'administrateur choisit le dossier
// « Sessions » de l'export, chaque fichier rejoint sa session.
export function DigiformaImportButton({ sessions }: { sessions: TrainingSession[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const expected = sessions.reduce((n, s) => n + (s.archive?.documents?.length ?? 0), 0);
  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    try {
      const r = await uploadDigiformaFolder(Array.from(list), sessions, (done, total) => setProgress({ done, total }));
      if (r.errors.length) toast.error(`${r.errors.length} fichier${r.errors.length > 1 ? "s" : ""} en échec : ${r.errors[0]}`);
      toast.success(`${r.uploaded} document${r.uploaded > 1 ? "s" : ""} Digiforma archivé${r.uploaded > 1 ? "s" : ""}.`);
    } catch (err) {
      console.error(err);
      toast.error("Import des documents impossible.");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <>
      <input ref={input} type="file" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)}
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} />
      <VBtn sm disabled={!!progress} onClick={() => expected
        ? input.current?.click()
        : toast.error("Aucune session importée de Digiforma : exécutez d'abord supabase/scripts/import_digiforma.sql dans l'éditeur SQL, puis rechargez la page.")}>
        <FolderUp className="w-4 h-4" />
        {progress ? `Import… ${progress.done}/${progress.total}` : "Documents Digiforma"}
      </VBtn>
    </>
  );
}
