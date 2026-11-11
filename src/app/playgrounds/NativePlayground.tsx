import { Component, Suspense, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import type { ComponentType, LazyExoticComponent } from "react";
import type { PlaygroundParams, PlaygroundProps } from "./registry";

class PlaygroundBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

// Rend un composant natif (Playground ou Fiche de révision) chargé à la demande.
export function NativePlayground({ component: Pg, params, lessonTitle }: { component: LazyExoticComponent<ComponentType<PlaygroundProps>>; params: PlaygroundParams; lessonTitle: string }) {
  const th = useTh();
  return (
    <PlaygroundBoundary fallback={<p className="p-6 text-sm" style={{ color: th.danger }}>Ce contenu n'a pas pu se charger. Rechargez la page.</p>}>
      <Suspense fallback={<div className="flex items-center justify-center gap-2 p-10 text-sm" style={{ color: th.fg3 }}><Loader2 className="w-4 h-4 animate-spin" />Chargement…</div>}>
        <Pg params={params} lessonTitle={lessonTitle} />
      </Suspense>
    </PlaygroundBoundary>
  );
}
