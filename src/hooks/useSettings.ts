import { useState } from 'react';

export interface AppSettings {
  autoContinue: boolean;
}

const DEFAULTS: AppSettings = {
  autoContinue: true,
};

const KEY = 'pomodoro-app-settings';

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(load);

  function update(patch: Partial<AppSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  return { settings, update };
}
