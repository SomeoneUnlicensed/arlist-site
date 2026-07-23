import crypto from 'crypto';

// AES-256-GCM at-rest encryption for secrets an admin enters directly (e.g. model API keys),
// so they can live in the database instead of requiring a server-side environment variable per
// model. MODEL_KEY_ENCRYPTION_KEY must be a 32-byte key, given as 64 hex chars or base64.
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function loadKey(): Buffer {
  const raw = process.env.MODEL_KEY_ENCRYPTION_KEY;
  if (!raw) throw new Error('MODEL_KEY_ENCRYPTION_KEY not configured');
  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('MODEL_KEY_ENCRYPTION_KEY must decode to exactly 32 bytes');
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

export function decryptSecret(encoded: string): string {
  const key = loadKey();
  const raw = Buffer.from(encoded, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = raw.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
