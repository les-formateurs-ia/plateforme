import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, AlertCircle, Compass, Lightbulb, Copy, Check, ArrowRight } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { ShimBtn, VBtn } from "@/app/components/common/Buttons";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/app/components/ui/sheet";
import { RatingBar, Pill, LEVEL_COLORS } from "@/app/components/aiModels/ModelCard";
import type { AiModel } from "@/app/data/aiModels";

export function ModelDetailSheet({ model, open, onOpenChange }: { model: AiModel | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const th = useTh();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    if (!model) return;
    try {
      await navigator.clipboard.writeText(model.promptIdea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard indisponible, on ignore */ }
  };

  const tryInStudio = () => {
    if (!model?.studioTarget) return;
    onOpenChange(false);
    navigate(`/studio/${model.studioTarget.path}?model=${model.studioTarget.modelId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl gap-0 p-0" style={{ background: th.bg, borderColor: th.sep }}>
        {model && (
          <div className="flex flex-col h-full overflow-y-auto">
            <SheetHeader className="p-5 sm:p-6 pb-4 text-left" style={{ borderBottom: `1px solid ${th.sep}` }}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-sm font-black text-white" style={{ background: `linear-gradient(135deg,${th.grad1},${th.grad2})` }}>
                  {model.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-lg font-black" style={{ color: th.fg }}>{model.name}</SheetTitle>
                  <SheetDescription style={{ color: th.fg3 }}>{model.provider} · Sortie {model.releaseDate}</SheetDescription>
                  <div className="text-sm font-medium mt-1" style={{ color: th.navAC }}>{model.tagline}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Pill>{model.priceBadge}</Pill>
                <Pill color={LEVEL_COLORS[model.levelBadge]}>{model.levelBadge}</Pill>
              </div>
            </SheetHeader>

            <div className="flex-1 p-5 sm:p-6 space-y-6">
              <div className="flex items-center gap-5">
                <RatingBar label="Raisonnement" value={model.reasoning} />
                <RatingBar label="Accès" value={model.access} />
                <RatingBar label="Vitesse" value={model.speed} />
              </div>

              <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>{model.description}</p>

              <div>
                <h3 className="text-sm font-bold mb-2.5" style={{ color: th.fg }}>Points forts</h3>
                <ul className="space-y-2">
                  {model.strengths.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm" style={{ color: th.fg2 }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2.5" style={{ color: th.fg }}>Points faibles</h3>
                <ul className="space-y-2">
                  {model.weaknesses.map((w) => (
                    <li key={w} className="flex items-start gap-2 text-sm" style={{ color: th.fg2 }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#fb7185" }} />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-4" style={{ background: th.gradShadow(0.08), border: `1px solid ${th.gradShadow(0.2)}` }}>
                <h3 className="text-sm font-bold mb-1.5 flex items-center gap-1.5" style={{ color: th.fg }}>
                  <Compass className="w-4 h-4" style={{ color: th.navAC }} />Quand choisir ce modèle
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: th.fg2 }}>{model.whenToChoose}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2.5 flex items-center gap-1.5" style={{ color: th.fg }}>
                  <Lightbulb className="w-4 h-4" style={{ color: th.navAC }} />Idée de prompt pour ce modèle
                </h3>
                <div className="rounded-xl p-3.5 flex items-start gap-2" style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
                  <p className="text-sm flex-1 italic" style={{ color: th.fg2 }}>« {model.promptIdea} »</p>
                  <button onClick={copyPrompt} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70" style={{ color: th.fg3 }} title="Copier le prompt">
                    {copied ? <Check className="w-3.5 h-3.5" style={{ color: "#22c55e" }} /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 pt-4" style={{ borderTop: `1px solid ${th.sep}` }}>
              {model.studioTarget ? (
                <ShimBtn full onClick={tryInStudio}>
                  <span className="inline-flex items-center gap-1.5 justify-center w-full">Essayer dans le studio<ArrowRight className="w-4 h-4" /></span>
                </ShimBtn>
              ) : (
                <VBtn full disabled>Non disponible en studio</VBtn>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
