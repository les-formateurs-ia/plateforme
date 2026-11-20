import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Copy, Eye, Link2, Plus, Power, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { listPublishedTemplates, type PublishedTemplate } from "@/app/lib/formationInstances";
import {
  createVisitorLink, deleteVisitorAccount, listVisitorLinks, setVisitorLinkRevoked, visitorLinkUrl,
  VISITOR_DEFAULT_BUDGET_USD, type VisitorLink,
} from "@/app/lib/visitor";

const DEFAULT_VALIDITY_DAYS = 30;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function linkStatus(link: VisitorLink): { label: string; active: boolean } {
  if (link.revokedAt) return { label: "Désactivé", active: false };
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) return { label: "Expiré", active: false };
  return { label: link.expiresAt ? `Actif jusqu'au ${fmtDate(link.expiresAt)}` : "Actif", active: true };
}

async function copyLink(token: string) {
  try {
    await navigator.clipboard.writeText(visitorLinkUrl(token));
    toast.success("Lien copié.");
  } catch {
    toast.error("Copie impossible : sélectionne le lien à la main.");
  }
}

// Liens Visiteur — admin uniquement (route + RLS, cf. migration
// 20261119120000_visitor_mode.sql). Chaque lien ouvre un compte de
// démonstration aux accès limités (cf. lib/visitor.ts).
export function AdminVisitorLinksPage() {
  const th = useTh();
  const [links, setLinks] = useState<VisitorLink[]>([]);
  const [templates, setTemplates] = useState<PublishedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [budget, setBudget] = useState(String(VISITOR_DEFAULT_BUDGET_USD));
  const [validity, setValidity] = useState(String(DEFAULT_VALIDITY_DAYS));
  const [creating, setCreating] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);

  const load = async () => {
    try {
      setLinks(await listVisitorLinks());
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les liens visiteurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    listPublishedTemplates().then((rows) => {
      setTemplates(rows);
      setTemplateId((cur) => cur || rows[0]?.id || "");
    }).catch((err) => { console.error(err); toast.error("Impossible de charger les formations."); });
  }, []);

  const create = async () => {
    if (!label.trim()) { toast.error("Donne un nom au lien (le prospect ou l'entreprise)."); return; }
    if (!templateId) { toast.error("Choisis la formation à montrer."); return; }
    setCreating(true);
    try {
      const { token } = await createVisitorLink({
        label: label.trim(),
        templateId,
        budgetUsd: Number(budget.replace(",", ".")),
        expiresInDays: validity.trim() ? Number(validity) : null,
      });
      setLastToken(token);
      setLabel("");
      await copyLink(token);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de créer le lien.");
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (link: VisitorLink) => {
    setBusyId(link.id);
    try {
      await setVisitorLinkRevoked(link.id, !link.revokedAt);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de modifier ce lien.");
    } finally {
      setBusyId(null);
    }
  };

  const destroy = async (link: VisitorLink) => {
    if (!confirm(`Supprimer le lien « ${link.label} » ? Le compte visiteur et tout ce qu'il a créé seront supprimés définitivement.`)) return;
    setBusyId(link.id);
    try {
      await deleteVisitorAccount(link.profileId);
      setLinks((rows) => rows.filter((r) => r.id !== link.id));
      toast.success("Lien supprimé.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de supprimer ce lien.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <h2 className="text-[1.75rem] sm:text-[2.1rem] leading-[1.08] font-black" style={{ color: th.fg }}>Liens <GT>visiteurs</GT></h2>
        <p className="text-[15px] sm:text-base mt-2 max-w-3xl leading-relaxed" style={{ color: th.fg2 }}>
          Un lien à envoyer à un prospect pour qu'il découvre la plateforme sans mot de passe : programme complet avec la première leçon ouverte,
          le Studio avec un petit budget IA, un aperçu du Hub IA et du Guide IA, l'exercice Battle Ground et l'Agent IA en mode test.
          Rouvrir le lien reconnecte au même compte : les crédits ne se rechargent pas.
        </p>
      </div>

      <GCard><div className="p-5 space-y-4">
        <p className="text-sm font-black" style={{ color: th.fg }}>Nouveau lien</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Nom du lien (prospect, entreprise…)</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. : Société Martin — RH" className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
          </label>
          <div className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Formation montrée</span>
            <VSelect value={templateId} onValueChange={setTemplateId} placeholder="Choisir une formation"
              options={templates.map((t) => ({ value: t.id, label: t.name }))} />
          </div>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Budget IA du Studio ($)</span>
            <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Validité (jours, vide = sans limite)</span>
            <input value={validity} onChange={(e) => setValidity(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
          </label>
        </div>
        <p className="text-xs" style={{ color: th.fg3 }}>Le coût réel de chaque génération est décompté du budget (détail sur la fiche du compte) ; les crédits peuvent être rechargés depuis la fiche.</p>
        <div className="flex flex-wrap items-center gap-3">
          <ShimBtn sm onClick={create} disabled={creating}>
            {creating ? "Création…" : <><Plus className="w-4 h-4" />Créer et copier le lien</>}
          </ShimBtn>
          {lastToken && (
            <code className="text-xs px-3 py-2 rounded-[4px] break-all" style={{ background: th.navA, color: th.fg }}>{visitorLinkUrl(lastToken)}</code>
          )}
        </div>
      </div></GCard>

      {loading && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}

      {!loading && links.length === 0 && (
        <GCard><div className="p-8 text-center">
          <p className="text-sm" style={{ color: th.fg3 }}>Aucun lien visiteur pour l'instant.</p>
        </div></GCard>
      )}

      <div className="space-y-2">
        {links.map((link) => {
          const status = linkStatus(link);
          return (
            <GCard key={link.id}><div className="p-4 flex items-center gap-3 flex-wrap">
              <Link2 className="w-4 h-4 shrink-0" style={{ color: status.active ? th.fg : th.fg3 }} />
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm font-black truncate" style={{ color: th.fg }}>{link.label}</p>
                <p className="text-xs" style={{ color: th.fg3 }}>
                  {link.templateName ?? "Formation supprimée"} · créé le {fmtDate(link.createdAt)} · <span style={{ color: status.active ? th.fg2 : th.danger }}>{status.label}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: th.fg3 }}>
                  {link.openCount > 0 ? `Ouvert ${link.openCount} fois, dernière visite le ${fmtDate(link.lastOpenedAt!)}` : "Jamais ouvert"} · crédits IA {link.spentUsd.toFixed(2)} / {link.budgetUsd.toFixed(2)} $
                </p>
              </div>
              <VBtn sm onClick={() => copyLink(link.token)}>
                <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" />Copier</span>
              </VBtn>
              <Link to={`/admin/planning/students/${link.profileId}`} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-70" style={{ color: th.fg2 }} title="Fiche du compte visiteur (crédits IA, créations)">
                <Eye className="w-3.5 h-3.5" />Fiche
              </Link>
              <button type="button" onClick={() => toggle(link)} disabled={busyId === link.id}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: th.fg2 }}>
                <Power className="w-3.5 h-3.5" />{link.revokedAt ? "Réactiver" : "Désactiver"}
              </button>
              <button type="button" onClick={() => destroy(link)} disabled={busyId === link.id}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ color: th.danger }} title="Supprimer le lien et le compte visiteur">
                <Trash2 className="w-3.5 h-3.5" />Supprimer
              </button>
            </div></GCard>
          );
        })}
      </div>
    </div>
  );
}
