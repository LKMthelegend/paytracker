import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Advance, AdvanceFormData, Employee, MONTHS, generateId, formatCurrency } from "@/types";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";

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
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);

  // Fetch departments and positions
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();

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

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    const activeEmployees = employees.filter(e => e.status === 'active');
    if (!employeeSearch.trim()) return activeEmployees;
    
    const searchLower = employeeSearch.toLowerCase().trim();
    return activeEmployees.filter(emp => 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchLower) ||
      emp.matricule.toLowerCase().includes(searchLower) ||
      emp.position.toLowerCase().includes(searchLower)
    );
  }, [employees, employeeSearch]);

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

  // Get department name by ID
  const getDepartmentName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || deptId;
  };

  // Get position name by ID
  const getPositionName = (posId: string) => {
    return positions.find(p => p.id === posId)?.name || posId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 px-2">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Employé *</FormLabel>
                  <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? selectedEmployee
                              ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.matricule})`
                              : "Sélectionner un employé"
                            : "Sélectionner un employé"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Rechercher par nom ou matricule..." 
                          value={employeeSearch}
                          onValueChange={setEmployeeSearch}
                        />
                        <CommandEmpty className="p-4 text-center text-sm text-muted-foreground">
                          Aucun employé trouvé.
                        </CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                              <CommandItem
                                key={emp.id}
                                value={emp.id}
                                onSelect={() => {
                                  field.onChange(emp.id);
                                  setEmployeePopoverOpen(false);
                                  setEmployeeSearch("");
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    emp.id === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {emp.firstName} {emp.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {emp.matricule} • {getPositionName(emp.position)}
                                  </div>
                                </div>
                              </CommandItem>
                            ))
                          ) : null}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedEmployee && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <div className="text-sm font-medium">Résumé de l'employé</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Poste:</span>
                    <span className="ml-2 font-medium">{getPositionName(selectedEmployee.position)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Département:</span>
                    <span className="ml-2 font-medium">{getDepartmentName(selectedEmployee.department)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Salaire net:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(selectedEmployee.baseSalary + selectedEmployee.bonus - selectedEmployee.deductions)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Limite d'avance:</span>
                    <span className="ml-2 font-medium text-success">{formatCurrency(maxAdvance)}</span>
                  </div>
                </div>
              </div>
            )}

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
            </div>

            <DialogFooter className="mt-6">
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
