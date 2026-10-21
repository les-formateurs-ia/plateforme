// Rendu du sujet de certification et des réponses — en saisie pour l'élève
// (CertificationExamPage) et en lecture seule pour l'admin
// (AdminCertificationAnswersPage). Les libellés viennent tels quels de
// src/app/data/certificationExam.ts.
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import type { ExamBlock, ExamExercise, ExamField } from "@/app/data/certificationExam";
import { getExamImageUrl, uploadExamImage, type ExamAnswers, type ExamAnswerValue } from "@/app/lib/certification";
import { getMyGenerations } from "@/app/lib/studioImages";

// **gras**, //italique//, ++souligné++ — imbricables.
const MARKUP = /(\*\*.+?\*\*|\/\/.+?\/\/|\+\+.+?\+\+)/g;
export function RichText({ text }: { text: string }): ReactNode {
  return text.split(MARKUP).map((part, i) => {
    if (!part) return null;
    const inner = part.slice(2, -2);
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}><RichText text={inner} /></strong>;
    if (part.startsWith("//") && part.endsWith("//")) return <em key={i}><RichText text={inner} /></em>;
    if (part.startsWith("++") && part.endsWith("++")) return <u key={i}><RichText text={inner} /></u>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function ExamBlocks({ blocks }: { blocks: ExamBlock[] }) {
  const th = useTh();
  return (
    <div className="space-y-3 text-[15px] leading-relaxed" style={{ color: th.fg2 }}>
      {blocks.map((b, i) => b.type === "p"
        ? <p key={i}><RichText text={b.text} /></p>
        : <ul key={i} className="list-disc pl-6 space-y-1">{b.items.map((it) => <li key={it}><RichText text={it} /></li>)}</ul>)}
    </div>
  );
}

// Couleur des libellés de réponse, comme les mentions orangées du sujet.
const ANSWER_ACCENT = "#e8916b";

export function ExerciseHeader({ exercise }: { exercise: ExamExercise }) {
  const th = useTh();
  return (
    <div className="text-center mb-6">
      <h2 className="text-2xl font-black" style={{ color: th.fg }}>EXERCICE {exercise.number}</h2>
      <p className="mt-1 text-[15px] font-semibold italic" style={{ color: th.fg2 }}>{exercise.subtitle}</p>
    </div>
  );
}

interface FieldProps {
  field: ExamField;
  value: ExamAnswerValue | undefined;
  onChange?: (value: ExamAnswerValue) => void;
  userId?: string;
}

export function ExamFieldView({ field, value, onChange, userId }: FieldProps) {
  const th = useTh();
  const readOnly = !onChange;
  return (
    <div className="space-y-2.5">
      <p className="text-[15px] font-bold leading-relaxed" style={{ color: th.fg }}><RichText text={field.label} /></p>
      {field.kind === "table" && (
        <ul className="list-disc pl-6 space-y-1 text-[15px]" style={{ color: th.fg2 }}>
          {field.bullets.map((b) => <li key={b}><RichText text={b} /></li>)}
        </ul>
      )}
      {field.kind !== "table" && <p className="text-sm" style={{ color: ANSWER_ACCENT }}>{field.answerLabel}</p>}
      {field.kind === "line" && (readOnly
        ? <AnswerText value={value} />
        : <input value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-[4px] px-4 py-2.5 text-sm g-input" />)}
      {field.kind === "text" && (readOnly
        ? <AnswerText value={value} />
        : <AutoTextarea value={typeof value === "string" ? value : ""} onChange={(v) => onChange(v)} />)}
      {field.kind === "table" && <AnswerTable columns={field.columns} rows={Array.isArray(value) ? value : null} onChange={onChange} />}
      {field.kind === "image" && <AnswerImage path={typeof value === "string" ? value : ""} onChange={onChange} userId={userId} />}
    </div>
  );
}

function AnswerText({ value }: { value: ExamAnswerValue | undefined }) {
  const th = useTh();
  const text = typeof value === "string" ? value.trim() : "";
  return (
    <div className="rounded-[4px] px-4 py-3 text-sm whitespace-pre-wrap break-words" style={{ background: th.inputBg, border: `1px solid ${th.inputB}`, color: text ? th.fg : th.fg3 }}>
      {text || "Pas de réponse"}
    </div>
  );
}

function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={Math.min(24, Math.max(5, value.split("\n").length + 1))}
      className="w-full rounded-[4px] px-4 py-3 text-sm g-input resize-y leading-relaxed"
    />
  );
}

const DEFAULT_TABLE_ROWS = 3;

function AnswerTable({ columns, rows, onChange }: { columns: string[]; rows: string[][] | null; onChange?: (v: string[][]) => void }) {
  const th = useTh();
  const data = rows && rows.length ? rows : Array.from({ length: onChange ? DEFAULT_TABLE_ROWS : 0 }, () => columns.map(() => ""));
  const setCell = (r: number, c: number, v: string) => onChange?.(data.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)));
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-[4px]" style={{ border: `1px solid ${th.inputB}` }}>
        <table className="w-full text-sm" style={{ minWidth: 760 }}>
          <thead>
            <tr style={{ background: "#1f3350" }}>
              {columns.map((c) => <th key={c} className="text-left font-bold px-3 py-2 text-white">{c}</th>)}
              {onChange && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={columns.length} className="px-3 py-3" style={{ color: th.fg3 }}>Pas de réponse</td></tr>
            )}
            {data.map((row, r) => (
              <tr key={r} style={{ borderTop: `1px solid ${th.sep}` }}>
                {row.map((cell, c) => (
                  <td key={c} className="align-top p-1.5" style={{ borderLeft: c ? `1px solid ${th.sep}` : undefined }}>
                    {onChange
                      ? <textarea value={cell} onChange={(e) => setCell(r, c, e.target.value)} rows={c === 3 ? 4 : 2} className="w-full rounded-[2px] px-2 py-1.5 text-sm g-input resize-y" />
                      : <div className="px-1.5 py-1 whitespace-pre-wrap break-words" style={{ color: th.fg }}>{cell}</div>}
                  </td>
                ))}
                {onChange && (
                  <td className="align-top p-1.5">
                    <button type="button" aria-label="Supprimer la ligne" onClick={() => onChange(data.filter((_, ri) => ri !== r))}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-[2px] transition-opacity hover:opacity-70" style={{ color: th.fg3 }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onChange && (
        <button type="button" onClick={() => onChange([...data, columns.map(() => "")])}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-[2px] transition-opacity hover:opacity-80" style={{ color: th.fg, border: `1px solid ${th.inputB}` }}>
          <Plus className="w-4 h-4" />Ajouter une ligne
        </button>
      )}
    </div>
  );
}

function useSignedImage(path: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (path) getExamImageUrl(path).then((u) => { if (!cancelled) setUrl(u); }).catch(console.error);
    return () => { cancelled = true; };
  }, [path]);
  return url;
}

function AnswerImage({ path, onChange, userId }: { path: string; onChange?: (v: string) => void; userId?: string }) {
  const th = useTh();
  const url = useSignedImage(path);
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="space-y-2">
      {path ? (
        <div className="relative inline-block max-w-full">
          {url
            ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Visuel proposé" className="max-h-[420px] max-w-full rounded-[6px]" style={{ border: `1px solid ${th.sep}` }} /></a>
            : <div className="w-64 h-40 rounded-[6px] flex items-center justify-center" style={{ background: th.inputBg }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: th.fg3 }} /></div>}
          {onChange && (
            <button type="button" aria-label="Retirer le visuel" onClick={() => onChange("")}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : !onChange ? (
        <AnswerText value="" />
      ) : null}
      {onChange && userId && (
        <>
          <button type="button" onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-[2px] transition-opacity hover:opacity-80" style={{ color: th.fg, border: `1px solid ${th.ink}` }}>
            <ImagePlus className="w-4 h-4" />{path ? "Changer de visuel" : "Importer mon visuel"}
          </button>
          <p className="text-xs" style={{ color: th.fg3 }}>Choisis une image générée dans Le Studio, ou importe un fichier depuis ton appareil.</p>
          <ImagePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} userId={userId} onPick={(p) => { onChange(p); setPickerOpen(false); }} />
        </>
      )}
    </div>
  );
}

function StudioThumb({ path, onClick }: { path: string; onClick: () => void }) {
  const th = useTh();
  const url = useSignedImage(path);
  return (
    <button type="button" onClick={onClick} className="aspect-square rounded-[6px] overflow-hidden transition-opacity hover:opacity-80" style={{ background: th.inputBg, border: `1px solid ${th.sep}` }}>
      {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <Loader2 className="w-4 h-4 m-auto animate-spin" style={{ color: th.fg3 }} />}
    </button>
  );
}

function ImagePickerDialog({ open, onOpenChange, userId, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; userId: string; onPick: (path: string) => void }) {
  const th = useTh();
  const [paths, setPaths] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    getMyGenerations(userId)
      .then((rows) => setPaths(rows.filter((r) => r.status === "ready" && r.imagePath).map((r) => r.imagePath!)))
      .catch((err) => { console.error(err); setPaths([]); });
  }, [open, userId]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choisis un fichier image."); return; }
    setUploading(true);
    try {
      onPick(await uploadExamImage(userId, file));
    } catch (err) {
      console.error(err);
      toast.error("Import impossible.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !uploading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer ton visuel</DialogTitle>
          <DialogDescription>Sélectionne une image créée dans Le Studio, ou importe un fichier.</DialogDescription>
        </DialogHeader>
        <label className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-[2px] cursor-pointer transition-opacity hover:opacity-80" style={{ background: th.ink, color: th.onInk }}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Import…" : "Importer depuis mon appareil"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} />
        </label>
        <p className="eyebrow mt-2" style={{ color: th.fg3 }}>Mes images du Studio</p>
        <div className="max-h-[50vh] overflow-y-auto">
          {paths === null && <p className="text-sm" style={{ color: th.fg3 }}>Chargement…</p>}
          {paths?.length === 0 && <p className="text-sm" style={{ color: th.fg3 }}>Aucune image générée pour l'instant. Crée ton visuel dans Le Studio › Images.</p>}
          {!!paths?.length && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {paths.map((p) => <StudioThumb key={p} path={p} onClick={() => onPick(p)} />)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Un exercice complet : contexte puis questions, éventuellement en parties.
export function ExerciseView({ exercise, answers, onChange, userId }: {
  exercise: ExamExercise;
  answers: ExamAnswers;
  onChange?: (id: string, value: ExamAnswerValue) => void;
  userId?: string;
}) {
  const th = useTh();
  return (
    <GCard>
      <div className="p-5 sm:p-8">
        <ExerciseHeader exercise={exercise} />
        <ExamBlocks blocks={exercise.context} />
        <div className="mt-8 space-y-8">
          {exercise.parts.map((part, i) => (
            <div key={i} className="space-y-7">
              {part.heading && <h3 className="text-base font-black underline" style={{ color: th.fg }}>{part.heading}</h3>}
              {part.fields.map((f) => (
                <ExamFieldView key={f.id} field={f} value={answers[f.id]} userId={userId}
                  onChange={onChange ? (v) => onChange(f.id, v) : undefined} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </GCard>
  );
}
