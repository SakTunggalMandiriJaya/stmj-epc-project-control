import { VendorContractExpiration } from '../types/rfq';

export const INITIAL_CONTRACTS: VendorContractExpiration[] = [
  {
    id: 'cntr-2026-001',
    vendorName: 'BambooHR',
    productName: 'Core HR & Legacy US Payroll Module',
    category: 'HRIS & Workforce',
    annualValue: 185000,
    seats: 1200,
    expirationDate: '2026-10-18', // ~23 days from 2026-09-25
    noticeDeadlineDays: 30, // notice window already approaching/critical!
    autoRenew: true,
    status: 'critical',
    linkedRfqId: 'rfq-2026-033',
    owner: 'Siddharth Patel',
  },
  {
    id: 'cntr-2026-002',
    vendorName: 'Zendesk Inc.',
    productName: 'Legacy Support Suite Enterprise',
    category: 'Customer Support & CRM',
    annualValue: 380000,
    seats: 650,
    expirationDate: '2026-10-31', // ~36 days from 2026-09-25
    noticeDeadlineDays: 30,
    autoRenew: true,
    status: 'upcoming',
    linkedRfqId: 'rfq-2026-081',
    owner: 'Elena Rostova',
  },
  {
    id: 'cntr-2026-003',
    vendorName: 'Splunk Inc.',
    productName: 'Enterprise Cloud SIEM Ingest (3.5 TB/day)',
    category: 'Security & DevSecOps',
    annualValue: 520000,
    seats: 250,
    expirationDate: '2026-11-15', // ~51 days from 2026-09-25
    noticeDeadlineDays: 60,
    autoRenew: true,
    status: 'under_review',
    linkedRfqId: 'rfq-2026-054',
    owner: 'Devin Thorne',
  },
  {
    id: 'cntr-2026-004',
    vendorName: 'Datadog HQ',
    productName: 'Cloud Infrastructure & APM Telemetry',
    category: 'Cloud Infrastructure & FinOps',
    annualValue: 165000,
    seats: 180,
    expirationDate: '2026-12-10', // ~76 days
    noticeDeadlineDays: 45,
    autoRenew: false,
    status: 'upcoming',
    owner: 'Devin Thorne',
  },
  {
    id: 'cntr-2026-005',
    vendorName: 'Workday Inc.',
    productName: 'Financials & Strategic Sourcing Connector',
    category: 'HRIS & Workforce',
    annualValue: 240000,
    seats: 800,
    expirationDate: '2027-01-20', // ~117 days
    noticeDeadlineDays: 60,
    autoRenew: true,
    status: 'upcoming',
    owner: 'Elena Rostova',
  },
];
