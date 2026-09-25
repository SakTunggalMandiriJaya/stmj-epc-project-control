import React from 'react';
import { Layers, Plus, Sparkles, SlidersHorizontal, FileText, CheckCircle2 } from 'lucide-react';
import { RFQItem } from '../types/rfq';

interface HeaderProps {
  activeView: 'dashboard' | 'detail';
  selectedRFQ: RFQItem | null;
  onNavigateHome: () => void;
  onOpenCreateRFQ: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  selectedRFQ,
  onNavigateHome,
  onOpenCreateRFQ,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateHome}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                P
              </div>
              <div>
                <span className="text-lg font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  ProcureSaaS
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs text-neutral-500 font-mono">
                  v2.6 Enterprise RFQ
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={onNavigateHome}
              className={`transition-colors py-1 ${
                activeView === 'dashboard'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All RFQs
            </button>
            {selectedRFQ && (
              <>
                <button
                  onClick={() => setActiveTab('quotes')}
                  className={`transition-colors py-1 ${
                    activeView === 'detail' && activeTab === 'quotes'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Quote Matrix
                </button>
                <button
                  onClick={() => setActiveTab('tco')}
                  className={`transition-colors py-1 ${
                    activeView === 'detail' && activeTab === 'tco'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  TCO Benchmark
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`transition-colors py-1 ${
                    activeView === 'detail' && activeTab === 'ai'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  AI Intelligence
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`transition-colors py-1 ${
                    activeView === 'detail' && activeTab === 'specs'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Requirements
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateRFQ}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New SaaS RFQ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
