import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAdvances } from "@/hooks/useAdvances";
import { useSalaryPayments } from "@/hooks/useSalaryPayments";
import { Employee, SalaryPayment, formatCurrency, getMonthName, MONTHS, PAYMENT_STATUS } from "@/types";
import { SalaryPaymentForm } from "@/components/salaries/SalaryPaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, TrendingUp, TrendingDown, Search, Calculator, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Salaries() {
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { advances } = useAdvances();
  const { payments, addPayment, updatePayment, isLoading: paymentsLoading } = useSalaryPayments();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState("");
  
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Calculate salary data for each employee
  const salaryData = useMemo(() => {
    return employees
      .filter(e => e.status === 'active')
      .filter(e => 
        search === "" || 
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        e.matricule.toLowerCase().includes(search.toLowerCase())
      )
      .map(employee => {
        // Get advances for this employee and month
        const employeeAdvances = advances.filter(
          a => a.employeeId === employee.id && 
               a.month === selectedMonth && 
               a.year === selectedYear &&
               a.status === 'approved'
        );
        const totalAdvances = employeeAdvances.reduce((sum, a) => sum + a.amount, 0);

        // Get existing payment
        const existingPayment = payments.find(
          p => p.employeeId === employee.id && 
               p.month === selectedMonth && 
               p.year === selectedYear
        );

        const grossSalary = employee.baseSalary + employee.bonus;
        const netSalary = grossSalary - employee.deductions - totalAdvances;
        const amountPaid = existingPayment?.amountPaid || 0;
        const remainingAmount = netSalary - amountPaid;

        let status: 'pending' | 'partial' | 'paid' = 'pending';
        if (amountPaid >= netSalary) {
          status = 'paid';
        } else if (amountPaid > 0) {
          status = 'partial';
        }

        return {
          employee,
          grossSalary,
          totalAdvances,
          netSalary,
          amountPaid,
          remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
          status,
          existingPayment,
        };
      });
  }, [employees, advances, payments, selectedMonth, selectedYear, search]);

  // Summary stats
  const stats = useMemo(() => {
    return {
      totalEmployees: salaryData.length,
      totalGross: salaryData.reduce((sum, s) => sum + s.grossSalary, 0),
      totalNet: salaryData.reduce((sum, s) => sum + s.netSalary, 0),
      totalPaid: salaryData.reduce((sum, s) => sum + s.amountPaid, 0),
      totalRemaining: salaryData.reduce((sum, s) => sum + s.remainingAmount, 0),
      paidCount: salaryData.filter(s => s.status === 'paid').length,
      partialCount: salaryData.filter(s => s.status === 'partial').length,
      pendingCount: salaryData.filter(s => s.status === 'pending').length,
    };
  }, [salaryData]);

  const getAdvancesForEmployee = (employeeId: string) => {
    return advances
      .filter(a => a.employeeId === employeeId && 
                   a.month === selectedMonth && 
                   a.year === selectedYear &&
                   a.status === 'approved')
      .reduce((sum, a) => sum + a.amount, 0);
  };

  const handlePayClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setPaymentFormOpen(true);
  };

  const handlePaymentSubmit = async (payment: SalaryPayment) => {
    try {
      const existing = payments.find(
        p => p.employeeId === payment.employeeId && 
             p.month === payment.month && 
             p.year === payment.year
      );
      
      if (existing) {
        await updatePayment.mutateAsync(payment);
      } else {
        await addPayment.mutateAsync(payment);
      }
      
      toast.success("Paiement enregistré avec succès");
      setPaymentFormOpen(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = PAYMENT_STATUS.find(s => s.value === status);
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      partial: 'bg-info/10 text-info border-info/20',
      paid: 'bg-success/10 text-success border-success/20',
    };
    return (
      <Badge variant="outline" className={colors[status]}>
        {statusInfo?.label}
      </Badge>
    );
  };

  const isLoading = employeesLoading || paymentsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Gestion des Salaires</h1>
        <p className="page-description">Calcul automatique et paiements mensuels</p>
      </div>

      {/* Period selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 items-center">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Masse salariale nette</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalNet)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total payé</p>
                <p className="text-xl font-bold text-success">{formatCurrency(stats.totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reste à payer</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(stats.totalRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="text-sm">
                  <span className="text-success font-medium">{stats.paidCount}</span> payés, 
                  <span className="text-warning font-medium ml-1">{stats.partialCount}</span> partiels, 
                  <span className="text-muted-foreground ml-1">{stats.pendingCount}</span> en attente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bulletin de paie - {getMonthName(selectedMonth)} {selectedYear}</CardTitle>
          <CardDescription>{salaryData.length} employé(s) actif(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : salaryData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun employé actif trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-right">Salaire brut</TableHead>
                    <TableHead className="text-right">Avances</TableHead>
                    <TableHead className="text-right">Salaire net</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryData.map(({ employee, grossSalary, totalAdvances, netSalary, amountPaid, remainingAmount, status }) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="text-sm text-muted-foreground">{employee.matricule}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(grossSalary)}</TableCell>
                      <TableCell className="text-right text-destructive">
                        {totalAdvances > 0 ? `-${formatCurrency(totalAdvances)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(netSalary)}</TableCell>
                      <TableCell className="text-right text-success">
                        {amountPaid > 0 ? formatCurrency(amountPaid) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-warning font-medium">
                        {formatCurrency(remainingAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={status === 'paid' ? 'outline' : 'default'}
                          onClick={() => handlePayClick(employee)}
                          disabled={remainingAmount <= 0}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          {status === 'paid' ? 'Détails' : 'Payer'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form Dialog */}
      {selectedEmployee && (
        <SalaryPaymentForm
          open={paymentFormOpen}
          onOpenChange={setPaymentFormOpen}
          onSubmit={handlePaymentSubmit}
          employee={selectedEmployee}
          month={selectedMonth}
          year={selectedYear}
          existingPayment={payments.find(
            p => p.employeeId === selectedEmployee.id && 
                 p.month === selectedMonth && 
                 p.year === selectedYear
          )}
          totalAdvances={getAdvancesForEmployee(selectedEmployee.id)}
          isLoading={addPayment.isPending || updatePayment.isPending}
        />
      )}
    </div>
  );
}
