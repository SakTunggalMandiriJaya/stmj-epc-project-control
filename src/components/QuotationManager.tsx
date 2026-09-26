import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  ArrowUpRight, 
  Calculator, 
  ShieldAlert, 
  X,
  FileCheck2,
  TrendingUp,
  Sliders,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  Quotation, 
  QuotationLineItem, 
  Customer, 
  VendorMaterialItem, 
  FireSuppressionComponent,
  LineItemCategory,
  QuotationStatus
} from '../types/stmjDatabase';
import { INITIAL_QUOTATION_LINE_ITEMS, INITIAL_QUOTATIONS } from '../data/stmjDatabaseSeed';
import { formatIDR, formatPercent, formatDate, getStatusBadgeClass } from '../utils/stmjFormatters';

interface QuotationManagerProps {
  quotations: Quotation[];
  customers: Customer[];
  lineItems: QuotationLineItem[];
  vendorMaterials: VendorMaterialItem[];
  fireSuppressionLibrary: FireSuppressionComponent[];
  selectedQuotationId?: string;
  onSelectQuotation?: (id: string) => void;
  onUpdateQuotation: (updated: Quotation) => void;
  onAddQuotation: (newQuo: Quotation, initialLines: QuotationLineItem[]) => void;
  onAddLineItem: (item: QuotationLineItem) => void;
  onBatchAddLineItems?: (items: QuotationLineItem[]) => void;
  onDeleteLineItem: (itemId: string) => void;
  onOpenCostCalculator: (quotationId: string) => void;
  onOpenMilestones: (quotationId: string) => void;
  onResetDatabase?: () => void;
}

export const QuotationManager: React.FC<QuotationManagerProps> = ({
  quotations,
  customers,
  lineItems,
  vendorMaterials,
  fireSuppressionLibrary,
  selectedQuotationId: propSelectedQuotationId,
  onSelectQuotation,
  onUpdateQuotation,
  onAddQuotation,
  onAddLineItem,
  onBatchAddLineItems,
  onDeleteLineItem,
  onOpenCostCalculator,
  onOpenMilestones,
  onResetDatabase,
}) => {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>(
    propSelectedQuotationId || quotations[0]?.quotation_id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showNewQuoModal, setShowNewQuoModal] = useState(false);

  // Sync incoming propSelectedQuotationId
  useEffect(() => {
    if (propSelectedQuotationId && propSelectedQuotationId !== selectedQuotationId) {
      setSelectedQuotationId(propSelectedQuotationId);
      // If the targeted quotation has a specific status and it's currently hidden by statusFilter, reset filter to All
      const target = quotations.find(q => q.quotation_id === propSelectedQuotationId);
      if (target && statusFilter !== 'All' && target.status !== statusFilter) {
        setStatusFilter('All');
      }
    }
  }, [propSelectedQuotationId, quotations]);

  // New Line Item State
  const [selectedCatalogMatId, setSelectedCatalogMatId] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemMarkup, setNewItemMarkup] = useState<number>(35);
  const [customItemDesc, setCustomItemDesc] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<LineItemCategory>('Fire Suppression Equipment');
  const [customHpp, setCustomHpp] = useState<number>(0);
  const [customUom, setCustomUom] = useState<string>('Unit');

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const cust = customers.find(c => c.customer_id === q.customer_id);
      const matchesSearch = 
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, customers, searchTerm, statusFilter]);

  // When filteredQuotations change, ensure selectedQuotationId is in the list
  useEffect(() => {
    if (filteredQuotations.length > 0) {
      const isSelectedInList = filteredQuotations.some(q => q.quotation_id === selectedQuotationId);
      if (!isSelectedInList) {
        const nextId = filteredQuotations[0].quotation_id;
        setSelectedQuotationId(nextId);
        onSelectQuotation?.(nextId);
      }
    }
  }, [filteredQuotations, selectedQuotationId, onSelectQuotation]);

  const activeQuotation = useMemo(() => {
    if (filteredQuotations.length > 0) {
      const matchInFiltered = filteredQuotations.find(q => q.quotation_id === selectedQuotationId);
      if (matchInFiltered) return matchInFiltered;
      return filteredQuotations[0];
    }
    return quotations.find(q => q.quotation_id === selectedQuotationId) || quotations[0];
  }, [filteredQuotations, quotations, selectedQuotationId]);

  const activeCustomer = useMemo(() => {
    if (!activeQuotation) return null;
    return customers.find(c => c.customer_id === activeQuotation.customer_id) || null;
  }, [customers, activeQuotation]);

  const activeLineItems = useMemo(() => {
    if (!activeQuotation) return [];
    return lineItems.filter(li => li.quotation_id === activeQuotation.quotation_id);
  }, [lineItems, activeQuotation]);

  // Default seed items for the current active quotation if BoQ is empty
  const defaultSeedLinesForActive = useMemo(() => {
    if (!activeQuotation) return [];
    return INITIAL_QUOTATION_LINE_ITEMS.filter(li => li.quotation_id === activeQuotation.quotation_id);
  }, [activeQuotation]);

  const handleRestoreDefaultSeedBoQ = () => {
    if (!activeQuotation || defaultSeedLinesForActive.length === 0) return;
    if (onBatchAddLineItems) {
      onBatchAddLineItems(defaultSeedLinesForActive);
    } else {
      defaultSeedLinesForActive.forEach(item => onAddLineItem(item));
    }
  };

  // Aggregate Metrics for Active Quotation
  const calculatedTotals = useMemo(() => {
    const totalHpp = activeLineItems.reduce((acc, li) => acc + li.total_hpp_idr, 0);
    const totalSell = activeLineItems.reduce((acc, li) => acc + li.total_price_idr, 0);
    const grossProfit = totalSell - totalHpp;
    const marginPct = totalSell > 0 ? (grossProfit / totalSell) * 100 : 0;
    const ppn = totalSell * 0.11;
    const grandTotal = totalSell + ppn;
    return { totalHpp, totalSell, grossProfit, marginPct, ppn, grandTotal };
  }, [activeLineItems]);

  // Handle Adding Item from Library
  const handleAddCatalogItem = () => {
    if (!activeQuotation) return;

    if (selectedCatalogMatId) {
      const mat = vendorMaterials.find(m => m.material_id === selectedCatalogMatId);
      if (!mat) return;

      const unitHpp = mat.standard_price_idr;
      const markup = newItemMarkup;
      const unitPrice = Math.round(unitHpp * (1 + markup / 100));
      const totalHpp = unitHpp * newItemQty;
      const totalPrice = unitPrice * newItemQty;
      const profit = totalPrice - totalHpp;
      const margin = (profit / totalPrice) * 100;

      const newItem: QuotationLineItem = {
        item_id: `QLI-${Date.now().toString().slice(-4)}`,
        quotation_id: activeQuotation.quotation_id,
        material_id: mat.material_id,
        item_code: mat.item_code,
        description: mat.item_name,
        category: mat.category,
        quantity: newItemQty,
        uom: mat.uom,
        unit_hpp_idr: unitHpp,
        markup_pct: markup,
        unit_price_idr: unitPrice,
        total_hpp_idr: totalHpp,
        total_price_idr: totalPrice,
        gross_profit_idr: profit,
        margin_pct: margin,
      };

      onAddLineItem(newItem);
    } else if (customItemDesc && customHpp > 0) {
      const unitHpp = customHpp;
      const markup = newItemMarkup;
      const unitPrice = Math.round(unitHpp * (1 + markup / 100));
      const totalHpp = unitHpp * newItemQty;
      const totalPrice = unitPrice * newItemQty;
      const profit = totalPrice - totalHpp;
      const margin = (profit / totalPrice) * 100;

      const newItem: QuotationLineItem = {
        item_id: `QLI-${Date.now().toString().slice(-4)}`,
        quotation_id: activeQuotation.quotation_id,
        item_code: `CUSTOM-${Date.now().toString().slice(-3)}`,
        description: customItemDesc,
        category: customCategory,
        quantity: newItemQty,
        uom: customUom,
        unit_hpp_idr: unitHpp,
        markup_pct: markup,
        unit_price_idr: unitPrice,
        total_hpp_idr: totalHpp,
        total_price_idr: totalPrice,
        gross_profit_idr: profit,
        margin_pct: margin,
      };

      onAddLineItem(newItem);
    }

    setShowAddItemModal(false);
    setSelectedCatalogMatId('');
    setCustomItemDesc('');
    setCustomHpp(0);
  };

  // Status Change
  const handleStatusChange = (newStatus: QuotationStatus) => {
    if (!activeQuotation) return;
    onUpdateQuotation({
      ...activeQuotation,
      status: newStatus,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Quotations Active</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{quotations.length}</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {quotations.filter(q => q.status === 'Won / PO Received').length} Won & PO Issued
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Pipeline Quotation Value</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatIDR(quotations.reduce((acc, q) => acc + q.total_amount_idr, 0))}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all industrial sectors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Active HPP (Cost of Goods)</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatIDR(quotations.reduce((acc, q) => acc + q.subtotal_hpp_idr, 0))}
          </div>
          <div className="text-xs text-blue-600 mt-1">Bottom-up procurement budget</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Average Target Margin</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {formatPercent(quotations.reduce((acc, q) => acc + q.target_margin_pct, 0) / (quotations.length || 1))}
          </div>
          <div className="text-xs text-slate-500 mt-1">Contract gross profitability</div>
        </div>
      </div>

      {/* Main Split Layout: Left List, Right Quotation Detail & BOQ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Quotations List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Quotation Registry ({filteredQuotations.length})
              </h3>
              <button
                onClick={() => setShowNewQuoModal(true)}
                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New RFQ
              </button>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quotation #, project, client..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { key: 'All', label: 'All', count: quotations.length },
                  { key: 'Won / PO Received', label: 'Won & PO', count: quotations.filter(q => q.status === 'Won / PO Received').length },
                  { key: 'Submitted to Client', label: 'Submitted', count: quotations.filter(q => q.status === 'Submitted to Client').length },
                  { key: 'Internal Review', label: 'Review', count: quotations.filter(q => q.status === 'Internal Review').length },
                  { key: 'Draft', label: 'Draft', count: quotations.filter(q => q.status === 'Draft').length },
                ].map(st => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-2 py-1 whitespace-nowrap rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      statusFilter === st.key 
                        ? 'bg-indigo-600 text-white shadow-2xs font-semibold' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${
                      statusFilter === st.key ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredQuotations.map(quo => {
                const cust = customers.find(c => c.customer_id === quo.customer_id);
                const isSelected = quo.quotation_id === selectedQuotationId;

                return (
                  <div
                    key={quo.quotation_id}
                    onClick={() => setSelectedQuotationId(quo.quotation_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                        {quo.quotation_number}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(quo.status)}`}>
                        {quo.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                      {cust?.company_name || 'Direct Client'}
                    </div>

                    <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                      {quo.project_name}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">TOTAL (INC. PPN)</span>
                        <span className="font-mono font-bold text-slate-900">{formatIDR(quo.total_amount_idr)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">TARGET MARGIN</span>
                        <span className="font-mono font-bold text-emerald-600">{formatPercent(quo.target_margin_pct)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Quotation Header, BOQ Lines, & Commercial Terms */}
        <div className="lg:col-span-8 space-y-4">
          {activeQuotation ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header Zone */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/60">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {activeQuotation.quotation_number}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">Date: {formatDate(activeQuotation.quotation_date)}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">Valid Until: {formatDate(activeQuotation.valid_until)}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      {activeCustomer?.company_name || 'Client Project'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                      {activeQuotation.project_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {/* Status Dropdown */}
                    <select
                      value={activeQuotation.status}
                      onChange={e => handleStatusChange(e.target.value as QuotationStatus)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadgeClass(activeQuotation.status)}`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Internal Review">Internal Review</option>
                      <option value="Submitted to Client">Submitted to Client</option>
                      <option value="Won / PO Received">Won / PO Received</option>
                      <option value="Revision Requested">Revision Requested</option>
                      <option value="Lost">Lost</option>
                    </select>

                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      Print Official Proposal
                    </button>
                  </div>
                </div>

                {/* Sub-Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => onOpenCostCalculator(activeQuotation.quotation_id)}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Open Bottom-Up Cost Sheet (HPP)
                  </button>

                  <button
                    onClick={() => onOpenMilestones(activeQuotation.quotation_id)}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Project Milestones & Termin Billing (5 Stages)
                  </button>

                  <div className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                    <span className="font-medium text-slate-700">Created by:</span>
                    <span>{activeQuotation.created_by}</span>
                  </div>
                </div>
              </div>

              {/* Bill of Quantities (BOQ) Table */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Bill of Quantities (BOQ) & Itemized Quotation Lines ({activeLineItems.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Standardized materials linked from Vendor Material & Fire Suppression Libraries.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item from Catalog
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5">Item & Specification</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5 text-center">Qty / UOM</th>
                        <th className="px-3 py-2.5 text-right">Unit HPP (Cost)</th>
                        <th className="px-3 py-2.5 text-center">Markup</th>
                        <th className="px-3 py-2.5 text-right">Unit Price</th>
                        <th className="px-3 py-2.5 text-right">Total Price (IDR)</th>
                        <th className="px-3 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeLineItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center bg-slate-50/50">
                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <div className="font-semibold text-slate-800 text-xs">
                              No BOQ line items registered for {activeQuotation.quotation_id}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                              This quotation does not currently have bill of quantity lines in local storage.
                            </p>
                            {defaultSeedLinesForActive.length > 0 && (
                              <button
                                onClick={handleRestoreDefaultSeedBoQ}
                                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs inline-flex items-center gap-1.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Load Standard Engineering BOQ ({defaultSeedLinesForActive.length} items)
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        activeLineItems.map(item => (
                          <tr key={item.item_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-3">
                              <div className="font-mono text-[11px] font-bold text-indigo-700">
                                {item.item_code}
                              </div>
                              <div className="text-xs text-slate-800 font-medium mt-0.5 line-clamp-2">
                                {item.description}
                              </div>
                              {item.material_id && (
                                <span className="text-[10px] font-mono text-sky-600">
                                  ↳ Catalog: {item.material_id}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-mono">
                              <span className="font-bold text-slate-900">{item.quantity}</span> {item.uom}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-slate-600">
                              {formatIDR(item.unit_hpp_idr)}
                            </td>
                            <td className="px-3 py-3 text-center font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                +{item.markup_pct}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-semibold text-slate-800">
                              {formatIDR(item.unit_price_idr)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                              {formatIDR(item.total_price_idr)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => onDeleteLineItem(item.item_id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Footer Box */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Commercial Payment & Delivery Terms
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600 text-xs">
                      {activeQuotation.payment_terms_desc}
                    </div>
                    <div className="text-slate-500">
                      <span className="font-medium text-slate-700">Committed Timeline:</span> {activeQuotation.delivery_timeline}
                    </div>
                  </div>

                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Total Bottom-Up Cost (HPP):</span>
                      <span className="font-mono font-semibold">{formatIDR(calculatedTotals.totalHpp)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Subtotal Selling Price:</span>
                      <span className="font-mono font-semibold">{formatIDR(calculatedTotals.totalSell)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-emerald-700 font-medium">
                      <span>Gross Profit Contribution:</span>
                      <span className="font-mono font-bold">{formatIDR(calculatedTotals.grossProfit)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-emerald-700 font-medium">
                      <span>Target Gross Margin:</span>
                      <span className="font-mono font-bold">{formatPercent(calculatedTotals.marginPct)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <span>PPN (11% Value-Added Tax):</span>
                      <span className="font-mono">{formatIDR(calculatedTotals.ppn)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>FINAL QUOTATION TOTAL:</span>
                      <span className="font-mono text-indigo-700">{formatIDR(calculatedTotals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select or create a quotation to inspect line items.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add Item to BOQ from Catalog or Custom */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Add Item to Bill of Quantities (BOQ)
              </h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select from Vendor Catalog & Fire Suppression Library
                </label>
                <select
                  value={selectedCatalogMatId}
                  onChange={e => setSelectedCatalogMatId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Standard Material SKU or Enter Custom Below --</option>
                  {vendorMaterials.map(mat => (
                    <option key={mat.material_id} value={mat.material_id}>
                      [{mat.brand}] {mat.item_name} - {formatIDR(mat.standard_price_idr)} / {mat.uom}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCatalogMatId && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700">Or Custom Line Item / Installation Service:</div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule 40 Seamless Pipe Erection & Certified Welder 6G"
                      value={customItemDesc}
                      onChange={e => setCustomItemDesc(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Category</label>
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value as LineItemCategory)}
                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                      >
                        <option value="Fire Suppression Equipment">Fire Suppression</option>
                        <option value="Gas Detection Systems">Gas Detection</option>
                        <option value="Piping, Valves & Fittings">Piping & Valves</option>
                        <option value="Electrical, Detection & Controls">Electrical/Panel</option>
                        <option value="Installation, Commissioning & Testing">Installation/BAST</option>
                        <option value="Consumables & Logistics">Consumables/Freight</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Base HPP (IDR)</label>
                      <input
                        type="number"
                        placeholder="Cost"
                        value={customHpp || ''}
                        onChange={e => setCustomHpp(Number(e.target.value))}
                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">UOM</label>
                      <input
                        type="text"
                        value={customUom}
                        onChange={e => setCustomUom(e.target.value)}
                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={e => setNewItemQty(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Markup Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={newItemMarkup}
                    onChange={e => setNewItemMarkup(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCatalogItem}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
              >
                Insert Item into BOQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Official Engineering Proposal Print Layout */}
      {showPrintModal && activeQuotation && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
              <div className="text-xs text-slate-500">Official STMJ Commercial Quotation View</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  PT SARANA TEKNIK MANDIRI JAYA (STMJ)
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Specialist Fire Protection, Clean Agent Extinguishing Systems, Gas Detection & Mechanical Contracting
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jl. Boulevard Raya Blok PA 12 No. 8, Kelapa Gading, Jakarta Utara | Tel: +62 21 4585 9900 | info@stmj.co.id
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-indigo-700 font-mono text-base">COMMERCIAL QUOTATION</div>
                <div className="text-xs text-slate-700 font-mono mt-1 font-semibold">{activeQuotation.quotation_number}</div>
                <div className="text-xs text-slate-500 mt-0.5">Date: {formatDate(activeQuotation.quotation_date)}</div>
              </div>
            </div>

            {/* Client Info Block */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">To Client:</span>
                <div className="font-bold text-slate-900 text-sm">{activeCustomer.company_name}</div>
                <div className="text-slate-600 mt-0.5">Attn: {activeCustomer.contact_person}</div>
                <div className="text-slate-600">{activeCustomer.address}</div>
                <div className="text-slate-600 mt-0.5">NPWP: {activeCustomer.npwp_tax_id}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Project Specification:</span>
                <div className="font-semibold text-slate-900">{activeQuotation.project_name}</div>
                <div className="text-slate-600 mt-1">Validity: 30 Days (Until {formatDate(activeQuotation.valid_until)})</div>
                <div className="text-slate-600">Delivery Lead Time: {activeQuotation.delivery_timeline}</div>
              </div>
            </div>

            {/* BOQ Table in Print Document */}
            <div>
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                  <tr>
                    <th className="p-2 border border-slate-300 w-10 text-center">No.</th>
                    <th className="p-2 border border-slate-300">Description of Work & Material Spec</th>
                    <th className="p-2 border border-slate-300 text-center w-24">Qty / UOM</th>
                    <th className="p-2 border border-slate-300 text-right w-36">Unit Price (IDR)</th>
                    <th className="p-2 border border-slate-300 text-right w-40">Total Amount (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLineItems.map((li, idx) => (
                    <tr key={li.item_id}>
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-slate-900">{li.item_code}</div>
                        <div className="text-slate-700">{li.description}</div>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-semibold">
                        {li.quantity} {li.uom}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono">
                        {formatIDR(li.unit_price_idr)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                        {formatIDR(li.total_price_idr)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className="p-2 border border-slate-300 text-right font-bold text-slate-700">
                      SUBTOTAL (BEFORE TAX):
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                      {formatIDR(calculatedTotals.totalSell)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-2 border border-slate-300 text-right font-semibold text-slate-700">
                      PPN 11% (VALUE ADDED TAX):
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      {formatIDR(calculatedTotals.ppn)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="p-2.5 border border-slate-300 text-right font-extrabold text-slate-900">
                      GRAND TOTAL (IDR):
                    </td>
                    <td className="p-2.5 border border-slate-300 text-right font-mono font-extrabold text-indigo-900 text-sm">
                      {formatIDR(calculatedTotals.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Terms & Payment Conditions */}
            <div className="text-xs space-y-2 text-slate-700 border-t border-slate-200 pt-3">
              <div className="font-bold text-slate-900">Commercial Terms & Conditions:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Prices quoted in Indonesian Rupiah (IDR) and subject to 11% PPN.</li>
                <li>{activeQuotation.payment_terms_desc}</li>
                <li>Warranty: 12 months from handover/BAST against manufacturing and installation defects.</li>
                <li>Clean agent containers are UL listed and FM approved with mill test certificates provided upon dispatch.</li>
              </ul>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
              <div>
                <p className="text-slate-500 mb-16">Prepared By:</p>
                <div className="font-bold text-slate-900 underline">{activeQuotation.created_by}</div>
                <div className="text-[11px] text-slate-500">PT Sarana Teknik Mandiri Jaya</div>
              </div>

              <div>
                <p className="text-slate-500 mb-16">Approved By & Client Acceptance:</p>
                <div className="font-bold text-slate-900 underline">
                  {activeQuotation.approved_by || 'Ir. Taufik Hidayat (Technical Director)'}
                </div>
                <div className="text-[11px] text-slate-500">Sign & Company Stamp</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
