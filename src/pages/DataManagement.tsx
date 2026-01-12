import { Construction } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataManagement() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Données</h1>
        <p className="page-description">Import, export et sauvegarde des données</p>
      </div>
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Module en cours de développement</CardTitle>
          <CardDescription>L'import/export des données sera bientôt disponible</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
