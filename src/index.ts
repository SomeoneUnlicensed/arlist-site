import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import arlistApiRoutes from './routes/arlistApi.routes.js';
import oidcProvider from './services/oidc.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8086;

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API and OIDC interaction routes
app.use('/interaction', interactionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1', arlistApiRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// React SPA routes must come BEFORE oidcProvider.callback() because
// oidc-provider is a Koa app that returns 404 for unknown paths without calling next()
app.get(['/login', '/register', '/verify', '/profile', '/admin', '/privacy-policy'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-client/index.html'));
});

// SPA static assets (JS/CSS chunks)
app.use(express.static(path.join(__dirname, '../dist-client')));

// OIDC Provider handles /auth, /token, /userinfo, /.well-known, etc.
app.use(oidcProvider.callback());

// Static HTML landing pages
app.use(express.static(path.join(__dirname, '../html')));

// Fallback for landing pages
app.get(/^(?!\/api|\/interaction|\/oidc).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../html/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`OIDC Issuer: ${process.env.ISSUER_URL || 'http://localhost:8086'}`);
});
