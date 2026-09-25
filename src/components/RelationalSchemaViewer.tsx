import React, { useState } from 'react';
import { 
  Database, 
  Key, 
  Link2, 
  ArrowRight, 
  Layers, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Table as TableIcon,
  Search,
  Sparkles
} from 'lucide-react';
import { SCHEMA_TABLE_DEFINITIONS } from '../data/stmjDatabaseSeed';
import { SchemaTableDefinition } from '../types/stmjDatabase';

interface RelationalSchemaViewerProps {
  onNavigateToTable: (tableName: string) => void;
  recordCounts: Record<string, number>;
}

export const RelationalSchemaViewer: React.FC<RelationalSchemaViewerProps> = ({
  onNavigateToTable,
  recordCounts,
}) => {
  const [selectedTable, setSelectedTable] = useState<SchemaTableDefinition>(SCHEMA_TABLE_DEFINITIONS[2]); // Default Quotation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Masters', 'Commercial & Quotation', 'Costing & Engineering', 'Operations & Execution', 'Finance & Reporting'];

  const filteredTables = SCHEMA_TABLE_DEFINITIONS.filter(t => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch = t.table_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Relational Integrity Enforced
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                12 Enterprise Tables
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              STMJ Enterprise Relational Schema & Entity-Relationship Architecture
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Every item has an explicit Primary Key (PK) with strict relational foreign keys (FK) enforcing 
              <span className="text-emerald-400 font-semibold"> 1:1</span>, 
              <span className="text-sky-400 font-semibold"> 1:N</span>, 
              <span className="text-amber-400 font-semibold"> N:1</span>, and 
              <span className="text-purple-400 font-semibold"> N:N</span> cardinalities across engineering libraries, costing sheets, quotations, milestones, and client POs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-3 border border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-medium">Primary Keys</div>
              <div className="text-xl font-bold text-amber-400 font-mono">12 / 12</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-3 border border-slate-700 text-center">
              <div className="text-xs text-slate-400 font-medium">Relational Links</div>
              <div className="text-xl font-bold text-sky-400 font-mono">18 FKs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Relational Cardinality Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm font-mono border border-emerald-300">
            1:1
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">One-to-One</div>
            <div className="text-xs text-slate-500">Quotation ↔ Cost Calculation (HPP)</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm font-mono border border-sky-300">
            1:N
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">One-to-Many</div>
            <div className="text-xs text-slate-500">Quotation → Line Items & Milestones</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm font-mono border border-amber-300">
            N:1
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">Many-to-One</div>
            <div className="text-xs text-slate-500">BOQ Lines → Vendor Catalog Item</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm font-mono border border-purple-300">
            N:N
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">Many-to-Many</div>
            <div className="text-xs text-slate-500">Quotations ↔ Catalog Materials (via BOQ)</div>
          </div>
        </div>
      </div>

      {/* Main Interactive Schema Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tables Registry & Filter */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Database Tables ({SCHEMA_TABLE_DEFINITIONS.length})
              </h3>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search tables or columns..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Table List */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTables.map(tbl => {
                const isSelected = selectedTable.table_name === tbl.table_name;
                const count = recordCounts[tbl.table_name] || 0;

                return (
                  <button
                    key={tbl.table_name}
                    onClick={() => setSelectedTable(tbl)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                          {tbl.table_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-medium">
                          {count} rows
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {tbl.display_name}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Table Deep-Dive */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {selectedTable.table_name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {selectedTable.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {recordCounts[selectedTable.table_name] || 0} Records
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mt-1.5">
                  {selectedTable.display_name}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {selectedTable.description}
                </p>
              </div>

              <button
                onClick={() => onNavigateToTable(selectedTable.table_name)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 self-start md:self-auto shrink-0"
              >
                <TableIcon className="w-3.5 h-3.5" />
                Open Live Table Records
              </button>
            </div>

            {/* Table Columns Schema */}
            <div className="p-5 space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Columns & Key Constraints ({selectedTable.columns.length})
              </h5>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Column Name</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Constraint</th>
                      <th className="px-3 py-2">Description & Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTable.columns.map(col => (
                      <tr key={col.name} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-900 flex items-center gap-1.5">
                          {col.is_pk && (
                            <span className="p-1 rounded bg-amber-100 text-amber-700" title="Primary Key">
                              <Key className="w-3 h-3" />
                            </span>
                          )}
                          {col.is_fk && (
                            <span className="p-1 rounded bg-sky-100 text-sky-700" title="Foreign Key">
                              <Link2 className="w-3 h-3" />
                            </span>
                          )}
                          {col.name}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">
                          {col.type}
                        </td>
                        <td className="px-3 py-2.5">
                          {col.is_pk && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              PRIMARY KEY
                            </span>
                          )}
                          {col.is_fk && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                              FOREIGN KEY
                            </span>
                          )}
                          {!col.is_pk && !col.is_fk && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              {col.nullable ? 'NULLABLE' : 'NOT NULL'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {col.description}
                          {col.fk_target && (
                            <div className="text-[11px] font-mono text-sky-600 font-semibold mt-0.5">
                              ↳ References: {col.fk_target}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Relational Links */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/40 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                Active Relational Connections ({selectedTable.relations.length})
              </h5>

              {selectedTable.relations.length === 0 ? (
                <p className="text-xs text-slate-500 italic">This is an audit log table with no outward foreign keys.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTable.relations.map((rel, idx) => {
                    const badgeColor = 
                      rel.type === '1:1' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      rel.type === '1:N' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                      rel.type === 'N:1' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-purple-100 text-purple-800 border-purple-300';

                    return (
                      <div 
                        key={idx}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${badgeColor}`}>
                            {rel.type}
                          </span>
                          <button
                            onClick={() => {
                              const target = SCHEMA_TABLE_DEFINITIONS.find(t => t.table_name === rel.target_table);
                              if (target) setSelectedTable(target);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                          >
                            Inspect {rel.target_table}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 font-mono">
                          <span>{selectedTable.table_name}.{rel.foreign_key}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-indigo-700">{rel.target_table}.{rel.target_key}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {rel.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
