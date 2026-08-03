import { useCallback, useEffect, useState } from 'react';
import { AtlasSettings, DEFAULT_SETTINGS, SETTINGS_EVENT, loadSettings, saveSettings } from '@/lib/enterprise';

/** Read/write the enterprise settings and stay in sync across every mounted component. */
export function useAtlasSettings(): [AtlasSettings, (patch: Partial<AtlasSettings>) => void, () => void] {
  const [settings, setSettings] = useState<AtlasSettings>(() => (typeof window === 'undefined' ? DEFAULT_SETTINGS : loadSettings()));

  useEffect(() => {
    const onChange = (e: Event) => setSettings((e as CustomEvent<AtlasSettings>).detail);
    window.addEventListener(SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(SETTINGS_EVENT, onChange);
  }, []);

  const update = useCallback((patch: Partial<AtlasSettings>) => {
    setSettings((cur) => {
      const next = { ...cur, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return [settings, update, reset];
}

/** Applies settings to the document root. Mounted once in the app layout. */
export function useApplyAtlasSettings(settings: AtlasSettings) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('atlas-reduced-motion', settings.reducedMotion);
    root.classList.toggle('atlas-high-contrast', settings.highContrast);
    root.classList.toggle('atlas-underline-links', settings.underlineLinks);
    root.classList.toggle('atlas-compact', settings.density === 'compact');
    root.classList.toggle('atlas-presentation', settings.presentationMode);
    root.dataset.atlasAccent = settings.accent;
    root.dataset.atlasTheme = settings.theme;
    root.classList.toggle('dark', settings.theme !== 'executive-light' && settings.theme !== 'archive');
    root.classList.toggle('light', settings.theme === 'executive-light' || settings.theme === 'archive');
    root.style.setProperty('--atlas-font-scale', `${settings.fontScale}%`);
  }, [settings]);
}
