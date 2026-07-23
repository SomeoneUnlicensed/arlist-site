import type { AiModel } from '@prisma/client';
import crypto from 'crypto';
import { decryptSecret } from './secretCrypto.service.js';

const REFRESH_MARGIN_MS = 60_000;
const tokenCache = new Map<string, { value: string; expiresAt: number }>();

export function invalidateModelAuth(modelId: string): void {
  tokenCache.delete(modelId);
}

/**
 * Resolves the actual secret value for a model's primary auth key: an admin-entered
 * apiKeySecret (encrypted at rest) takes priority so a model can be fully configured from the
 * admin UI, falling back to the legacy apiKeyEnvVar server environment variable.
 */
export function resolveModelApiKey(row: Pick<AiModel, 'key' | 'apiKeySecret' | 'apiKeyEnvVar'>): string {
  if (row.apiKeySecret) return decryptSecret(row.apiKeySecret);
  if (row.apiKeyEnvVar) {
    const value = process.env[row.apiKeyEnvVar];
    if (value) return value;
    throw new Error(`${row.apiKeyEnvVar} not configured`);
  }
  throw new Error(`${row.key}: no API key configured (set one via the admin panel)`);
}

export async function getOAuthClientCredentialsToken(
  modelId: string,
  tokenUrl: string,
  authKey: string,
  scopeEnvVar: string | null,
): Promise<string> {
  const cached = tokenCache.get(modelId);
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cached.value;

  const scope = scopeEnvVar ? process.env[scopeEnvVar] : undefined;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: crypto.randomUUID(),
      Authorization: `Basic ${authKey}`,
    },
    body: new URLSearchParams(scope ? { scope } : {}),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as { access_token?: string; expires_at?: number; expires_in?: number };
  if (!data.access_token) throw new Error('OAuth token exchange returned no access_token');
  const expiresAt = data.expires_at ?? Date.now() + (data.expires_in ?? 1800) * 1000;
  tokenCache.set(modelId, { value: data.access_token, expiresAt });
  return data.access_token;
}
