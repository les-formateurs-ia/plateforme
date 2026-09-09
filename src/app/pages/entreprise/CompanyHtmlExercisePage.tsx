import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { supabase } from "@/app/lib/supabase/client";
import { injectPlatformAuth } from "@/app/lib/platformHtml";
import { getCompanyHtmlExercise, type CompanyHtmlExerciseRow } from "@/app/lib/entreprise/companyHtmlExercises";

export function CompanyHtmlExercisePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { exerciseId } = useParams<{ exerciseId: string }>();

  const [exercise, setExercise] = useState<CompanyHtmlExerciseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

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

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Retour
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{exercise?.name ?? "Exercice HTML"}</GT></h2>
        {exercise?.description && <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>{exercise.description}</p>}
      </div>

      {loading && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Chargement...</div></GCard>}

      {!loading && !exercise && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Exercice introuvable.</div></GCard>}

      {!loading && exercise && (
        <div className="relative rounded-2xl overflow-hidden" style={{ height: "72vh", background: "#060410", border: `1px solid ${th.sep}` }}>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm bg-white" style={{ color: "#94a3b8" }}>Chargement de la page...</div>
          )}
          <iframe
            key={exercise.id}
            onLoad={() => setIframeLoaded(true)}
            srcDoc={accessToken ? injectPlatformAuth(exercise.htmlContent, accessToken) : exercise.htmlContent}
            sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
            title={exercise.name}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            style={{ opacity: iframeLoaded ? 1 : 0 }}
          />
        </div>
      )}
    </div>
  );
}
