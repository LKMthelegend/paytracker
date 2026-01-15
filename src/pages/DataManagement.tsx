import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, FileDown, Database, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEmployees, useCreateEmployee } from "@/hooks/useEmployees";
import { useAdvances } from "@/hooks/useAdvances";
import { useSalaryPayments } from "@/hooks/useSalaryPayments";
import { exportEmployeesToCSV, downloadCSV, parseCSVContent, generateSampleCSV } from "@/lib/csvUtils";
import { exportAllData, importData, clearAllData } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function DataManagement() {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: advances = [] } = useAdvances();
  const { data: payments = [] } = useSalaryPayments();
  const createEmployee = useCreateEmployee();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'partial';
    message?: string;
    details?: string[];
  }>({ type: 'idle' });
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);

  const handleExportCSV = () => {
    if (employees.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a pas d'employés à exporter.",
        variant: "destructive"
      });
      return;
    }

    const csvContent = exportEmployeesToCSV(employees);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `employes_${date}.csv`);
    
    toast({
      title: "Export réussi",
      description: `${employees.length} employé(s) exporté(s) avec succès.`
    });
  };

  const handleDownloadTemplate = () => {
    const sampleCSV = generateSampleCSV();
    downloadCSV(sampleCSV, 'modele_import_employes.csv');
    
    toast({
      title: "Modèle téléchargé",
      description: "Utilisez ce modèle pour préparer vos données d'import."
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    if (!file.name.endsWith('.csv')) {
      setImportStatus({
        type: 'error',
        message: 'Format de fichier invalide',
        details: ['Veuillez sélectionner un fichier CSV (.csv)']
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({ type: 'idle' });

    try {
      const content = await file.text();
      const result = parseCSVContent(content);

      if (!result.success) {
        setImportStatus({
          type: 'error',
          message: 'Erreur de parsing',
          details: result.errors
        });
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      const importErrors: string[] = [];

      for (const employeeData of result.data!) {
        try {
          await createEmployee.mutateAsync(employeeData);
          successCount++;
        } catch (error) {
          importErrors.push(`${employeeData.firstName} ${employeeData.lastName}: ${error instanceof Error ? error.message : 'Erreur'}`);
        }
      }

      const allWarnings = [...(result.errors || []), ...importErrors];

      if (successCount === result.data!.length) {
        setImportStatus({
          type: 'success',
          message: `${successCount} employé(s) importé(s) avec succès`,
          details: allWarnings.length > 0 ? allWarnings : undefined
        });
      } else if (successCount > 0) {
        setImportStatus({
          type: 'partial',
          message: `${successCount}/${result.data!.length} employé(s) importé(s)`,
          details: allWarnings
        });
      } else {
        setImportStatus({
          type: 'error',
          message: 'Aucun employé importé',
          details: allWarnings
        });
      }

    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Erreur de lecture du fichier',
        details: [error instanceof Error ? error.message : 'Erreur inconnue']
      });
    } finally {
      setIsImporting(false);
    }
  };

  // JSON Backup/Restore Functions
  const handleExportJSON = async () => {
    setIsExportingJson(true);
    try {
      const allData = await exportAllData();
      const jsonContent = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `payrollpro_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const totalRecords = allData.employees.length + allData.advances.length + 
                          allData.salaryPayments.length + allData.receipts.length;
      
      toast({
        title: "Sauvegarde réussie",
        description: `${totalRecords} enregistrement(s) exporté(s) au format JSON.`
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleImportJSONClick = () => {
    jsonInputRef.current?.click();
  };

  const handleJSONFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier JSON (.json)",
        variant: "destructive"
      });
      return;
    }

    setIsImportingJson(true);
    try {
      const content = await file.text();
      const data = JSON.parse(content);

      // Validate structure
      if (!data || typeof data !== 'object') {
        throw new Error("Format de fichier invalide");
      }

      const hasValidData = data.employees || data.advances || data.salaryPayments || data.receipts;
      if (!hasValidData) {
        throw new Error("Aucune donnée valide trouvée dans le fichier");
      }

      await importData(data);
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      queryClient.invalidateQueries({ queryKey: ["salaryPayments"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });

      const importedCount = {
        employees: data.employees?.length || 0,
        advances: data.advances?.length || 0,
        payments: data.salaryPayments?.length || 0,
        receipts: data.receipts?.length || 0
      };

      toast({
        title: "Restauration réussie",
        description: `Importé: ${importedCount.employees} employés, ${importedCount.advances} avances, ${importedCount.payments} paiements, ${importedCount.receipts} reçus.`
      });

      setImportStatus({
        type: 'success',
        message: 'Restauration JSON réussie',
        details: [
          `${importedCount.employees} employé(s)`,
          `${importedCount.advances} avance(s)`,
          `${importedCount.payments} paiement(s) de salaire`,
          `${importedCount.receipts} reçu(s)`
        ]
      });

    } catch (error) {
      toast({
        title: "Erreur de restauration",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    } finally {
      setIsImportingJson(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData();
      
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      queryClient.invalidateQueries({ queryKey: ["salaryPayments"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });

      toast({
        title: "Données supprimées",
        description: "Toutes les données ont été effacées avec succès."
      });

      setImportStatus({ type: 'idle' });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    }
  };

  const totalRecords = employees.length + advances.length + payments.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Données</h1>
        <p className="page-description">Import, export et sauvegarde des données</p>
      </div>

      {/* Status Alert */}
      {importStatus.type !== 'idle' && (
        <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'} className={
          importStatus.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
          importStatus.type === 'partial' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''
        }>
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : importStatus.type === 'partial' ? (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{importStatus.message}</AlertTitle>
          {importStatus.details && importStatus.details.length > 0 && (
            <AlertDescription>
              <ul className="mt-2 list-disc list-inside text-sm">
                {importStatus.details.slice(0, 5).map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
                {importStatus.details.length > 5 && (
                  <li className="text-muted-foreground">
                    ... et {importStatus.details.length - 5} autre(s) avertissement(s)
                  </li>
                )}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      {/* JSON Backup Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Sauvegarde Complète (JSON)
            </CardTitle>
            <CardDescription>
              Exportez toutes vos données en un seul fichier JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-background rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{employees.length}</p>
                <p className="text-xs text-muted-foreground">Employés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{advances.length}</p>
                <p className="text-xs text-muted-foreground">Avances</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Paiements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalRecords}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <Button 
              onClick={handleExportJSON} 
              className="w-full"
              disabled={isExportingJson || totalRecords === 0}
            >
              {isExportingJson ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger la sauvegarde JSON
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Restaurer une Sauvegarde
            </CardTitle>
            <CardDescription>
              Importez un fichier de sauvegarde JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-6 text-center">
              <RotateCcw className="h-10 w-10 mx-auto text-amber-600 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Les données existantes seront fusionnées avec le fichier importé
              </p>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleJSONFileChange}
                className="hidden"
              />
              <Button 
                onClick={handleImportJSONClick} 
                variant="outline" 
                className="w-full border-amber-500 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900"
                disabled={isImportingJson}
              >
                {isImportingJson ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Restauration en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Sélectionner un fichier JSON
                  </>
                )}
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Effacer toutes les données
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes les données (employés, avances, paiements, reçus) seront définitivement supprimées.
                    <br /><br />
                    <strong>Conseil :</strong> Faites une sauvegarde JSON avant de continuer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer tout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* CSV Section */}
      <h2 className="text-lg font-semibold mt-8">Import/Export CSV (Employés uniquement)</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exporter les Employés
            </CardTitle>
            <CardDescription>
              Téléchargez la liste des employés au format CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">{employees.length} employé(s)</p>
                <p className="text-sm text-muted-foreground">disponible(s) pour l'export</p>
              </div>
            </div>
            <Button 
              onClick={handleExportCSV} 
              className="w-full"
              disabled={isLoading || employees.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter en CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importer des Employés
            </CardTitle>
            <CardDescription>
              Ajoutez des employés à partir d'un fichier CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Fichier CSV avec Matricule, Prénom, Nom, Salaire...
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                onClick={handleImportClick} 
                variant="outline" 
                className="w-full"
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Sélectionner un fichier CSV
                  </>
                )}
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleDownloadTemplate}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Télécharger un modèle CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Guide d'Import CSV</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Colonnes supportées</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Matricule</strong> - Auto-généré si absent</li>
                <li>• <strong>Prénom</strong> - Requis</li>
                <li>• <strong>Nom</strong> - Requis</li>
                <li>• <strong>Email</strong> - Format email valide</li>
                <li>• <strong>Téléphone</strong></li>
                <li>• <strong>Adresse</strong></li>
                <li>• <strong>Date de naissance</strong> - Format AAAA-MM-JJ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Colonnes numériques</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Date d'embauche</strong> - Format AAAA-MM-JJ</li>
                <li>• <strong>Poste</strong></li>
                <li>• <strong>Département</strong></li>
                <li>• <strong>Salaire de base</strong> - Requis, nombre positif</li>
                <li>• <strong>Prime</strong> - Nombre</li>
                <li>• <strong>Déductions</strong> - Nombre</li>
                <li>• <strong>Statut</strong> - Actif, Inactif ou Suspendu</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
