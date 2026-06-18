import { Request, Response } from 'express';
import prisma from '../services/prisma.service.js';
import crypto from 'crypto';

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
    if (!name || !redirectUris || !Array.isArray(redirectUris)) {
      return res.status(400).json({ error: 'Invalid input' });
    }
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

// ── Users ─────────────────────────────────────────────────

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isVerified: true, isBanned: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
    const { id } = req.params;
    const self = (req as any).user?.userId;
    const { isBanned, role } = req.body;
    if (id === self && isBanned === true) return res.status(400).json({ error: 'Нельзя забанить себя' });
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(isBanned !== undefined ? { isBanned: Boolean(isBanned) } : {}),
        ...(role !== undefined ? { role } : {}),
      },
      select: { id: true, email: true, role: true, isBanned: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
