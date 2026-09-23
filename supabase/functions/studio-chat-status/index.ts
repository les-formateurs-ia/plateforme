// Suivi d'une réponse GPT/Claude en attente dans le chat du Studio (cf.
// studio-chat) : un getResponse Runware par appel, relancé par le client
// jusqu'à la réponse, une erreur, ou CHAT_REPLY_TIMEOUT_MS (10 min).
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import { CORS_HEADERS, jsonResponse } from "../_shared/podcast-utils.ts";
import { pollRunwareText } from "../_shared/runware.ts";
import { CHAT_REPLY_TIMEOUT_MS, CONVERSATION_COLUMNS, abandonPendingTurn, completeTurn, type PendingTask } from "../_shared/studio-chat-turn.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const { conversationId } = await req.json();
    if (typeof conversationId !== "string") return jsonResponse({ error: "conversationId manquant." }, 400);

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

    const readConversation = async () => {
      const { data, error } = await supabase.from("studio_chat_conversations").select(CONVERSATION_COLUMNS).eq("id", conversationId).eq("user_id", userId).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    };
    // Conversation supprimée = échec dès le premier message (cf. abandonPendingTurn).
    const failWith = async (pending: PendingTask, error: string) => {
      await abandonPendingTurn(supabase, conversationId, pending.taskUUID);
      return jsonResponse({ conversation: await readConversation(), error });
    };

    const conv = await readConversation();
    if (!conv) return jsonResponse({ conversation: null, error: "Conversation introuvable." });
    const pending = conv.pending_task as PendingTask | null;
    if (!pending) return jsonResponse({ conversation: conv });

    if (Date.now() - Date.parse(pending.startedAt) > CHAT_REPLY_TIMEOUT_MS) {
      return await failWith(pending, "Le modèle n'a pas répondu en 10 minutes. Réessaie, éventuellement avec un modèle plus rapide ou un document plus court.");
    }

    const runwareKey = Deno.env.get("RUNWARE_API_KEY");
    if (!runwareKey) return jsonResponse({ error: "RUNWARE_API_KEY non configurée côté serveur." }, 500);

    let polled;
    try {
      polled = await pollRunwareText(runwareKey, pending.taskUUID);
    } catch (err) {
      // Incident réseau ponctuel : la tâche continue chez Runware, le client repassera.
      console.warn("studio-chat-status poll:", err);
      return jsonResponse({ conversation: conv });
    }
    if (polled.status === "pending") return jsonResponse({ conversation: conv });
    if (polled.status === "failed") return await failWith(pending, polled.error);

    const saved = await completeTurn(supabase, {
      conversationId, userId, provider: conv.provider, model: pending.model, messages: pending.messages,
      reply: polled.text, cost: polled.cost, steps: pending.steps, taskUUID: pending.taskUUID,
    });
    return jsonResponse({ conversation: saved ?? await readConversation() });
  } catch (err) {
    console.error("studio-chat-status:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erreur inattendue." }, 500);
  }
});
