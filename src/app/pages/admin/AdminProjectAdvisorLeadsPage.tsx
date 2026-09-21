import { useEffect, useState } from "react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { supabase } from "@/app/lib/supabase/client";
import type { Database } from "@/app/lib/supabase/database.types";

type Lead = Pick<Database["public"]["Tables"]["project_advisor_leads"]["Row"],
  "id" | "first_name" | "last_name" | "email" | "profile" | "sector" | "need" | "phone" | "status" | "created_at" | "callback_requested_at">;
const columns = "id,first_name,last_name,email,profile,sector,need,phone,status,created_at,callback_requested_at";
const pageSize = 50;
const display = (value: string | null | undefined) => value?.trim() || "—";
const date = (value: string) => new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export function AdminProjectAdvisorLeadsPage() {
  const th = useTh();
  const [rows, setRows] = useState<Lead[]>([]);
  const [profile, setProfile] = useState<"" | Lead["profile"]>("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(false);
    async function load() {
      try {
        let query = supabase.from("project_advisor_leads").select(columns, { count: "exact" })
          .order("created_at", { ascending: false }).order("id", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (profile) query = query.eq("profile", profile);
        const result = await query.abortSignal(controller.signal);
        if (!active) return;
        if (result.error) throw result.error;
        const total = result.count ?? 0;
        if (page > 0 && page * pageSize >= total) setPage(Math.max(0, Math.ceil(total / pageSize) - 1));
        setRows(result.data ?? []);
        setCount(total);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [page, profile, refresh]);

  useEffect(() => {
    const update = () => { if (document.visibilityState === "visible") setRefresh(n => n + 1); };
    const timer = window.setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

  const buttonClass = "px-4 py-2 rounded-full text-sm font-semibold border disabled:opacity-40";
  return <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6" style={{ color: th.fg }}>
    <div>
      <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Demandes de projets IA</GT></h2>
      <p className="text-sm mt-2" style={{ color: th.fg3 }}>Les demandes du conseiller IA, de la plus récente à la plus ancienne. Actualisation automatique toutes les 30 secondes.</p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-semibold" htmlFor="lead-profile">Profil</label>
      <select id="lead-profile" value={profile} onChange={e => { setProfile(e.target.value as "" | Lead["profile"]); setPage(0); }} className="rounded-xl border px-3 py-2 text-sm" style={{ background: th.card, borderColor: th.sep, color: th.fg }}>
        <option value="">Tous les profils</option><option value="entreprise">Entreprise</option><option value="particulier">Particulier</option>
      </select>
      <button className={buttonClass} style={{ borderColor: th.sep }} onClick={() => setRefresh(n => n + 1)} disabled={loading}>Actualiser</button>
      <span className="text-sm" role="status" style={{ color: th.fg3 }}>{loading ? "Chargement…" : error ? "" : `${count} demande${count === 1 ? "" : "s"}`}</span>
    </div>
    {error ? <GCard className="p-5"><p role="alert">Impossible de charger les demandes. Cliquez sur Actualiser pour réessayer.</p></GCard> :
      <GCard>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tableau des demandes de projets IA" aria-busy={loading}>
          <table className="w-full text-sm text-left min-w-[1050px]">
            <caption className="sr-only">Coordonnées et projets des prospects</caption>
            <thead style={{ background: th.gradShadow(0.08), color: th.fg3 }}><tr>
              {["Reçue le", "Prénom", "Nom", "Profil", "Secteur d’activité", "Téléphone", "Email", "Besoin / rappel"].map(label => <th key={label} scope="col" className="px-4 py-3 whitespace-nowrap font-semibold">{label}</th>)}
            </tr></thead>
            <tbody>{rows.map(row => <tr key={row.id} style={{ borderTop: `1px solid ${th.sep}` }}>
              <td className="px-4 py-4 whitespace-nowrap">{date(row.created_at)}</td>
              <td className="px-4 py-4">{display(row.first_name)}</td><td className="px-4 py-4">{display(row.last_name)}</td>
              <td className="px-4 py-4"><span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: th.gradShadow(0.15), color: th.fg }}>{row.profile === "entreprise" ? "Entreprise" : row.profile === "particulier" ? "Particulier" : "—"}</span></td>
              <td className="px-4 py-4 break-words max-w-52">{display(row.sector)}</td>
              <td className="px-4 py-4 whitespace-nowrap">{row.phone?.trim() ? <a className="underline" href={`tel:${row.phone}`}>{row.phone}</a> : "—"}</td>
              <td className="px-4 py-4 break-all">{row.email?.trim() ? <a className="underline" href={`mailto:${row.email}`}>{row.email}</a> : "—"}</td>
              <td className="px-4 py-4 min-w-56 max-w-80">
                {row.status === "callback_requested" && <p className="font-semibold mb-2">Rappel sous 24h demandé{row.callback_requested_at && <span className="block text-xs font-normal" style={{ color: th.fg3 }}>{date(row.callback_requested_at)}</span>}</p>}
                <details><summary className="cursor-pointer">Voir le besoin</summary><p className="mt-2 whitespace-pre-wrap break-words">{display(row.need)}</p></details>
              </td>
            </tr>)}</tbody>
          </table>
          {!loading && rows.length === 0 && <p className="p-6 text-center" style={{ color: th.fg3 }}>Aucune demande pour le moment.</p>}
        </div>
      </GCard>}
    {count > pageSize && <nav aria-label="Pagination des demandes" className="flex flex-wrap items-center justify-end gap-3">
      <button className={buttonClass} style={{ borderColor: th.sep }} disabled={loading || page === 0} onClick={() => setPage(n => n - 1)}>Précédent</button>
      <span className="text-sm">Page {page + 1} sur {Math.max(1, Math.ceil(count / pageSize))}</span>
      <button className={buttonClass} style={{ borderColor: th.sep }} disabled={loading || (page + 1) * pageSize >= count} onClick={() => setPage(n => n + 1)}>Suivant</button>
    </nav>}
  </div>;
}
