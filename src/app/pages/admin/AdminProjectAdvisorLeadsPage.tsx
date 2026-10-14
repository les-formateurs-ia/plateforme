import { useEffect, useState } from "react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { supabase } from "@/app/lib/supabase/client";
import type { Database } from "@/app/lib/supabase/database.types";

type Lead = Pick<Database["public"]["Tables"]["project_advisor_leads"]["Row"],
  "id" | "first_name" | "last_name" | "email" | "profile" | "sector" | "need" | "phone" | "status" | "created_at" | "callback_requested_at"
  | "source" | "company" | "challenges" | "employment_status" | "cpf_balance">;
const columns = "id,first_name,last_name,email,profile,sector,need,phone,status,created_at,callback_requested_at,source,company,challenges,employment_status,cpf_balance";
const pageSize = 50;
const display = (value: string | null | undefined) => value?.trim() || "—";
const date = (value: string) => new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

// Where the request comes from: the advisor or one of the site's contact pages
// (supabase/functions/contact-request). Values mirror the site's src/data/contact.ts.
const SOURCES: Record<Lead["source"], string> = {
  "conseiller-ia": "Conseiller IA",
  "contact-general": "Contact général",
  "contact-entreprise": "Contact entreprise",
  "contact-particulier": "Contact particulier",
};
const CHALLENGES: Record<string, string> = {
  "charge-equipes": "Alléger la charge de travail des équipes",
  automatisation: "Automatiser le traitement de données / documents",
  "charte-conformite": "Charte IA & conformité RGPD / AI Act",
  cadrage: "Autre / cadrage global",
};
const STATUSES: Record<string, string> = { salarie: "Salarié", "demandeur-emploi": "Demandeur d’emploi", "independant-autre": "Indépendant / autre" };
const CPF: Record<string, string> = { oui: "Connaît son solde CPF", non: "Ne connaît pas son solde CPF", aide: "Souhaite de l’aide pour consulter son solde CPF" };

/** The answers specific to the request's form, one line each. */
function answers(row: Lead): string[] {
  return [
    row.company,
    ...(row.challenges ?? []).map(c => CHALLENGES[c] ?? c),
    row.employment_status && (STATUSES[row.employment_status] ?? row.employment_status),
    row.cpf_balance && (CPF[row.cpf_balance] ?? row.cpf_balance),
    row.need,
  ].filter((line): line is string => Boolean(line?.trim()));
}

export function AdminProjectAdvisorLeadsPage() {
  const th = useTh();
  const [rows, setRows] = useState<Lead[]>([]);
  const [profile, setProfile] = useState<"" | Lead["profile"]>("");
  const [source, setSource] = useState<"" | Lead["source"]>("");
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
        if (source) query = query.eq("source", source);
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
  }, [page, profile, source, refresh]);

  useEffect(() => {
    const update = () => { if (document.visibilityState === "visible") setRefresh(n => n + 1); };
    const timer = window.setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

  const buttonClass = "px-4 py-2 rounded-[2px] text-sm font-semibold border disabled:opacity-40";
  return <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6" style={{ color: th.fg }}>
    <div>
      <h2 className="text-[1.75rem] sm:text-[2.1rem] leading-[1.08] font-black" style={{ color: th.fg }}><GT>Demandes de projets IA</GT></h2>
      <p className="text-sm mt-2" style={{ color: th.fg3 }}>Les demandes du conseiller IA et des pages contact du site, de la plus récente à la plus ancienne. Actualisation automatique toutes les 30 secondes.</p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-semibold" htmlFor="lead-source">Origine</label>
      <select id="lead-source" value={source} onChange={e => { setSource(e.target.value as "" | Lead["source"]); setPage(0); }} className="rounded-xl border px-3 py-2 text-sm" style={{ background: th.card, borderColor: th.sep, color: th.fg }}>
        <option value="">Toutes les origines</option>
        {Object.entries(SOURCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
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
          <table className="w-full text-sm text-left min-w-[1150px]">
            <caption className="sr-only">Coordonnées et projets des prospects</caption>
            <thead style={{ background: th.gradShadow(0.08), color: th.fg3 }}><tr>
              {["Reçue le", "Origine", "Prénom", "Nom", "Profil", "Secteur d’activité", "Téléphone", "Email", "Besoin / rappel"].map(label => <th key={label} scope="col" className="px-4 py-3 whitespace-nowrap font-semibold">{label}</th>)}
            </tr></thead>
            <tbody>{rows.map(row => <tr key={row.id} style={{ borderTop: `1px solid ${th.sep}` }}>
              <td className="px-4 py-4 whitespace-nowrap">{date(row.created_at)}</td>
              <td className="px-4 py-4 whitespace-nowrap">{SOURCES[row.source] ?? row.source}</td>
              <td className="px-4 py-4">{display(row.first_name)}</td><td className="px-4 py-4">{display(row.last_name)}</td>
              <td className="px-4 py-4"><span className="inline-block rounded-[2px] px-3 py-1 text-xs font-bold" style={{ background: th.gradShadow(0.15), color: th.fg }}>{row.profile === "entreprise" ? "Entreprise" : row.profile === "particulier" ? "Particulier" : "—"}</span></td>
              <td className="px-4 py-4 break-words max-w-52">{display(row.sector)}</td>
              <td className="px-4 py-4 whitespace-nowrap">{row.phone?.trim() ? <a className="underline" href={`tel:${row.phone}`}>{row.phone}</a> : "—"}</td>
              <td className="px-4 py-4 break-all">{row.email?.trim() ? <a className="underline" href={`mailto:${row.email}`}>{row.email}</a> : "—"}</td>
              <td className="px-4 py-4 min-w-56 max-w-80">
                {row.status === "callback_requested" && <p className="font-semibold mb-2">Rappel sous 24h demandé{row.callback_requested_at && <span className="block text-xs font-normal" style={{ color: th.fg3 }}>{date(row.callback_requested_at)}</span>}</p>}
                {answers(row).length > 0 && <details><summary className="cursor-pointer">{row.source === "conseiller-ia" ? "Voir le besoin" : "Voir la demande"}</summary>
                  <ul className="mt-2 space-y-1">{answers(row).map((line, i) => <li key={i} className="whitespace-pre-wrap break-words">{line}</li>)}</ul>
                </details>}
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
