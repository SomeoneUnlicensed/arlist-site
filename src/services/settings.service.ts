import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

export interface SystemSettings {
  registrationMode: 'OPEN' | 'CLOSED';
  email2faEnabled: boolean;
}

const defaultSettings: SystemSettings = {
  registrationMode: 'OPEN',
  email2faEnabled: false,
};

// Ensure data directory exists
const ensureDir = () => {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const getSettings = (): SystemSettings => {
  try {
    ensureDir();
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings: Partial<SystemSettings>): SystemSettings => {
  ensureDir();
  const current = getSettings();
  const updated = { ...current, ...settings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
};
