import crypto from 'crypto';
import { createChallenge, verifySolution } from 'altcha-lib/v1';

let devHmacKey: string | undefined;

export function getAltchaHmacKey(): string {
  const configured = process.env.ALTCHA_HMAC_KEY;
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('ALTCHA_HMAC_KEY must be set in production.');
  }

  console.warn('[altcha] ALTCHA_HMAC_KEY is not set; using an ephemeral dev key.');
  devHmacKey ??= crypto.randomBytes(32).toString('hex');
  return devHmacKey;
}

export function issueAltchaChallenge() {
  return createChallenge({
    hmacKey: getAltchaHmacKey(),
    maxNumber: 100_000,
  });
}

export function verifyAltchaPayload(payload: unknown) {
  if (typeof payload !== 'string' || payload.length === 0) {
    return Promise.resolve(false);
  }

  return verifySolution(payload, getAltchaHmacKey());
}
