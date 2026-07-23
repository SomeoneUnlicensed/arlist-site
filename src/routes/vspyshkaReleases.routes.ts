import { Router } from 'express';
import express from 'express';
import { uploadRelease, markLatestRelease, downloadRelease } from '../controllers/vspyshkaReleases.controller.js';
import { authenticateReleaseUpload } from '../middleware/releaseUploadAuth.middleware.js';

// Internal, CI-only upload API. Not mounted under /api/v1 (the customer-facing LLM proxy) since
// this has nothing to do with model access - it's how the rust-release GitHub Actions workflow
// publishes Вспышка's own binaries to be hosted from arlist.ru instead of npm/GitHub Releases.
export const vspyshkaReleaseUploadRoutes = Router();
vspyshkaReleaseUploadRoutes.use(authenticateReleaseUpload);
vspyshkaReleaseUploadRoutes.use(express.raw({ type: '*/*', limit: '200mb' }));
vspyshkaReleaseUploadRoutes.post('/upload', uploadRelease);
vspyshkaReleaseUploadRoutes.post('/latest', markLatestRelease);

// Public download surface, e.g. https://arlist.ru/dl/vspyshka/latest/vspyshka-win32-x64.zip
export const vspyshkaReleaseDownloadRoutes = Router();
vspyshkaReleaseDownloadRoutes.get('/:version/:filename', downloadRelease);
