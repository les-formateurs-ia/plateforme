import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Image as ImageIcon, Video, Music, Speech, Volume2, Languages, UserRoundCog, Sparkles, type LucideIcon } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { VBtn } from "@/app/components/common/Buttons";

const TOOL_INFO: Record<string, { Icon: LucideIcon; title: string; subtitle: string }> = {
  "images":         { Icon: ImageIcon,    title: "Créer vos images",                     subtitle: "Text-to-Image" },
  "videos":         { Icon: Video,        title: "Imaginez vos vidéos",                  subtitle: "Text/Image-to-Video" },
  "musiques":       { Icon: Music,        title: "Concevez vos propres musiques",        subtitle: "Text-to-Music" },
  "talking-head":   { Icon: Speech,       title: "Faites parler vos images",             subtitle: "Lip-sync / Talking Head" },
  "text-to-speech": { Icon: Volume2,      title: "Du texte à l'audio",                   subtitle: "Text-to-Speech" },
  "doublage":       { Icon: Languages,    title: "Parlez n'importe quelle langue",       subtitle: "Traduction & Doublage audio" },
  "face-swap":      { Icon: UserRoundCog, title: "Prenez l'apparence de qui vous voulez", subtitle: "Face Swap / Avatar" },
};

// Placeholder commun aux 5 modules du Studio pas encore branchés côté back
// (musiques, talking-head, text-to-speech, doublage, face-swap) — images et
// vidéos ont leurs propres pages dédiées, alimentées par Runware.
export function StudioToolPage() {
  const th = useTh();
  const navigate = useNavigate();
  const { tool } = useParams<{ tool: string }>();
  const info = (tool && TOOL_INFO[tool]) || { Icon: Sparkles, title: "Module Studio", subtitle: "" };
  const { Icon, title, subtitle } = info;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <button onClick={() => navigate("/studio")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
        <ArrowLeft className="w-4 h-4" />Le Studio
      </button>

      <GCard>
        <div className="p-8 sm:p-12 flex flex-col items-center text-center gap-4" style={{ minHeight: 320 }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: th.gradShadow(0.14), border: `1px solid ${th.gradShadow(0.3)}` }}>
            <Icon className="w-7 h-7" style={{ color: th.navAC }} />
          </div>
          <div>
            {subtitle && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: th.gradShadow(0.1), color: th.navAC, border: `1px solid ${th.gradShadow(0.25)}` }}>{subtitle}</span>}
            <h2 className="text-xl font-black mt-3" style={{ color: th.fg }}>{title}</h2>
            <p className="text-sm mt-2 max-w-md" style={{ color: th.fg3 }}>Ce module arrive bientôt dans Le Studio — l'intégration du modèle d'IA est en cours de branchement.</p>
          </div>
          <VBtn onClick={() => navigate("/studio")}>Retour au Studio</VBtn>
        </div>
      </GCard>
    </div>
  );
}
