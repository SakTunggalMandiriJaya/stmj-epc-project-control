import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Layers,
  Wrench,
  Truck,
  FileCheck,
  Percent,
  TrendingUp,
  Save
} from 'lucide-react';
import { 
  ProjectCostCalculation, 
  Quotation, 
  Customer 
} from '../types/stmjDatabase';
import { formatIDR, formatPercent, formatDate } from '../utils/stmjFormatters';

interface ProjectCostCalculatorProps {
  costCalculations: ProjectCostCalculation[];
  quotations: Quotation[];
  customers: Customer[];
  selectedQuotationId?: string;
  onUpdateCostCalculation: (updated: ProjectCostCalculation) => void;
  onNavigateToQuotation: (quotationId: string) => void;
}

export const ProjectCostCalculator: React.FC<ProjectCostCalculatorProps> = ({
  costCalculations,
  quotations,
  customers,
  selectedQuotationId,
  onUpdateCostCalculation,
  onNavigateToQuotation,
}) => {
  const [activeQuoId, setActiveQuoId] = useState<string>(
    selectedQuotationId || quotations[0]?.quotation_id || ''
  );

  // Active Cost Calculation (1:1 with Quotation)
  const activeCalc = useMemo(() => {
    return costCalculations.find(c => c.quotation_id === activeQuoId) || costCalculations[0];
  }, [costCalculations, activeQuoId]);

  const activeQuotation = useMemo(() => {
    return quotations.find(q => q.quotation_id === activeCalc?.quotation_id) || quotations[0];
  }, [quotations, activeCalc]);

  const activeCustomer = useMemo(() => {
    if (!activeQuotation) return null;
    return customers.find(c => c.customer_id === activeQuotation.customer_id) || null;
  }, [customers, activeQuotation]);

  // Local Editable Cost Values
  const [directMaterial, setDirectMaterial] = useState<number>(activeCalc?.direct_material_cost_idr || 0);
  const [pipingFittings, setPipingFittings] = useState<number>(activeCalc?.piping_fittings_cost_idr || 0);
  const [installationLabor, setInstallationLabor] = useState<number>(activeCalc?.installation_labor_cost_idr || 0);
  const [testingCommissioning, setTestingCommissioning] = useState<number>(activeCalc?.testing_commissioning_cost_idr || 0);
  const [toolsRental, setToolsRental] = useState<number>(activeCalc?.tools_equipment_rental_idr || 0);
  const [transportMobilization, setTransportMobilization] = useState<number>(activeCalc?.transport_mobilization_idr || 0);
  const [engineeringPermits, setEngineeringPermits] = useState<number>(activeCalc?.engineering_drawings_permits_idr || 0);
  const [contingency, setContingency] = useState<number>(activeCalc?.contingency_cost_idr || 0);
  const [overheadAdmin, setOverheadAdmin] = useState<number>(activeCalc?.overhead_admin_cost_idr || 0);

  // Interactive Target Margin Slider
  const [targetMarginPct, setTargetMarginPct] = useState<number>(activeCalc?.target_gross_margin_pct || 28.5);

  // Sync state if activeCalc changes
  React.useEffect(() => {
    if (activeCalc) {
      setDirectMaterial(activeCalc.direct_material_cost_idr);
      setPipingFittings(activeCalc.piping_fittings_cost_idr);
      setInstallationLabor(activeCalc.installation_labor_cost_idr);
      setTestingCommissioning(activeCalc.testing_commissioning_cost_idr);
      setToolsRental(activeCalc.tools_equipment_rental_idr);
      setTransportMobilization(activeCalc.transport_mobilization_idr);
      setEngineeringPermits(activeCalc.engineering_drawings_permits_idr);
      setContingency(activeCalc.contingency_cost_idr);
      setOverheadAdmin(activeCalc.overhead_admin_cost_idr);
      setTargetMarginPct(activeCalc.target_gross_margin_pct);
    }
  }, [activeCalc]);

  // Dynamically calculate total HPP and target selling price
  const totalHpp = useMemo(() => {
    return (
      directMaterial +
      pipingFittings +
      installationLabor +
      testingCommissioning +
      toolsRental +
      transportMobilization +
      engineeringPermits +
      contingency +
      overheadAdmin
    );
  }, [
    directMaterial,
    pipingFittings,
    installationLabor,
    testingCommissioning,
    toolsRental,
    transportMobilization,
    engineeringPermits,
    contingency,
    overheadAdmin,
  ]);

  const targetSellingPrice = useMemo(() => {
    if (targetMarginPct >= 100) return totalHpp * 2;
    // Price = HPP / (1 - Margin%)
    return Math.round(totalHpp / (1 - targetMarginPct / 100));
  }, [totalHpp, targetMarginPct]);

  const grossProfit = targetSellingPrice - totalHpp;

  // Breakdown percentages for visualization
  const costBreakdown = useMemo(() => {
    if (totalHpp === 0) return [];
    return [
      { label: 'Direct Materials & Clean Agent', amount: directMaterial, color: 'bg-indigo-500' },
      { label: 'Piping, Valves & Fittings (Sch 40)', amount: pipingFittings, color: 'bg-sky-500' },
      { label: 'Certified Installation Labor (6G)', amount: installationLabor, color: 'bg-emerald-500' },
      { label: 'Testing, Hydro & BAST Fan Test', amount: testingCommissioning, color: 'bg-amber-500' },
      { label: 'Tools & Scaffolding Rental', amount: toolsRental, color: 'bg-orange-500' },
      { label: 'Freight, Trucking & Mobilization', amount: transportMobilization, color: 'bg-teal-500' },
      { label: 'Engineering Drawings & Disnaker Permit', amount: engineeringPermits, color: 'bg-purple-500' },
      { label: 'Risk Contingency Buffer', amount: contingency, color: 'bg-rose-500' },
      { label: 'Overhead, Safety PPE & Admin', amount: overheadAdmin, color: 'bg-slate-500' },
    ];
  }, [
    totalHpp,
    directMaterial,
    pipingFittings,
    installationLabor,
    testingCommissioning,
    toolsRental,
    transportMobilization,
    engineeringPermits,
    contingency,
    overheadAdmin,
  ]);

  const handleSaveCalculation = () => {
    if (!activeCalc) return;
    const updated: ProjectCostCalculation = {
      ...activeCalc,
      direct_material_cost_idr: directMaterial,
      piping_fittings_cost_idr: pipingFittings,
      installation_labor_cost_idr: installationLabor,
      testing_commissioning_cost_idr: testingCommissioning,
      tools_equipment_rental_idr: toolsRental,
      transport_mobilization_idr: transportMobilization,
      engineering_drawings_permits_idr: engineeringPermits,
      contingency_cost_idr: contingency,
      overhead_admin_cost_idr: overheadAdmin,
      total_project_hpp_idr: totalHpp,
      target_selling_price_idr: targetSellingPrice,
      expected_gross_profit_idr: grossProfit,
      target_gross_margin_pct: targetMarginPct,
    };
    onUpdateCostCalculation(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quotation Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-100 text-indigo-700">
              1:1 Relational Sheet
            </span>
            <span className="text-xs text-slate-500">
              Linked to Quotation Header
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            Bottom-Up Project Cost Calculation (HPP / COGS Engine)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Strict bottom-up aggregation of equipment, certified welders, Sch 40 piping, room fan integrity testing, and contingency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Select Quotation</label>
            <select
              value={activeQuoId}
              onChange={e => setActiveQuoId(e.target.value)}
              className="text-xs font-medium p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {quotations.map(q => {
                const c = customers.find(cust => cust.customer_id === q.customer_id);
                return (
                  <option key={q.quotation_id} value={q.quotation_id}>
                    {q.quotation_number} - {c?.company_name}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => onNavigateToQuotation(activeQuoId)}
            className="mt-4 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            View Quotation BOQ
          </button>
        </div>
      </div>

      {/* Main Grid: Cost Breakdown Inputs & Live Margin Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Breakdown for 9 Cost Centers */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Direct Cost Centers (HPP Components in IDR)
            </h3>
            <button
              onClick={handleSaveCalculation}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Cost Sheet
            </button>
          </div>

          <div className="space-y-3">
            {/* 1. Direct Material */}
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  1. Direct Materials & Clean Agent Gas (FK-5112 / HYGOOD Cylinders)
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {formatPercent((directMaterial / (totalHpp || 1)) * 100)} of HPP
                </span>
              </div>
              <input
                type="number"
                value={directMaterial}
                onChange={e => setDirectMaterial(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Storage cylinders 140L, FK-5112 chemical fluid, discharge nozzles, and releasing control panel.
              </div>
            </div>

            {/* 2. Piping & Fittings */}
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  2. Seamless Schedule 40 Carbon Steel Piping & High-Pressure Fittings
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {formatPercent((pipingFittings / (totalHpp || 1)) * 100)} of HPP
                </span>
              </div>
              <input
                type="number"
                value={pipingFittings}
                onChange={e => setPipingFittings(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                ASTM A106 Gr. B 2" and 3" seamless pipes, 3000# forged elbows, tees, unions, and pipe hangers.
              </div>
            </div>

            {/* 3. Labor & Welders */}
            <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  3. Installation Labor & Certified 6G Pipe Welders
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {formatPercent((installationLabor / (totalHpp || 1)) * 100)} of HPP
                </span>
              </div>
              <input
                type="number"
                value={installationLabor}
                onChange={e => setInstallationLabor(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Site piping erection crew, electrical instrument cabling, and dedicated site safety officer (HSE).
              </div>
            </div>

            {/* 4. Testing & Commissioning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  4. Testing & Commissioning (BAST)
                </label>
                <input
                  type="number"
                  value={testingCommissioning}
                  onChange={e => setTestingCommissioning(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Room integrity door fan test & pressure hold.
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  5. Tools & Heavy Equipment Rental
                </label>
                <input
                  type="number"
                  value={toolsRental}
                  onChange={e => setToolsRental(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Scaffolding, pipe threading rig & hydro pump.
                </div>
              </div>
            </div>

            {/* 6. Mobilization & Permits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  6. Freight & Site Mobilization
                </label>
                <input
                  type="number"
                  value={transportMobilization}
                  onChange={e => setTransportMobilization(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Trucking to plant site and offloading crane.
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  7. Drawings & Disnaker Permit
                </label>
                <input
                  type="number"
                  value={engineeringPermits}
                  onChange={e => setEngineeringPermits(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Shop drawings, isometric 3D & Disnaker cert.
                </div>
              </div>
            </div>

            {/* 8. Contingency & Overhead */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200">
                <label className="block text-xs font-bold text-rose-900 mb-1">
                  8. Site Risk Contingency (Buffer)
                </label>
                <input
                  type="number"
                  value={contingency}
                  onChange={e => setContingency(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-rose-300"
                />
                <div className="text-[10px] text-rose-700 mt-1">
                  Unforeseen site obstacles or piping rerouting.
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  9. Overhead, PPE & Site Admin
                </label>
                <input
                  type="number"
                  value={overheadAdmin}
                  onChange={e => setOverheadAdmin(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold p-2 bg-white rounded border border-slate-300"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  HSE protective gear, site passes & office admin.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Profit Margin Simulation & Total Summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Margin Slider Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Target Margin Sensitivity Engine
              </h3>
              <span className="text-xl font-bold font-mono text-indigo-600">
                {targetMarginPct.toFixed(1)}%
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Drag to simulate the proposed contract price and resulting gross profit for this tender.
            </p>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="10"
                max="50"
                step="0.5"
                value={targetMarginPct}
                onChange={e => setTargetMarginPct(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>10% (Low Margin Tender)</span>
                <span>28.5% (Standard STMJ)</span>
                <span>50% (High Margin / Specialist)</span>
              </div>
            </div>

            {/* Calculation Cards */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-xs text-slate-600">Total Bottom-Up HPP (COGS):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatIDR(totalHpp)}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
                <span className="text-xs text-emerald-800 font-medium">Expected Gross Profit (IDR):</span>
                <span className="font-mono font-extrabold text-emerald-700 text-base">
                  {formatIDR(grossProfit)}
                </span>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-md space-y-1">
                <div className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">
                  Target Commercial Selling Price (Excl. PPN)
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-white">
                  {formatIDR(targetSellingPrice)}
                </div>
                <div className="text-[11px] text-slate-300 pt-1">
                  PPN 11%: <span className="font-mono">{formatIDR(targetSellingPrice * 0.11)}</span> | Total Bid: <span className="font-mono font-bold text-amber-300">{formatIDR(targetSellingPrice * 1.11)}</span>
                </div>
              </div>
            </div>

            {/* Director Sign-Off Status */}
            <div className="p-3 rounded-lg border flex items-center justify-between text-xs bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2">
                {activeCalc?.is_approved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <div className="font-semibold text-slate-900">
                    {activeCalc?.is_approved ? 'Director Approval Signed' : 'Pending Director Sign-off'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Reviewed by: {activeCalc?.reviewed_by || 'Technical Director'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (activeCalc) {
                    onUpdateCostCalculation({
                      ...activeCalc,
                      is_approved: !activeCalc.is_approved,
                    });
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  activeCalc?.is_approved
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {activeCalc?.is_approved ? 'Revoke Approval' : 'Approve Costing'}
              </button>
            </div>
          </div>

          {/* Visual Cost Allocation Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Cost Allocation by Discipline
            </h4>

            {/* Stacked Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              {costBreakdown.map((item, idx) => {
                const pct = (item.amount / (totalHpp || 1)) * 100;
                if (pct <= 0) return null;
                return (
                  <div
                    key={idx}
                    className={`h-full ${item.color}`}
                    style={{ width: `${pct}%` }}
                    title={`${item.label}: ${formatPercent(pct)}`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 pt-2">
              {costBreakdown.map((item, idx) => {
                const pct = (item.amount / (totalHpp || 1)) * 100;
                if (item.amount <= 0) return null;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-slate-600 line-clamp-1">{item.label}</span>
                    </div>
                    <div className="font-mono text-slate-800 text-[11px] font-medium shrink-0 ml-2">
                      {formatIDR(item.amount)} ({formatPercent(pct)})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
