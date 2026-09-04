import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";

export type AgentOrbStatus = "idle" | "connecting" | "connected";
export type AgentOrbMode = "listening" | "speaking";

interface AgentOrbProps {
  status: AgentOrbStatus;
  mode?: AgentOrbMode;
  /** Micro tenu (push-to-talk) — bascule le dégradé vers l'émeraude "écoute". */
  active?: boolean;
  size?: number;
  children?: ReactNode;
}

// Représentation visuelle de l'agent vocal : un cercle qui respire au repos
// (deux dégradés de marque — violet et corail — qui se fondent l'un dans
// l'autre), grossit à la connexion, bascule en émeraude pendant que
// l'utilisateur parle (micro tenu), et ondule quand l'agent répond.
export function AgentOrb({ status, mode = "listening", active = false, size, children }: AgentOrbProps) {
  const th = useTh();
  const dimension = size ?? (status === "idle" ? 44 : 84);
  const speaking = status === "connected" && mode === "speaking";
  const listening = status === "connected" && active;

  return (
    <div
      data-agent-orb
      className="relative shrink-0"
      style={{ width: dimension, height: dimension, transition: "width 0.4s cubic-bezier(.4,0,.2,1), height 0.4s cubic-bezier(.4,0,.2,1)" }}
    >
      {speaking && [0, 1].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `1.5px solid ${th.navAC}`, animation: `agent-orb-ring 1.8s ${i * 0.6}s ease-out infinite` }}
        />
      ))}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: "50%",
          animation: speaking ? "agent-orb-wobble 2.6s ease-in-out infinite" : "agent-orb-idle 3.4s ease-in-out infinite",
          boxShadow: `0 4px 20px ${th.gradShadow(0.35)}`,
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#b58de0,#dbacf0)" }} />
        <div
          className="absolute"
          style={{ inset: "-15%", background: "radial-gradient(circle at 72% 72%,#fceccd,#fbc2ad 65%,transparent 78%)", filter: "blur(1px)" }}
        />
        {/* Écoute (micro tenu) : crossfade vers l'émeraude — les dégradés ne
            s'interpolent pas nativement en CSS, on anime l'opacité d'une
            couche superposée plutôt que la couleur elle-même. */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg,#78d5e2,#6adeb1)", opacity: listening ? 1 : 0, transition: "opacity 0.45s ease" }}
        />
      </div>
      {children && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">{children}</div>}
    </div>
  );
}
