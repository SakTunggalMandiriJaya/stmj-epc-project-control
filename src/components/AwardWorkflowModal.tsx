import React, { useState } from 'react';
import { X, Award, CheckCircle2, ShieldCheck, Download, Printer } from 'lucide-react';
import { RFQItem, VendorQuote } from '../types/rfq';
import { calculateQuoteTCO, formatCurrency } from '../utils/tcoCalculator';

interface AwardWorkflowModalProps {
  rfq: RFQItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAward: (quoteId: string, notes: string) => void;
}

export const AwardWorkflowModal: React.FC<AwardWorkflowModalProps> = ({
  rfq,
  isOpen,
  onClose,
  onConfirmAward,
}) => {
  if (!isOpen) return null;

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(
    rfq.awardedQuoteId || rfq.quotes[0]?.id || ''
  );
  const [awardNotes, setAwardNotes] = useState(
    rfq.awardNotes ||
    'Selected based on lowest total 3-year cost of ownership, comprehensive SOC2/ISO compliance verification, and commitments to a 15-minute emergency P1 SLA with an annual renewal escalation cap of <= 3.5%.'
  );
  const [procurementSignoff, setProcurementSignoff] = useState(true);
  const [infosecSignoff, setInfosecSignoff] = useState(true);
  const [financeSignoff, setFinanceSignoff] = useState(true);
  const [showPrintableMemo, setShowPrintableMemo] = useState(false);

  const selectedQuote = rfq.quotes.find(q => q.id === selectedQuoteId) || rfq.quotes[0];
  const tco = selectedQuote ? calculateQuoteTCO(selectedQuote, rfq.userSeats, rfq.contractTermMonths) : null;

  const handleAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteId) return;
    onConfirmAward(selectedQuoteId, awardNotes);
    setShowPrintableMemo(true);
  };

  const memoText = selectedQuote && tco ? `EXECUTIVE PROCUREMENT INTENT TO AWARD MEMORANDUM

TO: Chief Financial Officer & General Counsel
FROM: ${rfq.leadBuyer} (Procurement Lead)
DATE: ${new Date().toISOString().split('T')[0]}
SUBJECT: Contract Award Recommendation — ${rfq.rfqNumber} (${rfq.title})

1. RECOMMENDED VENDOR:
   - Winning Entity: ${selectedQuote.vendorName}
   - Contact: ${selectedQuote.contactPerson.name} (${selectedQuote.contactPerson.email})
   - Sourced Seats: ${rfq.userSeats.toLocaleString()} seats
   - Contract Term: ${rfq.contractTermMonths} Months (${rfq.contractTermMonths / 12} Years)

2. COMMERCIAL TERMS & TCO JUSTIFICATION:
   - Annual Base License: ${formatCurrency(selectedQuote.pricing.baseAnnualFee)}
   - Effective Seat Rate: $${selectedQuote.pricing.perUserPerMonth}/user/month
   - One-Time Implementation: ${formatCurrency(selectedQuote.pricing.implementationFee)}
   - Year 1 Total Outlay: ${formatCurrency(tco.year1Cost)}
   - Normalized 3-Year TCO: ${formatCurrency(tco.threeYearTco)}
   - Projected 3-Year Sourced Savings: ${formatCurrency(Math.max(0, (rfq.targetBudgetAnnual * 3) - tco.threeYearTco))}
   - Renewal Escalation Ceiling: Capped at <= ${selectedQuote.pricing.renewalEscalationCapPct}% per annum.

3. GOVERNANCE & COMPLIANCE SIGNOFF:
   - Information Security: Verified SOC 2 Type II & ISO 27001 audit attestation on file.
   - SLA Guarantee: ${selectedQuote.sla.uptimeGuaranteePct}% monthly availability with 15-minute P1 engineering escalation.
   - Steering Committee Deliberation: ${awardNotes}

4. AUTHORIZATION STATUS:
   [X] Strategic Sourcing Lead: Approved (${rfq.leadBuyer})
   [X] Information Security / CISO: Approved (SOC2 / SCC Compliance Confirmed)
   [X] VP Finance / FP&A: Approved (Within Authorized Capital Budget)
` : '';

  const downloadMemo = () => {
    const blob = new Blob([memoText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rfq.rfqNumber}-Award-Memorandum.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Enterprise Contract Award Authorization
              </h3>
              <p className="text-xs text-neutral-400">
                Formal committee sign-off and issuance of Intent to Award notice
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showPrintableMemo ? (
          <form onSubmit={handleAward} className="p-5 overflow-y-auto space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                Select Winning Vendor Quote *
              </label>
              <div className="space-y-2">
                {rfq.quotes.map(q => {
                  const qTco = calculateQuoteTCO(q, rfq.userSeats, rfq.contractTermMonths);
                  const isSelected = q.id === selectedQuoteId;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuoteId(q.id)}
                      className={`p-3 rounded border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-neutral-950 border-emerald-500 shadow-xs' 
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-neutral-700'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{q.vendorName}</div>
                          <div className="text-[11px] text-neutral-400">
                            ${q.pricing.perUserPerMonth}/user/mo · {q.sla.uptimeGuaranteePct}% SLA · {q.sla.p1ResponseMinutes}m P1
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums">
                        <div className="font-bold text-white text-sm">{formatCurrency(qTco.threeYearTco)}</div>
                        <div className="text-[10px] text-neutral-500">3-Yr Commitment</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Executive Award Justification & Procurement Findings
              </label>
              <textarea
                rows={3}
                required
                value={awardNotes}
                onChange={(e) => setAwardNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white text-xs leading-relaxed"
                placeholder="Document evaluation steering committee findings and rationale..."
              />
            </div>

            {/* Committee Tri-Signoff Checkboxes */}
            <div className="p-3.5 bg-neutral-950 rounded border border-neutral-800 space-y-2">
              <span className="text-[11px] text-neutral-400 font-mono uppercase block font-semibold">
                Required Steering Committee Attestation
              </span>
              
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300">
                <input
                  type="checkbox"
                  checked={procurementSignoff}
                  onChange={(e) => setProcurementSignoff(e.target.checked)}
                  required
                  className="rounded bg-neutral-900 border-neutral-700 text-emerald-500"
                />
                <span>Strategic Procurement: Competitive tender conducted per enterprise sourcing bylaws</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300">
                <input
                  type="checkbox"
                  checked={infosecSignoff}
                  onChange={(e) => setInfosecSignoff(e.target.checked)}
                  required
                  className="rounded bg-neutral-900 border-neutral-700 text-emerald-500"
                />
                <span>Information Security (InfoSec): SOC 2 Type II audit reports verified</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300">
                <input
                  type="checkbox"
                  checked={financeSignoff}
                  onChange={(e) => setFinanceSignoff(e.target.checked)}
                  required
                  className="rounded bg-neutral-900 border-neutral-700 text-emerald-500"
                />
                <span>Finance & Legal: 3-Year capital expenditure committed within approved annual operating budget</span>
              </label>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!procurementSignoff || !infosecSignoff || !financeSignoff}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded shadow-xs cursor-pointer"
              >
                Execute Award & Generate Memo
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Contract Award Successfully Executed</span>
              </div>
              <button
                onClick={downloadMemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sourcing Memo</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={15}
              value={memoText}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-4 font-mono text-[11px] leading-relaxed text-neutral-300 resize-none focus:outline-none"
            />

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
