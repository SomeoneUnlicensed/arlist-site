import { Request, Response } from 'express';
import prisma from '../services/prisma.service.js';
import crypto from 'crypto';
import { getSettings, saveSettings } from '../services/settings.service.js';
import { sendCustomEmail } from '../services/mail.service.js';

// ── Stats ─────────────────────────────────────────────────

export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, verifiedUsers, bannedUsers, totalClients] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.oAuthClient.count(),
    ]);
    res.json({ totalUsers, verifiedUsers, bannedUsers, totalClients });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── OIDC Clients ──────────────────────────────────────────

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.oAuthClient.findMany({
      select: { id: true, clientId: true, name: true, redirectUris: true, isTrusted: true, createdAt: true },
    });
    res.json(clients);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, redirectUris, isTrusted } = req.body;
    if (!name || !redirectUris || !Array.isArray(redirectUris))
      return res.status(400).json({ error: 'Invalid input' });

    const client = await prisma.oAuthClient.create({
      data: {
        name,
        clientId: crypto.randomBytes(16).toString('hex'),
        clientSecret: crypto.randomBytes(32).toString('hex'),
        redirectUris,
        isTrusted: Boolean(isTrusted),
      },
    });
    res.status(201).json(client);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.oAuthClient.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Users ─────────────────────────────────────────────────

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isVerified: true, isBanned: true, balanceKopecks: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const self = (req as any).user?.userId;
    if (id === self) return res.status(400).json({ error: 'Нельзя удалить себя' });
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const self = (req as any).user?.userId;
    const { isBanned, role, isVerified, balanceKopecks } = req.body;
    if (id === self && isBanned === true) return res.status(400).json({ error: 'Нельзя забанить себя' });
    if (id === self && role !== undefined && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Нельзя снять с себя права администратора' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(isBanned !== undefined ? { isBanned: Boolean(isBanned) } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(isVerified !== undefined ? { isVerified: Boolean(isVerified) } : {}),
        ...(balanceKopecks !== undefined ? { balanceKopecks: Number(balanceKopecks) } : {}),
      },
      select: { id: true, email: true, role: true, isBanned: true, isVerified: true, balanceKopecks: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    res.json(getSettings());
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const { registrationMode, email2faEnabled } = req.body;
    if (registrationMode && !['OPEN', 'CLOSED'].includes(registrationMode)) {
      return res.status(400).json({ error: 'Invalid registrationMode value' });
    }
    const updated = saveSettings({
      ...(registrationMode ? { registrationMode } : {}),
      ...(email2faEnabled !== undefined ? { email2faEnabled: Boolean(email2faEnabled) } : {}),
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMailBroadcast = async (req: Request, res: Response) => {
  try {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing to, subject, or html' });
    }

    if (to === 'all') {
      const users = await prisma.user.findMany({ select: { email: true } });
      const emails = users.map(u => u.email).filter(Boolean);

      Promise.all(emails.map(email =>
        sendCustomEmail(email, subject, html).catch(err => {
          console.error(`Failed to send broadcast email to ${email}:`, err);
        })
      ));

      return res.json({ message: `Рассылка успешно запущена для ${emails.length} пользователей` });
    } else {
      await sendCustomEmail(to, subject, html);
      return res.json({ message: `Письмо успешно отправлено на адрес ${to}` });
    }
  } catch (error: any) {
    console.error('Mail broadcast error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
