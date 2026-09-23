-- Chat du Studio : GPT/Claude (Runware) peuvent répondre en jusqu'à 10 min,
-- bien au-delà de la durée max d'une edge function. La réponse en cours est
-- suivie ici (taskUUID Runware, messages à valider, trace) et finalisée par
-- l'edge function studio-chat-status, relancée par le client.
-- null = aucune réponse en attente.
alter table studio_chat_conversations add column pending_task jsonb;
