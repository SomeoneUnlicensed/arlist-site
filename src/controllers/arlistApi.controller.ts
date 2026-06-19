import { Request, Response } from 'express';
import prisma from '../services/prisma.service.js';

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isVerified: true,
  isBanned: true,
  createdAt: true,
};

// Trusted clients additionally get balance — reserved for future billing integration.
function withBalance(user: any, isTrusted: boolean) {
  if (!isTrusted) return user;
  return { ...user, balanceKopecks: user.balanceKopecks };
}

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const client = (req as any).client;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { ...userPublicSelect, balanceKopecks: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(withBalance(user, client.isTrusted));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params as { email: string };
    const client = (req as any).client;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { ...userPublicSelect, balanceKopecks: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(withBalance(user, client.isTrusted));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
