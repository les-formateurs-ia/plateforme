import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Plus, Power, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { listPublishedTemplates, type PublishedTemplate } from "@/app/lib/formationInstances";
import {
  createVisitorLink, deleteVisitorLink, listVisitorLinks, setVisitorLinkRevoked, visitorLinkUrl,
  VISITOR_DEFAULT_BUDGET_USD, VISITOR_DEFAULT_MAX_ACCOUNTS, type VisitorLink,
} from "@/app/lib/visitor";

const DEFAULT_VALIDITY_DAYS = 7;

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
// 20261119120000_visitor_mode.sql). Un lien se diffuse librement : chaque
// personne qui l'ouvre entre sans compte à créer, sur son propre compte de
// démonstration aux accès limités (cf. lib/visitor.ts, visitor-access).
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
  const [maxAccounts, setMaxAccounts] = useState(String(VISITOR_DEFAULT_MAX_ACCOUNTS));
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
    if (!label.trim()) { toast.error("Donne un nom au lien (campagne, prospect, salon…)."); return; }
    if (!templateId) { toast.error("Choisis la formation à montrer."); return; }
    const budgetUsd = Number(budget.replace(",", "."));
    if (!Number.isFinite(budgetUsd) || budgetUsd < 0 || budgetUsd > 20) { toast.error("Le budget IA doit être compris entre 0 et 20 $."); return; }
    const days = validity.trim() ? Number(validity) : null;
    if (days !== null && (days < 1 || days > 365)) { toast.error("La validité doit être comprise entre 1 et 365 jours."); return; }
    const max = maxAccounts.trim() ? Number(maxAccounts) : null;
    if (max !== null && max < 1) { toast.error("Le nombre de visiteurs doit être d'au moins 1."); return; }
    setCreating(true);
    try {
      const { token } = await createVisitorLink({
        label: label.trim(),
        templateId,
        budgetUsd,
        maxAccounts: max,
        expiresInDays: days,
      });
      setLastToken(token);
      setLabel("");
      await copyLink(token);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de créer le lien.");
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
    if (!confirm(`Supprimer le lien « ${link.label} » ? Les ${link.accountsCount} compte(s) visiteur ouverts par ce lien et tout ce qu'ils ont créé seront supprimés définitivement.`)) return;
    setBusyId(link.id);
    try {
      await deleteVisitorLink(link.id);
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
          Un lien de démonstration à diffuser librement (e-mail, site, réseaux…) : la personne qui l'ouvre entre directement dans la plateforme,
          sans compte à créer ni mot de passe. Elle découvre le programme complet avec la première leçon ouverte, le Studio avec un petit budget IA,
          un aperçu du Hub IA et du Guide IA, l'exercice Battle Ground et l'Agent IA en mode test. Chaque visiteur a son propre espace ;
          s'il rouvre le lien depuis le même navigateur, il retrouve sa visite.
        </p>
      </div>

      <GCard><div className="p-5 space-y-4">
        <p className="text-sm font-black" style={{ color: th.fg }}>Nouveau lien</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Nom du lien (usage interne : campagne, prospect, salon…)</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. : Campagne LinkedIn novembre" className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
          </label>
          <div className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Formation montrée</span>
            <VSelect value={templateId} onValueChange={setTemplateId} placeholder="Choisir une formation"
              options={templates.map((t) => ({ value: t.id, label: t.name }))} />
          </div>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Budget IA du Studio par visiteur ($)</span>
            <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Visiteurs maximum (vide = sans limite)</span>
            <input value={maxAccounts} onChange={(e) => setMaxAccounts(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>Validité (jours, vide = sans limite)</span>
            <input value={validity} onChange={(e) => setValidity(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />
          </label>
        </div>
        <p className="text-xs" style={{ color: th.fg3 }}>
          Chaque visiteur teste chaque outil IA une fois (une image, une vidéo, un message…), puis voit une présentation de l'outil et l'invitation à s'inscrire.
          Le budget est un filet de sécurité par visiteur ; coût maximal du lien : budget × visiteurs maximum.
          Au plus 5 nouvelles visites par jour depuis une même connexion. Désactiver le lien ferme aussi les visites en cours.
        </p>
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
                  {link.accountsCount > 0 ? `${link.accountsCount}${link.maxAccounts ? ` / ${link.maxAccounts}` : ""} visiteur${link.accountsCount > 1 ? "s" : ""}, dernier le ${fmtDate(link.lastOpenedAt!)}` : `Aucun visiteur${link.maxAccounts ? ` (max. ${link.maxAccounts})` : ""}`}
                  {" "}· {link.budgetUsd.toFixed(2)} $ par visiteur · crédits IA consommés {link.spentUsd.toFixed(2)} $
                </p>
              </div>
              <VBtn sm onClick={() => copyLink(link.token)}>
                <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" />Copier</span>
              </VBtn>
              <button type="button" onClick={() => toggle(link)} disabled={busyId === link.id}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: th.fg2 }}>
                <Power className="w-3.5 h-3.5" />{link.revokedAt ? "Réactiver" : "Désactiver"}
              </button>
              <button type="button" onClick={() => destroy(link)} disabled={busyId === link.id}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ color: th.danger }} title="Supprimer le lien et les comptes visiteurs qu'il a ouverts">
                <Trash2 className="w-3.5 h-3.5" />Supprimer
              </button>
            </div></GCard>
          );
        })}
      </div>
    </div>
  );
}
