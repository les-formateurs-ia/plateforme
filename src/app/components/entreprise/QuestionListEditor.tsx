// Briques communes aux éditeurs de quiz (CompanyPositioningTab) et de
// questionnaires (CompanySatisfactionTab) : liste de questions réordonnable,
// barre d'actions collée en bas de la fenêtre (le bouton "Ajouter une
// question" reste visible quel que soit le défilement) et défilement
// automatique vers la question ajoutée.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GhostButton, IconAction, NumberBadge } from "@/app/components/entreprise/EntrepriseKit";

// _key : identifiant local stable (les questions neuves n'ont pas encore
// d'id en base), pour que React garde le bon champ après un réordonnancement.
export type Keyed<T> = T & { _key: string };

const withKey = <T extends object>(item: T): Keyed<T> => ({ ...item, _key: crypto.randomUUID() });

export function useQuestionList<T extends object>() {
  const [items, setItems] = useState<Keyed<T>[]>([]);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  useEffect(() => {
    if (!scrollTo) return;
    const node = nodes.current.get(scrollTo);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    node?.querySelector<HTMLInputElement>("input, textarea")?.focus({ preventScroll: true });
    setScrollTo(null);
  }, [scrollTo, items]);

  return {
    items,
    reset: (next: T[]) => setItems(next.map(withKey)),
    add: (item: T) => {
      const keyed = withKey(item);
      setItems((qs) => [...qs, keyed]);
      setScrollTo(keyed._key);
    },
    remove: (index: number) => setItems((qs) => qs.filter((_, i) => i !== index)),
    move: (index: number, delta: -1 | 1) => setItems((qs) => {
      const target = index + delta;
      if (target < 0 || target >= qs.length) return qs;
      const next = [...qs];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }),
    update: (index: number, patch: Partial<T> | ((q: Keyed<T>) => Partial<T>)) =>
      setItems((qs) => qs.map((q, i) => (i === index ? { ...q, ...(typeof patch === "function" ? patch(q) : patch) } : q))),
    registerNode: (key: string) => (node: HTMLDivElement | null) => {
      if (node) nodes.current.set(key, node);
      else nodes.current.delete(key);
    },
  };
}

// En-tête d'une carte question : numéro + monter / descendre / supprimer.
export function QuestionCardHeader({ index, count, onMove, onRemove }: {
  index: number; count: number; onMove: (delta: -1 | 1) => void; onRemove: () => void;
}) {
  const th = useTh();
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest" style={{ color: th.fg2 }}>
        <NumberBadge n={index + 1} />Question
      </span>
      <div className="flex items-center gap-1.5">
        <IconAction Icon={ArrowUp} onClick={() => onMove(-1)} disabled={index === 0} title="Monter la question" />
        <IconAction Icon={ArrowDown} onClick={() => onMove(1)} disabled={index === count - 1} title="Descendre la question" />
        <IconAction Icon={Trash2} tone="danger" onClick={onRemove} title="Supprimer la question" />
      </div>
    </div>
  );
}

// Barre collée en bas de la fenêtre de dialogue (qui défile) : ajout de
// question à gauche, action principale à droite. Les marges négatives
// compensent le padding p-6 de DialogContent pour couvrir toute la largeur.
export function StickyEditorBar({ onAdd, children }: { onAdd: () => void; children: ReactNode }) {
  const th = useTh();
  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between gap-3 flex-wrap z-10"
      style={{ background: th.card, borderTop: `1px solid ${th.sep}` }}>
      <GhostButton Icon={Plus} onClick={onAdd}>Ajouter une question</GhostButton>
      {children}
    </div>
  );
}
