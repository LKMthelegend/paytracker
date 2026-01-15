import { useState, useEffect, useCallback } from "react";

export interface BackupSettings {
  enabled: boolean;
  frequencyDays: number; // 1, 7, 14, 30
  lastBackupDate: string | null;
  lastReminderDismissed: string | null;
}

const BACKUP_SETTINGS_KEY = "payrollpro_backup_settings";

const DEFAULT_SETTINGS: BackupSettings = {
  enabled: false,
  frequencyDays: 7,
  lastBackupDate: null,
  lastReminderDismissed: null,
};

export function getBackupSettings(): BackupSettings {
  try {
    const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error reading backup settings:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveBackupSettings(settings: Partial<BackupSettings>): BackupSettings {
  const current = getBackupSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving backup settings:", error);
  }
  return updated;
}

export function recordBackup(): void {
  saveBackupSettings({ 
    lastBackupDate: new Date().toISOString(),
    lastReminderDismissed: null 
  });
}

export function dismissReminder(): void {
  saveBackupSettings({ 
    lastReminderDismissed: new Date().toISOString() 
  });
}

export function isBackupDue(settings: BackupSettings): boolean {
  if (!settings.enabled) return false;
  if (!settings.lastBackupDate) return true;

  const lastBackup = new Date(settings.lastBackupDate);
  const now = new Date();
  const daysSinceBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

  return daysSinceBackup >= settings.frequencyDays;
}

export function shouldShowReminder(settings: BackupSettings): boolean {
  if (!isBackupDue(settings)) return false;
  
  // Don't show if dismissed today
  if (settings.lastReminderDismissed) {
    const dismissed = new Date(settings.lastReminderDismissed);
    const now = new Date();
    const hoursSinceDismissed = (now.getTime() - dismissed.getTime()) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) return false;
  }

  return true;
}

export function getDaysSinceLastBackup(settings: BackupSettings): number | null {
  if (!settings.lastBackupDate) return null;
  const lastBackup = new Date(settings.lastBackupDate);
  const now = new Date();
  return Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
}

export function useBackupReminder() {
  const [settings, setSettings] = useState<BackupSettings>(getBackupSettings);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const currentSettings = getBackupSettings();
    setSettings(currentSettings);
    setShowReminder(shouldShowReminder(currentSettings));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<BackupSettings>) => {
    const updated = saveBackupSettings(newSettings);
    setSettings(updated);
    setShowReminder(shouldShowReminder(updated));
  }, []);

  const onBackupComplete = useCallback(() => {
    recordBackup();
    const updated = getBackupSettings();
    setSettings(updated);
    setShowReminder(false);
  }, []);

  const onDismissReminder = useCallback(() => {
    dismissReminder();
    setShowReminder(false);
  }, []);

  const daysSinceBackup = getDaysSinceLastBackup(settings);
  const isOverdue = isBackupDue(settings);

  return {
    settings,
    updateSettings,
    showReminder,
    onBackupComplete,
    onDismissReminder,
    daysSinceBackup,
    isOverdue,
  };
}
