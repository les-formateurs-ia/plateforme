import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Code2, SearchX } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { HueProvider, PageHero, EmptyState, Loading } from "@/app/components/entreprise/EntrepriseKit";
import { supabase } from "@/app/lib/supabase/client";
import { injectPlatformAuth, injectAutoResize } from "@/app/lib/platformHtml";
import { useHtmlTheme } from "@/app/lib/useHtmlTheme";
import { getCompanyHtmlExercise, type CompanyHtmlExerciseRow } from "@/app/lib/entreprise/companyHtmlExercises";

export function CompanyHtmlExercisePage() {
  const th = useTh();
  const htmlTheme = useHtmlTheme("page");
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId: string }>();

  const [exercise, setExercise] = useState<CompanyHtmlExerciseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  // Hauteur réelle du contenu, remontée par l'iframe (injectAutoResize, même
  // mécanique que le cours d'une leçon CPF) : l'exercice s'affiche en entier,
  // seul le défilement de la page reste actif.
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(0);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const height = (e.data as { __autoResizeHeight?: number } | null)?.__autoResizeHeight;
      if (typeof height !== "number" || !Number.isFinite(height) || height <= 0) return;
      setIframeHeight(Math.ceil(height));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [ex, session] = await Promise.all([getCompanyHtmlExercise(exerciseId), supabase.auth.getSession()]);
      if (cancelled) return;
      setExercise(ex);
      setAccessToken(session.data.session?.access_token ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [exerciseId]);

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"));

  return (
    <HueProvider hue="pink">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        <PageHero back={{ label: "Retour", onClick: goBack }} eyebrow="Exercice" title={exercise?.name ?? "Exercice HTML"}
          desc={exercise?.description ?? undefined} Icon={Code2} />

        {loading && <Loading />}

        {!loading && !exercise && <EmptyState Icon={SearchX} title="Exercice introuvable" hint="Il a peut-être été retiré par ton formateur." />}

        {!loading && exercise && (
          <div className="fade-up relative rounded-3xl overflow-hidden" style={{ minHeight: 320, background: htmlTheme.background, border: `1px solid ${th.sep}`, boxShadow: th.isDark ? "0 4px 18px rgba(0,0,0,0.28)" : "0 4px 18px rgba(15,14,20,0.06)" }}>
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10" style={{ background: htmlTheme.background }}><div className="h-full flex items-center justify-center"><Loading label="Chargement de l'exercice…" /></div></div>
            )}
            <iframe
              ref={iframeRef}
              key={exercise.id}
              onLoad={() => setIframeLoaded(true)}
              srcDoc={injectAutoResize(noHorizontalScroll(accessToken ? injectPlatformAuth(htmlTheme.withTheme(exercise.htmlContent), accessToken) : htmlTheme.withTheme(exercise.htmlContent)))}
              sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-downloads"
              // allow-downloads : sans lui, Chrome bloque tout bouton de téléchargement
              // de l'exercice ("Not allowed to download due to sandboxing").
              scrolling="no"
              title={exercise.name}
              className="block w-full border-0"
              style={{ height: iframeHeight || 600, opacity: iframeLoaded ? 1 : 0, background: htmlTheme.background }}
            />
          </div>
        )}
      </div>
    </HueProvider>
  );
}

// Le contenu ne doit jamais déborder en largeur : on coupe le défilement
// horizontal et on borne les médias/tableaux à la largeur disponible.
function noHorizontalScroll(html: string): string {
  const style = `<style data-platform-injected>html,body{overflow-x:hidden!important;max-width:100%!important;}img,video,iframe,canvas,svg,table,pre{max-width:100%!important;}pre{white-space:pre-wrap;}</style>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${style}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}\n${style}`);
  return style + html;
}
