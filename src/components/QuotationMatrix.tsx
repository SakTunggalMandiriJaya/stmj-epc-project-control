import React, { useState } from 'react';
import { Plus, Check, X, AlertTriangle, ShieldCheck, Zap, ArrowRight, CornerDownRight, FileText, CheckCircle2 } from 'lucide-react';
import { RFQItem, VendorQuote } from '../types/rfq';
import { calculateQuoteTCO, formatCurrency } from '../utils/tcoCalculator';

interface QuotationMatrixProps {
  rfq: RFQItem;
  onOpenAddQuote: () => void;
  onUpdateQuoteStatus: (quoteId: string, newStatus: VendorQuote['status']) => void;
  onSelectForCounterOffer: (quote: VendorQuote) => void;
}

export const QuotationMatrix: React.FC<QuotationMatrixProps> = ({
  rfq,
  onOpenAddQuote,
  onUpdateQuoteStatus,
  onSelectForCounterOffer,
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  if (rfq.quotes.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
        <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Vendor Quotations Submitted Yet</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
          Solicitations have been dispatched to invited vendors. You can manually enter an offline proposal or ingest vendor quotes.
        </p>
        <button
          onClick={onOpenAddQuote}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest Vendor Quotation</span>
        </button>
      </div>
    );
  }

  // Pre-calculate TCO for all quotes
  const quoteTcos = rfq.quotes.map(q => ({
    quote: q,
    tco: calculateQuoteTCO(q, rfq.userSeats, rfq.contractTermMonths),
  }));

  // Find lowest 3yr TCO
  const lowestTco = Math.min(...quoteTcos.map(item => item.tco.threeYearTco));

  return (
    <div className="space-y-4">
      {/* Top action strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-4">
          <span className="text-neutral-400 font-medium">
            Comparing <span className="font-mono text-white font-semibold">{rfq.quotes.length}</span> Vendor Proposals
          </span>
          <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300">
            <input
              type="checkbox"
              checked={highlightDifferences}
              onChange={(e) => setHighlightDifferences(e.target.checked)}
              className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-0"
            />
            <span>Highlight Variance & Best Terms</span>
          </label>
        </div>

        <button
          onClick={onOpenAddQuote}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Competitor Quote</span>
        </button>
      </div>

      {/* Side-by-Side Matrix Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header Row: Vendor Info */}
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950/70">
              <th className="py-4 px-4 w-64 min-w-[240px] text-neutral-400 uppercase font-mono text-[11px] tracking-wider align-top">
                Evaluation Parameter
              </th>
              {quoteTcos.map(({ quote, tco }) => {
                const isLowestTco = tco.threeYearTco === lowestTco;
                return (
                  <th key={quote.id} className="py-4 px-4 min-w-[260px] align-top border-l border-neutral-800/80">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                          {quote.logoInitials}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{quote.vendorName}</div>
                          <div className="text-[11px] text-neutral-400 font-normal">{quote.vendorTier}</div>
                        </div>
                      </div>
                    </div>

                    {/* Status pill & Best Value callout */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${
                        quote.status === 'shortlisted' ? 'text-purple-300 bg-purple-950/50 border-purple-800' :
                        quote.status === 'counter_offered' ? 'text-amber-300 bg-amber-950/50 border-amber-800' :
                        quote.status === 'awarded' ? 'text-emerald-300 bg-emerald-950/50 border-emerald-800' :
                        'text-neutral-400 bg-neutral-950 border-neutral-800'
                      }`}>
                        {quote.status.replace('_', ' ')}
                      </span>
                      {isLowestTco && highlightDifferences && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60">
                          Lowest 3-Yr TCO
                        </span>
                      )}
                    </div>

                    {/* Submitter Contact */}
                    <div className="mt-2 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400">
                      <div>Contact: {quote.contactPerson.name}</div>
                      <div className="text-neutral-500 truncate">{quote.contactPerson.email}</div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800/60">
            {/* SECTION 1: Commercial Schedule */}
            <tr className="bg-neutral-950/90 font-mono text-[11px] text-blue-400 uppercase tracking-wider">
              <td colSpan={rfq.quotes.length + 1} className="py-2.5 px-4 font-semibold">
                1. Commercial Schedule & TCO Projection ({rfq.userSeats} Seats, {rfq.contractTermMonths} Mo.)
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Per-User License Rate</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-white border-l border-neutral-800/80">
                  ${quote.pricing.perUserPerMonth} <span className="text-neutral-500 text-[11px]">/user/mo</span>
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Base Platform Annual Fee</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-neutral-200 border-l border-neutral-800/80">
                  {formatCurrency(quote.pricing.baseAnnualFee)} <span className="text-neutral-500 text-[11px]">/yr</span>
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Implementation & Onboarding (One-Time)</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-neutral-200 border-l border-neutral-800/80">
                  {formatCurrency(quote.pricing.implementationFee)}
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Premium 24/7 SLA Support Add-on</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-neutral-200 border-l border-neutral-800/80">
                  {formatCurrency(quote.pricing.premiumSupportAnnual)} <span className="text-neutral-500 text-[11px]">/yr</span>
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Year 1 Sourcing Discount</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-emerald-400 font-medium border-l border-neutral-800/80">
                  {quote.pricing.year1DiscountPct}% off Year 1
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Multi-Year Commitment Discount</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-emerald-400 font-medium border-l border-neutral-800/80">
                  {quote.pricing.multiYearDiscountPct}% locked
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Renewal Annual Escalation Cap</td>
              {quoteTcos.map(({ quote }) => {
                const isRisky = quote.pricing.renewalEscalationCapPct > 4;
                return (
                  <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums border-l border-neutral-800/80">
                    <span className={isRisky && highlightDifferences ? 'text-amber-400 font-semibold' : 'text-neutral-200'}>
                      {quote.pricing.renewalEscalationCapPct}% max / yr
                    </span>
                    {isRisky && highlightDifferences && (
                      <span className="text-[10px] text-amber-500 block">Exceeds 4% guideline</span>
                    )}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Invoicing & Payment Terms</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 text-neutral-300 text-[11px] border-l border-neutral-800/80">
                  {quote.pricing.paymentTerms}
                </td>
              ))}
            </tr>

            {/* Total 1st Year Cost Highlight */}
            <tr className="bg-neutral-950/40">
              <td className="py-3 px-4 text-neutral-200 font-semibold">Year 1 Total Outlay</td>
              {quoteTcos.map(({ quote, tco }) => (
                <td key={quote.id} className="py-3 px-4 font-mono tabular-nums font-bold text-white text-sm border-l border-neutral-800/80">
                  {formatCurrency(tco.year1Cost)}
                </td>
              ))}
            </tr>

            {/* Normalized 3-Year TCO Highlight */}
            <tr className="bg-blue-950/20 border-y border-blue-900/40">
              <td className="py-3.5 px-4 text-blue-200 font-bold">
                <div>Normalized 3-Year TCO</div>
                <div className="text-[10px] text-neutral-400 font-normal">All licenses, support, onboarding & renewals</div>
              </td>
              {quoteTcos.map(({ quote, tco }) => {
                const isLowest = tco.threeYearTco === lowestTco;
                return (
                  <td key={quote.id} className="py-3.5 px-4 font-mono tabular-nums border-l border-neutral-800/80">
                    <div className={`text-base font-bold ${isLowest ? 'text-emerald-400' : 'text-white'}`}>
                      {formatCurrency(tco.threeYearTco)}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      ${tco.effectiveMonthlyPerUser} <span className="text-neutral-500">/user/mo effective</span>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* SECTION 2: SLA & Technical Support */}
            <tr className="bg-neutral-950/90 font-mono text-[11px] text-blue-400 uppercase tracking-wider">
              <td colSpan={rfq.quotes.length + 1} className="py-2.5 px-4 font-semibold">
                2. Enterprise SLA & Operational Commitments
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Uptime Guarantee SLA</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-white border-l border-neutral-800/80">
                  {quote.sla.uptimeGuaranteePct}%
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Critical P1 Incident Response</td>
              {quoteTcos.map(({ quote }) => {
                const isFast = quote.sla.p1ResponseMinutes <= 15;
                return (
                  <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums border-l border-neutral-800/80">
                    <span className={isFast ? 'text-emerald-400 font-medium' : 'text-neutral-300'}>
                      {quote.sla.p1ResponseMinutes} minutes
                    </span>
                    <span className="text-[10px] text-neutral-500 block">24/7 follow-the-sun</span>
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Dedicated Enterprise CSM</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 text-neutral-300 border-l border-neutral-800/80">
                  {quote.sla.dedicatedCsm ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Included
                    </span>
                  ) : (
                    <span className="text-neutral-500">Shared Pool</span>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Sandbox / Staging Tenants</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-neutral-200 border-l border-neutral-800/80">
                  {quote.sla.sandboxEnvironments} environments
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Data Residency Regions</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 text-neutral-300 text-[11px] border-l border-neutral-800/80">
                  {quote.sla.dataResidency}
                </td>
              ))}
            </tr>

            {/* SECTION 3: Compliance & Security */}
            <tr className="bg-neutral-950/90 font-mono text-[11px] text-blue-400 uppercase tracking-wider">
              <td colSpan={rfq.quotes.length + 1} className="py-2.5 px-4 font-semibold">
                3. Security, InfoSec & Compliance Audit Status
              </td>
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">SOC 2 Type II Certified</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 border-l border-neutral-800/80">
                  {quote.compliance.soc2Type2 ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Verified</span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Incomplete</span>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">ISO 27001 Certified</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 border-l border-neutral-800/80">
                  {quote.compliance.iso27001 ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Verified</span>
                  ) : (
                    <span className="text-neutral-500">Not Certified</span>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">HIPAA BAA Available</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 border-l border-neutral-800/80">
                  {quote.compliance.hipaaBaa ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Standard Rider</span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Roadmap only</span>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <td className="py-2.5 px-4 text-neutral-300 font-medium">Disaster Recovery RPO / RTO</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-2.5 px-4 font-mono tabular-nums text-neutral-300 text-[11px] border-l border-neutral-800/80">
                  RPO: {quote.compliance.disasterRecoveryRpoMinutes}m / RTO: {quote.compliance.disasterRecoveryRtoMinutes}m
                </td>
              ))}
            </tr>

            {/* SECTION 4: Concessions & Special Clauses */}
            <tr className="bg-neutral-950/90 font-mono text-[11px] text-blue-400 uppercase tracking-wider">
              <td colSpan={rfq.quotes.length + 1} className="py-2.5 px-4 font-semibold">
                4. Concessions & Strategic Incentives Offered
              </td>
            </tr>

            <tr>
              <td className="py-3 px-4 text-neutral-300 font-medium align-top">Commercial Concessions</td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-3 px-4 text-neutral-300 text-[11px] align-top border-l border-neutral-800/80">
                  <ul className="space-y-1.5 list-disc list-inside text-neutral-300">
                    {quote.concessionsOffered.map((c, i) => (
                      <li key={i} className="leading-snug">{c}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Quick Actions Row */}
            <tr className="bg-neutral-950/70">
              <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px] uppercase">
                Procurement Decision
              </td>
              {quoteTcos.map(({ quote }) => (
                <td key={quote.id} className="py-3.5 px-4 border-l border-neutral-800/80">
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => onSelectForCounterOffer(quote)}
                      className="w-full text-center px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 rounded transition-colors"
                    >
                      Draft Counter-Offer
                    </button>
                    {quote.status !== 'shortlisted' && (
                      <button
                        onClick={() => onUpdateQuoteStatus(quote.id, 'shortlisted')}
                        className="w-full text-center px-2.5 py-1 text-xs font-medium text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/60 rounded transition-colors"
                      >
                        Shortlist Vendor
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
