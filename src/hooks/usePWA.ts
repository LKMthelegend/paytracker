import { useEffect, useState } from "react";
import { onPWAEvent, deferredPrompt, promptPWAInstall, getPWAInfo } from "@/lib/pwaUtils";

export interface PWAState {
  isSupported: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
}

/**
 * Hook pour accéder aux informations et fonctionnalités PWA
 */
export function usePWA() {
  const [pwaState, setPWAState] = useState<PWAState>(() => ({
    ...getPWAInfo(),
    updateAvailable: false,
  }));

  const [updateNotification, setUpdateNotification] = useState<{
    type: "new-content-available" | "offline" | "online";
    message: string;
  } | null>(null);

  useEffect(() => {
    // Écoute les événements PWA
    const unsubscribe = onPWAEvent((event) => {
      if (event.type === "new-content-available") {
        setPWAState((prev) => ({ ...prev, updateAvailable: true }));
        setUpdateNotification(event);
      } else if (event.type === "online" || event.type === "offline") {
        setPWAState((prev) => ({
          ...prev,
          isOnline: event.type === "online",
        }));
        setUpdateNotification(event);
      } else if (event.type === "service-worker-ready") {
        setPWAState((prev) => ({
          ...prev,
          canInstall: deferredPrompt !== null,
        }));
      }
    });

    // Met à jour l'état d'installation
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setPWAState((prev) => ({
        ...prev,
        isInstalled: e.matches,
      }));
    };

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    displayModeQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      unsubscribe();
      displayModeQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const installPWA = async () => {
    await promptPWAInstall();
  };

  const dismissUpdate = () => {
    setUpdateNotification(null);
  };

  const reloadApp = () => {
    window.location.reload();
  };

  return {
    ...pwaState,
    updateNotification,
    installPWA,
    dismissUpdate,
    reloadApp,
  };
}
