// Saisie de la réponse à une question de questionnaire (QCM, note 1 à 5,
// Oui / Non avec précision, texte libre) : partagée par les questionnaires
// de l'espace Entreprise et l'évaluation d'impact publique.
import { Check, Star } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { ChoiceButton, HUES, LetterBadge } from "@/app/components/entreprise/EntrepriseKit";
import type { SatisfactionQuestionType, YesNo } from "@/app/lib/entreprise/companySatisfaction";

export type AnswerValue = string | number | string[];
export type AnswerableQuestion = {
  id: string; type: SatisfactionQuestionType; allowMultiple: boolean; followUpOn: YesNo | null; followUpLabel: string | null;
  options: { id: string; label: string }[];
};

export const isEmpty = (v: AnswerValue | undefined) => v === undefined || v === "" || (Array.isArray(v) && !v.length);
export const needsFollowUp = (q: Pick<AnswerableQuestion, "type" | "followUpOn">, v: AnswerValue | undefined) => q.type === "yes_no" && !!q.followUpOn && v === q.followUpOn;

// formal : vouvoiement (formulaires publics).
export function SatisfactionAnswerInput({ q, value, detail, onValue, onToggle, onDetail, formal = false }: {
  q: AnswerableQuestion; value: AnswerValue | undefined; detail: string; formal?: boolean;
  onValue: (v: AnswerValue) => void; onToggle: (optionId: string) => void; onDetail: (text: string) => void;
}) {
  const th = useTh();
  const STAR = HUES.amber[0];
  return (
    <>
    {q.type === "qcm" && (
      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((o, i) => {
          const active = q.allowMultiple ? Array.isArray(value) && value.includes(o.id) : value === o.id;
          const indicator = q.allowMultiple
            ? <span className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center" style={{ border: `2px solid ${active ? "#fff" : th.fg3}` }}>{active && <Check className="w-4 h-4" />}</span>
            : <LetterBadge letter={String.fromCharCode(65 + i)} active={active} />;
          return (
            <ChoiceButton key={o.id} big active={active} indicator={indicator}
              onClick={() => (q.allowMultiple ? onToggle(o.id) : onValue(o.id))}>
              {o.label}
            </ChoiceButton>
          );
        })}
      </div>
    )}

    {q.type === "rating" && (
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = (value as number) >= n;
          return (
            <button key={n} onClick={() => onValue(n)} aria-label={`Note ${n} sur 5`}
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-3xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200"
              style={{ background: on ? "rgba(238,184,90,0.16)" : th.inputBg, border: `1px solid ${on ? "rgba(238,184,90,0.55)" : th.inputB}` }}>
              <Star className="w-7 h-7 sm:w-9 sm:h-9 transition-colors" style={{ color: on ? STAR : th.fg3, fill: on ? STAR : "none" }} />
              <span className="text-[11px] font-black tabular-nums" style={{ color: on ? STAR : th.fg3 }}>{n}</span>
            </button>
          );
        })}
        {typeof value === "number" && <span className="ml-2 text-2xl font-black tabular-nums" style={{ color: th.fg }}>{value}/5</span>}
      </div>
    )}

    {q.type === "yes_no" && (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          {([["yes", "Oui"], ["no", "Non"]] as const).map(([choice, label]) => (
            <ChoiceButton key={choice} big active={value === choice} onClick={() => onValue(choice)}>
              <span className="w-full text-center text-lg">{label}</span>
            </ChoiceButton>
          ))}
        </div>
        {needsFollowUp(q, value) && (
          <textarea
            value={detail}
            onChange={(e) => onDetail(e.target.value)}
            rows={4}
            placeholder={q.followUpLabel || (formal ? "Précisez votre réponse…" : "Précise ta réponse...")}
            className="w-full rounded-[4px] px-5 py-4 text-base g-input resize-none"
          />
        )}
      </div>
    )}

    {q.type === "text" && (
      <textarea
        value={(value as string) ?? ""}
        onChange={(e) => onValue(e.target.value)}
        rows={6}
        placeholder={formal ? "Votre réponse…" : "Ta réponse..."}
        className="w-full rounded-[4px] px-5 py-4 text-base g-input resize-none"
      />
    )}
    </>
  );
}
