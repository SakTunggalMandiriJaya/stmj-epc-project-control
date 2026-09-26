import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Truck, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Wrench, 
  ChevronRight, 
  PackageCheck, 
  Warehouse, 
  MapPin, 
  ArrowUpRight, 
  Building2, 
  BadgeCheck, 
  Edit3, 
  Sliders, 
  Receipt,
  Flame,
  FileCheck2,
  HardHat,
  Gauge
} from 'lucide-react';
import { 
  Quotation, 
  Customer, 
  QuotationLineItem, 
  ProjectMilestone,
  TechnicalTeamDeployment,
  FatSatSchedule,
  WbsLevel1Progress,
  WbsLevel2WorkPackage,
  WbsLevel3Task,
  VendorPoStatus,
  LogisticsDeliveryStage
} from '../types/stmjDatabase';
import { formatIDR, formatPercent, formatDate, getStatusBadgeClass } from '../utils/stmjFormatters';

interface ProjectExecutionTrackerProps {
  quotations: Quotation[];
  customers: Customer[];
  lineItems: QuotationLineItem[];
  milestones: ProjectMilestone[];
  deployments: TechnicalTeamDeployment[];
  fatSchedules: FatSatSchedule[];
  wbsProgressList: WbsLevel1Progress[];
  selectedQuotationId?: string;
  onUpdateLineItem: (item: QuotationLineItem) => void;
  onUpdateMilestone: (milestone: ProjectMilestone) => void;
  onUpdateDeployment: (deployment: TechnicalTeamDeployment) => void;
  onUpdateFatSchedule: (fat: FatSatSchedule) => void;
  onUpdateWbsProgress: (progress: WbsLevel1Progress) => void;
  onNavigateToQuotation: (quotationId: string) => void;
  onNavigateToProcurement?: (quotationId?: string) => void;
}

export type ExecutionSubTab = 'wbs_progress' | 'boq_procurement' | 'technical_fat' | 'financial_milestones';

export const ProjectExecutionTracker: React.FC<ProjectExecutionTrackerProps> = ({
  quotations,
  customers,
  lineItems,
  milestones,
  deployments,
  fatSchedules,
  wbsProgressList,
  selectedQuotationId,
  onUpdateLineItem,
  onUpdateMilestone,
  onUpdateDeployment,
  onUpdateFatSchedule,
  onUpdateWbsProgress,
  onNavigateToQuotation,
  onNavigateToProcurement,
}) => {
  const [activeQuoId, setActiveQuoId] = useState<string>(
    selectedQuotationId || quotations[0]?.quotation_id || ''
  );
  const [activeSubTab, setActiveSubTab] = useState<ExecutionSubTab>('wbs_progress');
  const [editingPoItemId, setEditingPoItemId] = useState<string | null>(null);

  // Active quotation & related entities
  const activeQuotation = useMemo(() => {
    return quotations.find(q => q.quotation_id === activeQuoId) || quotations[0];
  }, [quotations, activeQuoId]);

  const activeCustomer = useMemo(() => {
    if (!activeQuotation) return null;
    return customers.find(c => c.customer_id === activeQuotation.customer_id) || null;
  }, [customers, activeQuotation]);

  const activeLineItems = useMemo(() => {
    if (!activeQuotation) return [];
    return lineItems.filter(li => li.quotation_id === activeQuotation.quotation_id);
  }, [lineItems, activeQuotation]);

  const activeMilestones = useMemo(() => {
    if (!activeQuotation) return [];
    return milestones.filter(m => m.quotation_id === activeQuotation.quotation_id);
  }, [milestones, activeQuotation]);

  const activeDeployment = useMemo(() => {
    if (!activeQuotation) return null;
    return deployments.find(d => d.quotation_id === activeQuotation.quotation_id) || deployments[0];
  }, [deployments, activeQuotation]);

  const activeFatSchedule = useMemo(() => {
    if (!activeQuotation) return null;
    return fatSchedules.find(f => f.quotation_id === activeQuotation.quotation_id) || fatSchedules[0];
  }, [fatSchedules, activeQuotation]);

  const activeWbsProgress = useMemo(() => {
    if (!activeQuotation) return null;
    return wbsProgressList.find(w => w.quotation_id === activeQuotation.quotation_id) || wbsProgressList[0];
  }, [wbsProgressList, activeQuotation]);

  // BoQ Procurement metrics
  const procurementSummary = useMemo(() => {
    const totalItems = activeLineItems.length;
    const poIssuedCount = activeLineItems.filter(li => li.vendor_po_number).length;
    const deliveredStmjCount = activeLineItems.filter(li => li.delivered_to_stmj_office).length;
    const arrivedSiteCount = activeLineItems.filter(li => li.arrived_at_site).length;
    const readyInstallCount = activeLineItems.filter(li => li.ready_for_installation).length;
    return { totalItems, poIssuedCount, deliveredStmjCount, arrivedSiteCount, readyInstallCount };
  }, [activeLineItems]);

  // Handle Level 3 task progress update
  const handleUpdateTaskProgress = (wpCode: 'ENG' | 'PROC' | 'INST' | 'COMM', taskId: string, newPct: number) => {
    if (!activeWbsProgress) return;
    const updatedWorkPackages = activeWbsProgress.work_packages.map(wp => {
      if (wp.wp_code === wpCode) {
        const updatedTasks = wp.tasks.map(t => {
          if (t.task_id === taskId) {
            const status: WbsLevel3Task['status'] = newPct === 100 ? 'Completed' : newPct > 0 ? 'In Progress' : 'Not Started';
            return { ...t, actual_progress_pct: newPct, status };
          }
          return t;
        });

        // Recalculate Level 2 package actual progress based on task weights
        const totalWpActual = updatedTasks.reduce((acc, t) => acc + (t.actual_progress_pct * (t.weight_in_wp_pct / 100)), 0);
        return { ...wp, tasks: updatedTasks, actual_progress_pct: Math.round(totalWpActual) };
      }
      return wp;
    });

    // Recalculate Level 1 overall project progress based on Level 2 package weights
    const overallActual = updatedWorkPackages.reduce((acc, wp) => acc + (wp.actual_progress_pct * (wp.weight_overall_pct / 100)), 0);
    const variance = Number((overallActual - activeWbsProgress.overall_planned_progress_pct).toFixed(1));
    const scheduleStatus: WbsLevel1Progress['schedule_status'] = 
      variance >= 2 ? 'Ahead of Schedule' : variance >= -2 ? 'On Schedule' : variance >= -10 ? 'Minor Delay' : 'Critical Delay';

    const updatedWbs: WbsLevel1Progress = {
      ...activeWbsProgress,
      overall_actual_progress_pct: Number(overallActual.toFixed(1)),
      variance_pct: variance,
      schedule_status: scheduleStatus,
      work_packages: updatedWorkPackages,
    };

    onUpdateWbsProgress(updatedWbs);
  };

  // Handle BoQ Item Logistics Stage Advancement
  const handleAdvanceLogisticsStage = (item: QuotationLineItem, newStage: LogisticsDeliveryStage) => {
    let deliveredOffice = item.delivered_to_stmj_office || false;
    let sentSite = item.sent_to_client_site || false;
    let arrivedSite = item.arrived_at_site || false;
    let readyInstall = item.ready_for_installation || false;
    let poStatus = item.po_status || 'PO Issued';

    const today = new Date().toISOString().split('T')[0];

    if (newStage === 'Stage 2: Delivered to STMJ Office') {
      deliveredOffice = true;
      poStatus = 'Delivered to STMJ Office';
    } else if (newStage === 'Stage 3: Dispatched to Client Site') {
      deliveredOffice = true;
      sentSite = true;
      poStatus = 'Sent to Client Site';
    } else if (newStage === 'Stage 4: Arrived at Site') {
      deliveredOffice = true;
      sentSite = true;
      arrivedSite = true;
      poStatus = 'Arrived at Site & Inspected';
    } else if (newStage === 'Stage 5: Ready for Installation') {
      deliveredOffice = true;
      sentSite = true;
      arrivedSite = true;
      readyInstall = true;
      poStatus = 'Ready for Installation';
    }

    const updatedItem: QuotationLineItem = {
      ...item,
      logistics_stage: newStage,
      po_status: poStatus,
      delivered_to_stmj_office: deliveredOffice,
      delivered_to_stmj_date: deliveredOffice && !item.delivered_to_stmj_date ? today : item.delivered_to_stmj_date,
      sent_to_client_site: sentSite,
      sent_to_site_date: sentSite && !item.sent_to_site_date ? today : item.sent_to_site_date,
      arrived_at_site: arrivedSite,
      arrived_at_site_date: arrivedSite && !item.arrived_at_site_date ? today : item.arrived_at_site_date,
      ready_for_installation: readyInstall,
      installation_status: readyInstall ? 'In Progress' : item.installation_status,
    };

    onUpdateLineItem(updatedItem);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Project Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-indigo-600" />
              Project Site Execution & Operations Hub
            </span>
            <span className="text-xs text-slate-500">
              WBS Progress (L1/L2/L3) • BOQ Logistics Flow • Technical Team & FAT
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Physical Engineering Progress & Vendor Logistics Tracking
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Independent physical work measurement (distinct from commercial billing payments), lead time monitoring, and site commissioning readiness.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">ACTIVE CONTRACT / RFQ</span>
            <select
              value={activeQuoId}
              onChange={e => setActiveQuoId(e.target.value)}
              className="mt-0.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {quotations.map(q => (
                <option key={q.quotation_id} value={q.quotation_id}>
                  {q.quotation_number} — {customers.find(c => c.customer_id === q.customer_id)?.company_name} ({q.status})
                </option>
              ))}
            </select>
          </div>

          {onNavigateToProcurement && (
            <button
              onClick={() => onNavigateToProcurement(activeQuoId)}
              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 self-end transition-colors shadow-2xs"
              title="Open Master Procurement Tracker for all BOQ items across all projects"
            >
              <Truck className="w-3.5 h-3.5" />
              Procurement Tracker
            </button>
          )}

          <button
            onClick={() => onNavigateToQuotation(activeQuoId)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 self-end transition-colors"
          >
            Quotation BoQ
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top 4 Real-Time KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Level 1 Physical Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Physical Progress (WBS Level 1)</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {activeWbsProgress ? `${activeWbsProgress.overall_actual_progress_pct}%` : '56.5%'}
          </div>
          <div className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-slate-500">Planned: {activeWbsProgress?.overall_planned_progress_pct || 52}%</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              (activeWbsProgress?.variance_pct || 0) >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {(activeWbsProgress?.variance_pct || 0) >= 0 ? '+' : ''}{activeWbsProgress?.variance_pct || 4.5}% Ahead
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${activeWbsProgress?.overall_actual_progress_pct || 56.5}%` }}
            />
          </div>
        </div>

        {/* KPI 2: BoQ Vendor Material Logistics */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>BOQ Logistics Pipeline</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 mt-1 font-mono">
            {procurementSummary.arrivedSiteCount} / {procurementSummary.totalItems} Items
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{procurementSummary.readyInstallCount} items ready for installation</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            POs Issued: {procurementSummary.poIssuedCount} • Delivered STMJ: {procurementSummary.deliveredStmjCount}
          </div>
        </div>

        {/* KPI 3: Technical Team Deployment */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Technical Site Team</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span>{activeDeployment?.status || 'On-Site Active'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xs text-slate-600 mt-1 font-medium">
            {activeDeployment?.manpower_count || 5} Certified Field Personnel
          </div>
          <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
            Lead: {activeDeployment?.team_lead || 'Ir. Hendra Gunawan'}
          </div>
        </div>

        {/* KPI 4: FAT & Testing Milestone */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Next Inspection / FAT</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {activeFatSchedule?.fat_date ? formatDate(activeFatSchedule.fat_date) : '15 Oct 2026'}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-semibold flex items-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" />
            {activeFatSchedule?.fat_status || 'FAT Scheduled'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
            Venue: {activeFatSchedule?.fat_venue || 'STMJ Workshop & Testing Bay'}
          </div>
        </div>
      </div>

      {/* Execution Sub-Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
        <button
          onClick={() => setActiveSubTab('wbs_progress')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'wbs_progress'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Physical Progress Measurement (WBS Level 1, 2, 3)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'wbs_progress' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeWbsProgress ? `${activeWbsProgress.overall_actual_progress_pct}%` : '56.5%'}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('boq_procurement')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'boq_procurement'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>2. BOQ Vendor PO & Logistics Flow (5 Stages)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'boq_procurement' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeLineItems.length} Items
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('technical_fat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'technical_fat'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Technical Team Deployment & FAT / SAT</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'technical_fat' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeDeployment?.manpower_count || 5} Pax
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('financial_milestones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'financial_milestones'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>4. Commercial Termin Billing (Financial Invoicing)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSubTab === 'financial_milestones' ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {activeMilestones.length} Termins
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: PHYSICAL PROGRESS MEASUREMENT (WBS LEVEL 1, 2, 3)   */}
      {/* ============================================================== */}
      {activeSubTab === 'wbs_progress' && (
        <div className="space-y-6">
          {/* Level 1 Master Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Level 1: Overall Physical Work Breakdown
                </span>
                <h3 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
                  <span>{activeQuotation.project_name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client: {activeCustomer?.company_name} • Physical progress is calculated strictly by engineering task execution (independent of financial termin invoices).
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">PLANNED S-CURVE</div>
                  <div className="text-xl font-mono font-bold text-slate-300">
                    {activeWbsProgress?.overall_planned_progress_pct || 52}%
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div className="text-right">
                  <div className="text-[10px] text-emerald-400 font-mono font-bold">ACTUAL PHYSICAL</div>
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    {activeWbsProgress?.overall_actual_progress_pct || 56.5}%
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Level 1 Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>Physical Progress Progress Gauge</span>
                <span className="text-emerald-400 font-bold">
                  Variance: +{activeWbsProgress?.variance_pct || 4.5}% Ahead of Master Schedule
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${activeWbsProgress?.overall_actual_progress_pct || 56.5}%` }}
                />
              </div>
            </div>
          </div>

          {/* Level 2 Work Package Cards (4 Disciplines) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Level 2: Discipline Work Packages & Weighted Progress
              </h4>
              <span className="text-xs text-slate-500">
                Total Weight = 100% (Eng 15% + Proc 35% + Inst 35% + Comm 15%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(activeWbsProgress?.work_packages || []).map(wp => {
                const isComplete = wp.actual_progress_pct === 100;
                return (
                  <div 
                    key={wp.wp_code}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {wp.wp_code} ({wp.weight_overall_pct}% Wt)
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isComplete ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isComplete ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1">{wp.wp_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Lead: {wp.lead_engineer}</div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">Plan: {wp.planned_progress_pct}%</span>
                        <span className="font-bold text-indigo-700">Act: {wp.actual_progress_pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${wp.actual_progress_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level 3 Granular Engineering Task Checklist & Interactive Progress Sliders */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-indigo-600" />
                  Level 3: Granular Engineering Deliverables & Task Progress Breakdown
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify individual tasks, drag progress sliders to update physical completions, and inspect technical deliverable evidence.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Interactive WBS Tracker
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {(activeWbsProgress?.work_packages || []).map(wp => (
                <div key={wp.wp_code} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded">
                        {wp.wp_code}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{wp.wp_name}</span>
                      <span className="text-xs text-slate-500">({wp.weight_overall_pct}% Project Weight)</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Package Actual: {wp.actual_progress_pct}%
                    </span>
                  </div>

                  {/* Task Table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">WBS ID & Deliverable Task</th>
                          <th className="px-3 py-2.5">Discipline</th>
                          <th className="px-3 py-2.5 text-center">WP Weight</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                          <th className="px-3 py-2.5 text-center">Planned %</th>
                          <th className="px-3 py-2.5 text-right w-44">Actual Physical %</th>
                          <th className="px-3 py-2.5">Assigned PIC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wp.tasks.map(task => (
                          <tr key={task.task_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-3">
                              <div className="font-mono text-[11px] font-bold text-indigo-700">{task.task_id}</div>
                              <div className="text-xs text-slate-800 font-medium mt-0.5">{task.task_name}</div>
                              {task.deliverable_document && (
                                <div className="text-[10px] text-sky-600 font-mono mt-0.5 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Doc: {task.deliverable_document}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-slate-600 text-[11px]">
                              {task.discipline}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-slate-700">
                              {task.weight_in_wp_pct}%
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : task.status === 'In Progress'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {task.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-mono text-slate-600">
                              {task.planned_progress_pct}%
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={task.actual_progress_pct}
                                  onChange={e => handleUpdateTaskProgress(wp.wp_code, task.task_id, Number(e.target.value))}
                                  className="w-24 accent-indigo-600 cursor-pointer"
                                />
                                <span className="font-mono font-bold text-xs text-slate-900 w-9 text-right">
                                  {task.actual_progress_pct}%
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-slate-700 text-xs">
                              {task.assigned_engineer}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: BOQ VENDOR PO & LOGISTICS FLOW (5 STAGES)           */}
      {/* ============================================================== */}
      {activeSubTab === 'boq_procurement' && (
        <div className="space-y-6">
          {/* Top Logistics Stepper Legend */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              5-Stage Material & Vendor PO Logistics Lifecycle
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { stage: 'Stage 1', title: 'PO Issued & Paid', desc: 'PO to principal & DP settled' },
                { stage: 'Stage 2', title: 'Delivered STMJ Office', desc: 'Arrived at STMJ workshop/warehouse' },
                { stage: 'Stage 3', title: 'Dispatched to Site', desc: 'Trucking mobilized to client site' },
                { stage: 'Stage 4', title: 'Arrived at Site', desc: 'Site receipt & incoming inspection' },
                { stage: 'Stage 5', title: 'Ready for Install', desc: 'Cleared for welding & installation' },
              ].map((s, idx) => (
                <div key={s.stage} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-mono text-[10px] font-bold text-indigo-700 uppercase">
                    Step {idx + 1} • {s.stage}
                  </div>
                  <div className="font-bold text-slate-800">{s.title}</div>
                  <p className="text-[10px] text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BOQ Line Items Procurement Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Itemized Bill of Quantities — Vendor PO & Logistics Status ({activeLineItems.length} lines)
                </h4>
                <p className="text-xs text-slate-500">
                  Track vendor purchase order references, lead time schedules, payment status, and physical location.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Item & Spec</th>
                    <th className="px-3 py-2.5">Vendor / Principal</th>
                    <th className="px-3 py-2.5">Vendor PO # & Date</th>
                    <th className="px-3 py-2.5">Lead Time</th>
                    <th className="px-3 py-2.5 text-center">Vendor Payment</th>
                    <th className="px-3 py-2.5 text-center">Logistics Stage</th>
                    <th className="px-3 py-2.5 text-center">Advance Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeLineItems.map(item => {
                    const currentStage = item.logistics_stage || 'Stage 1: PO Issued & Paid';
                    const isStage2 = item.delivered_to_stmj_office;
                    const isStage3 = item.sent_to_client_site;
                    const isStage4 = item.arrived_at_site;
                    const isStage5 = item.ready_for_installation;

                    return (
                      <tr key={item.item_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3">
                          <div className="font-mono text-[11px] font-bold text-indigo-700">{item.item_code}</div>
                          <div className="text-xs text-slate-800 font-medium mt-0.5 line-clamp-1">{item.description}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity} {item.uom}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-900 text-xs">
                            {item.vendor_name || 'PT Hygood Fire Protection Indonesia'}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Category: {item.category}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-mono font-bold text-indigo-700 text-xs">
                            {item.vendor_po_number || 'PO/STMJ/VND/2026/09/032'}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Issued: {item.po_issued_date ? formatDate(item.po_issued_date) : '2026-09-22'}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-800 text-xs">
                            {item.lead_time_desc || '4 - 6 Weeks'}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Expected: {item.expected_arrival_date ? formatDate(item.expected_arrival_date) : '2026-10-18'}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.vendor_payment_status === 'Fully Paid (100%)'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.vendor_payment_status === 'DP Paid (50%)'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.vendor_payment_status || 'DP Paid (50%)'}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-mono">
                            <span className={isStage2 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>STMJ Office ✓</span>
                            <span className="text-slate-300">→</span>
                            <span className={isStage4 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Site ✓</span>
                            <span className="text-slate-300">→</span>
                            <span className={isStage5 ? 'text-indigo-600 font-bold' : 'text-slate-400'}>Ready ✓</span>
                          </div>
                          <div className="text-[10px] font-bold text-indigo-700 mt-1">
                            {currentStage}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <select
                            value={currentStage}
                            onChange={e => handleAdvanceLogisticsStage(item, e.target.value as LogisticsDeliveryStage)}
                            className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="Stage 1: PO Issued & Paid">Stage 1: PO Issued</option>
                            <option value="Stage 2: Delivered to STMJ Office">Stage 2: At STMJ Office</option>
                            <option value="Stage 3: Dispatched to Client Site">Stage 3: Dispatched to Site</option>
                            <option value="Stage 4: Arrived at Site">Stage 4: Arrived at Site</option>
                            <option value="Stage 5: Ready for Installation">Stage 5: Ready for Install</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: TECHNICAL TEAM DEPLOYMENT & FAT / SAT               */}
      {/* ============================================================== */}
      {activeSubTab === 'technical_fat' && (
        <div className="space-y-6">
          {/* Top Section: Technical Team Deployment */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Field Team Mobilization
                  </span>
                  <span className="text-xs text-slate-500">Deployment Ref: {activeDeployment?.deployment_id || 'DEP-2026-001'}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-600" />
                  Technical Team Deployment for Installation & Commissioning
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Assigned certified pipe welders (6G), E&I commissioning technicians, and safety officers currently active on-site.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {activeDeployment?.status || 'On-Site Active'}
                </span>
              </div>
            </div>

            {/* Deployment Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">FIELD TEAM LEAD</span>
                <span className="font-bold text-slate-900">{activeDeployment?.team_lead || 'Ir. Hendra Gunawan'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">MOBILIZATION DATE</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeDeployment?.mobilization_date ? formatDate(activeDeployment.mobilization_date) : '2026-09-24'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">DEMOBILIZATION TARGET</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeDeployment?.demobilization_target_date ? formatDate(activeDeployment.demobilization_target_date) : '2026-11-20'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">JOB LOCATION</span>
                <span className="font-medium text-slate-800 line-clamp-1">
                  {activeDeployment?.site_location || 'Kawasan Industri MM2100, Cikarang'}
                </span>
              </div>
            </div>

            {/* Team Members Roster Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Deployed Certified Field Personnel ({activeDeployment?.members.length || 5} Team Members)
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">Personnel Name</th>
                      <th className="px-3 py-2.5">Role / Position</th>
                      <th className="px-3 py-2.5">Technical Certifications</th>
                      <th className="px-3 py-2.5">Contact</th>
                      <th className="px-3 py-2.5 text-center">Safety Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeDeployment?.members || []).map(m => (
                      <tr key={m.member_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {m.name}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                          {m.certification}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-500">
                          {m.contact_phone}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Site Induction Pass
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Site Activity Log */}
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/80 text-xs">
              <span className="font-bold text-amber-900 block mb-0.5">Current Site Activity Status:</span>
              <p className="text-amber-800">
                {activeDeployment?.daily_activity_summary || 'Manifold rack anchoring completed. Commencing Sch 40 piping erection at elevation +4.5m.'}
              </p>
            </div>
          </div>

          {/* Bottom Section: FAT (Factory Acceptance Test) & Statutory Testing Schedule */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-indigo-600" />
                  FAT (Factory Acceptance Test) & Statutory Commissioning Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Target inspection dates for workshop FAT, hydrostatic pressure tests, room fan integrity tests, and final Disnaker certification.
                </p>
              </div>
              <span className="px-3 py-1 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Protocol: {activeFatSchedule?.fat_protocol_name?.split(':')[0] || 'FAT-PRT-SIG'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FAT Protocol Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Factory Acceptance Test (FAT)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {activeFatSchedule?.fat_status || 'FAT Scheduled'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">FAT Schedule Date:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {activeFatSchedule?.fat_date ? formatDate(activeFatSchedule.fat_date) : '15 Oct 2026'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Testing Venue:</span>
                    <span className="font-medium text-slate-800">{activeFatSchedule?.fat_venue || 'STMJ Workshop Cikarang'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client Witness PIC:</span>
                    <span className="font-medium text-slate-800">{activeFatSchedule?.fat_witness_client || 'Ir. Budi Santoso (Samator)'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                  {activeFatSchedule?.fat_protocol_name || 'Integrated FK-5112 Solenoid Release & Panel Simulation'}
                </p>
              </div>

              {/* Commissioning & Handover Roadmap */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Site Testing & Handover Sequence
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800 block">Piping Hydrostatic Pressure Test</span>
                      <span className="text-[10px] text-slate-400">1.5x design working pressure (37.5 bar)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      {activeFatSchedule?.hydrotest_date ? formatDate(activeFatSchedule.hydrotest_date) : '28 Oct 2026'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800 block">Door Fan Room Integrity Test</span>
                      <span className="text-[10px] text-slate-400">Retention hold time {'>'} 10 minutes (NFPA 2001)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      {activeFatSchedule?.fan_retention_test_date ? formatDate(activeFatSchedule.fan_retention_test_date) : '05 Nov 2026'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800 block">Disnaker Inspection & BAST</span>
                      <span className="text-[10px] text-slate-400">Statutory license & contractual handover sign-off</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">
                      {activeFatSchedule?.bast_target_date ? formatDate(activeFatSchedule.bast_target_date) : '20 Nov 2026'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 4: FINANCIAL TERMIN BILLING (MILESTONES)               */}
      {/* ============================================================== */}
      {activeSubTab === 'financial_milestones' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Commercial Termin Invoicing & Progress Billing ({activeMilestones.length} Stages)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Contractual billing tranches tied to project stages (30% DP, 30% Material on-site, 30% Mechanical installation, 10% BAST).
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-medium block">CONTRACT VALUE (INC. PPN)</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                {formatIDR(activeQuotation.total_amount_idr)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Termin Stage & Deliverable</th>
                    <th className="px-4 py-3 text-center">Tranche %</th>
                    <th className="px-4 py-3 text-right">Amount (IDR)</th>
                    <th className="px-4 py-3 text-center">Target Date</th>
                    <th className="px-4 py-3 text-center">Invoice #</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeMilestones.map(m => (
                    <tr key={m.milestone_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-xs">{m.milestone_name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{m.deliverables}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700">
                        {m.payment_pct}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatIDR(m.amount_idr)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        {formatDate(m.target_date)}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px]">
                        {m.invoice_number ? (
                          <span className="text-indigo-700 font-bold">{m.invoice_number}</span>
                        ) : (
                          <span className="text-slate-400">Unissued</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.status === 'Achieved / Invoiced'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={m.status}
                          onChange={e => onUpdateMilestone({ 
                            ...m, 
                            status: e.target.value as any,
                            actual_date: e.target.value === 'Paid' ? new Date().toISOString().split('T')[0] : m.actual_date,
                            invoice_number: !m.invoice_number && e.target.value !== 'Pending' ? `INV/STMJ/2026/09/${Math.floor(100 + Math.random() * 900)}` : m.invoice_number,
                          })}
                          className="text-xs p-1 rounded border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Achieved / Invoiced">Invoiced</option>
                          <option value="Paid">Mark Paid</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
