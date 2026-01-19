/**
 * PWA Utilities - Gestion du Service Worker et des mises à jour
 */

export interface PWAUpdateEvent {
  type: "new-content-available" | "service-worker-ready" | "offline" | "online";
  message: string;
}

type PWACallback = (event: PWAUpdateEvent) => void;

let callbacks: PWACallback[] = [];

/**
 * Enregistre une callback pour les événements PWA
 */
export function onPWAEvent(callback: PWACallback) {
  callbacks.push(callback);
  return () => {
    callbacks = callbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Notifie les callbacks d'un événement PWA
 */
function notifyPWAEvent(event: PWAUpdateEvent) {
  callbacks.forEach((cb) => cb(event));
}

/**
 * Enregistre les événements de connectivité
 */
export function registerConnectivityEvents() {
  window.addEventListener("online", () => {
    notifyPWAEvent({
      type: "online",
      message: "Application reconnectée",
    });
  });

  window.addEventListener("offline", () => {
    notifyPWAEvent({
      type: "offline",
      message: "Mode hors ligne - les modifications seront synchronisées",
    });
  });

  // Vérifie l'état initial
  if (!navigator.onLine) {
    notifyPWAEvent({
      type: "offline",
      message: "Vous êtes actuellement hors ligne",
    });
  }
}

/**
 * Vérifie si le navigateur supporte la PWA
 */
export function isPWASupported() {
  return "serviceWorker" in navigator && "caches" in window;
}

/**
 * Retourne true si l'application est en mode PWA (installed)
 */
export function isRunningAsPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Demande l'installation de la PWA (utilisé avec beforeinstallprompt event)
 */
export let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function captureInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyPWAEvent({
      type: "service-worker-ready",
      message: "Application disponible pour installation",
    });
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA a été installée");
    deferredPrompt = null;
  });
}

/**
 * Propose d'installer la PWA
 */
export async function promptPWAInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      console.log("User installed the PWA");
    }
    deferredPrompt = null;
  }
}

/**
 * Obtient les informations de la PWA
 */
export function getPWAInfo() {
  return {
    isSupported: isPWASupported(),
    isInstalled: isRunningAsPWA(),
    isOnline: navigator.onLine,
    canInstall: deferredPrompt !== null,
  };
}

/**
 * Partage le contenu via Web Share API si disponible
 */
export async function shareContent(data: ShareData) {
  if ("share" in navigator) {
    try {
      await (navigator as any).share(data);
    } catch (err) {
      console.log("Error sharing:", err);
    }
  }
}

/**
 * Demande les permissions de notification
 */
export async function requestNotificationPermission() {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  }
  return false;
}

/**
 * Envoie une notification
 */
export function sendNotification(title: string, options?: NotificationOptions) {
  if ("Notification" in window && Notification.permission === "granted") {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        options,
      });
    } else {
      new Notification(title, options);
    }
  }
}

/**
 * Initialise les services PWA
 */
export function initPWA() {
  if (!isPWASupported()) {
    console.warn("PWA not supported in this browser");
    return;
  }

  // Enregistre les événements de connectivité
  registerConnectivityEvents();

  // Capture le prompt d'installation
  captureInstallPrompt();

  // Demande la permission de notification au premier chargement
  const notificationPromptShown = localStorage.getItem("pwa-notification-prompted");
  if (!notificationPromptShown) {
    requestNotificationPermission();
    localStorage.setItem("pwa-notification-prompted", "true");
  }

  console.log("PWA initialized", getPWAInfo());
}
