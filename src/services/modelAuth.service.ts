import crypto from 'crypto';

// Generic OAuth2 client-credentials exchange for AiModel rows with
// authMethod = OAUTH2_CLIENT_CREDENTIALS. One cached token per model row, so
// two rows pointed at the same provider still get independent caches (fine —
// they'd just each do their own exchange, no real downside for this volume).

const REFRESH_MARGIN_MS = 60_000;
const tokenCache = new Map<string, { value: string; expiresAt: number }>();

export async function getOAuthClientCredentialsToken(
  modelId: string,
  tokenUrl: string,
  authKeyEnvVar: string,
  scopeEnvVar: string | null,
): Promise<string> {
  const cached = tokenCache.get(modelId);
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
    return cached.value;
  }

  const authKey = process.env[authKeyEnvVar];
  if (!authKey) throw new Error(`${authKeyEnvVar} not configured`);
  const scope = scopeEnvVar ? process.env[scopeEnvVar] : undefined;

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: crypto.randomUUID(),
      Authorization: `Basic ${authKey}`,
    },
    body: new URLSearchParams(scope ? { scope } : {}),
    signal: AbortSignal.timeout(15_000),
    // NOTE: some providers (e.g. GigaChat) use a TLS chain signed by a root CA
    // not in Node's default trust store (Russian Mintsifry CA for GigaChat).
    // Install that CA and pass it via a custom https.Agent / NODE_EXTRA_CA_CERTS
    // — do not disable certificate validation to work around it.
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OAuth token exchange failed: ${res.status} ${detail}`);
  }

  const data = (await res.json()) as { access_token: string; expires_at?: number; expires_in?: number };
  const expiresAt = data.expires_at ?? Date.now() + (data.expires_in ?? 1800) * 1000;
  tokenCache.set(modelId, { value: data.access_token, expiresAt });
  return data.access_token;
}
