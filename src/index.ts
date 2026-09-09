import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import captchaRoutes from './routes/captcha.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import arlistApiRoutes from './routes/arlistApi.routes.js';
import cliAuthRoutes from './routes/cliAuth.routes.js';
import llmProxyRoutes from './routes/llmProxy.routes.js';
import { vspyshkaReleaseUploadRoutes, vspyshkaReleaseDownloadRoutes } from './routes/vspyshkaReleases.routes.js';
import oidcProvider from './services/oidc.service.js';
import { ensureDefaultFreeTariff } from './services/defaultTariff.service.js';
import statusRoutes from './routes/status.routes.js';
import { ensureDefaultStatusComponents } from './services/defaultStatusComponents.service.js';
import { systemLogMiddleware } from './middleware/systemLog.middleware.js';
import { pruneSystemLogs, writeSystemLog } from './services/systemLog.service.js';
import { ensureStatusPageSettings } from './services/statusPageSettings.service.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('[process] Unhandled Rejection:', reason);
  void writeSystemLog({ level: 'ERROR', category: 'SYSTEM', event: 'Необработанное отклонение Promise', metadata: { message: reason instanceof Error ? reason.message : String(reason) } });
});
process.on('uncaughtException', (err) => {
  console.error('[process] Uncaught Exception:', err);
  void writeSystemLog({ level: 'ERROR', category: 'SYSTEM', event: 'Необработанное исключение процесса', metadata: { message: err.message } });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8086;

app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(systemLogMiddleware);

// API routes
app.use('/interaction', interactionRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1', arlistApiRoutes);
app.use('/api/cli/auth', cliAuthRoutes);
app.use('/api/v1', llmProxyRoutes);
app.use('/api/internal/vspyshka-releases', vspyshkaReleaseUploadRoutes);
app.use('/dl/vspyshka', vspyshkaReleaseDownloadRoutes);
app.use('/api/status', statusRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// React SPA routes
app.get(['/', '/products', '/forEdu', '/contacts', '/docs', '/landings', '/legal', '/legal/geotekt-policies', '/promo', '/promo/manifest', '/vspyshka', '/grusnub', '/knots', '/login', '/register', '/verify', '/profile', '/admin', '/privacy-policy', '/forgot-password', '/reset-password', '/cli/auth', '/status', '/transparency', '/transparancy'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-client/index.html'));
});

// SPA static assets
app.use(express.static(path.join(__dirname, '../dist-client'), { index: false }));

// React SPA fallback must run before oidc-provider: the provider responds with
// its own 404 for unknown paths instead of delegating them to React Router.
const oidcPaths = ['/auth', '/token', '/me', '/jwks', '/session'];
app.get(/.*/, (req, res, next) => {
  const isBackendPath = req.path.startsWith('/api')
    || req.path.startsWith('/interaction')
    || req.path.startsWith('/.well-known')
    || oidcPaths.some((route) => req.path === route || req.path.startsWith(`${route}/`));
  if (isBackendPath) return next();
  return res.sendFile(path.join(__dirname, '../dist-client/index.html'));
});

// OIDC Provider
app.use(oidcProvider.callback());

const startServer = async () => {
  const prunedLogs = await pruneSystemLogs();

  const createdComponents = await ensureDefaultStatusComponents();
  if (createdComponents > 0) console.log(`[status] Created ${createdComponents} default component(s)`);
  await ensureStatusPageSettings();

  const { assignedUsers } = await ensureDefaultFreeTariff();
  if (assignedUsers > 0) console.log(`[tariffs] FREE assigned to ${assignedUsers} user(s)`);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`OIDC Issuer: ${process.env.ISSUER_URL || 'http://localhost:8086'}`);
    void writeSystemLog({
      category: 'SYSTEM',
      event: 'Сервер запущен',
      metadata: { port: Number(PORT), prunedLogs },
    });
  });
};

startServer().catch((error) => {
  console.error('[startup] Failed to initialize the default tariff', error);
  process.exit(1);
});
