import { Employee, formatCurrency, formatDate, EMPLOYEE_STATUS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Eye, Phone, Mail, Calendar, Building, Briefcase } from "lucide-react";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";
import { getDepartmentName, getPositionName } from "@/lib/employeeUtils";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onView: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onEdit, onDelete, onView }: EmployeeCardProps) {
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
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
    <Card className="group hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold truncate">
                  {employee.firstName} {employee.lastName}
                </h3>
                <Badge variant="outline" className={`text-xs shrink-0 ${getStatusColor(employee.status)}`}>
                  {statusInfo?.label}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(employee)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(employee)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(employee)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-sm text-muted-foreground mt-0.5">
              {employee.matricule} • {getPositionName(employee.position, positions)}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                <span>{getDepartmentName(employee.department, departments)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{employee.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="text-sm">
                <span className="text-muted-foreground">Salaire net : </span>
                <span className="font-semibold text-primary">{formatCurrency(netSalary)}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Embauché le {formatDate(employee.hireDate)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
