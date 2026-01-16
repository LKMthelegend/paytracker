import { useState, useEffect, useCallback, useRef } from "react";
import { exportAllData } from "@/lib/db";

export interface AutoBackupSettings {
  enabled: boolean;
  intervalMinutes: number; // 5, 15, 30, 60
  maxBackups: number; // How many backups to keep
}

export interface LocalBackup {
  id: string;
  timestamp: string;
  size: number;
  recordCount: {
    employees: number;
    advances: number;
    salaryPayments: number;
    receipts: number;
  };
}

const AUTO_BACKUP_SETTINGS_KEY = "payrollpro_auto_backup_settings";
const AUTO_BACKUP_PREFIX = "payrollpro_auto_backup_";
const AUTO_BACKUP_INDEX_KEY = "payrollpro_auto_backup_index";

const DEFAULT_SETTINGS: AutoBackupSettings = {
  enabled: false,
  intervalMinutes: 30,
  maxBackups: 5,
};

export function getAutoBackupSettings(): AutoBackupSettings {
  try {
    const stored = localStorage.getItem(AUTO_BACKUP_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error reading auto backup settings:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveAutoBackupSettings(settings: Partial<AutoBackupSettings>): AutoBackupSettings {
  const current = getAutoBackupSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(AUTO_BACKUP_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving auto backup settings:", error);
  }
  return updated;
}

export function getBackupIndex(): LocalBackup[] {
  try {
    const stored = localStorage.getItem(AUTO_BACKUP_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading backup index:", error);
  }
  return [];
}

function saveBackupIndex(index: LocalBackup[]): void {
  try {
    localStorage.setItem(AUTO_BACKUP_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error("Error saving backup index:", error);
  }
}

export async function createAutoBackup(): Promise<LocalBackup | null> {
  try {
    const data = await exportAllData();
    const jsonContent = JSON.stringify(data);
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const backup: LocalBackup = {
      id: backupId,
      timestamp,
      size: new Blob([jsonContent]).size,
      recordCount: {
        employees: data.employees.length,
        advances: data.advances.length,
        salaryPayments: data.salaryPayments.length,
        receipts: data.receipts.length,
      },
    };

    // Store the backup data
    localStorage.setItem(`${AUTO_BACKUP_PREFIX}${backupId}`, jsonContent);

    // Update index
    const index = getBackupIndex();
    index.unshift(backup);
    
    // Cleanup old backups
    const settings = getAutoBackupSettings();
    while (index.length > settings.maxBackups) {
      const oldBackup = index.pop();
      if (oldBackup) {
        localStorage.removeItem(`${AUTO_BACKUP_PREFIX}${oldBackup.id}`);
      }
    }
    
    saveBackupIndex(index);
    console.log(`Auto backup created: ${backupId}`);
    return backup;
  } catch (error) {
    console.error("Error creating auto backup:", error);
    return null;
  }
}

export function getBackupData(backupId: string): string | null {
  try {
    return localStorage.getItem(`${AUTO_BACKUP_PREFIX}${backupId}`);
  } catch (error) {
    console.error("Error reading backup data:", error);
    return null;
  }
}

export function deleteBackup(backupId: string): void {
  try {
    localStorage.removeItem(`${AUTO_BACKUP_PREFIX}${backupId}`);
    const index = getBackupIndex().filter(b => b.id !== backupId);
    saveBackupIndex(index);
  } catch (error) {
    console.error("Error deleting backup:", error);
  }
}

export function clearAllAutoBackups(): void {
  try {
    const index = getBackupIndex();
    for (const backup of index) {
      localStorage.removeItem(`${AUTO_BACKUP_PREFIX}${backup.id}`);
    }
    saveBackupIndex([]);
  } catch (error) {
    console.error("Error clearing auto backups:", error);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function useAutoBackup() {
  const [settings, setSettings] = useState<AutoBackupSettings>(getAutoBackupSettings);
  const [backups, setBackups] = useState<LocalBackup[]>(getBackupIndex);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshBackups = useCallback(() => {
    setBackups(getBackupIndex());
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AutoBackupSettings>) => {
    const updated = saveAutoBackupSettings(newSettings);
    setSettings(updated);
  }, []);

  const performBackup = useCallback(async () => {
    if (isBackingUp) return null;
    
    setIsBackingUp(true);
    try {
      const backup = await createAutoBackup();
      if (backup) {
        setLastBackupTime(new Date());
        refreshBackups();
      }
      return backup;
    } finally {
      setIsBackingUp(false);
    }
  }, [isBackingUp, refreshBackups]);

  const removeBackup = useCallback((backupId: string) => {
    deleteBackup(backupId);
    refreshBackups();
  }, [refreshBackups]);

  const clearBackups = useCallback(() => {
    clearAllAutoBackups();
    refreshBackups();
  }, [refreshBackups]);

  // Setup interval for auto backup
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (settings.enabled && settings.intervalMinutes > 0) {
      const intervalMs = settings.intervalMinutes * 60 * 1000;
      
      // Perform initial backup if no recent backup exists
      const recentBackups = getBackupIndex();
      if (recentBackups.length === 0) {
        performBackup();
      } else {
        const lastBackup = new Date(recentBackups[0].timestamp);
        const timeSinceLastBackup = Date.now() - lastBackup.getTime();
        if (timeSinceLastBackup >= intervalMs) {
          performBackup();
        }
      }

      intervalRef.current = setInterval(() => {
        performBackup();
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.enabled, settings.intervalMinutes, performBackup]);

  // Update last backup time on mount
  useEffect(() => {
    const recentBackups = getBackupIndex();
    if (recentBackups.length > 0) {
      setLastBackupTime(new Date(recentBackups[0].timestamp));
    }
  }, []);

  return {
    settings,
    updateSettings,
    backups,
    isBackingUp,
    lastBackupTime,
    performBackup,
    removeBackup,
    clearBackups,
    getBackupData,
  };
}
