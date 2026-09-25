/**
 * Utility functions for STMJ Enterprise Contracting & Database App
 */

export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function formatUSD(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0.00';
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0.0%';
  return value.toFixed(1) + '%';
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Won / PO Received':
    case 'Paid':
    case 'Completed & Reconciled':
    case 'Completed & Closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Submitted to Client':
    case 'In Execution':
    case 'In Progress':
    case 'In Transit':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Internal Review':
    case 'Engineering & Shop Drawing':
    case 'DP Paid':
    case 'Achieved / Invoiced':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Draft':
    case 'Pending':
    case 'Issued':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Revision Requested':
    case 'Delayed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Lost':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
