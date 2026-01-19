import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllPositions, 
  addPosition, 
  updatePosition, 
  deletePosition,
  getPositionsByDepartment
} from "@/lib/db";
import { Position, generateId } from "@/types";
import { toast } from "@/hooks/use-toast";

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: getAllPositions,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePositionsByDepartment(department: string) {
  return useQuery({
    queryKey: ["positions", "department", department],
    queryFn: () => getPositionsByDepartment(department),
    enabled: !!department,
  });
}

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; department: string; description?: string }) => {
      const now = new Date().toISOString();
      const position: Position = {
        id: generateId(),
        name: data.name,
        department: data.department,
        description: data.description,
        createdAt: now,
        updatedAt: now,
      };

      await addPosition(position);
      return position;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Succès",
        description: "Poste ajouté avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le poste",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; department: string; description?: string }) => {
      const now = new Date().toISOString();
      const position: Position = {
        id: data.id,
        name: data.name,
        department: data.department,
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: now,
      };

      await updatePosition(position);
      return position;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Succès",
        description: "Poste mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le poste",
        variant: "destructive",
      });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Succès",
        description: "Poste supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le poste",
        variant: "destructive",
      });
    },
  });
}
