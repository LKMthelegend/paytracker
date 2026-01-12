import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllSalaryPayments, 
  addSalaryPayment, 
  updateSalaryPayment, 
  getSalaryPaymentsByEmployee,
  getSalaryPaymentsByMonthYear,
  getEmployeeSalaryForMonth,
  calculateTotalAdvancesForMonth
} from "@/lib/db";
import { SalaryPayment, Employee, generateId } from "@/types";
import { toast } from "@/hooks/use-toast";

export function useSalaryPayments() {
  return useQuery({
    queryKey: ["salaryPayments"],
    queryFn: getAllSalaryPayments,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSalaryPaymentsByEmployee(employeeId: string) {
  return useQuery({
    queryKey: ["salaryPayments", "employee", employeeId],
    queryFn: () => getSalaryPaymentsByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

export function useSalaryPaymentsByMonthYear(month: number, year: number) {
  return useQuery({
    queryKey: ["salaryPayments", "month", month, year],
    queryFn: () => getSalaryPaymentsByMonthYear(month, year),
    enabled: month > 0 && year > 0,
  });
}

export function useCalculateMonthlySalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      employee, 
      month, 
      year 
    }: { 
      employee: Employee; 
      month: number; 
      year: number 
    }) => {
      // Check if payment already exists
      const existing = await getEmployeeSalaryForMonth(employee.id, month, year);
      if (existing) {
        return existing;
      }

      // Calculate total advances for this month
      const totalAdvances = await calculateTotalAdvancesForMonth(employee.id, month, year);
      
      // Calculate net salary
      const grossSalary = employee.baseSalary + employee.bonus;
      const netSalary = grossSalary - employee.deductions - totalAdvances;

      const now = new Date().toISOString();
      const payment: SalaryPayment = {
        id: generateId(),
        employeeId: employee.id,
        month,
        year,
        baseSalary: employee.baseSalary,
        bonus: employee.bonus,
        deductions: employee.deductions,
        totalAdvances,
        netSalary: Math.max(0, netSalary),
        amountPaid: 0,
        remainingAmount: Math.max(0, netSalary),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      await addSalaryPayment(payment);
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryPayments"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de calculer le salaire: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useRecordSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      amount,
      notes
    }: { 
      paymentId: string; 
      amount: number;
      notes?: string;
    }) => {
      const payments = await getAllSalaryPayments();
      const existing = payments.find(p => p.id === paymentId);
      if (!existing) throw new Error("Paiement non trouvé");
      
      const newAmountPaid = existing.amountPaid + amount;
      const newRemaining = existing.netSalary - newAmountPaid;
      
      const updated: SalaryPayment = {
        ...existing,
        amountPaid: newAmountPaid,
        remainingAmount: Math.max(0, newRemaining),
        status: newRemaining <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "pending",
        paymentDate: new Date().toISOString(),
        notes: notes || existing.notes,
        updatedAt: new Date().toISOString(),
      };
      
      await updateSalaryPayment(updated);
      return updated;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["salaryPayments"] });
      toast({
        title: payment.status === "paid" ? "Salaire payé" : "Paiement enregistré",
        description: payment.status === "paid" 
          ? "Le salaire a été entièrement payé."
          : "Le paiement partiel a été enregistré.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer le paiement: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateMonthlySalaries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      employees, 
      month, 
      year 
    }: { 
      employees: Employee[]; 
      month: number; 
      year: number 
    }) => {
      const results: SalaryPayment[] = [];
      
      for (const employee of employees) {
        if (employee.status !== 'active') continue;
        
        const existing = await getEmployeeSalaryForMonth(employee.id, month, year);
        if (existing) {
          results.push(existing);
          continue;
        }

        const totalAdvances = await calculateTotalAdvancesForMonth(employee.id, month, year);
        const grossSalary = employee.baseSalary + employee.bonus;
        const netSalary = grossSalary - employee.deductions - totalAdvances;

        const now = new Date().toISOString();
        const payment: SalaryPayment = {
          id: generateId(),
          employeeId: employee.id,
          month,
          year,
          baseSalary: employee.baseSalary,
          bonus: employee.bonus,
          deductions: employee.deductions,
          totalAdvances,
          netSalary: Math.max(0, netSalary),
          amountPaid: 0,
          remainingAmount: Math.max(0, netSalary),
          status: "pending",
          createdAt: now,
          updatedAt: now,
        };

        await addSalaryPayment(payment);
        results.push(payment);
      }
      
      return results;
    },
    onSuccess: (payments) => {
      queryClient.invalidateQueries({ queryKey: ["salaryPayments"] });
      toast({
        title: "Salaires générés",
        description: `${payments.length} fiches de salaire ont été générées.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de générer les salaires: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}
