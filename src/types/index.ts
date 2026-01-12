// ============= Employee Types =============

export interface Employee {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  position: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  status: 'active' | 'inactive' | 'suspended';
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  position: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  status: 'active' | 'inactive' | 'suspended';
  photo?: string;
}

// ============= Salary Types =============

export interface SalaryPayment {
  id: string;
  employeeId: string;
  month: number; // 1-12
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  totalAdvances: number; // Sum of advances for this month
  netSalary: number; // baseSalary + bonus - deductions - totalAdvances
  amountPaid: number;
  remainingAmount: number;
  status: 'pending' | 'partial' | 'paid';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySalaryCalculation {
  employeeId: string;
  employeeName: string;
  matricule: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  grossSalary: number; // baseSalary + bonus
  totalAdvances: number;
  netSalary: number; // grossSalary - deductions - totalAdvances
  status: 'pending' | 'partial' | 'paid';
}

// ============= Advance Types =============

export interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  requestDate: string;
  approvalDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  month: number; // Month this advance affects
  year: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvanceFormData {
  employeeId: string;
  amount: number;
  reason: string;
  requestDate: string;
  month: number;
  year: number;
  notes?: string;
}

// ============= Receipt Types =============

export interface Receipt {
  id: string;
  receiptNumber: string;
  type: 'salary' | 'advance';
  employeeId: string;
  employeeName: string;
  employeeMatricule: string;
  amount: number;
  month?: number;
  year?: number;
  description: string;
  signature?: string; // Base64 encoded signature image
  signatureDate?: string;
  createdAt: string;
}

// ============= Dashboard Types =============

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalMonthlySalary: number;
  pendingAdvances: number;
  pendingAdvancesAmount: number;
  paidThisMonth: number;
  remainingToPay: number;
}

// ============= Filter & Pagination Types =============

export interface EmployeeFilters {
  search: string;
  department: string;
  status: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ============= Department Options =============

export const DEPARTMENTS = [
  'Direction',
  'Ressources Humaines',
  'Comptabilité',
  'Marketing',
  'Commercial',
  'Production',
  'Logistique',
  'Informatique',
  'Juridique',
  'Maintenance',
  'Qualité',
  'Autre'
] as const;

export const POSITIONS = [
  'Directeur Général',
  'Directeur',
  'Chef de Département',
  'Chef d\'Équipe',
  'Responsable',
  'Superviseur',
  'Technicien',
  'Agent',
  'Assistant',
  'Stagiaire',
  'Consultant',
  'Autre'
] as const;

export const EMPLOYEE_STATUS = [
  { value: 'active', label: 'Actif', color: 'success' },
  { value: 'inactive', label: 'Inactif', color: 'muted' },
  { value: 'suspended', label: 'Suspendu', color: 'warning' }
] as const;

export const ADVANCE_STATUS = [
  { value: 'pending', label: 'En attente', color: 'warning' },
  { value: 'approved', label: 'Approuvée', color: 'success' },
  { value: 'rejected', label: 'Rejetée', color: 'destructive' },
  { value: 'repaid', label: 'Remboursée', color: 'info' }
] as const;

export const PAYMENT_STATUS = [
  { value: 'pending', label: 'En attente', color: 'warning' },
  { value: 'partial', label: 'Partiel', color: 'info' },
  { value: 'paid', label: 'Payé', color: 'success' }
] as const;

// ============= Utility Types =============

export type MonthName = 
  | 'Janvier' | 'Février' | 'Mars' | 'Avril' 
  | 'Mai' | 'Juin' | 'Juillet' | 'Août' 
  | 'Septembre' | 'Octobre' | 'Novembre' | 'Décembre';

export const MONTHS: { value: number; label: MonthName }[] = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' }
];

export function getMonthName(month: number): MonthName {
  return MONTHS.find(m => m.value === month)?.label || 'Janvier';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMatricule(): string {
  const prefix = 'EMP';
  const number = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}${number}`;
}

export function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REC-${year}${month}-${random}`;
}
