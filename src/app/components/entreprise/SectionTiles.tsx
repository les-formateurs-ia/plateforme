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
  const badgeStyle: CSSProperties =
    tone === "todo" ? { background: `linear-gradient(135deg,${c1},${c2})`, color: "#fff" }
    : tone === "done" ? { background: "rgba(106,222,177,0.15)", color: "#3fbf8f" }
    : tone === "muted" ? { background: th.inputBg, color: th.fg3 }
    : { background: `rgba(${rgb},${th.isDark ? 0.16 : 0.12})`, color: th.isDark ? c2 : c1 };

  const vars = {
    "--tile-b0": th.sep,
    "--tile-b1": `rgba(${rgb},0.55)`,
    "--tile-s0": th.isDark ? "0 4px 18px rgba(0,0,0,0.28)" : "0 4px 18px rgba(15,14,20,0.06)",
    "--tile-s1": `0 18px 40px rgba(${rgb},${th.isDark ? 0.22 : 0.28})`,
    animationDelay: `${index * 45}ms`,
    background: th.card,
  } as CSSProperties;

  return (
    <button ref={morph.ref} data-morph={morphName} data-morph-fade="" type="button" onClick={onClick} disabled={disabled} style={vars}
      className={`${morph.incoming ? "" : "fade-up "}group relative overflow-hidden rounded-3xl text-left p-5 min-h-[190px] flex flex-col border transition-all duration-300 [border-color:var(--tile-b0)] [box-shadow:var(--tile-s0)] hover:-translate-y-1 hover:[border-color:var(--tile-b1)] hover:[box-shadow:var(--tile-s1)] focus-visible:outline-none focus-visible:[border-color:var(--tile-b1)] disabled:opacity-55 disabled:pointer-events-none`}>
      {/* Halo coloré + icône en filigrane */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-40 transition-opacity duration-300 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, rgba(${rgb},${th.isDark ? 0.45 : 0.35}), transparent 70%)` }} />
      <Icon className="pointer-events-none absolute -bottom-7 -right-5 w-36 h-36 transition-transform duration-500 -rotate-12 group-hover:rotate-0 group-hover:scale-110"
        style={{ color: c1, opacity: th.isDark ? 0.08 : 0.1 }} strokeWidth={1.4} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
          style={{ background: `linear-gradient(135deg,${c1},${c2})`, boxShadow: `0 8px 20px rgba(${rgb},0.35)` }}>
          <Icon className="w-5 h-5" style={{ color: "#fff" }} strokeWidth={2.2} />
        </div>
        {badge && <span className="rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap" style={badgeStyle}>{badge.label}</span>}
      </div>

      <div className="relative mt-auto pt-5">
        {step !== undefined && <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: th.isDark ? c2 : c1 }}>Étape {step}</div>}
        <h3 className="text-lg font-black leading-tight" style={{ color: th.fg, fontFamily: "'Funnel Display',sans-serif" }}>{label}</h3>
        <p className="text-sm mt-1.5 leading-snug" style={{ color: th.fg3 }}>{desc}</p>
        <div className="flex items-center gap-1.5 mt-3 text-sm font-bold" style={{ color: th.isDark ? c2 : c1 }}>
          {cta}<ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        </div>
      </div>

      {/* Liseré bas qui se déploie au survol */}
      <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
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
