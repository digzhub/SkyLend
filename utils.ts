import { Loan, Transaction } from './types';

export const formatMoney = (amount: number): string => {
  return "₱" + parseFloat(amount.toString()).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const genId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getOverdueDays = (loan: any): number => {
  if (loan.status !== 'Active') return 0;
  const loanDate = new Date(loan.date);
  const dueDate = new Date(loanDate);
  dueDate.setDate(dueDate.getDate() + loan.term);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

export const isOverdue = (loan: any): boolean => {
  return getOverdueDays(loan) > 0;
};

export const calculateCreditScore = (loan: Loan, ledger: Transaction[]): { score: number, label: string, color: string } => {
  // Base Score
  let score = 70; 

  // Factor 1: Repayment Progress
  const percentPaid = 1 - (loan.balance / loan.total);
  score += (percentPaid * 20); // Up to +20 points for being paid off

  // Factor 2: Overdue Status
  const daysLate = getOverdueDays(loan);
  if (daysLate > 0) {
    score -= (daysLate * 2); // -2 points per day late
  } else {
    score += 5; // Bonus for being current
  }

  // Factor 3: Payment Frequency (Activity)
  const payments = ledger.filter(t => t.desc.includes(loan.name) && t.type === 'Collection').length;
  if (payments > 5) score += 5;
  if (payments > 10) score += 5;

  // Cap Score
  score = Math.min(100, Math.max(0, Math.round(score)));

  let label = 'Risk';
  let color = 'text-red-600 bg-red-100';

  if (score >= 90) {
    label = 'Elite';
    color = 'text-emerald-600 bg-emerald-100';
  } else if (score >= 70) {
    label = 'Good';
    color = 'text-blue-600 bg-blue-100';
  } else if (score >= 50) {
    label = 'Fair';
    color = 'text-amber-600 bg-amber-100';
  }

  return { score, label, color };
};

export const exportTableToCSV = (data: (string|number)[][], filename: string, headers: string[]) => {
  let csv = headers.join(',') + '\n';
  data.forEach(row => {
      csv += row.map(d => `"${String(d).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const hiddenElement = document.createElement('a');
  hiddenElement.href = url;
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
};