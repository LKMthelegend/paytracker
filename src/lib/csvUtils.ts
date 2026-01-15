import { Employee, EmployeeFormData, generateId, generateMatricule } from "@/types";

// CSV Headers for Employee export
const EMPLOYEE_CSV_HEADERS = [
  'matricule',
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'dateOfBirth',
  'hireDate',
  'position',
  'department',
  'baseSalary',
  'bonus',
  'deductions',
  'status'
];

const EMPLOYEE_CSV_LABELS: Record<string, string> = {
  matricule: 'Matricule',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  address: 'Adresse',
  dateOfBirth: 'Date de naissance',
  hireDate: "Date d'embauche",
  position: 'Poste',
  department: 'Département',
  baseSalary: 'Salaire de base',
  bonus: 'Prime',
  deductions: 'Déductions',
  status: 'Statut'
};

function escapeCSVValue(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function parseCSVValue(value: string): string {
  let parsed = value.trim();
  // Remove surrounding quotes
  if (parsed.startsWith('"') && parsed.endsWith('"')) {
    parsed = parsed.slice(1, -1);
  }
  // Unescape double quotes
  return parsed.replace(/""/g, '"');
}

export function exportEmployeesToCSV(employees: Employee[]): string {
  // Header row with French labels
  const headerRow = EMPLOYEE_CSV_HEADERS.map(h => EMPLOYEE_CSV_LABELS[h]).join(',');
  
  // Data rows
  const dataRows = employees.map(employee => {
    return EMPLOYEE_CSV_HEADERS.map(header => {
      const value = employee[header as keyof Employee];
      return escapeCSVValue(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  // Add BOM for UTF-8 encoding (important for Excel compatibility with French characters)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface ParseResult {
  success: boolean;
  data?: EmployeeFormData[];
  errors?: string[];
}

export function parseCSVContent(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    return { success: false, errors: ['Le fichier CSV doit contenir au moins un en-tête et une ligne de données.'] };
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Map French labels back to field names
  const reverseLabels: Record<string, string> = {};
  Object.entries(EMPLOYEE_CSV_LABELS).forEach(([key, label]) => {
    reverseLabels[label.toLowerCase()] = key;
    reverseLabels[key.toLowerCase()] = key;
  });

  const mappedHeaders = headers.map(h => {
    const normalized = h.toLowerCase().trim();
    return reverseLabels[normalized] || h;
  });

  // Validate required headers
  const requiredFields = ['firstName', 'lastName', 'baseSalary'];
  const missingFields = requiredFields.filter(f => !mappedHeaders.includes(f));
  
  if (missingFields.length > 0) {
    return { 
      success: false, 
      errors: [`Champs requis manquants: ${missingFields.map(f => EMPLOYEE_CSV_LABELS[f] || f).join(', ')}`] 
    };
  }

  const employees: EmployeeFormData[] = [];
  const errors: string[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    
    try {
      const employee: EmployeeFormData = {
        matricule: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        hireDate: new Date().toISOString().split('T')[0],
        position: '',
        department: '',
        baseSalary: 0,
        bonus: 0,
        deductions: 0,
        status: 'active'
      };

      mappedHeaders.forEach((header, index) => {
        const value = values[index] ? parseCSVValue(values[index]) : '';
        
        switch (header) {
          case 'baseSalary':
          case 'bonus':
          case 'deductions':
            employee[header] = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
            break;
          case 'status':
            const status = value.toLowerCase();
            if (['active', 'inactive', 'suspended'].includes(status)) {
              employee.status = status as 'active' | 'inactive' | 'suspended';
            } else if (status === 'actif') {
              employee.status = 'active';
            } else if (status === 'inactif') {
              employee.status = 'inactive';
            } else if (status === 'suspendu') {
              employee.status = 'suspended';
            }
            break;
          case 'matricule':
          case 'firstName':
          case 'lastName':
          case 'email':
          case 'phone':
          case 'address':
          case 'dateOfBirth':
          case 'hireDate':
          case 'position':
          case 'department':
            employee[header] = value;
            break;
        }
      });

      // Generate matricule if not provided
      if (!employee.matricule) {
        employee.matricule = generateMatricule();
      }

      // Validate required fields
      if (!employee.firstName || !employee.lastName) {
        errors.push(`Ligne ${i + 1}: Prénom et Nom sont requis`);
        continue;
      }

      if (employee.baseSalary <= 0) {
        errors.push(`Ligne ${i + 1}: Le salaire de base doit être positif`);
        continue;
      }

      employees.push(employee);
    } catch (error) {
      errors.push(`Ligne ${i + 1}: Erreur de parsing - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  if (employees.length === 0) {
    return { 
      success: false, 
      errors: errors.length > 0 ? errors : ['Aucun employé valide trouvé dans le fichier.'] 
    };
  }

  return { 
    success: true, 
    data: employees,
    errors: errors.length > 0 ? errors : undefined
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

export function generateSampleCSV(): string {
  const headerRow = EMPLOYEE_CSV_HEADERS.map(h => EMPLOYEE_CSV_LABELS[h]).join(',');
  const sampleRow = [
    'EMP00001',
    'Jean',
    'Dupont',
    'jean.dupont@email.com',
    '+225 07 00 00 00',
    'Abidjan, Cocody',
    '1990-05-15',
    '2023-01-15',
    'Technicien',
    'Informatique',
    '350000',
    '50000',
    '25000',
    'Actif'
  ].join(',');

  return [headerRow, sampleRow].join('\n');
}
