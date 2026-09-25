export type RFQStatus = 'draft' | 'open' | 'evaluating' | 'negotiating' | 'awarded' | 'closed';

export type SaaSRequirementCategory = 
  | 'Functional' 
  | 'Security & Compliance' 
  | 'Integration' 
  | 'SLA & Performance' 
  | 'Commercial';

export interface RFQRequirement {
  id: string;
  category: SaaSRequirementCategory;
  title: string;
  description: string;
  mandatory: boolean;
  weight: number; // 1 (lowest) to 5 (highest)
}

export interface VendorPricing {
  baseAnnualFee: number;
  perUserPerMonth: number;
  implementationFee: number;
  premiumSupportAnnual: number;
  estimatedOverageAnnual: number;
  year1DiscountPct: number;
  multiYearDiscountPct: number;
  paymentTerms: string;
  renewalEscalationCapPct: number; // % cap on year-over-year renewals
}

export interface VendorSLA {
  uptimeGuaranteePct: number;
  p1ResponseMinutes: number;
  dedicatedCsm: boolean;
  sandboxEnvironments: number;
  dataResidency: string;
  serviceCreditTerms: string;
}

export interface VendorCompliance {
  soc2Type2: boolean;
  iso27001: boolean;
  hipaaBaa: boolean;
  gdprCompliant: boolean;
  singleTenantOption: boolean;
  disasterRecoveryRpoMinutes: number;
  disasterRecoveryRtoMinutes: number;
}

export interface VendorRequirementFulfillment {
  requirementId: string;
  complianceLevel: 'full' | 'partial' | 'custom_roadmap' | 'not_supported';
  notes: string;
}

export type QuoteStatus = 'submitted' | 'under_review' | 'shortlisted' | 'counter_offered' | 'awarded' | 'rejected';

export interface VendorQuote {
  id: string;
  rfqId: string;
  vendorName: string;
  vendorCode: string;
  logoInitials: string;
  vendorTier: string;
  contactPerson: {
    name: string;
    title: string;
    email: string;
  };
  submissionDate: string;
  validUntil: string;
  currency: string;
  pricing: VendorPricing;
  sla: VendorSLA;
  compliance: VendorCompliance;
  fulfillment: VendorRequirementFulfillment[];
  vendorNotes: string;
  concessionsOffered: string[];
  status: QuoteStatus;
}

export interface RFQAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details?: string;
}

export interface RFQScoringWeights {
  pricing: number; // default 35
  features: number; // default 30
  security: number; // default 20
  sla: number; // default 15
}

export interface RFQItem {
  id: string;
  rfqNumber: string; // e.g. RFQ-2026-042
  title: string;
  category: 'Customer Support & CRM' | 'Security & DevSecOps' | 'Cloud Infrastructure & FinOps' | 'Data & Analytics' | 'HRIS & Workforce';
  department: string;
  leadBuyer: string;
  buyerEmail: string;
  status: RFQStatus;
  userSeats: number;
  contractTermMonths: 12 | 24 | 36;
  targetBudgetAnnual: number;
  targetLiveDate: string;
  responseDeadline: string;
  description: string;
  requirements: RFQRequirement[];
  invitedVendors: string[];
  quotes: VendorQuote[];
  auditLog: RFQAuditEntry[];
  scoringWeights: RFQScoringWeights;
  awardedQuoteId?: string;
  awardNotes?: string;
  awardSignOffDate?: string;
}

export interface TCOBreakdown {
  vendorId: string;
  vendorName: string;
  year1Cost: number;
  year2Cost: number;
  year3Cost: number;
  threeYearTco: number;
  effectiveMonthlyPerUser: number;
  savingsVsBudgetThreeYear: number;
  normalizedCompositeScore: number; // 0 to 100
  featureScore: number; // 0 to 100
  commercialScore: number; // 0 to 100
  securityScore: number; // 0 to 100
  slaScore: number; // 0 to 100
}

export interface AIRFQAnalysis {
  executiveSummary: string;
  topRecommendation: {
    vendorName: string;
    rationale: string;
    projected3YearTco: number;
  };
  redFlagsDetected: {
    vendorName: string;
    severity: 'high' | 'medium' | 'low';
    issue: string;
    mitigationStrategy: string;
  }[];
  negotiationLevers: {
    vendorName: string;
    targetSavings: string;
    recommendedCounterOffer: string;
    talkingPoints: string[];
  }[];
  slaAndSecurityRisks: string[];
}

export interface VendorContractExpiration {
  id: string;
  vendorName: string;
  productName: string;
  category: string;
  annualValue: number;
  seats: number;
  expirationDate: string; // ISO date, e.g. '2026-10-31'
  noticeDeadlineDays: number; // e.g. 30 or 60 days before expiration
  autoRenew: boolean;
  status: 'critical' | 'upcoming' | 'under_review' | 'renewed';
  linkedRfqId?: string;
  owner: string;
}
