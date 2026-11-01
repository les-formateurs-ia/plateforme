import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { Segmented, ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { FORMATION_PRESETS } from "@/app/lib/documents/samples";
import { FINANCEMENT_LABELS } from "@/app/lib/documents/render";
import type { Financement } from "@/app/lib/documents/types";
import { addTrainee, createSession, todayIso, type TrainingSession } from "@/app/lib/trainingSessions";
import type { HubClient } from "@/app/lib/formationsHub";
import { Field, TextInput } from "./fields";

// Création d'une session (une formation vendue à un client). Ouverte depuis
// la fiche d'un client, elle arrive préremplie : entreprise ou élève CPF.

const FINANCEMENTS: Financement[] = ["entreprise", "opco", "cpf", "particulier"];
const PREFIX: Record<Financement, string> = { entreprise: "ENT", opco: "ENT", cpf: "CPF", particulier: "PAR" };
const MANUAL = "__manuel";

function nextReference(sessions: TrainingSession[], financement: Financement): string {
  const base = `${PREFIX[financement]}-${new Date().getFullYear()}-`;
  const max = sessions.filter((s) => s.reference.startsWith(base))
    .reduce((m, s) => Math.max(m, Number(s.reference.slice(base.length)) || 0), 0);
  return `${base}${String(max + 1).padStart(3, "0")}`;
}

export function NewSessionForm({ clients, sessions, initial, onCancel }: {
  clients: HubClient[];
  sessions: TrainingSession[];
  initial?: HubClient | null;
  onCancel: () => void;
}) {
  const th = useTh();
  const navigate = useNavigate();
  const companies = clients.filter((c) => c.companyId);
  const students = clients.filter((c) => c.studentId);
  const startFinancement = (initial?.kind === "cpf" ? "cpf" : "entreprise") as Financement;
  const [form, setForm] = useState({
    financement: startFinancement,
    preset: startFinancement === "cpf" ? "rs6776" : "entreprise",
    companyId: initial?.companyId ?? "",
    studentId: initial?.studentId ?? "",
    clientNom: "", clientEmail: "",
    dateDebut: todayIso(), dateFin: todayIso(),
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const b2b = form.financement === "entreprise" || form.financement === "opco";
  const manual = form.studentId === MANUAL || form.studentId === "";

  const create = async () => {
    const company = companies.find((c) => c.companyId === form.companyId);
    const student = students.find((c) => c.studentId === form.studentId);
    if (b2b && !company) return toast.error("Choisissez l'entreprise cliente.");
    const nom = student?.name ?? form.clientNom.trim();
    const email = student?.studentEmail ?? form.clientEmail.trim();
    if (!b2b && (!nom || !email)) return toast.error("Choisissez l'élève, ou renseignez son nom et son e-mail.");
    if (form.dateFin < form.dateDebut) return toast.error("La date de fin précède la date de début.");
    const preset = FORMATION_PRESETS.find((p) => p.id === form.preset)!;
    setSaving(true);
    try {
      const id = await createSession({
        reference: nextReference(sessions, form.financement),
        financement: form.financement,
        financeur: form.financement === "cpf" ? "Caisse des dépôts (Mon Compte Formation)" : null,
        companyId: company?.companyId ?? null,
        client: {
          type: b2b ? "entreprise" : "particulier", nom: b2b ? company!.name : nom,
          adresse: "", codePostal: "", ville: "", siret: null, representant: null, email: b2b ? "" : email,
        },
        formation: preset.formation,
        lignes: [{ designation: preset.formation.intitule, quantite: 1, prixUnitaireHt: preset.prix }],
        conditionsPaiement: form.financement === "cpf"
          ? "Prise en charge par la Caisse des dépôts selon les conditions générales de Mon Compte Formation."
          : "Facture émise à l'issue de la formation, payable à 30 jours par virement.",
        dateDebut: form.dateDebut, dateFin: form.dateFin,
        lieu: preset.formation.modalite === "presentiel" ? "" : "Plateforme e-learning et visioconférence", lienConnexion: null,
        intervenants: [{ nom: "Yanis SOUICI", qualite: "Formateur IA générative, dirigeant de Les Formateurs IA" }],
        formateurId: null,
      });
      // Un élève de la plateforme est aussi le stagiaire : son compte relie
      // la session à ses relevés de connexion.
      if (!b2b) {
        const [prenom, ...reste] = nom.split(" ");
        await addTrainee(id, { civilite: "", prenom, nom: (reste.join(" ") || prenom).toUpperCase(), email, fonction: null, profileId: student?.studentId ?? null });
      }
      navigate(`/sessions/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de créer la formation.");
      setSaving(false);
    }
  };

  return (
    <GCard><div className="p-5 space-y-4">
      <p className="text-sm font-black" style={{ color: th.fg }}>Nouvelle formation{initial ? ` · ${initial.name}` : ""}</p>
      <Field label="Financement">
        <Segmented value={form.financement}
          onChange={(v) => setForm((f) => ({ ...f, financement: v as Financement, preset: v === "cpf" ? "rs6776" : f.preset }))}
          options={FINANCEMENTS.map((f) => ({ value: f, label: FINANCEMENT_LABELS[f] }))} />
      </Field>
      <Field label="Programme de départ" hint="Copié dans la formation, modifiable ensuite.">
        <Segmented value={form.preset} onChange={set("preset")} options={FORMATION_PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
      </Field>
      {b2b ? (
        <Field label="Entreprise cliente">
          <VSelect value={form.companyId} onValueChange={set("companyId")} placeholder="Choisir une entreprise"
            options={companies.map((c) => ({ value: c.companyId!, label: c.name }))} />
        </Field>
      ) : (
        <>
          <Field label="Élève">
            <VSelect value={form.studentId} onValueChange={set("studentId")} placeholder="Choisir un élève de la plateforme"
              options={[...students.map((c) => ({ value: c.studentId!, label: `${c.name} · ${c.studentEmail}` })), { value: MANUAL, label: "Pas encore de compte : saisir à la main" }]} />
          </Field>
          {manual && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Prénom et nom"><TextInput value={form.clientNom} onChange={set("clientNom")} /></Field>
              <Field label="E-mail"><TextInput type="email" value={form.clientEmail} onChange={set("clientEmail")} /></Field>
            </div>
          )}
        </>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Début"><TextInput type="date" value={form.dateDebut} onChange={set("dateDebut")} /></Field>
        <Field label="Fin"><TextInput type="date" value={form.dateFin} onChange={set("dateFin")} /></Field>
      </div>
      <div className="flex gap-2">
        <ShimBtn sm onClick={create} disabled={saving}>{saving ? "Création…" : "Créer la formation"}</ShimBtn>
        <VBtn sm onClick={onCancel} disabled={saving}>Annuler</VBtn>
      </div>
    </div></GCard>
  );
}
