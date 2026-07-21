import type { AiModel } from '@prisma/client';
import prisma from './prisma.service.js';

const MODEL_CACHE_TTL_MS = 30_000;
let modelCache: { byKey: Map<string, AiModel>; expiresAt: number } | null = null;

export async function getEnabledModels(): Promise<Map<string, AiModel>> {
  if (!modelCache || modelCache.expiresAt <= Date.now()) {
    const rows = await prisma.aiModel.findMany({ where: { isEnabled: true } });
    modelCache = {
      byKey: new Map(rows.map((row) => [row.key, row])),
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
    };
  }
  return modelCache.byKey;
}

export function invalidateModelRegistry(): void {
  modelCache = null;
}
