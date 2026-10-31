import { useState, type ReactNode } from "react";
import { useTh } from "@/app/theme/theme";

// Champs de formulaire des sessions de formation (même rendu que la saisie
// manuelle de l'espace Prospects).

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const th = useTh();
  return (
    <label className="block">
      <span className="block text-xs font-bold mb-1.5" style={{ color: th.fg2 }}>{label}</span>
      {children}
      {hint && <span className="block text-[11px] mt-1" style={{ color: th.fg3 }}>{hint}</span>}
    </label>
  );
}

export function TextInput({ value, onChange, type = "text", placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-[4px] px-3 py-2 text-sm g-input" />;
}

export function TextArea({ value, onChange, rows = 4, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return <textarea value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-[4px] px-3 py-2 text-sm g-input leading-relaxed" />;
}

// Texte libre gardé tel quel pendant la saisie (lignes vides comprises) ;
// seule la valeur interprétée remonte au formulaire.
export function ParsedArea({ initial, onText, rows }: { initial: string; onText: (v: string) => void; rows: number }) {
  const [text, setText] = useState(initial);
  return <TextArea value={text} onChange={(v) => { setText(v); onText(v); }} rows={rows} />;
}
