import { createContext, useContext, useState, type ReactNode } from "react";

function mkTh(isDark: boolean) {
  return {
    bg:      isDark ? "#08060F"                 : "#F8F6FF",
    fg:      isDark ? "rgba(242,235,249,0.9)"   : "rgba(26,13,46,0.9)",
    fg2:     isDark ? "rgba(242,235,249,0.55)"  : "rgba(26,13,46,0.55)",
    fg3:     isDark ? "rgba(242,235,249,0.3)"   : "rgba(26,13,46,0.32)",
    card:    isDark ? "rgba(9,6,17,0.9)"        : "rgba(255,255,255,0.95)",
    cardGrd: isDark
      ? "linear-gradient(135deg,rgba(221,174,234,0.15) 0%,rgba(255,255,255,0.05) 50%,rgba(221,174,234,0.08) 100%)"
      : "linear-gradient(135deg,rgba(155,93,229,0.18) 0%,rgba(255,255,255,0.6) 50%,rgba(155,93,229,0.1) 100%)",
    sidebar:  isDark ? "rgba(10,6,18,0.8)"      : "rgba(255,255,255,0.95)",
    sidebarB: isDark ? "rgba(221,174,234,0.08)" : "rgba(155,93,229,0.1)",
    inputBg:  isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    inputB:   isDark ? "rgba(221,174,234,0.14)" : "rgba(155,93,229,0.22)",
    sep:      isDark ? "rgba(255,255,255,0.05)" : "rgba(26,13,46,0.07)",
    topbar:   isDark ? "rgba(8,6,15,0.65)"      : "rgba(248,246,255,0.9)",
    grid:     isDark ? "rgba(221,174,234,0.025)": "rgba(155,93,229,0.05)",
    navA:     isDark
      ? "linear-gradient(135deg,rgba(221,174,234,0.14),rgba(155,93,229,0.08))"
      : "linear-gradient(135deg,rgba(155,93,229,0.1),rgba(221,174,234,0.06))",
    navAB:   isDark ? "rgba(221,174,234,0.3)"  : "rgba(155,93,229,0.3)",
    navAC:   isDark ? "#DDAEEA"                : "#9B5DE5",
    orbA:    isDark ? "rgba(155,93,229,0.25)"  : "rgba(155,93,229,0.1)",
    orbB:    isDark ? "rgba(221,174,234,0.18)" : "rgba(221,174,234,0.07)",
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
