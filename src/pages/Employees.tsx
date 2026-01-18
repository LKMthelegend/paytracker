import { useState, useMemo } from "react";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { Employee, EMPLOYEE_STATUS } from "@/types";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { EmployeeDetailsDialog } from "@/components/employees/EmployeeDetailsDialog";
import { DeleteEmployeeDialog } from "@/components/employees/DeleteEmployeeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { getDepartments } from "@/lib/appSettings";

const ITEMS_PER_PAGE = 12;

export default function Employees() {
  const { data: employees = [], isLoading } = useEmployees();
  const addEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const departments = getDepartments();
  
  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered and paginated employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = search === "" || 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        emp.matricule.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const hasFilters = search || departmentFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Handlers
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data: Employee) => {
    try {
      if (selectedEmployee) {
        await updateEmployee.mutateAsync({ id: selectedEmployee.id, data });
        toast.success("Employé mis à jour avec succès");
      } else {
        await addEmployee.mutateAsync(data);
        toast.success("Employé créé avec succès");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteEmployee.mutateAsync(selectedEmployee.id);
      toast.success("Employé supprimé avec succès");
      setDeleteOpen(false);
    } catch (error) {
      toast.error("Une erreur est survenue lors de la suppression");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Gestion des Employés</h1>
          <p className="page-description">
            {employees.length} employé{employees.length !== 1 ? 's' : ''} enregistré{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleAddEmployee} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel employé
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, matricule ou email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={departmentFilter} onValueChange={(v) => { setDepartmentFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {EMPLOYEE_STATUS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>
              {hasFilters ? "Aucun résultat" : "Aucun employé"}
            </CardTitle>
            <CardDescription>
              {hasFilters 
                ? "Aucun employé ne correspond à vos critères de recherche" 
                : "Commencez par ajouter votre premier employé"
              }
            </CardDescription>
            {hasFilters ? (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            ) : (
              <Button className="mt-4" onClick={handleAddEmployee}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un employé
              </Button>
            )}
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedEmployees.map(employee => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteClick}
                onView={handleViewEmployee}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "ghost"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        employee={selectedEmployee}
        isLoading={addEmployee.isPending || updateEmployee.isPending}
      />

      <EmployeeDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        employee={selectedEmployee}
      />

      <DeleteEmployeeDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        employee={selectedEmployee}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteEmployee.isPending}
      />
    </div>
  );
}
