import { Response, NextFunction } from 'express';
import { checkLimits } from '../services/limits.service.js';

export const rateLimit = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limits = await checkLimits(userId);

    res.setHeader('X-RateLimit-Used-Percent-5h', limits.usagePercent.per5h);
    res.setHeader('X-RateLimit-Used-Percent-Week', limits.usagePercent.week);
    res.setHeader('X-Wallet-Balance-Kopecks', limits.balanceKopecks);

    if (!limits.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        usagePercent: limits.usagePercent,
        remaining: limits.remaining,
        balanceKopecks: limits.balanceKopecks,
        overrunPriceKopecksPer1k: limits.overrunPriceKopecksPer1k,
      });
    }

    // Downstream controller needs this to know whether to bill the wallet for this request.
    req.overrun = limits.overrun;
    req.overrunPriceKopecksPer1k = limits.overrunPriceKopecksPer1k;

    next();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
