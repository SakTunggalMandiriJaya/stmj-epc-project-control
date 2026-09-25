import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  Building2, 
  Layers, 
  ChevronRight, 
  SlidersHorizontal,
  Tag
} from 'lucide-react';
import { RFQItem, RFQStatus, VendorContractExpiration } from '../types/rfq';
import { formatCurrency, calculateQuoteTCO } from '../utils/tcoCalculator';
import { ProcurementSummaryWidget } from './ProcurementSummaryWidget';

interface RFQListProps {
  rfqs: RFQItem[];
  contracts: VendorContractExpiration[];
  onSelectRFQ: (rfq: RFQItem) => void;
  onOpenCreateModal: () => void;
  onAddContract?: (contract: VendorContractExpiration) => void;
}

export const RFQList: React.FC<RFQListProps> = ({ 
  rfqs, 
  contracts,
  onSelectRFQ, 
  onOpenCreateModal,
  onAddContract 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');

  // Pipeline KPIs calculation
  const totalRfqs = rfqs.length;
  const totalQuotes = rfqs.reduce((acc, r) => acc + r.quotes.length, 0);
  
  // Total potential savings across all RFQs
  let totalSavings = 0;
  rfqs.forEach(rfq => {
    if (rfq.quotes.length > 0) {
      const budget3Y = rfq.targetBudgetAnnual * 3;
      const minTco = Math.min(...rfq.quotes.map(q => calculateQuoteTCO(q, rfq.userSeats, rfq.contractTermMonths).threeYearTco));
      if (budget3Y > minTco) {
        totalSavings += (budget3Y - minTco);
      }
    }
  });

  // Extract all unique vendors across all RFQs (both invited and submitted quotes)
  const allVendors = useMemo(() => {
    const set = new Set<string>();
    rfqs.forEach(r => {
      r.invitedVendors.forEach(v => set.add(v.trim()));
      r.quotes.forEach(q => set.add(q.vendorName.trim()));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rfqs]);

  // Status counts for badge counters
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: rfqs.length };
    rfqs.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [rfqs]);

  // Filtered RFQs based on title, status, vendor name, category, and direct selectors
  const filteredRfqs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return rfqs.filter(r => {
      // 1. Text Search matching Title, RFQ ID, Buyer, Department, Status, or Vendor Name
      const matchesTitleOrId = 
        r.title.toLowerCase().includes(term) ||
        r.rfqNumber.toLowerCase().includes(term) ||
        r.leadBuyer.toLowerCase().includes(term) ||
        r.department.toLowerCase().includes(term);

      const matchesStatusKeyword = r.status.toLowerCase().includes(term);

      const matchesVendorKeyword = 
        r.quotes.some(q => 
          q.vendorName.toLowerCase().includes(term) || 
          q.vendorCode.toLowerCase().includes(term) ||
          q.contactPerson.name.toLowerCase().includes(term)
        ) ||
        r.invitedVendors.some(v => v.toLowerCase().includes(term));

      const matchesSearch = !term || matchesTitleOrId || matchesStatusKeyword || matchesVendorKeyword;

      // 2. Category filter
      const matchesCat = categoryFilter === 'All' || r.category === categoryFilter;

      // 3. Status filter
      const matchesStatus = statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();

      // 4. Vendor filter dropdown
      const matchesSelectedVendor = 
        vendorFilter === 'All' ||
        r.quotes.some(q => q.vendorName.toLowerCase() === vendorFilter.toLowerCase()) ||
        r.invitedVendors.some(v => v.toLowerCase() === vendorFilter.toLowerCase());

      return matchesSearch && matchesCat && matchesStatus && matchesSelectedVendor;
    });
  }, [rfqs, searchTerm, categoryFilter, statusFilter, vendorFilter]);

  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    statusFilter !== 'All' || 
    categoryFilter !== 'All' || 
    vendorFilter !== 'All';

  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setVendorFilter('All');
  };

  const getStatusColor = (status: RFQStatus) => {
    switch (status) {
      case 'evaluating':
        return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'negotiating':
        return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 'awarded':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'open':
        return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      case 'draft':
      default:
        return 'text-neutral-400 bg-neutral-400/10 border-neutral-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Summary Widget: Active RFQs, Average Savings, Contract Expirations */}
      <ProcurementSummaryWidget
        rfqs={rfqs}
        contracts={contracts}
        onSelectRFQ={onSelectRFQ}
        onOpenCreateRFQ={onOpenCreateModal}
        onFilterByStatus={(st) => setStatusFilter(st)}
        onFilterByVendor={(v) => setVendorFilter(v)}
        onAddContract={onAddContract}
      />

      {/* Comprehensive Search & Filter Console */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3.5 shadow-sm">
        {/* Row 1: Search Bar & Primary Filter Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Main Search Input: title, status, or vendor name */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search RFQ title, status, or vendor (e.g. Zendesk, Datadog)..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-9 pr-8 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vendor Filter Dropdown */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-8 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
              >
                <option value="All">All Vendors ({allVendors.length})</option>
                {allVendors.map(vendor => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Status Filter Dropdown / Quick Select */}
          <div className="lg:col-span-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md pl-8 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none capitalize"
              >
                <option value="All">All Statuses ({totalRfqs})</option>
                <option value="open">Open ({statusCounts['open'] || 0})</option>
                <option value="evaluating">Evaluating ({statusCounts['evaluating'] || 0})</option>
                <option value="negotiating">Negotiating ({statusCounts['negotiating'] || 0})</option>
                <option value="awarded">Awarded ({statusCounts['awarded'] || 0})</option>
                <option value="draft">Draft ({statusCounts['draft'] || 0})</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-[10px]">
                ▼
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors shrink-0 cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Pills & Status Segmented Switcher */}
        <div className="pt-2 border-t border-neutral-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Status quick tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <span className="text-neutral-500 mr-1 whitespace-nowrap">Status:</span>
            {['All', 'open', 'evaluating', 'negotiating', 'awarded'].map((st) => {
              const count = statusCounts[st] || 0;
              const isActive = statusFilter.toLowerCase() === st.toLowerCase();
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap capitalize flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200 bg-neutral-950/60 border border-neutral-800/80'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`px-1 rounded text-[10px] font-mono ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category quick tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-neutral-500 whitespace-nowrap">Category:</span>
            {['All', 'Customer Support & CRM', 'Security & DevSecOps', 'HRIS & Workforce'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Active Filter Chips Strip & Result Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/40 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-neutral-500">
              Showing <span className="font-mono font-semibold text-white">{filteredRfqs.length}</span> of <span className="font-mono text-neutral-400">{totalRfqs}</span> solicitations
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono">
                Keyword: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {vendorFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                Vendor: {vendorFilter}
                <button onClick={() => setVendorFilter('All')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono capitalize">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('All')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {categoryFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 font-mono">
                Category: {categoryFilter}
                <button onClick={() => setCategoryFilter('All')} className="hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-blue-400 hover:text-blue-300 text-[11px] underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* RFQ High-Density Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 uppercase font-mono text-[11px] tracking-wider">
                <th className="py-3 px-4">RFQ Identifier & Title</th>
                <th className="py-3 px-4">SaaS Category</th>
                <th className="py-3 px-4">Vendors & Bidders</th>
                <th className="py-3 px-4 text-right">Target Seats</th>
                <th className="py-3 px-4 text-right">Annual Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Procurement Lead</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredRfqs.map((rfq) => {
                const quoteCount = rfq.quotes.length;
                const searchLower = searchTerm.trim().toLowerCase();

                return (
                  <tr
                    key={rfq.id}
                    onClick={() => onSelectRFQ(rfq)}
                    className="hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs sm:max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-400 font-semibold">{rfq.rfqNumber}</span>
                        <span className="text-neutral-500">·</span>
                        <span className="group-hover:text-blue-300 transition-colors font-sans truncate font-medium">
                          {rfq.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                        {rfq.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap">
                      <span>{rfq.category}</span>
                    </td>

                    {/* Vendors & Bidders tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
                        {rfq.quotes.map(q => {
                          const isVendorMatch = 
                            (vendorFilter !== 'All' && q.vendorName.toLowerCase() === vendorFilter.toLowerCase()) ||
                            (searchLower && q.vendorName.toLowerCase().includes(searchLower));

                          return (
                            <span 
                              key={q.id}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                                isVendorMatch
                                  ? 'bg-purple-900/70 text-purple-200 border border-purple-600 font-bold ring-1 ring-purple-500/40'
                                  : 'bg-neutral-950 text-neutral-300 border border-neutral-800'
                              }`}
                              title={`${q.vendorName} (${q.status.replace('_', ' ')})`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span>{q.vendorName.split(' ')[0]}</span>
                            </span>
                          );
                        })}
                        {rfq.quotes.length === 0 && (
                          <span className="text-[11px] text-neutral-500 italic">No quotes yet</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-200 whitespace-nowrap">
                      {rfq.userSeats.toLocaleString()} seats
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-200 whitespace-nowrap">
                      {formatCurrency(rfq.targetBudgetAnnual)}
                      <span className="text-[10px] text-neutral-500 block">/yr</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusColor(rfq.status)}`}>
                        {rfq.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                      <div className="font-medium text-neutral-300">{rfq.leadBuyer}</div>
                      <div className="text-[10px] text-neutral-500 truncate max-w-[130px]">{rfq.department}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRFQ(rfq);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-white bg-blue-950/40 hover:bg-blue-600 border border-blue-800/40 rounded transition-colors cursor-pointer"
                      >
                        <span>Analyze</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRfqs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-white">No SaaS RFQs found</p>
                      <p className="text-xs text-neutral-400">
                        No solicitations matched your search criteria{' '}
                        {searchTerm && <span className="font-mono text-blue-400">"{searchTerm}"</span>}
                        {vendorFilter !== 'All' && <span> for vendor <span className="font-mono text-purple-400">{vendorFilter}</span></span>}
                        {statusFilter !== 'All' && <span> with status <span className="font-mono text-amber-400">{statusFilter}</span></span>}
                        .
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        <button
                          onClick={resetAllFilters}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors cursor-pointer"
                        >
                          Clear all filters
                        </button>
                        <button
                          onClick={onOpenCreateModal}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors cursor-pointer"
                        >
                          Create New RFQ
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

