import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBackupReminder } from "@/hooks/useBackupReminder";

export function BackupReminderBanner() {
  const navigate = useNavigate();
  const { showReminder, onDismissReminder, daysSinceBackup, settings } = useBackupReminder();

  if (!showReminder) return null;

  const getMessage = () => {
    if (daysSinceBackup === null) {
      return "Vous n'avez jamais effectué de sauvegarde. Protégez vos données !";
    }
    if (daysSinceBackup === 0) {
      return "Il est temps de faire une sauvegarde de vos données.";
    }
    return `Dernière sauvegarde il y a ${daysSinceBackup} jour${daysSinceBackup > 1 ? 's' : ''}. Il est temps d'en faire une nouvelle !`;
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {getMessage()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={() => navigate("/data")}
          >
            <Database className="h-4 w-4 mr-1" />
            Sauvegarder
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={onDismissReminder}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
