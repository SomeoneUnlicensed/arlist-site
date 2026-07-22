import type { Response as ExpressResponse } from 'express';
import type { AiModel } from '@prisma/client';
import { recordUsage, isModelAllowed } from '../services/limits.service.js';
import { getOAuthClientCredentialsToken } from '../services/modelAuth.service.js';
import { getEnabledModels } from '../services/modelRegistry.service.js';

async function resolveToken(row: AiModel): Promise<string> {
  if (!row.apiKeyEnvVar) throw new Error(`${row.key}: apiKeyEnvVar not set`);

  if (row.authMethod === 'OAUTH2_CLIENT_CREDENTIALS') {
    if (!row.oauthTokenUrl) throw new Error(`${row.key}: oauthTokenUrl not set`);
    return getOAuthClientCredentialsToken(row.id, row.oauthTokenUrl, row.apiKeyEnvVar, row.oauthScopeEnvVar);
  }

  const token = process.env[row.apiKeyEnvVar];
  if (!token) throw new Error(`${row.apiKeyEnvVar} not configured`);
  return token;
}

async function callOpenAiCompatible(row: AiModel, token: string, body: Record<string, unknown>) {
  const authHeader = row.authMethod === 'API_KEY_HEADER' ? (row.headerName || 'x-api-key') : 'Authorization';
  const authValue = row.authMethod === 'API_KEY_HEADER' ? token : `Bearer ${token}`;

  return fetch(row.baseUrl, {
    method: 'POST',
    headers: { [authHeader]: authValue, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, model: row.upstreamModel, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
}

async function callYandexGpt(row: AiModel, apiKey: string, body: Record<string, unknown>) {
  if (!row.extraHeaderName || !row.extraHeaderEnvVar) {
    throw new Error(`${row.key}: extraHeaderName/extraHeaderEnvVar not set`);
  }
  const folderId = process.env[row.extraHeaderEnvVar];
  if (!folderId) throw new Error(`${row.extraHeaderEnvVar} not configured`);

  const messages = (body.messages as Array<{ role: string; content: string }> | undefined) ?? [];
  const maxTokens = (body.max_tokens as number | undefined) ?? 2000;
  const temperature = (body.temperature as number | undefined) ?? 0.6;
  const response = await fetch(row.baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      [row.extraHeaderName]: folderId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      modelUri: `gpt://${folderId}/${row.upstreamModel}`,
      completionOptions: { stream: false, temperature, maxTokens: String(maxTokens) },
      messages: messages.map((message) => ({ role: message.role, text: message.content })),
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) return response;
  const data: any = await response.json();
  const alternative = data.result?.alternatives?.[0];
  const usage = data.result?.usage ?? {};
  return new Response(JSON.stringify({
    choices: [{ message: { role: 'assistant', content: alternative?.message?.text ?? '' }, finish_reason: 'stop', index: 0 }],
    usage: {
      prompt_tokens: Number(usage.inputTextTokens ?? 0),
      completion_tokens: Number(usage.completionTokens ?? 0),
      total_tokens: Number(usage.totalTokens ?? 0),
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function callUpstream(row: AiModel, body: Record<string, unknown>) {
  const token = await resolveToken(row);
  if (row.wireProtocol === 'YANDEXGPT') return callYandexGpt(row, token, body);
  return callOpenAiCompatible(row, token, body);
}

export const chatCompletions = async (req: any, res: ExpressResponse) => {
  try {
    const { model, stream: _stream, ...body } = req.body;
    if (!model) return res.status(400).json({ error: 'model required' });

    const enabledModels = await getEnabledModels();
    const target = enabledModels.get(model);
    if (!target) return res.status(400).json({ error: 'Unknown or disabled model', availableModels: [...enabledModels.keys()] });

    const tariffModels: string[] = req.user.tariff?.models ?? [];
    if (req.user.tariff && !isModelAllowed(tariffModels, model)) {
      return res.status(403).json({ error: 'Model not available on your tariff', availableModels: tariffModels });
    }

    const upstreamResponse = await callUpstream(target, body);
    if (!upstreamResponse.ok) {
      const detail = await upstreamResponse.text();
      return res.status(upstreamResponse.status).json({ error: 'Upstream error', detail });
    }

    const data: any = await upstreamResponse.json();
    await recordUsage(
      req.user.userId,
      req.apiKey?.id ?? null,
      model,
      data.usage?.prompt_tokens ?? 0,
      data.usage?.completion_tokens ?? 0,
      Boolean(req.overrun),
      req.overrunPriceKopecksPer1k ?? 0,
    );
    res.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return res.status(504).json({ error: 'Upstream timeout' });
    console.error('LLM proxy error:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
};

export const listModels = async (req: any, res: ExpressResponse) => {
  try {
    const enabled = await getEnabledModels();
    const tariffModels: string[] = req.user.tariff?.models ?? [];
    const models = tariffModels.includes('*')
      ? [...enabled.keys()]
      : tariffModels.filter((key) => enabled.has(key));
    res.json({ models });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
