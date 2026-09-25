import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  Key, 
  Link2, 
  Table as TableIcon, 
  ChevronRight, 
  Eye, 
  X,
  Code,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { SCHEMA_TABLE_DEFINITIONS } from '../data/stmjDatabaseSeed';
import { SchemaTableDefinition } from '../types/stmjDatabase';

interface RelationalDataExplorerProps {
  initialTableName?: string;
  databaseState: Record<string, any[]>;
}

export const RelationalDataExplorer: React.FC<RelationalDataExplorerProps> = ({
  initialTableName = 'quotation',
  databaseState,
}) => {
  const [selectedTableName, setSelectedTableName] = useState<string>(initialTableName);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const activeSchema = useMemo(() => {
    return SCHEMA_TABLE_DEFINITIONS.find(t => t.table_name === selectedTableName) || SCHEMA_TABLE_DEFINITIONS[0];
  }, [selectedTableName]);

  const activeRecords = useMemo(() => {
    return databaseState[selectedTableName] || [];
  }, [databaseState, selectedTableName]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return activeRecords;
    return activeRecords.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [activeRecords, searchTerm]);

  // CSV Export
  const handleExportCSV = () => {
    if (activeRecords.length === 0) return;
    const headers = Object.keys(activeRecords[0]).join(',');
    const rows = activeRecords.map(r => 
      Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTableName}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              Relational Tables Explorer
            </span>
            <span className="text-xs text-slate-500">
              Direct access to all 12 enterprise database tables
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-indigo-600" />
            Universal Enterprise Data Browser
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Every table enforces primary key uniqueness and foreign key relationships with live data inspecting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Select Table ({SCHEMA_TABLE_DEFINITIONS.length})</label>
            <select
              value={selectedTableName}
              onChange={e => {
                setSelectedTableName(e.target.value);
                setSelectedRow(null);
                setSearchTerm('');
              }}
              className="text-xs font-mono font-bold p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {SCHEMA_TABLE_DEFINITIONS.map(tbl => (
                <option key={tbl.table_name} value={tbl.table_name}>
                  {tbl.table_name} ({databaseState[tbl.table_name]?.length || 0} rows)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="mt-4 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Schema Header Strip */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900">
              {activeSchema.table_name}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-slate-700">
              {activeSchema.display_name}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800">
              {activeSchema.category}
            </span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            {activeSchema.description}
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Filter ${selectedTableName} records...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 bg-white"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200 text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                {activeSchema.columns.map(col => (
                  <th key={col.name} className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {col.is_pk && <span title="Primary Key"><Key className="w-3 h-3 text-amber-600" /></span>}
                      {col.is_fk && <span title="Foreign Key"><Link2 className="w-3 h-3 text-sky-600" /></span>}
                      <span className={col.is_pk ? 'text-amber-800 font-bold' : col.is_fk ? 'text-sky-800 font-bold' : ''}>
                        {col.name}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={activeSchema.columns.length + 2} className="p-8 text-center text-slate-400">
                    No records found matching query.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    {activeSchema.columns.map(col => {
                      const val = row[col.name];
                      const isPk = col.is_pk;
                      const isFk = col.is_fk;

                      return (
                        <td key={col.name} className="px-3 py-2.5 whitespace-nowrap">
                          {isPk ? (
                            <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {String(val ?? '-')}
                            </span>
                          ) : isFk ? (
                            <span className="font-mono font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              {String(val ?? '-')}
                            </span>
                          ) : typeof val === 'number' ? (
                            <span className="font-mono text-slate-800">
                              {val.toLocaleString('id-ID')}
                            </span>
                          ) : typeof val === 'boolean' ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${val ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {val ? 'TRUE' : 'FALSE'}
                            </span>
                          ) : (
                            <span className="text-slate-700 line-clamp-1 max-w-xs">
                              {String(val ?? '-')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => setSelectedRow(row)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Inspect Record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspect Modal / Drawer */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedTableName}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  Record Relational Inspector
                </h3>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Field breakdown */}
            <div className="space-y-2">
              {Object.entries(selectedRow).map(([key, val]) => {
                const colDef = activeSchema.columns.find(c => c.name === key);
                return (
                  <div key={key} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-1 text-xs">
                    <div>
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        {colDef?.is_pk && <Key className="w-3 h-3 text-amber-600" />}
                        {colDef?.is_fk && <Link2 className="w-3 h-3 text-sky-600" />}
                        {key}
                        {colDef?.is_pk && <span className="text-[10px] text-amber-700 bg-amber-100 px-1 rounded">PK</span>}
                        {colDef?.is_fk && <span className="text-[10px] text-sky-700 bg-sky-100 px-1 rounded">FK</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{colDef?.description}</div>
                    </div>
                    <div className="font-mono font-semibold text-slate-900 text-right max-w-sm break-words bg-white px-2 py-1 rounded border border-slate-200">
                      {String(val ?? 'null')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Raw JSON */}
            <div className="space-y-1 pt-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Raw JSON Data:</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                {JSON.stringify(selectedRow, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
