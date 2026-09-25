import React from 'react';
import { ArrowLeft, Calendar, Users, Clock, Award, ShieldAlert, Sparkles, SlidersHorizontal, TableProperties, FileCheck, Download } from 'lucide-react';
import { RFQItem } from '../types/rfq';
import { formatCurrency } from '../utils/tcoCalculator';

interface RFQDetailHeaderProps {
  rfq: RFQItem;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBack: () => void;
  onOpenAwardModal: () => void;
  onAddQuote: () => void;
}

export const RFQDetailHeader: React.FC<RFQDetailHeaderProps> = ({
  rfq,
  activeTab,
  setActiveTab,
  onBack,
  onOpenAwardModal,
  onAddQuote,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'evaluating':
        return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'negotiating':
        return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 'awarded':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'open':
        return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      default:
        return 'text-neutral-400 bg-neutral-400/10 border-neutral-500/20';
    }
  };

  const exportSummary = () => {
    const data = `RFQ EVALUATION SUMMARY REPORT
Identifier: ${rfq.rfqNumber}
Title: ${rfq.title}
Category: ${rfq.category}
User Seats: ${rfq.userSeats}
Contract Term: ${rfq.contractTermMonths} Months
Target Budget (Annual): ${formatCurrency(rfq.targetBudgetAnnual)}
Target Live Date: ${rfq.targetLiveDate}
Sourcing Lead: ${rfq.leadBuyer} (${rfq.buyerEmail})

SUBMITTED VENDOR QUOTATIONS:
${rfq.quotes.map(q => `
- Vendor: ${q.vendorName}
  Pricing: $${q.pricing.perUserPerMonth}/user/mo + $${q.pricing.baseAnnualFee}/yr base
  Implementation: $${q.pricing.implementationFee}
  Year 1 Discount: ${q.pricing.year1DiscountPct}%
  Uptime SLA: ${q.sla.uptimeGuaranteePct}% (P1 Response: ${q.sla.p1ResponseMinutes} min)
  SOC2: ${q.compliance.soc2Type2 ? 'Yes' : 'No'} | ISO27001: ${q.compliance.iso27001 ? 'Yes' : 'No'} | HIPAA: ${q.compliance.hipaaBaa ? 'Yes' : 'No'}
`).join('')}
`;
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rfq.rfqNumber}-evaluation-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
      {/* Top breadcrumb & back row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-400">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All RFQs</span>
          </button>
          <span>/</span>
          <span className="text-neutral-500">{rfq.category}</span>
          <span>/</span>
          <span className="text-blue-400 font-mono font-medium">{rfq.rfqNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSummary}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Brief</span>
          </button>
          {rfq.status !== 'awarded' ? (
            <button
              onClick={onOpenAwardModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors cursor-pointer shadow-xs"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Award RFQ</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800">
              <Award className="w-3.5 h-3.5" />
              <span>Contract Awarded</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Title & Key Parameters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              {rfq.title}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusBadge(rfq.status)}`}>
              {rfq.status.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400 max-w-3xl leading-relaxed">
            {rfq.description}
          </p>
        </div>

        {/* Lead buyer card */}
        <div className="flex items-center gap-3 p-2.5 bg-neutral-950 rounded-md border border-neutral-800/80 text-xs shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold font-mono">
            {rfq.leadBuyer.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-medium text-neutral-200">{rfq.leadBuyer}</div>
            <div className="text-[11px] text-neutral-500">{rfq.department}</div>
          </div>
        </div>
      </div>

      {/* Numerical Spec strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-neutral-950/60 rounded border border-neutral-800">
          <span className="text-neutral-500 block text-[11px]">User Seats</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-white">
            {rfq.userSeats.toLocaleString()} seats
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950/60 rounded border border-neutral-800">
          <span className="text-neutral-500 block text-[11px]">Contract Commitment</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-white">
            {rfq.contractTermMonths} months ({rfq.contractTermMonths / 12} yrs)
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950/60 rounded border border-neutral-800">
          <span className="text-neutral-500 block text-[11px]">Target Annual Budget</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">
            {formatCurrency(rfq.targetBudgetAnnual)}
          </span>
        </div>

        <div className="p-2.5 bg-neutral-950/60 rounded border border-neutral-800">
          <span className="text-neutral-500 block text-[11px]">Target Go-Live</span>
          <span className="font-mono text-sm font-semibold text-neutral-300">
            {rfq.targetLiveDate}
          </span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-1 border-t border-neutral-800/80 pt-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'quotes'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <TableProperties className="w-3.5 h-3.5 text-blue-400" />
          <span>Vendor Quotations</span>
          <span className="font-mono tabular-nums text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300">
            {rfq.quotes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tco')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'tco'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
          <span>TCO Benchmark & Scale</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'ai'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Intelligence & Negotiation</span>
        </button>

        <button
          onClick={() => setActiveTab('specs')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'specs'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Requirements & Rubric</span>
          <span className="font-mono tabular-nums text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300">
            {rfq.requirements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Audit Log</span>
          <span className="font-mono tabular-nums text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300">
            {rfq.auditLog.length}
          </span>
        </button>
      </div>
    </div>
  );
};
