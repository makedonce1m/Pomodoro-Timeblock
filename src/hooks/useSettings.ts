import { useState } from 'react';
import type { PomodoroMode, PomodoroType } from '../types';

export type TimeFormat = '24h' | '12h';
export type AppTheme = 'dark' | 'light';

export interface AppSettings {
  autoContinue: boolean;
  keepScreenOn: boolean;
  timeFormat: TimeFormat;
  pomodoroType: PomodoroType;
  defaultMode: PomodoroMode;
  theme: AppTheme;
}

const DEFAULTS: AppSettings = {
  autoContinue: true,
  keepScreenOn: true,
  timeFormat: '24h',
  pomodoroType: 'adaptive' as PomodoroType,
  defaultMode: 'standard',
  theme: 'dark',
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
