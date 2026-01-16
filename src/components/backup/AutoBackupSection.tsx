import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAutoBackup, formatBytes, LocalBackup } from "@/hooks/useAutoBackup";
import { importData } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, HardDrive, RefreshCw, Trash2, Download, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function AutoBackupSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    settings,
    updateSettings,
    backups,
    isBackingUp,
    lastBackupTime,
    performBackup,
    removeBackup,
    clearBackups,
    getBackupData,
  } = useAutoBackup();

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const intervalOptions = [
    { value: "5", label: "Toutes les 5 minutes" },
    { value: "15", label: "Toutes les 15 minutes" },
    { value: "30", label: "Toutes les 30 minutes" },
    { value: "60", label: "Toutes les heures" },
  ];

  const maxBackupsOptions = [
    { value: "3", label: "3 sauvegardes" },
    { value: "5", label: "5 sauvegardes" },
    { value: "10", label: "10 sauvegardes" },
  ];

  const handleRestore = async (backup: LocalBackup) => {
    setIsRestoring(true);
    setRestoringId(backup.id);
    
    try {
      const dataStr = getBackupData(backup.id);
      if (!dataStr) {
        throw new Error("Données de sauvegarde introuvables");
      }

      const data = JSON.parse(dataStr);
      await importData(data);

      // Refresh all queries
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      queryClient.invalidateQueries({ queryKey: ["salaryPayments"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });

      toast({
        title: "Restauration réussie",
        description: `Données restaurées depuis la sauvegarde du ${format(new Date(backup.timestamp), "dd/MM/yyyy à HH:mm", { locale: fr })}`,
      });
    } catch (error) {
      toast({
        title: "Erreur de restauration",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setRestoringId(null);
    }
  };

  const handleDownloadBackup = (backup: LocalBackup) => {
    const dataStr = getBackupData(backup.id);
    if (!dataStr) {
      toast({
        title: "Erreur",
        description: "Données de sauvegarde introuvables",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payrollpro_backup_${format(new Date(backup.timestamp), "yyyy-MM-dd_HH-mm")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Téléchargement",
      description: "Sauvegarde téléchargée avec succès",
    });
  };

  const getTotalSize = () => {
    return backups.reduce((total, b) => total + b.size, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Sauvegarde Automatique Locale
        </CardTitle>
        <CardDescription>
          Sauvegardez automatiquement vos données dans le stockage local du navigateur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup-enabled">Activer la sauvegarde automatique</Label>
              <p className="text-sm text-muted-foreground">
                Sauvegarde périodique vers le stockage local
              </p>
            </div>
            <Switch
              id="auto-backup-enabled"
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <Select
                    value={settings.intervalMinutes.toString()}
                    onValueChange={(value) => updateSettings({ intervalMinutes: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {intervalOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nombre maximum de sauvegardes</Label>
                  <Select
                    value={settings.maxBackups.toString()}
                    onValueChange={(value) => updateSettings({ maxBackups: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {maxBackupsOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                <span>
                  Espace utilisé : {formatBytes(getTotalSize())} ({backups.length} sauvegarde{backups.length !== 1 ? "s" : ""})
                </span>
              </div>
            </>
          )}
        </div>

        {/* Manual backup button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => performBackup()}
            disabled={isBackingUp}
            variant="outline"
          >
            {isBackingUp ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sauvegarder maintenant
          </Button>
          
          {lastBackupTime && (
            <span className="text-sm text-muted-foreground">
              Dernière sauvegarde : {format(lastBackupTime, "dd/MM/yyyy à HH:mm", { locale: fr })}
            </span>
          )}
        </div>

        {/* Backups list */}
        {backups.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Sauvegardes disponibles</h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Tout supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer toutes les sauvegardes ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement toutes les sauvegardes automatiques locales.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={clearBackups}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="space-y-2">
              {backups.map((backup, index) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {format(new Date(backup.timestamp), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Plus récente
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {backup.recordCount.employees} employé(s), {backup.recordCount.advances} avance(s),{" "}
                      {backup.recordCount.salaryPayments} paiement(s), {backup.recordCount.receipts} reçu(s)
                      <span className="ml-2">• {formatBytes(backup.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadBackup(backup)}
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isRestoring}
                          title="Restaurer"
                        >
                          {restoringId === backup.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restaurer cette sauvegarde ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action restaurera les données de la sauvegarde du{" "}
                            {format(new Date(backup.timestamp), "dd/MM/yyyy à HH:mm", { locale: fr })}.
                            Les données actuelles seront fusionnées avec cette sauvegarde.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRestore(backup)}>
                            Restaurer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBackup(backup.id)}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {backups.length === 0 && settings.enabled && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune sauvegarde automatique disponible. La première sauvegarde sera créée selon l'intervalle configuré.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
