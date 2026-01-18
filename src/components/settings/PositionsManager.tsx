import { useState } from "react";
import { Plus, Trash2, GripVertical, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PositionsManagerProps {
  positions: string[];
  onPositionsChange: (positions: string[]) => void;
}

const DEFAULT_POSITIONS = [
  'Directeur Général',
  'Directeur',
  'Chef de Département',
  "Chef d'Équipe",
  'Responsable',
  'Superviseur',
  'Technicien',
  'Agent',
  'Assistant',
  'Stagiaire',
  'Consultant',
  'Autre'
];

export function PositionsManager({ positions, onPositionsChange }: PositionsManagerProps) {
  const { toast } = useToast();
  const [newPosition, setNewPosition] = useState("");

  const handleAdd = () => {
    const trimmed = newPosition.trim();
    if (!trimmed) {
      toast({
        title: "Erreur",
        description: "Le nom du poste ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }
    if (positions.includes(trimmed)) {
      toast({
        title: "Erreur",
        description: "Ce poste existe déjà.",
        variant: "destructive",
      });
      return;
    }
    onPositionsChange([...positions, trimmed]);
    setNewPosition("");
    toast({
      title: "Poste ajouté",
      description: `"${trimmed}" a été ajouté à la liste.`,
    });
  };

  const handleRemove = (pos: string) => {
    if (positions.length <= 1) {
      toast({
        title: "Erreur",
        description: "Vous devez garder au moins un poste.",
        variant: "destructive",
      });
      return;
    }
    onPositionsChange(positions.filter(p => p !== pos));
    toast({
      title: "Poste supprimé",
      description: `"${pos}" a été retiré de la liste.`,
    });
  };

  const handleReset = () => {
    onPositionsChange(DEFAULT_POSITIONS);
    toast({
      title: "Liste réinitialisée",
      description: "Les postes par défaut ont été restaurés.",
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
          <Briefcase className="h-5 w-5" />
          Postes
        </CardTitle>
        <CardDescription>
          Gérez la liste des postes disponibles dans l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nouveau poste..."
            className="flex-1"
          />
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg min-h-[100px]">
          {positions.map((pos) => (
            <Badge
              key={pos}
              variant="secondary"
              className="flex items-center gap-1 py-1.5 px-3 text-sm"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground" />
              {pos}
              <button
                onClick={() => handleRemove(pos)}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label={`Supprimer ${pos}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{positions.length} poste(s)</span>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Réinitialiser par défaut
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { DEFAULT_POSITIONS };
