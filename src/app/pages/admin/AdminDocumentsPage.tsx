import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, Printer } from "lucide-react";
import logoSvg from "@/imports/logo-les-formateurs-ia.svg?raw";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { Segmented, VBtn } from "@/app/components/common/Buttons";
import { countTodos, DOCUMENT_TEMPLATES, PHASE_LABELS, renderTemplate, type DocumentPhase } from "@/app/lib/documents/catalog";
import { SAMPLES } from "@/app/lib/documents/samples";

// Modèles de documents réglementaires (Qualiopi) — admin uniquement. Aperçu
// sur des dossiers fictifs, export PDF par l'impression du navigateur : le
// texte reste sélectionnable, contrairement à une capture html2canvas.
export function AdminDocumentsPage() {
  const th = useTh();
  const [sampleId, setSampleId] = useState<string>(SAMPLES[0].id);
  const [templateId, setTemplateId] = useState(DOCUMENT_TEMPLATES[0].id);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const ctx = SAMPLES.find((s) => s.id === sampleId)!.ctx;
  const available = DOCUMENT_TEMPLATES.filter((t) => t.applicable(ctx));
  const template = available.find((t) => t.id === templateId) ?? available[0];
  const html = useMemo(() => renderTemplate(template, ctx, logoSvg), [template, ctx]);
  const todos = countTodos(html);

  const print = () => frameRef.current?.contentWindow?.print();

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <Link to="/sessions" className="flex items-center gap-1.5 text-sm w-fit hover:opacity-70" style={{ color: th.fg3 }}><ChevronLeft className="w-4 h-4" />Sessions</Link>
      <div>
        <h2 className="text-[1.75rem] sm:text-[2.1rem] leading-[1.08] font-black" style={{ color: th.fg }}><GT>Documents de formation</GT></h2>
        <p className="text-[15px] sm:text-base mt-2 max-w-3xl leading-relaxed" style={{ color: th.fg2 }}>
          Modèles réglementaires du parcours de formation, de la proposition au certificat de réalisation. Les champs surlignés restent à compléter.
        </p>
      </div>

      <Segmented value={sampleId} onChange={setSampleId} options={SAMPLES.map((s) => ({ value: s.id, label: s.label }))} />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          {(Object.keys(PHASE_LABELS) as DocumentPhase[]).map((phase) => (
            <div key={phase} className="space-y-1.5">
              <p className="eyebrow px-1" style={{ color: th.fg3 }}>{PHASE_LABELS[phase]}</p>
              {available.filter((t) => t.phase === phase).map((t) => {
                const active = t.id === template.id;
                return (
                  <button key={t.id} type="button" onClick={() => setTemplateId(t.id)}
                    className="w-full text-left rounded-[4px] px-3 py-2.5 transition-colors"
                    style={{ background: active ? th.navA : "transparent", border: `1px solid ${active ? th.ink : th.sep}` }}>
                    <p className="text-sm font-bold" style={{ color: th.fg }}>{t.titre}</p>
                    <p className="text-xs mt-0.5" style={{ color: th.fg3 }}>{t.description}</p>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <GCard><div className="p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black" style={{ color: th.fg }}>{template.titre}</p>
              <p className="text-xs" style={{ color: th.fg3 }}>{template.references.join(" · ")}</p>
            </div>
            <span className="text-xs font-semibold" style={{ color: todos ? th.danger : th.fg3 }}>
              {todos ? `${todos} champ${todos > 1 ? "s" : ""} à compléter` : "Complet"}
            </span>
            <VBtn sm onClick={print}><Printer className="w-3.5 h-3.5" />Imprimer / PDF</VBtn>
          </div>
          <iframe ref={frameRef} title={template.titre} srcDoc={html} className="w-full rounded-[4px]"
            style={{ height: "80vh", border: `1px solid ${th.sep}`, background: "#eef0f4" }} />
        </div></GCard>
      </div>
    </div>
  );
}
