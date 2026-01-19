import { SalaryPayment, Employee, formatCurrency, formatDate, getMonthName } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CreditCard, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react";

interface PaymentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: SalaryPayment | null;
  employee: Employee | null;
}

export function PaymentDetailsDialog({ open, onOpenChange, payment, employee }: PaymentDetailsDialogProps) {
  if (!payment || !employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du paiement</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pr-4">
          {/* Employee info */}
          <div>
            <h3 className="font-semibold text-lg">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{employee.matricule}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {getMonthName(payment.month)} {payment.year}
            </p>
          </div>

          <Separator />

          {/* Détails du salaire */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Détail du salaire
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Salaire de base</span>
                </div>
                <span className="font-medium">{formatCurrency(payment.baseSalary)}</span>
              </div>
              <div className="flex items-center justify-between text-success">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4" />
                  <span>Primes</span>
                </div>
                <span className="font-medium">+{formatCurrency(payment.bonus ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-destructive">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-4 w-4" />
                  <span>Déductions</span>
                </div>
                <span className="font-medium">-{formatCurrency(payment.deductions ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between text-destructive">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-4 w-4" />
                  <span>Avances versées</span>
                </div>
                <span className="font-medium">-{formatCurrency(payment.totalAdvances)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Salaire net</span>
                <span className="text-primary">{formatCurrency(payment.netSalary)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Détails du paiement */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Paiement
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Montant payé</span>
                <span className="font-medium text-success">{formatCurrency(payment.amountPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reste à payer</span>
                <span className="font-medium text-warning">{formatCurrency(payment.remainingAmount)}</span>
              </div>
              {payment.paymentDate && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date de paiement</span>
                  </div>
                  <span>{formatDate(payment.paymentDate)}</span>
                </div>
              )}
            </div>
          </div>

          {payment.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Notes
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                  {payment.notes}
                </p>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Créé le {formatDate(payment.createdAt)} • Mis à jour le {formatDate(payment.updatedAt)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
