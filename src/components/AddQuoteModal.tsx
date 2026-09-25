import React, { useState } from 'react';
import { X, Plus, Trash2, Building, DollarSign, Shield, Activity } from 'lucide-react';
import { RFQItem, VendorQuote, VendorRequirementFulfillment } from '../types/rfq';

interface AddQuoteModalProps {
  rfq: RFQItem;
  isOpen: boolean;
  onClose: () => void;
  onAddQuote: (quote: VendorQuote) => void;
}

export const AddQuoteModal: React.FC<AddQuoteModalProps> = ({
  rfq,
  isOpen,
  onClose,
  onAddQuote,
}) => {
  if (!isOpen) return null;

  const [vendorName, setVendorName] = useState('');
  const [vendorTier, setVendorTier] = useState('Enterprise Tier');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('Enterprise Account Executive');
  const [contactEmail, setContactEmail] = useState('');
  
  // Pricing
  const [baseAnnualFee, setBaseAnnualFee] = useState(12000);
  const [perUserPerMonth, setPerUserPerMonth] = useState(38);
  const [implementationFee, setImplementationFee] = useState(20000);
  const [premiumSupportAnnual, setPremiumSupportAnnual] = useState(15000);
  const [year1DiscountPct, setYear1DiscountPct] = useState(15);
  const [multiYearDiscountPct, setMultiYearDiscountPct] = useState(10);
  const [renewalEscalationCapPct, setRenewalEscalationCapPct] = useState(3.5);
  const [paymentTerms, setPaymentTerms] = useState('Net 30, Annual in Advance');

  // SLA
  const [uptimeGuaranteePct, setUptimeGuaranteePct] = useState(99.95);
  const [p1ResponseMinutes, setP1ResponseMinutes] = useState(15);
  const [dedicatedCsm, setDedicatedCsm] = useState(true);
  const [sandboxEnvironments, setSandboxEnvironments] = useState(2);
  const [dataResidency, setDataResidency] = useState('US-East & EU-Frankfurt');

  // Compliance
  const [soc2Type2, setSoc2Type2] = useState(true);
  const [iso27001, setIso27001] = useState(true);
  const [hipaaBaa, setHipaaBaa] = useState(true);
  const [gdprCompliant, setGdprCompliant] = useState(true);
  const [singleTenantOption, setSingleTenantOption] = useState(false);

  // Concessions
  const [concessionText, setConcessionText] = useState('');
  const [concessions, setConcessions] = useState<string[]>([
    'Free dedicated staging and sandbox environment',
    '30 hours complimentary technical onboarding support',
  ]);

  const addConcession = () => {
    if (concessionText.trim()) {
      setConcessions([...concessions, concessionText.trim()]);
      setConcessionText('');
    }
  };

  const removeConcession = (index: number) => {
    setConcessions(concessions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    // Create fulfillments for each requirement
    const fulfillment: VendorRequirementFulfillment[] = rfq.requirements.map(req => ({
      requirementId: req.id,
      complianceLevel: 'full',
      notes: 'Fully satisfied according to standard enterprise service description.',
    }));

    const newQuote: VendorQuote = {
      id: `qte-${Date.now().toString(36)}`,
      rfqId: rfq.id,
      vendorName,
      vendorCode: vendorName.slice(0, 3).toUpperCase(),
      logoInitials: vendorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'VN',
      vendorTier,
      contactPerson: {
        name: contactName || 'Vendor Sales Team',
        title: contactTitle,
        email: contactEmail || 'sales@vendor.com',
      },
      submissionDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'USD',
      pricing: {
        baseAnnualFee: Number(baseAnnualFee),
        perUserPerMonth: Number(perUserPerMonth),
        implementationFee: Number(implementationFee),
        premiumSupportAnnual: Number(premiumSupportAnnual),
        estimatedOverageAnnual: 0,
        year1DiscountPct: Number(year1DiscountPct),
        multiYearDiscountPct: Number(multiYearDiscountPct),
        paymentTerms,
        renewalEscalationCapPct: Number(renewalEscalationCapPct),
      },
      sla: {
        uptimeGuaranteePct: Number(uptimeGuaranteePct),
        p1ResponseMinutes: Number(p1ResponseMinutes),
        dedicatedCsm,
        sandboxEnvironments: Number(sandboxEnvironments),
        dataResidency,
        serviceCreditTerms: 'Standard financial service credit remedies for downtime breaches',
      },
      compliance: {
        soc2Type2,
        iso27001,
        hipaaBaa,
        gdprCompliant,
        singleTenantOption,
        disasterRecoveryRpoMinutes: 15,
        disasterRecoveryRtoMinutes: 60,
      },
      fulfillment,
      vendorNotes: 'Ingested quotation for enterprise RFQ evaluation.',
      concessionsOffered: concessions,
      status: 'submitted',
    };

    onAddQuote(newQuote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              Ingest Vendor Quotation Submission
            </h3>
            <p className="text-xs text-neutral-400">
              Record formal commercial proposal for {rfq.title} ({rfq.userSeats} seats)
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Vendor Info */}
          <div>
            <h4 className="font-semibold text-blue-400 uppercase font-mono text-[11px] mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>1. Vendor Organization & Contact</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 mb-1">Vendor / Product Name *</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. ServiceNow Customer Workflows"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Market Position / Tier</label>
                <input
                  type="text"
                  value={vendorTier}
                  onChange={(e) => setVendorTier(e.target.value)}
                  placeholder="e.g. Enterprise Leader"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Account Executive / Submitter</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Michael Harris"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="m.harris@vendor.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing Schedule */}
          <div>
            <h4 className="font-semibold text-emerald-400 uppercase font-mono text-[11px] mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>2. Commercial Pricing Schedule</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Per-User / Mo ($)</label>
                <input
                  type="number"
                  required
                  value={perUserPerMonth}
                  onChange={(e) => setPerUserPerMonth(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Base Annual ($)</label>
                <input
                  type="number"
                  value={baseAnnualFee}
                  onChange={(e) => setBaseAnnualFee(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Implementation ($)</label>
                <input
                  type="number"
                  value={implementationFee}
                  onChange={(e) => setImplementationFee(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Support Annual ($)</label>
                <input
                  type="number"
                  value={premiumSupportAnnual}
                  onChange={(e) => setPremiumSupportAnnual(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Year 1 Discount (%)</label>
                <input
                  type="number"
                  value={year1DiscountPct}
                  onChange={(e) => setYear1DiscountPct(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Multi-Yr Discount (%)</label>
                <input
                  type="number"
                  value={multiYearDiscountPct}
                  onChange={(e) => setMultiYearDiscountPct(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Renewal Cap (%/yr)</label>
                <input
                  type="number"
                  step="0.1"
                  value={renewalEscalationCapPct}
                  onChange={(e) => setRenewalEscalationCapPct(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-sans text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: SLA & Compliance */}
          <div>
            <h4 className="font-semibold text-purple-400 uppercase font-mono text-[11px] mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>3. SLA & InfoSec Compliance</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Uptime Guarantee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={uptimeGuaranteePct}
                  onChange={(e) => setUptimeGuaranteePct(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">P1 Response (Minutes)</label>
                <input
                  type="number"
                  value={p1ResponseMinutes}
                  onChange={(e) => setP1ResponseMinutes(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Sandbox Tenants</label>
                <input
                  type="number"
                  value={sandboxEnvironments}
                  onChange={(e) => setSandboxEnvironments(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1 font-sans">Data Residency</label>
                <input
                  type="text"
                  value={dataResidency}
                  onChange={(e) => setDataResidency(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white font-sans text-[11px]"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-sans text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dedicatedCsm}
                  onChange={(e) => setDedicatedCsm(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-0"
                />
                <span>Dedicated CSM</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soc2Type2}
                  onChange={(e) => setSoc2Type2(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-0"
                />
                <span>SOC 2 Type II</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={iso27001}
                  onChange={(e) => setIso27001(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-0"
                />
                <span>ISO 27001</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hipaaBaa}
                  onChange={(e) => setHipaaBaa(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-0"
                />
                <span>HIPAA BAA</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={singleTenantOption}
                  onChange={(e) => setSingleTenantOption(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-0"
                />
                <span>Single-Tenant Available</span>
              </label>
            </div>
          </div>

          {/* Section 4: Concessions */}
          <div>
            <h4 className="font-semibold text-amber-400 uppercase font-mono text-[11px] mb-2">
              4. Commercial Concessions & Bundled Add-ons
            </h4>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={concessionText}
                onChange={(e) => setConcessionText(e.target.value)}
                placeholder="e.g. Free 10 developer sandbox licenses ($12,000 value)"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
              />
              <button
                type="button"
                onClick={addConcession}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-200"
              >
                Add
              </button>
            </div>
            <ul className="space-y-1">
              {concessions.map((c, i) => (
                <li key={i} className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-neutral-800/80">
                  <span className="text-neutral-300">{c}</span>
                  <button type="button" onClick={() => removeConcession(i)} className="text-neutral-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
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
              Save Vendor Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
