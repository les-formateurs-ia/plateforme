import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth, type ThemeMode } from "@/app/state/auth-context";

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

function mkTh(isDark: boolean) {
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
    navA:     isDark ? "rgba(181,141,224,0.16)" : "rgba(181,141,224,0.1)",
    navAB:   isDark ? "rgba(181,141,224,0.16)" : "rgba(181,141,224,0.1)",
    navAC:   isDark ? "#dbacf0"                : "#b58de0",
    orbA:    "transparent",
    orbB:    "transparent",
    isDark,
  };
}

export type Th = ReturnType<typeof mkTh> & { mode: ThemeMode; setThemeMode: (mode: ThemeMode) => void };

const ThemeCtx = createContext<Th>({ ...mkTh(true), mode: "system", setThemeMode: () => {} });

export const useTh = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { themeMode: dbThemeMode, setThemeMode: persistThemeMode } = useAuth();
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
  const value: Th = { ...mkTh(isDark), mode, setThemeMode };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
