import { useState, useEffect, useCallback } from 'react';
import { AppSettings, getSettings, saveSettings } from '@/lib/appSettings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent<AppSettings>) => {
      setSettings(e.detail);
    };

    window.addEventListener('settingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem('payroll_app_settings');
    const defaults = getSettings();
    setSettings(defaults);
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: defaults }));
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
