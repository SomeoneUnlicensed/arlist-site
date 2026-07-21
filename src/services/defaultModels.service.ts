import { Prisma } from '@prisma/client';
import prisma from './prisma.service.js';

const OPENAI_URLS = {
  deepseek: 'https://api.deepseek.com/chat/completions',
  gigachat: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
  yandex: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
};

const DEFAULT_MODELS: Prisma.AiModelCreateManyInput[] = [
  ...[
    ['deepseek-chat', 'DeepSeek Chat', 'deepseek-chat'],
    ['deepseek-reasoner', 'DeepSeek Reasoner', 'deepseek-reasoner'],
    ['deepseek-v4-flash', 'DeepSeek V4 Flash', 'deepseek-v4-flash'],
  ].map(([key, label, upstreamModel]) => ({
    key, label, upstreamModel,
    wireProtocol: 'OPENAI_COMPATIBLE' as const,
    authMethod: 'BEARER_ENV' as const,
    baseUrl: OPENAI_URLS.deepseek,
    apiKeyEnvVar: 'DEEPSEEK_API_KEY',
    isEnabled: true,
  })),
  ...[
    ['gigachat', 'GigaChat', 'GigaChat'],
    ['gigachat-pro', 'GigaChat Pro', 'GigaChat-Pro'],
    ['gigachat-max', 'GigaChat Max', 'GigaChat-Max'],
  ].map(([key, label, upstreamModel]) => ({
    key, label, upstreamModel,
    wireProtocol: 'OPENAI_COMPATIBLE' as const,
    authMethod: 'OAUTH2_CLIENT_CREDENTIALS' as const,
    baseUrl: OPENAI_URLS.gigachat,
    apiKeyEnvVar: 'GIGACHAT_AUTH_KEY',
    oauthTokenUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
    oauthScopeEnvVar: 'GIGACHAT_SCOPE',
    isEnabled: true,
  })),
  ...[
    ['yandexgpt', 'YandexGPT', 'yandexgpt/latest'],
    ['yandexgpt-lite', 'YandexGPT Lite', 'yandexgpt-lite/latest'],
    ['yandexgpt-pro', 'YandexGPT Pro', 'yandexgpt-pro/latest'],
  ].map(([key, label, upstreamModel]) => ({
    key, label, upstreamModel,
    wireProtocol: 'YANDEXGPT' as const,
    authMethod: 'API_KEY_HEADER' as const,
    baseUrl: OPENAI_URLS.yandex,
    apiKeyEnvVar: 'YANDEX_API_KEY',
    extraHeaderName: 'x-folder-id',
    extraHeaderEnvVar: 'YANDEX_FOLDER_ID',
    isEnabled: true,
  })),
];

export async function ensureDefaultAiModels(): Promise<number> {
  const result = await prisma.aiModel.createMany({ data: DEFAULT_MODELS, skipDuplicates: true });
  return result.count;
}
