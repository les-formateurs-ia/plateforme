import { useNavigate } from "react-router";

import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { GT } from "@/app/components/common/GT";
import { SymbolCard } from "@/app/components/common/SymbolCard";
import type { DemoKind } from "@/app/components/common/ToolDemo";
import { SectionHead } from "@/app/components/common/SectionHead";
import { CHAT_PROVIDERS } from "@/app/lib/studioChat";
import { AiBudgetExhaustedNotice, useAiBudgetExhausted } from "@/app/components/common/AiBudgetGate";
import imgChatGPT from "@/imports/chatgpt_logo.png";
import imgGemini from "@/imports/gemini_logo.png";
import imgClaude from "@/imports/claude_logo.png";

// `restricted` : modules pas encore prêts (intégration API à venir) —
// visibles en aperçu (grisé, non cliquable) pour l'admin seulement, masqués
// pour le formateur et l'élève.
// Chaque module est illustré en particules : le logo du fournisseur pour les
// chats, une icône pour les outils de création.
const CHAT_LOGOS = { openai: imgChatGPT, gemini: imgGemini, anthropic: imgClaude };
const CHAT_THEMES = { openai: "bleu", gemini: "violet", anthropic: "beige" } as const;
type StudioModule = { slug: string; group: "chat" | "create"; demo: DemoKind; logo?: string; theme: "violet" | "bleu" | "beige"; title: string; subtitle: string; desc: string; restricted: boolean };
const CHAT_MODULES: StudioModule[] = (["openai", "gemini", "anthropic"] as const).map((id) => {
  const p = CHAT_PROVIDERS[id];
  return {
    slug: p.slug, group: "chat", demo: "chat", logo: CHAT_LOGOS[id], theme: CHAT_THEMES[id], title: p.name, subtitle: `Chat IA · ${p.company}`,
    desc: `Discute librement avec ${p.name}, joins tes fichiers et compare les modèles.`, restricted: false,
  };
});

const STUDIO_MODULES: StudioModule[] = [
  ...CHAT_MODULES,
  { slug: "images",         group: "create", demo: "images",    theme: "violet", title: "Images",                  subtitle: "Text-to-Image",               desc: "Génère des visuels percutants à partir d'une simple description.", restricted: false },
  { slug: "videos",         group: "create", demo: "videos", theme: "bleu",   title: "Vidéos",                  subtitle: "Text/Image-to-Video",         desc: "Transforme un texte ou une image en vidéo animée.",                restricted: false },
  { slug: "musiques",       group: "create", demo: "music",        theme: "beige",  title: "Musique",                 subtitle: "Text-to-Music",               desc: "Compose une bande originale unique pour tes créations.",           restricted: false },
  { slug: "talking-head",   group: "create", demo: "talking-head",       theme: "violet", title: "Faire parler une image",  subtitle: "Lip-sync · Talking head",     desc: "Anime un portrait et synchronise ses lèvres sur un discours.",     restricted: false },
  { slug: "text-to-speech", group: "create", demo: "tts",   theme: "bleu",   title: "Du texte à la voix",      subtitle: "Text-to-Speech",              desc: "Convertis un script écrit en voix naturelle, en un clic.",         restricted: false },
  { slug: "doublage",       group: "create", demo: "doublage",    theme: "beige",  title: "Doublage",                subtitle: "Traduction & doublage audio", desc: "Traduis et double automatiquement l'audio de tes vidéos.",         restricted: false },
  { slug: "face-swap",      group: "create", demo: "face-swap",     theme: "violet", title: "Face swap",               subtitle: "Face swap · Avatar",          desc: "Incarne un avatar ou échange un visage sur tes vidéos.",           restricted: true },
];

export function StudioPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdminRole = role === "admin";
  const visibleModules = STUDIO_MODULES.filter((m) => !m.restricted || isAdminRole);
  // Tous les modules passent par Runware sauf le chat Gemini (appel Google direct).
  const budgetExhausted = useAiBudgetExhausted();

  const section = (group: StudioModule["group"], eyebrow: string, title: string) => (
    <section aria-labelledby={`studio-${group}`} className="fade-up">
      <SectionHead id={`studio-${group}`} eyebrow={eyebrow} title={title} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleModules.filter((m) => m.group === group).map(({ slug, demo, logo, theme, title: name, subtitle, desc, restricted: notReady }) => {
          const locked = budgetExhausted && slug !== CHAT_PROVIDERS.gemini.slug;
          return (
            <SymbolCard key={slug} demo={demo} logo={logo} theme={theme} eyebrow={subtitle} title={name} desc={desc}
              cta={notReady ? "Bientôt disponible" : locked ? "Crédits épuisés" : group === "chat" ? "Discuter" : "Créer"}
              disabled={notReady || locked} onClick={() => navigate(`/studio/${slug}`)} />
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-12">
      <div className="fade-up">
        <p className="eyebrow" style={{ color: th.fg3 }}>Pratiquer</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}>Le <GT>Studio</GT></h1>
        <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
          Discute avec ChatGPT, Gemini et Claude, et crée avec de vrais modèles d'IA : image, vidéo, musique, voix et avatar.
        </p>
      </div>

      {budgetExhausted && <AiBudgetExhaustedNotice />}

      {section("chat", "Discuter", "Les grands modèles, côte à côte")}
      {section("create", "Créer", "Image, vidéo, son : à toi de jouer")}
    </div>
  );
}
