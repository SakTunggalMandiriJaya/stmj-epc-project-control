import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, ArrowRight, Copy, Check, RefreshCw, Send, FileText, ChevronDown } from 'lucide-react';
import { RFQItem, VendorQuote, AIRFQAnalysis } from '../types/rfq';
import { analyzeRFQWithAI, generateCounterOfferDoc } from '../services/geminiService';
import { formatCurrency } from '../utils/tcoCalculator';

interface AIIntelligenceViewProps {
  rfq: RFQItem;
  preselectedQuoteForCounterOffer?: VendorQuote | null;
}

export const AIIntelligenceView: React.FC<AIIntelligenceViewProps> = ({
  rfq,
  preselectedQuoteForCounterOffer,
}) => {
  const [analysis, setAnalysis] = useState<AIRFQAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVendorForCounter, setSelectedVendorForCounter] = useState<string>(
    preselectedQuoteForCounterOffer ? preselectedQuoteForCounterOffer.id : (rfq.quotes[0]?.id || '')
  );
  const [targetDiscountPct, setTargetDiscountPct] = useState<number>(15);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await analyzeRFQWithAI(rfq, rfq.userSeats);
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [rfq.id, rfq.quotes.length]);

  useEffect(() => {
    if (preselectedQuoteForCounterOffer) {
      setSelectedVendorForCounter(preselectedQuoteForCounterOffer.id);
    }
  }, [preselectedQuoteForCounterOffer]);

  const selectedQuote = rfq.quotes.find(q => q.id === selectedVendorForCounter) || rfq.quotes[0];
  const generatedLetter = selectedQuote ? generateCounterOfferDoc(rfq, selectedQuote, targetDiscountPct) : '';

  const copyToClipboard = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2500);
  };

  const getSeverityBadge = (sev: 'high' | 'medium' | 'low') => {
    switch (sev) {
      case 'high':
        return 'text-red-400 bg-red-950/40 border-red-800';
      case 'medium':
        return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'low':
      default:
        return 'text-blue-400 bg-blue-950/40 border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">
              AI Procurement Intelligence & Contract Auditor
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Automated scrutiny of submitted proposals: identifies hidden price escalations, non-compliant SLA clauses, and drafts tactical counter-offers leveraging competing bids.
          </p>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-md transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyzing Proposals...' : 'Re-Run AI Audit'}</span>
        </button>
      </div>

      {loading && !analysis ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">Synthesizing Vendor Quotations</h3>
          <p className="text-xs text-neutral-400 mt-1">Cross-referencing pricing tiers, SLAs, and compliance commitments...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Executive Summary & Recommendation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase font-mono tracking-wider">
                Executive Market Synthesis
              </h3>
              <p className="text-xs text-neutral-200 leading-relaxed">
                {analysis.executiveSummary}
              </p>

              {/* SLA & Security Risk Bullet points */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80">
                <h4 className="text-xs font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Key Contractual Risk Observations</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-neutral-300">
                  {analysis.slaAndSecurityRisks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">·</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Vendor Box */}
            <div className="bg-gradient-to-br from-purple-950/30 to-neutral-900 border border-purple-800/40 rounded-lg p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-purple-400 uppercase font-medium">
                  Procurement Recommendation
                </span>
                <h4 className="text-lg font-bold text-white mt-1">
                  {analysis.topRecommendation.vendorName}
                </h4>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {analysis.topRecommendation.rationale}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-900/50">
                <span className="text-[11px] text-neutral-400 block">Projected 3-Year Commitment:</span>
                <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {formatCurrency(analysis.topRecommendation.projected3YearTco)}
                </span>
              </div>
            </div>
          </div>

          {/* Red Flag Contract Vulnerabilities */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Detected Contractual & Commercial Red Flags ({analysis.redFlagsDetected.length})
              </h3>
            </div>

            <div className="divide-y divide-neutral-800/80">
              {analysis.redFlagsDetected.map((rf, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{rf.vendorName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium border ${getSeverityBadge(rf.severity)}`}>
                        {rf.severity} Risk
                      </span>
                    </div>
                    <p className="text-neutral-300 leading-snug">{rf.issue}</p>
                  </div>

                  <div className="sm:max-w-md p-2.5 bg-neutral-950 rounded border border-neutral-800/80 text-[11px] shrink-0">
                    <span className="text-emerald-400 font-medium block mb-0.5">Recommended Remedy:</span>
                    <span className="text-neutral-400">{rf.mitigationStrategy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Counter-Offer Builder */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Executive Counter-Offer & BAFO Letter Generator</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Generate an institutional Best-and-Final-Offer (BAFO) tender response conditioning contract award on price and SLA concessions.
                </p>
              </div>

              {/* Vendor Selector & Discount options */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={selectedVendorForCounter}
                  onChange={(e) => setSelectedVendorForCounter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-white text-xs focus:outline-none"
                >
                  {rfq.quotes.map(q => (
                    <option key={q.id} value={q.id}>{q.vendorName}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded border border-neutral-800">
                  {[10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setTargetDiscountPct(pct)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        targetDiscountPct === pct
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Letter Preview Box */}
            <div className="relative">
              <div className="absolute right-3 top-3 z-10">
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded shadow-xs transition-colors cursor-pointer"
                >
                  {copiedLetter ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Letter</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={generatedLetter}
                rows={14}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-4 font-mono text-[11px] leading-relaxed text-neutral-300 resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
