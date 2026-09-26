import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  ArrowUpRight, 
  Calculator, 
  ShieldAlert, 
  X,
  FileCheck2,
  TrendingUp,
  Sliders,
  RefreshCw,
  AlertCircle,
  Truck,
  HardHat,
  Warehouse,
  MapPin,
  Activity,
  CheckCheck
} from 'lucide-react';
import { 
  Quotation, 
  QuotationLineItem, 
  Customer, 
  VendorMaterialItem, 
  FireSuppressionComponent,
  LineItemCategory,
  QuotationStatus,
  LogisticsDeliveryStage
} from '../types/stmjDatabase';
import { INITIAL_QUOTATION_LINE_ITEMS, INITIAL_QUOTATIONS } from '../data/stmjDatabaseSeed';
import { formatIDR, formatPercent, formatDate, getStatusBadgeClass } from '../utils/stmjFormatters';

interface QuotationManagerProps {
  quotations: Quotation[];
  customers: Customer[];
  lineItems: QuotationLineItem[];
  vendorMaterials: VendorMaterialItem[];
  fireSuppressionLibrary: FireSuppressionComponent[];
  selectedQuotationId?: string;
  onSelectQuotation?: (id: string) => void;
  onUpdateQuotation: (updated: Quotation) => void;
  onAddQuotation: (newQuo: Quotation, initialLines: QuotationLineItem[]) => void;
  onAddLineItem: (item: QuotationLineItem) => void;
  onUpdateLineItem?: (item: QuotationLineItem) => void;
  onBatchAddLineItems?: (items: QuotationLineItem[]) => void;
  onDeleteLineItem: (itemId: string) => void;
  onOpenCostCalculator: (quotationId: string) => void;
  onOpenMilestones: (quotationId: string) => void;
  onOpenExecutionTracker?: (quotationId: string) => void;
  onOpenProcurementTracker?: (quotationId?: string) => void;
  onResetDatabase?: () => void;
}

export const QuotationManager: React.FC<QuotationManagerProps> = ({
  quotations,
  customers,
  lineItems,
  vendorMaterials,
  fireSuppressionLibrary,
  selectedQuotationId: propSelectedQuotationId,
  onSelectQuotation,
  onUpdateQuotation,
  onAddQuotation,
  onAddLineItem,
  onUpdateLineItem,
  onBatchAddLineItems,
  onDeleteLineItem,
  onOpenCostCalculator,
  onOpenMilestones,
  onOpenExecutionTracker,
  onOpenProcurementTracker,
  onResetDatabase,
}) => {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>(
    propSelectedQuotationId || quotations[0]?.quotation_id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [boqViewMode, setBoqViewMode] = useState<'commercial' | 'logistics'>('commercial');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showNewQuoModal, setShowNewQuoModal] = useState(false);

  // New RFQ Form State
  const [rfqQuoNumber, setRfqQuoNumber] = useState('');
  const [rfqCustomerId, setRfqCustomerId] = useState('');
  const [rfqIsNewCustomer, setRfqIsNewCustomer] = useState(false);
  const [rfqNewCustName, setRfqNewCustName] = useState('');
  const [rfqNewCustContact, setRfqNewCustContact] = useState('');
  const [rfqNewCustEmail, setRfqNewCustEmail] = useState('');
  const [rfqNewCustPhone, setRfqNewCustPhone] = useState('');
  const [rfqProjectName, setRfqProjectName] = useState('');
  const [rfqTargetMargin, setRfqTargetMargin] = useState(28.5);
  const [rfqTemplate, setRfqTemplate] = useState<'fk5112' | 'co2' | 'gas_detect' | 'blank'>('fk5112');
  const [rfqDeliveryTimeline, setRfqDeliveryTimeline] = useState('4 to 6 Weeks after receipt of PO & Down Payment');
  const [rfqPaymentTerms, setRfqPaymentTerms] = useState('Termin 1: DP 30% upon PO & Contract | Termin 2: 30% Material Delivery On-Site | Termin 3: 30% Mechanical Installation | Termin 4: 10% Commissioning & BAST Handover');
  const [rfqCreatedBy, setRfqCreatedBy] = useState('Ir. Hendra Gunawan (Lead Sales & Project Engineer)');
  const [rfqStatus, setRfqStatus] = useState<QuotationStatus>('Draft');
  const [rfqError, setRfqError] = useState('');

  const handleOpenNewRfqModal = () => {
    const nextSeq = quotations.length + 1;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    setRfqQuoNumber(`STMJ/QUO/${year}/${month}/${String(nextSeq).padStart(3, '0')}`);
    setRfqCustomerId(customers[0]?.customer_id || 'CUST-001');
    setRfqIsNewCustomer(false);
    setRfqNewCustName('');
    setRfqNewCustContact('');
    setRfqNewCustEmail('');
    setRfqNewCustPhone('');
    setRfqProjectName('');
    setRfqTargetMargin(28.5);
    setRfqTemplate('fk5112');
    setRfqDeliveryTimeline('4 to 6 Weeks after receipt of PO & Down Payment');
    setRfqPaymentTerms('Termin 1: DP 30% upon PO & Contract | Termin 2: 30% Material Delivery On-Site | Termin 3: 30% Mechanical Installation | Termin 4: 10% Commissioning & BAST Handover');
    setRfqCreatedBy('Ir. Hendra Gunawan (Lead Sales & Project Engineer)');
    setRfqStatus('Draft');
    setRfqError('');
    setShowNewQuoModal(true);
  };

  const handleCreateRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqProjectName.trim()) {
      setRfqError('Please enter the Project Name / Scope of Work.');
      return;
    }

    let customerId = rfqCustomerId;
    if (rfqIsNewCustomer) {
      if (!rfqNewCustName.trim()) {
        setRfqError('Please enter the New Customer Company Name.');
        return;
      }
      customerId = `CUST-${Date.now().toString().slice(-4)}`;
      const newCustomer: Customer = {
        customer_id: customerId,
        company_name: rfqNewCustName.trim(),
        industry: 'Industrial & Manufacturing',
        contact_person: rfqNewCustContact.trim() || 'Procurement Team',
        email: rfqNewCustEmail.trim() || 'procurement@client.co.id',
        phone: rfqNewCustPhone.trim() || '+62 21 555-0100',
        city: 'Jakarta',
        address: 'Kawasan Industri, Indonesia',
        npwp_tax_id: '01.234.567.8-012.000',
        payment_term_days: 30,
      };
      customers.push(newCustomer);
    }

    const newQuoId = `Q-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const validUntilDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    // Build starter lines based on chosen template
    let starterLines: QuotationLineItem[] = [];
    if (rfqTemplate === 'fk5112') {
      starterLines = [
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-1`,
          quotation_id: newQuoId,
          material_id: 'MAT-HYG-01',
          item_code: 'HYG-FK-CYL-140L',
          description: 'HYGOOD Clean Agent Seamless Cylinder 140L Capacity with discharge valve & pressure switch',
          category: 'Fire Suppression Equipment',
          quantity: 2,
          uom: 'Cylinder',
          unit_hpp_idr: 98500000,
          markup_pct: 35,
          unit_price_idr: 132975000,
          total_hpp_idr: 197000000,
          total_price_idr: 265950000,
          gross_profit_idr: 68950000,
          margin_pct: 25.93,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-2`,
          quotation_id: newQuoId,
          material_id: 'MAT-HYG-02',
          item_code: 'HYG-FK-GAS-KG',
          description: 'FK-5112 Clean Extinguishing Agent Gas Filling (UL Recognized / FM Approved)',
          category: 'Fire Suppression Equipment',
          quantity: 80,
          uom: 'Kg',
          unit_hpp_idr: 685000,
          markup_pct: 32,
          unit_price_idr: 904200,
          total_hpp_idr: 54800000,
          total_price_idr: 72336000,
          gross_profit_idr: 17536000,
          margin_pct: 24.24,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-3`,
          quotation_id: newQuoId,
          material_id: 'MAT-HYG-03',
          item_code: 'HYG-NOZ-360-15',
          description: 'Discharge Nozzle 360° 1.5" NPT Brass (Engineered Orifice Drilled)',
          category: 'Fire Suppression Equipment',
          quantity: 4,
          uom: 'Unit',
          unit_hpp_idr: 4250000,
          markup_pct: 40,
          unit_price_idr: 5950000,
          total_hpp_idr: 17000000,
          total_price_idr: 23800000,
          gross_profit_idr: 6800000,
          margin_pct: 28.57,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-4`,
          quotation_id: newQuoId,
          material_id: 'MAT-PIP-01',
          item_code: 'PIP-SCH40-2IN',
          description: 'Seamless Carbon Steel Pipe 2" ASTM A106 Gr. B Sch 40 & 3000# Forged Fittings',
          category: 'Piping, Valves & Fittings',
          quantity: 36,
          uom: 'Meter',
          unit_hpp_idr: 345000,
          markup_pct: 42,
          unit_price_idr: 489900,
          total_hpp_idr: 12420000,
          total_price_idr: 17636400,
          gross_profit_idr: 5216400,
          margin_pct: 29.58,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-5`,
          quotation_id: newQuoId,
          material_id: 'MAT-APO-02',
          item_code: 'TYC-PANEL-GAS-EXT',
          description: 'Extinguishing Control Panel 3-Zone with abort station, horn/strobe & battery',
          category: 'Electrical, Detection & Controls',
          quantity: 1,
          uom: 'Set',
          unit_hpp_idr: 34500000,
          markup_pct: 35,
          unit_price_idr: 46575000,
          total_hpp_idr: 34500000,
          total_price_idr: 46575000,
          gross_profit_idr: 12075000,
          margin_pct: 25.93,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-6`,
          quotation_id: newQuoId,
          item_code: 'SRV-INSTALL-MEP',
          description: 'Piping Erection, Certified Welder 6G, Pressure Hydrotest & Room Integrity Fan Test (BAST)',
          category: 'Installation, Commissioning & Testing',
          quantity: 1,
          uom: 'Lot',
          unit_hpp_idr: 45000000,
          markup_pct: 65,
          unit_price_idr: 74250000,
          total_hpp_idr: 45000000,
          total_price_idr: 74250000,
          gross_profit_idr: 29250000,
          margin_pct: 39.39,
        },
      ];
    } else if (rfqTemplate === 'co2') {
      starterLines = [
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-1`,
          quotation_id: newQuoId,
          item_code: 'CO2-CYL-68L-HP',
          description: 'High Pressure Seamless CO2 Cylinder 68L with Master Discharge Valve & Actuator',
          category: 'Fire Suppression Equipment',
          quantity: 6,
          uom: 'Cylinder',
          unit_hpp_idr: 18500000,
          markup_pct: 40,
          unit_price_idr: 25900000,
          total_hpp_idr: 111000000,
          total_price_idr: 155400000,
          gross_profit_idr: 44400000,
          margin_pct: 28.57,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-2`,
          quotation_id: newQuoId,
          item_code: 'CO2-GAS-CHARGE-KG',
          description: 'CO2 Liquid Chemical Gas Charge (Purity >= 99.9%)',
          category: 'Fire Suppression Equipment',
          quantity: 270,
          uom: 'Kg',
          unit_hpp_idr: 95000,
          markup_pct: 45,
          unit_price_idr: 137750,
          total_hpp_idr: 25650000,
          total_price_idr: 37192500,
          gross_profit_idr: 11542500,
          margin_pct: 31.03,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-3`,
          quotation_id: newQuoId,
          item_code: 'PIP-SCH80-2IN',
          description: 'Seamless Carbon Steel Pipe ASTM A106 Gr. B Sch 80 & 3000# Forged High-Pressure Fittings',
          category: 'Piping, Valves & Fittings',
          quantity: 36,
          uom: 'Meter',
          unit_hpp_idr: 620000,
          markup_pct: 48,
          unit_price_idr: 917600,
          total_hpp_idr: 22320000,
          total_price_idr: 33033600,
          gross_profit_idr: 10713600,
          margin_pct: 32.43,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-4`,
          quotation_id: newQuoId,
          item_code: 'SRV-CO2-INSTALL',
          description: 'High-Pressure Pipe Erection, 150-bar Hydrotest, Disnaker Inspection & BAST Handover',
          category: 'Installation, Commissioning & Testing',
          quantity: 1,
          uom: 'Lot',
          unit_hpp_idr: 38000000,
          markup_pct: 55,
          unit_price_idr: 58900000,
          total_hpp_idr: 38000000,
          total_price_idr: 58900000,
          gross_profit_idr: 20900000,
          margin_pct: 35.48,
        },
      ];
    } else if (rfqTemplate === 'gas_detect') {
      starterLines = [
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-1`,
          quotation_id: newQuoId,
          material_id: 'MAT-DRG-01',
          item_code: 'DRG-PEX-7000',
          description: 'Draeger Polytron 7000 Fixed Toxic & Combustible Gas Transmitter with HART (SIL-2)',
          category: 'Gas Detection Systems',
          quantity: 4,
          uom: 'Unit',
          unit_hpp_idr: 28400000,
          markup_pct: 38,
          unit_price_idr: 39192000,
          total_hpp_idr: 113600000,
          total_price_idr: 156768000,
          gross_profit_idr: 43168000,
          margin_pct: 27.54,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-2`,
          quotation_id: newQuoId,
          material_id: 'MAT-SNK-01',
          item_code: 'SNK-SP2ND-CO',
          description: 'Senko SP2nd Personal Carbon Monoxide Portable Monitor with Calibration Kit',
          category: 'Gas Detection Systems',
          quantity: 6,
          uom: 'Unit',
          unit_hpp_idr: 4600000,
          markup_pct: 42,
          unit_price_idr: 6532000,
          total_hpp_idr: 27600000,
          total_price_idr: 39192000,
          gross_profit_idr: 11592000,
          margin_pct: 29.58,
        },
        {
          item_id: `QLI-${Date.now().toString().slice(-4)}-3`,
          quotation_id: newQuoId,
          item_code: 'SRV-OFFSHORE-FAT',
          description: 'Factory Acceptance Test (FAT), Sensor Calibration Gas & Disnaker Certification',
          category: 'Installation, Commissioning & Testing',
          quantity: 1,
          uom: 'Lot',
          unit_hpp_idr: 32000000,
          markup_pct: 60,
          unit_price_idr: 51200000,
          total_hpp_idr: 32000000,
          total_price_idr: 51200000,
          gross_profit_idr: 19200000,
          margin_pct: 37.5,
        },
      ];
    }

    const subtotalHpp = starterLines.reduce((acc, li) => acc + li.total_hpp_idr, 0);
    const subtotalSell = starterLines.reduce((acc, li) => acc + li.total_price_idr, 0);
    const ppn = subtotalSell * 0.11;
    const total = subtotalSell + ppn;
    const grossProfit = subtotalSell - subtotalHpp;
    const margin = subtotalSell > 0 ? (grossProfit / subtotalSell) * 100 : rfqTargetMargin;

    const newQuotation: Quotation = {
      quotation_id: newQuoId,
      quotation_number: rfqQuoNumber.trim() || `STMJ/QUO/${new Date().getFullYear()}/0${quotations.length + 10}`,
      customer_id: customerId,
      project_name: rfqProjectName.trim(),
      quotation_date: today,
      valid_until: validUntilDate,
      currency: 'IDR',
      subtotal_hpp_idr: subtotalHpp,
      target_margin_pct: Number(margin.toFixed(2)),
      subtotal_sell_idr: subtotalSell,
      ppn_pct: 11,
      ppn_amount_idr: ppn,
      total_amount_idr: total,
      payment_terms_desc: rfqPaymentTerms,
      delivery_timeline: rfqDeliveryTimeline,
      status: rfqStatus,
      created_by: rfqCreatedBy,
      notes: `Newly created tender RFQ in STMJ ERP. Selected standard engineering template: ${rfqTemplate.toUpperCase()}.`,
    };

    onAddQuotation(newQuotation, starterLines);
    setSelectedQuotationId(newQuotation.quotation_id);
    onSelectQuotation?.(newQuotation.quotation_id);
    setStatusFilter('All');
    setShowNewQuoModal(false);
  };

  // Sync incoming propSelectedQuotationId
  useEffect(() => {
    if (propSelectedQuotationId && propSelectedQuotationId !== selectedQuotationId) {
      setSelectedQuotationId(propSelectedQuotationId);
      // If the targeted quotation has a specific status and it's currently hidden by statusFilter, reset filter to All
      const target = quotations.find(q => q.quotation_id === propSelectedQuotationId);
      if (target && statusFilter !== 'All' && target.status !== statusFilter) {
        setStatusFilter('All');
      }
    }
  }, [propSelectedQuotationId, quotations]);

  // New Line Item State
  const [selectedCatalogMatId, setSelectedCatalogMatId] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemMarkup, setNewItemMarkup] = useState<number>(35);
  const [customItemDesc, setCustomItemDesc] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<LineItemCategory>('Fire Suppression Equipment');
  const [customHpp, setCustomHpp] = useState<number>(0);
  const [customUom, setCustomUom] = useState<string>('Unit');

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const cust = customers.find(c => c.customer_id === q.customer_id);
      const matchesSearch = 
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, customers, searchTerm, statusFilter]);

  // When filteredQuotations change, ensure selectedQuotationId is in the list
  useEffect(() => {
    if (filteredQuotations.length > 0) {
      const isSelectedInList = filteredQuotations.some(q => q.quotation_id === selectedQuotationId);
      if (!isSelectedInList) {
        const nextId = filteredQuotations[0].quotation_id;
        setSelectedQuotationId(nextId);
        onSelectQuotation?.(nextId);
      }
    }
  }, [filteredQuotations, selectedQuotationId, onSelectQuotation]);

  const activeQuotation = useMemo(() => {
    if (filteredQuotations.length > 0) {
      const matchInFiltered = filteredQuotations.find(q => q.quotation_id === selectedQuotationId);
      if (matchInFiltered) return matchInFiltered;
      return filteredQuotations[0];
    }
    return quotations.find(q => q.quotation_id === selectedQuotationId) || quotations[0];
  }, [filteredQuotations, quotations, selectedQuotationId]);

  const activeCustomer = useMemo(() => {
    if (!activeQuotation) return null;
    return customers.find(c => c.customer_id === activeQuotation.customer_id) || null;
  }, [customers, activeQuotation]);

  const activeLineItems = useMemo(() => {
    if (!activeQuotation) return [];
    return lineItems.filter(li => li.quotation_id === activeQuotation.quotation_id);
  }, [lineItems, activeQuotation]);

  // Default seed items for the current active quotation if BoQ is empty
  const defaultSeedLinesForActive = useMemo(() => {
    if (!activeQuotation) return [];
    return INITIAL_QUOTATION_LINE_ITEMS.filter(li => li.quotation_id === activeQuotation.quotation_id);
  }, [activeQuotation]);

  const handleRestoreDefaultSeedBoQ = () => {
    if (!activeQuotation || defaultSeedLinesForActive.length === 0) return;
    if (onBatchAddLineItems) {
      onBatchAddLineItems(defaultSeedLinesForActive);
    } else {
      defaultSeedLinesForActive.forEach(item => onAddLineItem(item));
    }
  };

  // Aggregate Metrics for Active Quotation
  const calculatedTotals = useMemo(() => {
    const totalHpp = activeLineItems.reduce((acc, li) => acc + li.total_hpp_idr, 0);
    const totalSell = activeLineItems.reduce((acc, li) => acc + li.total_price_idr, 0);
    const grossProfit = totalSell - totalHpp;
    const marginPct = totalSell > 0 ? (grossProfit / totalSell) * 100 : 0;
    const ppn = totalSell * 0.11;
    const grandTotal = totalSell + ppn;
    return { totalHpp, totalSell, grossProfit, marginPct, ppn, grandTotal };
  }, [activeLineItems]);

  // Handle Adding Item from Library
  const handleAddCatalogItem = () => {
    if (!activeQuotation) return;

    if (selectedCatalogMatId) {
      const mat = vendorMaterials.find(m => m.material_id === selectedCatalogMatId);
      if (!mat) return;

      const unitHpp = mat.standard_price_idr;
      const markup = newItemMarkup;
      const unitPrice = Math.round(unitHpp * (1 + markup / 100));
      const totalHpp = unitHpp * newItemQty;
      const totalPrice = unitPrice * newItemQty;
      const profit = totalPrice - totalHpp;
      const margin = (profit / totalPrice) * 100;

      const newItem: QuotationLineItem = {
        item_id: `QLI-${Date.now().toString().slice(-4)}`,
        quotation_id: activeQuotation.quotation_id,
        material_id: mat.material_id,
        item_code: mat.item_code,
        description: mat.item_name,
        category: mat.category,
        quantity: newItemQty,
        uom: mat.uom,
        unit_hpp_idr: unitHpp,
        markup_pct: markup,
        unit_price_idr: unitPrice,
        total_hpp_idr: totalHpp,
        total_price_idr: totalPrice,
        gross_profit_idr: profit,
        margin_pct: margin,
      };

      onAddLineItem(newItem);
    } else if (customItemDesc && customHpp > 0) {
      const unitHpp = customHpp;
      const markup = newItemMarkup;
      const unitPrice = Math.round(unitHpp * (1 + markup / 100));
      const totalHpp = unitHpp * newItemQty;
      const totalPrice = unitPrice * newItemQty;
      const profit = totalPrice - totalHpp;
      const margin = (profit / totalPrice) * 100;

      const newItem: QuotationLineItem = {
        item_id: `QLI-${Date.now().toString().slice(-4)}`,
        quotation_id: activeQuotation.quotation_id,
        item_code: `CUSTOM-${Date.now().toString().slice(-3)}`,
        description: customItemDesc,
        category: customCategory,
        quantity: newItemQty,
        uom: customUom,
        unit_hpp_idr: unitHpp,
        markup_pct: markup,
        unit_price_idr: unitPrice,
        total_hpp_idr: totalHpp,
        total_price_idr: totalPrice,
        gross_profit_idr: profit,
        margin_pct: margin,
      };

      onAddLineItem(newItem);
    }

    setShowAddItemModal(false);
    setSelectedCatalogMatId('');
    setCustomItemDesc('');
    setCustomHpp(0);
  };

  // Status Change
  const handleStatusChange = (newStatus: QuotationStatus) => {
    if (!activeQuotation) return;
    onUpdateQuotation({
      ...activeQuotation,
      status: newStatus,
    });
  };

  // Quick Logistics Stage Advance per BOQ item
  const handleQuickAdvanceLogistics = (item: QuotationLineItem) => {
    if (!onUpdateLineItem) return;
    const stages: LogisticsDeliveryStage[] = [
      'Stage 1: PO Issued & Paid',
      'Stage 2: Delivered to STMJ Office',
      'Stage 3: Dispatched to Client Site',
      'Stage 4: Arrived at Site',
      'Stage 5: Ready for Installation'
    ];
    const currentStage = item.logistics_stage || 'Stage 1: PO Issued & Paid';
    const currentIndex = stages.indexOf(currentStage);
    const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)];

    let deliveredOffice = item.delivered_to_stmj_office || false;
    let sentSite = item.sent_to_client_site || false;
    let arrivedSite = item.arrived_at_site || false;
    let readyInstall = item.ready_for_installation || false;
    let poStatus = item.po_status || 'PO Issued';
    const today = new Date().toISOString().split('T')[0];

    if (nextStage === 'Stage 2: Delivered to STMJ Office') {
      deliveredOffice = true;
      poStatus = 'Delivered to STMJ Office';
    } else if (nextStage === 'Stage 3: Dispatched to Client Site') {
      deliveredOffice = true;
      sentSite = true;
      poStatus = 'Sent to Client Site';
    } else if (nextStage === 'Stage 4: Arrived at Site') {
      deliveredOffice = true;
      sentSite = true;
      arrivedSite = true;
      poStatus = 'Arrived at Site & Inspected';
    } else if (nextStage === 'Stage 5: Ready for Installation') {
      deliveredOffice = true;
      sentSite = true;
      arrivedSite = true;
      readyInstall = true;
      poStatus = 'Ready for Installation';
    }

    const updated: QuotationLineItem = {
      ...item,
      logistics_stage: nextStage,
      po_status: poStatus,
      delivered_to_stmj_office: deliveredOffice,
      delivered_to_stmj_date: deliveredOffice && !item.delivered_to_stmj_date ? today : item.delivered_to_stmj_date,
      sent_to_client_site: sentSite,
      sent_to_site_date: sentSite && !item.sent_to_site_date ? today : item.sent_to_site_date,
      arrived_at_site: arrivedSite,
      arrived_at_site_date: arrivedSite && !item.arrived_at_site_date ? today : item.arrived_at_site_date,
      ready_for_installation: readyInstall,
      installation_status: readyInstall ? 'In Progress' : item.installation_status,
    };
    onUpdateLineItem(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Quotations Active</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{quotations.length}</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {quotations.filter(q => q.status === 'Won / PO Received').length} Won & PO Issued
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Pipeline Quotation Value</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatIDR(quotations.reduce((acc, q) => acc + q.total_amount_idr, 0))}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all industrial sectors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Active HPP (Cost of Goods)</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatIDR(quotations.reduce((acc, q) => acc + q.subtotal_hpp_idr, 0))}
          </div>
          <div className="text-xs text-blue-600 mt-1">Bottom-up procurement budget</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Average Target Margin</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
            {formatPercent(quotations.reduce((acc, q) => acc + q.target_margin_pct, 0) / (quotations.length || 1))}
          </div>
          <div className="text-xs text-slate-500 mt-1">Contract gross profitability</div>
        </div>
      </div>

      {/* Main Split Layout: Left List, Right Quotation Detail & BOQ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Quotations List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Quotation Registry ({filteredQuotations.length})
              </h3>
              <button
                onClick={handleOpenNewRfqModal}
                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New RFQ
              </button>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quotation #, project, client..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { key: 'All', label: 'All', count: quotations.length },
                  { key: 'Won / PO Received', label: 'Won & PO', count: quotations.filter(q => q.status === 'Won / PO Received').length },
                  { key: 'Submitted to Client', label: 'Submitted', count: quotations.filter(q => q.status === 'Submitted to Client').length },
                  { key: 'Internal Review', label: 'Review', count: quotations.filter(q => q.status === 'Internal Review').length },
                  { key: 'Draft', label: 'Draft', count: quotations.filter(q => q.status === 'Draft').length },
                ].map(st => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-2 py-1 whitespace-nowrap rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      statusFilter === st.key 
                        ? 'bg-indigo-600 text-white shadow-2xs font-semibold' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className={`px-1 py-0.2 rounded-full text-[10px] font-mono ${
                      statusFilter === st.key ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredQuotations.map(quo => {
                const cust = customers.find(c => c.customer_id === quo.customer_id);
                const isSelected = quo.quotation_id === selectedQuotationId;

                return (
                  <div
                    key={quo.quotation_id}
                    onClick={() => setSelectedQuotationId(quo.quotation_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                        {quo.quotation_number}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(quo.status)}`}>
                        {quo.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                      {cust?.company_name || 'Direct Client'}
                    </div>

                    <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                      {quo.project_name}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">TOTAL (INC. PPN)</span>
                        <span className="font-mono font-bold text-slate-900">{formatIDR(quo.total_amount_idr)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">TARGET MARGIN</span>
                        <span className="font-mono font-bold text-emerald-600">{formatPercent(quo.target_margin_pct)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Quotation Header, BOQ Lines, & Commercial Terms */}
        <div className="lg:col-span-8 space-y-4">
          {activeQuotation ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header Zone */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/60">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {activeQuotation.quotation_number}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">Date: {formatDate(activeQuotation.quotation_date)}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">Valid Until: {formatDate(activeQuotation.valid_until)}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      {activeCustomer?.company_name || 'Client Project'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                      {activeQuotation.project_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {/* Status Dropdown */}
                    <select
                      value={activeQuotation.status}
                      onChange={e => handleStatusChange(e.target.value as QuotationStatus)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadgeClass(activeQuotation.status)}`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Internal Review">Internal Review</option>
                      <option value="Submitted to Client">Submitted to Client</option>
                      <option value="Won / PO Received">Won / PO Received</option>
                      <option value="Revision Requested">Revision Requested</option>
                      <option value="Lost">Lost</option>
                    </select>

                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      Print Official Proposal
                    </button>
                  </div>
                </div>

                {/* Sub-Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => onOpenCostCalculator(activeQuotation.quotation_id)}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Open Bottom-Up Cost Sheet (HPP)
                  </button>

                  <button
                    onClick={() => onOpenMilestones(activeQuotation.quotation_id)}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Project Milestones & Termin Billing (5 Stages)
                  </button>

                  {onOpenExecutionTracker && (
                    <button
                      onClick={() => onOpenExecutionTracker(activeQuotation.quotation_id)}
                      className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Open WBS Progress (L1/L2/L3), Vendor PO Status, Lead Time & FAT Commissioning Schedules"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      Site Execution & WBS (L1-3)
                    </button>
                  )}

                  {onOpenProcurementTracker && (
                    <button
                      onClick={() => onOpenProcurementTracker(activeQuotation.quotation_id)}
                      className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Open Consolidated Procurement Tracker for all BOQ Items, Vendor POs, Office Delivery, Site Arrival & Installation Readiness"
                    >
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      Procurement Tracker
                    </button>
                  )}

                  <div className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                    <span className="font-medium text-slate-700">Created by:</span>
                    <span>{activeQuotation.created_by}</span>
                  </div>
                </div>
              </div>

              {/* Bill of Quantities (BOQ) Table */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Bill of Quantities (BOQ) & Itemized Quotation Lines ({activeLineItems.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Standardized materials linked from Vendor Material & Fire Suppression Libraries.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher: Commercial vs Logistics */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        onClick={() => setBoqViewMode('commercial')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          boqViewMode === 'commercial'
                            ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Commercial Pricing (HPP / Sell)
                      </button>
                      <button
                        onClick={() => setBoqViewMode('logistics')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                          boqViewMode === 'logistics'
                            ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        Vendor PO & Logistics Flow
                      </button>
                    </div>

                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      {boqViewMode === 'commercial' ? (
                        <tr>
                          <th className="px-3 py-2.5">Item & Specification</th>
                          <th className="px-3 py-2.5">Category</th>
                          <th className="px-3 py-2.5 text-center">Qty / UOM</th>
                          <th className="px-3 py-2.5 text-right">Unit HPP (Cost)</th>
                          <th className="px-3 py-2.5 text-center">Markup</th>
                          <th className="px-3 py-2.5 text-right">Unit Price</th>
                          <th className="px-3 py-2.5 text-right">Total Price (IDR)</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-3 py-2.5">BOQ Item & Spec</th>
                          <th className="px-3 py-2.5">Vendor & Issued PO #</th>
                          <th className="px-3 py-2.5">Lead Time & Target Arrival</th>
                          <th className="px-3 py-2.5 text-center">Vendor Payment</th>
                          <th className="px-3 py-2.5">Logistics & Site Stage</th>
                          <th className="px-3 py-2.5 text-center">Quick Advance</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeLineItems.length === 0 ? (
                        <tr>
                          <td colSpan={boqViewMode === 'commercial' ? 8 : 7} className="px-4 py-10 text-center bg-slate-50/50">
                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <div className="font-semibold text-slate-800 text-xs">
                              No BOQ line items registered for {activeQuotation.quotation_id}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                              This quotation does not currently have bill of quantity lines in local storage.
                            </p>
                            {defaultSeedLinesForActive.length > 0 && (
                              <button
                                onClick={handleRestoreDefaultSeedBoQ}
                                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs inline-flex items-center gap-1.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Load Standard Engineering BOQ ({defaultSeedLinesForActive.length} items)
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        activeLineItems.map(item => {
                          if (boqViewMode === 'commercial') {
                            return (
                              <tr key={item.item_id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="font-mono text-[11px] font-bold text-indigo-700">
                                    {item.item_code}
                                  </div>
                                  <div className="text-xs text-slate-800 font-medium mt-0.5 line-clamp-2">
                                    {item.description}
                                  </div>
                                  {item.material_id && (
                                    <span className="text-[10px] font-mono text-sky-600">
                                      ↳ Catalog: {item.material_id}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-center font-mono">
                                  <span className="font-bold text-slate-900">{item.quantity}</span> {item.uom}
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-slate-600">
                                  {formatIDR(item.unit_hpp_idr)}
                                </td>
                                <td className="px-3 py-3 text-center font-mono">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                    +{item.markup_pct}%
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-right font-mono font-semibold text-slate-800">
                                  {formatIDR(item.unit_price_idr)}
                                </td>
                                <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                                  {formatIDR(item.total_price_idr)}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => onDeleteLineItem(item.item_id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          } else {
                            // Logistics & Vendor PO view
                            const stage = item.logistics_stage || 'Stage 1: PO Issued & Paid';
                            const poNum = item.vendor_po_number || 'Pending PO';
                            const isDeliveredOffice = item.delivered_to_stmj_office;
                            const isArrivedSite = item.arrived_at_site;
                            const isReadyInstall = item.ready_for_installation;

                            return (
                              <tr key={item.item_id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="font-mono text-[11px] font-bold text-indigo-700">
                                    {item.item_code}
                                  </div>
                                  <div className="text-xs text-slate-800 font-medium mt-0.5 line-clamp-1">
                                    {item.description}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Qty: {item.quantity} {item.uom}
                                  </div>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="font-medium text-slate-900 text-xs">
                                    {item.vendor_name || 'Standard Industrial Vendor'}
                                  </div>
                                  <div className="mt-0.5">
                                    {item.vendor_po_number ? (
                                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        {item.vendor_po_number}
                                      </span>
                                    ) : (
                                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        PO Pending Issuance
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="text-slate-800 font-medium text-xs">
                                    {item.lead_time_desc || '2 to 4 Weeks standard'}
                                  </div>
                                  {item.expected_arrival_date && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      ETA: {formatDate(item.expected_arrival_date)}
                                    </div>
                                  )}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                    item.vendor_payment_status?.includes('100%')
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : item.vendor_payment_status?.includes('DP')
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {item.vendor_payment_status || 'Unpaid'}
                                  </span>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="flex flex-col gap-1">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 w-fit border ${
                                      isReadyInstall
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : isArrivedSite
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : isDeliveredOffice
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}>
                                      {isReadyInstall ? (
                                        <CheckCheck className="w-3 h-3 text-purple-600" />
                                      ) : isArrivedSite ? (
                                        <MapPin className="w-3 h-3 text-indigo-600" />
                                      ) : isDeliveredOffice ? (
                                        <Warehouse className="w-3 h-3 text-amber-600" />
                                      ) : (
                                        <Truck className="w-3 h-3 text-slate-500" />
                                      )}
                                      {stage}
                                    </span>

                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                      {isDeliveredOffice && <span className="text-amber-700">✓ Office</span>}
                                      {isArrivedSite && <span className="text-indigo-700">✓ Site</span>}
                                      {isReadyInstall && <span className="text-emerald-700">✓ Ready to Install</span>}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-3 py-3 text-center">
                                  {onUpdateLineItem && (
                                    <button
                                      onClick={() => handleQuickAdvanceLogistics(item)}
                                      className="px-2 py-1 text-[10px] font-bold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-colors flex items-center gap-1 mx-auto"
                                      title="Advance to next logistics stage"
                                    >
                                      <span>Advance ➔</span>
                                    </button>
                                  )}
                                </td>

                                <td className="px-3 py-3 text-center">
                                  {onOpenExecutionTracker && (
                                    <button
                                      onClick={() => onOpenExecutionTracker(activeQuotation.quotation_id)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                      title="Open Site Execution & WBS Tracker"
                                    >
                                      <Activity className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Footer Box */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Commercial Payment & Delivery Terms
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-600 text-xs">
                      {activeQuotation.payment_terms_desc}
                    </div>
                    <div className="text-slate-500">
                      <span className="font-medium text-slate-700">Committed Timeline:</span> {activeQuotation.delivery_timeline}
                    </div>
                  </div>

                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Total Bottom-Up Cost (HPP):</span>
                      <span className="font-mono font-semibold">{formatIDR(calculatedTotals.totalHpp)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Subtotal Selling Price:</span>
                      <span className="font-mono font-semibold">{formatIDR(calculatedTotals.totalSell)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-emerald-700 font-medium">
                      <span>Gross Profit Contribution:</span>
                      <span className="font-mono font-bold">{formatIDR(calculatedTotals.grossProfit)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-emerald-700 font-medium">
                      <span>Target Gross Margin:</span>
                      <span className="font-mono font-bold">{formatPercent(calculatedTotals.marginPct)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <span>PPN (11% Value-Added Tax):</span>
                      <span className="font-mono">{formatIDR(calculatedTotals.ppn)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>FINAL QUOTATION TOTAL:</span>
                      <span className="font-mono text-indigo-700">{formatIDR(calculatedTotals.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select or create a quotation to inspect line items.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add Item to BOQ from Catalog or Custom */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Add Item to Bill of Quantities (BOQ)
              </h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select from Vendor Catalog & Fire Suppression Library
                </label>
                <select
                  value={selectedCatalogMatId}
                  onChange={e => setSelectedCatalogMatId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Standard Material SKU or Enter Custom Below --</option>
                  {vendorMaterials.map(mat => (
                    <option key={mat.material_id} value={mat.material_id}>
                      [{mat.brand}] {mat.item_name} - {formatIDR(mat.standard_price_idr)} / {mat.uom}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCatalogMatId && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700">Or Custom Line Item / Installation Service:</div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule 40 Seamless Pipe Erection & Certified Welder 6G"
                      value={customItemDesc}
                      onChange={e => setCustomItemDesc(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Category</label>
                      <select
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value as LineItemCategory)}
                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                      >
                        <option value="Fire Suppression Equipment">Fire Suppression</option>
                        <option value="Gas Detection Systems">Gas Detection</option>
                        <option value="Piping, Valves & Fittings">Piping & Valves</option>
                        <option value="Electrical, Detection & Controls">Electrical/Panel</option>
                        <option value="Installation, Commissioning & Testing">Installation/BAST</option>
                        <option value="Consumables & Logistics">Consumables/Freight</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Base HPP (IDR)</label>
                      <input
                        type="number"
                        placeholder="Cost"
                        value={customHpp || ''}
                        onChange={e => setCustomHpp(Number(e.target.value))}
                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">UOM</label>
                      <input
                        type="text"
                        value={customUom}
                        onChange={e => setCustomUom(e.target.value)}
                        className="w-full text-xs p-1.5 rounded border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={e => setNewItemQty(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Markup Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={newItemMarkup}
                    onChange={e => setNewItemMarkup(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCatalogItem}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
              >
                Insert Item into BOQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create New RFQ / Tender Quotation */}
      {showNewQuoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Create New Engineering RFQ / Tender Quotation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registers a new proposal header, initializes 1:1 project costing (HPP), and generates starter BOQ lines.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewQuoModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRfq} className="p-6 space-y-5 text-xs max-h-[78vh] overflow-y-auto">
              {rfqError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rfqError}</span>
                </div>
              )}

              {/* Section 1: Customer & Quotation Reference */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    1. Client & Reference Number
                  </span>
                  <button
                    type="button"
                    onClick={() => setRfqIsNewCustomer(!rfqIsNewCustomer)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline lowercase"
                  >
                    {rfqIsNewCustomer ? '← select existing client' : '+ add new client company'}
                  </button>
                </div>

                {!rfqIsNewCustomer ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Target Client / Customer <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={rfqCustomerId}
                      onChange={e => setRfqCustomerId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {customers.map(c => (
                        <option key={c.customer_id} value={c.customer_id}>
                          {c.company_name} — {c.city} (Attn: {c.contact_person})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Client Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PT Chandra Asri Petrochemical Tbk"
                        value={rfqNewCustName}
                        onChange={e => setRfqNewCustName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Contact Person (PIC)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bpk. Agus Setiawan (Procurement Lead)"
                        value={rfqNewCustContact}
                        onChange={e => setRfqNewCustContact(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. purchasing@chandra-asri.com"
                        value={rfqNewCustEmail}
                        onChange={e => setRfqNewCustEmail(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +62 21 530 7950"
                        value={rfqNewCustPhone}
                        onChange={e => setRfqNewCustPhone(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Quotation Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rfqQuoNumber}
                    onChange={e => setRfqQuoNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                    Format: STMJ/QUO/YYYY/MM/NNN (Auto-incremented)
                  </span>
                </div>
              </div>

              {/* Section 2: Project Scope */}
              <div className="space-y-3">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  2. Project Title & Scope of Work
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project Scope Title <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Design, Supply, Installation & Commissioning of FK-5112 Clean Agent Total Flooding Fire Protection for Gas Turbine Control Room"
                    value={rfqProjectName}
                    onChange={e => setRfqProjectName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lead Estimator / Sales Engineer
                    </label>
                    <input
                      type="text"
                      value={rfqCreatedBy}
                      onChange={e => setRfqCreatedBy(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Initial Proposal Status
                    </label>
                    <select
                      value={rfqStatus}
                      onChange={e => setRfqStatus(e.target.value as QuotationStatus)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Internal Review">Internal Review</option>
                      <option value="Submitted to Client">Submitted to Client</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Starter Engineering BoQ Package */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  3. Starter Engineering BoQ Template
                </div>
                <p className="text-[11px] text-slate-500">
                  Select a pre-engineered Bill of Quantities package to jumpstart line items with standardized materials, or start blank:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {[
                    {
                      id: 'fk5112',
                      title: 'FK-5112 Clean Agent System',
                      desc: '6 items: HYGOOD 140L cylinders, FK-5112 agent, 360° nozzles, Sch 40 pipes, Sigma A-XT panel, BAST.',
                      badge: 'Most Popular',
                    },
                    {
                      id: 'co2',
                      title: 'CO2 High-Pressure System',
                      desc: '4 items: 68L seamless cylinders, CO2 chemical charge, Sch 80 extra strong pipes, 150-bar hydrotest.',
                      badge: 'Industrial Hazard',
                    },
                    {
                      id: 'gas_detect',
                      title: 'Toxic & Combustible Gas Detection',
                      desc: '3 items: Draeger Polytron 7000 transmitters, Senko personal monitors, sensor FAT testing.',
                      badge: 'Instrumentation',
                    },
                    {
                      id: 'blank',
                      title: 'Custom Blank BoQ',
                      desc: 'Starts with 0 items so you can freely build the bill of quantities from the catalog library.',
                      badge: 'Manual Build',
                    },
                  ].map(pkg => (
                    <div
                      key={pkg.id}
                      onClick={() => setRfqTemplate(pkg.id as any)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        rfqTemplate === pkg.id
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 text-xs">{pkg.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {pkg.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{pkg.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Commercial Parameters & Terms */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  4. Commercial Terms & Margin
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Target Margin %
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="80"
                        step="0.5"
                        value={rfqTargetMargin}
                        onChange={e => setRfqTargetMargin(Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="font-bold text-slate-600">%</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Delivery Lead Time
                    </label>
                    <input
                      type="text"
                      value={rfqDeliveryTimeline}
                      onChange={e => setRfqDeliveryTimeline(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Commercial Payment Terms Description
                  </label>
                  <textarea
                    rows={2}
                    value={rfqPaymentTerms}
                    onChange={e => setRfqPaymentTerms(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewQuoModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Create Quotation & Open BoQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPrintModal && activeQuotation && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 print:hidden">
              <div className="text-xs text-slate-500">Official STMJ Commercial Quotation View</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  PT SARANA TEKNIK MANDIRI JAYA (STMJ)
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Specialist Fire Protection, Clean Agent Extinguishing Systems, Gas Detection & Mechanical Contracting
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jl. Boulevard Raya Blok PA 12 No. 8, Kelapa Gading, Jakarta Utara | Tel: +62 21 4585 9900 | info@stmj.co.id
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-indigo-700 font-mono text-base">COMMERCIAL QUOTATION</div>
                <div className="text-xs text-slate-700 font-mono mt-1 font-semibold">{activeQuotation.quotation_number}</div>
                <div className="text-xs text-slate-500 mt-0.5">Date: {formatDate(activeQuotation.quotation_date)}</div>
              </div>
            </div>

            {/* Client Info Block */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">To Client:</span>
                <div className="font-bold text-slate-900 text-sm">{activeCustomer.company_name}</div>
                <div className="text-slate-600 mt-0.5">Attn: {activeCustomer.contact_person}</div>
                <div className="text-slate-600">{activeCustomer.address}</div>
                <div className="text-slate-600 mt-0.5">NPWP: {activeCustomer.npwp_tax_id}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Project Specification:</span>
                <div className="font-semibold text-slate-900">{activeQuotation.project_name}</div>
                <div className="text-slate-600 mt-1">Validity: 30 Days (Until {formatDate(activeQuotation.valid_until)})</div>
                <div className="text-slate-600">Delivery Lead Time: {activeQuotation.delivery_timeline}</div>
              </div>
            </div>

            {/* BOQ Table in Print Document */}
            <div>
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                  <tr>
                    <th className="p-2 border border-slate-300 w-10 text-center">No.</th>
                    <th className="p-2 border border-slate-300">Description of Work & Material Spec</th>
                    <th className="p-2 border border-slate-300 text-center w-24">Qty / UOM</th>
                    <th className="p-2 border border-slate-300 text-right w-36">Unit Price (IDR)</th>
                    <th className="p-2 border border-slate-300 text-right w-40">Total Amount (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLineItems.map((li, idx) => (
                    <tr key={li.item_id}>
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-slate-900">{li.item_code}</div>
                        <div className="text-slate-700">{li.description}</div>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-semibold">
                        {li.quantity} {li.uom}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono">
                        {formatIDR(li.unit_price_idr)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                        {formatIDR(li.total_price_idr)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className="p-2 border border-slate-300 text-right font-bold text-slate-700">
                      SUBTOTAL (BEFORE TAX):
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                      {formatIDR(calculatedTotals.totalSell)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-2 border border-slate-300 text-right font-semibold text-slate-700">
                      PPN 11% (VALUE ADDED TAX):
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      {formatIDR(calculatedTotals.ppn)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="p-2.5 border border-slate-300 text-right font-extrabold text-slate-900">
                      GRAND TOTAL (IDR):
                    </td>
                    <td className="p-2.5 border border-slate-300 text-right font-mono font-extrabold text-indigo-900 text-sm">
                      {formatIDR(calculatedTotals.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Terms & Payment Conditions */}
            <div className="text-xs space-y-2 text-slate-700 border-t border-slate-200 pt-3">
              <div className="font-bold text-slate-900">Commercial Terms & Conditions:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Prices quoted in Indonesian Rupiah (IDR) and subject to 11% PPN.</li>
                <li>{activeQuotation.payment_terms_desc}</li>
                <li>Warranty: 12 months from handover/BAST against manufacturing and installation defects.</li>
                <li>Clean agent containers are UL listed and FM approved with mill test certificates provided upon dispatch.</li>
              </ul>
            </div>

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
              <div>
                <p className="text-slate-500 mb-16">Prepared By:</p>
                <div className="font-bold text-slate-900 underline">{activeQuotation.created_by}</div>
                <div className="text-[11px] text-slate-500">PT Sarana Teknik Mandiri Jaya</div>
              </div>

              <div>
                <p className="text-slate-500 mb-16">Approved By & Client Acceptance:</p>
                <div className="font-bold text-slate-900 underline">
                  {activeQuotation.approved_by || 'Ir. Taufik Hidayat (Technical Director)'}
                </div>
                <div className="text-[11px] text-slate-500">Sign & Company Stamp</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
