// Cartes d'édition des questions d'un questionnaire (QCM, note 1 à 5,
// Oui / Non avec précision, texte libre) : partagées par les questionnaires
// de satisfaction des entreprises et l'évaluation d'impact des sessions.
import { Plus, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { HueCheckbox, HueSegmented, IconAction, SubCard, useHue } from "@/app/components/entreprise/EntrepriseKit";
import { QuestionCardHeader, type useQuestionList } from "@/app/components/entreprise/QuestionListEditor";
import type { SatisfactionQuestionDraft, SatisfactionQuestionType } from "@/app/lib/entreprise/companySatisfaction";

export const SATISFACTION_TYPE_LABEL: Record<SatisfactionQuestionType, string> = {
  qcm: "QCM", rating: "Note 1 à 5", yes_no: "Oui / Non", text: "Texte libre",
};

export const EMPTY_QUESTION = (): SatisfactionQuestionDraft => ({
  question: "", type: "text", isRequired: true, allowMultiple: false, followUpOn: null, followUpLabel: "", options: [],
});

type QuestionList = ReturnType<typeof useQuestionList<SatisfactionQuestionDraft>>;

export function SatisfactionQuestionCards({ list: questions }: { list: QuestionList }) {
  const th = useTh();
  const h = useHue();
  const setType = (qIndex: number, type: SatisfactionQuestionType) =>
    questions.update(qIndex, (q) => ({
      type,
      options: type === "qcm" ? (q.options.length ? q.options : [{ label: "" }, { label: "" }]) : [],
    }));
  const updateOptions = (qIndex: number, map: (options: SatisfactionQuestionDraft["options"]) => SatisfactionQuestionDraft["options"]) =>
    questions.update(qIndex, (q) => ({ options: map(q.options) }));

  return (
    <div className="space-y-4">
      {questions.items.map((q, qIndex) => (
        <div key={q._key} ref={questions.registerNode(q._key)}>
          <SubCard>
            <QuestionCardHeader index={qIndex} count={questions.items.length}
              onMove={(delta) => questions.move(qIndex, delta)} onRemove={() => questions.remove(qIndex)} />
            <input value={q.question} onChange={(e) => questions.update(qIndex, { question: e.target.value })} placeholder="Intitulé de la question"
              className="w-full rounded-[4px] px-3.5 py-2.5 text-sm font-semibold g-input mb-3" />

            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <HueSegmented value={q.type} onChange={(v) => setType(qIndex, v)}
                options={(Object.entries(SATISFACTION_TYPE_LABEL) as [SatisfactionQuestionType, string][]).map(([value, label]) => ({ value, label }))} />
              <HueCheckbox checked={q.isRequired} onChange={(v) => questions.update(qIndex, { isRequired: v })}>Réponse obligatoire</HueCheckbox>
            </div>

            {q.type === "qcm" && (
              <div className="space-y-2">
                {q.options.map((o, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input value={o.label} onChange={(e) => updateOptions(qIndex, (opts) => opts.map((x, j) => (j === oIndex ? { ...x, label: e.target.value } : x)))}
                      placeholder={`Réponse ${oIndex + 1}`} className="flex-1 rounded-[4px] px-3 py-2 text-sm g-input" />
                    <IconAction Icon={Trash2} onClick={() => updateOptions(qIndex, (opts) => opts.filter((_, j) => j !== oIndex))} title="Supprimer la réponse" />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                  <button type="button" onClick={() => updateOptions(qIndex, (opts) => [...opts, { label: "" }])}
                    className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-70" style={{ color: h.text }}><Plus className="w-3.5 h-3.5" />Ajouter une réponse</button>
                  <HueCheckbox checked={q.allowMultiple} onChange={(v) => questions.update(qIndex, { allowMultiple: v })}>Plusieurs réponses possibles</HueCheckbox>
                </div>
              </div>
            )}

            {q.type === "yes_no" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: th.fg2 }}>
                  <span className="font-semibold">Demander une précision (champ texte) si la réponse est :</span>
                  <HueSegmented value={q.followUpOn ?? "none"} onChange={(v) => questions.update(qIndex, { followUpOn: v === "none" ? null : v })}
                    options={[{ value: "none", label: "Jamais" }, { value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
                </div>
                {q.followUpOn && (
                  <input value={q.followUpLabel} onChange={(e) => questions.update(qIndex, { followUpLabel: e.target.value })}
                    placeholder="Libellé du champ texte (ex. Précisez pourquoi)" className="w-full rounded-[4px] px-3 py-2 text-sm g-input" />
                )}
              </div>
            )}
            {q.type === "rating" && <p className="text-xs" style={{ color: th.fg3 }}>L'élève répondra avec une note de 1 à 5. Précisez le barème dans le texte d'introduction.</p>}
            {q.type === "text" && <p className="text-xs" style={{ color: th.fg3 }}>L'élève répondra en texte libre.</p>}
          </SubCard>
        </div>
      ))}
      {!questions.items.length && <p className="text-sm" style={{ color: th.fg3 }}>Aucune question pour l'instant.</p>}
    </div>
  );
}
