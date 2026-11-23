import { Brain } from "lucide-react";
import { CHAT_PROVIDERS, type ChatProvider } from "@/app/lib/studioChat";
import type { OutilId } from "@/app/data/guide-outils";
import { cx } from "@/app/lib/cx";

const PROVIDER_BY_OUTIL: Record<Exclude<OutilId, "bases">, ChatProvider> = { chatgpt: "openai", claude: "anthropic", gemini: "gemini" };

// « Les bases » n'est pas un outil : couleur et pictogramme propres.
const BASES_ACCENT = "#8B7CF6";

export function outilAccent(id: OutilId): string {
  return id === "bases" ? BASES_ACCENT : CHAT_PROVIDERS[PROVIDER_BY_OUTIL[id]].accent;
}

// Logo de l'outil (mêmes PNG et zooms que Le Studio).
export function OutilLogo({ id, className = "w-12 h-12" }: { id: OutilId; className?: string }) {
  if (id === "bases") {
    return (
      <span role="img" aria-label="Les bases de l'IA" className={cx("rounded-[10px] shrink-0 flex items-center justify-center", className)}
        style={{ background: `linear-gradient(135deg, ${BASES_ACCENT}, #F4A6C0)` }}>
        <Brain className="w-1/2 h-1/2 text-white" />
      </span>
    );
  }
  const p = CHAT_PROVIDERS[PROVIDER_BY_OUTIL[id]];
  return (
    <span role="img" aria-label={p.name} className={cx("rounded-[10px] shrink-0 bg-white", className)}
      style={{ backgroundImage: `url(${p.logo})`, backgroundSize: p.logoZoom, backgroundPosition: "center", backgroundRepeat: "no-repeat", border: "1px solid rgba(0,0,0,0.08)" }} />
  );
}
