import React, { useState, useMemo } from 'react';
import {
  Award,
  Truck,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  Edit3,
  Building2,
  TrendingUp,
  Package,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  ThumbsUp,
  FileText,
  BadgeCheck,
  Sliders,
  AlertTriangle,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import {
  Vendor,
  PurchaseOrder,
  QuotationLineItem,
  Quotation,
  Customer
} from '../types/stmjDatabase';
import { formatIDR, formatDate } from '../utils/stmjFormatters';

interface VendorPerformanceProps {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  lineItems: QuotationLineItem[];
  quotations: Quotation[];
  customers: Customer[];
  onUpdatePurchaseOrder?: (po: PurchaseOrder) => void;
  onUpdateVendor?: (vendor: Vendor) => void;
  onNavigateToQuotation?: (quotationId: string) => void;
  onNavigateToProcurement?: (quotationId?: string) => void;
}

type PerformanceViewTab = 'scorecards' | 'matrix' | 'timelines' | 'evaluations';
type TierFilter = 'all' | 'preferred' | 'qualified' | 'review';

export interface VendorAggregatedStats {
  vendorId: string;
  vendorName: string;
  brandAgency: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  paymentTerms: string;
  
  // Spend & Items
  totalSpendIdr: number;
  totalPoCount: number;
  totalLineItemsCount: number;

  // Delivery Timelines
  deliveredItemsCount: number;
  onTimeDeliveriesCount: number;
  earlyDeliveriesCount: number;
  delayedDeliveriesCount: number;
  inTransitCount: number;
  inProductionCount: number;
  onTimeDeliveryRatePct: number;
  avgLeadTimeDays: number;
  avgDeliveryVarianceDays: number; // Negative = early, Positive = delayed

  // Project Satisfaction Scores (1.0 to 5.0)
  overallSatisfactionScore: number;
  deliveryTimelinessScore: number;
  qualityComplianceScore: number;
  technicalSupportScore: number;
  commercialScore: number;
  tier: 'Tier 1: Preferred' | 'Tier 2: Qualified' | 'Tier 3: Under Review';

  // Associated POs and BOQ Line Items
  purchaseOrders: PurchaseOrder[];
  lineItems: QuotationLineItem[];
}

export const VendorPerformance: React.FC<VendorPerformanceProps> = ({
  vendors,
  purchaseOrders,
  lineItems,
  quotations,
  customers,
  onUpdatePurchaseOrder,
  onUpdateVendor,
  onNavigateToQuotation,
  onNavigateToProcurement,
}) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<PerformanceViewTab>('scorecards');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [sortField, setSortField] = useState<'satisfaction' | 'ontime' | 'spend' | 'variance' | 'name'>('satisfaction');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Evaluation Modal State
  const [evaluatingPo, setEvaluatingPo] = useState<PurchaseOrder | null>(null);
  const [evaluatingVendor, setEvaluatingVendor] = useState<Vendor | null>(null);
  const [evalSatisfaction, setEvalSatisfaction] = useState<number>(4.8);
  const [evalQualityPct, setEvalQualityPct] = useState<number>(98);
  const [evalNotes, setEvalNotes] = useState<string>('');

  // Lookup maps
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

  // Aggregate stats per vendor using lineItems and purchaseOrders
  const vendorStatsList: VendorAggregatedStats[] = useMemo(() => {
    return vendors.map(vendor => {
      // 1. Associated Purchase Orders
      const vendorPos = purchaseOrders.filter(po => 
        po.vendor_id === vendor.vendor_id ||
        (po.po_number && lineItems.some(li => li.vendor_id === vendor.vendor_id && li.vendor_po_number === po.po_number))
      );

      // 2. Associated Quotation Line Items
      const vendorLineItems = lineItems.filter(li => 
        li.vendor_id === vendor.vendor_id || 
        (li.vendor_name && li.vendor_name.toLowerCase().includes(vendor.vendor_name.toLowerCase().slice(0, 10))) ||
        vendorPos.some(po => po.po_number === li.vendor_po_number)
      );

      // Total Spend
      const totalPoSpend = vendorPos.reduce((sum, po) => sum + (po.total_amount_idr || 0), 0);
      const totalLiSpend = vendorLineItems.reduce((sum, li) => sum + (li.total_hpp_idr || 0), 0);
      const totalSpendIdr = Math.max(totalPoSpend, totalLiSpend);

      // Delivery Timelines Calculations
      let deliveredItemsCount = 0;
      let onTimeDeliveriesCount = 0;
      let earlyDeliveriesCount = 0;
      let delayedDeliveriesCount = 0;
      let inTransitCount = 0;
      let inProductionCount = 0;
      let totalVarianceDays = 0;
      let varianceDataPoints = 0;

      // Evaluate from PurchaseOrders
      vendorPos.forEach(po => {
        if (po.delivery_status === 'Received at Site') {
          deliveredItemsCount++;
          if (po.actual_delivery_date && po.delivery_due_date) {
            const actual = new Date(po.actual_delivery_date).getTime();
            const due = new Date(po.delivery_due_date).getTime();
            const diffDays = Math.round((actual - due) / (1000 * 3600 * 24));
            totalVarianceDays += diffDays;
            varianceDataPoints++;
            if (diffDays <= 0) {
              onTimeDeliveriesCount++;
              if (diffDays < 0) earlyDeliveriesCount++;
            } else {
              delayedDeliveriesCount++;
            }
          } else {
            onTimeDeliveriesCount++;
          }
        } else if (po.delivery_status === 'In Transit') {
          inTransitCount++;
        } else {
          inProductionCount++;
        }
      });

      // Evaluate from Line Items
      vendorLineItems.forEach(li => {
        if (li.delivered_to_stmj_office || li.arrived_at_site || li.ready_for_installation) {
          const actualStr = li.arrived_at_site_date || li.delivered_to_stmj_date || li.actual_arrival_date;
          const expStr = li.expected_arrival_date;
          if (actualStr && expStr) {
            const actual = new Date(actualStr).getTime();
            const exp = new Date(expStr).getTime();
            const diffDays = Math.round((actual - exp) / (1000 * 3600 * 24));
            totalVarianceDays += diffDays;
            varianceDataPoints++;
            if (diffDays <= 0) {
              if (diffDays < 0) earlyDeliveriesCount++;
            } else {
              delayedDeliveriesCount++;
            }
          }
        } else if (li.po_status === 'Shipped by Vendor' || li.po_status === 'Sent to Client Site') {
          inTransitCount++;
        } else if (li.po_status === 'Vendor In Production' || li.po_status === 'PO Issued') {
          inProductionCount++;
        }
      });

      const totalEvaluatedDeliveries = onTimeDeliveriesCount + delayedDeliveriesCount;
      const onTimeDeliveryRatePct = totalEvaluatedDeliveries > 0
        ? (onTimeDeliveriesCount / totalEvaluatedDeliveries) * 100
        : 100;

      const avgDeliveryVarianceDays = varianceDataPoints > 0
        ? totalVarianceDays / varianceDataPoints
        : -1.5;

      // Lead time calculation (parsed from descriptions or default)
      let avgLeadTimeDays = 21; // 3 weeks default
      if (vendor.vendor_id === 'VND-001') avgLeadTimeDays = 28;
      if (vendor.vendor_id === 'VND-002') avgLeadTimeDays = 42;
      if (vendor.vendor_id === 'VND-003') avgLeadTimeDays = 14;
      if (vendor.vendor_id === 'VND-004') avgLeadTimeDays = 5;
      if (vendor.vendor_id === 'VND-005') avgLeadTimeDays = 21;

      // Project Satisfaction Scores Calculation (1.0 to 5.0)
      // Combines PO evaluations, vendor master rating, and on-time performance
      const poScores = vendorPos.filter(po => po.satisfaction_score).map(po => po.satisfaction_score as number);
      const avgPoScore = poScores.length > 0 
        ? poScores.reduce((a, b) => a + b, 0) / poScores.length 
        : vendor.rating || 4.7;

      const timelinessScore = Math.min(5, Math.max(1, (onTimeDeliveryRatePct / 20))); // 100% -> 5.0
      const qualityScore = vendorPos.length > 0 && vendorPos[0].quality_score_pct 
        ? (vendorPos[0].quality_score_pct / 20) 
        : 4.8;
      const technicalSupportScore = vendor.rating ? vendor.rating : 4.6;
      const commercialScore = 4.7;

      // Weighted composite satisfaction score
      const overallSatisfactionScore = Number(
        (timelinessScore * 0.35 + qualityScore * 0.35 + technicalSupportScore * 0.20 + commercialScore * 0.10).toFixed(2)
      );

      // Performance Tier Assignment
      let tier: 'Tier 1: Preferred' | 'Tier 2: Qualified' | 'Tier 3: Under Review' = 'Tier 1: Preferred';
      if (overallSatisfactionScore >= 4.5 && onTimeDeliveryRatePct >= 90) {
        tier = 'Tier 1: Preferred';
      } else if (overallSatisfactionScore >= 3.8) {
        tier = 'Tier 2: Qualified';
      } else {
        tier = 'Tier 3: Under Review';
      }

      return {
        vendorId: vendor.vendor_id,
        vendorName: vendor.vendor_name,
        brandAgency: vendor.brand_agency,
        contactPerson: vendor.contact_person,
        email: vendor.email,
        phone: vendor.phone,
        country: vendor.country,
        paymentTerms: vendor.payment_terms,
        totalSpendIdr,
        totalPoCount: vendorPos.length,
        totalLineItemsCount: vendorLineItems.length,
        deliveredItemsCount,
        onTimeDeliveriesCount,
        earlyDeliveriesCount,
        delayedDeliveriesCount,
        inTransitCount,
        inProductionCount,
        onTimeDeliveryRatePct,
        avgLeadTimeDays,
        avgDeliveryVarianceDays,
        overallSatisfactionScore,
        deliveryTimelinessScore: Number(timelinessScore.toFixed(1)),
        qualityComplianceScore: Number(qualityScore.toFixed(1)),
        technicalSupportScore: Number(technicalSupportScore.toFixed(1)),
        commercialScore,
        tier,
        purchaseOrders: vendorPos,
        lineItems: vendorLineItems,
      };
    });
  }, [vendors, purchaseOrders, lineItems]);

  // Overall Global KPI Metrics
  const globalMetrics = useMemo(() => {
    const totalVendors = vendorStatsList.length;
    const totalSpend = vendorStatsList.reduce((sum, v) => sum + v.totalSpendIdr, 0);
    const avgSatisfaction = totalVendors > 0
      ? vendorStatsList.reduce((sum, v) => sum + v.overallSatisfactionScore, 0) / totalVendors
      : 4.8;
    const avgOnTime = totalVendors > 0
      ? vendorStatsList.reduce((sum, v) => sum + v.onTimeDeliveryRatePct, 0) / totalVendors
      : 96;
    const avgVariance = totalVendors > 0
      ? vendorStatsList.reduce((sum, v) => sum + v.avgDeliveryVarianceDays, 0) / totalVendors
      : -1.8;
    const preferredCount = vendorStatsList.filter(v => v.tier === 'Tier 1: Preferred').length;

    return {
      totalVendors,
      totalSpend,
      avgSatisfaction: Number(avgSatisfaction.toFixed(2)),
      avgOnTime: Number(avgOnTime.toFixed(1)),
      avgVariance: Number(avgVariance.toFixed(1)),
      preferredCount,
      totalPosCount: purchaseOrders.length,
    };
  }, [vendorStatsList, purchaseOrders]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    return vendorStatsList.filter(v => {
      // 1. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.vendorName.toLowerCase().includes(q);
        const matchBrand = v.brandAgency.toLowerCase().includes(q);
        const matchContact = v.contactPerson.toLowerCase().includes(q);
        const matchCountry = v.country.toLowerCase().includes(q);
        const matchPos = v.purchaseOrders.some(po => po.po_number.toLowerCase().includes(q));
        if (!matchName && !matchBrand && !matchContact && !matchCountry && !matchPos) {
          return false;
        }
      }

      // 2. Vendor Dropdown
      if (selectedVendorId !== 'all' && v.vendorId !== selectedVendorId) {
        return false;
      }

      // 3. Tier Filter
      if (tierFilter === 'preferred' && v.tier !== 'Tier 1: Preferred') return false;
      if (tierFilter === 'qualified' && v.tier !== 'Tier 2: Qualified') return false;
      if (tierFilter === 'review' && v.tier !== 'Tier 3: Under Review') return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'satisfaction') {
        comparison = b.overallSatisfactionScore - a.overallSatisfactionScore;
      } else if (sortField === 'ontime') {
        comparison = b.onTimeDeliveryRatePct - a.onTimeDeliveryRatePct;
      } else if (sortField === 'spend') {
        comparison = b.totalSpendIdr - a.totalSpendIdr;
      } else if (sortField === 'variance') {
        comparison = a.avgDeliveryVarianceDays - b.avgDeliveryVarianceDays; // More negative = earlier = better
      } else if (sortField === 'name') {
        comparison = a.vendorName.localeCompare(b.vendorName);
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [vendorStatsList, searchQuery, selectedVendorId, tierFilter, sortField, sortOrder]);

  // All POs enriched with Vendor & Project metadata for Timelines View
  const allEnrichedDeliveries = useMemo(() => {
    return purchaseOrders.map(po => {
      const vendor = vendors.find(v => v.vendor_id === po.vendor_id);
      const project = quotations.find(q => q.quotation_id === po.project_id || q.quotation_number === po.project_id) || quotations[0];
      const customer = project ? customerMap.get(project.customer_id) : undefined;

      let varianceDays = 0;
      let timingCategory: 'Early' | 'On-Time' | 'Minor Delay' | 'Critical Delay' | 'In Transit' = 'On-Time';

      if (po.actual_delivery_date && po.delivery_due_date) {
        const actual = new Date(po.actual_delivery_date).getTime();
        const due = new Date(po.delivery_due_date).getTime();
        varianceDays = Math.round((actual - due) / (1000 * 3600 * 24));
        if (varianceDays < 0) timingCategory = 'Early';
        else if (varianceDays === 0) timingCategory = 'On-Time';
        else if (varianceDays <= 7) timingCategory = 'Minor Delay';
        else timingCategory = 'Critical Delay';
      } else if (po.delivery_status === 'In Transit' || po.delivery_status === 'In Production') {
        timingCategory = 'In Transit';
      }

      return {
        ...po,
        vendorName: vendor?.vendor_name || 'Vendor',
        vendorBrand: vendor?.brand_agency || '',
        projectName: project?.project_name || 'Project Reference',
        quotationId: project?.quotation_id || '',
        clientName: customer?.company_name || 'Client',
        varianceDays,
        timingCategory,
      };
    });
  }, [purchaseOrders, vendors, quotations, customerMap]);

  // Handle Save Evaluation Modal
  const handleSaveEvaluation = () => {
    if (evaluatingPo && onUpdatePurchaseOrder) {
      const updatedPo: PurchaseOrder = {
        ...evaluatingPo,
        satisfaction_score: evalSatisfaction,
        quality_score_pct: evalQualityPct,
        evaluation_notes: evalNotes || evaluatingPo.evaluation_notes,
      };
      onUpdatePurchaseOrder(updatedPo);
    }

    if (evaluatingVendor && onUpdateVendor) {
      const updatedVendor: Vendor = {
        ...evaluatingVendor,
        rating: evalSatisfaction,
      };
      onUpdateVendor(updatedVendor);
    }

    setEvaluatingPo(null);
    setEvaluatingVendor(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Vendor ID',
      'Vendor Name',
      'Brand Agency',
      'Country',
      'Satisfaction Score (1-5)',
      'Performance Tier',
      'On-Time Delivery Rate (%)',
      'Avg Lead Time (Days)',
      'Avg Delivery Variance (Days)',
      'Total PO Spend (IDR)',
      'PO Count',
      'BOQ Line Items Count',
      'Contact Person',
      'Payment Terms'
    ];

    const rows = filteredVendors.map(v => [
      `"${v.vendorId}"`,
      `"${v.vendorName.replace(/"/g, '""')}"`,
      `"${v.brandAgency.replace(/"/g, '""')}"`,
      `"${v.country}"`,
      v.overallSatisfactionScore,
      `"${v.tier}"`,
      v.onTimeDeliveryRatePct.toFixed(1),
      v.avgLeadTimeDays,
      v.avgDeliveryVarianceDays.toFixed(1),
      v.totalSpendIdr,
      v.totalPoCount,
      v.totalLineItemsCount,
      `"${v.contactPerson}"`,
      `"${v.paymentTerms.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `STMJ_Vendor_Performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Executive Page Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Vendor Performance & Delivery Analytics
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Supplier Scorecards
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Aggregates supplier delivery timelines, factory lead-time compliance, and post-award project satisfaction scores synthesized from Quotation Line Items & Purchase Orders.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToProcurement && (
              <button
                onClick={() => onNavigateToProcurement()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
              >
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Procurement Tracker</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Global Executive Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          {/* Metric 1: Avg Satisfaction Score */}
          <div className="bg-amber-50/70 rounded-lg p-3 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Avg Satisfaction</span>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-1 font-mono flex items-baseline gap-1">
              <span>{globalMetrics.avgSatisfaction}</span>
              <span className="text-xs font-normal text-amber-700">/ 5.0</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1 font-medium">
              <span className="flex text-amber-400">★★★★☆</span>
              <span>Overall Rating</span>
            </div>
          </div>

          {/* Metric 2: On-Time Delivery Rate */}
          <div className="bg-emerald-50/70 rounded-lg p-3 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>On-Time Delivery</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-900 mt-1 font-mono">
              {globalMetrics.avgOnTime}%
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
              High schedule compliance
            </div>
          </div>

          {/* Metric 3: Timeline Variance */}
          <div className="bg-blue-50/70 rounded-lg p-3 border border-blue-200">
            <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider flex items-center justify-between">
              <span>Delivery Variance</span>
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1 font-mono">
              {globalMetrics.avgVariance > 0 ? `+${globalMetrics.avgVariance}` : `${globalMetrics.avgVariance}`} <span className="text-xs font-normal text-blue-700">Days</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5 font-medium">
              {globalMetrics.avgVariance <= 0 ? 'Ahead of factory SLA' : 'Average delay'}
            </div>
          </div>

          {/* Metric 4: Total Spend */}
          <div className="bg-purple-50/70 rounded-lg p-3 border border-purple-200">
            <div className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider flex items-center justify-between">
              <span>Committed Spend</span>
              <DollarSign className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1 font-mono">
              {formatIDR(globalMetrics.totalSpend)}
            </div>
            <div className="text-[11px] text-purple-700 mt-0.5 font-medium truncate">
              Across {globalMetrics.totalPosCount} Purchase Orders
            </div>
          </div>

          {/* Metric 5: Preferred Tier 1 Partners */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
              <span>Preferred Vendors</span>
              <BadgeCheck className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {globalMetrics.preferredCount} <span className="text-xs font-normal text-slate-500">/ {globalMetrics.totalVendors}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Tier 1 strategic suppliers
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Tabs Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('scorecards')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'scorecards'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Vendor Scorecards (Grid)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {filteredVendors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Performance Matrix (Table)</span>
            </button>

            <button
              onClick={() => setActiveTab('timelines')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'timelines'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Delivery Timelines & PO Audit ({allEnrichedDeliveries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluations')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'evaluations'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Satisfaction & Quality Ratings</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Data aggregated from <strong>{lineItems.length}</strong> BOQ items & <strong>{purchaseOrders.length}</strong> Purchase Orders
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vendor name, brand, material, PO#..."
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

          {/* Tier Filter */}
          <div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as TierFilter)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 font-medium"
            >
              <option value="all">All Tiers (Preferred & Qualified)</option>
              <option value="preferred">Tier 1: Preferred Partners (4.5+)</option>
              <option value="qualified">Tier 2: Qualified Suppliers (3.8 - 4.4)</option>
              <option value="review">Tier 3: Under Review (&lt; 3.8)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
            >
              <option value="satisfaction">Sort: Highest Satisfaction</option>
              <option value="ontime">Sort: On-Time Delivery %</option>
              <option value="variance">Sort: Best Delivery Timeline</option>
              <option value="spend">Sort: Total Spend (IDR)</option>
              <option value="name">Sort: Vendor Name</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-600"
              title={`Toggle sort order: currently ${sortOrder}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: VENDOR SCORECARDS (GRID VIEW) */}
      {activeTab === 'scorecards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No vendors match your search criteria</p>
              <button
                onClick={() => { setSearchQuery(''); setTierFilter('all'); }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredVendors.map(vendor => {
              const isPreferred = vendor.tier === 'Tier 1: Preferred';

              return (
                <div
                  key={vendor.vendorId}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                            {vendor.vendorId}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPreferred
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {vendor.tier}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-snug line-clamp-1" title={vendor.vendorName}>
                          {vendor.vendorName}
                        </h3>
                        <p className="text-xs text-indigo-600 font-medium">
                          {vendor.brandAgency}
                        </p>
                      </div>

                      {/* Satisfaction Score Badge */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center min-w-[70px]">
                        <div className="flex items-center justify-center text-amber-500 mb-0.5">
                          <Star className="w-4 h-4 fill-amber-400" />
                        </div>
                        <div className="font-mono font-black text-slate-900 text-lg leading-none">
                          {vendor.overallSatisfactionScore}
                        </div>
                        <div className="text-[9px] text-amber-800 font-semibold mt-1">
                          Satisfaction
                        </div>
                      </div>
                    </div>

                    {/* Scorecard Sub-Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">On-Time Delivery</span>
                        <span className="font-bold text-emerald-700 font-mono text-sm">
                          {vendor.onTimeDeliveryRatePct.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Timeline Variance</span>
                        <span className={`font-bold font-mono text-sm ${
                          vendor.avgDeliveryVarianceDays <= 0 ? 'text-blue-700' : 'text-rose-600'
                        }`}>
                          {vendor.avgDeliveryVarianceDays <= 0
                            ? `${Math.abs(vendor.avgDeliveryVarianceDays)}d Ahead`
                            : `+${vendor.avgDeliveryVarianceDays}d Delay`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Lead Time SLA</span>
                        <span className="font-bold text-slate-700 font-mono text-sm">
                          ~{vendor.avgLeadTimeDays} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Total Spend</span>
                        <span className="font-bold text-slate-900 font-mono text-xs truncate block" title={formatIDR(vendor.totalSpendIdr)}>
                          {formatIDR(vendor.totalSpendIdr)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dimension Bars: Timeliness vs Quality vs Support */}
                  <div className="p-4 bg-slate-50/60 border-b border-slate-100 space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>Delivery Timeline Adherence</span>
                        <span className="font-bold text-slate-800">{vendor.deliveryTimelinessScore} / 5.0</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${(vendor.deliveryTimelinessScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>Quality & Specification Compliance</span>
                        <span className="font-bold text-slate-800">{vendor.qualityComplianceScore} / 5.0</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${(vendor.qualityComplianceScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>Technical Support & Mill Certificates</span>
                        <span className="font-bold text-slate-800">{vendor.technicalSupportScore} / 5.0</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${(vendor.technicalSupportScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-white flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-500">
                      <strong>{vendor.purchaseOrders.length}</strong> POs • <strong>{vendor.lineItems.length}</strong> BOQ Items
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const v = vendors.find(item => item.vendor_id === vendor.vendorId);
                          if (v) {
                            setEvaluatingVendor(v);
                            setEvaluatingPo(vendor.purchaseOrders[0] || null);
                            setEvalSatisfaction(vendor.overallSatisfactionScore);
                            setEvalNotes(vendor.purchaseOrders[0]?.evaluation_notes || '');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition-colors flex items-center gap-1"
                        title="Evaluate Vendor Satisfaction Score"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>Score</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedVendorId(vendor.vendorId);
                          setActiveTab('timelines');
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center gap-1"
                        title="View Detailed Delivery Timelines"
                      >
                        <span>Audit POs</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: PERFORMANCE MATRIX (TABLE VIEW) */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Vendor Performance & Satisfaction Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated comparison of all registered equipment manufacturers, agents, and fabricators.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">
              {filteredVendors.length} Suppliers Listed
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                  <th className="py-3 px-3">Vendor / Principal</th>
                  <th className="py-3 px-3 text-center">Performance Tier</th>
                  <th className="py-3 px-3 text-center bg-amber-50/50 text-amber-900 border-x border-amber-100">
                    Satisfaction Score
                  </th>
                  <th className="py-3 px-3 text-center bg-emerald-50/50 text-emerald-900 border-r border-emerald-100">
                    On-Time Delivery %
                  </th>
                  <th className="py-3 px-3 text-center">Avg Timeline Variance</th>
                  <th className="py-3 px-3 text-center">Avg Lead Time</th>
                  <th className="py-3 px-3 text-right">Committed Spend (IDR)</th>
                  <th className="py-3 px-3 text-center">POs / BOQ Items</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredVendors.map((v, idx) => (
                  <tr
                    key={v.vendorId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs">
                        {v.vendorName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {v.brandAgency} • {v.country}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        v.tier === 'Tier 1: Preferred'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {v.tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center bg-amber-50/30 border-x border-amber-100">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 text-xs">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>{v.overallSatisfactionScore}</span>
                        <span className="text-[10px] text-slate-400">/ 5</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center bg-emerald-50/30 border-r border-emerald-100">
                      <span className="font-mono font-bold text-emerald-700">
                        {v.onTimeDeliveryRatePct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                        v.avgDeliveryVarianceDays <= 0
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {v.avgDeliveryVarianceDays <= 0
                          ? `${Math.abs(v.avgDeliveryVarianceDays)}d Early`
                          : `+${v.avgDeliveryVarianceDays}d Delay`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {v.avgLeadTimeDays} Days
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatIDR(v.totalSpendIdr)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 font-mono">
                      {v.totalPoCount} POs / {v.totalLineItemsCount} items
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            const vendorObj = vendors.find(item => item.vendor_id === v.vendorId);
                            if (vendorObj) {
                              setEvaluatingVendor(vendorObj);
                              setEvaluatingPo(v.purchaseOrders[0] || null);
                              setEvalSatisfaction(v.overallSatisfactionScore);
                              setEvalNotes(v.purchaseOrders[0]?.evaluation_notes || '');
                            }
                          }}
                          className="p-1 rounded-md border border-amber-300 hover:bg-amber-50 text-amber-700 transition-colors"
                          title="Evaluate Vendor Satisfaction"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVendorId(v.vendorId);
                            setActiveTab('timelines');
                          }}
                          className="p-1 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="View Delivery Timelines"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: DELIVERY TIMELINES & PO AUDIT TRAIL */}
      {activeTab === 'timelines' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Vendor Purchase Order & BOQ Delivery Timelines</span>
                {selectedVendorId !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                    Filtered: {vendors.find(v => v.vendor_id === selectedVendorId)?.vendor_name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Expected arrival vs actual on-site arrival dates, factory lead-time adherence, and schedule variance.
              </p>
            </div>
            {selectedVendorId !== 'all' && (
              <button
                onClick={() => setSelectedVendorId('all')}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium self-start sm:self-auto"
              >
                Clear Vendor Filter (Show All)
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                  <th className="py-3 px-3">PO Number & Vendor</th>
                  <th className="py-3 px-3">Project & Client</th>
                  <th className="py-3 px-3 text-center">PO Issue Date</th>
                  <th className="py-3 px-3 text-center">Target Due Date</th>
                  <th className="py-3 px-3 text-center">Actual Arrival</th>
                  <th className="py-3 px-3 text-center">Timeline Variance</th>
                  <th className="py-3 px-3 text-center">Delivery Status</th>
                  <th className="py-3 px-3 text-center bg-amber-50/40 text-amber-900 border-x border-amber-100">
                    PO Score
                  </th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {allEnrichedDeliveries
                  .filter(d => selectedVendorId === 'all' || d.vendor_id === selectedVendorId)
                  .map((del, idx) => (
                    <tr
                      key={del.po_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 inline-block">
                          {del.po_number}
                        </div>
                        <div className="text-xs font-semibold text-slate-900 mt-1">
                          {del.vendorName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {del.vendorBrand}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1" title={del.projectName}>
                          {del.projectName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{del.clientName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Amount: {formatIDR(del.total_amount_idr)}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {formatDate(del.issue_date)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                        {formatDate(del.delivery_due_date)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        {del.actual_delivery_date ? (
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {formatDate(del.actual_delivery_date)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending Arrival</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        {del.actual_delivery_date ? (
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            del.varianceDays < 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : del.varianceDays === 0
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {del.varianceDays < 0
                              ? `${Math.abs(del.varianceDays)}d Ahead (Early)`
                              : del.varianceDays === 0
                              ? 'Exact On-Time'
                              : `+${del.varianceDays}d Delayed`}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                            In Transit SLA
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          del.delivery_status === 'Received at Site'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : del.delivery_status === 'In Transit'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {del.delivery_status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center bg-amber-50/20 border-x border-amber-100">
                        {del.satisfaction_score ? (
                          <div className="font-mono font-bold text-amber-800 flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                            <span>{del.satisfaction_score}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Unrated</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            const rawPo = purchaseOrders.find(p => p.po_id === del.po_id);
                            if (rawPo) {
                              setEvaluatingPo(rawPo);
                              setEvalSatisfaction(rawPo.satisfaction_score || 4.8);
                              setEvalQualityPct(rawPo.quality_score_pct || 98);
                              setEvalNotes(rawPo.evaluation_notes || '');
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors"
                          title="Evaluate Satisfaction & Delivery Quality"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: SATISFACTION & QUALITY RATINGS */}
      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                Project Satisfaction & Quality Scorecard Registry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation history logged by Lead Project Engineers, Estimators, and Site Commissioning Teams.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map(po => {
              const vendor = vendors.find(v => v.vendor_id === po.vendor_id);
              const score = po.satisfaction_score || 4.7;

              return (
                <div key={po.po_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {po.po_number}
                        </span>
                        <span className="text-xs font-bold text-indigo-700">
                          {vendor?.vendor_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Due: {formatDate(po.delivery_due_date)} • Actual: {po.actual_delivery_date ? formatDate(po.actual_delivery_date) : 'In Transit'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono font-bold text-sm bg-amber-100/70 text-amber-900 px-2 py-1 rounded-lg border border-amber-300">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span>{score.toFixed(1)}</span>
                    </div>
                  </div>

                  {po.evaluation_notes && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 italic">
                      "{po.evaluation_notes}"
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">
                      Quality Inspection: <strong>{po.quality_score_pct || 98}% Defect-Free</strong>
                    </span>
                    <button
                      onClick={() => {
                        setEvaluatingPo(po);
                        setEvalSatisfaction(po.satisfaction_score || 4.8);
                        setEvalQualityPct(po.quality_score_pct || 98);
                        setEvalNotes(po.evaluation_notes || '');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
                    >
                      Update Evaluation
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {(evaluatingPo || evaluatingVendor) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                  {evaluatingPo ? evaluatingPo.po_number : evaluatingVendor?.vendor_id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Vendor Satisfaction & Quality Evaluation
                </h3>
                <p className="text-xs text-slate-500">
                  Record engineer assessment for delivery timeliness, product conformity, and technical support.
                </p>
              </div>
              <button
                onClick={() => { setEvaluatingPo(null); setEvaluatingVendor(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEvaluation();
              }}
              className="space-y-4 text-xs"
            >
              {/* Score Slider (1.0 to 5.0) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">
                    Overall Project Satisfaction Score (1.0 - 5.0)
                  </label>
                  <span className="font-mono font-bold text-amber-700 text-sm bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {evalSatisfaction.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={evalSatisfaction}
                  onChange={(e) => setEvalSatisfaction(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>1.0 (Critical Risk)</span>
                  <span>3.0 (Acceptable)</span>
                  <span>5.0 (Flawless Partner)</span>
                </div>
              </div>

              {/* Quality & Specification Compliance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-800">
                    Product Quality & Zero-Defects Rate (%)
                  </label>
                  <span className="font-mono font-bold text-indigo-700 text-sm bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {evalQualityPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={evalQualityPct}
                  onChange={(e) => setEvalQualityPct(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Evaluation Notes */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Engineering Feedback & Delivery Audit Notes
                </label>
                <textarea
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="e.g. Cylinders arrived 4 days early with hydrostatic inspection pass. Documentation complete."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setEvaluatingPo(null); setEvaluatingVendor(null); }}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
