// Grille de rubriques de l'espace entreprise — partagée par la vue
// formateur/admin (CompanyDetailPage) et la vue élève (CompanyStudentHome) :
// une tuile par rubrique, un clic ouvre la rubrique en pleine page, la
// flèche (ou le retour du navigateur) ramène à la grille.
import type { CSSProperties, ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { useTh, hexToRgb } from "@/app/theme/theme";
import { HUES, PageHero, runMorph, useMorph, type Hue } from "@/app/components/entreprise/EntrepriseKit";

export { HUES, type Hue } from "@/app/components/entreprise/EntrepriseKit";

// La rubrique ouverte vit dans l'URL (?section=…) : le retour du navigateur
// ramène à la grille et un lien vers une rubrique reste partageable.
// Ouverture / fermeture animées (runMorph) : la tuile de la rubrique et son
// bandeau de titre partagent sectionMorphName(id). La page doit porter
// data-morph-scope sur sa racine (zone dont le reste s'efface au clic).
export function useSectionParam<T extends string>(ids: readonly T[]) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("section");
  const section = ids.find((id) => id === raw) ?? null;
  const go = (next: T | null) => runMorph(sectionMorphName((next ?? section) as string), () => {
    setParams(next ? { section: next } : {});
    // Sur mobile c'est le document qui défile (cf. MainLayout) : la nouvelle
    // vue doit repartir du haut, là où se trouve le titre.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
  return { section, open: (id: T) => go(id), close: () => go(null) };
}

// Nom partagé par une tuile de rubrique et le bandeau de titre de la
// rubrique ouverte (cf. runMorph).
export const sectionMorphName = (id: string) => `sec-${id}`;

export interface TileBadge {
  label: string;
  // "todo" met la tuile en avant (action attendue), "done" en vert, "muted" grisé.
  tone?: "default" | "todo" | "done" | "muted";
}

export function SectionTile({ label, desc, Icon, hue, badge, step, index, disabled, onClick, cta = "Ouvrir", morphName }: {
  label: string; desc: string; Icon: LucideIcon; hue: Hue; badge?: TileBadge; step?: number; index: number; disabled?: boolean; onClick: () => void; cta?: string;
  morphName?: string; // cible d'une transition (cf. runMorph)
}) {
  const th = useTh();
  const [c1, c2] = HUES[hue];
  const rgb = hexToRgb(c1);
  const tone = badge?.tone ?? "default";
  const morph = useMorph<HTMLButtonElement>(morphName);
  // Badges : "todo" à l'encre (action attendue), "done" en vert, le reste
  // en filet neutre — la teinte de la rubrique reste sur la pastille.
  const badgeStyle: CSSProperties =
    tone === "todo" ? { background: th.ink, color: th.onInk, borderColor: th.ink }
    : tone === "done" ? { background: "rgba(106,222,177,0.18)", color: th.isDark ? "#6adeb1" : "#1f7a57", borderColor: "transparent" }
    : tone === "muted" ? { color: th.fg3, borderColor: th.sep }
    : { background: `rgba(${rgb},${th.isDark ? 0.22 : 0.18})`, color: th.fg, borderColor: "transparent" };

  // Carte plate à filet fin (site public) : au survol le filet passe à
  // l'encre et un liseré au dégradé de la rubrique se déploie en bas.
  const vars = {
    "--tile-b0": th.sep,
    "--tile-b1": th.ink,
    animationDelay: `${index * 45}ms`,
    background: th.card,
  } as CSSProperties;

  return (
    <button ref={morph.ref} data-morph={morphName} data-morph-fade="" type="button" onClick={onClick} disabled={disabled} style={vars}
      className={`${morph.incoming ? "" : "fade-up "}group relative overflow-hidden rounded-[10px] text-left p-5 min-h-[190px] flex flex-col border transition-colors duration-200 [border-color:var(--tile-b0)] hover-fine:[border-color:var(--tile-b1)] focus-visible:[border-color:var(--tile-b1)] disabled:opacity-55 disabled:pointer-events-none`}>
      <div className="relative flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
          <Icon className="w-5 h-5" style={{ color: "#000" }} strokeWidth={2} />
        </div>
        {badge && <span className="rounded-[2px] border px-2 py-0.5 text-xs font-bold whitespace-nowrap" style={badgeStyle}>{badge.label}</span>}
      </div>

      <div className="relative mt-auto pt-6">
        {step !== undefined && <div className="eyebrow mb-1.5" style={{ color: th.fg3 }}>Étape {step}</div>}
        <h3 className="text-xl font-black leading-tight" style={{ color: th.fg }}>{label}</h3>
        <p className="text-sm mt-1.5 leading-snug" style={{ color: th.fg2 }}>{desc}</p>
        <div className="flex items-center gap-1.5 mt-4 text-sm font-bold" style={{ color: th.fg }}>
          <span className="ink-link">{cta}</span><ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg,${c1},${c2})` }} />
    </button>
  );
}

export function SectionGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

// En-tête d'une rubrique ouverte : retour + pastille colorée + titre.
export function SectionHeader({ backLabel, onBack, label, desc, Icon, hue, actions, morphName }: {
  backLabel: string; onBack: () => void; label: string; desc: string; Icon: LucideIcon; hue: Hue; actions?: ReactNode; morphName?: string;
}) {
  return <PageHero back={{ label: backLabel, onClick: onBack }} title={label} desc={desc} Icon={Icon} hue={hue} actions={actions} morphName={morphName} />;
}
