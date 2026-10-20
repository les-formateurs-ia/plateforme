import { useState, type FormEvent, type ReactNode } from "react";
import { Building2, Globe, GraduationCap, PhoneIncoming, Share2, User, UserPlus } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { DialogHero, ErrorText, HueButton } from "@/app/components/entreprise/EntrepriseKit";
import {
  createProspect, normalizePhone, MANUAL_SOURCES, STAGES,
  type Lead, type ProspectManualSource, type ProspectStage,
} from "@/app/lib/prospects";

const SOURCE_ICONS: Record<ProspectManualSource, typeof Globe> = {
  google: Globe, maformation: GraduationCap, "reseaux-sociaux": Share2, "appel-direct": PhoneIncoming,
};

const EMPTY = { firstName: "", lastName: "", phone: "", email: "", company: "", need: "", value: "" };

// Saisie d'un prospect venu hors du site (Google, MaFormation, réseaux
// sociaux, appel direct). Il faut au moins un téléphone ou un e-mail.
export function NewProspectDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (open: boolean) => void; onCreated: (lead: Lead) => void;
}) {
  const th = useTh();
  const [source, setSource] = useState<ProspectManualSource | null>(null);
  const [profile, setProfile] = useState<Lead["profile"]>("particulier");
  const [stage, setStage] = useState<ProspectStage>("nouveau");
  const [fields, setFields] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setFields(f => ({ ...f, [key]: e.target.value }));

  const reset = () => { setSource(null); setProfile("particulier"); setStage("nouveau"); setFields(EMPTY); setError(null); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const phone = fields.phone.trim() ? normalizePhone(fields.phone) : null;
    const email = fields.email.trim() || null;
    const value = fields.value.trim() ? Math.round(Number(fields.value.replace(/\s/g, "").replace(",", "."))) : null;
    if (!source) return setError("Choisissez l’origine du prospect.");
    if (!fields.firstName.trim() || !fields.lastName.trim()) return setError("Le prénom et le nom sont obligatoires.");
    if (fields.phone.trim() && !phone) return setError("Numéro de téléphone invalide (ex. 06 12 34 56 78 ou +33 6 12 34 56 78).");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Adresse e-mail invalide.");
    if (!phone && !email) return setError("Renseignez au moins un téléphone ou un e-mail.");
    if (value !== null && (!Number.isFinite(value) || value < 0)) return setError("Montant invalide.");
    setSaving(true);
    setError(null);
    try {
      const lead = await createProspect({
        source, profile, pipeline_stage: stage, phone, email,
        first_name: fields.firstName.trim(), last_name: fields.lastName.trim(),
        company: profile === "entreprise" ? fields.company.trim() || null : null,
        need: fields.need.trim() || null, deal_value: value,
      });
      onCreated(lead);
      reset();
    } catch (err) {
      console.error(err);
      setError("Impossible de créer ce prospect.");
    } finally {
      setSaving(false);
    }
  };

  const chip = (active: boolean) => active
    ? { background: th.ink, color: th.onInk, borderColor: th.ink }
    : { borderColor: th.inputB, color: th.fg2 };

  return (
    <Dialog open={open} onOpenChange={v => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHero Icon={UserPlus} hue="peach" title="Nouveau prospect" desc="Un contact venu hors du site : il rejoint le tableau comme les autres demandes." />
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Origine" group>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(MANUAL_SOURCES) as ProspectManualSource[]).map(id => {
                const Icon = SOURCE_ICONS[id];
                return (
                  <button key={id} type="button" onClick={() => setSource(id)} aria-pressed={source === id}
                    className="flex flex-col items-center gap-1.5 rounded-[6px] border px-2 py-3 text-xs font-bold transition-colors" style={chip(source === id)}>
                    <Icon className="w-4 h-4" />{MANUAL_SOURCES[id]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Profil" group>
            <div className="flex gap-2">
              {([["particulier", "Particulier", User], ["entreprise", "Entreprise", Building2]] as const).map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => setProfile(id)} aria-pressed={profile === id}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-sm font-semibold" style={chip(profile === id)}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Prénom"><input value={fields.firstName} onChange={set("firstName")} autoComplete="off" className="w-full rounded-[4px] px-3 py-2 text-sm g-input" /></Field>
            <Field label="Nom"><input value={fields.lastName} onChange={set("lastName")} autoComplete="off" className="w-full rounded-[4px] px-3 py-2 text-sm g-input" /></Field>
            <Field label="Téléphone"><input value={fields.phone} onChange={set("phone")} type="tel" placeholder="06 12 34 56 78" className="w-full rounded-[4px] px-3 py-2 text-sm g-input" /></Field>
            <Field label="E-mail"><input value={fields.email} onChange={set("email")} type="email" placeholder="nom@exemple.fr" className="w-full rounded-[4px] px-3 py-2 text-sm g-input" /></Field>
            {profile === "entreprise" && (
              <Field label="Entreprise"><input value={fields.company} onChange={set("company")} className="w-full rounded-[4px] px-3 py-2 text-sm g-input" /></Field>
            )}
            <Field label="Montant estimé (€, facultatif)"><input value={fields.value} onChange={set("value")} inputMode="numeric" placeholder="0" className="w-full rounded-[4px] px-3 py-2 text-sm g-input tabular-nums" /></Field>
          </div>

          <Field label="Besoin / contexte (facultatif)">
            <textarea value={fields.need} onChange={set("need")} rows={3} placeholder="Ce que la personne recherche, comment elle nous a connus…"
              className="w-full rounded-[4px] px-3 py-2 text-sm g-input resize-y" />
          </Field>

          <Field label="Colonne de départ">
            <select value={stage} onChange={e => setStage(e.target.value as ProspectStage)}
              className="w-full sm:w-auto rounded-[4px] border px-3 py-2 text-sm" style={{ background: th.inputBg, borderColor: th.inputB, color: th.fg }}>
              {STAGES.filter(s => s.id !== "archive").map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>

          {error && <ErrorText>{error}</ErrorText>}
          <DialogFooter>
            <HueButton type="submit" Icon={UserPlus} disabled={saving}>{saving ? "Création…" : "Créer le prospect"}</HueButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// group : choix par boutons (un <label> renverrait ses clics au premier bouton).
function Field({ label, group, children }: { label: string; group?: boolean; children: ReactNode }) {
  const th = useTh();
  const Tag = group ? "div" : "label";
  return (
    <Tag className="block" role={group ? "group" : undefined} aria-label={group ? label : undefined}>
      <span className="block text-xs font-bold mb-1.5" style={{ color: th.fg2 }}>{label}</span>
      {children}
    </Tag>
  );
}
