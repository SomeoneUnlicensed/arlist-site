import type { Response as ExpressResponse } from 'express';
import { randomUUID } from 'crypto';
import { recordUsage, isModelAllowed } from '../services/limits.service.js';
import { getEnabledModels } from '../services/modelRegistry.service.js';
import { callUpstream } from './llmProxy.controller.js';

// Translates OpenAI's Responses API (POST /responses, SSE-only, `input` items
// instead of `messages`) into our existing chat-completions-style provider
// logic. Вспышка's core crate dropped support for the classic chat wire
// format upstream (WireApi only has a Responses variant now) — so this
// endpoint is what actually lets it talk to Arlist-configured models at all,
// not just log in via Arlist ID.

interface ResponseContentItem {
  type: string; // 'input_text' | 'output_text' | 'input_image'
  text?: string;
}

interface ResponseInputItem {
  type: string; // 'message' | other item kinds we don't translate yet
  role?: string;
  content?: ResponseContentItem[];
}

function inputItemsToMessages(
  instructions: string,
  input: ResponseInputItem[],
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];
  if (instructions) messages.push({ role: 'system', content: instructions });

  for (const item of input) {
    if (item.type !== 'message' || !item.role || !item.content) continue;
    const text = item.content
      .filter((c) => c.type === 'input_text' || c.type === 'output_text')
      .map((c) => c.text ?? '')
      .join('');
    if (text) messages.push({ role: item.role, content: text });
  }
  return messages;
}

function sseEvent(res: ExpressResponse, type: string, data: Record<string, unknown>) {
  res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
}

export const responses = async (req: any, res: ExpressResponse) => {
  const { model, input, instructions } = req.body ?? {};
  if (!model || !Array.isArray(input)) {
    return res.status(400).json({ error: 'model and input are required' });
  }

  try {
    const enabledModels = await getEnabledModels();
    const target = enabledModels.get(model);
    if (!target) {
      return res.status(400).json({ error: 'Unknown or disabled model', availableModels: [...enabledModels.keys()] });
    }

    const tariffModels: string[] = req.user.tariff?.models ?? [];
    if (req.user.tariff && !isModelAllowed(tariffModels, model)) {
      return res.status(403).json({ error: 'Model not available on your tariff', availableModels: tariffModels });
    }

    const messages = inputItemsToMessages(instructions ?? '', input as ResponseInputItem[]);
    const upstreamResponse = await callUpstream(target, { messages });

    if (!upstreamResponse.ok) {
      const detail = await upstreamResponse.text();
      return res.status(upstreamResponse.status).json({ error: 'Upstream error', detail });
    }

    const data: any = await upstreamResponse.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;

    await recordUsage(
      req.user.userId,
      req.apiKey?.id ?? null,
      model,
      promptTokens,
      completionTokens,
      Boolean(req.overrun),
      req.overrunPriceKopecksPer1k ?? 0,
    );

    // The client hardcodes stream: true and only understands SSE for this
    // endpoint — even though our upstream call above was a plain non-streaming
    // JSON request, we still hand back a minimal-but-valid event stream.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const responseId = `resp_${randomUUID()}`;
    sseEvent(res, 'response.created', { response: {} });
    sseEvent(res, 'response.output_item.done', {
      item: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] },
    });
    sseEvent(res, 'response.completed', {
      response: {
        id: responseId,
        usage: {
          input_tokens: promptTokens,
          input_tokens_details: null,
          output_tokens: completionTokens,
          output_tokens_details: null,
          total_tokens: promptTokens + completionTokens,
        },
      },
    });
    res.end();
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    console.error('Responses API proxy error:', error);
    if (res.headersSent) {
      sseEvent(res, 'response.failed', { response: { error: { message: error.message } } });
      res.end();
    } else {
      res.status(500).json({ error: 'Proxy error', message: error.message });
    }
  }
};
