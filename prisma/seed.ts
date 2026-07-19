import prisma from '../src/services/prisma.service.js';

// Only FREE is active for now — BASIC/PRO come later once overrun billing has
// been exercised for real and the DeepSeek/GigaChat cost picture is known.
async function main() {
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
      models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-flash', 'gigachat', 'gigachat-pro', 'gigachat-max', 'yandexgpt', 'yandexgpt-lite', 'yandexgpt-pro'],
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
