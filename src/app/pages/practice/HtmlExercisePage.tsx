import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Upload, Pencil, Code } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { isStaff } from "@/app/lib/permissions";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { injectPlatformAuth, normalizeSmartQuotes } from "@/app/lib/platformHtml";
import { updateHtmlExerciseContent } from "@/app/lib/htmlExercises";
import {
  listHtmlExerciseAttempts, saveHtmlExerciseAttempt, getExerciseBriefForSession,
  type HtmlExerciseAttempt, type HtmlExerciseBrief,
} from "@/app/lib/htmlExercise";

const RED = "#e5484d";

export function HtmlExercisePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const staff = isStaff(role);
  const { sessionId } = useParams<{ sessionId: string }>();

  const [attempts, setAttempts] = useState<HtmlExerciseAttempt[]>([]);
  const [brief, setBrief] = useState<HtmlExerciseBrief | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [platformAccessToken, setPlatformAccessToken] = useState<string | null>(null);
  const [platformAuthChecked, setPlatformAuthChecked] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [rows, exerciseBrief] = await Promise.all([
          listHtmlExerciseAttempts(user.id, sessionId),
          getExerciseBriefForSession(sessionId),
        ]);
        if (cancelled) return;
        setAttempts(rows);
        setBrief(exerciseBrief);
        if (rows.length > 0) {
          setViewIndex(rows.length - 1);
          setComposing(false);
        } else {
          setViewIndex(0);
          setComposing(!exerciseBrief?.htmlContent);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, sessionId]);

  const current = attempts[viewIndex];
  const renderedHtml = current?.htmlContent ?? brief?.htmlContent ?? null;

  useEffect(() => {
    setIframeLoaded(false);
    setPlatformAuthChecked(false);
  }, [current?.id, brief?.htmlContent, composing]);

  useEffect(() => {
    if (composing || !renderedHtml || platformAuthChecked) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setPlatformAccessToken(data.session?.access_token ?? null);
      setPlatformAuthChecked(true);
    })();
    return () => { cancelled = true; };
  }, [composing, renderedHtml, platformAuthChecked]);

  useEffect(() => {
    if (composing || !renderedHtml || !platformAuthChecked || iframeLoaded) return;
    const timer = setTimeout(() => setIframeLoaded(true), 4000);
    return () => clearTimeout(timer);
  }, [composing, renderedHtml, platformAuthChecked, iframeLoaded]);

  const startEdit = () => {
    if (!staff && brief) return;
    setDraft(renderedHtml ?? "");
    setFileError(null);
    setSaveError(null);
    setComposing(true);
  };

  const cancelEdit = () => {
    setComposing(false);
    setFileError(null);
    setSaveError(null);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    try {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setDraft(normalizeSmartQuotes(value));
      } else {
        setDraft(normalizeSmartQuotes(await file.text()));
      }
    } catch (err) {
      console.error(err);
      setFileError("Impossible de lire ce fichier. Utilise un fichier .txt, .html, .htm ou .docx.");
    }
  };

  const handleSave = async () => {
    if (!user || !sessionId || !draft.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const html = draft.trim();
      if (staff && brief?.exerciseId) {
        await updateHtmlExerciseContent(brief.exerciseId, html);
        setBrief((prev) => prev ? { ...prev, htmlContent: html } : prev);
        setComposing(false);
        setDraft("");
        return;
      }

      const newIndex = attempts.length;
      const attempt = await saveHtmlExerciseAttempt(user.id, sessionId, html);
      setAttempts((prev) => [...prev, attempt]);
      setViewIndex(newIndex);
      setComposing(false);
      setDraft("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Impossible d'enregistrer ce HTML.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice/html")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Exercices pour vous
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>{brief?.name ?? "Exercices pour vous"}</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>{brief?.description || "Exercice HTML interactif."}</p>
      </div>

      {loading && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Chargement...</div></GCard>}
      {!loading && loadError && <GCard><div className="p-6 text-sm" style={{ color: RED }}>{loadError}</div></GCard>}

      {!loading && !loadError && (
        <div className="relative rounded-2xl overflow-hidden" style={{ height: "72vh", background: "#060410", border: `1px solid ${th.sep}` }}>
          {composing ? (
            <div className="absolute inset-0 flex flex-col gap-3 p-5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Colle le HTML ici (Ctrl+V)..."
                className="flex-1 w-full rounded-xl px-4 py-3 text-xs g-input resize-none font-mono"
                style={{ minHeight: 0 }}
              />
              {fileError && <p className="text-xs text-[#fbc2ad]">{fileError}</p>}
              {saveError && <p className="text-xs" style={{ color: RED }}>{saveError}</p>}
              <div className="flex items-center gap-3 flex-wrap gap-y-2">
                <label className="cursor-pointer">
                  <input type="file" accept=".txt,.html,.htm,.docx" className="hidden" onChange={handleFileChange} />
                  <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                    style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)", border: `1px solid ${th.inputB}`, color: th.fg }}>
                    <Upload className="w-3.5 h-3.5" />Charger un fichier
                  </span>
                </label>
                <div className="ml-auto flex items-center gap-2">
                  {(attempts.length > 0 || brief?.htmlContent) && <VBtn sm onClick={cancelEdit} disabled={saving}>Annuler</VBtn>}
                  <ShimBtn sm onClick={handleSave} disabled={saving || !draft.trim()}>{saving ? "Enregistrement..." : "Enregistrer"}</ShimBtn>
                </div>
              </div>
            </div>
          ) : renderedHtml ? (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm bg-white" style={{ color: "#94a3b8" }}>
                  Chargement de la page...
                </div>
              )}
              {platformAuthChecked && (
                <iframe
                  key={`${current?.id ?? brief?.exerciseId ?? "html"}-${renderedHtml.length}`}
                  onLoad={() => setIframeLoaded(true)}
                  srcDoc={platformAccessToken ? injectPlatformAuth(renderedHtml, platformAccessToken) : renderedHtml}
                  sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                  title={`Exercices pour vous - ${brief?.name ?? "HTML"}`}
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                  style={{ opacity: iframeLoaded ? 1 : 0 }}
                />
              )}
              {staff && (
                <button onClick={startEdit} className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg"
                  style={{ background: th.card, border: `1px solid ${th.sep}`, color: th.fg }}>
                  <Pencil className="w-3 h-3" />Modifier
                </button>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
              <Code className="w-6 h-6" style={{ color: th.fg3 }} />
              <p className="text-sm" style={{ color: th.fg3 }}>Pas encore de HTML pour cet exercice.</p>
              {staff && <ShimBtn sm onClick={startEdit}>Inserer HTML</ShimBtn>}
            </div>
          )}
        </div>
      )}

      {!loading && !loadError && !composing && current && attempts.length > 1 && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewIndex((i) => Math.max(0, i - 1))} disabled={viewIndex === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-80"
              style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
              <ChevronLeft className="w-4 h-4" style={{ color: th.fg }} />
            </button>
            <span className="text-xs font-semibold" style={{ color: th.fg3 }}>{viewIndex + 1} / {attempts.length}</span>
            <button onClick={() => setViewIndex((i) => Math.min(attempts.length - 1, i + 1))} disabled={viewIndex === attempts.length - 1}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-80"
              style={{ background: th.inputBg, border: `1px solid ${th.inputB}` }}>
              <ChevronRight className="w-4 h-4" style={{ color: th.fg }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
