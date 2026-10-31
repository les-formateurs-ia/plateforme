import { useTh } from "@/app/theme/theme";
import { Segmented } from "@/app/components/common/Buttons";
import { MODALITE_LABELS } from "@/app/lib/documents/render";
import type { Formation, Modalite } from "@/app/lib/documents/types";
import { Field, ParsedArea, TextArea, TextInput } from "./fields";

// Édition du programme d'une session. Les listes se saisissent une entrée
// par ligne ; les modules suivent une syntaxe courte (voir CONTENU_HINT).

const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);

const pairs = (v: string) => lines(v).map((l) => {
  const [a, ...b] = l.split("|");
  return [a.trim(), b.join("|").trim()] as const;
});

export function contenuToText(contenu: Formation["contenu"]): string {
  return contenu.map((m) => [
    `# ${m.titre}${m.duree ? ` | ${m.duree}` : ""}`,
    ...(m.objectif ? [`> ${m.objectif}`] : []),
    ...m.points.map((p) => `- ${p}`),
  ].join("\n")).join("\n\n");
}

export function textToContenu(text: string): Formation["contenu"] {
  const modules: Formation["contenu"] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const [titre, duree] = pairs(line.replace(/^#+\s*/, ""))[0] ?? ["", ""];
      modules.push({ titre, duree: duree || undefined, points: [] });
    } else {
      if (!modules.length) modules.push({ titre: "Contenu", points: [] });
      const m = modules[modules.length - 1];
      if (line.startsWith(">")) m.objectif = line.replace(/^>\s*/, "");
      else m.points.push(line.replace(/^[-•]\s*/, ""));
    }
  }
  return modules;
}

const CONTENU_HINT = "« # Titre du module | 7 h » ouvre un module, « > objectif » le décrit, « - point » liste son contenu.";

export function ProgrammeEditor({ value, onChange, contenuText, onContenuText }: {
  value: Formation; onChange: (f: Formation) => void; contenuText: string; onContenuText: (v: string) => void;
}) {
  const th = useTh();
  const set = <K extends keyof Formation>(k: K) => (v: Formation[K]) => onChange({ ...value, [k]: v });
  const listField = (k: "publicVise" | "prerequis" | "objectifs" | "methodes" | "moyensTechniques" | "modalitesEvaluation", label: string) => (
    <Field label={label} hint="Une entrée par ligne.">
      <ParsedArea initial={value[k].join("\n")} onText={(v) => set(k)(lines(v))} rows={Math.max(3, value[k].length + 1)} />
    </Field>
  );
  const aDistance = value.modalite === "foad" || value.modalite === "hybride";

  return (
    <div className="space-y-4">
      <Field label="Intitulé"><TextInput value={value.intitule} onChange={set("intitule")} /></Field>
      <Field label="Présentation courte"><TextArea value={value.accroche} onChange={set("accroche")} rows={2} /></Field>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Durée (heures)"><TextInput type="number" value={String(value.dureeHeures)} onChange={(v) => set("dureeHeures")(Number(v) || 0)} /></Field>
        <Field label="Durée (jours)"><TextInput type="number" value={String(value.dureeJours)} onChange={(v) => set("dureeJours")(Number(v) || 0)} /></Field>
        <Field label="Tarif affiché"><TextInput value={value.tarif} onChange={set("tarif")} /></Field>
      </div>
      <Field label="Modalité">
        <Segmented value={value.modalite} onChange={(v) => set("modalite")(v as Modalite)}
          options={(Object.keys(MODALITE_LABELS) as Modalite[]).map((m) => ({ value: m, label: MODALITE_LABELS[m].split(" (")[0] }))} />
      </Field>
      {listField("publicVise", "Public visé")}
      {listField("prerequis", "Prérequis")}
      {listField("objectifs", "Objectifs pédagogiques")}
      <Field label="Contenu" hint={CONTENU_HINT}>
        <TextArea value={contenuText} onChange={onContenuText} rows={12} />
      </Field>
      {listField("methodes", "Méthodes pédagogiques")}
      {listField("moyensTechniques", "Moyens techniques")}
      {listField("modalitesEvaluation", "Modalités d'évaluation")}
      <Field label="Modalités et délais d'accès"><TextArea value={value.delaiAcces} onChange={set("delaiAcces")} rows={2} /></Field>
      <Field label="Accessibilité (handicap)"><TextArea value={value.accessibilite} onChange={set("accessibilite")} rows={2} /></Field>
      <Field label="Indicateurs de résultats" hint="« Libellé | valeur », un par ligne.">
        <ParsedArea initial={value.indicateurs.map((i) => `${i.libelle} | ${i.valeur}`).join("\n")}
          onText={(v) => set("indicateurs")(pairs(v).map(([libelle, valeur]) => ({ libelle, valeur })))} rows={3} />
      </Field>
      {aDistance && (
        <div className="space-y-4 pt-2" style={{ borderTop: `1px solid ${th.sep}` }}>
          <p className="text-xs font-bold pt-2" style={{ color: th.fg3 }}>Formation à distance (art. D6313-3-1)</p>
          <Field label="Assistance technique et pédagogique"><TextArea value={value.assistance ?? ""} onChange={(v) => set("assistance")(v || null)} rows={2} /></Field>
          <Field label="Activités à distance et durée estimée" hint="« Activité | durée », une par ligne.">
            <ParsedArea initial={value.activitesDistance.map((a) => `${a.activite} | ${a.dureeEstimee}`).join("\n")}
              onText={(v) => set("activitesDistance")(pairs(v).map(([activite, dureeEstimee]) => ({ activite, dureeEstimee })))} rows={4} />
          </Field>
        </div>
      )}
      {value.certification && (
        <p className="text-xs" style={{ color: th.fg3 }}>
          Certification visée : {value.certification.intitule} ({value.certification.code}), reprise de la fiche France Compétences.
        </p>
      )}
    </div>
  );
}
