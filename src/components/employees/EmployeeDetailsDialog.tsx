import { Employee, formatCurrency, formatDate, EMPLOYEE_STATUS } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Calendar, Building, Briefcase, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";
import { getDepartmentName, getPositionName } from "@/lib/employeeUtils";

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export function EmployeeDetailsDialog({ open, onOpenChange, employee }: EmployeeDetailsDialogProps) {
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  if (!employee) return null;

  const statusInfo = EMPLOYEE_STATUS.find(s => s.value === employee.status);
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
  const netSalary = employee.baseSalary + employee.bonus - employee.deductions;

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'inactive': return 'bg-muted text-muted-foreground border-muted';
      case 'suspended': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Détails de l'employé</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h2>
              <p className="text-muted-foreground">{employee.matricule}</p>
              <Badge variant="outline" className={`mt-1 ${getStatusColor(employee.status)}`}>
                {statusInfo?.label}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Informations personnelles */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Informations personnelles
            </h3>
            <div className="grid gap-3">
              {employee.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee.phone}</span>
              </div>
              {employee.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Né(e) le {formatDate(employee.dateOfBirth)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informations professionnelles */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Informations professionnelles
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{getDepartmentName(employee.department, departments)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{getPositionName(employee.position, positions)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Embauché le {formatDate(employee.hireDate)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informations salariales */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Salaire de base
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Salaire de base</span>
                </div>
                <span className="font-medium">{formatCurrency(employee.baseSalary)}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            Dernière mise à jour : {formatDate(employee.updatedAt)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
