import { useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Download, Wifi, WifiOff, RefreshCw } from "lucide-react";

/**
 * Composant pour afficher les notifications et mises à jour PWA
 */
export function PWANotifications() {
  const { updateNotification, reloadApp, dismissUpdate, isOnline } = usePWA();

  return (
    <>
      {/* Notification de mise à jour disponible */}
      <AlertDialog open={updateNotification?.type === "new-content-available"} onOpenChange={dismissUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Mise à jour disponible
            </AlertDialogTitle>
            <AlertDialogDescription>
              Une nouvelle version de l'application est disponible. Voulez-vous l'installer maintenant ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Plus tard</AlertDialogCancel>
            <AlertDialogAction onClick={reloadApp}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Mettre à jour
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alerte de connectivité offline */}
      {!isOnline && updateNotification?.type === "offline" && (
        <Alert className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-100">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Vous êtes hors ligne. Les modifications seront synchronisées quand la connexion reviendra.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerte de retour en ligne */}
      {isOnline && updateNotification?.type === "online" && (
        <Alert className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          <Wifi className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Connexion rétablie. Synchronisation des données en cours...
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

/**
 * Composant pour le bouton d'installation PWA
 */
export function PWAInstallButton() {
  const { canInstall, isInstalled, installPWA } = usePWA();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <button
      onClick={installPWA}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-foreground bg-accent hover:bg-accent/80 transition-colors"
      title="Installer l'application"
    >
      <Download className="w-4 h-4" />
      <span>Installer l'app</span>
    </button>
  );
}

/**
 * Composant pour afficher l'indicateur de connectivité
 */
export function PWAConnectivityIndicator() {
  const { isOnline } = usePWA();

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOnline
          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
          : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
      }`}
      title={isOnline ? "Connecté" : "Hors ligne"}
    >
      {isOnline ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <span>{isOnline ? "En ligne" : "Hors ligne"}</span>
    </div>
  );
}
