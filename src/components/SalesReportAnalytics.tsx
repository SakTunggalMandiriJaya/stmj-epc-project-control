import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  Percent,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import { SalesReport, Customer, Quotation } from '../types/stmjDatabase';
import { formatIDR, formatPercent, formatDate, getStatusBadgeClass } from '../utils/stmjFormatters';

interface SalesReportAnalyticsProps {
  salesReports: SalesReport[];
  quotations: Quotation[];
  customers: Customer[];
  onNavigateToQuotation: (quotationId: string) => void;
}

export const SalesReportAnalytics: React.FC<SalesReportAnalyticsProps> = ({
  salesReports,
  quotations,
  customers,
  onNavigateToQuotation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = salesReports.filter(s => {
    return (
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.salesperson_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalContractRevenue = salesReports.reduce((acc, s) => acc + s.contract_revenue_idr, 0);
  const totalActualHpp = salesReports.reduce((acc, s) => acc + s.actual_cogs_hpp_idr, 0);
  const totalPlannedHpp = salesReports.reduce((acc, s) => acc + s.planned_cogs_hpp_idr, 0);
  const totalGrossProfit = totalContractRevenue - totalActualHpp;
  const overallMarginPct = totalContractRevenue > 0 ? (totalGrossProfit / totalContractRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Commercial Financial Realization
            </span>
            <span className="text-xs text-slate-500">
              Won Contracts Tied 1:1 to Customer POs & Realized Margins
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Sales Margin Reconciliation & Commercial Reporting
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Audit of actual incurred COGS (HPP) against budgeted quotation calculations, variance analysis, and net gross profits.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO, client, sales rep..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 bg-white"
          />
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Recognized Contract Revenue</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatIDR(totalContractRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Excluding 11% PPN</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Actual COGS (Incurred HPP)</div>
          <div className="text-xl font-bold text-slate-700 mt-1 font-mono">
            {formatIDR(totalActualHpp)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Planned Budget: {formatIDR(totalPlannedHpp)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Realized Gross Profit</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">
            {formatIDR(totalGrossProfit)}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Net company profit contribution
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Overall Realized Margin</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {formatPercent(overallMarginPct)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Aggregate portfolio margin</div>
        </div>
      </div>

      {/* Sales Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200 text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Sales ID & Client PO</th>
                <th className="px-4 py-3">Customer & Project Scope</th>
                <th className="px-4 py-3">Sales Lead</th>
                <th className="px-4 py-3 text-right">Contract Revenue</th>
                <th className="px-4 py-3 text-right">Actual COGS (HPP)</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3 text-center">Realized Margin</th>
                <th className="px-4 py-3 text-center">Variance</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map(sale => {
                const isPositiveVariance = sale.margin_variance_pct >= 0;

                return (
                  <tr key={sale.sales_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">
                        {sale.sales_id}
                      </div>
                      <div className="text-indigo-700 font-mono text-[11px] font-semibold mt-0.5">
                        {sale.po_number}
                      </div>
                      <button
                        onClick={() => onNavigateToQuotation(sale.quotation_id)}
                        className="text-[10px] text-slate-400 hover:text-indigo-600 font-mono flex items-center gap-1 hover:underline mt-0.5"
                      >
                        Quotation {sale.quotation_id}
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">
                        {sale.customer_name}
                      </div>
                      <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                        {sale.project_name}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800 block">
                        {sale.salesperson_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        PO: {formatDate(sale.po_receipt_date)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                      {formatIDR(sale.contract_revenue_idr)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatIDR(sale.actual_cogs_hpp_idr)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {formatIDR(sale.gross_profit_idr)}
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700">
                      {formatPercent(sale.gross_margin_pct)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isPositiveVariance
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isPositiveVariance ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {sale.margin_variance_pct > 0 ? '+' : ''}
                        {formatPercent(sale.margin_variance_pct)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
