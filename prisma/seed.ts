import prisma from '../src/services/prisma.service.js';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const GIGACHAT_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
const GIGACHAT_OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const YANDEX_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

const AI_MODELS = [
  { key: 'deepseek-chat', label: 'DeepSeek Chat', wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'BEARER_ENV', baseUrl: DEEPSEEK_URL, upstreamModel: 'deepseek-chat', apiKeyEnvVar: 'DEEPSEEK_API_KEY' },
  { key: 'deepseek-reasoner', label: 'DeepSeek Reasoner', wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'BEARER_ENV', baseUrl: DEEPSEEK_URL, upstreamModel: 'deepseek-reasoner', apiKeyEnvVar: 'DEEPSEEK_API_KEY' },
  { key: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'BEARER_ENV', baseUrl: DEEPSEEK_URL, upstreamModel: 'deepseek-v4-flash', apiKeyEnvVar: 'DEEPSEEK_API_KEY' },
  { key: 'gigachat', label: 'GigaChat', wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'OAUTH2_CLIENT_CREDENTIALS', baseUrl: GIGACHAT_URL, upstreamModel: 'GigaChat', apiKeyEnvVar: 'GIGACHAT_AUTH_KEY', oauthTokenUrl: GIGACHAT_OAUTH_URL, oauthScopeEnvVar: 'GIGACHAT_SCOPE' },
  { key: 'gigachat-pro', label: 'GigaChat Pro', wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'OAUTH2_CLIENT_CREDENTIALS', baseUrl: GIGACHAT_URL, upstreamModel: 'GigaChat-Pro', apiKeyEnvVar: 'GIGACHAT_AUTH_KEY', oauthTokenUrl: GIGACHAT_OAUTH_URL, oauthScopeEnvVar: 'GIGACHAT_SCOPE' },
  { key: 'gigachat-max', label: 'GigaChat Max', wireProtocol: 'OPENAI_COMPATIBLE', authMethod: 'OAUTH2_CLIENT_CREDENTIALS', baseUrl: GIGACHAT_URL, upstreamModel: 'GigaChat-Max', apiKeyEnvVar: 'GIGACHAT_AUTH_KEY', oauthTokenUrl: GIGACHAT_OAUTH_URL, oauthScopeEnvVar: 'GIGACHAT_SCOPE' },
  { key: 'yandexgpt', label: 'YandexGPT', wireProtocol: 'YANDEXGPT', authMethod: 'API_KEY_HEADER', baseUrl: YANDEX_URL, upstreamModel: 'yandexgpt/latest', apiKeyEnvVar: 'YANDEX_API_KEY', extraHeaderName: 'x-folder-id', extraHeaderEnvVar: 'YANDEX_FOLDER_ID' },
  { key: 'yandexgpt-lite', label: 'YandexGPT Lite', wireProtocol: 'YANDEXGPT', authMethod: 'API_KEY_HEADER', baseUrl: YANDEX_URL, upstreamModel: 'yandexgpt-lite/latest', apiKeyEnvVar: 'YANDEX_API_KEY', extraHeaderName: 'x-folder-id', extraHeaderEnvVar: 'YANDEX_FOLDER_ID' },
  { key: 'yandexgpt-pro', label: 'YandexGPT Pro', wireProtocol: 'YANDEXGPT', authMethod: 'API_KEY_HEADER', baseUrl: YANDEX_URL, upstreamModel: 'yandexgpt-pro/latest', apiKeyEnvVar: 'YANDEX_API_KEY', extraHeaderName: 'x-folder-id', extraHeaderEnvVar: 'YANDEX_FOLDER_ID' },
] as const;

async function seedAiModels() {
  for (const model of AI_MODELS) {
    await prisma.aiModel.upsert({
      where: { key: model.key },
      update: {},
      create: model,
    });
  }
  console.log(`AiModel rows seeded (${AI_MODELS.length})`);
}

// Only FREE is active for now — BASIC/PRO come later once overrun billing has
// been exercised for real and the DeepSeek/GigaChat cost picture is known.
async function main() {
  await seedAiModels();

  const existing = await prisma.tariff.findUnique({ where: { type: 'FREE' } });
  if (existing) {
    console.log('Tariffs already seeded');
    return;
  }

  await prisma.tariff.create({
    data: {
      type: 'FREE',
      name: 'Бесплатный',
      description: 'Для знакомства с платформой — за наш счёт',
      priceMonth: 0,
      creditsPer5h: 50_000,
      creditsPerWeek: 300_000,
      models: AI_MODELS.map((m) => m.key),
      overrunEnabled: false,
      overrunPriceKopecks: 0,
    },
  });

  console.log('FREE tariff seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
