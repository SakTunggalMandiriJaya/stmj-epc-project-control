import React from 'react';
import { 
  FileText, 
  Calculator, 
  Clock, 
  Package, 
  TrendingUp, 
  Database, 
  Table as TableIcon,
  ShieldCheck,
  Flame,
  Layers,
  RefreshCw,
  Activity,
  HardHat,
  Truck,
  Award
} from 'lucide-react';
import { formatIDR } from '../utils/stmjFormatters';

export type ActiveNavTab = 
  | 'quotations' 
  | 'costing' 
  | 'milestones' 
  | 'procurement'
  | 'vendor_performance'
  | 'execution'
  | 'libraries' 
  | 'sales' 
  | 'schema' 
  | 'explorer';

interface NavigationHeaderProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  quotationCount: number;
  totalPipelineIdr: number;
  boqCount?: number;
  onResetSeed?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onSelectTab,
  quotationCount,
  totalPipelineIdr,
  boqCount,
  onResetSeed,
}) => {
  const navItems: { id: ActiveNavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'quotations', label: 'Quotations & BOQ', icon: <FileText className="w-4 h-4" />, badge: String(quotationCount) },
    { id: 'costing', label: 'Project Costing (HPP)', icon: <Calculator className="w-4 h-4" /> },
    { id: 'milestones', label: 'Milestones & Termin', icon: <Clock className="w-4 h-4" /> },
    { id: 'procurement', label: 'Procurement Tracker', icon: <Truck className="w-4 h-4" />, badge: boqCount !== undefined ? String(boqCount) : undefined },
    { id: 'vendor_performance', label: 'Vendor Performance', icon: <Award className="w-4 h-4" /> },
    { id: 'execution', label: 'Site Execution & WBS (L1-3)', icon: <Activity className="w-4 h-4" /> },
    { id: 'libraries', label: 'Engineering Libraries', icon: <Package className="w-4 h-4" /> },
    { id: 'sales', label: 'Sales & Realized Margins', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'schema', label: 'Relational Schema (ERD)', icon: <Database className="w-4 h-4" /> },
    { id: 'explorer', label: 'All 12 Tables Explorer', icon: <TableIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-lg text-white font-mono">
                STMJ ENTERPRISE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Relational DB
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Engineering Contracting, Fire Suppression (FK-5112), Costing (HPP) & Progress Billing ERP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:block text-right">
            <span className="text-slate-400 text-[10px] block">ACTIVE TENDER PIPELINE</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {formatIDR(totalPipelineIdr)}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          {onResetSeed && (
            <button
              onClick={onResetSeed}
              title="Reset and synchronize relational seed data with all won quotations & BOQ lines"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors text-[11px] font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sync Won Data</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-mono text-[11px]">
              Schema: 12 Tables • PK/FK Verified
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 overflow-x-auto">
        <nav className="flex space-x-1 py-1.5 min-w-max">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
