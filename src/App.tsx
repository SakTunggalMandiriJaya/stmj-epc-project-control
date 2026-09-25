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
  DatabaseAuditLog 
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
} from './data/stmjDatabaseSeed';
import { NavigationHeader, ActiveNavTab } from './components/NavigationHeader';
import { QuotationManager } from './components/QuotationManager';
import { ProjectCostCalculator } from './components/ProjectCostCalculator';
import { ProjectMilestonesTracker } from './components/ProjectMilestonesTracker';
import { EngineeringLibraries } from './components/EngineeringLibraries';
import { SalesReportAnalytics } from './components/SalesReportAnalytics';
import { RelationalSchemaViewer } from './components/RelationalSchemaViewer';
import { RelationalDataExplorer } from './components/RelationalDataExplorer';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('quotations');
  const [targetQuotationId, setTargetQuotationId] = useState<string>('Q-2026-001');
  const [targetTableName, setTargetTableName] = useState<string>('quotation');

  // 12 Relational Tables State (with LocalStorage persistence)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('stmj_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('stmj_vendors');
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('stmj_quotations');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  const [lineItems, setLineItems] = useState<QuotationLineItem[]>(() => {
    const saved = localStorage.getItem('stmj_line_items');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATION_LINE_ITEMS;
  });

  const [costCalculations, setCostCalculations] = useState<ProjectCostCalculation[]>(() => {
    const saved = localStorage.getItem('stmj_cost_calculations');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_COST_CALCULATIONS;
  });

  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => {
    const saved = localStorage.getItem('stmj_milestones');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_MILESTONES;
  });

  const [vendorMaterials, setVendorMaterials] = useState<VendorMaterialItem[]>(() => {
    const saved = localStorage.getItem('stmj_vendor_materials');
    return saved ? JSON.parse(saved) : INITIAL_VENDOR_MATERIALS;
  });

  const [fireSuppressionLibrary, setFireSuppressionLibrary] = useState<FireSuppressionComponent[]>(() => {
    const saved = localStorage.getItem('stmj_fire_suppression');
    return saved ? JSON.parse(saved) : INITIAL_FIRE_SUPPRESSION_LIBRARY;
  });

  const [projects, setProjects] = useState<ProjectMaster[]>(() => {
    const saved = localStorage.getItem('stmj_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('stmj_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [salesReports, setSalesReports] = useState<SalesReport[]>(() => {
    const saved = localStorage.getItem('stmj_sales_reports');
    return saved ? JSON.parse(saved) : INITIAL_SALES_REPORTS;
  });

  const [auditLogs, setAuditLogs] = useState<DatabaseAuditLog[]>(() => {
    const saved = localStorage.getItem('stmj_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

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
            onUpdateQuotation={handleUpdateQuotation}
            onAddQuotation={handleAddQuotation}
            onAddLineItem={handleAddLineItem}
            onDeleteLineItem={handleDeleteLineItem}
            onOpenCostCalculator={openCostCalculator}
            onOpenMilestones={openMilestones}
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
