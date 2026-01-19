import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Employee,
  EmployeeFormData,
  generateId,
  generateMatricule,
  formatCurrency,
} from "@/types";

import { useDepartments } from "@/hooks/useDepartments";
import { usePositionsByDepartment } from "@/hooks/usePositions";

const employeeSchema = z.object({
  matricule: z.string().min(1),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email().or(z.literal("")),
  phone: z.string().min(8).max(20),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  hireDate: z.string().min(1),
  position: z.string().min(1),
  department: z.string().min(1),
  baseSalary: z.coerce.number().min(0),
  bonus: z.coerce.number().optional().default(0),
  deductions: z.coerce.number().optional().default(0),
  status: z.enum(["active", "inactive", "suspended"]),
});

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Employee) => void;
  employee?: Employee | null;
  isLoading?: boolean;
}

export function EmployeeForm({
  open,
  onOpenChange,
  onSubmit,
  employee,
  isLoading,
}: EmployeeFormProps) {
  const isEditing = !!employee;

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? { ...employee }
      : {
          matricule: generateMatricule(),
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          dateOfBirth: "",
          hireDate: new Date().toISOString().split("T")[0],
          position: "",
          department: "",
          baseSalary: 0,
          bonus: 0,
          deductions: 0,
          status: "active",
        },
  });

  const { data: departments = [] } = useDepartments();
  const selectedDept = form.watch("department");
  const { data: positions = [] } = usePositionsByDepartment(selectedDept);

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const handleSubmit = (data: EmployeeFormData) => {
    const now = new Date().toISOString();

    onSubmit({
      id: employee?.id ?? generateId(),
      ...data,
      address: data.address ?? "",
      createdAt: employee?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'employé" : "Nouvel employé"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de l'employé"
              : "Créer un nouvel employé"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Département */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Département *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un département" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Poste */}
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poste *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedDept}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un poste" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Salaire */}
            <FormField
              control={form.control}
              name="baseSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salaire de base *</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEditing ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
