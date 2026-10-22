import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadSettings, saveSettings } from '../lib/storage';
import type { Settings, Theme } from '../types';

interface SettingsContextValue {
  settings: Settings;
  setTheme(theme: Theme): void;
  toggleTheme(): void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    saveSettings(settings);
  }, [settings]);

  const setTheme = useCallback((theme: Theme) => setSettings((s) => ({ ...s, theme })), []);
  const toggleTheme = useCallback(() => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })), []);

  const value = useMemo(() => ({ settings, setTheme, toggleTheme }), [settings, setTheme, toggleTheme]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
