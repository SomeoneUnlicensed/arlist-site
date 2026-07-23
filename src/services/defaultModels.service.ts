import { Prisma } from '@prisma/client';
import prisma from './prisma.service.js';

const OPENAI_URLS = {
  deepseek: 'https://api.deepseek.com/chat/completions',
  gigachat: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
  yandex: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
};

// deepseek-chat / deepseek-reasoner are deprecated by DeepSeek as of 2026-07-24 15:59 UTC and are
// now legacy aliases for deepseek-v4-flash's non-thinking / thinking modes respectively. We keep
// our own product-facing `key`s stable and just point upstreamModel at deepseek-v4-flash, toggling
// the mode via the `thinking` request param DeepSeek now uses instead of a separate model name.
const DEEPSEEK_MODELS: Prisma.AiModelCreateManyInput[] = [
  {
    key: 'deepseek-chat', label: 'DeepSeek Chat', upstreamModel: 'deepseek-v4-flash',
    wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'BEARER_ENV',
    baseUrl: OPENAI_URLS.deepseek, apiKeyEnvVar: 'DEEPSEEK_API_KEY', isEnabled: true,
    description: 'Быстрая универсальная модель DeepSeek без пошагового рассуждения.',
    contextWindow: 1_000_000, maxOutputTokens: 384_000,
    supportsReasoning: false, supportsFunctionCalling: true,
    extraRequestParams: { thinking: { type: 'disabled' } },
    priority: 1,
  },
  {
    key: 'deepseek-reasoner', label: 'DeepSeek Reasoner', upstreamModel: 'deepseek-v4-flash',
    wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'BEARER_ENV',
    baseUrl: OPENAI_URLS.deepseek, apiKeyEnvVar: 'DEEPSEEK_API_KEY', isEnabled: true,
    description: 'DeepSeek с явным пошаговым рассуждением (chain-of-thought) перед ответом.',
    contextWindow: 1_000_000, maxOutputTokens: 384_000,
    supportsReasoning: true, supportsFunctionCalling: false,
    extraRequestParams: { thinking: { type: 'enabled' } },
    priority: 2,
  },
  {
    key: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', upstreamModel: 'deepseek-v4-flash',
    wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'BEARER_ENV',
    baseUrl: OPENAI_URLS.deepseek, apiKeyEnvVar: 'DEEPSEEK_API_KEY', isEnabled: true,
    description: 'Актуальная флагманская модель DeepSeek V4 Flash с опциональным рассуждением.',
    contextWindow: 1_000_000, maxOutputTokens: 384_000,
    supportsReasoning: true, supportsFunctionCalling: true,
    priority: 3,
  },
];

// v1 model names (GigaChat / GigaChat-Pro / GigaChat-Max) still work via Sber's auto-redirect to
// GigaChat 2, but we point upstreamModel at the real current identifiers directly. GigaChat-2-Lite's
// context window is not confirmed in Sber's public docs as of this writing; treat that figure as an
// estimate to verify, unlike the Pro/Max numbers which are documented at 128K.
const GIGACHAT_MODELS: Prisma.AiModelCreateManyInput[] = [
  {
    key: 'gigachat', label: 'GigaChat', upstreamModel: 'GigaChat-2-Lite',
    wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'OAUTH2_CLIENT_CREDENTIALS',
    baseUrl: OPENAI_URLS.gigachat, apiKeyEnvVar: 'GIGACHAT_AUTH_KEY',
    oauthTokenUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth', oauthScopeEnvVar: 'GIGACHAT_SCOPE',
    isEnabled: true,
    description: 'Быстрая и лёгкая модель GigaChat 2 для повседневных задач.',
    contextWindow: 32_000, // unconfirmed for the Lite tier, verify against current Sber docs
    supportsReasoning: false, supportsFunctionCalling: true,
    priority: 4,
  },
  {
    key: 'gigachat-pro', label: 'GigaChat Pro', upstreamModel: 'GigaChat-2-Pro',
    wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'OAUTH2_CLIENT_CREDENTIALS',
    baseUrl: OPENAI_URLS.gigachat, apiKeyEnvVar: 'GIGACHAT_AUTH_KEY',
    oauthTokenUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth', oauthScopeEnvVar: 'GIGACHAT_SCOPE',
    isEnabled: true,
    description: 'Продвинутая модель GigaChat 2 Pro для ресурсоёмких задач.',
    contextWindow: 128_000,
    supportsReasoning: false, supportsFunctionCalling: true,
    priority: 5,
  },
  {
    key: 'gigachat-max', label: 'GigaChat Max', upstreamModel: 'GigaChat-2-Max',
    wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'OAUTH2_CLIENT_CREDENTIALS',
    baseUrl: OPENAI_URLS.gigachat, apiKeyEnvVar: 'GIGACHAT_AUTH_KEY',
    oauthTokenUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth', oauthScopeEnvVar: 'GIGACHAT_SCOPE',
    isEnabled: true,
    description: 'Флагманская модель GigaChat 2 Max для сложных и масштабных задач.',
    contextWindow: 128_000,
    supportsReasoning: false, supportsFunctionCalling: true,
    priority: 6,
  },
];

// yandexgpt/latest and yandexgpt-lite/latest are the two model families Yandex Foundation Models
// actually documents. yandexgpt-pro/latest is kept as-is (unchanged) because its existence as a
// distinct upstream model URI could not be confirmed — verify against current Yandex Cloud docs
// before relying on it.
const YANDEX_MODELS: Prisma.AiModelCreateManyInput[] = [
  {
    key: 'yandexgpt', label: 'YandexGPT', upstreamModel: 'yandexgpt/latest',
    wireProtocol: 'YANDEXGPT', authMethod: 'API_KEY_HEADER',
    baseUrl: OPENAI_URLS.yandex, apiKeyEnvVar: 'YANDEX_API_KEY',
    extraHeaderName: 'x-folder-id', extraHeaderEnvVar: 'YANDEX_FOLDER_ID', isEnabled: true,
    description: 'YandexGPT — универсальная модель Yandex для сложных запросов и анализа документов.',
    contextWindow: 32_000,
    supportsReasoning: false, supportsFunctionCalling: false,
    priority: 7,
  },
  {
    key: 'yandexgpt-lite', label: 'YandexGPT Lite', upstreamModel: 'yandexgpt-lite/latest',
    wireProtocol: 'YANDEXGPT', authMethod: 'API_KEY_HEADER',
    baseUrl: OPENAI_URLS.yandex, apiKeyEnvVar: 'YANDEX_API_KEY',
    extraHeaderName: 'x-folder-id', extraHeaderEnvVar: 'YANDEX_FOLDER_ID', isEnabled: true,
    description: 'YandexGPT Lite — быстрая модель для диалогов и простых задач.',
    contextWindow: 32_000,
    supportsReasoning: false, supportsFunctionCalling: false,
    priority: 8,
  },
  {
    key: 'yandexgpt-pro', label: 'YandexGPT Pro', upstreamModel: 'yandexgpt-pro/latest',
    wireProtocol: 'YANDEXGPT', authMethod: 'API_KEY_HEADER',
    baseUrl: OPENAI_URLS.yandex, apiKeyEnvVar: 'YANDEX_API_KEY',
    extraHeaderName: 'x-folder-id', extraHeaderEnvVar: 'YANDEX_FOLDER_ID', isEnabled: true,
    description: 'YandexGPT Pro — модель Yandex для глубокого анализа и сложного синтеза.',
    contextWindow: 32_000,
    supportsReasoning: false, supportsFunctionCalling: false,
    priority: 9,
  },
];

const DEFAULT_MODELS: Prisma.AiModelCreateManyInput[] = [
  ...DEEPSEEK_MODELS,
  ...GIGACHAT_MODELS,
  ...YANDEX_MODELS,
];

export async function ensureDefaultAiModels(): Promise<number> {
  let created = 0;
  for (const { key, isEnabled, ...rest } of DEFAULT_MODELS) {
    const existing = await prisma.aiModel.findUnique({ where: { key: key as string } });
    // isEnabled is deliberately excluded from `update`: an admin may have disabled a model through
    // the admin panel, and a routine metadata refresh (upstream model id, context window, etc.)
    // should never silently re-enable it.
    await prisma.aiModel.upsert({
      where: { key: key as string },
      create: { key, isEnabled, ...rest },
      update: rest,
    });
    if (!existing) created += 1;
  }
  return created;
}
