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
  const grossSalary = employee.baseSalary + employee.bonus;
  const netSalary = grossSalary - employee.deductions - totalAdvances;
  const alreadyPaid = existingPayment?.amountPaid || 0;
  const remainingToPay = netSalary - alreadyPaid;

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amountPaid: remainingToPay > 0 ? remainingToPay : 0,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: existingPayment?.notes || "",
    },
  });

  const handleSubmit = (data: { amountPaid: number; paymentDate: string; notes?: string }) => {
    const newTotalPaid = alreadyPaid + data.amountPaid;
    const newRemaining = netSalary - newTotalPaid;
    const now = new Date().toISOString();

    let status: 'pending' | 'partial' | 'paid' = 'pending';
    if (newTotalPaid >= netSalary) {
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
      bonus: employee.bonus,
      deductions: employee.deductions,
      totalAdvances,
      netSalary,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Paiement de salaire</DialogTitle>
          <DialogDescription>
            {employee.firstName} {employee.lastName} - {getMonthName(month)} {year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Récapitulatif */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium mb-3">Récapitulatif du salaire</h4>
            <div className="flex justify-between text-sm">
              <span>Salaire de base</span>
              <span>{formatCurrency(employee.baseSalary)}</span>
            </div>
            <div className="flex justify-between text-sm text-success">
              <span>+ Primes</span>
              <span>{formatCurrency(employee.bonus)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>- Déductions</span>
              <span>{formatCurrency(employee.deductions)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>- Avances versées</span>
              <span>{formatCurrency(totalAdvances)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Salaire net</span>
              <span className="text-primary">{formatCurrency(netSalary)}</span>
            </div>
            {alreadyPaid > 0 && (
              <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Déjà payé</span>
                  <span>{formatCurrency(alreadyPaid)}</span>
                </div>
                <div className="flex justify-between font-semibold text-warning">
                  <span>Reste à payer</span>
                  <span>{formatCurrency(remainingToPay)}</span>
                </div>
              </>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant à payer (FCFA) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} max={remainingToPay} />
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
                <Button type="submit" disabled={isLoading || remainingToPay <= 0}>
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
