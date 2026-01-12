import { Construction } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Salaries() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Salaires</h1>
        <p className="page-description">Calcul automatique et paiements mensuels</p>
      </div>
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Module en cours de développement</CardTitle>
          <CardDescription>Le calcul et la gestion des salaires seront bientôt disponibles</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
