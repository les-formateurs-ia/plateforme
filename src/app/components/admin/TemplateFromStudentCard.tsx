// "Nouvelle formation" → partir de la formation personnalisée d'un élève :
// l'admin choisit l'élève puis sa formation, et crée un template indépendant
// (cf. createTemplateFromInstance). Le nom saisi dans le formulaire au-dessus
// est repris s'il est rempli, sinon celui de la formation de l'élève.
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";
import { VSelect } from "@/app/components/common/Select";
import { createTemplateFromInstance, listStudentInstancesForTemplate, type StudentInstanceOption } from "@/app/lib/formations";

export function TemplateFromStudentCard({ nameOverride, slugify, onCreated }: {
  nameOverride: string;
  slugify: (s: string) => string;
  onCreated: (templateId: string) => void;
}) {
  const th = useTh();
  const [options, setOptions] = useState<StudentInstanceOption[] | null>(null);
  const [studentId, setStudentId] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listStudentInstancesForTemplate().then(setOptions).catch((err) => {
      console.error(err);
      toast.error("Impossible de charger les formations des élèves.");
      setOptions([]);
    });
  }, []);

  const students = useMemo(() => {
    const byId = new Map<string, string>();
    for (const o of options ?? []) byId.set(o.studentId, o.studentName);
    return [...byId].map(([id, name]) => ({ value: id, label: name })).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [options]);
  const instances = (options ?? []).filter((o) => o.studentId === studentId);
  const selected = instances.find((o) => o.id === instanceId);

  const create = async () => {
    if (!selected) return;
    const name = nameOverride.trim() || selected.name;
    setCreating(true);
    try {
      const id = await createTemplateFromInstance(selected.id, name, slugify(name));
      toast.success("Template créé en brouillon à partir de la formation de l'élève.");
      onCreated(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Création du template impossible.");
      setCreating(false);
    }
  };

  return (
    <GCard><div className="p-6 space-y-4">
      <div>
        <h3 className="text-sm font-black" style={{ color: th.fg }}>Ou partir de la formation personnalisée d'un élève</h3>
        <p className="text-xs mt-1" style={{ color: th.fg3 }}>
          Copie la structure et le contenu pédagogique (modules, leçons, QCM) dans un nouveau template en brouillon. Aucune donnée de l'élève n'est reprise (progression, réponses, résultats), et le template et la formation de l'élève restent indépendants.
        </p>
      </div>

      {options === null ? (
        <p className="text-xs" style={{ color: th.fg3 }}>Chargement…</p>
      ) : options.length === 0 ? (
        <p className="text-xs" style={{ color: th.fg3 }}>Aucune formation personnalisée d'élève pour l'instant.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <VSelect
              value={studentId}
              onValueChange={(v) => { setStudentId(v); setInstanceId(""); }}
              placeholder="Choisir un élève…"
              options={students}
              disabled={creating}
            />
            <VSelect
              value={instanceId}
              onValueChange={setInstanceId}
              placeholder={studentId ? "Choisir sa formation…" : "Choisis d'abord un élève"}
              options={instances.map((o) => ({ value: o.id, label: o.name }))}
              disabled={creating || !studentId}
            />
          </div>
          <VBtn onClick={create} disabled={creating || !selected}>
            <span className="flex items-center gap-2"><Copy className="w-4 h-4" />{creating ? "Création…" : "Utiliser en tant que template"}</span>
          </VBtn>
        </>
      )}
    </div></GCard>
  );
}
