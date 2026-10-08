import type { ReactNode } from "react";
import { ArrowRight, Check, Play, Sparkles } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { cx } from "@/app/lib/cx";

// Mini-démos d'interface des tuiles (Studio, Exercices, accueil), dans l'esprit
// de la section « Plateforme » du site public : chaque tuile montre l'outil en
// miniature plutôt qu'une métaphore. Lisibles telles quelles au repos ; au
// survol de la carte (.group), une animation discrète joue l'usage (le chat
// écrit, l'onde joue, le score se remplit). Les « contenus générés » sont des
// aplats aux dégradés de la charte : aucune image externe.
export type DemoKind =
  | "chat" | "images" | "videos" | "music" | "talking-head" | "tts" | "doublage" | "face-swap"
  | "prompts" | "media" | "battle" | "reverse" | "ai-detection" | "html" | "agent";

const G = {
  violet: "linear-gradient(135deg,#dbacf0,#b58de0)",
  bleu: "linear-gradient(135deg,#78d5e2,#6adeb1)",
  beige: "linear-gradient(135deg,#fbc2ad,#fceccd)",
  iris: "linear-gradient(120deg,#b58de0,#dbacf0 35%,#78d5e2 65%,#fbc2ad)",
};

export function ToolDemo({ kind, logo, label }: { kind: DemoKind; logo?: string; label?: string }) {
  const Demo = DEMOS[kind];
  return (
    <div aria-hidden className="tool-demo absolute inset-0 flex items-center justify-center p-5">
      <div className="w-full max-w-[280px]"><Demo logo={logo} label={label} /></div>
    </div>
  );
}

// Petite fenêtre d'application : barre de titre, contenu.
function Frame({ children, title, className }: { children: ReactNode; title?: ReactNode; className?: string }) {
  const th = useTh();
  return (
    <div className={cx("rounded-[8px] overflow-hidden", className)} style={{ background: th.card, border: `1px solid ${th.sep}`, boxShadow: "0 18px 36px -24px rgba(0,0,0,0.35)" }}>
      {title && <div className="flex items-center gap-1.5 px-2.5 h-6 text-[9px] font-bold uppercase tracking-[0.06em]" style={{ borderBottom: `1px solid ${th.sep}`, color: th.fg3 }}>{title}</div>}
      <div className="p-2.5">{children}</div>
    </div>
  );
}

function Line({ w, strong }: { w: string; strong?: boolean }) {
  const th = useTh();
  return <span className="block h-[5px] rounded-full" style={{ width: w, background: strong ? th.fg : th.sep }} />;
}

function Bubble({ me, children }: { me?: boolean; children: ReactNode }) {
  const th = useTh();
  return (
    <div className={cx("max-w-[88%] px-2.5 py-1.5 text-[10px] leading-snug", me ? "self-end" : "self-start")}
      style={me
        ? { background: th.ink, color: th.onInk, borderRadius: "8px 8px 2px 8px" }
        : { background: `linear-gradient(${th.card},${th.card}) padding-box, ${G.iris} border-box`, border: "1px solid transparent", color: th.fg, borderRadius: "8px 8px 8px 2px" }}>
      {children}
    </div>
  );
}

function Typing() {
  const th = useTh();
  return (
    <span className="demo-typing inline-flex gap-[3px] items-center h-3">
      {[0, 1, 2].map((i) => <i key={i} className="w-1 h-1 rounded-full" style={{ background: th.fg3, animationDelay: `${i * 140}ms` }} />)}
    </span>
  );
}

// Barres d'une onde audio (hauteurs fixes, animées au survol).
function Wave({ n = 22, grad = G.iris, h = 30 }: { n?: number; grad?: string; h?: number }) {
  return (
    <span className="demo-wave flex items-end gap-[2px]" style={{ height: h }}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className="flex-1 rounded-[2px]" style={{ height: `${18 + Math.abs(Math.sin(i * 1.3) * 62 + Math.sin(i * 0.5) * 20)}%`, background: grad, animationDelay: `${(i % 7) * 80}ms` }} />
      ))}
    </span>
  );
}

function Score({ value, label }: { value: number; label: string }) {
  const th = useTh();
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: th.navA }}>
        <span className="demo-fill block h-full rounded-full" style={{ width: `${value}%`, background: G.iris }} />
      </span>
      <span className="text-[11px] font-black tabular-nums" style={{ color: th.fg }}>{label}</span>
    </div>
  );
}

function Chip({ children, ok }: { children: ReactNode; ok?: boolean }) {
  const th = useTh();
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}>
      {ok && <Check className="w-2.5 h-2.5" style={{ color: th.success }} />}{children}
    </span>
  );
}

const CHAT_SAMPLES: Record<string, [string, string]> = {
  ChatGPT: ["Écris un mail de relance poli", "Bonjour Claire, je me permets…"],
  Gemini: ["Compare ces deux devis", "Le devis B est 18 % moins cher…"],
  Claude: ["Résume ce rapport en 3 points", "1. Ventes en hausse de 12 %…"],
  default: ["Résume ce rapport en 3 points", "1. Ventes en hausse de 12 %…"],
};

// Chaque démo est un composant (elles lisent le thème).
const DEMOS: Record<DemoKind, (p: { logo?: string; label?: string }) => ReactNode> = {
  // ── Studio ─────────────────────────────────────────────────────────────
  chat: ({ logo, label }) => {
    // Un échange type par modèle, pour que les trois tuiles ne se ressemblent pas.
    const [ask, answer] = CHAT_SAMPLES[label ?? ""] ?? CHAT_SAMPLES.default;
    return (
      <Frame title={<>{logo && <img src={logo} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}{label ?? "Chat IA"}</>}>
        <div className="flex flex-col gap-1.5">
          <Bubble me>{ask}</Bubble>
          <Bubble><span className="demo-type"><span>{answer}</span><Typing /></span></Bubble>
        </div>
      </Frame>
    );
  },
  images: () => (
    <Frame title={<><Sparkles className="w-3 h-3" />Un renard en origami, lumière douce</>}>
      <div className="grid grid-cols-3 gap-1.5">
        {[G.violet, G.bleu, G.beige].map((g, i) => (
          <span key={i} className="demo-pop h-[72px] rounded-[4px]" style={{ background: g, animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </Frame>
  ),
  videos: () => {
    const th = useTh();
    return (
      <Frame title="Travelling sur une ville au lever du jour">
        <div className="relative h-[76px] rounded-[4px] overflow-hidden" style={{ background: G.iris }}>
          <span className="absolute inset-0 flex items-center justify-center"><span className="w-7 h-7 rounded-full bg-white flex items-center justify-center"><Play className="w-3 h-3 ml-0.5" fill="#000" /></span></span>
        </div>
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: th.navA }}><span className="demo-fill block h-full w-[42%]" style={{ background: th.ink }} /></div>
      </Frame>
    );
  },
  music: () => {
    const th = useTh();
    return (
      <Frame title="Lo-fi chill · 90 BPM · 30 s">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-[4px] shrink-0" style={{ background: G.beige }} />
          <div className="flex-1"><Wave /></div>
        </div>
        <p className="mt-1.5 text-[9px] tabular-nums" style={{ color: th.fg3 }}>0:12 / 0:30</p>
      </Frame>
    );
  },
  "talking-head": () => (
    <Frame title="Faire parler une image">
      <div className="flex items-center gap-2.5">
        <span className="w-12 h-12 rounded-full shrink-0 relative overflow-hidden" style={{ background: G.violet }}>
          <span className="demo-mouth absolute left-1/2 bottom-[28%] -translate-x-1/2 w-3 h-1 rounded-full bg-black/70" />
        </span>
        <div className="flex-1 space-y-1.5"><Wave n={16} h={18} grad={G.violet} /><Line w="80%" /></div>
      </div>
    </Frame>
  ),
  tts: () => (
    <Frame title="Texte → voix">
      <div className="space-y-1.5"><Line w="92%" strong /><Line w="70%" strong /></div>
      <div className="my-2 flex justify-center"><ArrowRight className="w-3 h-3 rotate-90 opacity-50" /></div>
      <Wave n={26} h={20} grad={G.bleu} />
    </Frame>
  ),
  doublage: () => {
    const th = useTh();
    return (
      <Frame title="Doublage FR → EN">
        <div className="relative h-[72px] rounded-[4px] overflow-hidden" style={{ background: G.beige }}>
          <span className="absolute inset-x-2 bottom-2 rounded-[2px] px-1.5 py-1 text-center text-[9px] font-semibold bg-black/75 text-white">
            <span className="demo-swap"><span>Bonjour à tous !</span><span>Hello everyone!</span></span>
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold" style={{ color: th.fg2 }}><Chip>FR</Chip><ArrowRight className="w-2.5 h-2.5" /><Chip>EN</Chip><Chip>ES</Chip><Chip>DE</Chip></div>
      </Frame>
    );
  },
  "face-swap": () => (
    <Frame title="Face swap">
      <div className="flex items-center justify-center gap-3">
        <span className="w-11 h-11 rounded-full" style={{ background: G.bleu }} />
        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
        <span className="w-11 h-11 rounded-full" style={{ background: G.violet }} />
      </div>
    </Frame>
  ),

  // ── Exercices ──────────────────────────────────────────────────────────
  prompts: () => {
    const th = useTh();
    return (
      <Frame title="Ton prompt">
        <p className="text-[10px] leading-snug" style={{ color: th.fg }}>« Agis comme un chargé de com et rédige un post LinkedIn sur… »</p>
        <div className="mt-2.5"><Score value={80} label="16/20" /></div>
        <div className="mt-2 flex flex-wrap gap-1"><Chip ok>Rôle</Chip><Chip ok>Contexte</Chip><Chip>+ format</Chip></div>
      </Frame>
    );
  },
  media: () => {
    const th = useTh();
    return (
      <Frame title="Avant / après correction">
        <div className="grid grid-cols-2 gap-1.5">
          <span className="h-[68px] rounded-[4px] grayscale opacity-60" style={{ background: G.bleu }} />
          <span className="demo-pop h-[68px] rounded-[4px]" style={{ background: G.iris }} />
        </div>
        <div className="mt-1.5 grid grid-cols-2 text-[9px] font-bold text-center" style={{ color: th.fg3 }}><span>9/20</span><span style={{ color: th.fg }}>17/20</span></div>
      </Frame>
    );
  },
  battle: () => {
    const th = useTh();
    return (
      <Frame title="Un prompt, trois IA">
        <div className="grid grid-cols-3 gap-1.5">
          {[["GPT", G.bleu], ["Gemini", G.violet], ["Claude", G.beige]].map(([name, g], i) => (
            <div key={name} className="rounded-[4px] p-1.5" style={{ border: `1px solid ${th.sep}` }}>
              <span className="block h-1.5 w-6 rounded-full mb-1.5" style={{ background: g }} />
              <span className="text-[8px] font-bold" style={{ color: th.fg }}>{name}</span>
              <div className="mt-1 space-y-1 demo-pop" style={{ animationDelay: `${i * 150}ms` }}><Line w="100%" /><Line w="70%" /><Line w="85%" /></div>
            </div>
          ))}
        </div>
      </Frame>
    );
  },
  reverse: () => {
    const th = useTh();
    return (
      <Frame title="Quel prompt a créé cette image ?">
        <div className="flex gap-2">
          <span className="w-14 h-14 rounded-[4px] shrink-0" style={{ background: G.violet }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] leading-snug" style={{ color: th.fg }}>« Un phare violet sous la pluie… »<span className="demo-caret" /></p>
            <div className="mt-1.5"><Score value={68} label="68 %" /></div>
          </div>
        </div>
      </Frame>
    );
  },
  "ai-detection": () => {
    const th = useTh();
    return (
      <Frame title="Réelle ou générée ?">
        <span className="block h-[64px] rounded-[4px]" style={{ background: G.bleu }} />
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] font-bold text-center">
          <span className="rounded-[2px] py-1" style={{ border: `1px solid ${th.sep}`, color: th.fg2 }}>Réelle</span>
          <span className="rounded-[2px] py-1" style={{ background: th.ink, color: th.onInk }}>IA</span>
        </div>
      </Frame>
    );
  },
  html: () => {
    const th = useTh();
    return (
      <Frame title="index.html">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1 font-mono text-[8px]" style={{ color: th.fg2 }}>
            <p><span style={{ color: "#b58de0" }}>&lt;h1&gt;</span>Bonjour</p><p><span style={{ color: "#17707d" }}>button</span>.onclick</p><p className="opacity-60">{"{ … }"}</p>
          </div>
          <div className="rounded-[4px] p-1.5 space-y-1" style={{ border: `1px solid ${th.sep}` }}>
            <Line w="70%" strong /><span className="block h-3 w-10 rounded-[2px]" style={{ background: th.ink }} />
          </div>
        </div>
      </Frame>
    );
  },
  agent: () => (
    <Frame title={<><span className="w-3 h-3 rounded-full" style={{ background: G.beige }} />Mon agent IA</>}>
      <div className="flex flex-col gap-1.5">
        <Bubble me>Explique-moi le few-shot</Bubble>
        <Bubble><span className="demo-type"><span>C'est donner 2-3 exemples…</span><Typing /></span></Bubble>
      </div>
    </Frame>
  ),
};
