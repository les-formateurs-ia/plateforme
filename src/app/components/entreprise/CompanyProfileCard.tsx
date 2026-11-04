import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Check, Mail, MapPin, Pencil, Phone, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { Field, TextArea, TextInput } from "@/app/components/sessions/fields";
import { eur, totalHt } from "@/app/lib/documents/render";
import {
  CONTACT_ROLE_LABELS, getCompanyProfile, updateCompanyProfile,
  type CompanyContact, type CompanyContactRole, type CompanyProfile,
} from "@/app/lib/entreprise/companies";
import type { TrainingSession } from "@/app/lib/trainingSessions";

// Fiche CRM d'une entreprise (admin) : identité légale, adresse, contacts,
// et chiffres clés de ses sessions. Elle préremplit le dossier client des
// nouvelles sessions.

const ROLES: CompanyContactRole[] = ["representant", "formation", "finance"];
const EMPTY_CONTACT: CompanyContact = { civilite: "", prenom: "", nom: "", fonction: "", email: "", telephone: "" };

export function CompanyProfileCard({ companyId, sessions, onRenamed }: {
  companyId: string; sessions: TrainingSession[]; onRenamed?: (name: string) => void;
}) {
  const th = useTh();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [draft, setDraft] = useState<CompanyProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCompanyProfile(companyId).then((p) => { if (!cancelled) setProfile(p); }).catch(console.error);
    return () => { cancelled = true; };
  }, [companyId]);

  if (!profile) return null;

  const won = sessions.filter((s) => s.statutCommercial === "gagne");
  const ca = won.reduce((t, s) => t + totalHt(s.lignes), 0);
  const pipeline = sessions.filter((s) => s.statutCommercial === "prospect" || s.statutCommercial === "devis").reduce((t, s) => t + totalHt(s.lignes), 0);
  const aEncaisser = sessions.flatMap((s) => s.factures).filter((f) => f.statut !== "payee").reduce((t, f) => t + f.montantHt - f.payeHt, 0);

  const save = async () => {
    if (!draft || !draft.name.trim()) return toast.error("Le nom de l'entreprise est requis.");
    setSaving(true);
    try {
      await updateCompanyProfile(draft);
      setProfile(draft);
      if (draft.name !== profile.name) onRenamed?.(draft.name.trim());
      setDraft(null);
      toast.success("Fiche entreprise enregistrée.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const stat = (label: string, value: string) => (
    <div className="rounded-[6px] px-3 py-2" style={{ background: th.navA }}>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: th.fg3 }}>{label}</p>
      <p className="text-base font-black tabular-nums" style={{ color: th.fg }}>{value}</p>
    </div>
  );

  if (draft) {
    const set = <K extends keyof CompanyProfile>(k: K) => (v: CompanyProfile[K]) => setDraft({ ...draft, [k]: v });
    const setContact = (role: CompanyContactRole, patch: Partial<CompanyContact>) =>
      setDraft({ ...draft, contacts: { ...draft.contacts, [role]: { ...EMPTY_CONTACT, ...draft.contacts[role], ...patch } } });
    return (
      <GCard><div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" style={{ color: th.fg3 }} />
          <p className="text-sm font-black flex-1" style={{ color: th.fg }}>Fiche entreprise</p>
          <VBtn sm onClick={() => setDraft(null)} disabled={saving}><X className="w-3.5 h-3.5" />Annuler</VBtn>
          <ShimBtn sm onClick={save} disabled={saving}><Check className="w-3.5 h-3.5" />{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom usuel"><TextInput value={draft.name} onChange={set("name")} /></Field>
          <Field label="Raison sociale"><TextInput value={draft.legalName} onChange={set("legalName")} /></Field>
          <Field label="SIRET"><TextInput value={draft.siret} onChange={set("siret")} /></Field>
          <Field label="N° TVA"><TextInput value={draft.vatNumber} onChange={set("vatNumber")} /></Field>
          <Field label="Code APE"><TextInput value={draft.apeCode} onChange={set("apeCode")} /></Field>
          <Field label="Site web"><TextInput value={draft.website} onChange={set("website")} /></Field>
          <Field label="Adresse"><TextInput value={draft.address} onChange={set("address")} /></Field>
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <Field label="Code postal"><TextInput value={draft.postalCode} onChange={set("postalCode")} /></Field>
            <Field label="Ville"><TextInput value={draft.city} onChange={set("city")} /></Field>
          </div>
          <Field label="Pays"><TextInput value={draft.country} onChange={set("country")} /></Field>
          <Field label="E-mail"><TextInput type="email" value={draft.email} onChange={set("email")} /></Field>
          <Field label="Téléphone"><TextInput value={draft.phone} onChange={set("phone")} /></Field>
        </div>
        {ROLES.map((role) => {
          const c = { ...EMPTY_CONTACT, ...draft.contacts[role] };
          return (
            <div key={role} className="space-y-2">
              <p className="text-xs font-bold" style={{ color: th.fg2 }}>{CONTACT_ROLE_LABELS[role]}{role === "representant" ? " (signataire des conventions)" : ""}</p>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <TextInput value={c.civilite} onChange={(v) => setContact(role, { civilite: v })} placeholder="Civilité" />
                <TextInput value={c.prenom} onChange={(v) => setContact(role, { prenom: v })} placeholder="Prénom" />
                <TextInput value={c.nom} onChange={(v) => setContact(role, { nom: v.toUpperCase() })} placeholder="Nom" />
                <TextInput value={c.fonction} onChange={(v) => setContact(role, { fonction: v })} placeholder="Fonction" />
                <TextInput type="email" value={c.email} onChange={(v) => setContact(role, { email: v })} placeholder="E-mail" />
                <TextInput value={c.telephone} onChange={(v) => setContact(role, { telephone: v })} placeholder="Téléphone" />
              </div>
            </div>
          );
        })}
        <Field label="Notes"><TextArea rows={3} value={draft.notes} onChange={set("notes")} /></Field>
      </div></GCard>
    );
  }

  const p = profile;
  const contacts = ROLES.filter((r) => p.contacts[r]);
  const adresse = [p.address, [p.postalCode, p.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const manque = [!p.siret && "SIRET", !adresse && "adresse", !p.contacts.representant && !p.contacts.formation && "signataire"].filter(Boolean) as string[];
  return (
    <GCard><div className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4" style={{ color: th.fg3 }} />
        <p className="text-sm font-black flex-1" style={{ color: th.fg }}>Fiche entreprise</p>
        {p.fromDigiforma && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: th.navA, color: th.fg2 }}>Repris de Digiforma</span>}
        <VBtn sm onClick={() => setDraft(p)}><Pencil className="w-3.5 h-3.5" />Modifier</VBtn>
      </div>
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {stat("CA réalisé et signé", eur(ca))}
        {stat("En négociation", eur(pipeline))}
        {stat("À encaisser", eur(aEncaisser))}
        {stat("Sessions", String(won.length))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 text-xs" style={{ color: th.fg2 }}>
          <p className="text-sm font-bold" style={{ color: th.fg }}>{p.legalName || p.name}</p>
          {(p.siret || p.vatNumber || p.apeCode) && (
            <p>{[p.siret && `SIRET ${p.siret}`, p.vatNumber && `TVA ${p.vatNumber}`, p.apeCode && `APE ${p.apeCode}`].filter(Boolean).join(" · ")}</p>
          )}
          {adresse && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{adresse}</p>}
          {p.email && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" />{p.email}</p>}
          {p.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{p.phone}</p>}
          {p.notes && <p className="whitespace-pre-wrap" style={{ color: th.fg3 }}>{p.notes}</p>}
          {manque.length > 0 && <p style={{ color: th.danger }}>À compléter pour les conventions : {manque.join(", ")}.</p>}
        </div>
        <div className="space-y-2">
          {!contacts.length && <p className="text-xs" style={{ color: th.fg3 }}>Aucun contact enregistré.</p>}
          {contacts.map((r) => {
            const c = p.contacts[r]!;
            return (
              <div key={r} className="text-xs" style={{ color: th.fg2 }}>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: th.fg3 }}>{CONTACT_ROLE_LABELS[r]}</p>
                <p className="font-semibold" style={{ color: th.fg }}>{[c.civilite, c.prenom, c.nom].filter(Boolean).join(" ")}{c.fonction ? ` · ${c.fonction}` : ""}</p>
                {(c.email || c.telephone) && <p>{[c.email, c.telephone].filter(Boolean).join(" · ")}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div></GCard>
  );
}
