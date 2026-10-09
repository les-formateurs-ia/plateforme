// Mentor vocal temps réel — backend Gemini Live (remplace ElevenLabs
// Conversational AI). Échange naturel : le micro reste ouvert pendant tout
// l'appel et Gemini détecte lui-même début et fin de parole (VAD
// automatique) — plus de push-to-talk. GeminiVoiceSession garde la forme
// de l'ancien objet `Conversation` d'@elevenlabs/client (setMicMuted,
// sendUserMessage, endSession + callbacks onConnect/onDisconnect/
// onModeChange/onMessage/onError).
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
  // L'élève est en train de parler (niveau micro local) — sert uniquement
  // à animer l'UI, la détection de tour de parole est faite par Gemini.
  onUserSpeakingChange?: (speaking: boolean) => void;
  onError?: (message: string) => void;
}

export interface GeminiVoiceSession {
  setMicMuted(muted: boolean): void;
  sendUserMessage(text: string): void;
  endSession(): Promise<void>;
}

async function getVoiceToken(vars: VoiceAgentVars): Promise<string> {
  // vad: "auto" → détection automatique de la parole côté Gemini. Sans ce
  // champ, gemini-voice-token reste en VAD manuelle (push-to-talk) pour ne
  // pas casser un ancien client encore en cache.
  const { data, error } = await supabase.functions.invoke("gemini-voice-token", { body: { ...vars, vad: "auto" } });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.token) throw new Error("Aucun token reçu.");
  return data.token;
}

// Seuil de niveau micro (après annulation d'écho) au-dessus duquel on
// considère que l'élève parle, et durée de silence avant de repasser à
// « ne parle pas » — purement visuel.
const SPEAKING_LEVEL = 0.04;
const SPEAKING_HOLD_MS = 600;

export async function startGeminiVoiceSession(opts: StartGeminiVoiceOptions): Promise<GeminiVoiceSession> {
  const { onConnect, onDisconnect, onModeChange, onMessage, onUserSpeakingChange, onError, ...vars } = opts;
  const token = await getVoiceToken(vars);

  // Micro ouvert en continu : l'annulation d'écho est indispensable pour que
  // la voix de l'agent sortant des haut-parleurs ne soit pas reprise par le
  // micro (Gemini croirait que l'élève lui coupe la parole).
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const player = new PcmPlayer(24000);

  let micActive = false;
  let closed = false;
  let inputTranscript = "";
  let outputTranscript = "";
  let speaking = false;
  let userSpeaking = false;
  let lastVoiceAt = 0;

  // Endpoint *Constrained* : obligatoire pour un token verrouillé (l'endpoint
  // standard BidiGenerateContent rejette ces tokens avec "Method doesn't
  // allow unregistered callers").
  const ws = new WebSocket(
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${token}`,
  );

  const setUserSpeaking = (value: boolean) => {
    if (userSpeaking === value) return;
    userSpeaking = value;
    onUserSpeakingChange?.(value);
  };

  const mic = new MicCapture(stream, (base64, peak) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    if (peak > SPEAKING_LEVEL) lastVoiceAt = now;
    setUserSpeaking(now - lastVoiceAt < SPEAKING_HOLD_MS);
    ws.send(JSON.stringify({ realtimeInput: { audio: { data: base64, mimeType: "audio/pcm;rate=16000" } } }));
  }, () => micActive);

  // Les AudioContext naissent après plusieurs await, donc hors du clic
  // « Démarrer l'appel » : Safari les crée suspendus. On tente de les
  // relancer tout de suite (suffit sur Chrome), sinon au prochain geste.
  const resumeAudio = () => {
    mic.resume();
    player.resume();
  };
  resumeAudio();
  window.addEventListener("pointerdown", resumeAudio);
  window.addEventListener("keydown", resumeAudio);

  const setMode = (mode: "listening" | "speaking") => {
    if (speaking === (mode === "speaking")) return;
    speaking = mode === "speaking";
    onModeChange?.({ mode });
  };

  player.onQueueEmpty = () => setMode("listening");

  const flushTranscripts = () => {
    if (inputTranscript.trim()) onMessage?.({ source: "user", message: inputTranscript.trim() });
    if (outputTranscript.trim()) onMessage?.({ source: "ai", message: outputTranscript.trim() });
    inputTranscript = "";
    outputTranscript = "";
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    window.removeEventListener("pointerdown", resumeAudio);
    window.removeEventListener("keydown", resumeAudio);
    setUserSpeaking(false);
    mic.stop();
    player.close();
  };

  // Setup vide : toute la config (modèle, prompt, VAD automatique,
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
      // Puis on ouvre le micro : l'élève peut couper la parole à l'agent
      // dès l'accueil, comme dans un vrai échange.
      ws.send(JSON.stringify({ realtimeInput: { text: START_TRIGGER } }));
      micActive = true;
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

    if (serverContent.inputTranscription?.text) inputTranscript += serverContent.inputTranscription.text;
    if (serverContent.outputTranscription?.text) outputTranscript += serverContent.outputTranscription.text;

    // L'élève a coupé la parole à l'agent : on arrête la lecture et on
    // enregistre ce que l'agent avait eu le temps de dire.
    if (serverContent.interrupted) {
      player.clear();
      setMode("listening");
      if (outputTranscript.trim()) onMessage?.({ source: "ai", message: outputTranscript.trim() });
      outputTranscript = "";
    }

    const parts = serverContent.modelTurn?.parts ?? [];
    for (const part of parts) {
      const data = part.inlineData?.data;
      if (data && part.inlineData?.mimeType?.startsWith("audio/")) {
        setMode("speaking");
        player.push(data);
      }
    }

    if (serverContent.turnComplete) flushTranscripts();
  };

  ws.onclose = () => {
    cleanup();
    onDisconnect?.();
  };

  ws.onerror = () => {
    onError?.("Erreur de connexion à l'agent vocal.");
  };

  return {
    // Coupe le micro (bouton « muet ») : plus aucun audio n'est envoyé,
    // Gemini ne détecte donc plus de parole.
    setMicMuted(muted: boolean) {
      if (!muted) resumeAudio();
      micActive = !muted;
      if (muted) setUserSpeaking(false);
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
