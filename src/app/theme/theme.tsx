import { createContext, useContext, useState, type ReactNode } from "react";

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

export type Th = ReturnType<typeof mkTh> & { toggleTheme: () => void };

const ThemeCtx = createContext<Th>({ ...mkTh(true), toggleTheme: () => {} });

export const useTh = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const value: Th = { ...mkTh(isDark), toggleTheme: () => setIsDark((d) => !d) };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
