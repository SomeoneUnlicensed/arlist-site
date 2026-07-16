import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import captchaRoutes from './routes/captcha.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import arlistApiRoutes from './routes/arlistApi.routes.js';
import cliAuthRoutes from './routes/cliAuth.routes.js';
import llmProxyRoutes from './routes/llmProxy.routes.js';
import oidcProvider from './services/oidc.service.js';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('[process] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[process] Uncaught Exception:', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8086;

app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use('/interaction', interactionRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1', arlistApiRoutes);
app.use('/api/cli/auth', cliAuthRoutes);
app.use('/api/v1', llmProxyRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// React SPA routes
app.get(['/login', '/register', '/verify', '/profile', '/admin', '/privacy-policy', '/forgot-password', '/reset-password', '/cli/auth'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-client/index.html'));
});

// SPA static assets
app.use(express.static(path.join(__dirname, '../dist-client'), { index: false }));

// Static HTML landing pages
app.use(express.static(path.join(__dirname, '../html')));

// OIDC Provider
app.use(oidcProvider.callback());

// Fallback for landing pages
app.get(/^(?!\/api|\/interaction|\/oidc).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../html/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`OIDC Issuer: ${process.env.ISSUER_URL || 'http://localhost:8086'}`);
});
