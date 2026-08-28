// Réglages plateforme (table singleton, une seule ligne — id=true).
// Pour l'instant : le lien de la page de réservation Google Calendar de
// l'expert IA (voir migration 0016_platform_settings.sql).
import { supabase } from "@/app/lib/supabase/client";

export async function getExpertBookingUrl(): Promise<string | null> {
  const { data, error } = await supabase.from("platform_settings").select("expert_booking_url").eq("id", true).maybeSingle();
  if (error) throw error;
  return data?.expert_booking_url ?? null;
}

export async function setExpertBookingUrl(url: string | null): Promise<void> {
  const { error } = await supabase.from("platform_settings").update({ expert_booking_url: url }).eq("id", true);
  if (error) throw error;
}
