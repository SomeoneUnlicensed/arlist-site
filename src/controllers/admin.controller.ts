import { Request, Response } from 'express';
import prisma from '../services/prisma.service.js';
import crypto from 'crypto';
import { getSettings, saveSettings } from '../services/settings.service.js';
import { sendCustomEmail } from '../services/mail.service.js';
import { invalidateModelRegistry } from '../services/modelRegistry.service.js';
import { invalidateModelAuth } from '../services/modelAuth.service.js';
import { encryptSecret } from '../services/secretCrypto.service.js';
import type { Prisma } from '@prisma/client';

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
    if (isBanned !== undefined && typeof isBanned !== 'boolean') return res.status(400).json({ error: 'isBanned must be a boolean' });
    if (isVerified !== undefined && typeof isVerified !== 'boolean') return res.status(400).json({ error: 'isVerified must be a boolean' });
    if (role !== undefined && !['USER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (balanceKopecks !== undefined && (!Number.isSafeInteger(Number(balanceKopecks)) || Number(balanceKopecks) < 0)) {
      return res.status(400).json({ error: 'balanceKopecks must be a non-negative integer' });
    }
    if (id === self && isBanned === true) return res.status(400).json({ error: 'Нельзя забанить себя' });
    if (id === self && role !== undefined && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Нельзя снять с себя права администратора' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(isBanned !== undefined ? { isBanned } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(isVerified !== undefined ? { isVerified } : {}),
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
    res.json(await getSettings());
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const { registrationMode, email2faEnabled } = req.body;
    if (registrationMode !== undefined && !['OPEN', 'CLOSED'].includes(registrationMode)) {
      return res.status(400).json({ error: 'Invalid registrationMode value' });
    }
    if (email2faEnabled !== undefined && typeof email2faEnabled !== 'boolean') {
      return res.status(400).json({ error: 'email2faEnabled must be a boolean' });
    }
    const updated = await saveSettings({
      ...(registrationMode !== undefined ? { registrationMode } : {}),
      ...(email2faEnabled !== undefined ? { email2faEnabled } : {}),
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
  if (!Array.isArray(models) || !models.every((model) => typeof model === 'string')) {
    return 'models must be an array of strings';
  }
  if (models.includes('*')) return models.length === 1 ? null : 'Wildcard * must be the only model in the list';
  const known = await prisma.aiModel.findMany({ select: { key: true } });
  const knownKeys = new Set(known.map((model) => model.key));
  const unknown = models.filter((model: string) => !knownKeys.has(model));
  return unknown.length ? `Unknown or disabled model(s): ${unknown.join(', ')}` : null;
}

export const updateTariff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, models, creditsPer5h, creditsPerWeek, overrunEnabled, overrunPriceKopecks, priceMonth } = req.body;

    if (models !== undefined) {
      const error = await validateModelKeys(models);
      if (error) return res.status(400).json({ error });
    }

    const integerFields = { creditsPer5h, creditsPerWeek, overrunPriceKopecks, priceMonth };
    for (const [field, value] of Object.entries(integerFields)) {
      if (value === undefined) continue;
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < 0) {
        return res.status(400).json({ error: `${field} must be a non-negative integer` });
      }
      if ((field === 'creditsPer5h' || field === 'creditsPerWeek') && number === 0) {
        return res.status(400).json({ error: `${field} must be greater than zero` });
      }
    }
    if (overrunEnabled !== undefined && typeof overrunEnabled !== 'boolean') {
      return res.status(400).json({ error: 'overrunEnabled must be a boolean' });
    }

    const tariff = await prisma.tariff.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(models !== undefined ? { models } : {}),
        ...(creditsPer5h !== undefined ? { creditsPer5h: Number(creditsPer5h) } : {}),
        ...(creditsPerWeek !== undefined ? { creditsPerWeek: Number(creditsPerWeek) } : {}),
        ...(overrunEnabled !== undefined ? { overrunEnabled } : {}),
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
    const models = await prisma.aiModel.findMany({ where: { isEnabled: true }, select: { key: true }, orderBy: { key: 'asc' } });
    res.json({ models: models.map((model) => model.key) });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── System logs ───────────────────────────────────────────

const LOG_LEVELS = ['INFO', 'WARN', 'ERROR'];
const LOG_CATEGORIES = ['SYSTEM', 'AUTH', 'SECURITY', 'ADMIN', 'API', 'STATUS', 'MAIL', 'OIDC'];

export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const level = typeof req.query.level === 'string' ? req.query.level.toUpperCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.toUpperCase() : '';
    const query = typeof req.query.query === 'string' ? req.query.query.trim().slice(0, 200) : '';
    const requestedLimit = Number(req.query.limit ?? 100);
    const limit = Number.isSafeInteger(requestedLimit) ? Math.min(200, Math.max(1, requestedLimit)) : 100;
    if (level && !LOG_LEVELS.includes(level)) return res.status(400).json({ error: 'Invalid log level' });
    if (category && !LOG_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid log category' });

    const where: Prisma.SystemLogWhereInput = {
      ...(level ? { level: level as any } : {}),
      ...(category ? { category: category as any } : {}),
      ...(query ? { OR: [
        { event: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
        { ipAddress: { contains: query, mode: 'insensitive' } },
        { path: { contains: query, mode: 'insensitive' } },
        { user: { is: { email: { contains: query, mode: 'insensitive' } } } },
      ] } : {}),
    };
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true, role: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
      }),
      prisma.systemLog.count({ where }),
    ]);
    res.json({ logs, total, limit });
  } catch {
    res.status(500).json({ error: 'Не удалось загрузить системные логи' });
  }
};

// ── AI model registry ─────────────────────────────────────

const WIRE_PROTOCOLS = ['OPENAI_COMPATIBLE', 'YANDEXGPT', 'ANTHROPIC'] as const;
const AUTH_METHODS = ['BEARER_ENV', 'OAUTH2_CLIENT_CREDENTIALS', 'API_KEY_HEADER'] as const;
const ENV_NAME_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const MODEL_KEY_PATTERN = /^[a-z0-9][a-z0-9._/-]*$/;

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function validateModelInput(body: any, partial = false): string | null {
  const required = ['key', 'label', 'wireProtocol', 'authMethod', 'baseUrl', 'upstreamModel'];
  if (!partial) {
    const missing = required.filter((field) => !String(body[field] ?? '').trim());
    if (missing.length) return `Required fields: ${missing.join(', ')}`;
  }
  if (body.key !== undefined && !MODEL_KEY_PATTERN.test(String(body.key))) {
    return 'Model key may contain lowercase letters, digits, dot, slash, underscore and hyphen';
  }
  if (body.wireProtocol !== undefined && !WIRE_PROTOCOLS.includes(body.wireProtocol)) {
    return `wireProtocol must be one of: ${WIRE_PROTOCOLS.join(', ')}`;
  }
  if (body.authMethod !== undefined && !AUTH_METHODS.includes(body.authMethod)) {
    return `authMethod must be one of: ${AUTH_METHODS.join(', ')}`;
  }
  if (body.isEnabled !== undefined && typeof body.isEnabled !== 'boolean') {
    return 'isEnabled must be a boolean';
  }
  if (body.baseUrl !== undefined) {
    try {
      const url = new URL(String(body.baseUrl));
      if (url.protocol !== 'https:' && url.hostname !== 'localhost') return 'baseUrl must use HTTPS';
    } catch { return 'baseUrl must be a valid URL'; }
  }
  if (optionalText(body.oauthTokenUrl)) {
    try {
      const url = new URL(String(body.oauthTokenUrl));
      if (url.protocol !== 'https:' && url.hostname !== 'localhost') return 'oauthTokenUrl must use HTTPS';
    } catch { return 'oauthTokenUrl must be a valid URL'; }
  }
  for (const field of ['apiKeyEnvVar', 'extraHeaderEnvVar', 'oauthScopeEnvVar']) {
    const value = optionalText(body[field]);
    if (value && !ENV_NAME_PATTERN.test(value)) return `${field} must be an environment variable name`;
  }
  if (!partial) {
    if (!optionalText(body.apiKeyEnvVar) && !optionalText(body.apiKey) && !body.hasApiKeySecret) {
      return 'apiKey (entered directly) or apiKeyEnvVar is required';
    }
    if (body.authMethod === 'API_KEY_HEADER' && body.wireProtocol === 'OPENAI_COMPATIBLE' && !optionalText(body.headerName)) {
      return 'headerName is required for API_KEY_HEADER';
    }
    if (body.authMethod === 'OAUTH2_CLIENT_CREDENTIALS' && !optionalText(body.oauthTokenUrl)) return 'oauthTokenUrl is required for OAuth2';
    if (body.wireProtocol === 'YANDEXGPT' && (!optionalText(body.extraHeaderName) || !optionalText(body.extraHeaderEnvVar))) {
      return 'extraHeaderName and extraHeaderEnvVar are required for YandexGPT';
    }
  }
  return null;
}

/** Strips the apiKeySecret ciphertext and reports only whether one is set. */
function modelReadiness(model: any) {
  const { apiKeySecret, ...rest } = model;
  const names = [!apiKeySecret ? model.apiKeyEnvVar : null, model.extraHeaderEnvVar]
    .filter(Boolean) as string[];
  const missingEnvVars = names.filter((name) => !process.env[name]);
  const hasRequiredConfig = Boolean(apiKeySecret || model.apiKeyEnvVar)
    && (model.authMethod !== 'API_KEY_HEADER' || model.wireProtocol !== 'OPENAI_COMPATIBLE' || Boolean(model.headerName))
    && (model.authMethod !== 'OAUTH2_CLIENT_CREDENTIALS' || Boolean(model.oauthTokenUrl))
    && (model.wireProtocol !== 'YANDEXGPT' || Boolean(model.extraHeaderName && model.extraHeaderEnvVar));
  return {
    ...rest,
    hasApiKeySecret: Boolean(apiKeySecret),
    isConfigured: hasRequiredConfig && missingEnvVars.length === 0,
    missingEnvVars,
  };
}

export const getAiModels = async (_req: Request, res: Response) => {
  try {
    const models = await prisma.aiModel.findMany({ orderBy: [{ isEnabled: 'desc' }, { key: 'asc' }] });
    res.json(models.map(modelReadiness));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAiModel = async (req: Request, res: Response) => {
  try {
    const error = validateModelInput(req.body);
    if (error) return res.status(400).json({ error });
    const apiKey = optionalText(req.body.apiKey);
    const model = await prisma.aiModel.create({ data: {
      key: String(req.body.key).trim(),
      label: String(req.body.label).trim(),
      wireProtocol: req.body.wireProtocol,
      authMethod: req.body.authMethod,
      baseUrl: String(req.body.baseUrl).trim(),
      upstreamModel: String(req.body.upstreamModel).trim(),
      apiKeyEnvVar: optionalText(req.body.apiKeyEnvVar),
      apiKeySecret: apiKey ? encryptSecret(apiKey) : null,
      headerName: optionalText(req.body.headerName),
      extraHeaderName: optionalText(req.body.extraHeaderName),
      extraHeaderEnvVar: optionalText(req.body.extraHeaderEnvVar),
      oauthTokenUrl: optionalText(req.body.oauthTokenUrl),
      oauthScopeEnvVar: optionalText(req.body.oauthScopeEnvVar),
      isEnabled: req.body.isEnabled === true,
    } });
    invalidateModelRegistry();
    res.status(201).json(modelReadiness(model));
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Model key already exists' });
    console.error('Create AI model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAiModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const existing = await prisma.aiModel.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Model not found' });
    const error = validateModelInput({ ...existing, ...req.body, hasApiKeySecret: Boolean(existing.apiKeySecret) });
    if (error) return res.status(400).json({ error });
    const textFields = ['key', 'label', 'baseUrl', 'upstreamModel'] as const;
    const optionalFields = ['apiKeyEnvVar', 'headerName', 'extraHeaderName', 'extraHeaderEnvVar', 'oauthTokenUrl', 'oauthScopeEnvVar'] as const;
    const data: Record<string, unknown> = {};
    for (const field of textFields) if (req.body[field] !== undefined) data[field] = String(req.body[field]).trim();
    for (const field of optionalFields) if (req.body[field] !== undefined) data[field] = optionalText(req.body[field]);
    // apiKey is write-only: omitted -> leave the stored secret untouched; a non-empty string ->
    // re-encrypt and replace it; null/'' -> explicitly clear it back to using apiKeyEnvVar.
    if (req.body.apiKey !== undefined) {
      const apiKey = optionalText(req.body.apiKey);
      data.apiKeySecret = apiKey ? encryptSecret(apiKey) : null;
    }
    if (req.body.wireProtocol !== undefined) data.wireProtocol = req.body.wireProtocol;
    if (req.body.authMethod !== undefined) data.authMethod = req.body.authMethod;
    if (req.body.isEnabled !== undefined) data.isEnabled = req.body.isEnabled;
    const newKey = typeof data.key === 'string' ? data.key : existing.key;
    const referencingTariffs = newKey !== existing.key
      ? await prisma.tariff.findMany({ where: { models: { has: existing.key } }, select: { id: true, models: true } })
      : [];
    const model = await prisma.$transaction(async (tx) => {
      const updated = await tx.aiModel.update({ where: { id }, data });
      for (const tariff of referencingTariffs) {
        await tx.tariff.update({
          where: { id: tariff.id },
          data: { models: tariff.models.map((key) => key === existing.key ? newKey : key) },
        });
      }
      return updated;
    });
    invalidateModelRegistry();
    invalidateModelAuth(id);
    res.json(modelReadiness(model));
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Model not found' });
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Model key already exists' });
    console.error('Update AI model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAiModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const model = await prisma.aiModel.findUnique({ where: { id } });
    if (!model) return res.status(404).json({ error: 'Model not found' });
    const tariffs = await prisma.tariff.findMany({ select: { id: true, name: true, models: true } });
    const usedBy = tariffs.filter((tariff) => tariff.models.includes('*') || tariff.models.includes(model.key));
    if (usedBy.length) {
      return res.status(409).json({ error: `Сначала уберите модель из тарифов: ${usedBy.map((tariff) => tariff.name).join(', ')}` });
    }
    await prisma.aiModel.delete({ where: { id } });
    invalidateModelRegistry();
    invalidateModelAuth(id);
    res.json({ ok: true });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Model not found' });
    res.status(500).json({ error: 'Internal server error' });
  }
};
