import type { RegistrationMode } from '@prisma/client';
import prisma from './prisma.service.js';

const SYSTEM_SETTINGS_ID = 'system';

export interface SystemSettings {
  registrationMode: RegistrationMode;
  email2faEnabled: boolean;
}

const defaults: SystemSettings = {
  registrationMode: 'OPEN',
  email2faEnabled: false,
};

export async function getSettings(): Promise<SystemSettings> {
  const settings = await prisma.systemSetting.upsert({
    where: { id: SYSTEM_SETTINGS_ID },
    create: { id: SYSTEM_SETTINGS_ID, ...defaults },
    update: {},
    select: { registrationMode: true, email2faEnabled: true },
  });
  return settings;
}

export async function saveSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  return prisma.systemSetting.upsert({
    where: { id: SYSTEM_SETTINGS_ID },
    create: { id: SYSTEM_SETTINGS_ID, ...defaults, ...settings },
    update: settings,
    select: { registrationMode: true, email2faEnabled: true },
  });
}
