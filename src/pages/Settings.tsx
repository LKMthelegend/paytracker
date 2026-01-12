import { Construction } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-description">Configuration de l'application</p>
      </div>
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Module en cours de développement</CardTitle>
          <CardDescription>Les paramètres seront bientôt disponibles</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
