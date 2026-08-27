// Agent vocal ElevenLabs (Conversational AI) — privé, authentification requise
// côté ElevenLabs. Le widget front a besoin d'une "signed URL" à usage limité
// (15 min) au lieu d'un agent-id public ; on la récupère via la fonction proxy
// qui détient la clé API côté serveur.
import { supabase } from "@/app/lib/supabase/client";

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

export async function getAgentSignedUrl(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("elevenlabs-signed-url", { body: {} });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
  if (!data?.signedUrl) throw new Error("Aucune signed URL reçue.");
  return data.signedUrl;
}

// Admin/formateur seulement : (ré)écrit le prompt système de base de l'agent
// vocal ElevenLabs (persona + placeholders de variables dynamiques). Les
// valeurs par leçon/élève sont fournies ensuite à chaque appel via
// `dynamicVariables` dans startAgentCall.
export async function configureVoiceAgent(): Promise<void> {
  const { data, error } = await supabase.functions.invoke("configure-voice-agent", { body: {} });
  if (error) throw new Error(await extractFunctionError(error));
  if (data?.error) throw new Error(data.error);
}
