import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SalaryPayment, Employee, formatCurrency, getMonthName, generateId } from "@/types";
import { Separator } from "@/components/ui/separator";

const paymentSchema = z.object({
  bonus: z.coerce.number().min(0, "Les primes doivent être positives"),
  deductions: z.coerce.number().min(0, "Les déductions doivent être positives"),
  amountPaid: z.coerce.number().min(0, "Le montant doit être positif"),
  paymentDate: z.string().min(1, "La date de paiement est requise"),
  notes: z.string().max(500).optional(),
});

interface SalaryPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SalaryPayment) => void;
  employee: Employee;
  month: number;
  year: number;
  existingPayment?: SalaryPayment | null;
  totalAdvances: number;
  isLoading?: boolean;
}

export function SalaryPaymentForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  employee,
  month,
  year,
  existingPayment,
  totalAdvances,
  isLoading 
}: SalaryPaymentFormProps) {
  const currentBonus = existingPayment?.bonus || employee.bonus;
  const currentDeductions = existingPayment?.deductions || employee.deductions;
  const grossSalary = employee.baseSalary + currentBonus;
  const netSalary = grossSalary - currentDeductions - totalAdvances;
  const alreadyPaid = existingPayment?.amountPaid || 0;
  const remainingToPay = netSalary - alreadyPaid;

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bonus: currentBonus,
      deductions: currentDeductions,
      amountPaid: remainingToPay > 0 ? remainingToPay : 0,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: existingPayment?.notes || "",
    },
  });

  // Watch bonus and deductions to update calculations
  const watchBonus = form.watch("bonus");
  const watchDeductions = form.watch("deductions");
  const watchAmountPaid = form.watch("amountPaid");
  
  // Convert to numbers to avoid string concatenation issues
  const bonusValue = typeof watchBonus === 'string' ? parseFloat(watchBonus) || 0 : watchBonus;
  const deductionsValue = typeof watchDeductions === 'string' ? parseFloat(watchDeductions) || 0 : watchDeductions;
  
  const recalculatedGrossSalary = employee.baseSalary + bonusValue;
  const recalculatedNetSalary = recalculatedGrossSalary - deductionsValue - totalAdvances;
  const recalculatedRemainingToPay = recalculatedNetSalary - alreadyPaid;

  // Auto-update amountPaid when bonus/deductions change (if not manually modified)
  React.useEffect(() => {
    if (recalculatedRemainingToPay > 0 && watchAmountPaid === remainingToPay) {
      form.setValue('amountPaid', recalculatedRemainingToPay);
    }
  }, [recalculatedRemainingToPay, watchAmountPaid, remainingToPay, form]);

  const handleSubmit = (data: { bonus: number; deductions: number; amountPaid: number; paymentDate: string; notes?: string }) => {
    // Ensure values are numbers
    const bonus = typeof data.bonus === 'string' ? parseFloat(data.bonus) || 0 : (data.bonus ?? 0);
    const deductions = typeof data.deductions === 'string' ? parseFloat(data.deductions) || 0 : (data.deductions ?? 0);
    const amountPaid = typeof data.amountPaid === 'string' ? parseFloat(data.amountPaid) || 0 : (data.amountPaid ?? 0);

    const adjustedGrossSalary = employee.baseSalary + bonus;
    const adjustedNetSalary = adjustedGrossSalary - deductions - totalAdvances;
    const newTotalPaid = alreadyPaid + amountPaid;
    const newRemaining = adjustedNetSalary - newTotalPaid;
    const now = new Date().toISOString();

    let status: 'pending' | 'partial' | 'paid' = 'pending';
    if (newTotalPaid >= adjustedNetSalary) {
      status = 'paid';
    } else if (newTotalPaid > 0) {
      status = 'partial';
    }

    const paymentData: SalaryPayment = {
      id: existingPayment?.id || generateId(),
      employeeId: employee.id,
      month,
      year,
      baseSalary: employee.baseSalary,
      bonus: bonus,
      deductions: deductions,
      totalAdvances,
      netSalary: adjustedNetSalary,
      amountPaid: newTotalPaid,
      remainingAmount: newRemaining > 0 ? newRemaining : 0,
      status,
      paymentDate: data.paymentDate,
      notes: data.notes,
      createdAt: existingPayment?.createdAt || now,
      updatedAt: now,
    };

    onSubmit(paymentData);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paiement de salaire</DialogTitle>
          <DialogDescription>
            {employee.firstName} {employee.lastName} - {getMonthName(month)} {year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pr-4">
          {/* Récapitulatif */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium mb-3">Récapitulatif du salaire</h4>
            <div className="flex justify-between text-sm">
              <span>Salaire de base</span>
              <span>{formatCurrency(employee.baseSalary)}</span>
            </div>
            <div className="flex justify-between text-sm text-success">
              <span>+ Primes</span>
              <span>{formatCurrency(bonusValue)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>- Déductions</span>
              <span>{formatCurrency(deductionsValue)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>- Avances versées</span>
              <span>{formatCurrency(totalAdvances)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Salaire net</span>
              <span className="text-primary">{formatCurrency(recalculatedNetSalary)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Déjà payé</span>
              <span>{formatCurrency(alreadyPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold text-warning">
              <span>Reste à payer</span>
              <span>{formatCurrency(recalculatedRemainingToPay)}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primes *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} step={0.01} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Déductions *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} step={0.01} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant à payer *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} max={recalculatedRemainingToPay} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de paiement *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Notes sur le paiement..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading || recalculatedRemainingToPay <= 0}>
                  {isLoading ? "Enregistrement..." : "Enregistrer le paiement"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
