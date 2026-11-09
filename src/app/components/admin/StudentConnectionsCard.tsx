import { useEffect, useMemo, useState } from "react";
import { Download, History } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import {
  connectionDate, connectionTime, connectionsCsv, formatDuration, listConnections, type LearnerConnection,
} from "@/app/lib/connections";

// Historique des connexions d'un élève (fiche admin) : chaque connexion avec
// son début, sa fin et sa durée, tels qu'enregistrés par la plateforme, et
// l'export du relevé (tableur) pour un dossier ou un contrôle.
export function StudentConnectionsCard({ studentId, studentName }: { studentId: string; studentName: string }) {
  const th = useTh();
  const [rows, setRows] = useState<LearnerConnection[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setRows(null);
    setError(false);
    listConnections(studentId).then(setRows).catch((err) => { console.error(err); setError(true); setRows([]); });
  }, [studentId]);

  const total = useMemo(() => (rows ?? []).reduce((sum, r) => sum + r.seconds, 0), [rows]);
  const days = useMemo(() => new Set((rows ?? []).map((r) => connectionDate(r.startedAt))).size, [rows]);

  const exportCsv = () => {
    if (!rows?.length) return;
    const blob = new Blob([connectionsCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `connexions-${studentName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GCard><div className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>Connexions</p>
        {!!rows?.length && (
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-[2px] hover:opacity-70"
            style={{ border: `1px solid ${th.ink}`, color: th.fg }}>
            <Download className="w-3.5 h-3.5" />Exporter
          </button>
        )}
      </div>

      {rows && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[["Temps total", formatDuration(total)], ["Connexions", String(rows.length)], ["Jours actifs", String(days)]].map(([k, v]) => (
            <div key={k} className="rounded-[6px] px-3 py-2" style={{ background: th.navA }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>{k}</p>
              <p className="text-base font-black tabular-nums" style={{ color: th.fg }}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {!rows ? <p className="text-[11px]" style={{ color: th.fg3 }}>Chargement…</p>
        : error ? <p className="text-[11px]" style={{ color: th.danger }}>Historique indisponible (migration 20261109120000 à appliquer ?).</p>
        : !rows.length ? <p className="text-[11px]" style={{ color: th.fg3 }}>Aucune connexion enregistrée pour l’instant.</p>
        : (
          <div className="max-h-80 overflow-y-auto pr-1">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ color: th.fg3 }}>
                  <th className="text-left font-bold py-1">Date</th>
                  <th className="text-left font-bold py-1">Début</th>
                  <th className="text-left font-bold py-1">Fin</th>
                  <th className="text-right font-bold py-1">Durée</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${th.sep}` }} title={[r.ip, r.userAgent].filter(Boolean).join(" · ") || undefined}>
                    <td className="py-1.5 capitalize" style={{ color: th.fg }}>{connectionDate(r.startedAt)}</td>
                    <td className="py-1.5 tabular-nums" style={{ color: th.fg2 }}>{connectionTime(r.startedAt)}</td>
                    <td className="py-1.5 tabular-nums" style={{ color: th.fg2 }}>{connectionTime(r.lastSeenAt)}</td>
                    <td className="py-1.5 tabular-nums text-right font-semibold" style={{ color: th.fg }}>{formatDuration(r.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div></GCard>
  );
}
