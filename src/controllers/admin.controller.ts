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
      select: {
        id: true, email: true, name: true, role: true, isVerified: true, isBanned: true, balanceKopecks: true, createdAt: true,
        creditsPer5hOverride: true, creditsPerWeekOverride: true, modelsOverrideEnabled: true, modelsOverride: true,
      },
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

// Персональные исключения из тарифа для конкретного пользователя — лимиты и
// список моделей. null/false в теле запроса возвращает соответствующее поле
// обратно к значению тарифа.
export const updateUserLimits = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { creditsPer5hOverride, creditsPerWeekOverride, modelsOverrideEnabled, modelsOverride } = req.body;

    if (modelsOverride !== undefined) {
      if (!Array.isArray(modelsOverride) || !modelsOverride.every((m) => typeof m === 'string')) {
        return res.status(400).json({ error: 'modelsOverride must be an array of strings' });
      }
      if (!modelsOverride.includes('*')) {
        const known = await prisma.aiModel.findMany({ select: { key: true } });
        const knownKeys = new Set(known.map((m) => m.key));
        const unknown = modelsOverride.filter((m: string) => !knownKeys.has(m));
        if (unknown.length > 0) {
          return res.status(400).json({ error: `Unknown model(s): ${unknown.join(', ')}` });
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(creditsPer5hOverride !== undefined
          ? { creditsPer5hOverride: creditsPer5hOverride === null ? null : Number(creditsPer5hOverride) }
          : {}),
        ...(creditsPerWeekOverride !== undefined
          ? { creditsPerWeekOverride: creditsPerWeekOverride === null ? null : Number(creditsPerWeekOverride) }
          : {}),
        ...(modelsOverrideEnabled !== undefined ? { modelsOverrideEnabled: Boolean(modelsOverrideEnabled) } : {}),
        ...(modelsOverride !== undefined ? { modelsOverride } : {}),
      },
      select: {
        id: true,
        creditsPer5hOverride: true,
        creditsPerWeekOverride: true,
        modelsOverrideEnabled: true,
        modelsOverride: true,
      },
    });
    res.json(user);
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'User not found' });
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

// ── Tariffs ───────────────────────────────────────────────

export const getTariffs = async (req: Request, res: Response) => {
  try {
    const tariffs = await prisma.tariff.findMany({ orderBy: { priceMonth: 'asc' } });
    res.json(tariffs);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function validateModelKeys(models: unknown): Promise<string | null> {
  if (!Array.isArray(models) || !models.every((m) => typeof m === 'string')) {
    return 'models must be an array of strings';
  }
  if (models.includes('*')) return null;
  const known = await prisma.aiModel.findMany({ select: { key: true } });
  const knownKeys = new Set(known.map((m) => m.key));
  const unknown = models.filter((m: string) => !knownKeys.has(m));
  if (unknown.length > 0) return `Unknown model(s): ${unknown.join(', ')}`;
  return null;
}

export const updateTariff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, models, creditsPer5h, creditsPerWeek, overrunEnabled, overrunPriceKopecks, priceMonth } = req.body;

    if (models !== undefined) {
      const error = await validateModelKeys(models);
      if (error) return res.status(400).json({ error });
    }

    const tariff = await prisma.tariff.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(models !== undefined ? { models } : {}),
        ...(creditsPer5h !== undefined ? { creditsPer5h: Number(creditsPer5h) } : {}),
        ...(creditsPerWeek !== undefined ? { creditsPerWeek: Number(creditsPerWeek) } : {}),
        ...(overrunEnabled !== undefined ? { overrunEnabled: Boolean(overrunEnabled) } : {}),
        ...(overrunPriceKopecks !== undefined ? { overrunPriceKopecks: Number(overrunPriceKopecks) } : {}),
        ...(priceMonth !== undefined ? { priceMonth: Number(priceMonth) } : {}),
      },
    });
    res.json(tariff);
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Tariff not found' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getKnownModels = async (req: Request, res: Response) => {
  try {
    const models = await prisma.aiModel.findMany({ select: { key: true }, orderBy: { key: 'asc' } });
    res.json({ models: models.map((m) => m.key) });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── AI Models (data-driven provider registry) ──────────────

export const getAiModels = async (req: Request, res: Response) => {
  try {
    const models = await prisma.aiModel.findMany({ orderBy: { key: 'asc' } });
    res.json(models);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const WIRE_PROTOCOLS = ['OPENAI_COMPATIBLE', 'YANDEXGPT'];
const AUTH_METHODS = ['BEARER_ENV', 'OAUTH2_CLIENT_CREDENTIALS', 'API_KEY_HEADER'];

export const createAiModel = async (req: Request, res: Response) => {
  try {
    const {
      key, label, wireProtocol, authMethod, baseUrl, upstreamModel,
      apiKeyEnvVar, headerName, extraHeaderName, extraHeaderEnvVar,
      oauthTokenUrl, oauthScopeEnvVar, isEnabled,
    } = req.body;

    if (!key || !label || !baseUrl || !upstreamModel) {
      return res.status(400).json({ error: 'key, label, baseUrl, upstreamModel required' });
    }
    if (!WIRE_PROTOCOLS.includes(wireProtocol)) {
      return res.status(400).json({ error: `wireProtocol must be one of: ${WIRE_PROTOCOLS.join(', ')}` });
    }
    if (!AUTH_METHODS.includes(authMethod)) {
      return res.status(400).json({ error: `authMethod must be one of: ${AUTH_METHODS.join(', ')}` });
    }

    const model = await prisma.aiModel.create({
      data: {
        key, label, wireProtocol, authMethod, baseUrl, upstreamModel,
        apiKeyEnvVar: apiKeyEnvVar ?? null,
        headerName: headerName ?? null,
        extraHeaderName: extraHeaderName ?? null,
        extraHeaderEnvVar: extraHeaderEnvVar ?? null,
        oauthTokenUrl: oauthTokenUrl ?? null,
        oauthScopeEnvVar: oauthScopeEnvVar ?? null,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
      },
    });
    res.status(201).json(model);
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Model key already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAiModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const {
      key, label, wireProtocol, authMethod, baseUrl, upstreamModel,
      apiKeyEnvVar, headerName, extraHeaderName, extraHeaderEnvVar,
      oauthTokenUrl, oauthScopeEnvVar, isEnabled,
    } = req.body;

    if (wireProtocol !== undefined && !WIRE_PROTOCOLS.includes(wireProtocol)) {
      return res.status(400).json({ error: `wireProtocol must be one of: ${WIRE_PROTOCOLS.join(', ')}` });
    }
    if (authMethod !== undefined && !AUTH_METHODS.includes(authMethod)) {
      return res.status(400).json({ error: `authMethod must be one of: ${AUTH_METHODS.join(', ')}` });
    }

    const model = await prisma.aiModel.update({
      where: { id },
      data: {
        ...(key !== undefined ? { key } : {}),
        ...(label !== undefined ? { label } : {}),
        ...(wireProtocol !== undefined ? { wireProtocol } : {}),
        ...(authMethod !== undefined ? { authMethod } : {}),
        ...(baseUrl !== undefined ? { baseUrl } : {}),
        ...(upstreamModel !== undefined ? { upstreamModel } : {}),
        ...(apiKeyEnvVar !== undefined ? { apiKeyEnvVar } : {}),
        ...(headerName !== undefined ? { headerName } : {}),
        ...(extraHeaderName !== undefined ? { extraHeaderName } : {}),
        ...(extraHeaderEnvVar !== undefined ? { extraHeaderEnvVar } : {}),
        ...(oauthTokenUrl !== undefined ? { oauthTokenUrl } : {}),
        ...(oauthScopeEnvVar !== undefined ? { oauthScopeEnvVar } : {}),
        ...(isEnabled !== undefined ? { isEnabled: Boolean(isEnabled) } : {}),
      },
    });
    res.json(model);
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Model not found' });
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Model key already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAiModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.aiModel.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Model not found' });
    res.status(500).json({ error: 'Internal server error' });
  }
};
