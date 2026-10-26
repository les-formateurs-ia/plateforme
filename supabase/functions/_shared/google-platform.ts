// Compte Google UNIQUE de la plateforme (google_oauth_tokens,
// is_platform_default = true — connecté par un admin depuis son profil via
// google-oauth-*, cf. 0059) : il organise les Meet (sync-meet-event) et
// envoie les mails de la plateforme (notify-mission-submitted).

export const GOOGLE_SCOPES = {
  calendar: "https://www.googleapis.com/auth/calendar.events",
  gmailSend: "https://www.googleapis.com/auth/gmail.send",
} as const;

export async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) throw new Error(`Échec du rafraîchissement du token Google : ${await resp.text()}`);
  const json = await resp.json();
  return {
    accessToken: json.access_token as string,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString(),
  };
}

export interface PlatformGoogleAccount {
  accessToken: string;
  email: string | null;
  scopes: string[];
}

// Jeton d'accès valide du compte plateforme (rafraîchi et réenregistré s'il
// expire dans la minute), ou null si aucun admin n'a connecté de compte.
// serviceClient : client service-role, seul autorisé à lire google_oauth_tokens.
// deno-lint-ignore no-explicit-any
export async function getPlatformGoogleAccount(serviceClient: any): Promise<PlatformGoogleAccount | null> {
  const { data: tokenRow } = await serviceClient
    .from("google_oauth_tokens")
    .select("*")
    .eq("is_platform_default", true)
    .maybeSingle();
  if (!tokenRow) return null;

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  let accessToken = tokenRow.access_token as string | null;
  const expiresAtMs = tokenRow.access_token_expires_at ? new Date(tokenRow.access_token_expires_at).getTime() : 0;
  if (!accessToken || expiresAtMs < Date.now() + 60_000) {
    const refreshed = await refreshAccessToken(clientId, clientSecret, tokenRow.refresh_token);
    accessToken = refreshed.accessToken;
    await serviceClient
      .from("google_oauth_tokens")
      .update({ access_token: refreshed.accessToken, access_token_expires_at: refreshed.expiresAt })
      .eq("formateur_id", tokenRow.formateur_id);
  }
  return {
    accessToken,
    email: tokenRow.google_email ?? null,
    scopes: (tokenRow.granted_scopes ?? "").split(" ").filter(Boolean),
  };
}
