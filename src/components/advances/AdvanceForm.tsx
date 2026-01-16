import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Advance, AdvanceFormData, Employee, MONTHS, generateId, formatCurrency } from "@/types";

const advanceSchema = z.object({
  employeeId: z.string().min(1, "L'employé est requis"),
  amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0"),
  reason: z.string().min(5, "La raison doit contenir au moins 5 caractères").max(500),
  requestDate: z.string().min(1, "La date de demande est requise"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  notes: z.string().max(500).optional(),
});

interface AdvanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Advance) => void;
  employees: Employee[];
  advance?: Advance | null;
  isLoading?: boolean;
}

export function AdvanceForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  employees, 
  advance,
  isLoading 
}: AdvanceFormProps) {
  const isEditing = !!advance;
  const currentDate = new Date();

  const form = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
    defaultValues: advance ? {
      employeeId: advance.employeeId,
      amount: advance.amount,
      reason: advance.reason,
      requestDate: advance.requestDate,
      month: advance.month,
      year: advance.year,
      notes: advance.notes,
    } : {
      employeeId: "",
      amount: 0,
      reason: "",
      requestDate: currentDate.toISOString().split('T')[0],
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      notes: "",
    },
  });

  const handleSubmit = (data: AdvanceFormData) => {
    const now = new Date().toISOString();
    const advanceData: Advance = {
      id: advance?.id || generateId(),
      ...data,
      notes: data.notes || "",
      status: advance?.status || 'pending',
      createdAt: advance?.createdAt || now,
      updatedAt: now,
    };
    onSubmit(advanceData);
    form.reset();
  };

  const selectedEmployee = employees.find(e => e.id === form.watch('employeeId'));
  const maxAdvance = selectedEmployee 
    ? (selectedEmployee.baseSalary + selectedEmployee.bonus - selectedEmployee.deductions) * 0.5
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'avance" : "Nouvelle avance"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifiez les informations de l'avance" 
              : "Enregistrez une nouvelle demande d'avance sur salaire"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employé *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un employé" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.filter(e => e.status === 'active').map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.matricule})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant *</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} placeholder="50000" />
                  </FormControl>
                  {selectedEmployee && (
                    <p className="text-xs text-muted-foreground">
                      Maximum recommandé : {formatCurrency(maxAdvance)} (50% du salaire net)
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mois concerné *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map(m => (
                          <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={2020} max={2100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requestDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de demande *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif de l'avance *</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Raison de la demande d'avance..." rows={3} />
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
                    <Textarea {...field} placeholder="Notes supplémentaires..." rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
