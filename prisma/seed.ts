import prisma from '../src/services/prisma.service.js';
import { ensureDefaultAiModels } from '../src/services/defaultModels.service.js';
import { ensureDefaultFreeTariff } from '../src/services/defaultTariff.service.js';
import { ensureDefaultStatusComponents } from '../src/services/defaultStatusComponents.service.js';

// Only FREE is active for now — BASIC/PRO come later once overrun billing has
// been exercised for real and the DeepSeek/GigaChat cost picture is known.
async function main() {
  const createdModels = await ensureDefaultAiModels();
  const createdComponents = await ensureDefaultStatusComponents();
  const { assignedUsers } = await ensureDefaultFreeTariff();
  console.log(`Seed complete: ${createdModels} model(s), ${createdComponents} status component(s), ${assignedUsers} user assignment(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
