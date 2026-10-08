import { useNavigate } from "react-router";
import { Zap, Image as ImageIcon, Swords, Target, ScanEye, Code2, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GT } from "@/app/components/common/GT";
import { SymbolCard } from "@/app/components/common/SymbolCard";
import { useAuth } from "@/app/state/auth-context";

const COUNT_WORDS = ["Aucun", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"];

export function PracticePage2() {
  const th = useTh();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdminRole = role === "admin";
  // `restricted` : même règle que les modules non prêts du Studio (cf. StudioPage) —
  // visibles en aperçu (grisé, non cliquable) pour l'admin seulement, masqués
  // pour le formateur et l'élève. Les routes sont aussi réservées à l'admin (App.tsx).
  const BLOCKS: { Icon: LucideIcon; theme: "violet" | "bleu" | "beige"; title: string; desc: string; tag: string; path: string; restricted: boolean }[] = [
    { Icon: Zap, theme: "violet", title: "Exercices prompts", desc: "Écris un prompt professionnel : l'IA le note sur 20 et t'explique quoi corriger. Pas de QCM, de la pratique.", tag: "20 exercices", path: "/practice/prompts", restricted: false },
    { Icon: ImageIcon, theme: "bleu", title: "Images & vidéos", desc: "Rédige des prompts pour les générateurs d'image et de vidéo, puis compare avant et après correction.", tag: "IA · Image & vidéo", path: "/practice/media", restricted: false },
    { Icon: Swords, theme: "beige", title: "Battle Ground", desc: "Envoie un même prompt à plusieurs IA et compare leurs réponses côte à côte.", tag: "Comparaison de modèles", path: "/practice/battle-ground", restricted: false },
    { Icon: Target, theme: "violet", title: "Rétro-ingénierie", desc: "Une image est générée : à toi de retrouver le prompt qui l'a créée.", tag: "Reverse prompting", path: "/practice/reverse-prompting", restricted: false },
    { Icon: ScanEye, theme: "bleu", title: "Détection Image IA", desc: "Réelle ou générée par IA ? Devine, puis découvre l'explication derrière chaque image.", tag: "Vrai ou faux", path: "/practice/ai-detection", restricted: true },
    { Icon: Code2, theme: "beige", title: "Exercices pour vous", desc: "Bac à sable HTML/JS : colle du code et vois-le tourner en direct, comme le Playground d'une leçon.", tag: "Playground", path: "/practice/html", restricted: true },
  ];
  const visibleBlocks = BLOCKS.filter((b) => !b.restricted || isAdminRole);
  const availableCount = visibleBlocks.filter((b) => !b.restricted).length;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-10">
      <div className="fade-up">
        <p className="eyebrow" style={{ color: th.fg3 }}>Pratiquer</p>
        <h1 className="mt-2 text-[2rem] sm:text-[2.6rem] leading-[1.02] font-black" style={{ color: th.fg }}><GT>Exercices</GT></h1>
        <p className="text-[15px] sm:text-base mt-3 max-w-2xl leading-relaxed" style={{ color: th.fg2 }}>
          {COUNT_WORDS[availableCount] ?? availableCount} ateliers pour affûter ton regard sur l'IA générative. Chaque essai est corrigé par l'IA, à refaire autant que tu veux.
        </p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 fade-up ${visibleBlocks.length % 3 === 0 ? "xl:grid-cols-3" : ""}`} style={{ animationDelay: "80ms" }}>
        {visibleBlocks.map(({ Icon, theme, title, desc, tag, path, restricted }) => (
          <SymbolCard key={title} Icon={Icon} theme={theme} eyebrow={tag} title={title} desc={desc}
            cta={restricted ? "Bientôt disponible" : "Commencer"} disabled={restricted} onClick={() => navigate(path)} />
        ))}
      </div>
    </div>
  );
}
