import crypto from 'crypto';

// GigaChat requires OAuth2 client-credentials: exchange GIGACHAT_AUTH_KEY for a
// short-lived access token, then send it as a Bearer token on chat completions.
// Token lives ~30 min; we cache it in memory and refresh a bit before expiry.

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const REFRESH_MARGIN_MS = 60_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getGigaChatAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
    return cachedToken.value;
  }

  const authKey = process.env.GIGACHAT_AUTH_KEY;
  if (!authKey) throw new Error('GIGACHAT_AUTH_KEY not configured');
  const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';

  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: crypto.randomUUID(),
      Authorization: `Basic ${authKey}`,
    },
    body: new URLSearchParams({ scope }),
    signal: AbortSignal.timeout(15_000),
    // NOTE: GigaChat's TLS chain is signed by the Russian Mintsifry root CA, which
    // is not in Node's default trust store. In production, install that CA and pass
    // it via a custom https.Agent (NODE_EXTRA_CA_CERTS also works) — do not disable
    // certificate validation to work around this.
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GigaChat OAuth failed: ${res.status} ${detail}`);
  }

  const data = (await res.json()) as { access_token: string; expires_at: number };
  cachedToken = { value: data.access_token, expiresAt: data.expires_at };
  return data.access_token;
}
