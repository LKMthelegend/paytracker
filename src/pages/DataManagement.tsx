import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEmployees, useCreateEmployee } from "@/hooks/useEmployees";
import { exportEmployeesToCSV, downloadCSV, parseCSVContent, generateSampleCSV } from "@/lib/csvUtils";
import { toast } from "@/hooks/use-toast";

export default function DataManagement() {
  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'partial';
    message?: string;
    details?: string[];
  }>({ type: 'idle' });
  const [isImporting, setIsImporting] = useState(false);

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

    // Reset input
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

      // Import employees one by one
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

      // Combine parsing warnings with import errors
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Données</h1>
        <p className="page-description">Import, export et sauvegarde des données employés</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exporter les Données
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

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importer des Données
            </CardTitle>
            <CardDescription>
              Ajoutez des employés à partir d'un fichier CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Fichier CSV avec les colonnes: Matricule, Prénom, Nom, Email, Salaire de base...
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
