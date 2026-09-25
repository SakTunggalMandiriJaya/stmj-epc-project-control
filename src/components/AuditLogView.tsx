import React, { useState } from 'react';
import { Clock, MessageSquare, Plus, ShieldCheck, UserCheck } from 'lucide-react';
import { RFQItem, RFQAuditEntry } from '../types/rfq';

interface AuditLogViewProps {
  rfq: RFQItem;
  onAddAuditEntry: (entry: RFQAuditEntry) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ rfq, onAddAuditEntry }) => {
  const [newAction, setNewAction] = useState('Procurement Evaluation Note');
  const [newDetails, setNewDetails] = useState('');
  const [actorName, setActorName] = useState(rfq.leadBuyer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetails.trim()) return;

    const entry: RFQAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: actorName,
      role: 'Procurement Steering Committee',
      action: newAction,
      details: newDetails,
    };

    onAddAuditEntry(entry);
    setNewDetails('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Immutable Procurement Audit Trail & Governance</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            SOX & ISO compliance record of quote submissions, status changes, buyer deliberations, and committee sign-offs.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitting(!isSubmitting)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Committee Log</span>
        </button>
      </div>

      {/* Add Entry Form */}
      {isSubmitting && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-blue-500/40 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-semibold text-white font-mono uppercase">
            Record Sourcing Review Note
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Actor Name</label>
              <input
                type="text"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Milestone Action</label>
              <input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-neutral-400 mb-1">Deliberation Details / Concessions Agreed</label>
            <textarea
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              required
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-white"
              placeholder="Record steering committee decision, legal feedback, or vendor concessions..."
            />
          </div>

          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={() => setIsSubmitting(false)}
              className="px-3 py-1 text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded"
            >
              Commit to Audit Trail
            </button>
          </div>
        </form>
      )}

      {/* Timeline view */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-neutral-800">
          {rfq.auditLog.map((log) => (
            <div key={log.id} className="relative flex items-start gap-4 text-xs">
              <div className="w-6 h-6 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center text-blue-400 shrink-0 z-10">
                <Clock className="w-3 h-3" />
              </div>
              <div className="flex-1 bg-neutral-950/60 p-3.5 rounded border border-neutral-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-400">{log.actor} ({log.role})</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-500">{log.timestamp}</span>
                </div>
                {log.details && (
                  <p className="mt-1.5 text-neutral-300 leading-relaxed font-sans">
                    {log.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
