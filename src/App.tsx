import React, { useState, useEffect, useMemo } from 'react';
import { 
  Customer, 
  Vendor, 
  Quotation, 
  QuotationLineItem, 
  ProjectCostCalculation, 
  ProjectMilestone, 
  VendorMaterialItem, 
  FireSuppressionComponent, 
  ProjectMaster, 
  PurchaseOrder, 
  SalesReport, 
  DatabaseAuditLog,
  TechnicalTeamDeployment,
  FatSatSchedule,
  WbsLevel1Progress
} from './types/stmjDatabase';
import {
  INITIAL_CUSTOMERS,
  INITIAL_VENDORS,
  INITIAL_QUOTATIONS,
  INITIAL_QUOTATION_LINE_ITEMS,
  INITIAL_PROJECT_COST_CALCULATIONS,
  INITIAL_PROJECT_MILESTONES,
  INITIAL_VENDOR_MATERIALS,
  INITIAL_FIRE_SUPPRESSION_LIBRARY,
  INITIAL_PROJECTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES_REPORTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TECHNICAL_DEPLOYMENTS,
  INITIAL_FAT_SCHEDULES,
  INITIAL_WBS_PROGRESS,
} from './data/stmjDatabaseSeed';
import { NavigationHeader, ActiveNavTab } from './components/NavigationHeader';
import { QuotationManager } from './components/QuotationManager';
import { ProjectCostCalculator } from './components/ProjectCostCalculator';
import { ProjectMilestonesTracker } from './components/ProjectMilestonesTracker';
import { ProjectExecutionTracker } from './components/ProjectExecutionTracker';
import { EngineeringLibraries } from './components/EngineeringLibraries';
import { SalesReportAnalytics } from './components/SalesReportAnalytics';
import { RelationalSchemaViewer } from './components/RelationalSchemaViewer';
import { RelationalDataExplorer } from './components/RelationalDataExplorer';
import { ProcurementTracker } from './components/ProcurementTracker';
import { VendorPerformance } from './components/VendorPerformance';

const DB_SEED_VERSION = 'stmj_seed_v2_5_vendor_performance';

function loadOrMergeSeed<T>(
  key: string,
  initialData: T[],
  idField: keyof T
): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return initialData;
    const parsed: T[] = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return initialData;

    // Check if any initial seed items are missing in local storage
    const existingIds = new Set(parsed.map(item => item[idField]));
    const missingItems = initialData.filter(item => !existingIds.has(item[idField]));

    if (missingItems.length > 0) {
      const merged = [...parsed, ...missingItems];
      return merged;
    }
    return parsed;
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage, using initial seed:`, e);
    return initialData;
  }
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('quotations');
  const [targetQuotationId, setTargetQuotationId] = useState<string>('Q-2026-001');
  const [targetTableName, setTargetTableName] = useState<string>('quotation');

  // 12 Relational Tables State (with LocalStorage persistence & auto-merging of seed records)
  const [customers, setCustomers] = useState<Customer[]>(() => 
    loadOrMergeSeed('stmj_customers', INITIAL_CUSTOMERS, 'customer_id')
  );

  const [vendors, setVendors] = useState<Vendor[]>(() => 
    loadOrMergeSeed('stmj_vendors', INITIAL_VENDORS, 'vendor_id')
  );

  const [quotations, setQuotations] = useState<Quotation[]>(() => 
    loadOrMergeSeed('stmj_quotations', INITIAL_QUOTATIONS, 'quotation_id')
  );

  const [lineItems, setLineItems] = useState<QuotationLineItem[]>(() => 
    loadOrMergeSeed('stmj_line_items', INITIAL_QUOTATION_LINE_ITEMS, 'item_id')
  );

  const [costCalculations, setCostCalculations] = useState<ProjectCostCalculation[]>(() => 
    loadOrMergeSeed('stmj_cost_calculations', INITIAL_PROJECT_COST_CALCULATIONS, 'cost_calc_id')
  );

  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => 
    loadOrMergeSeed('stmj_milestones', INITIAL_PROJECT_MILESTONES, 'milestone_id')
  );

  const [vendorMaterials, setVendorMaterials] = useState<VendorMaterialItem[]>(() => 
    loadOrMergeSeed('stmj_vendor_materials', INITIAL_VENDOR_MATERIALS, 'material_id')
  );

  const [fireSuppressionLibrary, setFireSuppressionLibrary] = useState<FireSuppressionComponent[]>(() => 
    loadOrMergeSeed('stmj_fire_suppression', INITIAL_FIRE_SUPPRESSION_LIBRARY, 'system_component_id')
  );

  const [projects, setProjects] = useState<ProjectMaster[]>(() => 
    loadOrMergeSeed('stmj_projects', INITIAL_PROJECTS, 'project_id')
  );

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => 
    loadOrMergeSeed('stmj_purchase_orders', INITIAL_PURCHASE_ORDERS, 'po_id')
  );

  const [salesReports, setSalesReports] = useState<SalesReport[]>(() => 
    loadOrMergeSeed('stmj_sales_reports', INITIAL_SALES_REPORTS, 'sales_id')
  );

  const [auditLogs, setAuditLogs] = useState<DatabaseAuditLog[]>(() => 
    loadOrMergeSeed('stmj_audit_logs', INITIAL_AUDIT_LOGS, 'log_id')
  );

  const [deployments, setDeployments] = useState<TechnicalTeamDeployment[]>(() =>
    loadOrMergeSeed('stmj_technical_deployments', INITIAL_TECHNICAL_DEPLOYMENTS, 'deployment_id')
  );

  const [fatSchedules, setFatSchedules] = useState<FatSatSchedule[]>(() =>
    loadOrMergeSeed('stmj_fat_schedules', INITIAL_FAT_SCHEDULES, 'fat_id')
  );

  const [wbsProgressList, setWbsProgressList] = useState<WbsLevel1Progress[]>(() =>
    loadOrMergeSeed('stmj_wbs_progress', INITIAL_WBS_PROGRESS, 'progress_id')
  );

  // Auto-migration & seed verification on mount
  useEffect(() => {
    const currentVersion = localStorage.getItem('stmj_db_version');
    if (currentVersion !== DB_SEED_VERSION) {
      // Force sync missing won quotations, line items, and related records
      setQuotations(prev => {
        const existingIds = new Set(prev.map(q => q.quotation_id));
        const missing = INITIAL_QUOTATIONS.filter(q => !existingIds.has(q.quotation_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setLineItems(prev => {
        const seedMap = new Map(INITIAL_QUOTATION_LINE_ITEMS.map(li => [li.item_id, li]));
        const merged = prev.map(li => {
          const seed = seedMap.get(li.item_id);
          if (!seed) return li;
          return {
            ...seed,
            ...li,
            vendor_po_number: li.vendor_po_number || seed.vendor_po_number,
            vendor_name: li.vendor_name || seed.vendor_name,
            po_status: li.po_status || seed.po_status,
            vendor_payment_status: li.vendor_payment_status || seed.vendor_payment_status,
            lead_time_desc: li.lead_time_desc || seed.lead_time_desc,
            delivered_to_stmj_office: li.delivered_to_stmj_office ?? seed.delivered_to_stmj_office,
            delivered_to_stmj_date: li.delivered_to_stmj_date || seed.delivered_to_stmj_date,
            sent_to_client_site: li.sent_to_client_site ?? seed.sent_to_client_site,
            sent_to_site_date: li.sent_to_site_date || seed.sent_to_site_date,
            arrived_at_site: li.arrived_at_site ?? seed.arrived_at_site,
            arrived_at_site_date: li.arrived_at_site_date || seed.arrived_at_site_date,
            ready_for_installation: li.ready_for_installation ?? seed.ready_for_installation,
            installation_status: li.installation_status || seed.installation_status,
          };
        });
        const existingIds = new Set(merged.map(li => li.item_id));
        const missing = INITIAL_QUOTATION_LINE_ITEMS.filter(li => !existingIds.has(li.item_id));
        return missing.length > 0 ? [...merged, ...missing] : merged;
      });
      setCostCalculations(prev => {
        const existingIds = new Set(prev.map(c => c.cost_calc_id));
        const missing = INITIAL_PROJECT_COST_CALCULATIONS.filter(c => !existingIds.has(c.cost_calc_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setMilestones(prev => {
        const existingIds = new Set(prev.map(m => m.milestone_id));
        const missing = INITIAL_PROJECT_MILESTONES.filter(m => !existingIds.has(m.milestone_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setProjects(prev => {
        const existingIds = new Set(prev.map(p => p.project_id));
        const missing = INITIAL_PROJECTS.filter(p => !existingIds.has(p.project_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setPurchaseOrders(prev => {
        const seedMap = new Map(INITIAL_PURCHASE_ORDERS.map(p => [p.po_id, p]));
        const merged = prev.map(p => {
          const seed = seedMap.get(p.po_id);
          if (!seed) return p;
          return {
            ...seed,
            ...p,
            actual_delivery_date: p.actual_delivery_date || seed.actual_delivery_date,
            satisfaction_score: p.satisfaction_score ?? seed.satisfaction_score,
            quality_score_pct: p.quality_score_pct ?? seed.quality_score_pct,
            on_time_status: p.on_time_status || seed.on_time_status,
            evaluation_notes: p.evaluation_notes || seed.evaluation_notes,
          };
        });
        const existingIds = new Set(merged.map(p => p.po_id));
        const missing = INITIAL_PURCHASE_ORDERS.filter(p => !existingIds.has(p.po_id));
        return missing.length > 0 ? [...merged, ...missing] : merged;
      });
      setSalesReports(prev => {
        const existingIds = new Set(prev.map(s => s.sales_id));
        const missing = INITIAL_SALES_REPORTS.filter(s => !existingIds.has(s.sales_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setDeployments(prev => {
        const existingIds = new Set(prev.map(d => d.deployment_id));
        const missing = INITIAL_TECHNICAL_DEPLOYMENTS.filter(d => !existingIds.has(d.deployment_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setFatSchedules(prev => {
        const existingIds = new Set(prev.map(f => f.fat_id));
        const missing = INITIAL_FAT_SCHEDULES.filter(f => !existingIds.has(f.fat_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      setWbsProgressList(prev => {
        const existingIds = new Set(prev.map(w => w.progress_id));
        const missing = INITIAL_WBS_PROGRESS.filter(w => !existingIds.has(w.progress_id));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
      localStorage.setItem('stmj_db_version', DB_SEED_VERSION);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('stmj_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('stmj_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('stmj_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('stmj_line_items', JSON.stringify(lineItems));
  }, [lineItems]);

  useEffect(() => {
    localStorage.setItem('stmj_cost_calculations', JSON.stringify(costCalculations));
  }, [costCalculations]);

  useEffect(() => {
    localStorage.setItem('stmj_milestones', JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem('stmj_vendor_materials', JSON.stringify(vendorMaterials));
  }, [vendorMaterials]);

  useEffect(() => {
    localStorage.setItem('stmj_fire_suppression', JSON.stringify(fireSuppressionLibrary));
  }, [fireSuppressionLibrary]);

  useEffect(() => {
    localStorage.setItem('stmj_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('stmj_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('stmj_sales_reports', JSON.stringify(salesReports));
  }, [salesReports]);

  useEffect(() => {
    localStorage.setItem('stmj_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('stmj_technical_deployments', JSON.stringify(deployments));
  }, [deployments]);

  useEffect(() => {
    localStorage.setItem('stmj_fat_schedules', JSON.stringify(fatSchedules));
  }, [fatSchedules]);

  useEffect(() => {
    localStorage.setItem('stmj_wbs_progress', JSON.stringify(wbsProgressList));
  }, [wbsProgressList]);

  // Aggregate Record Counts for Schema
  const recordCounts = useMemo<Record<string, number>>(() => ({
    customers: customers.length,
    vendors: vendors.length,
    quotation: quotations.length,
    quotation_line_items: lineItems.length,
    project_cost_calculations: costCalculations.length,
    project_milestones: milestones.length,
    vendor_material_library: vendorMaterials.length,
    fire_suppression_library: fireSuppressionLibrary.length,
    projects: projects.length,
    purchase_orders: purchaseOrders.length,
    sales_report: salesReports.length,
    system_audit_logs: auditLogs.length,
    technical_deployments: deployments.length,
    fat_schedules: fatSchedules.length,
    wbs_progress: wbsProgressList.length,
  }), [
    customers,
    vendors,
    quotations,
    lineItems,
    costCalculations,
    milestones,
    vendorMaterials,
    fireSuppressionLibrary,
    projects,
    purchaseOrders,
    salesReports,
    auditLogs,
    deployments,
    fatSchedules,
    wbsProgressList,
  ]);

  // Full Database State Object for Explorer
  const databaseState = useMemo<Record<string, any[]>>(() => ({
    customers,
    vendors,
    quotation: quotations,
    quotation_line_items: lineItems,
    project_cost_calculations: costCalculations,
    project_milestones: milestones,
    vendor_material_library: vendorMaterials,
    fire_suppression_library: fireSuppressionLibrary,
    projects,
    purchase_orders: purchaseOrders,
    sales_report: salesReports,
    system_audit_logs: auditLogs,
    technical_deployments: deployments,
    fat_schedules: fatSchedules,
    wbs_progress: wbsProgressList,
  }), [
    customers,
    vendors,
    quotations,
    lineItems,
    costCalculations,
    milestones,
    vendorMaterials,
    fireSuppressionLibrary,
    projects,
    purchaseOrders,
    salesReports,
    auditLogs,
    deployments,
    fatSchedules,
    wbsProgressList,
  ]);

  // Total Pipeline Value
  const totalPipelineIdr = useMemo(() => {
    return quotations.reduce((acc, q) => acc + q.total_amount_idr, 0);
  }, [quotations]);

  // CRUD Handlers with Relational Integrity
  const handleUpdateQuotation = (updated: Quotation) => {
    setQuotations(prev => prev.map(q => q.quotation_id === updated.quotation_id ? updated : q));
  };

  const handleAddQuotation = (newQuo: Quotation, initialLines: QuotationLineItem[]) => {
    setQuotations(prev => [newQuo, ...prev]);
    setLineItems(prev => [...prev, ...initialLines]);

    // Create 1:1 ProjectCostCalculation record
    const numId = newQuo.quotation_id.replace('Q-', '');
    const newCostCalc: ProjectCostCalculation = {
      cost_calc_id: `PCC-${numId}`,
      quotation_id: newQuo.quotation_id,
      direct_material_cost_idr: Math.round(newQuo.subtotal_hpp_idr * 0.70),
      piping_fittings_cost_idr: Math.round(newQuo.subtotal_hpp_idr * 0.10),
      installation_labor_cost_idr: Math.round(newQuo.subtotal_hpp_idr * 0.10),
      testing_commissioning_cost_idr: Math.round(newQuo.subtotal_hpp_idr * 0.04),
      tools_equipment_rental_idr: Math.round(newQuo.subtotal_hpp_idr * 0.02),
      transport_mobilization_idr: Math.round(newQuo.subtotal_hpp_idr * 0.015),
      engineering_drawings_permits_idr: Math.round(newQuo.subtotal_hpp_idr * 0.01),
      contingency_cost_idr: Math.round(newQuo.subtotal_hpp_idr * 0.01),
      overhead_admin_cost_idr: Math.round(newQuo.subtotal_hpp_idr * 0.005),
      total_project_hpp_idr: newQuo.subtotal_hpp_idr,
      target_selling_price_idr: newQuo.subtotal_sell_idr,
      expected_gross_profit_idr: newQuo.subtotal_sell_idr - newQuo.subtotal_hpp_idr,
      target_gross_margin_pct: newQuo.target_margin_pct,
      prepared_by: newQuo.created_by,
      reviewed_by: 'Ir. Taufik Hidayat (Technical Director)',
      approval_date: newQuo.quotation_date,
      is_approved: false,
    };
    setCostCalculations(prev => [newCostCalc, ...prev]);

    // Create 4 initial termin billing milestones
    const newMilestones: ProjectMilestone[] = [
      {
        milestone_id: `MST-${numId}-1`,
        quotation_id: newQuo.quotation_id,
        milestone_code: 'DP',
        milestone_name: 'Termin 1: Advance Down Payment (30%)',
        payment_pct: 30,
        amount_idr: Math.round(newQuo.total_amount_idr * 0.30),
        target_date: newQuo.quotation_date,
        deliverables: 'Signed Contract, Client Purchase Order & Proforma Invoice',
        status: 'Pending',
      },
      {
        milestone_id: `MST-${numId}-2`,
        quotation_id: newQuo.quotation_id,
        milestone_code: 'MATERIAL_SITE',
        milestone_name: 'Termin 2: Material Delivery to Site (30%)',
        payment_pct: 30,
        amount_idr: Math.round(newQuo.total_amount_idr * 0.30),
        target_date: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
        deliverables: 'Delivery Note (Surat Jalan), Mill Test Certificates & Visual Inspection Sign-off',
        status: 'Pending',
      },
      {
        milestone_id: `MST-${numId}-3`,
        quotation_id: newQuo.quotation_id,
        milestone_code: 'INSTALLATION',
        milestone_name: 'Termin 3: Mechanical & Piping Installation (30%)',
        payment_pct: 30,
        amount_idr: Math.round(newQuo.total_amount_idr * 0.30),
        target_date: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        deliverables: 'Piping erection, bracket fixing, hydrotest 1.5x design pressure certificate',
        status: 'Pending',
      },
      {
        milestone_id: `MST-${numId}-4`,
        quotation_id: newQuo.quotation_id,
        milestone_code: 'TESTING_BAST',
        milestone_name: 'Termin 4: Testing, Commissioning & Handover (10%)',
        payment_pct: 10,
        amount_idr: Math.round(newQuo.total_amount_idr * 0.10),
        target_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
        deliverables: 'Room integrity fan test pass, Disnaker certification & BAST Handover Sign-off',
        status: 'Pending',
      },
    ];
    setMilestones(prev => [...newMilestones, ...prev]);
  };

  const handleAddLineItem = (newItem: QuotationLineItem) => {
    setLineItems(prev => [...prev, newItem]);

    // Recalculate quotation header totals
    setQuotations(prev => prev.map(q => {
      if (q.quotation_id === newItem.quotation_id) {
        const relatedLines = [...lineItems.filter(li => li.quotation_id === q.quotation_id), newItem];
        const subtotalHpp = relatedLines.reduce((acc, li) => acc + li.total_hpp_idr, 0);
        const subtotalSell = relatedLines.reduce((acc, li) => acc + li.total_price_idr, 0);
        const ppn = subtotalSell * (q.ppn_pct / 100);
        const total = subtotalSell + ppn;
        const grossProfit = subtotalSell - subtotalHpp;
        const marginPct = subtotalSell > 0 ? (grossProfit / subtotalSell) * 100 : q.target_margin_pct;

        return {
          ...q,
          subtotal_hpp_idr: subtotalHpp,
          subtotal_sell_idr: subtotalSell,
          ppn_amount_idr: ppn,
          total_amount_idr: total,
          target_margin_pct: marginPct,
        };
      }
      return q;
    }));
  };

  const handleDeleteLineItem = (itemId: string) => {
    const itemToDelete = lineItems.find(li => li.item_id === itemId);
    if (!itemToDelete) return;

    setLineItems(prev => prev.filter(li => li.item_id !== itemId));

    // Recalculate quotation header
    setQuotations(prev => prev.map(q => {
      if (q.quotation_id === itemToDelete.quotation_id) {
        const relatedLines = lineItems.filter(li => li.quotation_id === q.quotation_id && li.item_id !== itemId);
        const subtotalHpp = relatedLines.reduce((acc, li) => acc + li.total_hpp_idr, 0);
        const subtotalSell = relatedLines.reduce((acc, li) => acc + li.total_price_idr, 0);
        const ppn = subtotalSell * (q.ppn_pct / 100);
        const total = subtotalSell + ppn;
        const grossProfit = subtotalSell - subtotalHpp;
        const marginPct = subtotalSell > 0 ? (grossProfit / subtotalSell) * 100 : q.target_margin_pct;

        return {
          ...q,
          subtotal_hpp_idr: subtotalHpp,
          subtotal_sell_idr: subtotalSell,
          ppn_amount_idr: ppn,
          total_amount_idr: total,
          target_margin_pct: marginPct,
        };
      }
      return q;
    }));
  };

  const handleUpdateCostCalculation = (updated: ProjectCostCalculation) => {
    setCostCalculations(prev => prev.map(c => c.cost_calc_id === updated.cost_calc_id ? updated : c));
  };

  const handleUpdateMilestone = (updated: ProjectMilestone) => {
    setMilestones(prev => prev.map(m => m.milestone_id === updated.milestone_id ? updated : m));
  };

  const handleAddVendorMaterial = (newMat: VendorMaterialItem) => {
    setVendorMaterials(prev => [...prev, newMat]);
  };

  const handleAddFireComponent = (newComp: FireSuppressionComponent) => {
    setFireSuppressionLibrary(prev => [...prev, newComp]);
  };

  const handleBatchAddLineItems = (newItems: QuotationLineItem[]) => {
    if (newItems.length === 0) return;
    setLineItems(prev => {
      const existingIds = new Set(prev.map(li => li.item_id));
      const filtered = newItems.filter(item => !existingIds.has(item.item_id));
      return [...prev, ...filtered];
    });

    // Recalculate quotation
    const quotationId = newItems[0].quotation_id;
    setQuotations(prev => prev.map(q => {
      if (q.quotation_id === quotationId) {
        const existingForQuo = lineItems.filter(li => li.quotation_id === quotationId);
        const allLines = [...existingForQuo, ...newItems];
        const subtotalHpp = allLines.reduce((acc, li) => acc + li.total_hpp_idr, 0);
        const subtotalSell = allLines.reduce((acc, li) => acc + li.total_price_idr, 0);
        const ppn = subtotalSell * (q.ppn_pct / 100);
        const total = subtotalSell + ppn;
        const grossProfit = subtotalSell - subtotalHpp;
        const marginPct = subtotalSell > 0 ? (grossProfit / subtotalSell) * 100 : q.target_margin_pct;

        return {
          ...q,
          subtotal_hpp_idr: subtotalHpp,
          subtotal_sell_idr: subtotalSell,
          ppn_amount_idr: ppn,
          total_amount_idr: total,
          target_margin_pct: marginPct,
        };
      }
      return q;
    }));
  };

  const handleUpdateLineItem = (updatedItem: QuotationLineItem) => {
    setLineItems(prev => prev.map(li => li.item_id === updatedItem.item_id ? updatedItem : li));

    // Recalculate quotation header totals if prices changed
    setQuotations(prev => prev.map(q => {
      if (q.quotation_id === updatedItem.quotation_id) {
        const relatedLines = lineItems.map(li => li.item_id === updatedItem.item_id ? updatedItem : li);
        const subtotalHpp = relatedLines.reduce((acc, li) => acc + li.total_hpp_idr, 0);
        const subtotalSell = relatedLines.reduce((acc, li) => acc + li.total_price_idr, 0);
        const ppn = subtotalSell * (q.ppn_pct / 100);
        const total = subtotalSell + ppn;
        const grossProfit = subtotalSell - subtotalHpp;
        const marginPct = subtotalSell > 0 ? (grossProfit / subtotalSell) * 100 : q.target_margin_pct;

        return {
          ...q,
          subtotal_hpp_idr: subtotalHpp,
          subtotal_sell_idr: subtotalSell,
          ppn_amount_idr: ppn,
          total_amount_idr: total,
          target_margin_pct: marginPct,
        };
      }
      return q;
    }));
  };

  const handleUpdateDeployment = (updated: TechnicalTeamDeployment) => {
    setDeployments(prev => prev.map(d => d.deployment_id === updated.deployment_id ? updated : d));
  };

  const handleUpdateFatSchedule = (updated: FatSatSchedule) => {
    setFatSchedules(prev => prev.map(f => f.fat_id === updated.fat_id ? updated : f));
  };

  const handleUpdateWbsProgress = (updated: WbsLevel1Progress) => {
    setWbsProgressList(prev => prev.map(w => w.progress_id === updated.progress_id ? updated : w));
  };

  const handleResetToSeed = () => {
    localStorage.setItem('stmj_customers', JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem('stmj_vendors', JSON.stringify(INITIAL_VENDORS));
    localStorage.setItem('stmj_quotations', JSON.stringify(INITIAL_QUOTATIONS));
    localStorage.setItem('stmj_line_items', JSON.stringify(INITIAL_QUOTATION_LINE_ITEMS));
    localStorage.setItem('stmj_cost_calculations', JSON.stringify(INITIAL_PROJECT_COST_CALCULATIONS));
    localStorage.setItem('stmj_milestones', JSON.stringify(INITIAL_PROJECT_MILESTONES));
    localStorage.setItem('stmj_vendor_materials', JSON.stringify(INITIAL_VENDOR_MATERIALS));
    localStorage.setItem('stmj_fire_suppression', JSON.stringify(INITIAL_FIRE_SUPPRESSION_LIBRARY));
    localStorage.setItem('stmj_projects', JSON.stringify(INITIAL_PROJECTS));
    localStorage.setItem('stmj_purchase_orders', JSON.stringify(INITIAL_PURCHASE_ORDERS));
    localStorage.setItem('stmj_sales_reports', JSON.stringify(INITIAL_SALES_REPORTS));
    localStorage.setItem('stmj_audit_logs', JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem('stmj_technical_deployments', JSON.stringify(INITIAL_TECHNICAL_DEPLOYMENTS));
    localStorage.setItem('stmj_fat_schedules', JSON.stringify(INITIAL_FAT_SCHEDULES));
    localStorage.setItem('stmj_wbs_progress', JSON.stringify(INITIAL_WBS_PROGRESS));
    localStorage.setItem('stmj_db_version', DB_SEED_VERSION);

    setCustomers(INITIAL_CUSTOMERS);
    setVendors(INITIAL_VENDORS);
    setQuotations(INITIAL_QUOTATIONS);
    setLineItems(INITIAL_QUOTATION_LINE_ITEMS);
    setCostCalculations(INITIAL_PROJECT_COST_CALCULATIONS);
    setMilestones(INITIAL_PROJECT_MILESTONES);
    setVendorMaterials(INITIAL_VENDOR_MATERIALS);
    setFireSuppressionLibrary(INITIAL_FIRE_SUPPRESSION_LIBRARY);
    setProjects(INITIAL_PROJECTS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setSalesReports(INITIAL_SALES_REPORTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setDeployments(INITIAL_TECHNICAL_DEPLOYMENTS);
    setFatSchedules(INITIAL_FAT_SCHEDULES);
    setWbsProgressList(INITIAL_WBS_PROGRESS);
  };

  // Cross-Navigation Shortcuts
  const navigateToQuotation = (quotationId: string) => {
    setTargetQuotationId(quotationId);
    setActiveTab('quotations');
  };

  const openCostCalculator = (quotationId: string) => {
    setTargetQuotationId(quotationId);
    setActiveTab('costing');
  };

  const openMilestones = (quotationId: string) => {
    setTargetQuotationId(quotationId);
    setActiveTab('milestones');
  };

  const openExecutionTracker = (quotationId: string) => {
    setTargetQuotationId(quotationId);
    setActiveTab('execution');
  };

  const openProcurementTracker = (quotationId?: string) => {
    if (quotationId) {
      setTargetQuotationId(quotationId);
    }
    setActiveTab('procurement');
  };

  const openVendorPerformance = () => {
    setActiveTab('vendor_performance');
  };

  const handleUpdatePurchaseOrder = (updatedPo: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.map(po => po.po_id === updatedPo.po_id ? updatedPo : po));
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(v => v.vendor_id === updatedVendor.vendor_id ? updatedVendor : v));
  };

  const navigateToTable = (tableName: string) => {
    setTargetTableName(tableName);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Header with STMJ Branding & Navigation */}
      <NavigationHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        quotationCount={quotations.length}
        totalPipelineIdr={totalPipelineIdr}
        boqCount={lineItems.length}
        onResetSeed={handleResetToSeed}
      />

      {/* Main Dynamic View Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'quotations' && (
          <QuotationManager
            quotations={quotations}
            customers={customers}
            lineItems={lineItems}
            vendorMaterials={vendorMaterials}
            fireSuppressionLibrary={fireSuppressionLibrary}
            selectedQuotationId={targetQuotationId}
            onSelectQuotation={(id) => setTargetQuotationId(id)}
            onUpdateQuotation={handleUpdateQuotation}
            onAddQuotation={handleAddQuotation}
            onAddLineItem={handleAddLineItem}
            onUpdateLineItem={handleUpdateLineItem}
            onBatchAddLineItems={handleBatchAddLineItems}
            onDeleteLineItem={handleDeleteLineItem}
            onOpenCostCalculator={openCostCalculator}
            onOpenMilestones={openMilestones}
            onOpenExecutionTracker={openExecutionTracker}
            onOpenProcurementTracker={openProcurementTracker}
            onResetDatabase={handleResetToSeed}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementTracker
            quotations={quotations}
            customers={customers}
            lineItems={lineItems}
            vendors={vendors}
            onUpdateLineItem={handleUpdateLineItem}
            onNavigateToQuotation={navigateToQuotation}
            onNavigateToExecution={openExecutionTracker}
            onNavigateToVendorPerformance={openVendorPerformance}
          />
        )}

        {activeTab === 'vendor_performance' && (
          <VendorPerformance
            vendors={vendors}
            purchaseOrders={purchaseOrders}
            lineItems={lineItems}
            quotations={quotations}
            customers={customers}
            onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
            onUpdateVendor={handleUpdateVendor}
            onNavigateToQuotation={navigateToQuotation}
            onNavigateToProcurement={openProcurementTracker}
          />
        )}

        {activeTab === 'costing' && (
          <ProjectCostCalculator
            costCalculations={costCalculations}
            quotations={quotations}
            customers={customers}
            selectedQuotationId={targetQuotationId}
            onUpdateCostCalculation={handleUpdateCostCalculation}
            onNavigateToQuotation={navigateToQuotation}
          />
        )}

        {activeTab === 'milestones' && (
          <ProjectMilestonesTracker
            milestones={milestones}
            quotations={quotations}
            customers={customers}
            selectedQuotationId={targetQuotationId}
            onUpdateMilestone={handleUpdateMilestone}
            onNavigateToQuotation={navigateToQuotation}
          />
        )}

        {activeTab === 'execution' && (
          <ProjectExecutionTracker
            quotations={quotations}
            customers={customers}
            lineItems={lineItems}
            milestones={milestones}
            deployments={deployments}
            fatSchedules={fatSchedules}
            wbsProgressList={wbsProgressList}
            selectedQuotationId={targetQuotationId}
            onUpdateLineItem={handleUpdateLineItem}
            onUpdateMilestone={handleUpdateMilestone}
            onUpdateDeployment={handleUpdateDeployment}
            onUpdateFatSchedule={handleUpdateFatSchedule}
            onUpdateWbsProgress={handleUpdateWbsProgress}
            onNavigateToQuotation={navigateToQuotation}
            onNavigateToProcurement={openProcurementTracker}
          />
        )}

        {activeTab === 'libraries' && (
          <EngineeringLibraries
            vendorMaterials={vendorMaterials}
            fireSuppressionLibrary={fireSuppressionLibrary}
            vendors={vendors}
            onAddVendorMaterial={handleAddVendorMaterial}
            onAddFireComponent={handleAddFireComponent}
          />
        )}

        {activeTab === 'sales' && (
          <SalesReportAnalytics
            salesReports={salesReports}
            quotations={quotations}
            customers={customers}
            onNavigateToQuotation={navigateToQuotation}
          />
        )}

        {activeTab === 'schema' && (
          <RelationalSchemaViewer
            onNavigateToTable={navigateToTable}
            recordCounts={recordCounts}
          />
        )}

        {activeTab === 'explorer' && (
          <RelationalDataExplorer
            initialTableName={targetTableName}
            databaseState={databaseState}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>PT Sarana Teknik Mandiri Jaya (STMJ)</strong> — Enterprise Engineering Contracting, RFQ & Costing ERP
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Relational Integrity: 12 Tables • Enforced PK / FK Constraints (1:1, 1:N, N:1, N:N)
          </div>
        </div>
      </footer>
    </div>
  );
}
