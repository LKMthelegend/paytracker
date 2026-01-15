import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAdvances, useCreateAdvance, useUpdateAdvance, useDeleteAdvance } from "@/hooks/useAdvances";
import { Advance, Employee, formatCurrency, formatDate, getMonthName, ADVANCE_STATUS, MONTHS } from "@/types";
import { AdvanceForm } from "@/components/advances/AdvanceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Wallet, MoreVertical, CheckCircle, XCircle, Trash2, Clock, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function Advances() {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: advances = [], isLoading: advancesLoading } = useAdvances();
  const addAdvance = useCreateAdvance();
  const updateAdvance = useUpdateAdvance();
  const deleteAdvance = useDeleteAdvance();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] = useState<Advance | null>(null);

  // Get employee by ID
  const getEmployee = (id: string): Employee | undefined => {
    return employees.find(e => e.id === id);
  };

  // Filtered advances
  const filteredAdvances = useMemo(() => {
    return advances
      .filter(a => a.month === selectedMonth && a.year === selectedYear)
      .filter(a => statusFilter === "all" || a.status === statusFilter)
      .filter(a => {
        if (!search) return true;
        const emp = getEmployee(a.employeeId);
        if (!emp) return false;
        return `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
               emp.matricule.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }, [advances, employees, selectedMonth, selectedYear, statusFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const monthAdvances = advances.filter(a => a.month === selectedMonth && a.year === selectedYear);
    return {
      total: monthAdvances.length,
      pending: monthAdvances.filter(a => a.status === 'pending').length,
      approved: monthAdvances.filter(a => a.status === 'approved').length,
      rejected: monthAdvances.filter(a => a.status === 'rejected').length,
      totalAmount: monthAdvances.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0),
      pendingAmount: monthAdvances.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0),
    };
  }, [advances, selectedMonth, selectedYear]);

  const handleAddAdvance = () => {
    setSelectedAdvance(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Advance) => {
    try {
      if (selectedAdvance) {
        await updateAdvance.mutateAsync({ id: selectedAdvance.id, data });
        toast.success("Avance mise à jour");
      } else {
        await addAdvance.mutateAsync(data);
        toast.success("Avance enregistrée");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  const handleApprove = async (advance: Advance) => {
    try {
      await updateAdvance.mutateAsync({
        id: advance.id,
        data: {
          status: 'approved',
          approvalDate: new Date().toISOString(),
        }
      });
      toast.success("Avance approuvée");
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (advance: Advance) => {
    try {
      await updateAdvance.mutateAsync({
        id: advance.id,
        data: {
          status: 'rejected',
        }
      });
      toast.success("Avance rejetée");
    } catch (error) {
      toast.error("Erreur lors du rejet");
    }
  };

  const handleDeleteClick = (advance: Advance) => {
    setAdvanceToDelete(advance);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!advanceToDelete) return;
    try {
      await deleteAdvance.mutateAsync(advanceToDelete.id);
      toast.success("Avance supprimée");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getStatusBadge = (status: Advance['status']) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      approved: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-destructive/10 text-destructive border-destructive/20',
      repaid: 'bg-info/10 text-info border-info/20',
    };
    const statusInfo = ADVANCE_STATUS.find(s => s.value === status);
    return (
      <Badge variant="outline" className={colors[status]}>
        {statusInfo?.label}
      </Badge>
    );
  };

  const isLoading = employeesLoading || advancesLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header">
          <h1 className="page-title">Gestion des Avances</h1>
          <p className="page-description">Demandes et suivi des avances sur salaire</p>
        </div>
        <Button onClick={handleAddAdvance} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle avance
        </Button>
      </div>

      {/* Period & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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
            <div className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 lg:w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {ADVANCE_STATUS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total avances</p>
                <p className="text-xl font-bold">{stats.total}</p>
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
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold text-warning">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(stats.pendingAmount)}</p>
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
                <p className="text-sm text-muted-foreground">Approuvées</p>
                <p className="text-xl font-bold text-success">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant total approuvé</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Avances - {getMonthName(selectedMonth)} {selectedYear}</CardTitle>
          <CardDescription>{filteredAdvances.length} avance(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredAdvances.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune avance pour cette période</p>
              <Button className="mt-4" onClick={handleAddAdvance}>
                <Plus className="h-4 w-4 mr-2" />
                Enregistrer une avance
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Date demande</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdvances.map(advance => {
                    const emp = getEmployee(advance.employeeId);
                    return (
                      <TableRow key={advance.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {emp ? `${emp.firstName} ${emp.lastName}` : 'Inconnu'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {emp?.matricule}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(advance.requestDate)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(advance.amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {advance.reason}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(advance.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {advance.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(advance)}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                    Approuver
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(advance)}>
                                    <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                    Rejeter
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(advance)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <AdvanceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        employees={employees}
        advance={selectedAdvance}
        isLoading={addAdvance.isPending || updateAdvance.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette avance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'avance sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
