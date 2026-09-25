/**
 * STMJ Enterprise Engineering & Contracting Database System
 * Complete Relational Architecture with Primary Keys, Foreign Keys & Cardinality
 */

// -------------------------------------------------------------
// Entity 1: Customers / Clients Master (1:N with Quotations & Projects)
// -------------------------------------------------------------
export interface Customer {
  customer_id: string; // PK, e.g. "CUST-001"
  company_name: string; // e.g. "PT Samator Indo Gas Tbk"
  industry: string; // e.g. "Industrial & Medical Gas"
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  npwp_tax_id: string;
  payment_term_days: number; // e.g. 30
}

// -------------------------------------------------------------
// Entity 2: Vendors / Principals Master (1:N with Vendor Material Library & POs)
// -------------------------------------------------------------
export interface Vendor {
  vendor_id: string; // PK, e.g. "VND-001"
  vendor_name: string; // e.g. "PT Hygood Fire Protection Indonesia"
  brand_agency: string; // e.g. "HYGOOD / Johnson Controls"
  contact_person: string;
  email: string;
  phone: string;
  country: string;
  rating: number; // 1-5
  payment_terms: string; // e.g. "50% DP, 50% before dispatch"
}

// -------------------------------------------------------------
// Entity 3: Quotation Master (Header)
// Relations:
// - N:1 to Customers (customer_id)
// - 1:N to QuotationLineItems (quotation_id)
// - 1:1 to ProjectCostCalculation (quotation_id)
// - 1:N to ProjectMilestones (quotation_id)
// - 1:1 to Project (quotation_id)
// - 1:1 to SalesReport (quotation_id)
// -------------------------------------------------------------
export type QuotationStatus = 'Draft' | 'Internal Review' | 'Submitted to Client' | 'Won / PO Received' | 'Revision Requested' | 'Lost';

export interface Quotation {
  quotation_id: string; // PK, e.g. "Q-2026-001"
  quotation_number: string; // e.g. "STMJ/QUO/2026/09/014"
  customer_id: string; // FK -> Customer.customer_id
  project_name: string; // e.g. "FK-5112 Clean Agent Fire Suppression for Gas Compressor Room"
  quotation_date: string; // YYYY-MM-DD
  valid_until: string; // YYYY-MM-DD
  currency: 'IDR' | 'USD';
  subtotal_hpp_idr: number; // Total Cost of Goods
  target_margin_pct: number; // Target Gross Margin (e.g. 28%)
  subtotal_sell_idr: number; // Selling price before tax
  ppn_pct: number; // Default 11%
  ppn_amount_idr: number; // Tax amount
  total_amount_idr: number; // Subtotal + PPN
  payment_terms_desc: string; // e.g. "30% DP, 40% Material On-Site, 20% Testing/BAST, 10% Retention"
  delivery_timeline: string; // e.g. "6 - 8 Weeks after PO & DP"
  status: QuotationStatus;
  created_by: string; // e.g. "Ir. Hendra Gunawan"
  approved_by?: string;
  notes?: string;
}

// -------------------------------------------------------------
// Entity 4: Quotation Line Items (Bill of Quantities / BOQ)
// Relations:
// - N:1 to Quotation (quotation_id)
// - N:1 to VendorMaterialLibrary (material_id, optional)
// -------------------------------------------------------------
export type LineItemCategory = 
  | 'Fire Suppression Equipment'
  | 'Gas Detection Systems'
  | 'Piping, Valves & Fittings'
  | 'Electrical, Detection & Controls'
  | 'Installation, Commissioning & Testing'
  | 'Consumables & Logistics';

export interface QuotationLineItem {
  item_id: string; // PK, e.g. "QLI-101"
  quotation_id: string; // FK -> Quotation.quotation_id
  material_id?: string; // FK -> VendorMaterialLibrary.material_id (Optional)
  item_code: string; // e.g. "HYG-FK-CYL-140L"
  description: string;
  category: LineItemCategory;
  quantity: number;
  uom: string; // "Unit", "Set", "Pcs", "Meter", "Lot", "Man-Day", "Cylinder"
  unit_hpp_idr: number; // Buying cost
  markup_pct: number; // Markup percentage (e.g. 35%)
  unit_price_idr: number; // Selling price per unit
  total_hpp_idr: number; // quantity * unit_hpp_idr
  total_price_idr: number; // quantity * unit_price_idr
  gross_profit_idr: number; // total_price_idr - total_hpp_idr
  margin_pct: number; // (gross_profit / total_price) * 100
}

// -------------------------------------------------------------
// Entity 5: Project Cost Calculations (HPP / COGS Sheet)
// Relations:
// - 1:1 to Quotation (quotation_id)
// -------------------------------------------------------------
export interface ProjectCostCalculation {
  cost_calc_id: string; // PK, e.g. "PCC-2026-001"
  quotation_id: string; // FK -> Quotation.quotation_id (1:1 Unique)
  direct_material_cost_idr: number; // Cylinders, clean agents, nozzles, panels, gas sensors
  piping_fittings_cost_idr: number; // Seamless Sch 40 pipes, elbows, tees, flanges, brackets
  installation_labor_cost_idr: number; // Certified pipe welders, technicians, safety officer
  testing_commissioning_cost_idr: number; // Room integrity fan test, hydrotest, BAST testing
  tools_equipment_rental_idr: number; // Scaffolding, threader machine, hydro pump, boom lift
  transport_mobilization_idr: number; // Trucking to client site, packaging, offloading
  engineering_drawings_permits_idr: number; // Shop drawings, As-built drawings, Disnaker permit
  contingency_cost_idr: number; // Unforeseen site risk buffer (usually 3-5%)
  overhead_admin_cost_idr: number; // Project management, HSE compliance, site supervision
  total_project_hpp_idr: number; // Sum of all bottom-up costs
  target_selling_price_idr: number; // Final proposed contract bid
  expected_gross_profit_idr: number; // Selling price - Total HPP
  target_gross_margin_pct: number; // (gross_profit / selling_price) * 100
  prepared_by: string;
  reviewed_by: string;
  approval_date: string;
  is_approved: boolean;
}

// -------------------------------------------------------------
// Entity 6: Project Milestones (Delivery Stages & Termin Billing)
// Relations:
// - N:1 to Quotation (quotation_id)
// - N:1 to Projects (project_id, optional if pre-award)
// -------------------------------------------------------------
export type MilestoneStatus = 'Pending' | 'In Progress' | 'Achieved / Invoiced' | 'Paid' | 'Delayed';

export interface ProjectMilestone {
  milestone_id: string; // PK, e.g. "MST-301"
  quotation_id: string; // FK -> Quotation.quotation_id
  project_id?: string; // FK -> Projects.project_id
  milestone_code: 'DP' | 'ENG_DRAWING' | 'MATERIAL_SITE' | 'INSTALLATION' | 'TESTING_BAST' | 'RETENTION';
  milestone_name: string; // e.g. "Termin 1: Advance Down Payment (30%)"
  payment_pct: number; // e.g. 30
  amount_idr: number; // Calculated payment tranche
  target_date: string; // YYYY-MM-DD
  actual_date?: string; // YYYY-MM-DD
  deliverables: string; // e.g. "Signed contract, invoice & bank guarantee"
  status: MilestoneStatus;
  invoice_number?: string;
  invoice_date?: string;
  payment_received_date?: string;
}

// -------------------------------------------------------------
// Entity 7: Vendor Material Library (Standard Supplier Catalog)
// Relations:
// - N:1 to Vendors (vendor_id)
// - 1:N to QuotationLineItems (material_id)
// - 1:1 to FireSuppressionLibrary (material_id, optional)
// -------------------------------------------------------------
export interface VendorMaterialItem {
  material_id: string; // PK, e.g. "MAT-HYG-01"
  vendor_id: string; // FK -> Vendor.vendor_id
  brand: string; // e.g. "HYGOOD", "Draeger", "Senko", "Nippon Steel"
  item_code: string; // e.g. "HYG-FK-CYL-140L"
  item_name: string;
  specification: string;
  category: LineItemCategory;
  uom: string; // "Unit", "Kg", "Meter", "Pcs"
  standard_price_idr: number;
  standard_price_usd?: number;
  lead_time_days: number;
  ul_fm_certified: boolean;
  datasheet_url?: string;
}

// -------------------------------------------------------------
// Entity 8: Fire Suppression Library (BOM & Engineering Specification)
// Relations:
// - N:1 to VendorMaterialLibrary (material_id)
// -------------------------------------------------------------
export type FireSystemType = 
  | 'FK-5112 Clean Agent System' 
  | 'HFC-227ea Clean Agent System' 
  | 'IG-541 Inert Gas System' 
  | 'CO2 High Pressure System';

export interface FireSuppressionComponent {
  system_component_id: string; // PK, e.g. "FSL-001"
  material_id: string; // FK -> VendorMaterialItem.material_id
  component_name: string;
  system_type: FireSystemType;
  cylinder_capacity_liters?: number; // e.g. 140, 80, 40
  working_pressure_bar: number; // e.g. 25, 42
  design_standard: string; // e.g. "NFPA 2001 / UL 2166 / FM 5600"
  discharge_time_seconds: number; // e.g. 10 seconds for clean agents
  target_hazard_types: string[]; // e.g. ["Server Room", "Gas Compressor", "MCC Room"]
  mounting_type: 'Wall Bracket' | 'Floor Saddle' | 'Manifold Rack';
  actuation_method: 'Electric Solenoid + Manual Lever' | 'Pneumatic Pilot' | 'Direct Manual';
  notes: string;
}

// -------------------------------------------------------------
// Entity 9: Projects Master (Post-Award Execution) - NEW/ENHANCED
// Relations:
// - 1:1 to Quotation (quotation_id)
// - N:1 to Customers (customer_id)
// - 1:N to ProjectMilestones (project_id)
// - 1:N to PurchaseOrders (project_id)
// -------------------------------------------------------------
export type ProjectStage = 
  | 'Site Survey & Kickoff'
  | 'Engineering & Shop Drawing'
  | 'Procurement & Logistics'
  | 'Mechanical & Piping Installation'
  | 'Electrical & Detection Wiring'
  | 'Hydrostatic & Integrity Testing'
  | 'Commissioning & Handover (BAST)'
  | 'Completed & Closed';

export interface ProjectMaster {
  project_id: string; // PK, e.g. "PRJ-2026-001"
  quotation_id: string; // FK -> Quotation.quotation_id (1:1)
  customer_id: string; // FK -> Customer.customer_id
  project_code: string; // e.g. "PRJ-STMJ-SIG-09"
  project_name: string;
  client_po_number: string; // e.g. "PO-SIG/JKT/2026/0887"
  contract_value_idr: number;
  project_manager: string; // e.g. "Bambang S., ST - PM"
  start_date: string;
  target_completion_date: string;
  current_progress_pct: number;
  stage: ProjectStage;
  location: string;
}

// -------------------------------------------------------------
// Entity 10: Purchase Orders to Vendors (NEW/ENHANCED)
// Relations:
// - N:1 to Projects (project_id)
// - N:1 to Vendors (vendor_id)
// -------------------------------------------------------------
export interface PurchaseOrder {
  po_id: string; // PK, e.g. "PO-VND-001"
  project_id: string; // FK -> Projects.project_id
  vendor_id: string; // FK -> Vendor.vendor_id
  po_number: string; // e.g. "PO/STMJ/VND/2026/09/032"
  issue_date: string;
  delivery_due_date: string;
  total_amount_idr: number;
  payment_status: 'Pending' | 'DP Paid' | 'Fully Paid';
  delivery_status: 'Issued' | 'In Production' | 'In Transit' | 'Received at Site';
}

// -------------------------------------------------------------
// Entity 11: Sales Report / Realized Margins (Commercial Reconciliation)
// Relations:
// - 1:1 to Quotation (quotation_id)
// - N:1 to Customers (customer_id)
// -------------------------------------------------------------
export interface SalesReport {
  sales_id: string; // PK, e.g. "SLS-2026-001"
  quotation_id: string; // FK -> Quotation.quotation_id (1:1)
  customer_id: string; // FK -> Customer.customer_id
  customer_name: string;
  project_name: string;
  po_number: string;
  contract_revenue_idr: number;
  actual_cogs_hpp_idr: number; // Actual spend
  planned_cogs_hpp_idr: number; // Budgeted HPP
  gross_profit_idr: number; // contract_revenue - actual_cogs
  gross_margin_pct: number; // (gross_profit / revenue) * 100
  margin_variance_pct: number; // actual margin vs planned margin
  salesperson_name: string;
  po_receipt_date: string;
  close_date: string;
  status: 'In Execution' | 'Completed & Reconciled' | 'Retention Period';
}

// -------------------------------------------------------------
// Entity 12: Audit & Change Log (Revision History) - NEW/ENHANCED
// -------------------------------------------------------------
export interface DatabaseAuditLog {
  log_id: string; // PK, e.g. "LOG-9001"
  table_name: string;
  record_id: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'PRICE_OVERRIDE' | 'MARGIN_APPROVAL' | 'STATUS_CHANGE';
  actor: string;
  timestamp: string;
  details: string;
}

// -------------------------------------------------------------
// Schema Architecture Metadata (for Interactive ERD Visualizer)
// -------------------------------------------------------------
export interface SchemaTableColumn {
  name: string;
  type: string;
  is_pk?: boolean;
  is_fk?: boolean;
  fk_target?: string; // e.g. "customers.customer_id"
  nullable?: boolean;
  description: string;
}

export interface SchemaTableDefinition {
  table_name: string;
  display_name: string;
  description: string;
  category: 'Masters' | 'Commercial & Quotation' | 'Costing & Engineering' | 'Operations & Execution' | 'Finance & Reporting';
  columns: SchemaTableColumn[];
  relations: {
    type: '1:1' | '1:N' | 'N:1' | 'N:N';
    target_table: string;
    foreign_key: string;
    target_key: string;
    description: string;
  }[];
}
