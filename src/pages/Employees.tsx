import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Employees() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Employés</h1>
        <p className="page-description">Gérez les fiches et informations du personnel</p>
      </div>
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Module en cours de développement</CardTitle>
          <CardDescription>La gestion complète des employés sera bientôt disponible</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
