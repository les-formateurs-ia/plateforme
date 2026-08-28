import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Upload, Pencil, Code } from "lucide-react";
import { useTh } from "@/app/theme/theme";
import { useAuth } from "@/app/state/auth-context";
import { supabase } from "@/app/lib/supabase/client";
import { GCard } from "@/app/components/common/GCard";
import { GT } from "@/app/components/common/GT";
import { VBtn, ShimBtn } from "@/app/components/common/Buttons";
import { injectPlatformAuth, normalizeSmartQuotes } from "@/app/lib/platformHtml";
import {
  listHtmlExerciseAttempts, saveHtmlExerciseAttempt,
  type HtmlExerciseAttempt,
} from "@/app/lib/htmlExercise";

const RED = "#e5484d";

export function HtmlExercisePage() {
  const th = useTh();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [attempts, setAttempts] = useState<HtmlExerciseAttempt[]>([]);
  const [viewIndex, setViewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [platformAccessToken, setPlatformAccessToken] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rows = await listHtmlExerciseAttempts(user.id, sessionId);
        if (cancelled) return;
        setAttempts(rows);
        if (rows.length === 0) setComposing(true);
        else setViewIndex(rows.length - 1);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Impossible de charger tes tentatives.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, sessionId]);

  const current = attempts[viewIndex];

  useEffect(() => { setIframeLoaded(false); }, [current?.id]);

  // Jeton de session transmis à l'iframe sandboxée pour qu'elle puisse
  // appeler ai-proxy elle-même — même mécanique que le Playground d'une leçon.
  useEffect(() => {
    if (composing || !current) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setPlatformAccessToken(data.session?.access_token ?? null);
    })();
    return () => { cancelled = true; };
  }, [composing, current?.id]);

  // Filet de sécurité si l'iframe ne déclenche jamais onLoad.
  useEffect(() => {
    if (composing || !current || !platformAccessToken || iframeLoaded) return;
    const timer = setTimeout(() => setIframeLoaded(true), 4000);
    return () => clearTimeout(timer);
  }, [composing, current?.id, platformAccessToken, iframeLoaded]);

  const startEdit = () => {
    setDraft(current?.htmlContent ?? "");
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
      setFileError("Impossible de lire ce fichier — vérifie qu'il s'agit bien d'un .txt ou .docx.");
    }
  };

  const handleSave = async () => {
    if (!user || !sessionId || !draft.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    const newIndex = attempts.length;
    try {
      const attempt = await saveHtmlExerciseAttempt(user.id, sessionId, draft.trim());
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
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      <div>
        <button onClick={() => navigate("/practice/html")} className="flex items-center gap-1.5 text-sm mb-2 transition-colors hover:opacity-70" style={{ color: th.fg3 }}>
          <ArrowLeft className="w-4 h-4" />Historique des tentatives
        </button>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Funnel Display',sans-serif" }}><GT>Exercices pour vous</GT></h2>
        <p className="text-sm mt-0.5" style={{ color: th.fg3 }}>Colle du HTML — il tourne exactement comme dans le Playground d'une leçon.</p>
      </div>

      {loading && <GCard><div className="p-8 text-center text-sm" style={{ color: th.fg3 }}>Chargement…</div></GCard>}
      {!loading && loadError && <GCard><div className="p-6 text-sm" style={{ color: RED }}>{loadError}</div></GCard>}

      {!loading && !loadError && (
        <div className="relative rounded-2xl overflow-hidden" style={{ height: "72vh", background: "#060410", border: `1px solid ${th.sep}` }}>
          {composing ? (
            <div className="absolute inset-0 flex flex-col gap-3 p-5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Colle le HTML ici (Ctrl+V)…"
                className="flex-1 w-full rounded-xl px-4 py-3 text-xs g-input resize-none font-mono"
                style={{ minHeight: 0 }}
              />
              {fileError && <p className="text-xs text-[#fbc2ad]">{fileError}</p>}
              {saveError && <p className="text-xs" style={{ color: RED }}>{saveError}</p>}
              <p className="text-[11px] leading-relaxed" style={{ color: th.fg3 }}>
                Pour appeler l'IA sans exposer de clé : dans ce HTML, lis <code>window.__PLATFORM_AUTH__</code> (<code>supabaseUrl</code>, <code>supabaseAnonKey</code>, <code>accessToken</code>) et fais un POST JSON vers <code>{"{supabaseUrl}"}/functions/v1/ai-proxy</code> avec les headers <code>apikey</code> (=supabaseAnonKey) et <code>Authorization: Bearer {"{accessToken}"}</code>, et un corps <code>{"{ contents: [...] }"}</code> (format Gemini). La clé Gemini reste côté serveur.
              </p>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept=".txt,.docx" className="hidden" onChange={handleFileChange} />
                  <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:opacity-80"
                    style={{ background: th.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,20,0.04)", border: `1px solid ${th.inputB}`, color: th.fg }}>
                    <Upload className="w-3.5 h-3.5" />Charger un fichier (.txt / .docx)
                  </span>
                </label>
                <div className="ml-auto flex items-center gap-2">
                  {attempts.length > 0 && <VBtn sm onClick={cancelEdit} disabled={saving}>Annuler</VBtn>}
                  <ShimBtn sm onClick={handleSave} disabled={saving || !draft.trim()}>{saving ? "Enregistrement…" : "Enregistrer"}</ShimBtn>
                </div>
              </div>
            </div>
          ) : current ? (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm bg-white" style={{ color: "#94a3b8" }}>
                  Chargement de la page…
                </div>
              )}
              {platformAccessToken !== null && (
                <iframe
                  key={current.id}
                  onLoad={() => setIframeLoaded(true)}
                  srcDoc={injectPlatformAuth(current.htmlContent, platformAccessToken)}
                  sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                  title={`Exercices pour vous — tentative n°${current.attemptNumber}`}
                  className="absolute inset-0 w-full h-full border-0 bg-white"
                  style={{ opacity: iframeLoaded ? 1 : 0 }}
                />
              )}
              <button onClick={startEdit} className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg"
                style={{ background: th.card, border: `1px solid ${th.sep}`, color: th.fg }}>
                <Pencil className="w-3 h-3" />Modifier
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
              <Code className="w-6 h-6" style={{ color: th.fg3 }} />
              <p className="text-sm" style={{ color: th.fg3 }}>Pas encore de HTML pour ce test.</p>
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
