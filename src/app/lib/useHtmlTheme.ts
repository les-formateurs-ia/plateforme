import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import engineSource from "./htmlThemeEngine.js?raw";
import { useTh } from "@/app/theme/theme";
import { buildHtmlTheme, injectHtmlThemeWith, type HtmlSurface, type HtmlThemeConfig } from "./htmlTheme";

// À utiliser partout où du HTML de formateur est rendu dans une iframe :
//   const htmlTheme = useHtmlTheme("page");
//   <iframe srcDoc={htmlTheme.withTheme(html)} style={{ background: htmlTheme.background }} />
// Le srcDoc ne dépend pas du thème (seulement d'un canal propre au composant) :
// changer de thème n'entraîne pas de rechargement — le moteur de l'iframe se
// signale au chargement (__lfiaThemeReady) et reçoit le thème courant, puis
// chaque nouveau thème par postMessage.
export function useHtmlTheme(surface: HtmlSurface = "page") {
  const th = useTh();
  const [channel] = useState(() => Math.random().toString(36).slice(2, 10));
  const config = useMemo(
    () => buildHtmlTheme(th, surface),
    // th est recréé à chaque rendu : on ne dépend que des valeurs utiles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [th.isDark, th.bg, th.card, th.fg, th.fg2, th.fg3, th.sep, th.inputBg, th.inputB, th.grad1, th.grad2, surface],
  );
  const configRef = useRef(config);
  const frames = useRef(new Set<MessageEventSource>());

  // En layout effect : l'écouteur doit exister avant que l'iframe (chargée de
  // façon asynchrone après le commit) n'envoie son premier message.
  useLayoutEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { __lfiaThemeReady?: boolean; channel?: string } | null;
      if (!data || !data.__lfiaThemeReady || data.channel !== channel || !e.source) return;
      frames.current.add(e.source);
      postTheme(e.source, configRef.current, channel);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [channel]);

  useEffect(() => {
    configRef.current = config;
    frames.current.forEach((target) => postTheme(target, config, channel));
  }, [config, channel]);

  const withTheme = useCallback((html: string) => injectHtmlThemeWith(engineSource, html, channel), [channel]);
  return { withTheme, background: config.bg };
}

function postTheme(target: MessageEventSource, config: HtmlThemeConfig, channel: string) {
  try {
    (target as Window).postMessage({ __lfiaTheme: config, channel }, "*");
  } catch {
    // iframe retirée entre-temps
  }
}
