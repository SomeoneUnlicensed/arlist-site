import type { Response as ExpressResponse } from 'express';
import { recordUsage, isModelAllowed } from '../services/limits.service.js';
import { getGigaChatAccessToken } from '../services/gigachat.service.js';

// Direct pass-through to our own paid provider accounts — no third-party free-tier
// pooling, no IP rotation, no hiding which provider answers a given model.

type Provider = 'deepseek' | 'gigachat' | 'yandexgpt';

interface ModelTarget {
  provider: Provider;
  upstreamModel: string;
}

// Upstream model identifiers here are best-effort — verify each against the
// provider's current API docs once real DEEPSEEK_API_KEY/GIGACHAT_AUTH_KEY/
// YANDEX_API_KEY are wired in, before relying on this in production.
const MODEL_MAP: Record<string, ModelTarget> = {
  'deepseek-chat': { provider: 'deepseek', upstreamModel: 'deepseek-chat' },
  'deepseek-reasoner': { provider: 'deepseek', upstreamModel: 'deepseek-reasoner' },
  'deepseek-v4-flash': { provider: 'deepseek', upstreamModel: 'deepseek-v4-flash' },
  'gigachat': { provider: 'gigachat', upstreamModel: 'GigaChat' },
  'gigachat-pro': { provider: 'gigachat', upstreamModel: 'GigaChat-Pro' },
  'gigachat-max': { provider: 'gigachat', upstreamModel: 'GigaChat-Max' },
  'yandexgpt': { provider: 'yandexgpt', upstreamModel: 'yandexgpt/latest' },
  'yandexgpt-lite': { provider: 'yandexgpt', upstreamModel: 'yandexgpt-lite/latest' },
  'yandexgpt-pro': { provider: 'yandexgpt', upstreamModel: 'yandexgpt-pro/latest' },
};

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
// GigaChat's message format follows the OpenAI chat-completions shape (model,
// messages, usage.prompt_tokens/completion_tokens) once you hold a Bearer
// token — only the token acquisition (OAuth2 client-credentials) differs.
const GIGACHAT_API_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
const YANDEX_COMPLETION_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

// Shared caller for providers whose HTTP API is OpenAI-compatible (DeepSeek,
// GigaChat): same request/response shape, only base URL and bearer token differ.
async function callOpenAiCompatible(url: string, token: string, upstreamModel: string, body: Record<string, unknown>) {
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, model: upstreamModel, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
}

// Yandex Foundation Models API is not OpenAI-shaped: request uses
// modelUri/completionOptions/messages[].text, response nests the answer under
// result.alternatives[0].message and tokens under result.usage. We translate
// both directions so the rest of the proxy can stay provider-agnostic.
async function callYandexGpt(upstreamModel: string, body: Record<string, unknown>) {
  const apiKey = process.env.YANDEX_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;
  if (!apiKey) throw new Error('YANDEX_API_KEY not configured');
  if (!folderId) throw new Error('YANDEX_FOLDER_ID not configured');

  const messages = (body.messages as Array<{ role: string; content: string }> | undefined) ?? [];
  const maxTokens = (body.max_tokens as number | undefined) ?? 2000;
  const temperature = (body.temperature as number | undefined) ?? 0.6;

  const yandexRes = await fetch(YANDEX_COMPLETION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      'x-folder-id': folderId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      modelUri: `gpt://${folderId}/${upstreamModel}`,
      completionOptions: { stream: false, temperature, maxTokens: String(maxTokens) },
      messages: messages.map((m) => ({ role: m.role, text: m.content })),
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!yandexRes.ok) {
    return yandexRes;
  }

  const yandexData: any = await yandexRes.json();
  const alt = yandexData.result?.alternatives?.[0];
  const usage = yandexData.result?.usage ?? {};

  // Repackage into the OpenAI shape the rest of chatCompletions() expects.
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

async function callUpstream(target: ModelTarget, body: Record<string, unknown>) {
  switch (target.provider) {
    case 'deepseek': {
      const key = process.env.DEEPSEEK_API_KEY;
      if (!key) throw new Error('DEEPSEEK_API_KEY not configured');
      return callOpenAiCompatible(DEEPSEEK_API_URL, key, target.upstreamModel, body);
    }
    case 'gigachat': {
      const token = await getGigaChatAccessToken();
      return callOpenAiCompatible(GIGACHAT_API_URL, token, target.upstreamModel, body);
    }
    case 'yandexgpt':
      return callYandexGpt(target.upstreamModel, body);
  }
}

export const chatCompletions = async (req: any, res: ExpressResponse) => {
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
    const allowed: string[] = tariff?.models?.includes('*')
      ? Object.keys(MODEL_MAP)
      : tariff?.models ?? [];

    res.json({ models: allowed });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
