import type { Response as ExpressResponse } from 'express';
import prisma from '../services/prisma.service.js';
import { recordUsage, isModelAllowed, effectiveModels } from '../services/limits.service.js';
import { getOAuthClientCredentialsToken } from '../services/modelAuth.service.js';
import type { AiModel } from '@prisma/client';

// Direct pass-through to our own paid provider accounts — no third-party free-tier
// pooling, no IP rotation, no hiding which provider answers a given model.
//
// Models are data, not code: which providers exist, their base URL, wire
// protocol and auth method all live in the AiModel table and are managed from
// the admin panel. Adding another OpenAI-shaped provider needs zero code
// changes. A genuinely new wire protocol (request/response shape) does need a
// new branch in callUpstream — that's an honest limit, not a workaround.

const MODEL_CACHE_TTL_MS = 30_000;
let modelCache: { byKey: Map<string, AiModel>; expiresAt: number } | null = null;

async function getModelByKey(key: string): Promise<AiModel | undefined> {
  if (!modelCache || modelCache.expiresAt <= Date.now()) {
    const rows = await prisma.aiModel.findMany({ where: { isEnabled: true } });
    modelCache = { byKey: new Map(rows.map((r) => [r.key, r])), expiresAt: Date.now() + MODEL_CACHE_TTL_MS };
  }
  return modelCache.byKey.get(key);
}

async function resolveToken(row: AiModel): Promise<string> {
  switch (row.authMethod) {
    case 'BEARER_ENV':
    case 'API_KEY_HEADER': {
      if (!row.apiKeyEnvVar) throw new Error(`${row.key}: apiKeyEnvVar not set`);
      const key = process.env[row.apiKeyEnvVar];
      if (!key) throw new Error(`${row.apiKeyEnvVar} not configured`);
      return key;
    }
    case 'OAUTH2_CLIENT_CREDENTIALS': {
      if (!row.oauthTokenUrl || !row.apiKeyEnvVar) throw new Error(`${row.key}: oauthTokenUrl/apiKeyEnvVar not set`);
      return getOAuthClientCredentialsToken(row.id, row.oauthTokenUrl, row.apiKeyEnvVar, row.oauthScopeEnvVar);
    }
  }
}

// OpenAI-shaped wire protocol: model/messages in, choices[0].message + usage
// out. Covers DeepSeek, GigaChat (once you hold a bearer token), and any
// future provider that speaks the same shape — just add a row, no code.
async function callOpenAiCompatible(row: AiModel, token: string, body: Record<string, unknown>) {
  return fetch(row.baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, model: row.upstreamModel, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
}

// Yandex Foundation Models API: modelUri/completionOptions/messages[].text in,
// result.alternatives[]/result.usage out. Not OpenAI-shaped, so this stays a
// dedicated branch — repackaged into the OpenAI shape below so the rest of
// chatCompletions() can stay provider-agnostic.
async function callYandexGpt(row: AiModel, apiKey: string, body: Record<string, unknown>) {
  if (!row.extraHeaderName || !row.extraHeaderEnvVar) {
    throw new Error(`${row.key}: extraHeaderName/extraHeaderEnvVar not set (Yandex needs a folder id)`);
  }
  const folderId = process.env[row.extraHeaderEnvVar];
  if (!folderId) throw new Error(`${row.extraHeaderEnvVar} not configured`);

  const messages = (body.messages as Array<{ role: string; content: string }> | undefined) ?? [];
  const maxTokens = (body.max_tokens as number | undefined) ?? 2000;
  const temperature = (body.temperature as number | undefined) ?? 0.6;

  const yandexRes = await fetch(row.baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      [row.extraHeaderName]: folderId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      modelUri: `gpt://${folderId}/${row.upstreamModel}`,
      completionOptions: { stream: false, temperature, maxTokens: String(maxTokens) },
      messages: messages.map((m) => ({ role: m.role, text: m.content })),
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!yandexRes.ok) return yandexRes;

  const yandexData: any = await yandexRes.json();
  const alt = yandexData.result?.alternatives?.[0];
  const usage = yandexData.result?.usage ?? {};

  const openAiShaped = {
    choices: [{ message: { role: 'assistant', content: alt?.message?.text ?? '' }, finish_reason: 'stop', index: 0 }],
    usage: {
      prompt_tokens: Number(usage.inputTextTokens ?? 0),
      completion_tokens: Number(usage.completionTokens ?? 0),
      total_tokens: Number(usage.totalTokens ?? 0),
    },
  };

  return new Response(JSON.stringify(openAiShaped), { status: 200 });
}

async function callUpstream(row: AiModel, body: Record<string, unknown>) {
  const token = await resolveToken(row);
  switch (row.wireProtocol) {
    case 'OPENAI_COMPATIBLE':
      return callOpenAiCompatible(row, token, body);
    case 'YANDEXGPT':
      return callYandexGpt(row, token, body);
  }
}

export const chatCompletions = async (req: any, res: ExpressResponse) => {
  try {
    const userId = req.user.userId;
    const apiKey = req.apiKey;
    const tariff = req.user.tariff;
    const { model, stream, ...body } = req.body;

    if (!model) return res.status(400).json({ error: 'model required' });

    const target = await getModelByKey(model);
    if (!target) {
      const available = modelCache ? Array.from(modelCache.byKey.keys()) : [];
      return res.status(400).json({ error: 'Unknown model', availableModels: available });
    }

    const allowedModels = effectiveModels(req.user, tariff ?? { models: [] });
    if (tariff && !isModelAllowed(allowedModels, model)) {
      return res.status(403).json({
        error: 'Model not available on your tariff',
        availableModels: allowedModels,
      });
    }

    // Streaming pass-through isn't implemented yet — always request a full response.
    const upstreamRes = await callUpstream(target, body);

    if (!upstreamRes.ok) {
      const detail = await upstreamRes.text();
      return res.status(upstreamRes.status).json({ error: 'Upstream error', detail });
    }

    const data: any = await upstreamRes.json();

    let promptTokens = 0;
    let outputTokens = 0;
    if (data.usage) {
      promptTokens = data.usage.prompt_tokens ?? 0;
      outputTokens = data.usage.completion_tokens ?? 0;
    }

    await recordUsage(
      userId,
      apiKey?.id ?? null,
      model,
      promptTokens,
      outputTokens,
      Boolean(req.overrun),
      req.overrunPriceKopecksPer1k ?? 0,
    );

    res.json(data);
  } catch (err: any) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    console.error('LLM proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
};

export const listModels = async (req: any, res: ExpressResponse) => {
  try {
    const tariff = req.user.tariff;
    const allowedModels = effectiveModels(req.user, tariff ?? { models: [] });

    if (allowedModels.includes('*')) {
      const rows = await prisma.aiModel.findMany({ where: { isEnabled: true }, select: { key: true } });
      return res.json({ models: rows.map((r) => r.key) });
    }

    res.json({ models: allowedModels });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
