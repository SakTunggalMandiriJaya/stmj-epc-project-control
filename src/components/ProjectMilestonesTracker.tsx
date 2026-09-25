import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  FileCheck2, 
  Building2, 
  FileText, 
  Send, 
  ArrowUpRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { 
  ProjectMilestone, 
  Quotation, 
  Customer, 
  MilestoneStatus 
} from '../types/stmjDatabase';
import { formatIDR, formatPercent, formatDate, getStatusBadgeClass } from '../utils/stmjFormatters';

interface ProjectMilestonesTrackerProps {
  milestones: ProjectMilestone[];
  quotations: Quotation[];
  customers: Customer[];
  selectedQuotationId?: string;
  onUpdateMilestone: (updated: ProjectMilestone) => void;
  onNavigateToQuotation: (quotationId: string) => void;
}

export const ProjectMilestonesTracker: React.FC<ProjectMilestonesTrackerProps> = ({
  milestones,
  quotations,
  customers,
  selectedQuotationId,
  onUpdateMilestone,
  onNavigateToQuotation,
}) => {
  const [activeQuoId, setActiveQuoId] = useState<string>(
    selectedQuotationId || quotations[0]?.quotation_id || ''
  );

  const activeQuotation = useMemo(() => {
    return quotations.find(q => q.quotation_id === activeQuoId) || quotations[0];
  }, [quotations, activeQuoId]);

  const activeCustomer = useMemo(() => {
    if (!activeQuotation) return null;
    return customers.find(c => c.customer_id === activeQuotation.customer_id) || null;
  }, [customers, activeQuotation]);

  const activeMilestones = useMemo(() => {
    return milestones.filter(m => m.quotation_id === activeQuoId);
  }, [milestones, activeQuoId]);

  // Aggregate metrics
  const totalContractAmount = activeQuotation?.total_amount_idr || 0;
  const totalBilled = activeMilestones
    .filter(m => m.status === 'Achieved / Invoiced' || m.status === 'Paid')
    .reduce((acc, m) => acc + m.amount_idr, 0);

  const totalCollected = activeMilestones
    .filter(m => m.status === 'Paid')
    .reduce((acc, m) => acc + m.amount_idr, 0);

  const billedPct = totalContractAmount > 0 ? (totalBilled / totalContractAmount) * 100 : 0;
  const collectedPct = totalContractAmount > 0 ? (totalCollected / totalContractAmount) * 100 : 0;

  const handleStatusChange = (milestone: ProjectMilestone, newStatus: MilestoneStatus) => {
    const updated: ProjectMilestone = {
      ...milestone,
      status: newStatus,
      actual_date: newStatus === 'Paid' || newStatus === 'Achieved / Invoiced' ? new Date().toISOString().split('T')[0] : milestone.actual_date,
      payment_received_date: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : milestone.payment_received_date,
      invoice_number: !milestone.invoice_number && newStatus !== 'Pending' ? `INV/STMJ/2026/09/${Math.floor(100 + Math.random() * 900)}` : milestone.invoice_number,
    };
    onUpdateMilestone(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-700">
              1:N Relational Milestones
            </span>
            <span className="text-xs text-slate-500">
              Linked to Quotation & Project Execution
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Project Milestones, Deliverables & Progress Billing (Termin)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Stage-gate delivery verification tied to contractual invoicing: Advance DP, Material Delivery, Installation, and BAST Handover.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Select Project Quotation</label>
            <select
              value={activeQuoId}
              onChange={e => setActiveQuoId(e.target.value)}
              className="text-xs font-medium p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {quotations.map(q => {
                const c = customers.find(cust => cust.customer_id === q.customer_id);
                return (
                  <option key={q.quotation_id} value={q.quotation_id}>
                    {q.quotation_number} - {c?.company_name}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => onNavigateToQuotation(activeQuoId)}
            className="mt-4 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            View BOQ
          </button>
        </div>
      </div>

      {/* Progress & Billing Financial Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Contract Value (Inc. PPN)</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatIDR(totalContractAmount)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total commercial contract</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Billed Invoices (Termin)</div>
          <div className="text-xl font-bold text-indigo-600 mt-1 font-mono">
            {formatIDR(totalBilled)}
          </div>
          <div className="text-xs text-indigo-600 mt-1 font-medium">
            {formatPercent(billedPct)} of contract invoiced
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Collected Cash Payments</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {formatIDR(totalCollected)}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {formatPercent(collectedPct)} cash received
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Remaining Outstanding</div>
          <div className="text-xl font-bold text-slate-700 mt-1 font-mono">
            {formatIDR(totalContractAmount - totalCollected)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending future stages</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Overall Project Cashflow & Billing Progress</span>
          <span className="font-mono">{formatPercent(collectedPct)} Collected</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${collectedPct}%` }}
            title={`Collected: ${formatPercent(collectedPct)}`}
          />
          <div 
            className="bg-indigo-400 h-full transition-all duration-500" 
            style={{ width: `${Math.max(0, billedPct - collectedPct)}%` }}
            title={`Invoiced: ${formatPercent(billedPct - collectedPct)}`}
          />
        </div>
      </div>

      {/* Milestones Detailed List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              Stage-Gate Milestones & Invoicing Schedule ({activeMilestones.length} Stages)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <span className="font-semibold text-slate-700">{activeCustomer?.company_name}</span> | Quotation: <span className="font-mono font-semibold text-indigo-700">{activeQuotation?.quotation_number}</span>
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {activeMilestones.map((m, idx) => (
            <div key={m.milestone_id} className="p-5 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {m.milestone_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(m.status)}`}>
                      {m.status}
                    </span>
                    {m.payment_pct > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {m.payment_pct}% Termin Tranche
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900">
                    {m.milestone_name}
                  </h4>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 mt-2">
                    <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider mb-0.5">
                      Required Deliverables & Compliance Verification:
                    </span>
                    {m.deliverables}
                  </div>

                  {m.invoice_number && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                      <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Invoice: <strong className="font-mono text-indigo-700">{m.invoice_number}</strong></span>
                      {m.payment_received_date && (
                        <span className="text-emerald-700 font-medium">
                          • Paid on {formatDate(m.payment_received_date)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
                  <div className="text-left lg:text-right">
                    <div className="text-xs text-slate-400 font-medium">PAYMENT VALUE</div>
                    <div className="text-lg font-bold font-mono text-slate-900">
                      {formatIDR(m.amount_idr)}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Target: {formatDate(m.target_date)}
                    </div>
                  </div>

                  {/* Status Dropdown Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Update Status:</span>
                    <select
                      value={m.status}
                      onChange={e => handleStatusChange(m, e.target.value as MilestoneStatus)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadgeClass(m.status)}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Achieved / Invoiced">Achieved / Invoiced</option>
                      <option value="Paid">Paid</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
