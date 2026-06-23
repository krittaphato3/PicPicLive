import type { AppSettings } from '../core/types';

const STORAGE_KEY = 'picpiclive-settings';

export function loadSettings(): Partial<AppSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return deepMerge(parsed, {});
  } catch {
    return {};
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage full or unavailable — silent
  }
}

export function resetSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function deepMerge(target: any, source: any): any {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
    ) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}
