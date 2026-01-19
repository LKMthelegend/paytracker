import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Employee, Advance, SalaryPayment, Receipt, Department, Position } from '@/types';

// ============= Database Schema =============

interface PayrollDB extends DBSchema {
  employees: {
    key: string;
    value: Employee;
    indexes: {
      'by-matricule': string;
      'by-department': string;
      'by-status': string;
    };
  };
  advances: {
    key: string;
    value: Advance;
    indexes: {
      'by-employee': string;
      'by-status': string;
      'by-month-year': [number, number];
    };
  };
  salaryPayments: {
    key: string;
    value: SalaryPayment;
    indexes: {
      'by-employee': string;
      'by-month-year': [number, number];
      'by-status': string;
    };
  };
  receipts: {
    key: string;
    value: Receipt;
    indexes: {
      'by-employee': string;
      'by-type': string;
    };
  };
  departments: {
    key: string;
    value: Department;
    indexes: {
      'by-name': string;
    };
  };
  positions: {
    key: string;
    value: Position;
    indexes: {
      'by-department': string;
      'by-name': string;
    };
  };
}

const DB_NAME = 'payroll-manager';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<PayrollDB> | null = null;

// ============= Database Initialization =============

export async function initDB(): Promise<IDBPDatabase<PayrollDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PayrollDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Employees store
      if (!db.objectStoreNames.contains('employees')) {
        const employeeStore = db.createObjectStore('employees', { keyPath: 'id' });
        employeeStore.createIndex('by-matricule', 'matricule', { unique: true });
        employeeStore.createIndex('by-department', 'department');
        employeeStore.createIndex('by-status', 'status');
      }

      // Advances store
      if (!db.objectStoreNames.contains('advances')) {
        const advanceStore = db.createObjectStore('advances', { keyPath: 'id' });
        advanceStore.createIndex('by-employee', 'employeeId');
        advanceStore.createIndex('by-status', 'status');
        advanceStore.createIndex('by-month-year', ['month', 'year']);
      }

      // Salary payments store
      if (!db.objectStoreNames.contains('salaryPayments')) {
        const salaryStore = db.createObjectStore('salaryPayments', { keyPath: 'id' });
        salaryStore.createIndex('by-employee', 'employeeId');
        salaryStore.createIndex('by-month-year', ['month', 'year']);
        salaryStore.createIndex('by-status', 'status');
      }

      // Receipts store
      if (!db.objectStoreNames.contains('receipts')) {
        const receiptStore = db.createObjectStore('receipts', { keyPath: 'id' });
        receiptStore.createIndex('by-employee', 'employeeId');
        receiptStore.createIndex('by-type', 'type');
      }

      // Departments store
      if (!db.objectStoreNames.contains('departments')) {
        const departmentStore = db.createObjectStore('departments', { keyPath: 'id' });
        departmentStore.createIndex('by-name', 'name');
      }

      // Positions store
      if (!db.objectStoreNames.contains('positions')) {
        const positionStore = db.createObjectStore('positions', { keyPath: 'id' });
        positionStore.createIndex('by-department', 'department');
        positionStore.createIndex('by-name', 'name');
      }
    },
  });

  return dbInstance;
}

// ============= Employee Operations =============

export async function getAllEmployees(): Promise<Employee[]> {
  const db = await initDB();
  return db.getAll('employees');
}

export async function getEmployee(id: string): Promise<Employee | undefined> {
  const db = await initDB();
  return db.get('employees', id);
}

export async function getEmployeeByMatricule(matricule: string): Promise<Employee | undefined> {
  const db = await initDB();
  return db.getFromIndex('employees', 'by-matricule', matricule);
}

export async function addEmployee(employee: Employee): Promise<string> {
  const db = await initDB();
  await db.add('employees', employee);
  return employee.id;
}

export async function updateEmployee(employee: Employee): Promise<void> {
  const db = await initDB();
  await db.put('employees', employee);
}

export async function deleteEmployee(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('employees', id);
}

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  const db = await initDB();
  return db.getAllFromIndex('employees', 'by-department', department);
}

export async function getEmployeesByStatus(status: Employee['status']): Promise<Employee[]> {
  const db = await initDB();
  return db.getAllFromIndex('employees', 'by-status', status);
}

// ============= Advance Operations =============

export async function getAllAdvances(): Promise<Advance[]> {
  const db = await initDB();
  return db.getAll('advances');
}

export async function getAdvance(id: string): Promise<Advance | undefined> {
  const db = await initDB();
  return db.get('advances', id);
}

export async function getAdvancesByEmployee(employeeId: string): Promise<Advance[]> {
  const db = await initDB();
  return db.getAllFromIndex('advances', 'by-employee', employeeId);
}

export async function getAdvancesByMonthYear(month: number, year: number): Promise<Advance[]> {
  const db = await initDB();
  return db.getAllFromIndex('advances', 'by-month-year', [month, year]);
}

export async function addAdvance(advance: Advance): Promise<string> {
  const db = await initDB();
  await db.add('advances', advance);
  return advance.id;
}

export async function updateAdvance(advance: Advance): Promise<void> {
  const db = await initDB();
  await db.put('advances', advance);
}

export async function deleteAdvance(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('advances', id);
}

// ============= Salary Payment Operations =============

export async function getAllSalaryPayments(): Promise<SalaryPayment[]> {
  const db = await initDB();
  return db.getAll('salaryPayments');
}

export async function getSalaryPayment(id: string): Promise<SalaryPayment | undefined> {
  const db = await initDB();
  return db.get('salaryPayments', id);
}

export async function getSalaryPaymentsByEmployee(employeeId: string): Promise<SalaryPayment[]> {
  const db = await initDB();
  return db.getAllFromIndex('salaryPayments', 'by-employee', employeeId);
}

export async function getSalaryPaymentsByMonthYear(month: number, year: number): Promise<SalaryPayment[]> {
  const db = await initDB();
  return db.getAllFromIndex('salaryPayments', 'by-month-year', [month, year]);
}

export async function getEmployeeSalaryForMonth(
  employeeId: string,
  month: number,
  year: number
): Promise<SalaryPayment | undefined> {
  const db = await initDB();
  const allPayments = await db.getAllFromIndex('salaryPayments', 'by-employee', employeeId);
  return allPayments.find(p => p.month === month && p.year === year);
}

export async function addSalaryPayment(payment: SalaryPayment): Promise<string> {
  const db = await initDB();
  await db.add('salaryPayments', payment);
  return payment.id;
}

export async function updateSalaryPayment(payment: SalaryPayment): Promise<void> {
  const db = await initDB();
  await db.put('salaryPayments', payment);
}

export async function deleteSalaryPayment(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('salaryPayments', id);
}

// ============= Receipt Operations =============

export async function getAllReceipts(): Promise<Receipt[]> {
  const db = await initDB();
  return db.getAll('receipts');
}

export async function getReceipt(id: string): Promise<Receipt | undefined> {
  const db = await initDB();
  return db.get('receipts', id);
}

export async function getReceiptsByEmployee(employeeId: string): Promise<Receipt[]> {
  const db = await initDB();
  return db.getAllFromIndex('receipts', 'by-employee', employeeId);
}

export async function addReceipt(receipt: Receipt): Promise<string> {
  const db = await initDB();
  await db.add('receipts', receipt);
  return receipt.id;
}

export async function deleteReceipt(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('receipts', id);
}

// ============= Utility Functions =============

export async function calculateTotalAdvancesForMonth(
  employeeId: string,
  month: number,
  year: number
): Promise<number> {
  const advances = await getAdvancesByEmployee(employeeId);
  return advances
    .filter(a => a.month === month && a.year === year && a.status === 'approved')
    .reduce((sum, a) => sum + a.amount, 0);
}

export async function exportAllData(): Promise<{
  employees: Employee[];
  advances: Advance[];
  salaryPayments: SalaryPayment[];
  receipts: Receipt[];
}> {
  const db = await initDB();
  return {
    employees: await db.getAll('employees'),
    advances: await db.getAll('advances'),
    salaryPayments: await db.getAll('salaryPayments'),
    receipts: await db.getAll('receipts'),
  };
}

export async function importData(data: {
  employees?: Employee[];
  advances?: Advance[];
  salaryPayments?: SalaryPayment[];
  receipts?: Receipt[];
}): Promise<void> {
  const db = await initDB();

  const tx = db.transaction(
    ['employees', 'advances', 'salaryPayments', 'receipts'],
    'readwrite'
  );

  if (data.employees) {
    for (const employee of data.employees) {
      await tx.objectStore('employees').put(employee);
    }
  }

  if (data.advances) {
    for (const advance of data.advances) {
      await tx.objectStore('advances').put(advance);
    }
  }

  if (data.salaryPayments) {
    for (const payment of data.salaryPayments) {
      await tx.objectStore('salaryPayments').put(payment);
    }
  }

  if (data.receipts) {
    for (const receipt of data.receipts) {
      await tx.objectStore('receipts').put(receipt);
    }
  }

  await tx.done;
}

export async function clearAllData(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(
    ['employees', 'advances', 'salaryPayments', 'receipts', 'departments', 'positions'],
    'readwrite'
  );
  
  await Promise.all([
    tx.objectStore('employees').clear(),
    tx.objectStore('advances').clear(),
    tx.objectStore('salaryPayments').clear(),
    tx.objectStore('receipts').clear(),
    tx.objectStore('departments').clear(),
    tx.objectStore('positions').clear(),
  ]);
  
  await tx.done;
}

// ============= Department Operations =============

export async function getAllDepartments(): Promise<Department[]> {
  const db = await initDB();
  return db.getAll('departments');
}

export async function getDepartment(id: string): Promise<Department | undefined> {
  const db = await initDB();
  return db.get('departments', id);
}

export async function getDepartmentByName(name: string): Promise<Department | undefined> {
  const db = await initDB();
  return db.getFromIndex('departments', 'by-name', name);
}

export async function addDepartment(department: Department): Promise<string> {
  const db = await initDB();
  await db.add('departments', department);
  return department.id;
}

export async function updateDepartment(department: Department): Promise<void> {
  const db = await initDB();
  await db.put('departments', department);
}

export async function deleteDepartment(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('departments', id);
}

// ============= Position Operations =============

export async function getAllPositions(): Promise<Position[]> {
  const db = await initDB();
  return db.getAll('positions');
}

export async function getPosition(id: string): Promise<Position | undefined> {
  const db = await initDB();
  return db.get('positions', id);
}

export async function getPositionsByDepartment(department: string): Promise<Position[]> {
  const db = await initDB();
  return db.getAllFromIndex('positions', 'by-department', department);
}

export async function addPosition(position: Position): Promise<string> {
  const db = await initDB();
  await db.add('positions', position);
  return position.id;
}

export async function updatePosition(position: Position): Promise<void> {
  const db = await initDB();
  await db.put('positions', position);
}

export async function deletePosition(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('positions', id);
}

// ============= Database Reset =============

export async function resetDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  
  // Delete the database
  const indexedDB = window.indexedDB;
  if (indexedDB) {
    indexedDB.deleteDatabase(DB_NAME);
  }
}


