// Encodage/décodage PCM16 pour Gemini Live : le micro capte à la fréquence
// native du device (souvent 48 kHz), Gemini attend du PCM16 mono 16 kHz en
// entrée et renvoie du PCM16 mono 24 kHz en sortie — d'où le petit
// resampler linéaire ci-dessous (pas besoin d'un vrai filtre anti-repliement
// pour de la voix, la qualité perçue est très largement suffisante).

function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.round(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const frac = srcPos - srcIndex;
    const a = input[srcIndex] ?? 0;
    const b = input[srcIndex + 1] ?? a;
    output[i] = a + (b - a) * frac;
  }
  return output;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

export function encodePcm16Base64(input: Float32Array, fromRate: number, toRate = 16000): string {
  const resampled = resampleLinear(input, fromRate, toRate);
  const pcm16 = floatTo16BitPCM(resampled);
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decodePcm16Base64(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000;
  return float32;
}

// Micro : capture continue via ScriptProcessorNode (support universel,
// AudioWorklet nécessiterait un fichier worklet séparé chargé par URL — pas
// justifié pour un flux voix simple). onChunk ne reçoit les buffers que
// pendant que `active()` renvoie true (push-to-talk : le flux est capté en
// permanence une fois le micro ouvert, mais on ne transmet que sur appui).
export class MicCapture {
  private ctx: AudioContext;
  private source: MediaStreamAudioSourceNode;
  private processor: ScriptProcessorNode;
  private stream: MediaStream;

  constructor(stream: MediaStream, onChunk: (base64: string) => void, active: () => boolean) {
    this.stream = stream;
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(stream);
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      if (!active()) return;
      const input = e.inputBuffer.getChannelData(0);
      onChunk(encodePcm16Base64(input, this.ctx.sampleRate, 16000));
    };
    this.source.connect(this.processor);
    // Un ScriptProcessorNode doit être connecté à une destination pour tourner
    // (contrainte historique de la Web Audio API) — on route vers un gain à
    // zéro pour ne rien faire entendre du micro à l'utilisateur.
    const silentGain = this.ctx.createGain();
    silentGain.gain.value = 0;
    this.processor.connect(silentGain);
    silentGain.connect(this.ctx.destination);
  }

  stop() {
    this.processor.disconnect();
    this.source.disconnect();
    this.stream.getTracks().forEach((t) => t.stop());
    void this.ctx.close();
  }
}

// Lecture : file d'attente de AudioBufferSourceNode planifiés bout à bout
// (pas de trou audible entre deux chunks reçus séparément).
export class PcmPlayer {
  private ctx: AudioContext;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  onQueueEmpty: (() => void) | null = null;

  constructor(sampleRate = 24000) {
    this.ctx = new AudioContext({ sampleRate });
  }

  push(base64: string) {
    const float32 = decodePcm16Base64(base64);
    const buffer = this.ctx.createBuffer(1, float32.length, this.ctx.sampleRate);
    buffer.copyToChannel(float32, 0);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    const startAt = Math.max(this.nextStartTime, this.ctx.currentTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
    this.activeSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0) this.onQueueEmpty?.();
    };
  }

  // Coupe immédiatement toute lecture en cours (barge-in).
  clear() {
    for (const source of this.activeSources) {
      source.onended = null;
      try { source.stop(); } catch { /* déjà arrêté */ }
    }
    this.activeSources.clear();
    this.nextStartTime = this.ctx.currentTime;
  }

  close() {
    this.clear();
    void this.ctx.close();
  }
}
