import { Construction } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Advances() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestion des Avances</h1>
        <p className="page-description">Demandes et suivi des avances sur salaire</p>
      </div>
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Module en cours de développement</CardTitle>
          <CardDescription>La gestion des avances sera bientôt disponible</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
