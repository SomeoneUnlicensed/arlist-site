import { Response } from 'express';
import { recordUsage, isModelAllowed } from '../services/limits.service.js';
import { getGigaChatAccessToken } from '../services/gigachat.service.js';

// Direct pass-through to our own paid provider accounts — no third-party free-tier
// pooling, no IP rotation, no hiding which provider answers a given model.

type Provider = 'deepseek' | 'gigachat';

interface ModelTarget {
  provider: Provider;
  upstreamModel: string;
}

// Upstream model identifiers here are best-effort — verify each against the
// provider's current API docs once real DEEPSEEK_API_KEY/GIGACHAT_AUTH_KEY are
// wired in, before relying on this in production.
const MODEL_MAP: Record<string, ModelTarget> = {
  'deepseek-chat': { provider: 'deepseek', upstreamModel: 'deepseek-chat' },
  'deepseek-reasoner': { provider: 'deepseek', upstreamModel: 'deepseek-reasoner' },
  'deepseek-v4-flash': { provider: 'deepseek', upstreamModel: 'deepseek-v4-flash' },
  'gigachat': { provider: 'gigachat', upstreamModel: 'GigaChat' },
  'gigachat-pro': { provider: 'gigachat', upstreamModel: 'GigaChat-Pro' },
  'gigachat-max': { provider: 'gigachat', upstreamModel: 'GigaChat-Max' },
};

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const GIGACHAT_API_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

async function callDeepSeek(upstreamModel: string, body: Record<string, unknown>) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY not configured');

  return fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, model: upstreamModel, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
}

async function callGigaChat(upstreamModel: string, body: Record<string, unknown>) {
  const token = await getGigaChatAccessToken();

  return fetch(GIGACHAT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, model: upstreamModel, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
}

export const chatCompletions = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const apiKey = req.apiKey;
    const tariff = req.user.tariff;
    const { model, stream, ...body } = req.body;

    if (!model) return res.status(400).json({ error: 'model required' });

    const target = MODEL_MAP[model];
    if (!target) {
      return res.status(400).json({ error: 'Unknown model', availableModels: Object.keys(MODEL_MAP) });
    }

    const tariffModels: string[] = tariff?.models ?? [];
    if (tariff && !isModelAllowed(tariffModels, model)) {
      return res.status(403).json({
        error: 'Model not available on your tariff',
        availableModels: tariffModels,
      });
    }

    // Streaming pass-through isn't implemented yet — always request a full response.
    const upstreamRes =
      target.provider === 'deepseek'
        ? await callDeepSeek(target.upstreamModel, body)
        : await callGigaChat(target.upstreamModel, body);

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

export const listModels = async (req: any, res: Response) => {
  try {
    const tariff = req.user.tariff;
    const allowed: string[] = tariff?.models?.includes('*')
      ? Object.keys(MODEL_MAP)
      : tariff?.models ?? [];

    res.json({ models: allowed });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
