import React, { useState } from 'react';
import { X, Sparkles, Layers, BookTemplate, FileSpreadsheet } from 'lucide-react';
import { RFQItem, RFQRequirement } from '../types/rfq';

interface CreateRFQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRFQ: (rfq: RFQItem) => void;
}

const TEMPLATES = [
  {
    name: 'Customer Support & AI Suite',
    category: 'Customer Support & CRM' as const,
    title: 'Global Omnichannel Support & AI Agent Platform',
    seats: 500,
    term: 36 as const,
    budget: 280000,
    desc: 'Consolidation of tier-1 support tickets, telephony, and live chat with native AI grounding and Salesforce integration.',
  },
  {
    name: 'Cloud Security SIEM Platform',
    category: 'Security & DevSecOps' as const,
    title: 'Next-Gen Cloud SIEM & Real-Time Threat Detection',
    seats: 150,
    term: 36 as const,
    budget: 390000,
    desc: 'Multi-cloud telemetry ingestion (AWS, GCP, K8s) with automated SOAR quarantine playbooks and FedRAMP compliance.',
  },
  {
    name: 'Cloud FinOps & Cost Optimization',
    category: 'Cloud Infrastructure & FinOps' as const,
    title: 'Enterprise Multi-Cloud FinOps & Resource Allocation',
    seats: 300,
    term: 24 as const,
    budget: 210000,
    desc: 'Continuous cloud spend visibility, automated anomaly alerts, Kubernetes container cost allocation, and RI purchasing recommendations.',
  },
];

export const CreateRFQModal: React.FC<CreateRFQModalProps> = ({
  isOpen,
  onClose,
  onCreateRFQ,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RFQItem['category']>('Customer Support & CRM');
  const [department, setDepartment] = useState('Global Operations & Technology');
  const [leadBuyer, setLeadBuyer] = useState('Elena Rostova');
  const [buyerEmail, setBuyerEmail] = useState('elena.rostova@enterprise-corp.com');
  const [userSeats, setUserSeats] = useState<number>(450);
  const [contractTermMonths, setContractTermMonths] = useState<12 | 24 | 36>(36);
  const [targetBudgetAnnual, setTargetBudgetAnnual] = useState<number>(250000);
  const [targetLiveDate, setTargetLiveDate] = useState('2026-12-01');
  const [responseDeadline, setResponseDeadline] = useState('2026-10-31');
  const [description, setDescription] = useState('');

  const loadTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setUserSeats(tmpl.seats);
    setContractTermMonths(tmpl.term);
    setTargetBudgetAnnual(tmpl.budget);
    setDescription(tmpl.desc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const rfqNumber = `RFQ-2026-0${Math.floor(Math.random() * 80 + 10)}`;
    const newId = `rfq-${Date.now()}`;

    const defaultRequirements: RFQRequirement[] = [
      {
        id: `req-gen-1`,
        category: 'Functional',
        title: 'Core High-Throughput Workflow Engine',
        description: `Full capability to support ${userSeats} concurrent enterprise users with role-based access controls.`,
        mandatory: true,
        weight: 5,
      },
      {
        id: `req-gen-2`,
        category: 'Security & Compliance',
        title: 'SOC 2 Type II & ISO 27001 Annual Certification',
        description: 'Provision of full third-party penetration test and audit reports under non-disclosure agreement.',
        mandatory: true,
        weight: 5,
      },
      {
        id: `req-gen-3`,
        category: 'Integration',
        title: 'Okta SAML 2.0 SSO & Automated SCIM Provisioning',
        description: 'Instant de-provisioning upon employee offboarding and support for custom role mapping.',
        mandatory: true,
        weight: 4,
      },
      {
        id: `req-gen-4`,
        category: 'SLA & Performance',
        title: '99.95% Availability with 15-Min P1 Response',
        description: 'Direct 24/7 access to tier-3 engineering escalation bridges for critical production disruptions.',
        mandatory: true,
        weight: 4,
      },
      {
        id: `req-gen-5`,
        category: 'Commercial',
        title: 'Post-Term Annual Renewal Escalation Cap (<= 3.5%)',
        description: 'Contractual ceiling preventing sudden price inflation upon multi-year renewal.',
        mandatory: true,
        weight: 3,
      },
    ];

    const newRFQ: RFQItem = {
      id: newId,
      rfqNumber,
      title,
      category,
      department,
      leadBuyer,
      buyerEmail,
      status: 'open',
      userSeats: Number(userSeats),
      contractTermMonths,
      targetBudgetAnnual: Number(targetBudgetAnnual),
      targetLiveDate,
      responseDeadline,
      description: description || `Formal solicitation for ${title} supporting ${userSeats} users.`,
      requirements: defaultRequirements,
      invitedVendors: [],
      quotes: [],
      auditLog: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          actor: leadBuyer,
          role: 'Procurement Lead',
          action: 'RFQ Created',
          details: `RFQ ${rfqNumber} drafted for ${title} with ${userSeats} seats.`,
        },
      ],
      scoringWeights: {
        pricing: 35,
        features: 30,
        security: 20,
        sla: 15,
      },
    };

    onCreateRFQ(newRFQ);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              Initiate New SaaS Request for Quotation (RFQ)
            </h3>
            <p className="text-xs text-neutral-400">
              Establish scoping baseline, evaluation rubric, and budget constraints
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick template loader */}
          <div>
            <span className="text-[11px] text-neutral-400 font-mono uppercase block mb-1.5">
              Quick Load Enterprise Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => loadTemplate(tmpl)}
                  className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded text-neutral-300 transition-colors"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-neutral-300 mb-1">RFQ Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Enterprise Omnichannel Customer Support & AI Suite"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">SaaS Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white"
              >
                <option value="Customer Support & CRM">Customer Support & CRM</option>
                <option value="Security & DevSecOps">Security & DevSecOps</option>
                <option value="Cloud Infrastructure & FinOps">Cloud Infrastructure & FinOps</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="HRIS & Workforce">HRIS & Workforce</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Target User Seats *</label>
              <input
                type="number"
                required
                value={userSeats}
                onChange={(e) => setUserSeats(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Contract Commitment</label>
              <select
                value={contractTermMonths}
                onChange={(e) => setContractTermMonths(Number(e.target.value) as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono"
              >
                <option value={12}>12 Months (1 Year)</option>
                <option value={24}>24 Months (2 Years)</option>
                <option value={36}>36 Months (3 Years - Recommended)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Target Annual Budget ($ USD) *</label>
              <input
                type="number"
                required
                value={targetBudgetAnnual}
                onChange={(e) => setTargetBudgetAnnual(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Sourcing Lead Buyer</label>
              <input
                type="text"
                value={leadBuyer}
                onChange={(e) => setLeadBuyer(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Buyer Email</label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Bidding Deadline</label>
              <input
                type="date"
                value={responseDeadline}
                onChange={(e) => setResponseDeadline(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-300 mb-1">Target Go-Live Date</label>
              <input
                type="date"
                value={targetLiveDate}
                onChange={(e) => setTargetLiveDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 mb-1">Executive Scope & Justification</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Outline business context, primary legacy software being replaced, and core business goals..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white text-xs"
            />
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-xs"
            >
              Issue RFQ Specification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
