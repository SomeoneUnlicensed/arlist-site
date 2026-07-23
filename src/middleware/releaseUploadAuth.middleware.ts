import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Authenticates the CI-only release upload endpoint against a single shared secret
 * (RELEASE_UPLOAD_TOKEN), not a per-user API key - there is exactly one legitimate caller
 * (the rust-release GitHub Actions workflow), so a DB-backed key isn't warranted here.
 */
export const authenticateReleaseUpload = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.RELEASE_UPLOAD_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'RELEASE_UPLOAD_TOKEN not configured' });
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }
  const provided = header.slice(7);

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  const matches = expectedBuf.length === providedBuf.length
    && crypto.timingSafeEqual(expectedBuf, providedBuf);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid upload token' });
  }

  next();
};
