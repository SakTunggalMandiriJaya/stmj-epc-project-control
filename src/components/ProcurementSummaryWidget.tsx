import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Calendar, 
  ShieldAlert, 
  DollarSign, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  Bell, 
  Plus, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { RFQItem, VendorContractExpiration } from '../types/rfq';
import { formatCurrency, calculateQuoteTCO } from '../utils/tcoCalculator';

interface ProcurementSummaryWidgetProps {
  rfqs: RFQItem[];
  contracts: VendorContractExpiration[];
  onSelectRFQ: (rfq: RFQItem) => void;
  onOpenCreateRFQ: () => void;
  onFilterByStatus?: (status: string) => void;
  onFilterByVendor?: (vendor: string) => void;
  onAddContract?: (contract: VendorContractExpiration) => void;
}

export const ProcurementSummaryWidget: React.FC<ProcurementSummaryWidgetProps> = ({
  rfqs,
  contracts,
  onSelectRFQ,
  onOpenCreateRFQ,
  onFilterByStatus,
  onFilterByVendor,
  onAddContract,
}) => {
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
  const [selectedContractTab, setSelectedContractTab] = useState<'all' | 'critical' | 'upcoming'>('all');

  // Today reference date (aligned with metadata: 2026-09-25)
  const today = useMemo(() => new Date('2026-09-25'), []);

  // 1. Metric: Total Active RFQs
  const activeRfqs = useMemo(() => {
    return rfqs.filter(r => r.status !== 'closed');
  }, [rfqs]);

  const activeByStatus = useMemo(() => {
    const counts: Record<string, number> = { open: 0, evaluating: 0, negotiating: 0, awarded: 0, draft: 0 };
    activeRfqs.forEach(r => {
      const st = r.status as string;
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [activeRfqs]);

  const totalManagedSeats = useMemo(() => {
    return activeRfqs.reduce((acc, r) => acc + (r.userSeats || 0), 0);
  }, [activeRfqs]);

  // 2. Metric: Savings Analysis (Total, Average per RFQ, Average %)
  const savingsAnalysis = useMemo<{
    totalSavingsIdentified: number;
    avgSavingsAmount: number;
    avgSavingsPercent: number;
    rfqsWithQuotesCount: number;
    highestSavingRFQ: { rfq: RFQItem; amount: number; pct: number } | null;
  }>(() => {
    let totalSavingsIdentified = 0;
    let rfqsWithQuotesCount = 0;
    let totalTargetBudgetsWithQuotes = 0;
    let highestSavingRFQ: { rfq: RFQItem; amount: number; pct: number } | null = null;

    rfqs.forEach(rfq => {
      if (rfq.quotes.length > 0) {
        rfqsWithQuotesCount++;
        const target3Y = rfq.targetBudgetAnnual * 3;
        totalTargetBudgetsWithQuotes += target3Y;

        const quoteTcos = rfq.quotes.map(q => 
          calculateQuoteTCO(q, rfq.userSeats, rfq.contractTermMonths).threeYearTco
        );
        const bestTco = Math.min(...quoteTcos);

        if (target3Y > bestTco) {
          const savings = target3Y - bestTco;
          totalSavingsIdentified += savings;

          const pct = Math.round((savings / target3Y) * 100);
          if (!highestSavingRFQ || savings > highestSavingRFQ.amount) {
            highestSavingRFQ = { rfq, amount: savings, pct };
          }
        }
      }
    });

    const avgSavingsAmount = rfqsWithQuotesCount > 0 
      ? Math.round(totalSavingsIdentified / rfqsWithQuotesCount) 
      : 0;

    const avgSavingsPercent = totalTargetBudgetsWithQuotes > 0
      ? Math.round((totalSavingsIdentified / totalTargetBudgetsWithQuotes) * 1000) / 10
      : 0;

    return {
      totalSavingsIdentified,
      avgSavingsAmount,
      avgSavingsPercent,
      rfqsWithQuotesCount,
      highestSavingRFQ,
    };
  }, [rfqs]);

  // 3. Metric: Upcoming Vendor Contract Expirations
  const expirationStats = useMemo(() => {
    // Calculate days remaining for each contract
    const sorted = [...contracts].map(c => {
      const expDate = new Date(c.expirationDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Notice deadline days remaining
      const noticeDate = new Date(expDate);
      noticeDate.setDate(noticeDate.getDate() - c.noticeDeadlineDays);
      const noticeDiffDays = Math.ceil((noticeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...c,
        daysRemaining: diffDays,
        noticeDaysRemaining: noticeDiffDays,
        isNoticeCritical: noticeDiffDays <= 14 && diffDays > 0,
        isExpiringSoon: diffDays <= 60 && diffDays > 0,
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Contracts expiring in next 90 days
    const next90Days = sorted.filter(c => c.daysRemaining > 0 && c.daysRemaining <= 90);
    const criticalNotice = sorted.filter(c => c.noticeDaysRemaining <= 15 && c.daysRemaining > 0);
    const totalSpendAtRisk = next90Days.reduce((acc, c) => acc + c.annualValue, 0);

    return {
      allSorted: sorted,
      next90Days,
      criticalNotice,
      totalSpendAtRisk,
      earliest: sorted.find(c => c.daysRemaining > 0) || sorted[0],
    };
  }, [contracts, today]);

  return (
    <div className="space-y-4">
      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Active RFQs */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors shadow-xs relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-16 h-16 text-blue-400" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Active Sourcing RFQs
              </span>
              <span className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                {totalManagedSeats.toLocaleString()} seats
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                {activeRfqs.length}
              </span>
              <span className="text-xs text-neutral-400">
                active in pipeline
              </span>
            </div>

            <p className="text-xs text-neutral-400 mt-1">
              Active solicitations across {new Set(activeRfqs.map(r => r.category)).size} software categories.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeByStatus.evaluating > 0 && (
                <button
                  onClick={() => onFilterByStatus?.('evaluating')}
                  className="px-2 py-0.5 rounded text-[11px] bg-amber-950/60 text-amber-300 border border-amber-800/60 font-medium hover:bg-amber-900/60 transition-colors cursor-pointer"
                >
                  {activeByStatus.evaluating} Evaluating
                </button>
              )}
              {activeByStatus.negotiating > 0 && (
                <button
                  onClick={() => onFilterByStatus?.('negotiating')}
                  className="px-2 py-0.5 rounded text-[11px] bg-purple-950/60 text-purple-300 border border-purple-800/60 font-medium hover:bg-purple-900/60 transition-colors cursor-pointer"
                >
                  {activeByStatus.negotiating} In BAFO
                </button>
              )}
              {activeByStatus.open > 0 && (
                <button
                  onClick={() => onFilterByStatus?.('open')}
                  className="px-2 py-0.5 rounded text-[11px] bg-blue-950/60 text-blue-300 border border-blue-800/60 font-medium hover:bg-blue-900/60 transition-colors cursor-pointer"
                >
                  {activeByStatus.open} Open Tender
                </button>
              )}
            </div>

            <button
              onClick={onOpenCreateRFQ}
              className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-0.5 cursor-pointer ml-auto"
            >
              <span>+ New</span>
            </button>
          </div>
        </div>

        {/* Card 2: Average Savings Identified */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors shadow-xs relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-16 h-16 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Benchmark Savings
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                -{savingsAnalysis.avgSavingsPercent}% avg cut
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                {formatCurrency(savingsAnalysis.avgSavingsAmount)}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                avg / tender
              </span>
            </div>

            <p className="text-xs text-neutral-400 mt-1">
              Projected 3-year TCO reduction against baseline enterprise quote list prices.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <div className="text-neutral-400">
              Total pipeline savings:{' '}
              <span className="font-mono font-bold text-white">
                {formatCurrency(savingsAnalysis.totalSavingsIdentified)}
              </span>
            </div>
            {savingsAnalysis.highestSavingRFQ && (
              <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
                Top: {savingsAnalysis.highestSavingRFQ.rfq.rfqNumber} (-{savingsAnalysis.highestSavingRFQ.pct}%)
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Upcoming Vendor Contract Expirations */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors shadow-xs relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Contract Expirations
              </span>
              <button
                onClick={() => setIsContractsModalOpen(true)}
                className="text-[11px] font-mono text-amber-300 hover:text-white bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 cursor-pointer transition-colors"
              >
                View All ({contracts.length})
              </button>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                {expirationStats.next90Days.length}
              </span>
              <span className="text-xs text-neutral-400">
                expiring within 90 days
              </span>
            </div>

            {expirationStats.earliest && (
              <p className="text-xs text-neutral-300 mt-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Next: <strong className="text-white font-medium">{expirationStats.earliest.vendorName}</strong> (
                  <span className="font-mono text-amber-400 font-semibold">{expirationStats.earliest.daysRemaining} days left</span>)
                </span>
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              Spend at renewal risk:{' '}
              <span className="font-mono font-bold text-amber-400">
                {formatCurrency(expirationStats.totalSpendAtRisk)}/yr
              </span>
            </span>
            <button
              onClick={() => setIsContractsModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Renewals Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Immediate Notice Alert Strip (Shows when a contract auto-renewal notice deadline is within 15 days) */}
      {expirationStats.criticalNotice.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-900/60 border border-amber-700/60 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-amber-300">
                Auto-Renewal Notice Window Alert:
              </span>{' '}
              <span className="text-neutral-300">
                {expirationStats.criticalNotice.map(c => `${c.vendorName} (${c.productName})`).join(', ')} has a mandatory {expirationStats.criticalNotice[0]?.noticeDeadlineDays}-day opt-out deadline in{' '}
                <strong className="text-amber-300 font-mono">{expirationStats.criticalNotice[0]?.noticeDaysRemaining} days</strong>.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {expirationStats.criticalNotice[0]?.linkedRfqId && (
              <button
                onClick={() => {
                  const target = rfqs.find(r => r.id === expirationStats.criticalNotice[0].linkedRfqId);
                  if (target) onSelectRFQ(target);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
              >
                Inspect Replacement RFQ
              </button>
            )}
            <button
              onClick={() => setIsContractsModalOpen(true)}
              className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded transition-colors cursor-pointer"
            >
              Review Expirations
            </button>
          </div>
        </div>
      )}

      {/* Contract Expirations & Renewal Governance Modal */}
      {isContractsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    Upcoming Vendor Contract Expirations & Renewal Calendar
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Proactively track enterprise SaaS expirations to prevent auto-renewals and initiate competitive RFQs
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsContractsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-md border border-neutral-800">
                  <button
                    onClick={() => setSelectedContractTab('all')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      selectedContractTab === 'all'
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All Expirations ({expirationStats.allSorted.length})
                  </button>
                  <button
                    onClick={() => setSelectedContractTab('critical')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      selectedContractTab === 'critical'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60 font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Critical Notice Window ({expirationStats.criticalNotice.length})
                  </button>
                  <button
                    onClick={() => setSelectedContractTab('upcoming')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      selectedContractTab === 'upcoming'
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Next 90 Days ({expirationStats.next90Days.length})
                  </button>
                </div>

                <div className="text-neutral-400 text-xs">
                  Total Annual Contract Value: <span className="font-mono font-bold text-white">{formatCurrency(contracts.reduce((a, b) => a + b.annualValue, 0))}</span>
                </div>
              </div>

              {/* Contracts List Table */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 font-mono text-[11px] uppercase">
                      <th className="py-2.5 px-3">Incumbent Vendor & Tool</th>
                      <th className="py-2.5 px-3">SaaS Domain</th>
                      <th className="py-2.5 px-3 text-right">Annual Spend</th>
                      <th className="py-2.5 px-3 text-center">Expiration Date</th>
                      <th className="py-2.5 px-3 text-center">Notice Window</th>
                      <th className="py-2.5 px-3 text-center">Linked RFQ Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {expirationStats.allSorted
                      .filter(c => {
                        if (selectedContractTab === 'critical') return c.isNoticeCritical;
                        if (selectedContractTab === 'upcoming') return c.isExpiringSoon;
                        return true;
                      })
                      .map(contract => {
                        const linkedRfq = rfqs.find(r => r.id === contract.linkedRfqId);
                        const isCritical = contract.noticeDaysRemaining <= 15;

                        return (
                          <tr key={contract.id} className="hover:bg-neutral-900/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{contract.vendorName}</span>
                                {contract.autoRenew && (
                                  <span className="text-[10px] font-mono px-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700" title="Contract will auto-renew if not canceled">
                                    Auto-Renew
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-400">{contract.productName}</div>
                            </td>

                            <td className="py-3 px-3 text-neutral-400">
                              <span>{contract.category}</span>
                            </td>

                            <td className="py-3 px-3 text-right font-mono tabular-nums text-white font-medium">
                              {formatCurrency(contract.annualValue)}
                              <span className="text-[10px] text-neutral-500 block">
                                {contract.seats ? `${contract.seats} seats` : ''}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className="font-mono text-white block">{contract.expirationDate}</span>
                              <span className={`text-[10px] font-mono font-semibold ${
                                contract.daysRemaining <= 30 ? 'text-red-400' : 
                                contract.daysRemaining <= 60 ? 'text-amber-400' : 'text-neutral-400'
                              }`}>
                                {contract.daysRemaining} days remaining
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                                isCritical 
                                  ? 'bg-red-950/60 text-red-300 border-red-800 font-bold animate-pulse' 
                                  : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                              }`}>
                                {contract.noticeDeadlineDays}d prior notice ({contract.noticeDaysRemaining}d left)
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              {linkedRfq ? (
                                <button
                                  onClick={() => {
                                    setIsContractsModalOpen(false);
                                    onSelectRFQ(linkedRfq);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline font-mono cursor-pointer"
                                >
                                  <span>{linkedRfq.rfqNumber}</span>
                                  <span className="capitalize text-[10px] bg-neutral-900 px-1 rounded text-neutral-300">
                                    ({linkedRfq.status})
                                  </span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-neutral-500 italic">
                                  No RFQ Linked
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              {linkedRfq ? (
                                <button
                                  onClick={() => {
                                    setIsContractsModalOpen(false);
                                    onSelectRFQ(linkedRfq);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-white bg-blue-950/40 hover:bg-blue-600 border border-blue-800/40 rounded transition-colors cursor-pointer"
                                >
                                  <span>View RFQ</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setIsContractsModalOpen(false);
                                    onOpenCreateRFQ();
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-950/50 hover:bg-emerald-600 border border-emerald-800/60 rounded transition-colors cursor-pointer"
                                >
                                  <span>Start RFQ</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Best Practice Callout */}
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Procurement Best Practice:</strong> Solicit bids via enterprise RFQ at least 90 days before contract expiration to preserve competitive negotiation leverage and prevent auto-renewal lock-in clauses.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setIsContractsModalOpen(false);
                  onOpenCreateRFQ();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Draft New Replacement RFQ</span>
              </button>

              <button
                onClick={() => setIsContractsModalOpen(false)}
                className="px-4 py-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
