import { useEffect, useState } from "react";
import { Users, Calculator, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmployees } from "@/hooks/useEmployees";
import { useAdvances } from "@/hooks/useAdvances";
import { useSalaryPayments } from "@/hooks/useSalaryPayments";
import { formatCurrency, getMonthName } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const { data: advances = [], isLoading: loadingAdvances } = useAdvances();
  const { data: payments = [], isLoading: loadingPayments } = useSalaryPayments();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const activeEmployees = employees.filter(e => e.status === 'active');
  const totalMonthlySalary = activeEmployees.reduce((sum, e) => sum + e.baseSalary + e.bonus - e.deductions, 0);
  const pendingAdvances = advances.filter(a => a.status === 'pending');
  const pendingAdvancesAmount = pendingAdvances.reduce((sum, a) => sum + a.amount, 0);
  
  const currentMonthPayments = payments.filter(p => p.month === currentMonth && p.year === currentYear);
  const paidThisMonth = currentMonthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const remainingToPay = currentMonthPayments.reduce((sum, p) => sum + p.remainingAmount, 0);

  const isLoading = loadingEmployees || loadingAdvances || loadingPayments;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-description">Vue d'ensemble de la gestion des salaires</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-description">
          Vue d'ensemble - {getMonthName(currentMonth)} {currentYear}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Employés actifs"
          value={activeEmployees.length}
          description={`${employees.length} employés au total`}
          icon={<Users className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Masse salariale"
          value={formatCurrency(totalMonthlySalary)}
          description="Coût mensuel total"
          icon={<Calculator className="h-5 w-5" />}
          variant="info"
        />
        <StatCard
          title="Avances en attente"
          value={pendingAdvances.length}
          description={formatCurrency(pendingAdvancesAmount)}
          icon={<Wallet className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Payé ce mois"
          value={formatCurrency(paidThisMonth)}
          description={`Reste: ${formatCurrency(remainingToPay)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Avances en attente
            </CardTitle>
            <CardDescription>Demandes nécessitant une approbation</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingAdvances.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune avance en attente</p>
            ) : (
              <div className="space-y-2">
                {pendingAdvances.slice(0, 5).map(advance => {
                  const employee = employees.find(e => e.id === advance.employeeId);
                  return (
                    <div key={advance.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">
                        {employee?.firstName} {employee?.lastName}
                      </span>
                      <Badge variant="outline">{formatCurrency(advance.amount)}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par département</CardTitle>
            <CardDescription>Nombre d'employés par département</CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucun employé enregistré</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  activeEmployees.reduce((acc, e) => {
                    acc[e.department] = (acc[e.department] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).slice(0, 5).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm">{dept}</span>
                    <Badge>{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
