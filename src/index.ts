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

// Serve React App for /auth, /profile, /admin
// React build is in ../dist-client
app.use(express.static(path.join(__dirname, '../dist-client')));

// Serve static files from the 'html' directory for everything else
app.use(express.static(path.join(__dirname, '../html')));

// Fallback for SPA (React routes)
app.get([/^\/auth\/.*/, '/profile', '/admin'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist-client/index.html'));
});

// General fallback
app.get(/^(?!\/api|\/interaction|\/oidc).*/, (req, res) => {
  // Check if it's a known static route, otherwise serve main index.html
  res.sendFile(path.join(__dirname, '../html/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`OIDC Issuer: ${process.env.ISSUER_URL || 'http://localhost:8086'}`);
});
