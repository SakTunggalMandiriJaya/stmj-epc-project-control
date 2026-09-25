import { RFQItem, VendorQuote, TCOBreakdown, RFQScoringWeights } from '../types/rfq';

export function calculateQuoteTCO(quote: VendorQuote, seats: number, termMonths: 12 | 24 | 36): {
  year1Cost: number;
  year2Cost: number;
  year3Cost: number;
  threeYearTco: number;
  effectiveMonthlyPerUser: number;
} {
  const p = quote.pricing;
  
  // Base license calculation per year
  const rawAnnualLicense = (seats * p.perUserPerMonth * 12) + p.baseAnnualFee;
  
  // Year 1 calculation
  const y1DiscountFactor = 1 - (p.year1DiscountPct / 100);
  const multiYearDiscountFactor = termMonths >= 24 ? 1 - (p.multiYearDiscountPct / 100) : 1;
  
  const y1License = rawAnnualLicense * y1DiscountFactor * multiYearDiscountFactor;
  const year1Cost = Math.round(
    y1License + 
    p.implementationFee + 
    p.premiumSupportAnnual + 
    p.estimatedOverageAnnual
  );

  // Year 2 calculation
  const escalationFactorY2 = 1 + (p.renewalEscalationCapPct / 100);
  const y2License = rawAnnualLicense * multiYearDiscountFactor * escalationFactorY2;
  const year2Cost = Math.round(
    y2License + 
    p.premiumSupportAnnual + 
    p.estimatedOverageAnnual
  );

  // Year 3 calculation
  const escalationFactorY3 = escalationFactorY2 * (1 + (p.renewalEscalationCapPct / 100));
  const y3License = rawAnnualLicense * multiYearDiscountFactor * escalationFactorY3;
  const year3Cost = Math.round(
    y3License + 
    p.premiumSupportAnnual + 
    p.estimatedOverageAnnual
  );

  let threeYearTco = year1Cost + year2Cost + year3Cost;
  if (termMonths === 12) {
    threeYearTco = year1Cost * 3; // normalized 3yr comparison
  } else if (termMonths === 24) {
    threeYearTco = year1Cost + year2Cost + Math.round(year2Cost * 1.05);
  }

  const effectiveMonthlyPerUser = seats > 0 
    ? Math.round((threeYearTco / 36 / seats) * 100) / 100 
    : 0;

  return {
    year1Cost,
    year2Cost,
    year3Cost,
    threeYearTco,
    effectiveMonthlyPerUser,
  };
}

export function scoreQuote(
  quote: VendorQuote, 
  rfq: RFQItem, 
  seats: number, 
  allQuotes: VendorQuote[],
  weights: RFQScoringWeights
): TCOBreakdown {
  const tco = calculateQuoteTCO(quote, seats, rfq.contractTermMonths);
  const target3YearBudget = rfq.targetBudgetAnnual * 3;
  const savingsVsBudgetThreeYear = target3YearBudget - tco.threeYearTco;

  // 1. Commercial score (0-100)
  // Find min and max TCO among quotes for relative normalization
  const tcoList = allQuotes.map(q => calculateQuoteTCO(q, seats, rfq.contractTermMonths).threeYearTco);
  const minTco = Math.min(...tcoList);
  const maxTco = Math.max(...tcoList);
  
  let commercialScore = 80;
  if (maxTco > minTco) {
    // Min TCO gets 100, Max gets 60
    commercialScore = Math.round(100 - ((tco.threeYearTco - minTco) / (maxTco - minTco)) * 40);
  }
  if (tco.threeYearTco <= target3YearBudget) {
    commercialScore = Math.min(100, commercialScore + 5);
  } else {
    commercialScore = Math.max(20, commercialScore - 15);
  }

  // 2. Feature / Requirements score (0-100)
  let totalRequirementWeight = 0;
  let earnedFeatureWeight = 0;

  rfq.requirements.forEach(req => {
    const w = req.weight || 3;
    totalRequirementWeight += w;
    const fulfillment = quote.fulfillment.find(f => f.requirementId === req.id);
    if (!fulfillment) return;

    if (fulfillment.complianceLevel === 'full') {
      earnedFeatureWeight += w;
    } else if (fulfillment.complianceLevel === 'partial') {
      earnedFeatureWeight += w * 0.65;
    } else if (fulfillment.complianceLevel === 'custom_roadmap') {
      earnedFeatureWeight += w * 0.35;
    }
  });

  const featureScore = totalRequirementWeight > 0 
    ? Math.round((earnedFeatureWeight / totalRequirementWeight) * 100) 
    : 75;

  // 3. Security Score (0-100)
  let secScore = 40;
  if (quote.compliance.soc2Type2) secScore += 20;
  if (quote.compliance.iso27001) secScore += 15;
  if (quote.compliance.gdprCompliant) secScore += 10;
  if (quote.compliance.hipaaBaa) secScore += 10;
  if (quote.compliance.singleTenantOption) secScore += 5;
  const securityScore = Math.min(100, secScore);

  // 4. SLA & Support Score (0-100)
  let slaScore = 50;
  if (quote.sla.uptimeGuaranteePct >= 99.99) slaScore += 20;
  else if (quote.sla.uptimeGuaranteePct >= 99.95) slaScore += 15;
  else if (quote.sla.uptimeGuaranteePct >= 99.9) slaScore += 10;

  if (quote.sla.p1ResponseMinutes <= 15) slaScore += 15;
  else if (quote.sla.p1ResponseMinutes <= 30) slaScore += 10;
  else if (quote.sla.p1ResponseMinutes <= 60) slaScore += 5;

  if (quote.sla.dedicatedCsm) slaScore += 10;
  if (quote.sla.sandboxEnvironments >= 2) slaScore += 5;
  const finalSlaScore = Math.min(100, slaScore);

  // Weighted composite score
  const totalWeight = (weights.pricing + weights.features + weights.security + weights.sla) || 100;
  const normalizedCompositeScore = Math.round(
    (commercialScore * weights.pricing + 
     featureScore * weights.features + 
     securityScore * weights.security + 
     finalSlaScore * weights.sla) / totalWeight
  );

  return {
    vendorId: quote.id,
    vendorName: quote.vendorName,
    ...tco,
    savingsVsBudgetThreeYear,
    normalizedCompositeScore,
    featureScore,
    commercialScore,
    securityScore,
    slaScore: finalSlaScore,
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
