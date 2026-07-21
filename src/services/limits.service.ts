import prisma from './prisma.service.js';

// "Credits" == tokens (promptTokens + outputTokens). Metering by tokens instead of
// raw request count means a handful of huge-context requests can't quietly blow
// through a limit sized for many small ones.

export interface LimitCheck {
  allowed: boolean;
  // true if this request is past the plan's included quota and would be paid
  // from the user's wallet balance instead of being blocked outright.
  overrun: boolean;
  usagePercent: {
    per5h: number;
    week: number;
  };
  remaining: {
    per5h: number;
    perWeek: number;
  };
  balanceKopecks: number;
  overrunPriceKopecksPer1k: number;
}

function pct(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.round((used / limit) * 100);
}

async function sumCredits(userId: string, since: Date): Promise<number> {
  const agg = await prisma.usageRecord.aggregate({
    where: { userId, createdAt: { gte: since } },
    _sum: { promptTokens: true, outputTokens: true },
  });
  return (agg._sum.promptTokens ?? 0) + (agg._sum.outputTokens ?? 0);
}

export async function checkLimits(userId: string): Promise<LimitCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tariff: true },
  });

  if (!user || !user.tariff) {
    return {
      allowed: false,
      overrun: false,
      // No assigned tariff means "not configured", not "quota exhausted".
      usagePercent: { per5h: 0, week: 0 },
      remaining: { per5h: 0, perWeek: 0 },
      balanceKopecks: user?.balanceKopecks ?? 0,
      overrunPriceKopecksPer1k: 0,
    };
  }

  const tariff = user.tariff;
  const now = new Date();

  const [credits5h, creditsWeek] = await Promise.all([
    sumCredits(userId, new Date(now.getTime() - 5 * 3600_000)),
    sumCredits(userId, new Date(now.getTime() - 7 * 24 * 3600_000)),
  ]);

  const withinPlan = credits5h < tariff.creditsPer5h && creditsWeek < tariff.creditsPerWeek;

  let allowed = withinPlan;
  let overrun = false;

  if (!withinPlan) {
    // A single request's cost isn't known yet at check time, so overrun is gated
    // purely on whether the wallet has *any* balance left, not a specific price.
    const canOverrun = tariff.overrunEnabled && user.balanceKopecks > 0;
    allowed = canOverrun;
    overrun = canOverrun;
  }

  return {
    allowed,
    overrun,
    usagePercent: {
      per5h: pct(credits5h, tariff.creditsPer5h),
      week: pct(creditsWeek, tariff.creditsPerWeek),
    },
    remaining: {
      per5h: Math.max(0, tariff.creditsPer5h - credits5h),
      perWeek: Math.max(0, tariff.creditsPerWeek - creditsWeek),
    },
    balanceKopecks: user.balanceKopecks,
    overrunPriceKopecksPer1k: tariff.overrunPriceKopecks,
  };
}

export async function recordUsage(
  userId: string,
  apiKeyId: string | null,
  model: string,
  promptTokens: number,
  outputTokens: number,
  isOverrun: boolean,
  overrunPriceKopecksPer1k: number,
) {
  const credits = promptTokens + outputTokens;
  const costKopecks = isOverrun ? Math.ceil((credits / 1000) * overrunPriceKopecksPer1k) : 0;

  await prisma.$transaction([
    prisma.usageRecord.create({
      data: { userId, apiKeyId, model, promptTokens, outputTokens, isOverrun, costKopecks },
    }),
    ...(costKopecks > 0
      ? [prisma.user.update({ where: { id: userId }, data: { balanceKopecks: { decrement: costKopecks } } })]
      : []),
  ]);
}

export function isModelAllowed(tariffModels: string[], model: string): boolean {
  if (tariffModels.includes('*')) return true;
  return tariffModels.includes(model);
}
