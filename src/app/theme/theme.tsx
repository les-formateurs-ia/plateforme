import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useAuth, type ThemeMode, type Role } from "@/app/state/auth-context";

function getSystemPrefersDark() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem("themeMode");
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

// Direction artistique alignée sur le site public (repo site/, charte
// graphique Les Formateurs IA) : noir sur blanc, filets fins, boutons noirs
// à angles nets ; les dégradés de la charte sont réservés aux moments forts
// (surligneur des titres, survol des boutons, progression).
//
// Chaque rôle garde sa teinte de la charte, mais seulement comme repère
// discret (pastille, filet de l'onglet actif) pour savoir dans quel espace on
// est — jamais sur les boutons ni les états actifs, qui restent à l'encre.
// Les couleurs à sens fixe (succès en vert, alerte en corail, appel vocal en
// bleu) restent inchangées.
const ROLE_GRADIENTS: Record<"student" | "formateur" | "admin", readonly [string, string]> = {
  student:   ["#b58de0", "#dbacf0"],
  formateur: ["#78d5e2", "#6adeb1"],
  admin:     ["#fbc2ad", "#fceccd"],
};

// Les trois dégradés de la charte d'un seul geste (--grad-iris du site).
export const IRIS = "linear-gradient(100deg,#b58de0,#dbacf0 30%,#78d5e2 60%,#6adeb1 75%,#fbc2ad)";

export function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function mkTh(isDark: boolean, role: Role | null = null) {
  const [g1, g2] = ROLE_GRADIENTS[role ?? "student"];
  // Encre : noir sur fond blanc, blanc sur fond noir (le pied de page du site).
  const ink = isDark ? "#FFFFFF" : "#000000";
  const inkRgb = isDark ? "255,255,255" : "0,0,0";
  return {
    bg:      isDark ? "#000000" : "#FFFFFF",
    fg:      ink,
    fg2:     isDark ? "rgba(255,255,255,0.68)" : "#4D4D4D",
    fg3:     isDark ? "rgba(255,255,255,0.52)" : "#6E6E6E",
    card:    isDark ? "#0F0F0F"                : "#FFFFFF",
    cardGrd: isDark ? "#0F0F0F"                : "#FFFFFF",
    sidebar:  isDark ? "#000000" : "#FFFFFF",
    sidebarB: isDark ? "rgba(255,255,255,0.12)" : "#E6E6E6",
    inputBg:  isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
    inputB:   isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)",
    sep:      isDark ? "rgba(255,255,255,0.12)" : "#E6E6E6",
    topbar:   isDark ? "#000000" : "#FFFFFF",
    grid:     "transparent",
    navA:     `rgba(${inkRgb},${isDark ? 0.08 : 0.04})`,
    navAB:    `rgba(${inkRgb},${isDark ? 0.08 : 0.04})`,
    navAC:    ink,
    // Remplissage des actions principales (boutons, états actifs) et son
    // texte : l'encre, comme les boutons du site.
    ink,
    onInk:   isDark ? "#000000" : "#FFFFFF",
    // Repère du rôle courant (pastille, filet actif) et dégradé de la charte.
    role:     g1,
    roleGrad: `linear-gradient(135deg,${g1},${g2})`,
    iris:     IRIS,
    // Historique : la plupart des fonds d'action s'écrivaient
    // linear-gradient(135deg, grad1, grad2) — les deux teintes valent
    // désormais l'encre, ce qui donne un aplat noir (blanc en sombre).
    grad1:       ink,
    grad2:       ink,
    gradPrimary: ink,
    // Teintes d'état (sélection, survol, bordure active) : l'encre en
    // transparence, plus la couleur du rôle.
    gradShadow:  (alpha: number) => `rgba(${inkRgb},${alpha})`,
    orbA:    "transparent",
    orbB:    "transparent",
    isDark,
  };
}

export type Th = ReturnType<typeof mkTh> & { mode: ThemeMode; setThemeMode: (mode: ThemeMode) => void };

const ThemeCtx = createContext<Th>({ ...mkTh(true), mode: "system", setThemeMode: () => {} });

export const useTh = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { themeMode: dbThemeMode, setThemeMode: persistThemeMode, role } = useAuth();
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
  // Une fois la préférence chargée depuis le profil (après connexion), elle
  // fait foi et écrase la valeur locale (ex: connexion depuis un autre
  // appareil) — mais une seule fois par session, pour ne pas revenir dessus
  // à chaque re-render une fois que l'utilisateur change de thème lui-même.
  const appliedDbMode = useRef(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemPrefersDark(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (dbThemeMode) {
      if (!appliedDbMode.current) {
        setMode(dbThemeMode);
        appliedDbMode.current = true;
      }
    } else {
      appliedDbMode.current = false;
    }
  }, [dbThemeMode]);

  const setThemeMode = (next: ThemeMode) => {
    setMode(next);
    try { localStorage.setItem("themeMode", next); } catch { /* ignore */ }
    void persistThemeMode(next);
  };

  const isDark = mode === "system" ? systemPrefersDark : mode === "dark";
  const value: Th = { ...mkTh(isDark, role), mode, setThemeMode };

  // Les composants shadcn/Radix (Select, Popover, Dialog) lisent leurs
  // couleurs via des variables CSS (--primary, --ring, …) posées dans
  // theme.css, pas via th.* — on les met à jour ici pour qu'ils suivent
  // eux aussi l'accent du rôle courant.
  //
  // --background/--foreground/--card/... suivent le même principe, ajouté le
  // 2026-09-21 : theme.css ne pose qu'un thème clair figé en variables CSS
  // statiques (la classe .dark n'est jamais posée sur le document par cette
  // app), donc <body> (qui applique bg-background en CSS pure) restait en
  // décalage avec le thème sombre choisi via th.* — visible sur mobile comme
  // des bandes sombres/claires incohérentes autour de l'app le temps que
  // MainLayout (qui, lui, utilise th.bg en style inline) couvre l'écran.
  // Les meta theme-color suivent aussi le thème choisi. Leurs media queries
  // dans index.html les limitent au bureau : sur mobile, on laisse le
  // navigateur gérer la teinte et la transparence de ses propres barres.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", value.ink);
    root.style.setProperty("--primary-foreground", value.onInk);
    root.style.setProperty("--accent", value.navA);
    root.style.setProperty("--accent-foreground", value.fg);
    root.style.setProperty("--secondary", value.navA);
    root.style.setProperty("--secondary-foreground", value.fg);
    root.style.setProperty("--sidebar-primary", value.ink);
    root.style.setProperty("--sidebar-primary-foreground", value.onInk);
    root.style.setProperty("--sidebar-accent", value.navA);
    root.style.setProperty("--sidebar-accent-foreground", value.fg);
    root.style.setProperty("--ring", value.ink);
    root.style.setProperty("--select-highlight", value.gradShadow(value.isDark ? 0.1 : 0.05));
    root.style.setProperty("--role", value.role);
    root.style.setProperty("--ink", value.ink);
    root.style.setProperty("--on-ink", value.onInk);
    root.style.setProperty("--switch-background", value.gradShadow(0.2));
    root.dataset.theme = value.isDark ? "dark" : "light";

    root.style.setProperty("--background", value.bg);
    root.style.setProperty("--foreground", value.fg);
    root.style.setProperty("--card", value.card);
    root.style.setProperty("--card-foreground", value.fg);
    root.style.setProperty("--popover", value.card);
    root.style.setProperty("--popover-foreground", value.fg);
    root.style.setProperty("--border", value.sep);
    root.style.setProperty("--input", value.inputB);
    root.style.setProperty("--input-background", value.inputBg);
    root.style.setProperty("--muted", value.inputBg);
    root.style.setProperty("--muted-foreground", value.fg3);
    root.style.setProperty("--sidebar", value.sidebar);
    root.style.setProperty("--sidebar-foreground", value.fg);
    root.style.setProperty("--sidebar-border", value.sidebarB);

    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", value.bg));
  }, [value.navAC, value.role, value.isDark, value.bg, value.fg, value.card, value.sidebar, value.sidebarB, value.inputB, value.inputBg, value.fg3, value.sep]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
