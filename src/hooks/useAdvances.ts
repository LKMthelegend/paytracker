import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllAdvances, 
  addAdvance, 
  updateAdvance, 
  deleteAdvance,
  getAdvancesByEmployee,
  getAdvancesByMonthYear
} from "@/lib/db";
import { Advance, AdvanceFormData, generateId } from "@/types";
import { toast } from "@/hooks/use-toast";

export function useAdvances() {
  return useQuery({
    queryKey: ["advances"],
    queryFn: getAllAdvances,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdvancesByEmployee(employeeId: string) {
  return useQuery({
    queryKey: ["advances", "employee", employeeId],
    queryFn: () => getAdvancesByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

export function useAdvancesByMonthYear(month: number, year: number) {
  return useQuery({
    queryKey: ["advances", "month", month, year],
    queryFn: () => getAdvancesByMonthYear(month, year),
    enabled: month > 0 && year > 0,
  });
}

export function useCreateAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AdvanceFormData) => {
      const now = new Date().toISOString();
      const advance: Advance = {
        ...data,
        id: generateId(),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      await addAdvance(advance);
      return advance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      toast({
        title: "Avance enregistrée",
        description: "La demande d'avance a été créée.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de créer l'avance: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Advance> }) => {
      const existing = await queryClient.fetchQuery({
        queryKey: ["advances"],
        queryFn: getAllAdvances,
      }).then(advances => advances.find(a => a.id === id));
      
      if (!existing) throw new Error("Avance non trouvée");
      
      const updated: Advance = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateAdvance(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      toast({
        title: "Avance modifiée",
        description: "L'avance a été mise à jour.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de modifier l'avance: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useApproveAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const advances = await getAllAdvances();
      const existing = advances.find(a => a.id === id);
      if (!existing) throw new Error("Avance non trouvée");
      
      const updated: Advance = {
        ...existing,
        status: "approved",
        approvalDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await updateAdvance(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      toast({
        title: "Avance approuvée",
        description: "L'avance a été approuvée et sera déduite du salaire.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible d'approuver l'avance: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useRejectAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const advances = await getAllAdvances();
      const existing = advances.find(a => a.id === id);
      if (!existing) throw new Error("Avance non trouvée");
      
      const updated: Advance = {
        ...existing,
        status: "rejected",
        updatedAt: new Date().toISOString(),
      };
      await updateAdvance(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      toast({
        title: "Avance rejetée",
        description: "La demande d'avance a été rejetée.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de rejeter l'avance: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdvance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advances"] });
      toast({
        title: "Avance supprimée",
        description: "L'avance a été supprimée.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer l'avance: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
