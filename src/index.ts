import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import oidcProvider from './services/oidc.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8086;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Interaction Routes
app.use('/interaction', interactionRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// OIDC Provider
app.use(oidcProvider.callback());

// SPA fallback BEFORE OIDC-conflicting static routes
// /login, /register, /verify are React routes — must not be intercepted by oidc-provider's /auth endpoint
app.get(['/login', '/register', '/verify', '/profile', '/admin'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-client/index.html'));
});

// Serve React SPA static assets (JS/CSS chunks)
app.use(express.static(path.join(__dirname, '../dist-client')));

// Serve static HTML landing pages
app.use(express.static(path.join(__dirname, '../html')));

// General fallback for landing pages
app.get(/^(?!\/api|\/interaction|\/oidc).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../html/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`OIDC Issuer: ${process.env.ISSUER_URL || 'http://localhost:8086'}`);
});
