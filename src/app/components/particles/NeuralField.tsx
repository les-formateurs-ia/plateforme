import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { mountNeuralField, type NeuralField as Field, type NeuralFieldOptions } from "@/app/lib/particles/neural-field";
import { cx } from "@/app/lib/cx";

export interface NeuralFieldHandle {
  /** Active le réseau un moment (l'IA travaille). */
  excite(amount?: number): void;
}

// Le réseau neuronal de la marque, en fond d'une zone (position absolue,
// derrière le contenu). `active` le maintient excité tant que c'est vrai
// (génération en cours, agent qui répond…).
export const NeuralField = forwardRef<NeuralFieldHandle, NeuralFieldOptions & { className?: string; active?: boolean }>(
  function NeuralField({ className, active, dark, density, band, speed, seed, center }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const field = useRef<Field | null>(null);

    useEffect(() => {
      if (!canvasRef.current) return;
      field.current = mountNeuralField(canvasRef.current, { dark, density, band, speed, seed, center });
      return () => { field.current?.destroy(); field.current = null; };
      // Les options de forme ne changent pas au cours de la vie du composant.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { field.current?.setDark(!!dark); }, [dark]);

    // Activité soutenue, atteinte et relâchée en douceur (plus d'impulsions
    // périodiques qui faisaient « pulser » le réseau en boucle).
    useEffect(() => { field.current?.setActivity(active ? 0.6 : 0); }, [active]);

    useImperativeHandle(ref, () => ({ excite: (amount = 0.5) => field.current?.excite(amount) }), []);

    return <canvas ref={canvasRef} aria-hidden className={cx("pointer-events-none absolute inset-0 w-full h-full", className)} />;
  },
);
