import type { ReactNode } from "react";
import { useTh } from "@/app/theme/theme";
import { Background } from "@/app/components/common/Background";
import { Logo } from "@/app/components/common/Logo";

// Mise en page des écrans hors plateforme (connexion, inscription, mot de
// passe, accueil entreprise, choix d'espace), dans la direction artistique
// du site public : à gauche un panneau noir qui porte la marque — le nom en
// très grand au dégradé iris, comme la signature du pied de page du site —,
// à droite le formulaire sur fond blanc, sans carte. Sur mobile, le panneau
// disparaît et le logo passe au-dessus du formulaire.
export function AuthShell({ children, width = 440, aside }: {
  children: ReactNode;
  width?: number;
  /** Texte du panneau de marque (bureau). */
  aside?: { eyebrow?: string; title: ReactNode; lead?: ReactNode };
}) {
  const th = useTh();
  const panel = aside ?? {
    eyebrow: "Plateforme de formation",
    title: "Se former à l'IA, à son rythme, jusqu'à la certification.",
    lead: "Des leçons adaptées à chaque métier, des exercices pratiques, un agent IA disponible à toute heure et des formateurs dédiés.",
  };
  return (
    <div className="min-h-dvh grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" style={{ background: th.bg, fontFamily: "'Funnel Display',sans-serif" }}>
      <Background />
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-black text-white px-12 xl:px-16 py-12" style={{ borderRight: th.isDark ? `1px solid ${th.sep}` : undefined }}>
        <div className="text-white"><AuthLogoWhite /></div>
        <div className="max-w-[30rem] py-16">
          {panel.eyebrow && <p className="eyebrow text-white/55">{panel.eyebrow}</p>}
          <p className="mt-5 text-[2.1rem] xl:text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.035em]" style={{ textWrap: "balance" }}>{panel.title}</p>
          {panel.lead && <p className="mt-5 text-base leading-relaxed text-white/65">{panel.lead}</p>}
        </div>
        <BrandSignature />
      </aside>
      <main className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="relative z-10 w-full fade-up" style={{ maxWidth: width }}>
          <div className="lg:hidden flex justify-center mb-10"><Logo h={28} /></div>
          {children}
        </div>
      </main>
    </div>
  );
}

// Signature de la marque : le nom au dégradé de la charte, sur toute la
// largeur du panneau. En SVG (remplissage dégradé) plutôt qu'en
// background-clip:text, que Chrome peut cesser d'appliquer à certains zooms
// (cf. GT.tsx).
function BrandSignature() {
  return (
    <svg aria-hidden viewBox="0 0 1000 132" className="block w-full h-auto" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="auth-iris" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#b58de0" />
          <stop offset="0.3" stopColor="#dbacf0" />
          <stop offset="0.6" stopColor="#78d5e2" />
          <stop offset="0.75" stopColor="#6adeb1" />
          <stop offset="1" stopColor="#fbc2ad" />
        </linearGradient>
      </defs>
      <text x="0" y="104" textLength="1000" lengthAdjust="spacingAndGlyphs" fill="url(#auth-iris)"
        style={{ fontFamily: "'Funnel Display',sans-serif", fontWeight: 800, fontSize: 132, letterSpacing: "-0.045em" }}>
        Les Formateurs IA
      </text>
    </svg>
  );
}

// Le logotype en blanc sur le panneau noir, quel que soit le thème.
function AuthLogoWhite() {
  return <div className="[&_span]:!text-white"><Logo h={28} /></div>;
}

// Champ libellé, partagé par les formulaires d'authentification.
export function AuthField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const th = useTh();
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-2" style={{ color: th.fg }}>
        {label}{hint && <span className="font-normal" style={{ color: th.fg3 }}> {hint}</span>}
      </span>
      {children}
    </label>
  );
}
