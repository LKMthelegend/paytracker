// Application Settings Management

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyLogo: string; // Base64 encoded image
  currency: string;
  currencySymbol: string;
  locale: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "VOTRE ENTREPRISE",
  companyAddress: "Adresse de l'entreprise",
  companyPhone: "+261 XX XX XXX XX",
  companyLogo: "",
  currency: "MGA",
  currencySymbol: "Ar",
  locale: "fr-MG",
};

const SETTINGS_KEY = 'payroll_app_settings';

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  // Dispatch event to notify components of settings change
  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: updated }));
  return updated;
}

export function formatCurrencyWithSettings(amount: number): string {
  const settings = getSettings();
  return new Intl.NumberFormat(settings.locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + settings.currencySymbol;
}
