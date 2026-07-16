import { Request, Response } from 'express';
import { createDeviceAuth, confirmDevice, pollDeviceAuth } from '../services/cliAuth.service.js';
import { checkLimits } from '../services/limits.service.js';
import prisma from '../services/prisma.service.js';

export const start = async (req: Request, res: Response) => {
  try {
    const result = await createDeviceAuth();
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const confirm = async (req: any, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const result = await confirmDevice(code, userId);
    if (!result.ok) return res.status(400).json({ error: result.error });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const poll = async (req: Request, res: Response) => {
  try {
    const { deviceCode } = req.body;
    if (!deviceCode) return res.status(400).json({ error: 'deviceCode required' });

    const result = await pollDeviceAuth(deviceCode);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsageStats = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const [limits, totalTokens, user] = await Promise.all([
      checkLimits(userId),
      prisma.usageRecord.aggregate({
        where: { userId },
        _sum: { promptTokens: true, outputTokens: true },
      }),
      prisma.user.findUnique({ where: { id: userId }, include: { tariff: true } }),
    ]);

    res.json({
      usagePercent: limits.usagePercent,
      remaining: limits.remaining,
      wallet: {
        balanceKopecks: limits.balanceKopecks,
        overrunEnabled: user?.tariff?.overrunEnabled ?? false,
        overrunPriceKopecksPer1k: limits.overrunPriceKopecksPer1k,
      },
      tokens: {
        prompt: totalTokens._sum.promptTokens ?? 0,
        output: totalTokens._sum.outputTokens ?? 0,
      },
      tariff: {
        type: user?.tariff?.type ?? 'FREE',
        name: user?.tariff?.name ?? 'Бесплатный',
      },
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
