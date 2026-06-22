import { useState, useEffect } from 'react';
import type { PropertyProfile, UpfrontCosts, KprScenario, BankScheme } from './utils/types';
import { calculateKpr } from './utils/kprCalculations';
import { formatRupiah } from './utils/formatters';
import { getDbValue, setDbValue, exportAllData, importAllData } from './utils/localDb';

// Components
import { PropertyManager } from './components/PropertyManager';
import { KprCalculatorForm } from './components/KprCalculatorForm';
import { UpfrontCostsForm } from './components/UpfrontCostsForm';
import { AmortizationCalendar } from './components/AmortizationCalendar';
import { PropertyComparison } from './components/PropertyComparison';
import { UpfrontDonutChart, AmortizationChart } from './components/KprCharts';

// Icons
import { 
  Home, 
  Calculator, 
  Receipt, 
  CalendarDays, 
  GitCompare, 
  Sun, 
  Moon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building,
  Download,
  Upload,
  AlertTriangle,
  X,
  Menu,
  Trash2
} from 'lucide-react';

// Sample mock data for first load
const SAMPLE_PROPERTIES: PropertyProfile[] = [
  {
    id: 'sample-1',
    name: '[CONTOH] Cluster Lavender - Kavling B2',
    developer: 'Sinar Mas Land',
    picName: 'Rian Wijaya',
    picPhone: '081288887777',
    houseType: 'Tipe 45/90',
    landWidth: 6,
    landLength: 15,
    buildingArea: 45,
    bedrooms: '3+1',
    bathrooms: '2+1',
    carport: '2 mobil',
    price: 850000000,
    discount: 25000000,
    discountPercent: 2.94,
    dpPercent: 10,
    dpAmount: 82500000,
    bookingFee: 5000000,
    notes: 'Hadap utara, free kanopi & voucher AC 2 unit. Dekat stasiun KRL. Diskon launching Rp25jt mengurangi pokok KPR.',
    createdAt: Date.now() - 1000000,
  },
  {
    id: 'sample-2',
    name: '[CONTOH] Metland Residence - Blok C5',
    developer: 'Metropolitan Land',
    picName: 'Siti Aminah',
    picPhone: '085699990000',
    houseType: 'Tipe 36/72',
    landWidth: 6,
    landLength: 12,
    buildingArea: 36,
    bedrooms: '2',
    bathrooms: '1',
    carport: '1 mobil',
    price: 620000000,
    discount: 0,
    discountPercent: 0,
    dpPercent: 15,
    dpAmount: 93000000,
    bookingFee: 0,
    notes: 'Promo subsidi biaya akad & BPHTB ditanggung developer. Angsuran developer flat 1 th.',
    createdAt: Date.now(),
  }
];

const SAMPLE_BANK_SCHEMES: BankScheme[] = [
  {
    id: 'bank-bca',
    bankName: 'Bank BCA',
    schemeName: 'BCA Promo Fix 3 Thn',
    tenorYears: 15,
    calculationType: 'annuity',
    interestScheme: 'fixed',
    fixedRate: 3.88,
    fixedYears: 3,
    tieredTiers: [
      { id: 't1', rate: 3.88, durationYears: 3 }
    ],
    floatingRate: 11.0,
    startDate: '2026-07',
    provisiPercent: 1.0,
    adminFee: 1000000,
    appraisalFee: 1500000,
    notarisPercent: 1.5,
    asuransiPercent: 1.0,
    extraPaymentMode: 'reduce_installment'
  },
  {
    id: 'bank-mandiri',
    bankName: 'Bank Mandiri',
    schemeName: '[CONTOH] Mandiri Tiered Promo',
    tenorYears: 15,
    calculationType: 'annuity',
    interestScheme: 'tiered',
    fixedRate: 3.99,
    fixedYears: 3,
    tieredTiers: [
      { id: 'm1', rate: 3.99, durationYears: 3 },
      { id: 'm2', rate: 6.99, durationYears: 3 }
    ],
    floatingRate: 10.5,
    startDate: '2026-07',
    provisiPercent: 0.5,
    adminFee: 500000,
    appraisalFee: 1000000,
    notarisPercent: 1.2,
    asuransiPercent: 1.0,
    extraPaymentMode: 'reduce_installment'
  },
  {
    id: 'bank-btn',
    bankName: 'Bank BTN',
    schemeName: '[CONTOH] BTN Fixed 5 Thn',
    tenorYears: 15,
    calculationType: 'annuity',
    interestScheme: 'fixed',
    fixedRate: 5.99,
    fixedYears: 5,
    tieredTiers: [
      { id: 'b1', rate: 5.99, durationYears: 5 }
    ],
    floatingRate: 12.0,
    startDate: '2026-07',
    provisiPercent: 1.0,
    adminFee: 1200000,
    appraisalFee: 1500000,
    notarisPercent: 1.5,
    asuransiPercent: 1.1,
    extraPaymentMode: 'reduce_installment'
  }
];

const DEFAULT_UPFRONT: UpfrontCosts = {
  useBphtbAuto: true,
  bphtbNpoptkp: 60000000,
  customFees: [
    { id: 'f1', name: 'Booking Fee (Tanda Jadi)', amount: 5000000 }
  ],
};

const DEFAULT_SCENARIOS: KprScenario[] = [
  { dpPercent: 10, tenorYears: 15 },
  { dpPercent: 15, tenorYears: 20 },
  { dpPercent: 20, tenorYears: 10 }
];

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: '24px'
    }}>
      <div style={{
        position: 'relative',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Pulsing ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid var(--primary)',
          opacity: 0.15,
          animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
        }} />
        {/* Spinning border */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: 'var(--primary)',
          borderRightColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }} />
        {/* Inner center badge */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.2rem',
          boxShadow: '0 4px 10px var(--primary-glow)'
        }}>
          %
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          KPR Smart Dashboard
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Menghubungkan ke Local Database...
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Theme state (default dark for premium look)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('kpr_theme');
    return saved ? saved === 'dark' : true;
  });
  
  // App States
  const [properties, setProperties] = useState<PropertyProfile[]>(() => {
    const saved = localStorage.getItem('kpr_properties');
    return saved ? JSON.parse(saved) : SAMPLE_PROPERTIES;
  });
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(() => {
    const savedSelected = localStorage.getItem('kpr_selected_id');
    if (savedSelected) return savedSelected;
    const saved = localStorage.getItem('kpr_properties');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed[0].id : null;
    }
    return SAMPLE_PROPERTIES[0].id;
  });

  const [bankSchemes, setBankSchemes] = useState<BankScheme[]>(() => {
    const saved = localStorage.getItem('kpr_bank_schemes');
    return saved ? JSON.parse(saved) : SAMPLE_BANK_SCHEMES;
  });
  
  const [selectedBankSchemeId, setSelectedBankSchemeId] = useState<string>(() => {
    const saved = localStorage.getItem('kpr_selected_bank_id');
    return saved || SAMPLE_BANK_SCHEMES[0].id;
  });

  const inputs = bankSchemes.find(b => b.id === selectedBankSchemeId) || bankSchemes[0] || SAMPLE_BANK_SCHEMES[0];

  const [upfrontCosts, setUpfrontCosts] = useState<UpfrontCosts>(() => {
    const saved = localStorage.getItem('kpr_upfront');
    return saved ? JSON.parse(saved) : DEFAULT_UPFRONT;
  });

  const [scenarios, setScenarios] = useState<KprScenario[]>(() => {
    const saved = localStorage.getItem('kpr_scenarios');
    return saved ? JSON.parse(saved) : DEFAULT_SCENARIOS;
  });
  
  // Extra payments keyed by propertyId -> Record<monthNumber, amount>
  const [extraPaymentsByProperty, setExtraPaymentsByProperty] = useState<Record<string, Record<number, number>>>(() => {
    const saved = localStorage.getItem('kpr_extras');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'properties' | 'calculator' | 'upfront' | 'calendar' | 'compare'>(() => {
    const savedTab = localStorage.getItem('kpr_active_tab');
    return (savedTab as any) || 'calculator';
  });

  // Sample-data notice: shown while any built-in example data ([CONTOH] prefix) remains.
  const [sampleNoticeDismissed, setSampleNoticeDismissed] = useState(() => {
    return localStorage.getItem('kpr_sample_notice_dismissed') === 'true';
  });

  // Property pending delete confirmation (null = no dialog open).
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Responsive layout + collapsible sidebar.
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => !(typeof window !== 'undefined' && window.innerWidth < 768));
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setSidebarOpen(!e.matches); // open by default on desktop, closed on mobile
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  // Navigate via the sidebar; auto-close the drawer on mobile after selecting.
  const handleNavClick = (tab: 'properties' | 'calculator' | 'upfront' | 'calendar' | 'compare') => {
    setActiveTab(tab);
    if (isMobile) setSidebarOpen(false);
  };
  const hasSampleData =
    properties.some(p => p.name.startsWith('[CONTOH]')) ||
    bankSchemes.some(b => b.schemeName.startsWith('[CONTOH]'));

  // Load state from IndexedDB on mount (with auto-seed from kpr-seed.json)
  useEffect(() => {
    async function loadState() {
      try {
        // Check if IndexedDB has any data at all
        const savedProps = await getDbValue('kpr_properties', null);
        const localProps = localStorage.getItem('kpr_properties');
        const hasExistingData = savedProps !== null || localProps !== null;

        // If no existing data, try to auto-seed from kpr-seed.json (for git clone scenarios)
        if (!hasExistingData) {
          try {
            const seedResponse = await fetch(`${import.meta.env.BASE_URL}kpr-seed.json`);
            if (seedResponse.ok) {
              const seedData = await seedResponse.json();
              if (seedData && typeof seedData === 'object' && Object.keys(seedData).length > 0) {
                console.log('🌱 Auto-seeding from kpr-seed.json...');
                await importAllData(seedData);
                // Reload state from the freshly seeded IndexedDB
                const seededProps = await getDbValue('kpr_properties', SAMPLE_PROPERTIES);
                setProperties(seededProps);
                const seededSelectedId = await getDbValue('kpr_selected_id', seededProps[0]?.id || null);
                setSelectedPropertyId(seededSelectedId);
                const seededBankSchemes = await getDbValue('kpr_bank_schemes', SAMPLE_BANK_SCHEMES);
                setBankSchemes(seededBankSchemes);
                const seededSelectedBankId = await getDbValue('kpr_selected_bank_id', SAMPLE_BANK_SCHEMES[0].id);
                setSelectedBankSchemeId(seededSelectedBankId);
                const seededUpfront = await getDbValue('kpr_upfront', DEFAULT_UPFRONT);
                setUpfrontCosts(seededUpfront);
                const seededScenarios = await getDbValue('kpr_scenarios', DEFAULT_SCENARIOS);
                setScenarios(seededScenarios);
                const seededExtras = await getDbValue('kpr_extras', {});
                setExtraPaymentsByProperty(seededExtras);
                const seededTab = await getDbValue('kpr_active_tab', 'calculator');
                setActiveTab(seededTab as any);
                const seededTheme = await getDbValue('kpr_theme', 'dark');
                setDarkMode(seededTheme === 'dark');
                console.log('✅ Auto-seed complete!');
                return; // Skip the normal load flow
              }
            }
          } catch {
            // Seed file not found or invalid - fall through to normal defaults
            console.log('ℹ️ No kpr-seed.json found, using built-in defaults.');
          }
        }

        // Normal load flow: IndexedDB -> localStorage -> defaults
        if (savedProps) {
          setProperties(savedProps);
        } else if (localProps) {
          setProperties(JSON.parse(localProps));
        }

        // Load selected property ID
        const savedSelectedId = await getDbValue('kpr_selected_id', null);
        if (savedSelectedId) {
          setSelectedPropertyId(savedSelectedId);
        } else {
          const localSelectedId = localStorage.getItem('kpr_selected_id');
          if (localSelectedId) {
            setSelectedPropertyId(localSelectedId);
          } else if (localProps) {
            const parsed = JSON.parse(localProps);
            if (parsed.length > 0) setSelectedPropertyId(parsed[0].id);
          }
        }

        // Load bank schemes
        const savedBankSchemes = await getDbValue('kpr_bank_schemes', null);
        if (savedBankSchemes) {
          setBankSchemes(savedBankSchemes);
        } else {
          const localBankSchemes = localStorage.getItem('kpr_bank_schemes');
          if (localBankSchemes) {
            setBankSchemes(JSON.parse(localBankSchemes));
          } else {
            const localInputs = localStorage.getItem('kpr_inputs');
            if (localInputs) {
              const parsedInputs = JSON.parse(localInputs);
              const migratedBank: BankScheme = {
                ...parsedInputs,
                id: 'bank-bca',
                bankName: 'Bank BCA',
                schemeName: 'BCA Promo Fix 3 Thn',
                provisiPercent: 1.0,
                adminFee: 1000000,
                appraisalFee: 1500000,
                notarisPercent: 1.5,
                asuransiPercent: 1.0,
                extraPaymentMode: 'reduce_installment'
              };
              setBankSchemes([migratedBank, SAMPLE_BANK_SCHEMES[1], SAMPLE_BANK_SCHEMES[2]]);
            }
          }
        }

        // Load selected bank scheme ID
        const savedSelectedBankId = await getDbValue('kpr_selected_bank_id', null);
        if (savedSelectedBankId) {
          setSelectedBankSchemeId(savedSelectedBankId);
        } else {
          const localSelectedBankId = localStorage.getItem('kpr_selected_bank_id');
          if (localSelectedBankId) {
            setSelectedBankSchemeId(localSelectedBankId);
          }
        }

        // Load upfront costs
        const savedUpfront = await getDbValue('kpr_upfront', null);
        if (savedUpfront) {
          setUpfrontCosts(savedUpfront);
        } else {
          const localUpfront = localStorage.getItem('kpr_upfront');
          if (localUpfront) setUpfrontCosts(JSON.parse(localUpfront));
        }

        // Load scenarios
        const savedScenarios = await getDbValue('kpr_scenarios', null);
        if (savedScenarios) {
          setScenarios(savedScenarios);
        } else {
          const localScenarios = localStorage.getItem('kpr_scenarios');
          if (localScenarios) setScenarios(JSON.parse(localScenarios));
        }

        // Load extras
        const savedExtras = await getDbValue('kpr_extras', null);
        if (savedExtras) {
          setExtraPaymentsByProperty(savedExtras);
        } else {
          const localExtras = localStorage.getItem('kpr_extras');
          if (localExtras) setExtraPaymentsByProperty(JSON.parse(localExtras));
        }

        // Load active tab
        const savedTab = await getDbValue('kpr_active_tab', null);
        if (savedTab) {
          setActiveTab(savedTab);
        } else {
          const localTab = localStorage.getItem('kpr_active_tab');
          if (localTab) setActiveTab(localTab as any);
        }

        // Load theme
        const savedTheme = await getDbValue('kpr_theme', null);
        if (savedTheme) {
          setDarkMode(savedTheme === 'dark');
        } else {
          const localTheme = localStorage.getItem('kpr_theme');
          if (localTheme) setDarkMode(localTheme === 'dark');
        }
      } catch (err) {
        console.error("Failed to load initial KPR states from database:", err);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }
    loadState();
  }, []);

  // Sync state to localStorage and IndexedDB
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kpr_properties', JSON.stringify(properties));
    setDbValue('kpr_properties', properties);
  }, [properties, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kpr_bank_schemes', JSON.stringify(bankSchemes));
    setDbValue('kpr_bank_schemes', bankSchemes);
  }, [bankSchemes, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kpr_selected_bank_id', selectedBankSchemeId);
    setDbValue('kpr_selected_bank_id', selectedBankSchemeId);
  }, [selectedBankSchemeId, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kpr_upfront', JSON.stringify(upfrontCosts));
    setDbValue('kpr_upfront', upfrontCosts);
  }, [upfrontCosts, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kpr_extras', JSON.stringify(extraPaymentsByProperty));
    setDbValue('kpr_extras', extraPaymentsByProperty);
  }, [extraPaymentsByProperty, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kpr_scenarios', JSON.stringify(scenarios));
    setDbValue('kpr_scenarios', scenarios);
  }, [scenarios, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (selectedPropertyId !== null) {
      localStorage.setItem('kpr_selected_id', selectedPropertyId);
      setDbValue('kpr_selected_id', selectedPropertyId);
    }
  }, [selectedPropertyId, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('kpr_active_tab', activeTab);
    setDbValue('kpr_active_tab', activeTab);
  }, [activeTab, isLoading]);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (isLoading) return;
    localStorage.setItem('kpr_theme', darkMode ? 'dark' : 'light');
    setDbValue('kpr_theme', darkMode ? 'dark' : 'light');
  }, [darkMode, isLoading]);

  // === Data Export / Import Handlers ===
  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      data._exportedAt = new Date().toISOString();
      data._version = '1.0';
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kpr-seed.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('✅ Data berhasil di-export!\n\nSimpan file "kpr-seed.json" ke folder public/ project Anda, lalu commit & push ke Git.\n\nKetika clone di laptop lain, data akan otomatis ter-load.');
    } catch (err) {
      console.error('Export failed:', err);
      alert('❌ Gagal meng-export data.');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object') {
          alert('❌ File JSON tidak valid.');
          return;
        }
        if (!confirm('⚠️ Import akan menimpa SEMUA data saat ini. Lanjutkan?')) return;
        await importAllData(data);
        alert('✅ Data berhasil di-import! Halaman akan di-reload.');
        window.location.reload();
      } catch (err) {
        console.error('Import failed:', err);
        alert('❌ Gagal meng-import data. Pastikan file JSON valid.');
      }
    };
    input.click();
  };

  // Property Handlers
  const handleAddProperty = (p: PropertyProfile) => {
    const newList = [...properties, p];
    setProperties(newList);
    setSelectedPropertyId(p.id);
  };

  const handleUpdateProperty = (updated: PropertyProfile) => {
    setProperties(properties.map(p => p.id === updated.id ? updated : p));
  };

  // Deleting a property asks for confirmation first; actual removal happens in confirmDeleteProperty.
  const handleDeleteProperty = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteProperty = () => {
    const id = deleteConfirmId;
    if (!id) return;
    const newList = properties.filter(p => p.id !== id);
    setProperties(newList);
    if (selectedPropertyId === id) {
      setSelectedPropertyId(newList.length > 0 ? newList[0].id : null);
    }
    // Clean up extras for deleted property
    const newExtras = { ...extraPaymentsByProperty };
    delete newExtras[id];
    setExtraPaymentsByProperty(newExtras);
    setDeleteConfirmId(null);
  };

  // Extra Payments handlers for the currently selected property
  const activeExtras = (selectedPropertyId && extraPaymentsByProperty[selectedPropertyId]) || {};

  const handleAddExtraPayment = (monthNum: number, amount: number) => {
    if (!selectedPropertyId) return;
    const currentPropExtras = extraPaymentsByProperty[selectedPropertyId] || {};
    const updatedPropExtras = { ...currentPropExtras, [monthNum]: amount };
    setExtraPaymentsByProperty({
      ...extraPaymentsByProperty,
      [selectedPropertyId]: updatedPropExtras
    });
  };

  const handleRemoveExtraPayment = (monthNum: number) => {
    if (!selectedPropertyId) return;
    const currentPropExtras = { ...(extraPaymentsByProperty[selectedPropertyId] || {}) };
    delete currentPropExtras[monthNum];
    setExtraPaymentsByProperty({
      ...extraPaymentsByProperty,
      [selectedPropertyId]: currentPropExtras
    });
  };

  // Financial Calculations for Selected Property
  const activeProperty = properties.find(p => p.id === selectedPropertyId) || null;
  const price = activeProperty ? activeProperty.price : 500000000;
  const dpAmount = activeProperty ? activeProperty.dpAmount : 50000000;
  const discount = activeProperty ? (activeProperty.discount || 0) : 0;
  const bookingFee = activeProperty ? (activeProperty.bookingFee || 0) : 0;
  const plafond = Math.max(0, price - discount - dpAmount);

  const summary = calculateKpr(price, dpAmount, inputs, upfrontCosts, activeExtras, discount, bookingFee);

  // Total fixed months for chart drawing
  let totalFixedMonths = 0;
  if (inputs.interestScheme === 'fixed') {
    totalFixedMonths = inputs.fixedYears * 12;
  } else {
    // For tiered scheme, it is fixed for the entire tenor (no floating rate BI)
    totalFixedMonths = inputs.tenorYears * 12;
  }

  // Chart Data preparation
  const donutData = [
    { name: 'Down Payment (DP)', value: dpAmount, color: '#10b981' },
    { name: 'Pajak BPHTB', value: upfrontCosts.useBphtbAuto ? Math.max(0, (price - discount - upfrontCosts.bphtbNpoptkp) * 0.05) : 0, color: '#f59e0b' },
    { name: 'Biaya Notaris & APHT', value: ((inputs.notarisPercent || 0) / 100) * plafond, color: '#6366f1' },
    { name: 'Biaya Provisi Bank', value: ((inputs.provisiPercent || 0) / 100) * plafond, color: '#0ea5e9' },
    { name: 'Asuransi KPR', value: ((inputs.asuransiPercent || 0) / 100) * plafond, color: '#ec4899' },
    { name: 'Admin & Appraisal', value: (inputs.adminFee || 0) + (inputs.appraisalFee || 0), color: '#8b5cf6' },
    { name: 'Biaya Lainnya', value: upfrontCosts.customFees.reduce((sum, f) => sum + f.amount, 0), color: '#64748b' }
  ];

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      
      {/* Upper Navigation Header */}
      <header className="glass-panel" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        borderRadius: 0, 
        borderLeft: 'none', 
        borderRight: 'none', 
        borderTop: 'none',
        padding: isMobile ? '10px 14px' : '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', minWidth: 0 }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: 'var(--radius-md)', width: '38px', height: '38px', flexShrink: 0 }}
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Sembunyikan menu' : 'Tampilkan menu'}
            title={sidebarOpen ? 'Sembunyikan menu' : 'Tampilkan menu'}
          >
            {sidebarOpen && !isMobile ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #6366f1)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.2rem',
            boxShadow: '0 4px 10px var(--primary-glow)',
            flexShrink: 0
          }}>
            %
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, var(--text-primary), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              KPR Smart Dashboard
            </h1>
            {!isMobile && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>FINTECH ANALYTICS</span>}
          </div>
        </div>

        {/* Selected Property Quick Picker & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '16px', minWidth: 0 }}>
          {properties.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', minWidth: 0 }}>
              {!isMobile && <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Pilih Properti:</span>}
              <select
                value={selectedPropertyId || ''}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  maxWidth: isMobile ? '130px' : 'none',
                  textOverflow: 'ellipsis'
                }}
              >
                {properties.map(p => {
                  const dimensions = p.landWidth && p.landLength ? ` ${p.landWidth}x${p.landLength}` : '';
                  return (
                    <option key={p.id} value={p.id}>{p.name}{dimensions}</option>
                  );
                })}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px' }}
              onClick={handleExportData}
              title="Export data ke JSON (untuk push ke Git)"
            >
              <Download size={16} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px' }}
              onClick={handleImportData}
              title="Import data dari JSON"
            >
              <Upload size={16} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px' }}
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'row', position: 'relative' }}>

        {/* Backdrop behind the mobile drawer */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 55 }}
          />
        )}

        {/* Left Navigation Sidebar — desktop: collapsible in-flow; mobile: overlay drawer */}
        {(sidebarOpen || isMobile) && (
        <aside className="glass-panel" style={{
          width: isMobile ? '80vw' : '240px',
          maxWidth: '300px',
          borderRadius: 0,
          borderLeft: 'none',
          borderBottom: 'none',
          borderTop: 'none',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          ...(isMobile
            ? {
                position: 'fixed' as const,
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 60,
                overflowY: 'auto' as const,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
                boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.35)' : 'none'
              }
            : {})
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '8px', marginBottom: '8px' }}>
              Menu Utama
            </span>
            
            <button 
              className={`btn ${activeTab === 'properties' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '12px' }}
              onClick={() => handleNavClick('properties')}
            >
              <Home size={18} />
              <span>Kelola Properti ({properties.length})</span>
            </button>

            <button 
              className={`btn ${activeTab === 'calculator' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '12px' }}
              onClick={() => handleNavClick('calculator')}
            >
              <Calculator size={18} />
              <span>Skema & Bunga</span>
            </button>

            <button 
              className={`btn ${activeTab === 'upfront' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '12px' }}
              onClick={() => handleNavClick('upfront')}
            >
              <Receipt size={18} />
              <span>Biaya Akad & Pajak</span>
            </button>

            <button 
              className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '12px' }}
              onClick={() => handleNavClick('calendar')}
            >
              <CalendarDays size={18} />
              <span>Kalender Cicilan</span>
            </button>

            <button 
              className={`btn ${activeTab === 'compare' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '12px' }}
              onClick={() => handleNavClick('compare')}
            >
              <GitCompare size={18} />
              <span>Bandingkan Pilihan</span>
            </button>
          </div>

          {/* Quick active property summary footer in sidebar */}
          {activeProperty && (
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                <Building size={14} />
                <span>{activeProperty.houseType || 'Properti Aktif'}</span>
              </div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProperty.name}
              </strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cicilan Awal:</span>
                <strong style={{ color: 'var(--primary)' }}>{formatRupiah(summary.monthlyInstallmentInitial)}</strong>
              </div>
            </div>
          )}
        </aside>
        )}

        {/* Content Area */}
        <main style={{ flex: 1, padding: isMobile ? '16px' : '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', minWidth: 0 }}>

          {/* Sample-data notice — visible while built-in example data remains */}
          {hasSampleData && !sampleNoticeDismissed && (
            <div
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: 'var(--text-primary)',
              }}
              role="alert"
            >
              <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ flex: 1, fontSize: '14px', lineHeight: 1.5 }}>
                <strong>Ini hanya DATA CONTOH</strong> untuk demonstrasi — bukan data asli.
                Properti & skema bank yang diberi awalan <code>[CONTOH]</code> adalah ilustrasi.
                Hapus atau ubah dengan data Anda sendiri; semua data tersimpan lokal di browser ini.
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSampleNoticeDismissed(true);
                  localStorage.setItem('kpr_sample_notice_dismissed', 'true');
                }}
                aria-label="Tutup pemberitahuan"
                style={{ padding: '4px', flexShrink: 0, lineHeight: 0 }}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Quick stats grid on dashboard tabs */}
          {(activeTab === 'calculator' || activeTab === 'upfront') && (
            <section className="grid-3 animate-fade-in">
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', flexShrink: 0, justifyContent: 'center' }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Angsuran Awal</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {formatRupiah(summary.monthlyInstallmentInitial)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ bln</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: 'var(--radius-md)', 
                  background: inputs.interestScheme === 'tiered' ? 'var(--primary-light)' : 'var(--error-light)', 
                  color: inputs.interestScheme === 'tiered' ? 'var(--primary)' : 'var(--error)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexShrink: 0, 
                  justifyContent: 'center' 
                }}>
                  {inputs.interestScheme === 'tiered' ? (
                    <TrendingDown size={22} />
                  ) : (
                    <TrendingUp size={22} style={{ transform: 'rotate(45deg)' }} />
                  )}
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {inputs.interestScheme === 'tiered' ? 'Cicilan Akhir (Fixed)' : 'Estimasi Floating'}
                  </span>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 800, 
                    color: inputs.interestScheme === 'tiered' ? 'var(--text-primary)' : 'var(--error)', 
                    marginTop: '2px' 
                  }}>
                    {formatRupiah(summary.monthlyInstallmentFloating)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ bln</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', flexShrink: 0, justifyContent: 'center' }}>
                  <DollarSign size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Uang Pertama (DP+Akad)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                    {formatRupiah(summary.totalCashNeeded)}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 1: KPR CALCULATOR AND TIMELINE */}
          {activeTab === 'calculator' && (
            <div className="grid-2 animate-fade-in" style={{ gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr' }}>
              <KprCalculatorForm 
                bankSchemes={bankSchemes}
                selectedBankSchemeId={selectedBankSchemeId}
                onSelectBankScheme={setSelectedBankSchemeId}
                onAddBankScheme={(scheme) => { setBankSchemes([...bankSchemes, scheme]); setSelectedBankSchemeId(scheme.id); }}
                onUpdateBankScheme={(updated) => setBankSchemes(bankSchemes.map(b => b.id === updated.id ? updated : b))}
                onDeleteBankScheme={(id) => { const filtered = bankSchemes.filter(b => b.id !== id); setBankSchemes(filtered); if (selectedBankSchemeId === id) setSelectedBankSchemeId(filtered[0]?.id || ''); }}
                onReorderBankSchemes={setBankSchemes}
                plafond={plafond}
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Visual Chart of balance over time */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Tren Penurunan Pokok Utang</h4>
                  <AmortizationChart 
                    schedule={summary.amortizationSchedule} 
                    fixedMonthsCount={totalFixedMonths}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                    * Garis merah putus-putus menunjukkan titik berakhirnya bunga fixed/berjenjang dan dimulainya bunga floating.
                  </p>
                </div>

                {/* Quick Info Box */}
                {activeProperty && (
                  <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Home size={16} className="text-primary" /> {activeProperty.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      KPR untuk rumah tipe {activeProperty.houseType || 'N/A'} dengan harga {formatRupiah(activeProperty.price)}. Uang muka disiapkan sebesar {formatRupiah(activeProperty.dpAmount)} ({activeProperty.dpPercent}%).
                    </p>
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Suku Bunga Awal:</span>
                        <strong style={{ color: 'var(--primary)' }}>
                          {inputs.interestScheme === 'fixed' ? `${inputs.fixedRate}%` : `${inputs.tieredTiers[0]?.rate || 0}%`}
                        </strong>
                      </div>
                      {inputs.interestScheme !== 'tiered' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Suku Bunga Floating:</span>
                          <strong style={{ color: 'var(--error)' }}>{inputs.floatingRate}%</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Estimasi Total Bunga:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(summary.totalInterest)}</strong>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 2: UPFRONT COSTS AND TAXES */}
          {activeTab === 'upfront' && (
            <div className="grid-2 animate-fade-in" style={{ gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr' }}>
              <UpfrontCostsForm 
                upfrontCosts={upfrontCosts} 
                onUpdateUpfrontCosts={setUpfrontCosts} 
                price={price}
                plafond={plafond}
                activeBankScheme={inputs}
                onUpdateBankScheme={(updatedFees) => setBankSchemes(bankSchemes.map(b => b.id === selectedBankSchemeId ? { ...b, ...updatedFees } : b))}
              />
              
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, textAlign: 'center' }}>Proporsi Alokasi Dana Pertama</h4>
                <UpfrontDonutChart data={donutData} />
              </div>
            </div>
          )}

          {/* TAB 3: AMORTIZATION CALENDAR */}
          {activeTab === 'calendar' && (
            <AmortizationCalendar
              schedule={summary.amortizationSchedule}
              totalInterest={summary.totalInterest}
              totalPayment={summary.totalPayment}
              originalTenorMonths={inputs.tenorYears * 12}
              extraPayments={activeExtras}
              onAddExtraPayment={handleAddExtraPayment}
              onRemoveExtraPayment={handleRemoveExtraPayment}
              bankSchemes={bankSchemes}
              selectedBankSchemeId={selectedBankSchemeId}
              onSelectBankScheme={setSelectedBankSchemeId}
            />
          )}

          {/* TAB 4: PROPERTY MANAGER */}
          {activeTab === 'properties' && (
            <PropertyManager
              properties={properties}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={(id) => {
                setSelectedPropertyId(id);
                setActiveTab('calculator');
              }}
              onAddProperty={handleAddProperty}
              onUpdateProperty={handleUpdateProperty}
              onDeleteProperty={handleDeleteProperty}
            />
          )}

          {/* TAB 5: SIDE-BY-SIDE PROPERTY COMPARISON */}
          {activeTab === 'compare' && (
            <PropertyComparison
              properties={properties}
              inputs={inputs}
              upfrontCosts={upfrontCosts}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={setSelectedPropertyId}
              scenarios={scenarios}
              onUpdateScenarios={setScenarios}
              bankSchemes={bankSchemes}
              selectedBankSchemeId={selectedBankSchemeId}
              onSelectBankScheme={setSelectedBankSchemeId}
            />
          )}

        </main>
      </div>

      {/* Footer copyright */}
      <footer className="glass-panel" style={{ 
        borderRadius: 0, 
        borderLeft: 'none', 
        borderRight: 'none', 
        borderBottom: 'none', 
        padding: '16px', 
        textAlign: 'center', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        KPR Smart Dashboard &copy; 2026 - Didesain untuk Skema KPR Perbankan Indonesia.
      </footer>

      {/* Delete-property confirmation dialog */}
      {deleteConfirmId && (
        <div
          onClick={() => setDeleteConfirmId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--error-light)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hapus Properti?</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tindakan ini tidak dapat dibatalkan.</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Yakin ingin menghapus{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {properties.find(p => p.id === deleteConfirmId)?.name || 'properti ini'}
              </strong>
              ? Semua data simulasi terkait properti ini akan ikut terhapus.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Batal
              </button>
              <button
                className="btn"
                style={{ background: 'var(--error)', color: '#fff' }}
                onClick={confirmDeleteProperty}
              >
                <Trash2 size={16} />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
