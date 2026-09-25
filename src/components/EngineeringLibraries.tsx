import React, { useState } from 'react';
import { 
  Package, 
  Flame, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  Building2, 
  Tag, 
  Check, 
  ExternalLink,
  Layers,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { 
  VendorMaterialItem, 
  FireSuppressionComponent, 
  Vendor,
  LineItemCategory,
  FireSystemType
} from '../types/stmjDatabase';
import { formatIDR, formatUSD } from '../utils/stmjFormatters';

interface EngineeringLibrariesProps {
  vendorMaterials: VendorMaterialItem[];
  fireSuppressionLibrary: FireSuppressionComponent[];
  vendors: Vendor[];
  onAddVendorMaterial: (item: VendorMaterialItem) => void;
  onAddFireComponent: (comp: FireSuppressionComponent) => void;
}

export const EngineeringLibraries: React.FC<EngineeringLibrariesProps> = ({
  vendorMaterials,
  fireSuppressionLibrary,
  vendors,
  onAddVendorMaterial,
  onAddFireComponent,
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'fire_systems'>('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

  // New Material Form State
  const [newBrand, setNewBrand] = useState('HYGOOD');
  const [newVendorId, setNewVendorId] = useState(vendors[0]?.vendor_id || 'VND-001');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [newCategory, setNewCategory] = useState<LineItemCategory>('Fire Suppression Equipment');
  const [newUom, setNewUom] = useState('Unit');
  const [newPriceIdr, setNewPriceIdr] = useState<number>(0);
  const [newLeadTime, setNewLeadTime] = useState<number>(14);
  const [newUlFm, setNewUlFm] = useState(true);

  // Filtered Materials
  const filteredMaterials = vendorMaterials.filter(m => {
    const matchesSearch = 
      m.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'All' || m.brand === brandFilter;
    const matchesCategory = categoryFilter === 'All' || m.category === categoryFilter;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  // Filtered Fire Suppression
  const filteredFireComponents = fireSuppressionLibrary.filter(f => {
    return (
      f.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.system_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.design_standard.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const brands = ['All', ...Array.from(new Set(vendorMaterials.map(m => m.brand)))];
  const categories = ['All', ...Array.from(new Set(vendorMaterials.map(m => m.category)))];

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCode || !newItemName || newPriceIdr <= 0) return;

    const newMat: VendorMaterialItem = {
      material_id: `MAT-${newBrand.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      vendor_id: newVendorId,
      brand: newBrand,
      item_code: newItemCode,
      item_name: newItemName,
      specification: newSpec,
      category: newCategory,
      uom: newUom,
      standard_price_idr: newPriceIdr,
      standard_price_usd: Math.round(newPriceIdr / 16000),
      lead_time_days: newLeadTime,
      ul_fm_certified: newUlFm,
    };

    onAddVendorMaterial(newMat);
    setShowAddMaterialModal(false);
    setNewItemCode('');
    setNewItemName('');
    setNewSpec('');
    setNewPriceIdr(0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Master Technical Catalogs
            </span>
            <span className="text-xs text-slate-500">
              Standardized Part Codes, Specifications & Prices
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Engineering & Vendor Material Libraries
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Master engineering catalog containing HYGOOD Clean Agent components, Draeger gas detectors, and Schedule 40 seamless piping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddMaterialModal(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Catalog SKU
          </button>
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-indigo-600" />
            Vendor Material Library ({vendorMaterials.length})
          </button>

          <button
            onClick={() => setActiveTab('fire_systems')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'fire_systems'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Fire Suppression BOM Catalog ({fireSuppressionLibrary.length})
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search part #, specification, standard..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 bg-white"
            />
          </div>

          {activeTab === 'materials' && (
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
            >
              {brands.map(b => (
                <option key={b} value={b}>Brand: {b}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Vendor Material Catalog */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200 text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Part Code & SKU</th>
                  <th className="px-4 py-3">Brand & Supplier</th>
                  <th className="px-4 py-3">Item Specification</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Lead Time</th>
                  <th className="px-4 py-3 text-center">UL / FM</th>
                  <th className="px-4 py-3 text-right">Standard Price (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map(mat => {
                  const vendor = vendors.find(v => v.vendor_id === mat.vendor_id);

                  return (
                    <tr key={mat.material_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-indigo-700">
                          {mat.item_code}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {mat.material_id}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {mat.brand}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {vendor?.vendor_name}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-md">
                        <div className="font-medium text-slate-900">
                          {mat.item_name}
                        </div>
                        <div className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">
                          {mat.specification}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {mat.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className="text-slate-700 font-medium">{mat.lead_time_days} days</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {mat.ul_fm_certified ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            CERTIFIED
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Standard</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {formatIDR(mat.standard_price_idr)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          per {mat.uom}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fire Suppression BOM Catalog */}
      {activeTab === 'fire_systems' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFireComponents.map(comp => (
            <div key={comp.system_component_id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {comp.system_component_id}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {comp.system_type}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {comp.component_name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {comp.notes}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">DESIGN STANDARD</span>
                  <span className="font-semibold text-slate-800">{comp.design_standard}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">WORKING PRESSURE</span>
                  <span className="font-mono font-semibold text-slate-800">{comp.working_pressure_bar} Bar</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">ACTUATION METHOD</span>
                  <span className="font-semibold text-slate-800">{comp.actuation_method}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">DISCHARGE WINDOW</span>
                  <span className="font-mono font-semibold text-slate-800">{comp.discharge_time_seconds} seconds</span>
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <span className="font-medium text-slate-700">Target Hazard Coverage:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {comp.target_hazard_types.map((haz, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700">
                      {haz}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Add New Vendor Material SKU */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Register New Engineering Material SKU
              </h3>
              <button onClick={() => setShowAddMaterialModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300"
                    placeholder="e.g. HYGOOD, Draeger"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Assigned Vendor</label>
                  <select
                    value={newVendorId}
                    onChange={e => setNewVendorId(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    {vendors.map(v => (
                      <option key={v.vendor_id} value={v.vendor_id}>
                        {v.vendor_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Part / Item Code</label>
                  <input
                    type="text"
                    required
                    value={newItemCode}
                    onChange={e => setNewItemCode(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 font-mono"
                    placeholder="e.g. HYG-FK-CYL-80L"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as LineItemCategory)}
                    className="w-full p-2 rounded border border-slate-300"
                  >
                    <option value="Fire Suppression Equipment">Fire Suppression Equipment</option>
                    <option value="Gas Detection Systems">Gas Detection Systems</option>
                    <option value="Piping, Valves & Fittings">Piping, Valves & Fittings</option>
                    <option value="Electrical, Detection & Controls">Electrical & Controls</option>
                    <option value="Installation, Commissioning & Testing">Installation & BAST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Item Standard Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300"
                  placeholder="e.g. FK-5112 Clean Agent Cylinder 80L"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Technical Specification</label>
                <textarea
                  rows={2}
                  value={newSpec}
                  onChange={e => setNewSpec(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300"
                  placeholder="Capacity, working pressure, test certification standards..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Base Price (IDR)</label>
                  <input
                    type="number"
                    required
                    value={newPriceIdr || ''}
                    onChange={e => setNewPriceIdr(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 font-mono"
                    placeholder="Rp..."
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">UOM</label>
                  <input
                    type="text"
                    value={newUom}
                    onChange={e => setNewUom(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={newLeadTime}
                    onChange={e => setNewLeadTime(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ulfm"
                  checked={newUlFm}
                  onChange={e => setNewUlFm(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="ulfm" className="text-slate-700 font-medium">
                  UL Listed & FM Approved Certified Material
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Material to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
