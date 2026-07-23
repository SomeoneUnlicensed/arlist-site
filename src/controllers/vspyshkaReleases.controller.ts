import type { Request, Response } from 'express';
import {
  uploadReleaseAsset, setLatestVersion, getLatestVersion, getReleaseAsset,
  getAnnouncements, setAnnouncements, type Announcement,
} from '../services/releaseStorage.service.js';

const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?$/;
const FILENAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const uploadRelease = async (req: Request, res: Response) => {
  try {
    const version = String(req.query.version || '');
    const filename = String(req.query.filename || '');
    if (!VERSION_PATTERN.test(version)) return res.status(400).json({ error: 'Invalid version' });
    if (!FILENAME_PATTERN.test(filename)) return res.status(400).json({ error: 'Invalid filename' });

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks);
    if (body.length === 0) return res.status(400).json({ error: 'Empty body' });

    await uploadReleaseAsset(version, filename, body);
    res.json({ ok: true, version, filename, bytes: body.length });
  } catch (error: any) {
    console.error('Vspyshka release upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markLatestRelease = async (req: Request, res: Response) => {
  try {
    const version = String(req.query.version || '');
    if (!VERSION_PATTERN.test(version)) return res.status(400).json({ error: 'Invalid version' });
    await setLatestVersion(version);
    res.json({ ok: true, version });
  } catch (error: any) {
    console.error('Vspyshka mark-latest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Public: what the TUI's startup update/announcement check calls, once, instead of GitHub's API
// or npm's registry.
export const getVersionInfo = async (_req: Request, res: Response) => {
  try {
    const [version, announcements] = await Promise.all([getLatestVersion(), getAnnouncements()]);
    res.json({ version, announcements });
  } catch (error: any) {
    console.error('Vspyshka version-info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin-authenticated (reuses the existing admin JWT middleware, mounted in admin.routes.ts) -
// this is ongoing content management, not a one-shot CI credential.
export const getAnnouncementsAdmin = async (_req: Request, res: Response) => {
  try {
    res.json(await getAnnouncements());
  } catch (error: any) {
    console.error('Vspyshka announcements fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAnnouncements = async (req: Request, res: Response) => {
  try {
    const body = req.body?.announcements;
    if (!Array.isArray(body)) return res.status(400).json({ error: 'announcements must be an array' });
    const announcements: Announcement[] = body.map((item: any) => ({
      message: String(item.message ?? '').trim(),
      minVersion: item.minVersion ? String(item.minVersion) : undefined,
      maxVersion: item.maxVersion ? String(item.maxVersion) : undefined,
    })).filter((item: Announcement) => item.message.length > 0);
    await setAnnouncements(announcements);
    res.json({ ok: true, announcements });
  } catch (error: any) {
    console.error('Vspyshka announcements update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadRelease = async (req: Request, res: Response) => {
  try {
    let version = String(req.params.version);
    const filename = String(req.params.filename);
    if (!FILENAME_PATTERN.test(filename)) return res.status(400).json({ error: 'Invalid filename' });

    if (version === 'latest') {
      const resolved = await getLatestVersion();
      if (!resolved) return res.status(404).json({ error: 'No release published yet' });
      version = resolved;
    }
    if (!VERSION_PATTERN.test(version)) return res.status(400).json({ error: 'Invalid version' });

    const object = await getReleaseAsset(version, filename);
    if (!object || !object.Body) return res.status(404).json({ error: 'Not found' });

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (object.ContentLength) res.setHeader('Content-Length', String(object.ContentLength));
    (object.Body as NodeJS.ReadableStream).pipe(res);
  } catch (error: any) {
    console.error('Vspyshka release download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
