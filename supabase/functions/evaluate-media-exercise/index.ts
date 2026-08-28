// Exercice "Génération images & vidéos" (Pratique IA) : l'élève écrit un
// prompt pour générer une image OU une vidéo (jamais de texte, jamais les
// deux media à la fois — le mode est fixé par tentative). L'IA (1) note le
// prompt /20 avec corrections verbatim + éléments manquants + verdict, comme
// evaluate-prompt-exercise, ET (2) produit un "correctedPrompt" complet, puis
// génère le média en double : une fois avec le prompt brut de l'élève, une
// fois avec le prompt corrigé, pour une comparaison visuelle directe.
//
// La génération média est lancée en arrière-plan (runInBackground) et jamais
// attendue ici : pour la vidéo (Veo, predictLongRunning, plusieurs minutes
// possibles), on se contente de démarrer les deux opérations et de stocker
// leur nom — c'est check-media-exercise-status, rappelé par le client, qui
// les fait progresser. Pour l'image (rapide), la tâche de fond va jusqu'au
// bout et finalise la ligne elle-même. Même leçon que generate-avatar-video /
// generate-podcast-audio : jamais de polling synchrone dans une Edge
// Function, le budget de temps mur est trop court.
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse, runInBackground, base64ToUint8Array } from "../_shared/podcast-utils.ts";
import { buildCourseContext } from "../_shared/course-context.ts";

const GEMINI_TEXT_MODEL = "gemini-3.6-flash";
const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
const VEO_MODEL = "veo-3.1-fast-generate-preview";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
// Coupe-circuit volontaire : la génération vidéo (Veo, 2 clips par tentative,
// plusieurs minutes, coût réel) reste désactivée tant qu'elle n'a pas été
// testée/validée manuellement. Le code du mode vidéo est déjà écrit et prêt
// (voir startVideoOperation ci-dessous) — il suffit de repasser ce flag à
// true (et de redéployer) pour l'activer.
const VIDEO_MODE_ENABLED = false;

type Mode = "image" | "video";
interface Correction { excerpt: string; suggestion: string; explanation: string }
interface MissingItem { title: string; explanation: string }
interface Feedback { score: number; corrections: Correction[]; missing: MissingItem[]; verdict: string; correctedPrompt: string }
interface PreviousAttempt {
  promptText: string; correctedPromptText: string; score: number; verdict: string;
  corrections: Correction[]; missing: MissingItem[];
}

const MODE_GUIDANCE: Record<Mode, string> = {
  image: `Tu évalues un prompt pour un générateur d'IMAGE (type Imagen/Gemini image). Les critères spécifiques à ce media : sujet principal et composition sans ambiguïté, style/direction artistique explicite (photo réaliste, illustration, 3D, peinture...), éclairage et ambiance, cadrage/angle de caméra, niveau de détail attendu, absence de descriptions contradictoires ou trop vagues ("quelque chose de joli"), et le cas échéant un ratio/format cohérent avec l'usage visé. Une image ne peut pas "bouger" ni "raconter une histoire dans le temps" — un prompt qui décrit une action continue ou une séquence est une erreur de medium à signaler.`,
  video: `Tu évalues un prompt pour un générateur de VIDÉO (type Veo). Les critères spécifiques à ce medium, en plus de ceux d'un prompt image (sujet, style, éclairage, cadrage) : description du mouvement/de l'action dans le temps, mouvement de caméra (fixe, travelling, zoom...), durée/rythme implicite, cohérence temporelle (un seul plan clair, pas une succession de scènes différentes sans lien — les modèles actuels génèrent un plan continu court, pas un montage), et absence d'éléments qui nécessiteraient plusieurs plans ou une histoire longue. Rappelle que "vidéo" veut dire mouvement réel dans le temps, pas juste une scène statique décrite en détail.`,
};

function sanitizeFeedback(raw: unknown): Feedback | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.score !== "number" || typeof r.verdict !== "string" || typeof r.correctedPrompt !== "string" || !r.correctedPrompt.trim()) return null;
  const corrections = Array.isArray(r.corrections)
    ? r.corrections
        .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
        .map((c) => ({ excerpt: String(c.excerpt ?? ""), suggestion: String(c.suggestion ?? ""), explanation: String(c.explanation ?? "") }))
        .filter((c) => c.excerpt.trim().length > 0)
    : [];
  const missing = Array.isArray(r.missing)
    ? r.missing
        .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
        .map((m) => ({ title: String(m.title ?? ""), explanation: String(m.explanation ?? "") }))
        .filter((m) => m.title.trim().length > 0)
    : [];
  return { score: Math.max(0, Math.min(20, Math.round(r.score))), corrections, missing, verdict: r.verdict.trim(), correctedPrompt: r.correctedPrompt.trim() };
}

function buildEvaluationPrompt(mode: Mode, studentPrompt: string, attemptNumber: number, courseContext: string, previous: PreviousAttempt | null): string {
  const previousBlock = previous
    ? `
=== TENTATIVE PRÉCÉDENTE DE CET ÉLÈVE DANS CE MÊME MODE (comparaison obligatoire) ===
Prompt précédent :
---
${previous.promptText}
---
Prompt corrigé proposé la dernière fois :
---
${previous.correctedPromptText}
---
Score obtenu : ${previous.score}/20
Verdict précédent : ${previous.verdict}
Corrections précédemment signalées :
${previous.corrections.length ? previous.corrections.map((c, i) => `${i + 1}. "${c.excerpt}" → "${c.suggestion}"`).join("\n") : "(aucune)"}
Éléments manquants précédemment signalés :
${previous.missing.length ? previous.missing.map((m) => `- ${m.title}`).join("\n") : "(aucun)"}

Dans ton verdict final, dis explicitement si les problèmes ci-dessus sont corrigés, partiellement corrigés, ou toujours présents dans la nouvelle version — et si de nouveaux problèmes sont apparus. Ne complimente pas une réécriture cosmétique qui n'a pas réglé le fond.
`
    : "";

  return `Tu es un expert reconnu en prompt engineering pour la génération d'images et de vidéos par IA, niveau professoral — tu connais en profondeur les modèles génératifs actuels (composition, style, éclairage, cadrage, mouvement) et ce qui les fait échouer, pas un correcteur vague qui se contente d'un ressenti général. Tu es l'évaluateur d'un exercice pratique sur une plateforme de formation professionnelle à l'IA générative (certification RS6776 "First Step") : ton rôle est d'aider l'élève à progresser concrètement, pas de le rassurer.

${MODE_GUIDANCE[mode]}

=== RÈGLES DE RÉFÉRENCE DE LA FORMATION (à appliquer en plus des bonnes pratiques ci-dessus) ===
${courseContext || "Aucun contenu de cours disponible pour le moment — évalue uniquement selon les bonnes pratiques générales."}
Si une méthode ou règle spécifique enseignée dans le cours ci-dessus est pertinente pour ce prompt et n'est pas respectée, signale-le comme une correction ou un élément manquant, au même titre qu'une règle générale.
${previousBlock}
=== PROMPT DE L'ÉLÈVE À ÉVALUER (mode: ${mode}, tentative n°${attemptNumber}) ===
---
${studentPrompt}
---

=== CE QUE TU DOIS PRODUIRE ===
1. CORRECTIONS : repère chaque formulation du prompt ci-dessus qui est une erreur, une imprécision, une ambiguïté ou une maladresse pour CE medium (${mode}). Pour chacune : l'extrait fautif exact, une reformulation corrigée, une explication.
2. ÉLÉMENTS MANQUANTS : repère les éléments structurants absents (voir critères spécifiques au medium ci-dessus, + toute règle du cours non respectée). Pour chacun, l'explication doit couvrir DEUX choses : (a) pourquoi c'est important en général pour un prompt ${mode} et ce qui se passe concrètement si on l'omet, et (b) ce que ça change précisément dans CE prompt-ci.
3. SCORE sur 20 : honnête et rigoureux, sans complaisance.
4. CORRECTEDPROMPT : réécris entièrement le prompt de l'élève en un prompt ${mode} corrigé et complet, prêt à être envoyé tel quel au générateur — pas une liste de suggestions, le prompt final lui-même, en intégrant toutes les corrections ci-dessus.
5. VERDICT global : évaluation honnête et directe de la qualité du prompt et de sa capacité à produire un résultat ${mode === "image" ? "visuel" : "vidéo"} cohérent et fiable.${previous ? " Compare explicitement avec la tentative précédente (voir ci-dessus)." : ""}

=== RÈGLES ABSOLUES DE FORMAT ===
- Chaque "excerpt" dans "corrections" doit être une citation EXACTE, mot pour mot, copiée telle quelle depuis le prompt de l'élève ci-dessus — impératif technique : ce texte sert à localiser automatiquement l'erreur dans l'interface. Fragment le plus court possible identifiant sans ambiguïté le passage, listé dans l'ordre d'apparition. N'invente jamais un extrait qui n'existe pas mot pour mot.
- "correctedPrompt" ne doit décrire QUE ce qui peut être généré par une IA de ${mode === "image" ? "génération d'image" : "génération vidéo"} à partir d'un texte — jamais de texte à afficher dans l'image/la vidéo sauf si explicitement demandé par l'élève.
- Les explications doivent être concises, concrètes et directement exploitables — jamais de remarque vague sans dire précisément quoi et pourquoi.

=== FORMAT DE SORTIE ===
Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, de cette forme exacte :
{
  "score": <entier de 0 à 20>,
  "corrections": [ { "excerpt": "...", "suggestion": "...", "explanation": "..." } ],
  "missing": [ { "title": "...", "explanation": "..." } ],
  "correctedPrompt": "...",
  "verdict": "..."
}`;
}

async function generateImageBytes(apiKey: string, prompt: string): Promise<Uint8Array> {
  const resp = await fetch(`${GEMINI_API_BASE}/models/${GEMINI_IMAGE_MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!resp.ok) throw new Error(`Génération image échouée : ${await resp.text()}`);
  const json = await resp.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  // deno-lint-ignore no-explicit-any
  const imagePart = parts.find((p: any) => p?.inlineData?.data);
  if (!imagePart) throw new Error("Le modèle n'a renvoyé aucune image.");
  return base64ToUint8Array(imagePart.inlineData.data);
}

async function startVideoOperation(apiKey: string, prompt: string): Promise<string> {
  const resp = await fetch(`${GEMINI_API_BASE}/models/${VEO_MODEL}:predictLongRunning`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { aspectRatio: "16:9", durationSeconds: "6", resolution: "720p" },
    }),
  });
  if (!resp.ok) throw new Error(`Démarrage génération vidéo échoué : ${await resp.text()}`);
  const json = await resp.json();
  if (!json?.name) throw new Error("Aucune opération vidéo retournée par Veo.");
  return json.name as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return jsonResponse({ error: "GEMINI_API_KEY non configurée côté serveur." }, 500);

    const { promptText, sessionId, mode } = await req.json();
    if (!promptText?.trim()) return jsonResponse({ error: "promptText manquant." }, 400);
    if (promptText.length > 4000) return jsonResponse({ error: "Ce prompt est trop long (4000 caractères max)." }, 400);
    if (typeof sessionId !== "string" || !/^[0-9a-f-]{36}$/i.test(sessionId)) return jsonResponse({ error: "sessionId manquant ou invalide." }, 400);
    if (mode !== "image" && mode !== "video") return jsonResponse({ error: "mode doit être 'image' ou 'video'." }, 400);
    if (mode === "video" && !VIDEO_MODE_ENABLED) return jsonResponse({ error: "Le mode vidéo n'est pas encore activé." }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Non authentifié." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Session invalide." }, 401);
    const userId = userData.user.id;

    const { data: lessonRows } = await supabase.from("lessons").select("title, reference_content").order("order_index");
    const courseContext = buildCourseContext(lessonRows ?? []);

    const { data: previousRows } = await supabase
      .from("media_exercise_attempts")
      .select("attempt_number, prompt_text, corrected_prompt_text, score, feedback")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("mode", mode)
      .order("attempt_number", { ascending: false })
      .limit(1);
    const previousRow = previousRows?.[0] ?? null;
    const previous: PreviousAttempt | null = previousRow
      ? {
          promptText: previousRow.prompt_text,
          correctedPromptText: previousRow.corrected_prompt_text,
          score: previousRow.score,
          verdict: (previousRow.feedback as Record<string, unknown>)?.verdict as string ?? "",
          corrections: ((previousRow.feedback as Record<string, unknown>)?.corrections as Correction[]) ?? [],
          missing: ((previousRow.feedback as Record<string, unknown>)?.missing as MissingItem[]) ?? [],
        }
      : null;

    // Le numéro de tentative reste une séquence unique par session (peu
    // importe le mode) pour que la pagination du dossier reste cohérente.
    const { data: allSessionRows } = await supabase
      .from("media_exercise_attempts")
      .select("attempt_number")
      .eq("session_id", sessionId)
      .order("attempt_number", { ascending: false })
      .limit(1);
    const attemptNumber = (allSessionRows?.[0]?.attempt_number ?? 0) + 1;

    const evalPrompt = buildEvaluationPrompt(mode as Mode, promptText.trim(), attemptNumber, courseContext, previous);
    const geminiResp = await fetch(`${GEMINI_API_BASE}/models/${GEMINI_TEXT_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: evalPrompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    if (!geminiResp.ok) return jsonResponse({ error: `Gemini a échoué : ${await geminiResp.text()}` }, 502);
    const geminiJson = await geminiResp.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return jsonResponse({ error: "Gemini n'a renvoyé aucune évaluation." }, 502);

    let feedback: Feedback | null;
    try {
      feedback = sanitizeFeedback(JSON.parse(rawText));
    } catch {
      feedback = null;
    }
    if (!feedback) return jsonResponse({ error: "Réponse IA invalide, réessaie." }, 502);

    const { data: inserted, error: insertErr } = await supabase
      .from("media_exercise_attempts")
      .insert({
        user_id: userId,
        session_id: sessionId,
        attempt_number: attemptNumber,
        mode,
        prompt_text: promptText.trim(),
        corrected_prompt_text: feedback.correctedPrompt,
        score: feedback.score,
        feedback: { corrections: feedback.corrections, missing: feedback.missing, verdict: feedback.verdict },
        status: "generating",
        model: `${GEMINI_TEXT_MODEL}+${mode === "image" ? GEMINI_IMAGE_MODEL : VEO_MODEL}`,
      })
      .select()
      .single();
    if (insertErr) return jsonResponse({ error: `Échec de l'enregistrement : ${insertErr.message}` }, 500);

    const attemptId = inserted.id as string;

    const runGeneration = async () => {
      try {
        if (mode === "image") {
          const [originalBytes, correctedBytes] = await Promise.all([
            generateImageBytes(geminiApiKey, promptText.trim()),
            generateImageBytes(geminiApiKey, feedback!.correctedPrompt),
          ]);
          const originalPath = `${userId}/${attemptId}/original.png`;
          const correctedPath = `${userId}/${attemptId}/corrected.png`;
          const [up1, up2] = await Promise.all([
            supabase.storage.from("media-exercise-outputs").upload(originalPath, originalBytes, { contentType: "image/png", upsert: true }),
            supabase.storage.from("media-exercise-outputs").upload(correctedPath, correctedBytes, { contentType: "image/png", upsert: true }),
          ]);
          if (up1.error || up2.error) throw new Error(up1.error?.message || up2.error?.message || "Échec de l'upload de l'image.");
          await supabase.from("media_exercise_attempts").update({
            status: "ready", original_media_path: originalPath, corrected_media_path: correctedPath,
          }).eq("id", attemptId);
        } else {
          const [originalOp, correctedOp] = await Promise.all([
            startVideoOperation(geminiApiKey, promptText.trim()),
            startVideoOperation(geminiApiKey, feedback!.correctedPrompt),
          ]);
          await supabase.from("media_exercise_attempts").update({
            original_operation_name: originalOp, corrected_operation_name: correctedOp,
          }).eq("id", attemptId);
        }
      } catch (err) {
        console.error(`Échec génération média (${mode}) attempt=${attemptId}:`, err);
        await supabase.from("media_exercise_attempts").update({
          status: "failed", error: err instanceof Error ? err.message : "Erreur de génération inconnue.",
        }).eq("id", attemptId);
      }
    };
    runInBackground(runGeneration());

    return jsonResponse({ attempt: inserted });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inconnue." }, 500);
  }
});
