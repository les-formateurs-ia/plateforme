import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Building2, FileCheck2, User, Wand2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { Dialog, DialogContent, DialogFooter } from "@/app/components/ui/dialog";
import { DialogHero, ErrorText, HueButton } from "@/app/components/entreprise/EntrepriseKit";
import { FORMATION_PRESETS } from "@/app/lib/documents/samples";
import { todayIso } from "@/app/lib/trainingSessions";
import { listCompanies, type CompanyRow } from "@/app/lib/entreprise/companies";
import { convertProspect } from "@/app/lib/prospectConversion";
import type { Lead } from "@/app/lib/prospects";

type Kind = "particulier" | "entreprise";
const NEW_COMPANY = "__nouvelle";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PATHS: Record<Kind, { label: string; Icon: typeof User; desc: string; steps: string[] }> = {
  particulier: {
    label: "Particulier", Icon: User, desc: "La personne finance elle-même sa formation.",
    steps: ["Dossier « particulier » et stagiaire", "Devis + programme émis", "Puis contrat de formation (rétractation 14 j)"],
  },
  entreprise: {
    label: "Entreprise", Icon: Building2, desc: "Une entreprise (ou son OPCO) finance la formation.",
    steps: ["Fiche entreprise créée", "Devis + programme émis", "Puis convention, convocations, émargement…"],
  },
};

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function initialFields(lead: Lead) {
  const start = addDaysIso(todayIso(), 14);
  return {
    prenom: lead.first_name, nom: lead.last_name, email: lead.email ?? "", telephone: lead.phone ?? "", fonction: "",
    adresse: "", codePostal: "", ville: "",
    company: lead.company ?? "", siret: "", financement: "entreprise" as "entreprise" | "opco",
    signataireNom: "", signataireFonction: "", signataireEmail: "",
    dateDebut: start, dateFin: start, prix: "",
  };
}

// Transforme un prospect en dossier de formation : on choisit le parcours
// (particulier ou entreprise), on vérifie les informations préremplies, et
// le dossier s'ouvre avec le devis et le programme déjà émis.
export function ConvertProspectDialog({ lead, open, onOpenChange, onConverted }: {
  lead: Lead; open: boolean; onOpenChange: (open: boolean) => void; onConverted: (sessionId: string) => void;
}) {
  const th = useTh();
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind | null>(null);
  const [f, setF] = useState(() => initialFields(lead));
  const [presetId, setPresetId] = useState("entreprise");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [companyId, setCompanyId] = useState(NEW_COMPANY);
  const [contactSigns, setContactSigns] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof ReturnType<typeof initialFields>) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [key]: e.target.value }));

  const preset = FORMATION_PRESETS.find((p) => p.id === presetId)!;
  const choose = (k: Kind) => {
    setKind(k);
    setError(null);
    setPresetId(k === "particulier" ? "rs6776" : "entreprise");
  };

  // Une fiche du même nom existe déjà : on la propose plutôt qu'un doublon.
  useEffect(() => {
    if (!open || kind !== "entreprise") return;
    listCompanies().then((list) => {
      setCompanies(list);
      const match = list.find((c) => c.name.trim().toLowerCase() === (lead.company ?? "").trim().toLowerCase());
      if (match) setCompanyId(match.id);
    }).catch((err) => console.error(err));
  }, [open, kind, lead.company]);

  const reset = () => { setKind(null); setF(initialFields(lead)); setCompanyId(NEW_COMPANY); setContactSigns(true); setError(null); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!kind || saving) return;
    const prix = f.prix.trim() === "" ? (lead.deal_value ?? preset.prix) : Number(f.prix.replace(/\s/g, "").replace(",", "."));
    if (!f.prenom.trim() || !f.nom.trim()) return setError("Le prénom et le nom sont obligatoires.");
    if (!EMAIL_RE.test(f.email.trim())) return setError(kind === "particulier"
      ? "L’e-mail du stagiaire est nécessaire : il reçoit son devis et signe en ligne."
      : "L’e-mail du contact est nécessaire : il reçoit le devis et signe en ligne.");
    if (!Number.isFinite(prix) || prix < 0) return setError("Prix invalide.");
    if (f.dateFin < f.dateDebut) return setError("La date de fin précède la date de début.");
    if (kind === "entreprise" && companyId === NEW_COMPANY && !f.company.trim()) return setError("Indiquez le nom de l’entreprise.");
    if (kind === "entreprise" && !contactSigns && (!f.signataireNom.trim() || !EMAIL_RE.test(f.signataireEmail.trim())))
      return setError("Indiquez le nom et l’e-mail du signataire.");
    setSaving(true);
    setError(null);
    const common = { presetId, prixHt: Math.round(prix * 100) / 100, dateDebut: f.dateDebut, dateFin: f.dateFin };
    const contact = { civilite: "", prenom: f.prenom.trim(), nom: f.nom.trim(), fonction: f.fonction.trim(), email: f.email.trim(), telephone: f.telephone.trim() };
    try {
      const [sPrenom, ...sNom] = f.signataireNom.trim().split(" ");
      const result = await convertProspect(lead, kind === "particulier"
        ? { ...common, kind, prenom: f.prenom, nom: f.nom, email: f.email, adresse: f.adresse, codePostal: f.codePostal, ville: f.ville }
        : {
          ...common, kind, financement: f.financement, companyId: companyId === NEW_COMPANY ? null : companyId,
          name: f.company, siret: f.siret, address: f.adresse, postalCode: f.codePostal, city: f.ville, contact,
          signataire: contactSigns ? null : { civilite: "", prenom: sPrenom, nom: sNom.join(" "), fonction: f.signataireFonction.trim(), email: f.signataireEmail.trim(), telephone: "" },
        });
      toast.success(`Dossier ${result.reference} créé.`, {
        description: result.issued.length ? `${result.issued.join(" et ")} émis, prêts à envoyer.` : "Complète le dossier client pour émettre le devis.",
      });
      onConverted(result.sessionId);
      onOpenChange(false);
      reset();
      navigate(`/sessions/${result.sessionId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message ? `Conversion impossible : ${err.message}` : "Conversion impossible.");
    } finally {
      setSaving(false);
    }
  };

  const input = (key: keyof ReturnType<typeof initialFields>, props: { type?: string; placeholder?: string; inputMode?: "numeric" | "decimal" } = {}) => (
    <input value={f[key]} onChange={set(key)} {...props} className="w-full rounded-[4px] px-3 py-2 text-sm g-input" />
  );
  const chip = (active: boolean) => active
    ? { background: th.ink, color: th.onInk, borderColor: th.ink }
    : { borderColor: th.inputB, color: th.fg2 };
  const selectStyle = { background: th.inputBg, borderColor: th.inputB, color: th.fg };
  const existing = kind === "entreprise" && companyId !== NEW_COMPANY;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHero Icon={Wand2} hue="teal" title="Convertir le prospect"
          desc={kind ? `${PATHS[kind].label} · ${lead.first_name} ${lead.last_name}` : "Choisis le parcours : le dossier de formation se crée avec le devis et le programme."} />

        {!kind ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {(Object.keys(PATHS) as Kind[]).map((k) => {
              const p = PATHS[k];
              const suggested = lead.profile === k;
              return (
                <button key={k} type="button" onClick={() => choose(k)}
                  className="text-left rounded-[8px] border p-4 transition-colors hover:shadow-sm"
                  style={{ borderColor: suggested ? th.ink : th.sep, background: th.card }}>
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: th.ink, color: th.onInk }}><p.Icon className="w-4 h-4" /></span>
                    <span className="text-base font-black" style={{ color: th.fg }}>{p.label}</span>
                    {suggested && <span className="ml-auto text-[10px] font-bold uppercase tracking-widest" style={{ color: th.fg3 }}>Profil du prospect</span>}
                  </div>
                  <p className="text-sm mt-2" style={{ color: th.fg2 }}>{p.desc}</p>
                  <ol className="mt-3 space-y-1">
                    {p.steps.map((s, i) => (
                      <li key={s} className="flex items-center gap-2 text-xs" style={{ color: th.fg3 }}>
                        <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold" style={{ borderColor: th.inputB }}>{i + 1}</span>{s}
                      </li>
                    ))}
                  </ol>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <button type="button" onClick={() => { setKind(null); setError(null); }} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: th.fg3 }}>
              <ArrowLeft className="w-3.5 h-3.5" />Changer de parcours
            </button>

            {kind === "entreprise" && (
              <Group title="Entreprise">
                <Field label="Fiche entreprise">
                  <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full rounded-[4px] border px-3 py-2 text-sm" style={selectStyle}>
                    <option value={NEW_COMPANY}>Créer une nouvelle fiche</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}{c.city ? ` · ${c.city}` : ""}</option>)}
                  </select>
                </Field>
                {!existing && <Field label="Nom de l’entreprise">{input("company")}</Field>}
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Financement" group>
                    <div className="flex gap-2">
                      {([["entreprise", "Entreprise"], ["opco", "OPCO"]] as const).map(([id, label]) => (
                        <button key={id} type="button" onClick={() => setF((x) => ({ ...x, financement: id }))} aria-pressed={f.financement === id}
                          className="rounded-[4px] border px-3 py-1.5 text-sm font-semibold" style={chip(f.financement === id)}>{label}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label={`SIRET${existing ? " (si absent de la fiche)" : ""}`}>{input("siret", { inputMode: "numeric", placeholder: "14 chiffres" })}</Field>
                </div>
              </Group>
            )}

            <Group title={kind === "particulier" ? "Stagiaire" : "Contact formation"}>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Prénom">{input("prenom")}</Field>
                <Field label="Nom">{input("nom")}</Field>
                <Field label="E-mail">{input("email", { type: "email" })}</Field>
                {kind === "entreprise"
                  ? <Field label="Fonction">{input("fonction", { placeholder: "DRH, gérant…" })}</Field>
                  : <Field label="Téléphone">{input("telephone", { type: "tel" })}</Field>}
              </div>
              {kind === "entreprise" && (
                <label className="flex items-center gap-2 text-sm mt-1">
                  <input type="checkbox" checked={contactSigns} onChange={(e) => setContactSigns(e.target.checked)} />
                  <span style={{ color: th.fg2 }}>Ce contact signe le devis et la convention</span>
                </label>
              )}
              {kind === "entreprise" && !contactSigns && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="Signataire (prénom nom)">{input("signataireNom")}</Field>
                  <Field label="Fonction">{input("signataireFonction")}</Field>
                  <Field label="E-mail">{input("signataireEmail", { type: "email" })}</Field>
                </div>
              )}
            </Group>

            <Group title={kind === "particulier" ? "Adresse du stagiaire" : `Adresse de l’entreprise${existing ? " (si absente de la fiche)" : ""}`}>
              <Field label="Adresse">{input("adresse")}</Field>
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <Field label="Code postal">{input("codePostal", { inputMode: "numeric" })}</Field>
                <Field label="Ville">{input("ville")}</Field>
              </div>
            </Group>

            <Group title="Formation">
              <Field label="Programme de départ" group>
                <div className="flex flex-wrap gap-2">
                  {FORMATION_PRESETS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setPresetId(p.id)} aria-pressed={presetId === p.id}
                      className="rounded-[4px] border px-3 py-1.5 text-sm font-semibold" style={chip(presetId === p.id)}>{p.label}</button>
                  ))}
                </div>
              </Field>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Début">{input("dateDebut", { type: "date" })}</Field>
                <Field label="Fin">{input("dateFin", { type: "date" })}</Field>
                <Field label="Prix HT (€)">{input("prix", { inputMode: "decimal", placeholder: String(lead.deal_value ?? preset.prix) })}</Field>
              </div>
            </Group>

            <p className="flex items-start gap-2 text-xs" style={{ color: th.fg3 }}>
              <FileCheck2 className="w-4 h-4 shrink-0" />
              {kind === "entreprise"
                ? "Le devis et le programme sont émis dès que l’adresse, le SIRET et le signataire sont connus ; sinon le dossier indique ce qu’il manque. Tout reste modifiable."
                : "Le devis et le programme sont émis dès que l’adresse est connue ; sinon le dossier indique ce qu’il manque. Tout reste modifiable."}
            </p>

            {error && <ErrorText>{error}</ErrorText>}
            <DialogFooter>
              <HueButton type="submit" Icon={Wand2} disabled={saving}>{saving ? "Création du dossier…" : "Créer le dossier"}</HueButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const th = useTh();
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: th.fg2 }}>{title}</h3>
      {children}
    </section>
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
