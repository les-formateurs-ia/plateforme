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

// Dégradé d'accent principal par rôle — student garde le violet historique
// de la marque, formateur/admin ont chacun leur propre couleur d'interface
// (demande explicite : uniquement l'accent principal — boutons/CTA/états
// actifs/navigation — jamais les couleurs à sens fixe : succès en vert,
// alerte en corail, appel vocal en bleu, qui restent inchangées).
const ROLE_GRADIENTS: Record<"student" | "formateur" | "admin", readonly [string, string]> = {
  student:   ["#b58de0", "#dbacf0"],
  formateur: ["#78d5e2", "#6adeb1"],
  admin:     ["#fbc2ad", "#fceccd"],
};

export function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function mkTh(isDark: boolean, role: Role | null = null) {
  const [g1, g2] = ROLE_GRADIENTS[role ?? "student"];
  const g1Rgb = hexToRgb(g1);
  return {
    bg:      isDark ? "#0A0A10" : "#F7F7FA",
    fg:      isDark ? "rgba(255,255,255,0.94)" : "rgba(15,14,20,0.94)",
    fg2:     isDark ? "rgba(255,255,255,0.62)" : "rgba(15,14,20,0.6)",
    fg3:     isDark ? "rgba(255,255,255,0.4)"  : "rgba(15,14,20,0.42)",
    card:    isDark ? "#131319"                : "#FFFFFF",
    cardGrd: isDark ? "#131319"                : "#FFFFFF",
    sidebar:  isDark ? "#0C0C13" : "#FFFFFF",
    sidebarB: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,14,20,0.08)",
    inputBg:  isDark ? "rgba(255,255,255,0.05)" : "rgba(15,14,20,0.03)",
    inputB:   isDark ? "rgba(255,255,255,0.1)"  : "rgba(15,14,20,0.1)",
    sep:      isDark ? "rgba(255,255,255,0.07)" : "rgba(15,14,20,0.08)",
    topbar:   isDark ? "#0A0A10" : "#F7F7FA",
    grid:     "transparent",
    navA:     `rgba(${g1Rgb},${isDark ? 0.16 : 0.1})`,
    navAB:    `rgba(${g1Rgb},${isDark ? 0.16 : 0.1})`,
    navAC:    isDark ? g2 : g1,
    // Dégradé d'accent brut — la plupart des boutons/badges l'utilisent en
    // 135deg, mais quelques barres/graphes ont besoin des teintes seules
    // (angle différent) : grad1/grad2 exposent les teintes, gradPrimary la
    // forme 135deg la plus courante.
    grad1:       g1,
    grad2:       g2,
    gradPrimary: `linear-gradient(135deg,${g1},${g2})`,
    gradShadow:  (alpha: number) => `rgba(${g1Rgb},${alpha})`,
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
  // Même correctif pour <meta name="theme-color"> : la couleur de la barre
  // système/navigateur doit suivre le thème réellement choisi, pas seulement
  // la préférence système figée dans le <meta> statique de index.html.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", value.navAC);
    root.style.setProperty("--accent", value.navAC);
    root.style.setProperty("--secondary-foreground", value.navAC);
    root.style.setProperty("--sidebar-primary", value.navAC);
    root.style.setProperty("--sidebar-accent-foreground", value.navAC);
    root.style.setProperty("--ring", value.gradShadow(0.5));
    root.style.setProperty("--select-highlight", value.gradShadow(0.14));

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
  }, [value.navAC, value.isDark, value.bg, value.fg, value.card, value.sidebar, value.sidebarB, value.inputB, value.inputBg, value.fg3, value.sep]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
