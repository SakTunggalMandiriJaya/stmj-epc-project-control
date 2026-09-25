import React, { useState } from 'react';
import { Sliders, RotateCcw, TrendingDown, Award, HelpCircle, ArrowUpRight } from 'lucide-react';
import { RFQItem, RFQScoringWeights } from '../types/rfq';
import { scoreQuote, formatCurrency, calculateQuoteTCO } from '../utils/tcoCalculator';

interface TCOBenchmarkViewProps {
  rfq: RFQItem;
  onUpdateScoringWeights: (weights: RFQScoringWeights) => void;
}

export const TCOBenchmarkView: React.FC<TCOBenchmarkViewProps> = ({
  rfq,
  onUpdateScoringWeights,
}) => {
  const [simulatedSeats, setSimulatedSeats] = useState<number>(rfq.userSeats);
  const [termMonths, setTermMonths] = useState<12 | 24 | 36>(rfq.contractTermMonths);
  const [weights, setWeights] = useState<RFQScoringWeights>(rfq.scoringWeights);

  const handleWeightChange = (key: keyof RFQScoringWeights, val: number) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    onUpdateScoringWeights(updated);
  };

  const resetWeights = () => {
    const defaultW: RFQScoringWeights = { pricing: 35, features: 30, security: 20, sla: 15 };
    setWeights(defaultW);
    onUpdateScoringWeights(defaultW);
  };

  // Score all quotes with current simulated parameters
  const scoredQuotes = rfq.quotes.map(q => 
    scoreQuote(q, { ...rfq, contractTermMonths: termMonths }, simulatedSeats, rfq.quotes, weights)
  ).sort((a, b) => b.normalizedCompositeScore - a.normalizedCompositeScore);

  const winningBid = scoredQuotes[0];
  const maxTco = Math.max(...scoredQuotes.map(s => s.threeYearTco));

  return (
    <div className="space-y-6">
      {/* What-If Simulation Controls Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Interactive Scale & Term Simulator</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Simulate volume expansion or shorter commitments to test vendor price breaks and inflection points.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Contract Term:</span>
            {([12, 24, 36] as const).map((months) => (
              <button
                key={months}
                onClick={() => setTermMonths(months)}
                className={`px-2.5 py-1 rounded font-mono text-xs transition-colors ${
                  termMonths === months
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {months}m ({months / 12}y)
              </button>
            ))}
          </div>
        </div>

        {/* Seat Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">
              Simulated User License Count:
            </span>
            <span className="font-mono text-base font-bold text-blue-400 tabular-nums">
              {simulatedSeats.toLocaleString()} seats
              {simulatedSeats !== rfq.userSeats && (
                <span className="text-xs font-normal text-neutral-500 ml-2">
                  (Baseline: {rfq.userSeats.toLocaleString()})
                </span>
              )}
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="2500"
            step="25"
            value={simulatedSeats}
            onChange={(e) => setSimulatedSeats(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>50 seats</span>
            <span>500 seats</span>
            <span>1,000 seats</span>
            <span>1,800 seats</span>
            <span>2,500 seats</span>
          </div>
        </div>
      </div>

      {/* Winning Bid Summary Callout */}
      {winningBid && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-800/50 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-300 font-bold shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-emerald-400 font-medium uppercase font-mono tracking-wider">
                Scoring Leader Under Current Weights
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                {winningBid.vendorName}
              </div>
              <p className="text-xs text-neutral-300 mt-1">
                Composite Score: <span className="font-mono font-bold text-emerald-400">{winningBid.normalizedCompositeScore} / 100</span> · Projected 3-Year TCO: <span className="font-mono font-bold text-white">{formatCurrency(winningBid.threeYearTco)}</span> ({formatCurrency(winningBid.effectiveMonthlyPerUser)}/user/mo)
              </p>
            </div>
          </div>

          <div className="text-right text-xs shrink-0 bg-neutral-950/80 p-3 rounded border border-neutral-800">
            <div className="text-neutral-500">Projected 3-Year Savings vs Budget</div>
            <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(winningBid.savingsVsBudgetThreeYear)}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Target 3Y Budget: {formatCurrency(rfq.targetBudgetAnnual * 3)}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Visual TCO Breakdown & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {scoredQuotes.map((item, idx) => {
          const isWinner = idx === 0;
          const barWidth = maxTco > 0 ? (item.threeYearTco / maxTco) * 100 : 0;
          return (
            <div
              key={item.vendorId}
              className={`p-4 rounded-lg border transition-all ${
                isWinner 
                  ? 'bg-neutral-900/90 border-emerald-600/60 shadow-sm' 
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-neutral-400">Rank #{idx + 1}</span>
                <span className="font-mono font-bold text-sm text-blue-400">
                  {item.normalizedCompositeScore} <span className="text-[10px] text-neutral-500 font-normal">/ 100</span>
                </span>
              </div>

              <div className="mt-2">
                <h3 className="font-semibold text-white text-base truncate">{item.vendorName}</h3>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Effective ${item.effectiveMonthlyPerUser}/user/mo
                </div>
              </div>

              {/* Total 3-Year TCO */}
              <div className="mt-4 pt-3 border-t border-neutral-800">
                <div className="text-xs text-neutral-500">Normalized 3-Year TCO</div>
                <div className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                  {formatCurrency(item.threeYearTco)}
                </div>
              </div>

              {/* Cost bar representation */}
              <div className="mt-3">
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      isWinner ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Yearly Breakdown */}
              <div className="mt-4 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Year 1 (incl. onboarding):</span>
                  <span className="tabular-nums text-neutral-200">{formatCurrency(item.year1Cost)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Year 2 (recurring):</span>
                  <span className="tabular-nums text-neutral-200">{formatCurrency(item.year2Cost)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Year 3 (recurring):</span>
                  <span className="tabular-nums text-neutral-200">{formatCurrency(item.year3Cost)}</span>
                </div>
              </div>

              {/* Scoring Category Micro-Bars */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-2 text-[11px]">
                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Pricing Score ({weights.pricing}% wt)</span>
                    <span className="font-mono tabular-nums text-neutral-200">{item.commercialScore}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1 rounded">
                    <div className="bg-blue-500 h-1 rounded" style={{ width: `${item.commercialScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Functional Fit ({weights.features}% wt)</span>
                    <span className="font-mono tabular-nums text-neutral-200">{item.featureScore}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1 rounded">
                    <div className="bg-purple-500 h-1 rounded" style={{ width: `${item.featureScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Security & Audit ({weights.security}% wt)</span>
                    <span className="font-mono tabular-nums text-neutral-200">{item.securityScore}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1 rounded">
                    <div className="bg-emerald-500 h-1 rounded" style={{ width: `${item.securityScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>SLA & Response ({weights.sla}% wt)</span>
                    <span className="font-mono tabular-nums text-neutral-200">{item.slaScore}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1 rounded">
                    <div className="bg-amber-500 h-1 rounded" style={{ width: `${item.slaScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Criteria Weight Customization Panel */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Evaluation Scoring Rubric Weighting
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Customize committee evaluation priorities to reflect procurement, security, or feature focus.
            </p>
          </div>
          <button
            onClick={resetWeights}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Weights</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
            <div className="flex justify-between text-xs font-medium text-neutral-300">
              <span>Commercial & TCO</span>
              <span className="font-mono tabular-nums text-blue-400">{weights.pricing}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={weights.pricing}
              onChange={(e) => handleWeightChange('pricing', Number(e.target.value))}
              className="w-full mt-2 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
            <div className="flex justify-between text-xs font-medium text-neutral-300">
              <span>Functional Scope</span>
              <span className="font-mono tabular-nums text-purple-400">{weights.features}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={weights.features}
              onChange={(e) => handleWeightChange('features', Number(e.target.value))}
              className="w-full mt-2 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
            <div className="flex justify-between text-xs font-medium text-neutral-300">
              <span>Security & InfoSec</span>
              <span className="font-mono tabular-nums text-emerald-400">{weights.security}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={weights.security}
              onChange={(e) => handleWeightChange('security', Number(e.target.value))}
              className="w-full mt-2 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="p-3 bg-neutral-950 rounded border border-neutral-800">
            <div className="flex justify-between text-xs font-medium text-neutral-300">
              <span>SLA & Operational Support</span>
              <span className="font-mono tabular-nums text-amber-400">{weights.sla}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={weights.sla}
              onChange={(e) => handleWeightChange('sla', Number(e.target.value))}
              className="w-full mt-2 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
