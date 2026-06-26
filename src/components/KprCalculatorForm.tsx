import React, { useState } from 'react';
import type { BankScheme, InterestTier, CalculationType, InterestScheme } from '../utils/types';
import { genId } from '../utils/ids';
import { Plus, Trash2, Copy, GripVertical } from 'lucide-react';

// Tampilkan kosong untuk nilai 0/NaN supaya tidak ada "0" yang menempel di depan input
const displayNum = (n: number): number | string => (n === 0 || isNaN(n) ? '' : n);

// Buang nol di depan ("05" -> "5", "00.5" -> "0.5") lalu jadikan angka
const parseNum = (raw: string): number => {
  const cleaned = raw.replace(/^0+(?=\d)/, '');
  return cleaned === '' ? 0 : Number(cleaned);
};

interface KprCalculatorFormProps {
  bankSchemes: BankScheme[];
  selectedBankSchemeId: string | null;
  onSelectBankScheme: (id: string) => void;
  onAddBankScheme: (scheme: BankScheme) => void;
  onUpdateBankScheme: (scheme: BankScheme) => void;
  onDeleteBankScheme: (id: string) => void;
  onReorderBankSchemes: (schemes: BankScheme[]) => void;
  plafond: number;
}

export const KprCalculatorForm: React.FC<KprCalculatorFormProps> = ({
  bankSchemes,
  selectedBankSchemeId,
  onSelectBankScheme,
  onAddBankScheme,
  onUpdateBankScheme,
  onDeleteBankScheme,
  onReorderBankSchemes,
  plafond,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedSchemes = [...bankSchemes];
    const [draggedItem] = updatedSchemes.splice(draggedIndex, 1);
    updatedSchemes.splice(targetIndex, 0, draggedItem);

    onReorderBankSchemes(updatedSchemes);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  // Find active scheme or fallback to first
  const activeScheme = bankSchemes.find(b => b.id === selectedBankSchemeId) || bankSchemes[0] || {
    id: 'default',
    bankName: 'Bank Kustom',
    schemeName: 'Skema Kustom',
    tenorYears: 15,
    calculationType: 'annuity' as CalculationType,
    interestScheme: 'fixed' as InterestScheme,
    fixedRate: 5.0,
    fixedYears: 3,
    tieredTiers: [],
    floatingRate: 11.0,
    startDate: '2026-07',
    provisiPercent: 1.0,
    adminFee: 1000000,
    appraisalFee: 1500000,
    notarisPercent: 1.5,
    asuransiPercent: 1.0,
    extraPaymentMode: 'reduce_installment'
  };

  const handleSchemeChange = (scheme: InterestScheme) => {
    onUpdateBankScheme({ ...activeScheme, interestScheme: scheme });
  };

  const handleCalcTypeChange = (type: CalculationType) => {
    onUpdateBankScheme({ ...activeScheme, calculationType: type });
  };

  const handleFieldChange = (field: keyof BankScheme, value: string | number) => {
    onUpdateBankScheme({ ...activeScheme, [field]: value } as BankScheme);
  };

  const handleAddTier = () => {
    const nextTierNum = activeScheme.tieredTiers.length + 1;
    const newTier: InterestTier = {
      id: genId('t-'),
      rate: 5 + nextTierNum, // default values
      durationYears: 2,
    };
    onUpdateBankScheme({
      ...activeScheme,
      tieredTiers: [...activeScheme.tieredTiers, newTier],
    });
  };

  const handleRemoveTier = (id: string) => {
    onUpdateBankScheme({
      ...activeScheme,
      tieredTiers: activeScheme.tieredTiers.filter(t => t.id !== id),
    });
  };

  const handleTierChange = (id: string, field: keyof InterestTier, value: number) => {
    onUpdateBankScheme({
      ...activeScheme,
      tieredTiers: activeScheme.tieredTiers.map(t => {
        if (t.id === id) {
          return { ...t, [field]: value };
        }
        return t;
      }),
    });
  };

  const handleAddNewBank = () => {
    const newBank: BankScheme = {
      id: genId('bank-'),
      bankName: 'Bank Baru',
      schemeName: 'Skema Baru',
      tenorYears: 15,
      calculationType: 'annuity',
      interestScheme: 'fixed',
      fixedRate: 4.5,
      fixedYears: 3,
      tieredTiers: [
        { id: genId('t-'), rate: 4.5, durationYears: 3 }
      ],
      floatingRate: 11.0,
      startDate: activeScheme?.startDate || '2026-07',
      provisiPercent: 1.0,
      adminFee: 1000000,
      appraisalFee: 1500000,
      notarisPercent: 1.5,
      asuransiPercent: 1.0,
      extraPaymentMode: 'reduce_installment'
    };
    onAddBankScheme(newBank);
  };

  const handleDuplicateBank = (scheme: BankScheme, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection click
    const duplicated: BankScheme = {
      ...scheme,
      id: genId('bank-'),
      bankName: `${scheme.bankName} (Copy)`,
      tieredTiers: scheme.tieredTiers.map(t => ({ ...t, id: genId('t-') }))
    };
    onAddBankScheme(duplicated);
  };

  // Calculate total fixed years for display
  const totalTieredYears = activeScheme.tieredTiers.reduce((sum, t) => sum + t.durationYears, 0);

  const isFixedOverTenor = activeScheme.interestScheme === 'fixed' && activeScheme.fixedYears > activeScheme.tenorYears;
  const isTieredOverTenor = activeScheme.interestScheme === 'tiered' && totalTieredYears > activeScheme.tenorYears;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. BANK SELECTION SLIDER/ROW */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pilih Penawaran Bank KPR</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>* Pilih untuk edit | Geser (drag & drop) untuk re-order</span>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '10px',
        }}>
          {bankSchemes.map((scheme, index) => {
            const isActive = scheme.id === selectedBankSchemeId;
            const isDragging = index === draggedIndex;
            const isDragOver = index === dragOverIndex;
            return (
              <div 
                key={scheme.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => onSelectBankScheme(scheme.id)}
                style={{
                  padding: '12px 14px',
                  cursor: draggedIndex !== null ? 'grabbing' : 'grab',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                  border: isDragOver 
                    ? '2px dashed var(--primary)' 
                    : (isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)'),
                  boxShadow: isActive ? '0 0 15px var(--primary-glow)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                  opacity: isDragging ? 0.4 : 1,
                  transform: isDragOver ? 'scale(1.02)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                    <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {scheme.bankName}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      type="button"
                      onClick={(e) => handleDuplicateBank(scheme, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                      title="Duplikat"
                    >
                      <Copy size={12} />
                    </button>
                    {bankSchemes.length > 1 && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Hapus skema ${scheme.bankName}?`)) {
                            onDeleteBankScheme(scheme.id);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {scheme.schemeName}
                </span>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {scheme.interestScheme === 'fixed' ? `${scheme.fixedRate}% Fixed` : 'Tiered Fixed'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {scheme.tenorYears} Thn
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Add Bank Button */}
          <button 
            type="button"
            onClick={handleAddNewBank}
            style={{
              minHeight: '82px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Plus size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tambah Bank</span>
          </button>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

      {/* 2. BANK & PROMO NAMES EDITOR */}
      <div className="grid-2">
        <div className="input-group">
          <label className="input-label">Nama Bank</label>
          <input
            type="text"
            className="input-field"
            value={activeScheme.bankName}
            onChange={(e) => handleFieldChange('bankName', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Nama Skema Promo</label>
          <input
            type="text"
            className="input-field"
            value={activeScheme.schemeName}
            onChange={(e) => handleFieldChange('schemeName', e.target.value)}
          />
        </div>
      </div>

      {/* Plafond Display */}
      <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-glow)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
          Plafond Kredit (Nilai Pinjaman Bank)
        </span>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(plafond)}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Plafond = Net Price setelah Diskon dikurangi Down Payment (DP).
        </p>
      </div>

      {/* Tenor Input */}
      <div className="input-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="input-label">Jangka Waktu (Tenor)</label>
          <strong style={{ color: 'var(--primary)' }}>{activeScheme.tenorYears} Tahun ({activeScheme.tenorYears * 12} bulan)</strong>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {[5, 10, 15, 20].map(years => (
            <button
              key={years}
              type="button"
              className="btn"
              style={{
                flex: 1,
                background: activeScheme.tenorYears === years ? 'var(--primary)' : 'var(--bg-tertiary)',
                color: activeScheme.tenorYears === years ? '#ffffff' : 'var(--text-primary)',
                border: activeScheme.tenorYears === years ? 'none' : '1px solid var(--border-color)',
              }}
              onClick={() => handleFieldChange('tenorYears', years)}
            >
              {years} Tahun
            </button>
          ))}
        </div>
      </div>

      {/* Calculation Type */}
      <div className="input-group">
        <label className="input-label">Tipe Perhitungan Bunga</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {(['annuity', 'effective', 'flat'] as CalculationType[]).map(type => (
            <button
              key={type}
              type="button"
              className="btn"
              style={{ 
                flex: 1, 
                background: activeScheme.calculationType === type ? 'var(--primary)' : 'var(--bg-tertiary)',
                color: activeScheme.calculationType === type ? '#ffffff' : 'var(--text-primary)',
                border: activeScheme.calculationType === type ? 'none' : '1px solid var(--border-color)',
              }}
              onClick={() => handleCalcTypeChange(type)}
            >
              {type === 'annuity' ? 'Anuitas' : type === 'effective' ? 'Efektif' : 'Flat'}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          {activeScheme.calculationType === 'annuity' && "* Anuitas: Paling umum digunakan bank. Jumlah cicilan pokok + bunga bulanan tetap di setiap periode bunga."}
          {activeScheme.calculationType === 'effective' && "* Efektif: Cicilan bulanan perlahan menurun karena bunga dihitung dari sisa saldo pokok pinjaman yang kian menyusut."}
          {activeScheme.calculationType === 'flat' && "* Flat: Suku bunga dihitung merata dari plafond awal. Cicilan selalu sama sepanjang tenor (banyak di Syariah/Multiguna)."}
        </p>
      </div>

      {/* Mode Pelunasan Ekstra */}
      <div className="input-group">
        <label className="input-label">Mode Pelunasan Ekstra (Prepayment)</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            className="btn"
            style={{ 
              flex: 1, 
              background: activeScheme.extraPaymentMode === 'reduce_tenor' ? 'var(--primary)' : 'var(--bg-tertiary)',
              color: activeScheme.extraPaymentMode === 'reduce_tenor' ? '#ffffff' : 'var(--text-primary)',
              border: activeScheme.extraPaymentMode === 'reduce_tenor' ? 'none' : '1px solid var(--border-color)',
              fontSize: '0.85rem',
            }}
            onClick={() => handleFieldChange('extraPaymentMode', 'reduce_tenor')}
          >
            Mempercepat Tenor (Cicilan Tetap)
          </button>
          <button
            type="button"
            className="btn"
            style={{ 
              flex: 1, 
              background: (activeScheme.extraPaymentMode || 'reduce_installment') === 'reduce_installment' ? 'var(--primary)' : 'var(--bg-tertiary)',
              color: (activeScheme.extraPaymentMode || 'reduce_installment') === 'reduce_installment' ? '#ffffff' : 'var(--text-primary)',
              border: (activeScheme.extraPaymentMode || 'reduce_installment') === 'reduce_installment' ? 'none' : '1px solid var(--border-color)',
              fontSize: '0.85rem',
            }}
            onClick={() => handleFieldChange('extraPaymentMode', 'reduce_installment')}
          >
            Mengurangi Cicilan (Tenor Tetap)
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          {(activeScheme.extraPaymentMode || 'reduce_installment') === 'reduce_installment' 
            ? "* Mengurangi Cicilan: Jangka waktu tenor KPR tetap sama, namun bank menghitung ulang cicilan bulanan Anda berikutnya menjadi lebih kecil sesuai sisa pokok pinjaman yang baru."
            : "* Mempercepat Tenor: Jumlah cicilan bulanan tetap sama. Setiap pelunasan ekstra memotong sisa pokok KPR secara langsung, mempersingkat durasi pinjaman."
          }
        </p>
      </div>

      {/* Start Date */}
      <div className="input-group">
        <label className="input-label">Mulai Angsuran Pertama</label>
        <div className="input-wrapper">
          <input
            type="month"
            className="input-field"
            value={activeScheme.startDate}
            onChange={(e) => handleFieldChange('startDate', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Interest Rate Scheme Tabs */}
      <div className="input-group">
        <label className="input-label">Skema Suku Bunga KPR</label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            className="btn"
            style={{ 
              flex: 1, 
              background: activeScheme.interestScheme === 'fixed' ? 'var(--primary)' : 'var(--bg-tertiary)',
              color: activeScheme.interestScheme === 'fixed' ? '#ffffff' : 'var(--text-primary)',
              border: activeScheme.interestScheme === 'fixed' ? 'none' : '1px solid var(--border-color)',
            }}
            onClick={() => handleSchemeChange('fixed')}
          >
            Fixed Biasa
          </button>
          <button
            type="button"
            className="btn"
            style={{ 
              flex: 1, 
              background: activeScheme.interestScheme === 'tiered' ? 'var(--primary)' : 'var(--bg-tertiary)',
              color: activeScheme.interestScheme === 'tiered' ? '#ffffff' : 'var(--text-primary)',
              border: activeScheme.interestScheme === 'tiered' ? 'none' : '1px solid var(--border-color)',
            }}
            onClick={() => handleSchemeChange('tiered')}
          >
            Fixed Berjenjang (Promo)
          </button>
        </div>
      </div>

      {/* Fixed Biasa Inputs */}
      {activeScheme.interestScheme === 'fixed' && (
        <div className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px dashed var(--border-color)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Parameter Bunga Fixed Biasa</h4>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Suku Bunga Fixed</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="input-field input-field-suffixed"
                  value={displayNum(activeScheme.fixedRate)}
                  onChange={(e) => handleFieldChange('fixedRate', parseNum(e.target.value))}
                />
                <span className="input-suffix">%</span>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Masa Bunga Fixed</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  inputMode="numeric"
                  className="input-field input-field-suffixed"
                  min="1"
                  max={activeScheme.tenorYears}
                  style={{
                    borderColor: isFixedOverTenor ? 'var(--error)' : 'var(--border-color)',
                    boxShadow: isFixedOverTenor ? '0 0 0 1px var(--error)' : 'none'
                  }}
                  value={displayNum(activeScheme.fixedYears)}
                  onChange={(e) => handleFieldChange('fixedYears', Math.trunc(parseNum(e.target.value)))}
                />
                <span className="input-suffix">Tahun</span>
              </div>
            </div>
          </div>
          {isFixedOverTenor && (
            <div style={{ color: 'var(--error)', fontSize: '0.75rem', fontWeight: 600, marginTop: '8px' }}>
              ⚠️ Masa bunga fixed ({activeScheme.fixedYears} tahun) melebihi Jangka Waktu Tenor KPR ({activeScheme.tenorYears} tahun).
            </div>
          )}
        </div>
      )}

      {/* Fixed Berjenjang Tiers Editor */}
      {activeScheme.interestScheme === 'tiered' && (
        <div className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Jenjang Bunga Fixed (Tiered)</h4>
            <span 
              className="badge" 
              style={{ 
                textTransform: 'none',
                background: isTieredOverTenor ? 'var(--error-light)' : 'var(--success-light)',
                color: isTieredOverTenor ? 'var(--error)' : 'var(--success)',
                fontWeight: 700
              }}
            >
              Total Fixed: {totalTieredYears} Tahun
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeScheme.tieredTiers.map((tier, index) => {
              // Quick calculations of timeline labels
              let prevYears = 0;
              for (let i = 0; i < index; i++) {
                prevYears += activeScheme.tieredTiers[i].durationYears;
              }
              const startYear = prevYears + 1;
              const endYear = prevYears + tier.durationYears;

              return (
                <div key={tier.id} className="tier-row">
                  <div className="tier-num">
                    {index + 1}
                  </div>

                  <div className="tier-inputs">
                    <div className="tier-field">
                      <span className="tier-field-label">Suku Bunga</span>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="0"
                          className="input-field input-field-suffixed tier-input"
                          value={displayNum(tier.rate)}
                          onChange={(e) => handleTierChange(tier.id, 'rate', parseNum(e.target.value))}
                        />
                        <span className="input-suffix" style={{ right: '10px', fontSize: '0.8rem' }}>%</span>
                      </div>
                    </div>

                    <div className="tier-field">
                      <span className="tier-field-label">Durasi</span>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          placeholder="0"
                          className="input-field input-field-suffixed tier-input"
                          style={{
                            borderColor: isTieredOverTenor ? 'var(--error)' : 'var(--border-color)',
                            boxShadow: isTieredOverTenor ? '0 0 0 1px var(--error)' : 'none'
                          }}
                          value={displayNum(tier.durationYears)}
                          onChange={(e) => handleTierChange(tier.id, 'durationYears', Math.trunc(parseNum(e.target.value)))}
                        />
                        <span className="input-suffix" style={{ right: '10px', fontSize: '0.8rem' }}>Thn</span>
                      </div>
                    </div>
                  </div>

                  <div className="tier-range">
                    Tahun ke-{startYear} s/d {endYear}
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost tier-delete"
                    style={{ padding: '6px', color: 'var(--error)' }}
                    onClick={() => handleRemoveTier(tier.id)}
                    disabled={activeScheme.tieredTiers.length <= 1}
                    title="Hapus jenjang"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
            onClick={handleAddTier}
          >
            <Plus size={14} /> Tambah Jenjang Fixed
          </button>

          {isTieredOverTenor && (
            <div style={{ color: 'var(--error)', fontSize: '0.75rem', fontWeight: 600, marginTop: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)' }}>
              ⚠️ Total durasi jenjang fixed ({totalTieredYears} tahun) melebihi Jangka Waktu Tenor KPR ({activeScheme.tenorYears} tahun). Mohon kurangi durasi jenjang.
            </div>
          )}
        </div>
      )}

      {/* Floating Rate Input */}
      {activeScheme.interestScheme !== 'tiered' && (
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="input-label">Suku Bunga Mengambang (Floating Rate)</label>
            {activeScheme.interestScheme === 'fixed' && activeScheme.fixedYears < activeScheme.tenorYears && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Berlaku Mulai Tahun ke-{activeScheme.fixedYears + 1}
              </span>
            )}
          </div>
          <div className="input-wrapper">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="input-field input-field-suffixed"
              value={displayNum(activeScheme.floatingRate)}
              onChange={(e) => handleFieldChange('floatingRate', parseNum(e.target.value))}
            />
            <span className="input-suffix">%</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            * Floating Rate biasanya mengikuti fluktuasi bunga acuan BI (BI-Rate) dan berkisar antara 10% s/d 14% di Indonesia.
          </p>
        </div>
      )}

    </div>
  );
};
