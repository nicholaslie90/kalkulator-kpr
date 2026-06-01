import React, { useState } from 'react';
import type { UpfrontCosts, CustomFee, BankScheme } from '../utils/types';
import { formatRupiah } from '../utils/formatters';
import { getBphtbFormulaString } from '../utils/kprCalculations';
import { Trash2, ReceiptText } from 'lucide-react';

interface UpfrontCostsFormProps {
  upfrontCosts: UpfrontCosts;
  onUpdateUpfrontCosts: (costs: UpfrontCosts) => void;
  price: number;
  plafond: number;
  activeBankScheme: BankScheme;
  onUpdateBankScheme: (scheme: Partial<BankScheme>) => void;
}

export const UpfrontCostsForm: React.FC<UpfrontCostsFormProps> = ({
  upfrontCosts,
  onUpdateUpfrontCosts,
  price,
  plafond,
  activeBankScheme,
  onUpdateBankScheme,
}) => {
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState(0);

  const handleAddCustomFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName || newFeeAmount <= 0) return;

    const newFee: CustomFee = {
      id: Date.now().toString(),
      name: newFeeName,
      amount: newFeeAmount,
    };

    onUpdateUpfrontCosts({
      ...upfrontCosts,
      customFees: [...upfrontCosts.customFees, newFee],
    });

    setNewFeeName('');
    setNewFeeAmount(0);
  };

  const handleRemoveCustomFee = (id: string) => {
    onUpdateUpfrontCosts({
      ...upfrontCosts,
      customFees: upfrontCosts.customFees.filter(fee => fee.id !== id),
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    const isBankFee = ['provisiPercent', 'adminFee', 'appraisalFee', 'notarisPercent', 'asuransiPercent'].includes(field);
    if (isBankFee) {
      onUpdateBankScheme({ [field]: value });
    } else {
      onUpdateUpfrontCosts({
        ...upfrontCosts,
        [field]: value,
      });
    }
  };

  // Extract bank-specific fee parameters from activeBankScheme
  const provisiPercent = activeBankScheme.provisiPercent ?? 0;
  const adminFee = activeBankScheme.adminFee ?? 0;
  const appraisalFee = activeBankScheme.appraisalFee ?? 0;
  const notarisPercent = activeBankScheme.notarisPercent ?? 0;
  const asuransiPercent = activeBankScheme.asuransiPercent ?? 0;

  // Upfront Calculations for display
  const provisiCost = (provisiPercent / 100) * plafond;
  const adminCost = adminFee;
  const appraisalCost = appraisalFee;
  const notarisCost = (notarisPercent / 100) * plafond;
  const asuransiCost = (asuransiPercent / 100) * plafond;
  const bphtbCost = upfrontCosts.useBphtbAuto ? Math.max(0, (price - upfrontCosts.bphtbNpoptkp) * 0.05) : 0;
  const customFeesCost = upfrontCosts.customFees.reduce((sum, f) => sum + f.amount, 0);
  const totalAkadCost = provisiCost + adminCost + appraisalCost + notarisCost + asuransiCost + bphtbCost + customFeesCost;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Rincian Biaya Akad & Pajak Awal</h3>
        <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
          Bank Aktif: {activeBankScheme.bankName}
        </span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
        Biaya-biaya transaksi saat penandatanganan akad kredit di depan notaris. Biasanya dibayarkan secara tunai di awal di luar uang muka (DP).
      </p>

      {/* Upfront Costs Total Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Biaya Akad & Pajak
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatRupiah(totalAkadCost)}
          </div>
        </div>
        <div style={{ background: 'var(--success-light)', border: '1px solid rgba(52,211,153,0.3)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Uang Pertama (DP + Akad)
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {formatRupiah(totalAkadCost + (price - plafond))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Provisi & Notaris */}
        <div className="grid-2">
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Biaya Provisi KPR</label>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatRupiah(provisiCost)}</strong>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                step="0.1"
                className="input-field input-field-suffixed"
                value={provisiPercent || ''}
                onChange={(e) => handleFieldChange('provisiPercent', Number(e.target.value))}
              />
              <span className="input-suffix">% Plafond</span>
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Biaya Notaris & APHT</label>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatRupiah(notarisCost)}</strong>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                step="0.1"
                className="input-field input-field-suffixed"
                value={notarisPercent || ''}
                onChange={(e) => handleFieldChange('notarisPercent', Number(e.target.value))}
              />
              <span className="input-suffix">% Plafond</span>
            </div>
          </div>
        </div>

        {/* Asuransi & Admin */}
        <div className="grid-2">
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Estimasi Asuransi (Jiwa & Kebakaran)</label>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatRupiah(asuransiCost)}</strong>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                step="0.1"
                className="input-field input-field-suffixed"
                value={asuransiPercent || ''}
                onChange={(e) => handleFieldChange('asuransiPercent', Number(e.target.value))}
              />
              <span className="input-suffix">% Plafond</span>
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Biaya Administrasi Bank</label>
            </div>
            <div className="input-wrapper">
              <span className="input-prefix">Rp</span>
              <input
                type="text"
                className="input-field input-field-prefixed"
                value={adminFee.toLocaleString('id-ID')}
                onChange={(e) => handleFieldChange('adminFee', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Appraisal / Penilaian */}
        <div className="input-group">
          <label className="input-label">Biaya Appraisal (Penilaian Agunan)</label>
          <div className="input-wrapper">
            <span className="input-prefix">Rp</span>
            <input
              type="text"
              className="input-field input-field-prefixed"
              value={appraisalFee.toLocaleString('id-ID')}
              onChange={(e) => handleFieldChange('appraisalFee', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            />
          </div>
        </div>

        {/* BPHTB Tax */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ReceiptText size={18} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '0.9rem' }}>Pajak Pembeli (BPHTB)</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="useBphtbAuto"
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                checked={upfrontCosts.useBphtbAuto}
                onChange={(e) => handleFieldChange('useBphtbAuto', e.target.checked)}
              />
              <label htmlFor="useBphtbAuto" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>Hitung Otomatis</label>
            </div>
          </div>

          {upfrontCosts.useBphtbAuto ? (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>NPOPTKP Daerah (Pengurangan Pajak)</label>
                <div className="input-wrapper">
                  <span className="input-prefix">Rp</span>
                  <input
                    type="text"
                    className="input-field input-field-prefixed"
                    style={{ padding: '8px 12px 8px 42px', fontSize: '0.9rem' }}
                    value={upfrontCosts.bphtbNpoptkp.toLocaleString('id-ID')}
                    onChange={(e) => handleFieldChange('bphtbNpoptkp', Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  * Umumnya Rp 60jt (nasional) atau Rp 80jt (DKI Jakarta/Jawa Barat/daerah tertentu).
                </span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rumus Pajak BPHTB</span>
                  <span style={{ color: 'var(--text-muted)' }}>5% x (Harga - NPOPTKP)</span>
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                  Detail: {getBphtbFormulaString(price, upfrontCosts.bphtbNpoptkp)}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Pajak BPHTB tidak dimasukkan ke dalam kalkulasi awal. Anda dapat menonaktifkan BPHTB jika biaya pajak ditanggung penjual / promo developer.
            </p>
          )}
        </div>

        {/* Custom Fees Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Biaya Lain-Lain (Kustom)</strong>
          
          {/* Custom fees list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {upfrontCosts.customFees.map(fee => (
              <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{fee.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatRupiah(fee.amount)}</strong>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '4px', color: 'var(--error)' }}
                    onClick={() => handleRemoveCustomFee(fee.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form to add custom fee */}
          <form onSubmit={handleAddCustomFee} style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Contoh: Booking Fee / DP Tambahan / Renovasi"
              className="input-field"
              style={{ flex: 2, padding: '8px 12px', fontSize: '0.85rem' }}
              value={newFeeName}
              onChange={(e) => setNewFeeName(e.target.value)}
            />
            <div className="input-wrapper" style={{ flex: 1.5 }}>
              <span className="input-prefix" style={{ fontSize: '0.8rem' }}>Rp</span>
              <input
                type="text"
                placeholder="Nominal"
                className="input-field input-field-prefixed"
                style={{ padding: '8px 12px 8px 32px', fontSize: '0.85rem' }}
                value={newFeeAmount === 0 ? '' : newFeeAmount.toLocaleString('id-ID')}
                onChange={(e) => setNewFeeAmount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              Tambah
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
