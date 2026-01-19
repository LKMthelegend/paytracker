import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllDepartments, 
  addDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentByName
} from "@/lib/db";
import { Department, generateId } from "@/types";
import { toast } from "@/hooks/use-toast";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getAllDepartments,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      try {
        // Check if department already exists
        const existing = await getDepartmentByName(data.name);
        if (existing) {
          throw new Error("Ce département existe déjà");
        }
      } catch (error: any) {
        // If not a duplicate error, continue
        if (error.message !== "Ce département existe déjà") {
          // First time - will fail but that's ok
        }
      }

      const now = new Date().toISOString();
      const department: Department = {
        id: generateId(),
        name: data.name,
        description: data.description,
        createdAt: now,
        updatedAt: now,
      };

      await addDepartment(department);
      return department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({
        title: "Succès",
        description: "Département ajouté avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le département",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string }) => {
      const existing = await getDepartmentByName(data.name);
      if (existing && existing.id !== data.id) {
        throw new Error("Ce nom de département est déjà utilisé");
      }

      const now = new Date().toISOString();
      const department: Department = {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: now,
      };

      await updateDepartment(department);
      return department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({
        title: "Succès",
        description: "Département mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le département",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Succès",
        description: "Département supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le département",
        variant: "destructive",
      });
    },
  });
}
