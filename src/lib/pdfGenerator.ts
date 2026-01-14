import jsPDF from 'jspdf';
import { Employee, Advance, SalaryPayment, Receipt, formatCurrency, getMonthName, formatDate } from '@/types';

const COMPANY_NAME = "VOTRE ENTREPRISE";
const COMPANY_ADDRESS = "Adresse de l'entreprise";
const COMPANY_PHONE = "+225 XX XX XX XX XX";

function addHeader(doc: jsPDF, title: string) {
  // Header background
  doc.setFillColor(26, 54, 93);
  doc.rect(0, 0, 210, 40, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 20, 20);

  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_ADDRESS, 20, 28);
  doc.text(COMPANY_PHONE, 20, 34);

  // Title
  doc.setTextColor(26, 54, 93);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 55, { align: 'center' });

  // Line
  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);
}

function addFooter(doc: jsPDF, receiptNumber: string) {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Reçu N° ${receiptNumber}`, 20, pageHeight - 18);
  doc.text(`Généré le ${formatDate(new Date().toISOString())}`, 105, pageHeight - 18, { align: 'center' });
  doc.text('Document officiel', 190, pageHeight - 18, { align: 'right' });
}

export function generateSalaryReceipt(
  employee: Employee,
  payment: SalaryPayment,
  signature?: string
): jsPDF {
  const doc = new jsPDF();
  const receiptNumber = `SAL-${payment.year}${String(payment.month).padStart(2, '0')}-${employee.matricule}`;

  addHeader(doc, 'BULLETIN DE PAIE');

  let y = 75;

  // Employee info section
  doc.setFillColor(245, 247, 250);
  doc.rect(20, y - 5, 170, 35, 'F');

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYÉ', 25, y);
  
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(`Nom : ${employee.firstName} ${employee.lastName}`, 25, y);
  doc.text(`Matricule : ${employee.matricule}`, 120, y);
  y += 6;
  doc.text(`Poste : ${employee.position}`, 25, y);
  doc.text(`Département : ${employee.department}`, 120, y);
  y += 6;
  doc.text(`Période : ${getMonthName(payment.month)} ${payment.year}`, 25, y);

  y += 20;

  // Salary details
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 93);
  doc.text('DÉTAIL DU SALAIRE', 25, y);
  
  y += 10;
  doc.setDrawColor(200, 200, 200);

  // Table header
  doc.setFillColor(26, 54, 93);
  doc.rect(20, y - 5, 170, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Libellé', 25, y);
  doc.text('Montant', 170, y, { align: 'right' });

  y += 10;
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');

  // Salary rows
  const rows = [
    { label: 'Salaire de base', amount: payment.baseSalary, type: 'normal' },
    { label: 'Primes et indemnités', amount: payment.bonus, type: 'add' },
    { label: 'Retenues et déductions', amount: payment.deductions, type: 'sub' },
    { label: 'Avances sur salaire', amount: payment.totalAdvances, type: 'sub' },
  ];

  rows.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, y - 4, 170, 8, 'F');
    }
    
    doc.text(row.label, 25, y);
    const prefix = row.type === 'add' ? '+' : row.type === 'sub' ? '-' : '';
    doc.text(`${prefix}${formatCurrency(row.amount)}`, 170, y, { align: 'right' });
    y += 8;
  });

  // Net salary
  y += 5;
  doc.setFillColor(26, 54, 93);
  doc.rect(20, y - 5, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SALAIRE NET', 25, y + 1);
  doc.text(formatCurrency(payment.netSalary), 170, y + 1, { align: 'right' });

  y += 20;

  // Payment info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Montant payé : ${formatCurrency(payment.amountPaid)}`, 25, y);
  y += 6;
  doc.text(`Reste à payer : ${formatCurrency(payment.remainingAmount)}`, 25, y);
  y += 6;
  if (payment.paymentDate) {
    doc.text(`Date de paiement : ${formatDate(payment.paymentDate)}`, 25, y);
  }

  // Signature
  if (signature) {
    y += 20;
    doc.text('Signature de l\'employé :', 120, y);
    y += 5;
    doc.addImage(signature, 'PNG', 120, y, 60, 30);
  }

  addFooter(doc, receiptNumber);

  return doc;
}

export function generateAdvanceReceipt(
  employee: Employee,
  advance: Advance,
  signature?: string
): jsPDF {
  const doc = new jsPDF();
  const receiptNumber = `AVA-${advance.year}${String(advance.month).padStart(2, '0')}-${advance.id.slice(-6)}`;

  addHeader(doc, 'REÇU D\'AVANCE SUR SALAIRE');

  let y = 75;

  // Employee info
  doc.setFillColor(245, 247, 250);
  doc.rect(20, y - 5, 170, 28, 'F');

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('BÉNÉFICIAIRE', 25, y);
  
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(`Nom : ${employee.firstName} ${employee.lastName}`, 25, y);
  doc.text(`Matricule : ${employee.matricule}`, 120, y);
  y += 6;
  doc.text(`Poste : ${employee.position} - ${employee.department}`, 25, y);

  y += 25;

  // Advance details
  doc.setFillColor(26, 54, 93);
  doc.rect(20, y - 5, 170, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MONTANT DE L\'AVANCE', 105, y + 2, { align: 'center' });

  y += 20;
  doc.setTextColor(26, 54, 93);
  doc.setFontSize(24);
  doc.text(formatCurrency(advance.amount), 105, y, { align: 'center' });

  y += 20;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Date de la demande : ${formatDate(advance.requestDate)}`, 25, y);
  y += 7;
  doc.text(`Période concernée : ${getMonthName(advance.month)} ${advance.year}`, 25, y);
  y += 7;
  doc.text(`Motif : ${advance.reason}`, 25, y);

  if (advance.approvalDate) {
    y += 7;
    doc.text(`Date d'approbation : ${formatDate(advance.approvalDate)}`, 25, y);
  }

  // Legal text
  y += 25;
  doc.setFillColor(255, 243, 205);
  doc.rect(20, y - 5, 170, 25, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 80, 0);
  doc.text('Je soussigné(e) reconnais avoir reçu le montant ci-dessus mentionné à titre', 25, y);
  y += 5;
  doc.text('d\'avance sur mon salaire du mois indiqué. Ce montant sera déduit de mon salaire', 25, y);
  y += 5;
  doc.text('à la fin du mois concerné.', 25, y);

  // Signature
  if (signature) {
    y += 25;
    doc.setTextColor(60, 60, 60);
    doc.text('Signature du bénéficiaire :', 120, y);
    y += 5;
    doc.addImage(signature, 'PNG', 120, y, 60, 30);
  }

  addFooter(doc, receiptNumber);

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}
