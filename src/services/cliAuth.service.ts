import crypto from 'crypto';
import prisma from './prisma.service.js';

const DEVICE_CODE_EXPIRY = 60 * 60_000;
const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateUserCode(): string {
  const part1 = Array.from({ length: 4 }, () =>
    CODE_CHARSET[crypto.randomInt(CODE_CHARSET.length)]
  ).join('');
  const part2 = Array.from({ length: 4 }, () =>
    CODE_CHARSET[crypto.randomInt(CODE_CHARSET.length)]
  ).join('');
  return `${part1}-${part2}`;
}

function generateDeviceCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateApiKey(): string {
  return `arlist_sk_${crypto.randomBytes(24).toString('hex')}`;
}

export async function createDeviceAuth() {
  const deviceCode = generateDeviceCode();
  const userCode = generateUserCode();

  await prisma.deviceCode.create({
    data: {
      deviceCode,
      userCode,
      expiresAt: new Date(Date.now() + DEVICE_CODE_EXPIRY),
    },
  });

  return {
    deviceCode,
    userCode,
    verificationUri: `/cli/auth?code=${userCode}`,
    expiresIn: DEVICE_CODE_EXPIRY / 1000,
  };
}

export async function confirmDevice(userCode: string, userId: string) {
  const record = await prisma.deviceCode.findUnique({ where: { userCode } });
  if (!record) return { ok: false, error: 'Invalid code' };
  if (record.isConfirmed) return { ok: false, error: 'Already confirmed' };
  if (record.expiresAt < new Date()) return { ok: false, error: 'Code expired' };

  await prisma.deviceCode.update({
    where: { id: record.id },
    data: { userId, isConfirmed: true },
  });

  return { ok: true };
}

export async function pollDeviceAuth(deviceCode: string) {
  const record = await prisma.deviceCode.findUnique({
    where: { deviceCode },
    include: {
      user: {
        include: { tariff: true },
      },
    },
  });

  if (!record) return { status: 'invalid' as const };
  if (record.expiresAt < new Date()) return { status: 'expired' as const };

  if (!record.isConfirmed || !record.user) {
    return { status: 'pending' as const };
  }

  const apiKey = await getOrCreateApiKey(record.user.id);

  return {
    status: 'confirmed' as const,
    apiKey: apiKey.key,
    tariff: {
      type: record.user.tariff?.type ?? 'FREE',
      name: record.user.tariff?.name ?? 'Бесплатный',
      creditsPer5h: record.user.tariff?.creditsPer5h ?? 50000,
      creditsPerWeek: record.user.tariff?.creditsPerWeek ?? 300000,
    },
  };
}

// The API key is created and rotated only through login; there is no user-facing
// key-management UI (deliberately — one key per account, tied to the CLI login flow).
async function getOrCreateApiKey(userId: string) {
  const existing = await prisma.apiKey.findFirst({
    where: { userId, isRevoked: false },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) return existing;

  return prisma.apiKey.create({
    data: {
      key: generateApiKey(),
      userId,
      name: 'CLI',
    },
  });
}
