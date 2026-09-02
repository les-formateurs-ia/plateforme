// Mentor vocal temps réel — backend Gemini Live (remplace ElevenLabs
// Conversational AI). GeminiVoiceSession expose exactement la même forme
// que l'ancien objet `Conversation` d'@elevenlabs/client (setMicMuted,
// sendUserActivity, sendUserMessage, endSession + callbacks onConnect/
// onDisconnect/onModeChange/onMessage/onError) pour que LessonPage.tsx n'ait
// presque rien à changer.
//
// Le prompt système ne transite JAMAIS ici : il est verrouillé dans le token
// éphémère par gemini-voice-token (bidiGenerateContentSetup), donc le
// navigateur ne voit ni le modèle ni le texte du prompt/message d'accueil,
// même dans l'onglet Network/WS des devtools. On se connecte donc sur
// l'endpoint *Constrained* (obligatoire avec un token verrouillé) avec un
// message de setup vide, et on déclenche le message d'accueil avec un mot de
// passe neutre (START_TRIGGER) que le prompt caché sait reconnaître — voir
// buildLockedSystemInstruction côté serveur, la constante doit rester
// identique des deux côtés.
import { supabase } from "@/app/lib/supabase/client";
import { MicCapture, PcmPlayer } from "@/app/lib/audioPcm";

const START_TRIGGER = "__START_CONVERSATION__";

async function extractFunctionError(error: { message: string; context?: Response }): Promise<string> {
  let message = error.message;
  if (error.context) {
    try {
      const body = await error.context.clone().json();
      if (body?.error) message = body.error;
    } catch {
      // corps non-JSON, on garde le message par défaut
    }
  }
  return message;
}

interface VoiceAgentVars {
  student_name: string;
  profession: string;
  objectif_professionnel: string;
  lesson_title: string;
  lesson_content: string;
  depth_mode: string;
  pedagogy_style: string;
  // Conversation Agent à laquelle rattacher cette session — permet au prompt
  // verrouillé côté serveur d'inclure un résumé de la reprise (cf.
  // gemini-voice-token). Les transcripts eux-mêmes sont persistés côté
  // client dans cette même conversation, via onMessage (voir appelants).
  conversation_id?: string;
}

interface StartGeminiVoiceOptions extends VoiceAgentVars {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onModeChange?: (e: { mode: "listening" | "speaking" }) => void;
  onMessage?: (e: { source: "user" | "ai"; message: string }) => void;
  onError?: (message: string) => void;
}

export interface GeminiVoiceSession {
  setMicMuted(muted: boolean): void;
  sendUserActivity(): void;
  sendUserMessage(text: string): void;
  endSession(): Promise<void>;
}

async function getVoiceToken(vars: VoiceAgentVars): Promise<string> {
  const { data, error } = await supabase.functions.invoke("gemini-voice-token", { body: vars });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.token) throw new Error("Aucun token reçu.");
  return data.token;
}

export async function startGeminiVoiceSession(opts: StartGeminiVoiceOptions): Promise<GeminiVoiceSession> {
  const { onConnect, onDisconnect, onModeChange, onMessage, onError, ...vars } = opts;
  const token = await getVoiceToken(vars);

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const player = new PcmPlayer(24000);

  let micActive = false;
  let closed = false;
  let inputTranscript = "";
  let outputTranscript = "";
  let speaking = false;

  // Endpoint *Constrained* : obligatoire pour un token verrouillé (l'endpoint
  // standard BidiGenerateContent rejette ces tokens avec "Method doesn't
  // allow unregistered callers").
  const ws = new WebSocket(
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`,
  );

  const mic = new MicCapture(stream, (base64) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ realtimeInput: { audio: { data: base64, mimeType: "audio/pcm;rate=16000" } } }));
  }, () => micActive);

  const setMode = (mode: "listening" | "speaking") => {
    if (speaking === (mode === "speaking")) return;
    speaking = mode === "speaking";
    onModeChange?.({ mode });
  };

  player.onQueueEmpty = () => setMode("listening");

  const cleanup = () => {
    if (closed) return;
    closed = true;
    mic.stop();
    player.close();
  };

  // Setup vide : toute la config (modèle, prompt, VAD manuelle,
  // transcription) est déjà verrouillée dans le token côté serveur.
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({ setup: {} }));
      resolve();
    };
    ws.onerror = () => reject(new Error("Impossible de se connecter à l'agent vocal."));
  });

  ws.onmessage = async (event) => {
    const raw = typeof event.data === "string" ? event.data : await (event.data as Blob).text();
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.setupComplete) {
      onConnect?.();
      // Déclenche le message d'accueil sans jamais révéler son texte : le
      // prompt verrouillé côté serveur sait reconnaître ce mot de passe.
      ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
      ws.send(JSON.stringify({ realtimeInput: { text: START_TRIGGER } }));
      ws.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
      return;
    }

    const serverContent = msg.serverContent as {
      modelTurn?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
      turnComplete?: boolean;
      interrupted?: boolean;
      inputTranscription?: { text?: string };
      outputTranscription?: { text?: string };
    } | undefined;
    if (!serverContent) return;

    if (serverContent.interrupted) {
      player.clear();
      setMode("listening");
    }

    const parts = serverContent.modelTurn?.parts ?? [];
    for (const part of parts) {
      const data = part.inlineData?.data;
      if (data && part.inlineData?.mimeType?.startsWith("audio/")) {
        setMode("speaking");
        player.push(data);
      }
    }

    if (serverContent.inputTranscription?.text) inputTranscript += serverContent.inputTranscription.text;
    if (serverContent.outputTranscription?.text) outputTranscript += serverContent.outputTranscription.text;

    if (serverContent.turnComplete) {
      if (inputTranscript.trim()) onMessage?.({ source: "user", message: inputTranscript.trim() });
      if (outputTranscript.trim()) onMessage?.({ source: "ai", message: outputTranscript.trim() });
      inputTranscript = "";
      outputTranscript = "";
    }
  };

  ws.onclose = () => {
    cleanup();
    onDisconnect?.();
  };

  ws.onerror = () => {
    onError?.("Erreur de connexion à l'agent vocal.");
  };

  return {
    // Gemini Live avec VAD manuelle a besoin d'un signal explicite de fin de
    // tour (sinon il continue d'attendre indéfiniment) : on l'envoie ici sur
    // la transition micro actif → coupé, ce qui correspond exactement au
    // relâchement du bouton push-to-talk dans LessonPage.tsx (stopPushToTalk
    // n'appelle que setMicMuted(true), jamais un signal dédié).
    setMicMuted(muted: boolean) {
      if (muted && micActive && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
      }
      micActive = !muted;
    },
    sendUserActivity() {
      if (ws.readyState !== WebSocket.OPEN) return;
      player.clear();
      setMode("listening");
      ws.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
    },
    sendUserMessage(text: string) {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ realtimeInput: { text } }));
    },
    async endSession() {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
      cleanup();
    },
  };
}
