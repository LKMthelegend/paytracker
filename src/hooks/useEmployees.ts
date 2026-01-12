import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee,
  getEmployee 
} from "@/lib/db";
import { Employee, EmployeeFormData, generateId, generateMatricule } from "@/types";
import { toast } from "@/hooks/use-toast";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: getAllEmployees,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const now = new Date().toISOString();
      const employee: Employee = {
        ...data,
        id: generateId(),
        matricule: data.matricule || generateMatricule(),
        createdAt: now,
        updatedAt: now,
      };
      await addEmployee(employee);
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Employé créé",
        description: "L'employé a été ajouté avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de créer l'employé: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => {
      const existing = await getEmployee(id);
      if (!existing) throw new Error("Employé non trouvé");
      
      const updated: Employee = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateEmployee(updated);
      return updated;
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] });
      toast({
        title: "Employé modifié",
        description: "Les informations ont été mises à jour.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de modifier l'employé: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteEmployee(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer l'employé: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
