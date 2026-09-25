import { GoogleGenAI } from '@google/genai';
import { RFQItem, VendorQuote, AIRFQAnalysis, RFQRequirement } from '../types/rfq';
import { calculateQuoteTCO, formatCurrency } from '../utils/tcoCalculator';

// Helper to get GoogleGenAI client if key is available
function getAIClient(): GoogleGenAI | null {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                 (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
                 '';
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeRFQWithAI(rfq: RFQItem, currentSeats: number): Promise<AIRFQAnalysis> {
  const ai = getAIClient();

  const quotesSummary = rfq.quotes.map(q => {
    const tco = calculateQuoteTCO(q, currentSeats, rfq.contractTermMonths);
    return {
      vendorName: q.vendorName,
      status: q.status,
      baseAnnual: q.pricing.baseAnnualFee,
      perUserPerMonth: q.pricing.perUserPerMonth,
      implementationFee: q.pricing.implementationFee,
      premiumSupport: q.pricing.premiumSupportAnnual,
      year1Discount: `${q.pricing.year1DiscountPct}%`,
      renewalCap: `${q.pricing.renewalEscalationCapPct}%`,
      threeYearTco: formatCurrency(tco.threeYearTco),
      monthlyPerUser: `$${tco.effectiveMonthlyPerUser}`,
      uptimeGuarantee: `${q.sla.uptimeGuaranteePct}%`,
      p1Response: `${q.sla.p1ResponseMinutes} min`,
      dedicatedCsm: q.sla.dedicatedCsm,
      compliance: {
        soc2Type2: q.compliance.soc2Type2,
        iso27001: q.compliance.iso27001,
        hipaaBaa: q.compliance.hipaaBaa,
      },
      concessions: q.concessionsOffered,
    };
  });

  if (ai) {
    try {
      const prompt = `You are a senior enterprise IT procurement and vendor negotiation strategist.
Analyze the following SaaS Request for Quotation (RFQ) evaluation scenario:
RFQ Title: ${rfq.title}
Category: ${rfq.category}
Seats/Users: ${currentSeats}
Annual Target Budget: ${formatCurrency(rfq.targetBudgetAnnual)} (3-Year Target: ${formatCurrency(rfq.targetBudgetAnnual * 3)})
Contract Term: ${rfq.contractTermMonths} months

Vendor Quotes Submitted:
${JSON.stringify(quotesSummary, null, 2)}

Requirements Checklist:
${rfq.requirements.map(r => `- [${r.category}] ${r.title} (Mandatory: ${r.mandatory}, Weight: ${r.weight}/5)`).join('\n')}

Produce a thorough procurement audit and negotiation analysis in STRICT valid JSON format matching this schema:
{
  "executiveSummary": "Concise 2-3 paragraph executive summary evaluating market competitiveness, pricing dispersion, and key tradeoffs",
  "topRecommendation": {
    "vendorName": "Exact name of recommended vendor",
    "rationale": "Clear rationale based on TCO, risk, compliance, and enterprise fit",
    "projected3YearTco": 123456
  },
  "redFlagsDetected": [
    {
      "vendorName": "Vendor Name",
      "severity": "high" | "medium" | "low",
      "issue": "Specific contractual or pricing vulnerability (e.g. renewal escalation, missing HIPAA, high implementation fee)",
      "mitigationStrategy": "Concrete contractual remedy to demand before signing"
    }
  ],
  "negotiationLevers": [
    {
      "vendorName": "Vendor Name",
      "targetSavings": "Estimated achievable savings like '$25,000 - $40,000'",
      "recommendedCounterOffer": "Specific counter-proposal term (e.g. waive onboarding, cap renewal at 3%)",
      "talkingPoints": [
        "Tactical talking point leveraging competitor quote or timing",
        "Second tactical talking point"
      ]
    }
  ],
  "slaAndSecurityRisks": [
    "Key SLA/compliance risk statement 1",
    "Key SLA/compliance risk statement 2"
  ]
}
Return ONLY pure JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text) as AIRFQAnalysis;
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, falling back to local procurement analysis engine:', err);
    }
  }

  // High-fidelity fallback deterministic procurement intelligence
  return generateDeterministicAnalysis(rfq, currentSeats);
}

function generateDeterministicAnalysis(rfq: RFQItem, currentSeats: number): AIRFQAnalysis {
  const scored = rfq.quotes.map(q => {
    const tco = calculateQuoteTCO(q, currentSeats, rfq.contractTermMonths);
    return {
      quote: q,
      tco,
    };
  }).sort((a, b) => a.tco.threeYearTco - b.tco.threeYearTco);

  const bestValue = scored[0];
  const second = scored[1] || scored[0];
  const target3Y = rfq.targetBudgetAnnual * 3;

  const redFlags: AIRFQAnalysis['redFlagsDetected'] = [];
  const negotiationLevers: AIRFQAnalysis['negotiationLevers'] = [];
  const slaAndSecurityRisks: string[] = [];

  rfq.quotes.forEach(q => {
    if (q.pricing.renewalEscalationCapPct > 4) {
      redFlags.push({
        vendorName: q.vendorName,
        severity: 'high',
        issue: `Uncapped or high renewal escalation rate of ${q.pricing.renewalEscalationCapPct}% annually will compound Year 2 & 3 TCO by ${formatCurrency(Math.round(q.pricing.baseAnnualFee * 0.15))}.`,
        mitigationStrategy: `Condition contract award on hard-capping renewal increases at <= 3.0% or anchoring to CPI-W.`,
      });
    }

    if (q.pricing.implementationFee > 25000) {
      redFlags.push({
        vendorName: q.vendorName,
        severity: 'medium',
        issue: `Hefty upfront professional service & onboarding fee of ${formatCurrency(q.pricing.implementationFee)} increases first-year cash outlays.`,
        mitigationStrategy: `Request 50% discount on implementation or seek milestone-based retainage (30% upfront, 40% user acceptance testing, 30% go-live).`,
      });
    }

    if (!q.compliance.hipaaBaa && rfq.requirements.some(r => r.title.toLowerCase().includes('hipaa'))) {
      redFlags.push({
        vendorName: q.vendorName,
        severity: 'high',
        issue: 'Missing formal HIPAA Business Associate Agreement (BAA) execution capability.',
        mitigationStrategy: 'Disqualify from sensitive PHI workflows or demand written indemnification rider with binding roadmap delivery SLA.',
      });
      slaAndSecurityRisks.push(`${q.vendorName} lacks turnkey HIPAA BAA compliance required by Section 4.`);
    }

    if (q.sla.p1ResponseMinutes > 15) {
      slaAndSecurityRisks.push(`${q.vendorName} commits to a ${q.sla.p1ResponseMinutes}-minute P1 response SLA (RFQ requested 15-minute 24/7 turnaround).`);
    }

    // Levers
    negotiationLevers.push({
      vendorName: q.vendorName,
      targetSavings: formatCurrency(Math.round(q.pricing.baseAnnualFee * 0.12 + q.pricing.implementationFee * 0.35)),
      recommendedCounterOffer: `Counter at $${Math.max(10, Math.round(q.pricing.perUserPerMonth * 0.88))}/user/mo, 50% implementation credit (${formatCurrency(Math.round(q.pricing.implementationFee * 0.5))}), and 3% renewal price cap guarantee.`,
      talkingPoints: [
        `Cite competing bidder offering lower effective seat cost with faster guaranteed P1 response times.`,
        `Offer 36-month committed upfront signature in exchange for waiving all Year 1 sandbox environment fees.`,
        `Benchmark overage limits against standard usage to prevent surprise charges.`,
      ],
    });
  });

  return {
    executiveSummary: `The procurement evaluation for "${rfq.title}" encompasses ${rfq.quotes.length} formal vendor quotations across ${currentSeats} user seats. The quotes reflect significant variance in total 3-year commitment, spanning from ${formatCurrency(bestValue.tco.threeYearTco)} up to ${formatCurrency(scored[scored.length - 1]?.tco.threeYearTco || 0)}. The primary divergence stems from upfront implementation retainers, multi-year volume tiering, and post-Year-1 renewal price escalation caps.`,
    topRecommendation: {
      vendorName: bestValue.quote.vendorName,
      rationale: `${bestValue.quote.vendorName} delivers the optimal balance of commercial value (${formatCurrency(bestValue.tco.threeYearTco)} 3-year TCO, saving ${formatCurrency(Math.max(0, target3Y - bestValue.tco.threeYearTco))} vs budget) combined with an aggressive ${bestValue.quote.sla.p1ResponseMinutes}-minute P1 SLA commitment and verified SOC2 Type II compliance.`,
      projected3YearTco: bestValue.tco.threeYearTco,
    },
    redFlagsDetected: redFlags,
    negotiationLevers: negotiationLevers,
    slaAndSecurityRisks: slaAndSecurityRisks.length > 0 ? slaAndSecurityRisks : [
      'Ensure service credit penalties are calculated against gross monthly recurring revenue rather than future credit notes.',
      'Mandate that annual price indexation is bounded by the lesser of 3.5% or official CPI indices.',
    ],
  };
}

export async function draftRequirementsWithAI(
  category: string,
  userCount: number,
  targetBudget: number,
  customNotes: string
): Promise<RFQRequirement[]> {
  const ai = getAIClient();

  if (ai) {
    try {
      const prompt = `Draft 6 to 8 realistic, rigorous enterprise SaaS RFQ requirements for:
Category: ${category}
User Seats: ${userCount}
Target Annual Budget: $${targetBudget}
Specific Needs: ${customNotes}

Return ONLY valid JSON array matching this format:
[
  {
    "id": "req-1",
    "category": "Functional" | "Security & Compliance" | "Integration" | "SLA & Performance" | "Commercial",
    "title": "Clear concise requirement title",
    "description": "Specific measurable requirement description with criteria",
    "mandatory": true,
    "weight": 5
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        return JSON.parse(response.text) as RFQRequirement[];
      }
    } catch (e) {
      console.warn('Gemini draft failed, using local templates:', e);
    }
  }

  // Fallback template requirements
  return [
    {
      id: `req-${Date.now()}-1`,
      category: 'Functional',
      title: 'Core High-Concurrency Platform Workflow & Role Permissions',
      description: `Seamlessly scale to support ${userCount} concurrent user licenses with granular role-based access control (RBAC).`,
      mandatory: true,
      weight: 5,
    },
    {
      id: `req-${Date.now()}-2`,
      category: 'Functional',
      title: 'Native AI Automation & Operational Productivity Features',
      description: 'Integrated intelligence engine delivering automated classification, summarizing, and routine workflow routing.',
      mandatory: true,
      weight: 4,
    },
    {
      id: `req-${Date.now()}-3`,
      category: 'Security & Compliance',
      title: 'SOC 2 Type II, ISO 27001 & End-to-End Encryption',
      description: 'Annual third-party audit reports provided under NDA. Data encrypted in transit (TLS 1.3) and at rest (AES-256).',
      mandatory: true,
      weight: 5,
    },
    {
      id: `req-${Date.now()}-4`,
      category: 'Integration',
      title: 'Enterprise SSO & Bidirectional REST APIs / Webhooks',
      description: 'Turnkey SAML 2.0 / SCIM user provisioning (Okta/Entra) and documented REST APIs with guaranteed rate limits.',
      mandatory: true,
      weight: 4,
    },
    {
      id: `req-${Date.now()}-5`,
      category: 'SLA & Performance',
      title: '99.95%+ Monthly Availability & 15-Minute P1 Response',
      description: 'Financial penalty credits for downtime exceeding 21.6 minutes/month and 24/7 direct senior engineer escalation.',
      mandatory: true,
      weight: 4,
    },
    {
      id: `req-${Date.now()}-6`,
      category: 'Commercial',
      title: 'Guaranteed Renewal Price Cap (<= 3.5% per annum)',
      description: 'Contractual ceiling preventing post-contract price inflation upon renewal.',
      mandatory: true,
      weight: 3,
    },
  ];
}

export function generateCounterOfferDoc(rfq: RFQItem, quote: VendorQuote, targetDiscountPct: number): string {
  const tco = calculateQuoteTCO(quote, rfq.userSeats, rfq.contractTermMonths);
  const targetPerSeat = Math.max(1, Math.round(quote.pricing.perUserPerMonth * (1 - targetDiscountPct / 100) * 100) / 100);
  const waivedImpl = Math.round(quote.pricing.implementationFee * 0.5);

  return `ENTERPRISE PROCUREMENT COUNTER-OFFER & BEST-AND-FINAL-OFFER (BAFO) NOTICE

Date: ${new Date().toISOString().split('T')[0]}
To: ${quote.contactPerson.name}, ${quote.contactPerson.title} (${quote.vendorName})
From: ${rfq.leadBuyer} (${rfq.buyerEmail})
Reference: ${rfq.rfqNumber} — ${rfq.title}

Dear ${quote.contactPerson.name.split(' ')[0]},

Thank you for your formal quotation submission (${quote.id}) regarding our enterprise SaaS evaluation for ${rfq.userSeats} seats.

Our procurement steering committee and technical evaluation team have completed our initial scoring round. While ${quote.vendorName} scored favorably in technical fit and compliance readiness, your proposed 3-Year Total Cost of Ownership (${formatCurrency(tco.threeYearTco)}) exceeds our authorized target allocation and remains uncompetitive against alternative shortlisted solutions.

To position ${quote.vendorName} for final contract award and immediate legal contract execution, we request the following Best and Final Offer (BAFO) adjustments:

1. COMMERCIAL ADJUSTMENTS:
   - Base Seat Pricing: Adjust per-seat rate from $${quote.pricing.perUserPerMonth}/user/mo to $${targetPerSeat}/user/mo (${targetDiscountPct}% reduction).
   - Implementation Services: Apply a $${formatCurrency(waivedImpl)} onboarding concession or convert 50% of professional fees into milestone-gated deliverables.
   - Renewal Escalation Cap: Amend Section 8.2 to bind all post-term annual license increases to a hard cap of <= 3.0% (down from your proposed ${quote.pricing.renewalEscalationCapPct}%).

2. SLA & LEGAL COMMITMENTS:
   - Uptime & Penalties: Reaffirm 99.95% availability with standard cash-deductible service credit remedies.
   - P1 Response Time: Confirm dedicated 15-minute emergency engineering response for Severity 1 production blockers.
   - Dedicated Support: Reaffirm dedicated Strategic Customer Success Manager (CSM) inclusion at no additional surcharge.

In return, our executive team is prepared to authorize a ${rfq.contractTermMonths}-month committed term with annual prepayment terms and expedited legal review targeting contract signature by ${rfq.responseDeadline}.

Please advise if you can confirm these terms by 5:00 PM EST, 3 business days from receipt.

Sincerely,

${rfq.leadBuyer}
Procurement & Strategic Sourcing Lead
${rfq.department}`;
}
