import { useState } from "react";
import { Plus, Trash2, GripVertical, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DepartmentsManagerProps {
  departments: string[];
  onDepartmentsChange: (departments: string[]) => void;
}

const DEFAULT_DEPARTMENTS = [
  'Direction',
  'Ressources Humaines',
  'Comptabilité',
  'Marketing',
  'Commercial',
  'Production',
  'Logistique',
  'Informatique',
  'Juridique',
  'Maintenance',
  'Qualité',
  'Autre'
];

export function DepartmentsManager({ departments, onDepartmentsChange }: DepartmentsManagerProps) {
  const { toast } = useToast();
  const [newDepartment, setNewDepartment] = useState("");

  const handleAdd = () => {
    const trimmed = newDepartment.trim();
    if (!trimmed) {
      toast({
        title: "Erreur",
        description: "Le nom du département ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }
    if (departments.includes(trimmed)) {
      toast({
        title: "Erreur",
        description: "Ce département existe déjà.",
        variant: "destructive",
      });
      return;
    }
    onDepartmentsChange([...departments, trimmed]);
    setNewDepartment("");
    toast({
      title: "Département ajouté",
      description: `"${trimmed}" a été ajouté à la liste.`,
    });
  };

  const handleRemove = (dept: string) => {
    if (departments.length <= 1) {
      toast({
        title: "Erreur",
        description: "Vous devez garder au moins un département.",
        variant: "destructive",
      });
      return;
    }
    onDepartmentsChange(departments.filter(d => d !== dept));
    toast({
      title: "Département supprimé",
      description: `"${dept}" a été retiré de la liste.`,
    });
  };

  const handleReset = () => {
    onDepartmentsChange(DEFAULT_DEPARTMENTS);
    toast({
      title: "Liste réinitialisée",
      description: "Les départements par défaut ont été restaurés.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Départements
        </CardTitle>
        <CardDescription>
          Gérez la liste des départements disponibles dans l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nouveau département..."
            className="flex-1"
          />
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg min-h-[100px]">
          {departments.map((dept) => (
            <Badge
              key={dept}
              variant="secondary"
              className="flex items-center gap-1 py-1.5 px-3 text-sm"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground" />
              {dept}
              <button
                onClick={() => handleRemove(dept)}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label={`Supprimer ${dept}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{departments.length} département(s)</span>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Réinitialiser par défaut
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { DEFAULT_DEPARTMENTS };
