import React, { useState, useMemo } from 'react';
import {
  Truck,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  Edit3,
  CheckSquare,
  Square,
  Layers,
  FileText,
  Warehouse,
  MapPin,
  Wrench,
  ShieldCheck,
  DollarSign,
  ChevronRight,
  Package,
  Calendar,
  X,
  RefreshCw,
  Sliders,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Info,
  Award
} from 'lucide-react';
import {
  Quotation,
  Customer,
  QuotationLineItem,
  Vendor,
  VendorPoStatus,
  LogisticsDeliveryStage
} from '../types/stmjDatabase';
import { formatIDR, formatDate } from '../utils/stmjFormatters';

interface ProcurementTrackerProps {
  quotations: Quotation[];
  customers: Customer[];
  lineItems: QuotationLineItem[];
  vendors?: Vendor[];
  onUpdateLineItem: (item: QuotationLineItem) => void;
  onNavigateToQuotation?: (quotationId: string) => void;
  onNavigateToExecution?: (quotationId: string) => void;
  onNavigateToVendorPerformance?: () => void;
}

type DeliveryStatusFilter =
  | 'all'
  | 'needs_po'
  | 'po_issued'
  | 'delivered_office'
  | 'arrived_site'
  | 'ready_installation'
  | 'installed';

export const ProcurementTracker: React.FC<ProcurementTrackerProps> = ({
  quotations,
  customers,
  lineItems,
  vendors = [],
  onUpdateLineItem,
  onNavigateToQuotation,
  onNavigateToExecution,
  onNavigateToVendorPerformance,
}) => {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('all');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatusFilter>('all');
  const [sortField, setSortField] = useState<'item_code' | 'quotation_id' | 'vendor' | 'po_status' | 'lead_time'>('quotation_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Batch selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<QuotationLineItem | null>(null);

  // Fast lookup maps
  const quotationMap = useMemo(() => {
    const map = new Map<string, Quotation>();
    quotations.forEach(q => map.set(q.quotation_id, q));
    return map;
  }, [quotations]);

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach(c => map.set(c.customer_id, c));
    return map;
  }, [customers]);

  // Enriched line items with project & customer metadata
  const allEnrichedItems = useMemo(() => {
    return lineItems.map(item => {
      const quotation = quotationMap.get(item.quotation_id);
      const customer = quotation ? customerMap.get(quotation.customer_id) : undefined;
      return {
        ...item,
        quotationNumber: quotation?.quotation_number || item.quotation_id,
        projectName: quotation?.project_name || 'Project Reference',
        quotationStatus: quotation?.status || 'Active',
        clientName: customer?.company_name || 'Client',
      };
    });
  }, [lineItems, quotationMap, customerMap]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    const total = allEnrichedItems.length;
    const poIssued = allEnrichedItems.filter(i => 
      Boolean(i.vendor_po_number) || 
      (i.po_status && i.po_status !== 'Pending RFQ')
    ).length;
    const deliveredOffice = allEnrichedItems.filter(i => i.delivered_to_stmj_office).length;
    const arrivedSite = allEnrichedItems.filter(i => i.arrived_at_site).length;
    const readyInstall = allEnrichedItems.filter(i => i.ready_for_installation).length;
    const fullyInstalled = allEnrichedItems.filter(i => i.installation_status === 'Installed').length;

    const totalCommittedHpp = allEnrichedItems.reduce((acc, i) => acc + (i.total_hpp_idr || 0), 0);
    const totalPoIssuedHpp = allEnrichedItems
      .filter(i => Boolean(i.vendor_po_number))
      .reduce((acc, i) => acc + (i.total_hpp_idr || 0), 0);

    return {
      total,
      poIssued,
      poIssuedPct: total > 0 ? (poIssued / total) * 100 : 0,
      deliveredOffice,
      deliveredOfficePct: total > 0 ? (deliveredOffice / total) * 100 : 0,
      arrivedSite,
      arrivedSitePct: total > 0 ? (arrivedSite / total) * 100 : 0,
      readyInstall,
      readyInstallPct: total > 0 ? (readyInstall / total) * 100 : 0,
      fullyInstalled,
      fullyInstalledPct: total > 0 ? (fullyInstalled / total) * 100 : 0,
      totalCommittedHpp,
      totalPoIssuedHpp,
    };
  }, [allEnrichedItems]);

  // Distinct lists for filter dropdowns
  const uniqueVendors = useMemo(() => {
    const set = new Set<string>();
    allEnrichedItems.forEach(i => {
      if (i.vendor_name) set.add(i.vendor_name);
    });
    return Array.from(set).sort();
  }, [allEnrichedItems]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    allEnrichedItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [allEnrichedItems]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return allEnrichedItems.filter(item => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.item_code.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchPo = (item.vendor_po_number || '').toLowerCase().includes(q);
        const matchVendor = (item.vendor_name || '').toLowerCase().includes(q);
        const matchProject = item.projectName.toLowerCase().includes(q);
        const matchClient = item.clientName.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchPo && !matchVendor && !matchProject && !matchClient) {
          return false;
        }
      }

      // 2. Quotation Filter
      if (selectedQuotationId !== 'all' && item.quotation_id !== selectedQuotationId) {
        return false;
      }

      // 3. Vendor Filter
      if (selectedVendorFilter !== 'all' && item.vendor_name !== selectedVendorFilter) {
        return false;
      }

      // 4. Category Filter
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }

      // 5. Status Tabs Filter
      if (statusFilter === 'needs_po') {
        return !item.vendor_po_number || item.po_status === 'Pending RFQ';
      }
      if (statusFilter === 'po_issued') {
        return Boolean(item.vendor_po_number) && item.po_status !== 'Pending RFQ';
      }
      if (statusFilter === 'delivered_office') {
        return Boolean(item.delivered_to_stmj_office);
      }
      if (statusFilter === 'arrived_site') {
        return Boolean(item.arrived_at_site);
      }
      if (statusFilter === 'ready_installation') {
        return Boolean(item.ready_for_installation);
      }
      if (statusFilter === 'installed') {
        return item.installation_status === 'Installed';
      }

      return true;
    }).sort((a, b) => {
      let valA: string = '';
      let valB: string = '';
      if (sortField === 'item_code') {
        valA = a.item_code;
        valB = b.item_code;
      } else if (sortField === 'quotation_id') {
        valA = a.quotation_id;
        valB = b.quotation_id;
      } else if (sortField === 'vendor') {
        valA = a.vendor_name || '';
        valB = b.vendor_name || '';
      } else if (sortField === 'po_status') {
        valA = a.po_status || '';
        valB = b.po_status || '';
      } else if (sortField === 'lead_time') {
        valA = a.lead_time_desc || '';
        valB = b.lead_time_desc || '';
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [allEnrichedItems, searchQuery, selectedQuotationId, selectedVendorFilter, selectedCategoryFilter, statusFilter, sortField, sortOrder]);

  // Batch Selection Handlers
  const handleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map(i => i.item_id));
    }
  };

  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Quick 1-Click Interactive Toggles
  const handleToggleDeliveryToOffice = (item: QuotationLineItem) => {
    const nextVal = !item.delivered_to_stmj_office;
    const nowStr = new Date().toISOString().split('T')[0];
    const updated: QuotationLineItem = {
      ...item,
      delivered_to_stmj_office: nextVal,
      delivered_to_stmj_date: nextVal ? (item.delivered_to_stmj_date || nowStr) : undefined,
      logistics_stage: nextVal 
        ? 'Stage 2: Delivered to STMJ Office' 
        : (item.po_status === 'PO Issued' ? 'Stage 1: PO Issued & Paid' : item.logistics_stage),
      po_status: nextVal && (!item.po_status || item.po_status === 'Pending RFQ' || item.po_status === 'PO Issued' || item.po_status === 'Vendor In Production' || item.po_status === 'Shipped by Vendor')
        ? 'Delivered to STMJ Office' 
        : item.po_status
    };
    onUpdateLineItem(updated);
  };

  const handleToggleArrivalAtSite = (item: QuotationLineItem) => {
    const nextVal = !item.arrived_at_site;
    const nowStr = new Date().toISOString().split('T')[0];
    const updated: QuotationLineItem = {
      ...item,
      arrived_at_site: nextVal,
      arrived_at_site_date: nextVal ? (item.arrived_at_site_date || nowStr) : undefined,
      sent_to_client_site: nextVal ? true : item.sent_to_client_site,
      sent_to_site_date: nextVal ? (item.sent_to_site_date || nowStr) : item.sent_to_site_date,
      delivered_to_stmj_office: nextVal ? true : item.delivered_to_stmj_office,
      logistics_stage: nextVal 
        ? 'Stage 4: Arrived at Site' 
        : (item.delivered_to_stmj_office ? 'Stage 2: Delivered to STMJ Office' : item.logistics_stage),
      po_status: nextVal ? 'Arrived at Site & Inspected' : item.po_status,
    };
    onUpdateLineItem(updated);
  };

  const handleToggleReadyForInstallation = (item: QuotationLineItem) => {
    const nextVal = !item.ready_for_installation;
    const updated: QuotationLineItem = {
      ...item,
      ready_for_installation: nextVal,
      arrived_at_site: nextVal ? true : item.arrived_at_site,
      logistics_stage: nextVal ? 'Stage 5: Ready for Installation' : item.logistics_stage,
      po_status: nextVal ? 'Ready for Installation' : item.po_status,
      installation_status: nextVal && item.installation_status === 'Pending' ? 'In Progress' : item.installation_status
    };
    onUpdateLineItem(updated);
  };

  // Quick 1-Click Advance Stepper
  const handleQuickAdvanceStage = (item: QuotationLineItem) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let updated: QuotationLineItem = { ...item };

    if (!item.vendor_po_number) {
      // Step 1: Assign PO Number
      updated.vendor_po_number = `PO/STMJ/VND/2026/09/${Math.floor(100 + Math.random() * 900)}`;
      updated.po_issued_date = nowStr;
      updated.po_status = 'PO Issued';
      updated.logistics_stage = 'Stage 1: PO Issued & Paid';
    } else if (!item.delivered_to_stmj_office) {
      // Step 2: Delivered to Office
      updated.delivered_to_stmj_office = true;
      updated.delivered_to_stmj_date = nowStr;
      updated.po_status = 'Delivered to STMJ Office';
      updated.logistics_stage = 'Stage 2: Delivered to STMJ Office';
    } else if (!item.sent_to_client_site) {
      // Step 3: Sent to Site
      updated.sent_to_client_site = true;
      updated.sent_to_site_date = nowStr;
      updated.po_status = 'Sent to Client Site';
      updated.logistics_stage = 'Stage 3: Dispatched to Client Site';
    } else if (!item.arrived_at_site) {
      // Step 4: Arrived at Site
      updated.arrived_at_site = true;
      updated.arrived_at_site_date = nowStr;
      updated.po_status = 'Arrived at Site & Inspected';
      updated.logistics_stage = 'Stage 4: Arrived at Site';
    } else if (!item.ready_for_installation) {
      // Step 5: Ready for Installation
      updated.ready_for_installation = true;
      updated.po_status = 'Ready for Installation';
      updated.logistics_stage = 'Stage 5: Ready for Installation';
      updated.installation_status = 'In Progress';
    } else if (item.installation_status !== 'Installed') {
      // Step 6: Fully Installed
      updated.installation_status = 'Installed';
      updated.po_status = 'Installed & Connected';
    }

    onUpdateLineItem(updated);
  };

  // Batch Actions
  const handleBatchMarkDeliveredOffice = () => {
    const nowStr = new Date().toISOString().split('T')[0];
    selectedItemIds.forEach(id => {
      const item = lineItems.find(i => i.item_id === id);
      if (item) {
        onUpdateLineItem({
          ...item,
          delivered_to_stmj_office: true,
          delivered_to_stmj_date: item.delivered_to_stmj_date || nowStr,
          logistics_stage: 'Stage 2: Delivered to STMJ Office',
          po_status: item.po_status === 'Pending RFQ' || !item.po_status ? 'Delivered to STMJ Office' : item.po_status
        });
      }
    });
    setSelectedItemIds([]);
  };

  const handleBatchMarkArrivedSite = () => {
    const nowStr = new Date().toISOString().split('T')[0];
    selectedItemIds.forEach(id => {
      const item = lineItems.find(i => i.item_id === id);
      if (item) {
        onUpdateLineItem({
          ...item,
          delivered_to_stmj_office: true,
          sent_to_client_site: true,
          arrived_at_site: true,
          arrived_at_site_date: item.arrived_at_site_date || nowStr,
          logistics_stage: 'Stage 4: Arrived at Site',
          po_status: 'Arrived at Site & Inspected'
        });
      }
    });
    setSelectedItemIds([]);
  };

  const handleBatchMarkReadyInstallation = () => {
    selectedItemIds.forEach(id => {
      const item = lineItems.find(i => i.item_id === id);
      if (item) {
        onUpdateLineItem({
          ...item,
          delivered_to_stmj_office: true,
          sent_to_client_site: true,
          arrived_at_site: true,
          ready_for_installation: true,
          logistics_stage: 'Stage 5: Ready for Installation',
          po_status: 'Ready for Installation',
          installation_status: item.installation_status === 'Pending' ? 'In Progress' : item.installation_status
        });
      }
    });
    setSelectedItemIds([]);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Item ID',
      'Item Code',
      'Description',
      'Category',
      'Quotation ID',
      'Project Name',
      'Client',
      'Qty',
      'UoM',
      'Vendor PO Number',
      'Vendor Name',
      'PO Status',
      'Payment Status',
      'Lead Time',
      'Expected Arrival',
      'Delivered to STMJ Office',
      'Delivered Date',
      'Sent to Site',
      'Arrived at Site',
      'Arrived Date',
      'Ready for Installation',
      'Installation Status',
      'Unit HPP IDR',
      'Total HPP IDR'
    ];

    const rows = filteredItems.map(i => [
      `"${i.item_id}"`,
      `"${i.item_code}"`,
      `"${(i.description || '').replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.quotation_id}"`,
      `"${(i.projectName || '').replace(/"/g, '""')}"`,
      `"${(i.clientName || '').replace(/"/g, '""')}"`,
      i.quantity,
      `"${i.uom}"`,
      `"${i.vendor_po_number || ''}"`,
      `"${(i.vendor_name || '').replace(/"/g, '""')}"`,
      `"${i.po_status || ''}"`,
      `"${i.vendor_payment_status || 'Unpaid'}"`,
      `"${i.lead_time_desc || ''}"`,
      `"${i.expected_arrival_date || ''}"`,
      i.delivered_to_stmj_office ? 'YES' : 'NO',
      `"${i.delivered_to_stmj_date || ''}"`,
      i.sent_to_client_site ? 'YES' : 'NO',
      i.arrived_at_site ? 'YES' : 'NO',
      `"${i.arrived_at_site_date || ''}"`,
      i.ready_for_installation ? 'YES' : 'NO',
      `"${i.installation_status || 'Pending'}"`,
      i.unit_hpp_idr,
      i.total_hpp_idr
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `STMJ_Procurement_BOQ_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Procurement Tracker
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  All BOQ Items
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Centralized master control for Vendor Purchase Orders (PO), delivery to STMJ office, transit to client site, and readiness for installation across all active projects.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToVendorPerformance && (
              <button
                onClick={onNavigateToVendorPerformance}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors shadow-2xs"
                title="View Vendor Performance, Delivery Timelines & Satisfaction Scores"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Vendor Performance</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
              title="Export all filtered BOQ line items to CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          {/* Card 1: Total BOQ Items */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Total BOQ Items</span>
              <Package className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {metrics.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {formatIDR(metrics.totalCommittedHpp)} HPP
            </div>
          </div>

          {/* Card 2: Vendor POs Issued */}
          <div className="bg-blue-50/70 rounded-lg p-3 border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center justify-between">
              <span>Vendor PO Issued</span>
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1 font-mono">
              {metrics.poIssued} <span className="text-xs font-normal text-blue-600">/ {metrics.total}</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5 font-medium">
              {metrics.poIssuedPct.toFixed(0)}% PO Issued
            </div>
          </div>

          {/* Card 3: Delivered to STMJ Office */}
          <div className="bg-amber-50/70 rounded-lg p-3 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center justify-between">
              <span>Delivered to Office</span>
              <Warehouse className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1 font-mono">
              {metrics.deliveredOffice} <span className="text-xs font-normal text-amber-600">/ {metrics.total}</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
              {metrics.deliveredOfficePct.toFixed(0)}% Received
            </div>
          </div>

          {/* Card 4: Arrived at Site */}
          <div className="bg-indigo-50/70 rounded-lg p-3 border border-indigo-200">
            <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
              <span>Arrived at Site</span>
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-900 mt-1 font-mono">
              {metrics.arrivedSite} <span className="text-xs font-normal text-indigo-600">/ {metrics.total}</span>
            </div>
            <div className="text-[11px] text-indigo-700 mt-0.5 font-medium">
              {metrics.arrivedSitePct.toFixed(0)}% On-Site
            </div>
          </div>

          {/* Card 5: Ready for Installation */}
          <div className="bg-emerald-50/70 rounded-lg p-3 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
              <span>Ready for Install</span>
              <Wrench className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-900 mt-1 font-mono">
              {metrics.readyInstall} <span className="text-xs font-normal text-emerald-600">/ {metrics.total}</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
              {metrics.readyInstallPct.toFixed(0)}% Site Ready
            </div>
          </div>

          {/* Card 6: Fully Installed */}
          <div className="bg-teal-50/70 rounded-lg p-3 border border-teal-200">
            <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider flex items-center justify-between">
              <span>Installed (BAST)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <div className="text-2xl font-bold text-teal-900 mt-1 font-mono">
              {metrics.fullyInstalled} <span className="text-xs font-normal text-teal-600">/ {metrics.total}</span>
            </div>
            <div className="text-[11px] text-teal-700 mt-0.5 font-medium">
              {metrics.fullyInstalledPct.toFixed(0)}% Completed
            </div>
          </div>
        </div>

        {/* Funnel Progress Visualizer */}
        <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span>Overall Procurement & Site Deployment Funnel</span>
            <span>
              {metrics.readyInstall} of {metrics.total} Items Ready for Tech Team ({metrics.readyInstallPct.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${metrics.fullyInstalledPct}%` }} 
              className="bg-teal-500 h-full transition-all duration-300" 
              title={`Installed: ${metrics.fullyInstalled} items`}
            />
            <div 
              style={{ width: `${Math.max(0, metrics.readyInstallPct - metrics.fullyInstalledPct)}%` }} 
              className="bg-emerald-500 h-full transition-all duration-300" 
              title={`Ready for Installation: ${metrics.readyInstall} items`}
            />
            <div 
              style={{ width: `${Math.max(0, metrics.arrivedSitePct - metrics.readyInstallPct)}%` }} 
              className="bg-indigo-500 h-full transition-all duration-300" 
              title={`Arrived at Site: ${metrics.arrivedSite} items`}
            />
            <div 
              style={{ width: `${Math.max(0, metrics.deliveredOfficePct - metrics.arrivedSitePct)}%` }} 
              className="bg-amber-400 h-full transition-all duration-300" 
              title={`At STMJ Office: ${metrics.deliveredOffice} items`}
            />
            <div 
              style={{ width: `${Math.max(0, metrics.poIssuedPct - metrics.deliveredOfficePct)}%` }} 
              className="bg-blue-400 h-full transition-all duration-300" 
              title={`PO Issued / In Production: ${metrics.poIssued} items`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-blue-400 inline-block"></span> PO Issued ({metrics.poIssued})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block"></span> Office Received ({metrics.deliveredOffice})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block"></span> Arrived Site ({metrics.arrivedSite})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span> Ready for Install ({metrics.readyInstall})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-teal-500 inline-block"></span> Installed ({metrics.fullyInstalled})</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Action Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Items ({allEnrichedItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('needs_po')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'needs_po'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <span>Needs PO Issuance</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {allEnrichedItems.filter(i => !i.vendor_po_number || i.po_status === 'Pending RFQ').length}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('po_issued')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'po_issued'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <span>PO Issued & In Production</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {metrics.poIssued}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('delivered_office')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'delivered_office'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <span>Delivered to Office</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {metrics.deliveredOffice}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('arrived_site')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'arrived_site'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
            }`}
          >
            <span>Arrived at Site</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {metrics.arrivedSite}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('ready_installation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'ready_installation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <span>Ready for Installation</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {metrics.readyInstall}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('installed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'installed'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
            }`}
          >
            <span>Installed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {metrics.fullyInstalled}
            </span>
          </button>
        </div>

        {/* Search & Multi-select Dropdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Search box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, desc, PO#, vendor, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project / Quotation Select */}
          <div>
            <select
              value={selectedQuotationId}
              onChange={(e) => setSelectedQuotationId(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
            >
              <option value="all">All Projects & Quotations ({quotations.length})</option>
              {quotations.map(q => (
                <option key={q.quotation_id} value={q.quotation_id}>
                  {q.quotation_number} — {q.project_name.slice(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Select */}
          <div>
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            >
              <option value="all">All Vendors ({uniqueVendors.length})</option>
              {uniqueVendors.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            >
              <option value="all">All Categories ({uniqueCategories.length})</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Action Bar (if any rows selected) */}
        {selectedItemIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-900">
                {selectedItemIds.length} item(s) selected
              </span>
              <button
                onClick={() => setSelectedItemIds([])}
                className="text-indigo-600 hover:text-indigo-800 underline font-medium ml-1"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500">Batch update to:</span>
              <button
                onClick={handleBatchMarkDeliveredOffice}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors shadow-xs"
              >
                <Warehouse className="w-3.5 h-3.5" />
                Delivered to Office
              </button>
              <button
                onClick={handleBatchMarkArrivedSite}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                Arrived at Site
              </button>
              <button
                onClick={handleBatchMarkReadyInstallation}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                Ready for Installation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main BOQ Items Table with Required Columns */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>All BOQ Items Procurement & Logistics Registry</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-200 text-slate-700">
                Showing {filteredItems.length} of {allEnrichedItems.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click checkboxes or toggle buttons to update status in real time. Click 'Edit' or 'Advance ➔' to progress logistics.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="py-1 px-2 text-xs border border-slate-300 rounded-md bg-white text-slate-700"
            >
              <option value="quotation_id">Project / RFQ</option>
              <option value="item_code">Item Code</option>
              <option value="vendor">Vendor</option>
              <option value="po_status">PO Status</option>
              <option value="lead_time">Lead Time</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 border border-slate-300 rounded-md bg-white hover:bg-slate-100 text-slate-600"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedItemIds.length === filteredItems.length}
                    onChange={handleSelectAll}
                    className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    title="Select all filtered items"
                  />
                </th>
                <th className="py-3 px-3 min-w-[200px]">Item & Specification</th>
                <th className="py-3 px-3 min-w-[160px]">Project & Client</th>
                <th className="py-3 px-3 min-w-[150px] bg-blue-50/40 text-blue-900 border-x border-blue-100">
                  PO Number
                </th>
                <th className="py-3 px-3 min-w-[160px] bg-slate-50">
                  Vendor
                </th>
                <th className="py-3 px-3 min-w-[140px] text-center bg-amber-50/40 text-amber-900 border-x border-amber-100">
                  Delivery to Office
                </th>
                <th className="py-3 px-3 min-w-[140px] text-center bg-indigo-50/40 text-indigo-900 border-x border-indigo-100">
                  Arrival at Site
                </th>
                <th className="py-3 px-3 min-w-[150px] text-center bg-emerald-50/40 text-emerald-900 border-r border-emerald-100">
                  Ready for Installation
                </th>
                <th className="py-3 px-3 min-w-[130px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No BOQ items match your search or filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or clearing your search query.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedQuotationId('all');
                        setSelectedVendorFilter('all');
                        setSelectedCategoryFilter('all');
                        setStatusFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = selectedItemIds.includes(item.item_id);
                  const hasPo = Boolean(item.vendor_po_number);

                  return (
                    <tr 
                      key={item.item_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.item_id)}
                          className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* 1. Item & Specification */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-200">
                            {item.item_code}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-600">
                            {item.category.split(',')[0]}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2" title={item.description}>
                          {item.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span>Qty: <strong>{item.quantity}</strong> {item.uom}</span>
                          <span>•</span>
                          <span>HPP: {formatIDR(item.total_hpp_idr)}</span>
                        </div>
                      </td>

                      {/* 2. Project & Client */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-xs border border-indigo-200">
                            {item.quotationNumber}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 font-medium">
                            {item.quotationStatus.split('/')[0]}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-800 mt-1 truncate max-w-[200px]" title={item.projectName}>
                          {item.projectName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.clientName}</span>
                        </div>
                      </td>

                      {/* 3. PO NUMBER (REQUIRED COLUMN) */}
                      <td className="py-3 px-3 bg-blue-50/20 border-x border-blue-100">
                        {hasPo ? (
                          <div className="space-y-1">
                            <div className="font-mono font-bold text-xs text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200 inline-block">
                              {item.vendor_po_number}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium rounded-xs bg-blue-50 text-blue-700 border border-blue-200">
                                {item.po_status || 'PO Issued'}
                              </span>
                              {item.po_issued_date && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {formatDate(item.po_issued_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                              <AlertCircle className="w-3 h-3" />
                              PO Not Issued
                            </span>
                            <div className="text-[10px] text-slate-400">
                              RFQ Stage / Unordered
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. VENDOR (REQUIRED COLUMN) */}
                      <td className="py-3 px-3 bg-slate-50/40">
                        <div className="text-xs font-bold text-slate-900">
                          {item.vendor_name || 'Vendor Not Assigned'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {/* Payment status badge */}
                          <span className={`px-1.5 py-0.2 rounded-xs text-[10px] font-medium ${
                            item.vendor_payment_status === 'Fully Paid (100%)'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.vendor_payment_status === 'DP Paid (50%)'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {item.vendor_payment_status || 'Unpaid'}
                          </span>

                          {/* Lead time */}
                          {item.lead_time_desc && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              {item.lead_time_desc}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. DELIVERY TO OFFICE STATUS (REQUIRED COLUMN) */}
                      <td className="py-3 px-3 text-center bg-amber-50/20 border-x border-amber-100">
                        {item.delivered_to_stmj_office ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Delivered
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {item.delivered_to_stmj_date ? formatDate(item.delivered_to_stmj_date) : 'At Office'}
                            </div>
                            <button
                              onClick={() => handleToggleDeliveryToOffice(item)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 underline block mx-auto"
                              title="Toggle delivered status"
                            >
                              revert
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              In Transit
                            </span>
                            <button
                              onClick={() => handleToggleDeliveryToOffice(item)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[10px] border border-amber-200 transition-colors mx-auto"
                            >
                              <Warehouse className="w-3 h-3" />
                              Mark Received
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 6. ARRIVAL AT SITE STATUS (REQUIRED COLUMN) */}
                      <td className="py-3 px-3 text-center bg-indigo-50/20 border-x border-indigo-100">
                        {item.arrived_at_site ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 shadow-2xs">
                              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                              On-Site
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {item.arrived_at_site_date ? formatDate(item.arrived_at_site_date) : 'Inspected'}
                            </div>
                            <button
                              onClick={() => handleToggleArrivalAtSite(item)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 underline block mx-auto"
                              title="Toggle site arrival"
                            >
                              revert
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Pending Dispatch
                            </span>
                            <button
                              onClick={() => handleToggleArrivalAtSite(item)}
                              disabled={!item.delivered_to_stmj_office}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors mx-auto ${
                                item.delivered_to_stmj_office
                                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                              title={item.delivered_to_stmj_office ? 'Confirm delivery to client site' : 'Must be delivered to office first'}
                            >
                              <MapPin className="w-3 h-3" />
                              Mark Arrived
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 7. READY FOR INSTALLATION STATUS (REQUIRED COLUMN) */}
                      <td className="py-3 px-3 text-center bg-emerald-50/20 border-r border-emerald-100">
                        {item.ready_for_installation ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs">
                              <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                              Ready to Install
                            </span>
                            <div className="text-[10px] font-medium text-slate-600">
                              {item.installation_status === 'Installed' ? (
                                <span className="text-teal-700 font-bold flex items-center justify-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> Fully Installed
                                </span>
                              ) : (
                                <span className="text-amber-700">Team Mobilizing</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleToggleReadyForInstallation(item)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 underline block mx-auto"
                            >
                              revert
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200">
                              Not Ready
                            </span>
                            <button
                              onClick={() => handleToggleReadyForInstallation(item)}
                              disabled={!item.arrived_at_site}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors mx-auto ${
                                item.arrived_at_site
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                              title={item.arrived_at_site ? 'Mark ready for technical installation team' : 'Item must arrive at site first'}
                            >
                              <Wrench className="w-3 h-3" />
                              Set Ready
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 8. Actions (Advance & Edit) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Advance Stepper Button */}
                          <button
                            onClick={() => handleQuickAdvanceStage(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition-colors shadow-2xs"
                            title="Quick 1-click advance to next logistics stage"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                            title="Edit PO Number, Vendor, Dates, and Lead Time"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Jump to Quotation */}
                          {onNavigateToQuotation && (
                            <button
                              onClick={() => onNavigateToQuotation(item.quotation_id)}
                              className="p-1 rounded-md border border-slate-200 hover:bg-indigo-50 text-indigo-600 transition-colors"
                              title="Open Quotation & BOQ Editor"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {item.logistics_stage || 'Stage 1'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <strong>{filteredItems.length}</strong> BOQ line items across{' '}
            <strong>{new Set(filteredItems.map(i => i.quotation_id)).size}</strong> projects.
          </div>
          <div className="flex items-center gap-3">
            <span>Delivered to Office: <strong>{filteredItems.filter(i => i.delivered_to_stmj_office).length}</strong></span>
            <span>•</span>
            <span>On Site: <strong>{filteredItems.filter(i => i.arrived_at_site).length}</strong></span>
            <span>•</span>
            <span>Ready for Install: <strong>{filteredItems.filter(i => i.ready_for_installation).length}</strong></span>
          </div>
        </div>
      </div>

      {/* Edit Item Procurement Details Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-xs border border-indigo-200">
                  {editingItem.item_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Edit BOQ Item Procurement & Logistics Status
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {editingItem.description}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateLineItem(editingItem);
                setEditingItem(null);
              }}
              className="space-y-4 text-xs"
            >
              {/* Row 1: PO Number & PO Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Vendor Purchase Order (PO) Number
                  </label>
                  <input
                    type="text"
                    value={editingItem.vendor_po_number || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, vendor_po_number: e.target.value })}
                    placeholder="e.g. PO/STMJ/VND/2026/09/032"
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    PO Issued Date
                  </label>
                  <input
                    type="date"
                    value={editingItem.po_issued_date || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, po_issued_date: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Row 2: Vendor Name & Vendor Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Vendor / Fabricator Name
                  </label>
                  <input
                    type="text"
                    value={editingItem.vendor_name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, vendor_name: e.target.value })}
                    placeholder="e.g. PT Hygood Fire Protection Indonesia"
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Vendor Payment Status
                  </label>
                  <select
                    value={editingItem.vendor_payment_status || 'Unpaid'}
                    onChange={(e) => setEditingItem({ ...editingItem, vendor_payment_status: e.target.value as any })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="DP Paid (50%)">DP Paid (50%)</option>
                    <option value="Fully Paid (100%)">Fully Paid (100%)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Lead Time & Expected Arrival Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Vendor Lead Time Description
                  </label>
                  <input
                    type="text"
                    value={editingItem.lead_time_desc || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, lead_time_desc: e.target.value })}
                    placeholder="e.g. 4 - 6 Weeks ex-Singapore"
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Expected Arrival Date
                  </label>
                  <input
                    type="date"
                    value={editingItem.expected_arrival_date || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, expected_arrival_date: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Section 4: Physical Delivery Checkboxes & Dates */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 text-xs">
                  Physical Logistics & Readiness Checkpoints
                </div>

                {/* Checkpoint 1: Delivery to STMJ Office */}
                <div className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.delivered_to_stmj_office)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const now = new Date().toISOString().split('T')[0];
                        setEditingItem({
                          ...editingItem,
                          delivered_to_stmj_office: checked,
                          delivered_to_stmj_date: checked ? (editingItem.delivered_to_stmj_date || now) : undefined,
                        });
                      }}
                      className="rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">Delivered to STMJ Office</div>
                      <div className="text-[11px] text-slate-500">Material received & inspected at STMJ workshop</div>
                    </div>
                  </label>
                  {editingItem.delivered_to_stmj_office && (
                    <input
                      type="date"
                      value={editingItem.delivered_to_stmj_date || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, delivered_to_stmj_date: e.target.value })}
                      className="py-1 px-2 text-xs border border-slate-300 rounded-md bg-slate-50 text-slate-800"
                    />
                  )}
                </div>

                {/* Checkpoint 2: Arrived at Site */}
                <div className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.arrived_at_site)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const now = new Date().toISOString().split('T')[0];
                        setEditingItem({
                          ...editingItem,
                          arrived_at_site: checked,
                          arrived_at_site_date: checked ? (editingItem.arrived_at_site_date || now) : undefined,
                          sent_to_client_site: checked ? true : editingItem.sent_to_client_site,
                          delivered_to_stmj_office: checked ? true : editingItem.delivered_to_stmj_office
                        });
                      }}
                      className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">Arrived at Client Site</div>
                      <div className="text-[11px] text-slate-500">Trucking completed and offloaded at project site</div>
                    </div>
                  </label>
                  {editingItem.arrived_at_site && (
                    <input
                      type="date"
                      value={editingItem.arrived_at_site_date || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, arrived_at_site_date: e.target.value })}
                      className="py-1 px-2 text-xs border border-slate-300 rounded-md bg-slate-50 text-slate-800"
                    />
                  )}
                </div>

                {/* Checkpoint 3: Ready for Installation */}
                <div className="flex items-center justify-between p-2 rounded-md bg-white border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.ready_for_installation)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditingItem({
                          ...editingItem,
                          ready_for_installation: checked,
                          arrived_at_site: checked ? true : editingItem.arrived_at_site,
                        });
                      }}
                      className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-900">Ready for Installation</div>
                      <div className="text-[11px] text-slate-500">Site cleared, permits approved, ready for field technical team</div>
                    </div>
                  </label>
                  <div>
                    <select
                      value={editingItem.installation_status || 'Pending'}
                      onChange={(e) => setEditingItem({ ...editingItem, installation_status: e.target.value as any })}
                      className="py-1 px-2 text-xs border border-slate-300 rounded-md bg-slate-50 text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Installed">Installed & Tested</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Save & Update BOQ Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
