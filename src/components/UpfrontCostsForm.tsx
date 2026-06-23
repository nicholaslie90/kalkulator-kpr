import React, { useState } from 'react';
import type { UpfrontCosts, CustomFee, BankScheme } from '../utils/types';
import { formatRupiah } from '../utils/formatters';
import { CurrencyInput } from './CurrencyInput';
import { getBphtbFormulaString } from '../utils/kprCalculations';
import { Trash2, ReceiptText, FileSignature } from 'lucide-react';

interface UpfrontCostsFormProps {
  upfrontCosts: UpfrontCosts;
  onUpdateUpfrontCosts: (costs: UpfrontCosts) => void;
  price: number;
  discount?: number;
  plafond: number;
  activeBankScheme: BankScheme;
  onUpdateBankScheme: (scheme: Partial<BankScheme>) => void;
}

export const UpfrontCostsForm: React.FC<UpfrontCostsFormProps> = ({
  upfrontCosts,
  onUpdateUpfrontCosts,
  price,
  discount = 0,
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

  // Nilai transaksi (default = harga net) untuk perhitungan pajak jual-beli
  const netPrice = Math.max(0, price - discount);
  const transactionValue = upfrontCosts.transactionValue ?? netPrice;
  const sellerTaxPercent = upfrontCosts.sellerTaxPercent ?? 2.5;

  // Fee transaksi tetap (jual-beli / notaris)
  const ppjbFee = upfrontCosts.ppjbFee ?? 0;
  const skptFee = upfrontCosts.skptFee ?? 0;
  const ajbFee = upfrontCosts.ajbFee ?? 0;
  const balikNamaFee = upfrontCosts.balikNamaFee ?? 0;
  const pnbpFee = upfrontCosts.pnbpFee ?? 0;
  const cekSertifikatFee = upfrontCosts.cekSertifikatFee ?? 0;
  const validasiPajakFee = upfrontCosts.validasiPajakFee ?? 0;

  // Upfront Calculations for display
  const provisiCost = (provisiPercent / 100) * plafond;
  const adminCost = adminFee;
  const appraisalCost = appraisalFee;
  const notarisCost = (notarisPercent / 100) * plafond;
  const asuransiCost = (asuransiPercent / 100) * plafond;
  const bphtbCost = upfrontCosts.useBphtbAuto ? Math.max(0, (transactionValue - upfrontCosts.bphtbNpoptkp) * 0.05) : 0;
  // Pajak Penjual: info saja, TIDAK masuk total biaya pembeli
  const sellerTaxCost = (sellerTaxPercent / 100) * transactionValue;
  const transactionFeesCost = ppjbFee + skptFee + ajbFee + balikNamaFee + pnbpFee + cekSertifikatFee + validasiPajakFee;
  const customFeesCost = upfrontCosts.customFees.reduce((sum, f) => sum + f.amount, 0);
  const totalAkadCost = provisiCost + adminCost + appraisalCost + notarisCost + asuransiCost + bphtbCost + transactionFeesCost + customFeesCost;

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
              <CurrencyInput
                className="input-field input-field-prefixed"
                value={adminFee}
                onValueChange={(n) => handleFieldChange('adminFee', n)}
              />
            </div>
          </div>
        </div>

        {/* Appraisal / Penilaian */}
        <div className="input-group">
          <label className="input-label">Biaya Appraisal (Penilaian Agunan)</label>
          <div className="input-wrapper">
            <span className="input-prefix">Rp</span>
            <CurrencyInput
              className="input-field input-field-prefixed"
              value={appraisalFee}
              onValueChange={(n) => handleFieldChange('appraisalFee', n)}
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
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Pengurang Pajak (NPOPTKP)</label>
                <div className="input-wrapper">
                  <span className="input-prefix">Rp</span>
                  <CurrencyInput
                    className="input-field input-field-prefixed"
                    style={{ padding: '8px 12px 8px 42px', fontSize: '0.9rem' }}
                    value={upfrontCosts.bphtbNpoptkp}
                    onValueChange={(n) => handleFieldChange('bphtbNpoptkp', n)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  * Umumnya Rp 60jt (nasional) / Rp 80jt (DKI, Jabar). Isi Rp 250jt bila skema pajak Anda memakai pengurang tersebut.
                </span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rumus Pajak Pembeli (BPHTB)</span>
                  <span style={{ color: 'var(--text-muted)' }}>5% x (Transaksi - Pengurang)</span>
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                  Detail: {getBphtbFormulaString(transactionValue, upfrontCosts.bphtbNpoptkp)}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Pajak BPHTB tidak dimasukkan ke dalam kalkulasi awal. Anda dapat menonaktifkan BPHTB jika biaya pajak ditanggung penjual / promo developer.
            </p>
          )}
        </div>

        {/* Biaya Transaksi Jual-Beli, Notaris & Balik Nama */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileSignature size={18} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Biaya Transaksi, Notaris & Balik Nama</strong>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Biaya proses jual-beli & balik nama sertifikat. Nilai di bawah adalah estimasi — sesuaikan dengan penawaran notaris/PPAT Anda.
          </p>

          {/* Nilai Transaksi */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">Nilai Transaksi (Dasar Pajak)</label>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.7rem', padding: '2px 8px', color: 'var(--primary)' }}
                onClick={() => handleFieldChange('transactionValue', netPrice)}
              >
                Pakai Harga Net ({formatRupiah(netPrice)})
              </button>
            </div>
            <div className="input-wrapper">
              <span className="input-prefix">Rp</span>
              <CurrencyInput
                className="input-field input-field-prefixed"
                placeholder={netPrice.toLocaleString('id-ID')}
                value={transactionValue}
                onValueChange={(n) => handleFieldChange('transactionValue', n)}
              />
            </div>
          </div>

          {/* Pajak Penjual — info, tidak masuk total */}
          <div style={{ background: 'var(--warning-light)', border: '1px solid rgba(245,158,11,0.3)', padding: '12px 14px', borderRadius: 'var(--radius-md)', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '0.85rem' }}>Pajak Penjual (PPh Final)</strong>
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Ditanggung Penjual</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <div className="input-wrapper" style={{ width: '90px' }}>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field input-field-suffixed"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      value={sellerTaxPercent || ''}
                      onChange={(e) => handleFieldChange('sellerTaxPercent', Number(e.target.value))}
                    />
                    <span className="input-suffix" style={{ fontSize: '0.7rem' }}>%</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>x Nilai Transaksi</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--warning)' }}>{formatRupiah(sellerTaxCost)}</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>tidak masuk total pembeli</div>
              </div>
            </div>
          </div>

          {/* 7 fee tetap */}
          <div className="grid-2" style={{ marginTop: '14px', gap: '12px' }}>
            {([
              { field: 'ppjbFee', label: 'Pengikatan Jual Beli (PPJB)', value: ppjbFee },
              { field: 'skptFee', label: 'Pengecekan SKPT', value: skptFee },
              { field: 'ajbFee', label: 'Akta Jual Beli (AJB)', value: ajbFee },
              { field: 'balikNamaFee', label: 'Balik Nama (BBN)', value: balikNamaFee },
              { field: 'pnbpFee', label: 'PNBP', value: pnbpFee },
              { field: 'cekSertifikatFee', label: 'Cek & Validasi Sertifikat + Cek Zona', value: cekSertifikatFee },
              { field: 'validasiPajakFee', label: 'Validasi Pajak Pembeli', value: validasiPajakFee },
            ] as const).map(item => (
              <div className="input-group" key={item.field} style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.78rem' }}>{item.label}</label>
                <div className="input-wrapper">
                  <span className="input-prefix">Rp</span>
                  <CurrencyInput
                    className="input-field input-field-prefixed"
                    placeholder="0"
                    value={item.value}
                    onValueChange={(n) => handleFieldChange(item.field, n)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Subtotal Biaya Transaksi & Notaris</span>
            <strong style={{ color: 'var(--primary)' }}>{formatRupiah(transactionFeesCost + bphtbCost)}</strong>
          </div>
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
              <CurrencyInput
                placeholder="Nominal"
                className="input-field input-field-prefixed"
                style={{ padding: '8px 12px 8px 32px', fontSize: '0.85rem' }}
                value={newFeeAmount}
                onValueChange={(n) => setNewFeeAmount(n)}
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
