import React, { useState } from 'react';
import { Plus, Sparkles, Check, AlertCircle, X, Shield, Star, Trash2 } from 'lucide-react';
import { RFQItem, RFQRequirement, SaaSRequirementCategory } from '../types/rfq';
import { draftRequirementsWithAI } from '../services/geminiService';

interface RequirementsListProps {
  rfq: RFQItem;
  onAddRequirement: (req: RFQRequirement) => void;
  onRemoveRequirement: (reqId: string) => void;
}

export const RequirementsList: React.FC<RequirementsListProps> = ({
  rfq,
  onAddRequirement,
  onRemoveRequirement,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isDraftingAI, setIsDraftingAI] = useState(false);

  // New requirement form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<SaaSRequirementCategory>('Functional');
  const [newMandatory, setNewMandatory] = useState(true);
  const [newWeight, setNewWeight] = useState(4);

  const categories: ('All' | SaaSRequirementCategory)[] = [
    'All',
    'Functional',
    'Security & Compliance',
    'Integration',
    'SLA & Performance',
    'Commercial',
  ];

  const filteredRequirements = rfq.requirements.filter(r => 
    selectedCategory === 'All' || r.category === selectedCategory
  );

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddRequirement({
      id: `req-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      category: newCategory,
      mandatory: newMandatory,
      weight: newWeight,
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddingCustom(false);
  };

  const handleAIDraft = async () => {
    setIsDraftingAI(true);
    try {
      const generated = await draftRequirementsWithAI(
        rfq.category,
        rfq.userSeats,
        rfq.targetBudgetAnnual,
        rfq.description
      );
      generated.forEach(g => onAddRequirement(g));
    } catch (err) {
      console.error(err);
    } finally {
      setIsDraftingAI(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-neutral-500 whitespace-nowrap">Filter:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAIDraft}
            disabled={isDraftingAI}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDraftingAI ? 'animate-spin' : ''}`} />
            <span>{isDraftingAI ? 'Drafting...' : 'AI Spec Generator'}</span>
          </button>
          <button
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Requirement</span>
          </button>
        </div>
      </div>

      {/* Inline Add Requirement Form */}
      {isAddingCustom && (
        <form onSubmit={handleSaveCustom} className="bg-neutral-900 border border-blue-500/40 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white uppercase font-mono">
              New RFQ Technical Specification
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Requirement Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Bidirectional Salesforce Enterprise CRM Sync"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as SaaSRequirementCategory)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white focus:outline-none"
              >
                <option value="Functional">Functional</option>
                <option value="Security & Compliance">Security & Compliance</option>
                <option value="Integration">Integration</option>
                <option value="SLA & Performance">SLA & Performance</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-neutral-400 mb-1">Description & Verification Criteria</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="State explicit functionality, pass/fail acceptance thresholds, or benchmark metrics..."
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300">
                <input
                  type="checkbox"
                  checked={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-0"
                />
                <span>Mandatory (Disqualification criteria)</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Weight:</span>
                <select
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                  className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-white font-mono"
                >
                  <option value="5">5 (Critical)</option>
                  <option value="4">4 (High)</option>
                  <option value="3">3 (Medium)</option>
                  <option value="2">2 (Low)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="px-3 py-1 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded"
              >
                Append to Scope
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Requirements Table with Vendor Fulfillment Matrix */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950/70 text-neutral-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 w-72">Requirement & Scope</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-center">Type</th>
              <th className="py-3 px-4 text-center">Weight</th>
              {rfq.quotes.map(q => (
                <th key={q.id} className="py-3 px-4 text-center border-l border-neutral-800">
                  {q.vendorName.split(' ')[0]}
                </th>
              ))}
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredRequirements.map(req => (
              <tr key={req.id} className="hover:bg-neutral-800/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-white">{req.title}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{req.description}</div>
                </td>
                <td className="py-3 px-4 text-neutral-300">
                  <span>{req.category}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  {req.mandatory ? (
                    <span className="font-mono text-[10px] text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/60 font-semibold uppercase">
                      Mandatory
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                      Optional
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center font-mono font-medium text-amber-400">
                  {req.weight} / 5
                </td>

                {/* Vendor Compliance status cells */}
                {rfq.quotes.map(q => {
                  const f = q.fulfillment.find(ful => ful.requirementId === req.id);
                  const level = f ? f.complianceLevel : 'not_supported';
                  return (
                    <td key={q.id} className="py-3 px-4 text-center border-l border-neutral-800">
                      {level === 'full' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <Check className="w-3.5 h-3.5" /> Full
                        </span>
                      ) : level === 'partial' ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Partial
                        </span>
                      ) : level === 'custom_roadmap' ? (
                        <span className="text-[11px] text-blue-400">Roadmap</span>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Not Met</span>
                      )}
                    </td>
                  );
                })}

                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onRemoveRequirement(req.id)}
                    className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                    title="Remove requirement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
