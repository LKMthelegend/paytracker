import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAdvances } from "@/hooks/useAdvances";
import { useSalaryPayments } from "@/hooks/useSalaryPayments";
import { Employee, formatCurrency, getMonthName, MONTHS } from "@/types";
import { generateSalaryReceipt, generateAdvanceReceipt, downloadPDF, enrichEmployeeData } from "@/lib/pdfGenerator";
import { SignaturePad } from "@/components/receipts/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Search, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";

type ReceiptType = 'salary' | 'advance';

interface ReceiptData {
  type: ReceiptType;
  employee: Employee;
  data: any;
}

export default function Receipts() {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: advances = [], isLoading: advancesLoading } = useAdvances();
  const { data: payments = [], isLoading: paymentsLoading } = useSalaryPayments();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ReceiptType>("salary");
  
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Get employee by ID
  const getEmployee = (id: string): Employee | undefined => {
    return employees.find(e => e.id === id);
  };

  // Salary receipts data
  const salaryReceipts = useMemo(() => {
    return payments
      .filter(p => p.month === selectedMonth && p.year === selectedYear && p.amountPaid > 0)
      .filter(p => {
        if (!search) return true;
        const emp = getEmployee(p.employeeId);
        if (!emp) return false;
        return `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
               emp.matricule.toLowerCase().includes(search.toLowerCase());
      })
      .map(p => ({
        ...p,
        employee: getEmployee(p.employeeId),
      }))
      .filter(p => p.employee);
  }, [payments, employees, selectedMonth, selectedYear, search]);

  // Advance receipts data
  const advanceReceipts = useMemo(() => {
    return advances
      .filter(a => a.month === selectedMonth && a.year === selectedYear && a.status === 'approved')
      .filter(a => {
        if (!search) return true;
        const emp = getEmployee(a.employeeId);
        if (!emp) return false;
        return `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
               emp.matricule.toLowerCase().includes(search.toLowerCase());
      })
      .map(a => ({
        ...a,
        employee: getEmployee(a.employeeId),
      }))
      .filter(a => a.employee);
  }, [advances, employees, selectedMonth, selectedYear, search]);

  const handleGenerateReceipt = (type: ReceiptType, employee: Employee, data: any) => {
    setSelectedReceipt({ type, employee, data });
    setSignature(null);
    setSignatureDialogOpen(true);
  };

  const handleDownloadReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      let pdf;
      let filename;

      // Enrich employee data with position and department names
      const enrichedEmployee = await enrichEmployeeData(selectedReceipt.employee);

      if (selectedReceipt.type === 'salary') {
        pdf = generateSalaryReceipt(
          enrichedEmployee,
          selectedReceipt.data,
          signature || undefined
        );
        filename = `bulletin-paie-${selectedReceipt.employee.matricule}-${selectedMonth}-${selectedYear}.pdf`;
      } else {
        pdf = generateAdvanceReceipt(
          enrichedEmployee,
          selectedReceipt.data,
          signature || undefined
        );
        filename = `recu-avance-${selectedReceipt.employee.matricule}-${selectedReceipt.data.id.slice(-6)}.pdf`;
      }

      downloadPDF(pdf, filename);
      toast.success("Reçu généré avec succès");
      setSignatureDialogOpen(false);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const isLoading = employeesLoading || advancesLoading || paymentsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Reçus et Documents</h1>
        <p className="page-description">Génération de reçus PDF avec signature</p>
      </div>

      {/* Period & Filters */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReceiptType)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Bulletins de paie ({salaryReceipts.length})
          </TabsTrigger>
          <TabsTrigger value="advance" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Reçus d'avance ({advanceReceipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulletins de paie - {getMonthName(selectedMonth)} {selectedYear}</CardTitle>
              <CardDescription>Téléchargez les bulletins de paie au format PDF</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : salaryReceipts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun bulletin de paie pour cette période</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Les bulletins apparaîtront après l'enregistrement des paiements
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead className="text-right">Salaire net</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryReceipts.map(receipt => (
                      <TableRow key={receipt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {receipt.employee!.firstName} {receipt.employee!.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {receipt.employee!.matricule}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(receipt.netSalary)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-success">
                          {formatCurrency(receipt.amountPaid)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleGenerateReceipt('salary', receipt.employee!, receipt)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Générer PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reçus d'avance - {getMonthName(selectedMonth)} {selectedYear}</CardTitle>
              <CardDescription>Téléchargez les reçus d'avance au format PDF</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : advanceReceipts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun reçu d'avance pour cette période</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Les reçus apparaîtront après l'approbation des avances
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advanceReceipts.map(receipt => (
                      <TableRow key={receipt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {receipt.employee!.firstName} {receipt.employee!.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {receipt.employee!.matricule}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(receipt.amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {receipt.reason}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleGenerateReceipt('advance', receipt.employee!, receipt)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Générer PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Générer le reçu PDF</DialogTitle>
            <DialogDescription>
              {selectedReceipt && (
                <>
                  {selectedReceipt.type === 'salary' ? 'Bulletin de paie' : "Reçu d'avance"} pour{" "}
                  <strong>{selectedReceipt.employee.firstName} {selectedReceipt.employee.lastName}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <SignaturePad
              onSignatureChange={setSignature}
            />

            {signature && (
              <div className="p-3 bg-success/10 rounded-lg text-center text-success text-sm">
                ✓ Signature enregistrée
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger le PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
