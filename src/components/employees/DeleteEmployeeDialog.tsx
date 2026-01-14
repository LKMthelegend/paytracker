import { Employee } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeleteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteEmployeeDialog({ 
  open, 
  onOpenChange, 
  employee, 
  onConfirm,
  isLoading 
}: DeleteEmployeeDialogProps) {
  if (!employee) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet employé ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de supprimer l'employé{" "}
            <strong>{employee.firstName} {employee.lastName}</strong> ({employee.matricule}).
            <br /><br />
            Cette action est irréversible. Toutes les données associées (avances, paiements, reçus) 
            seront également supprimées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
