import { Request, Response, NextFunction } from 'express';
import prisma from '../services/prisma.service.js';

export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const key = header.slice(7);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        user: { include: { tariff: true } },
      },
    });

    if (!apiKey || apiKey.isRevoked) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    if (apiKey.user.isBanned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    (req as any).apiKey = apiKey;
    (req as any).user = {
      userId: apiKey.user.id,
      role: apiKey.user.role,
      tariff: apiKey.user.tariff,
      creditsPer5hOverride: apiKey.user.creditsPer5hOverride,
      creditsPerWeekOverride: apiKey.user.creditsPerWeekOverride,
      modelsOverrideEnabled: apiKey.user.modelsOverrideEnabled,
      modelsOverride: apiKey.user.modelsOverride,
    };

    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
