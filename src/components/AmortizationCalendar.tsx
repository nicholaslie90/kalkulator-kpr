import React, { useState } from 'react';
import type { AmortizationRow, BankScheme, SplitConfig } from '../utils/types';
import { formatRupiah } from '../utils/formatters';
import { downloadCsv, downloadExcel, exportPdf, sanitizeFilename } from '../utils/exporters';
import { Plus, X, Check, Timer, SlidersHorizontal, TrendingUp, Download, FileSpreadsheet, FileText, Table2 } from 'lucide-react';

interface AmortizationCalendarProps {
  schedule: AmortizationRow[];
  totalInterest: number;
  totalPayment: number;
  originalTenorMonths: number;
  extraPayments: Record<number, number>;
  onAddExtraPayment: (month: number, amount: number) => void;
  onRemoveExtraPayment: (month: number) => void;
  bankSchemes: BankScheme[];
  selectedBankSchemeId: string;
  onSelectBankScheme: (id: string) => void;
  initialOutflow: number; // Modal awal: DP + total biaya akad & transaksi
  propertyPrice: number; // Harga rumah saat ini (basis proyeksi nilai)
  sellerTaxPercent: number; // Pajak penjual % (untuk estimasi untung/rugi jual)
  splitConfig: SplitConfig;
  onSplitConfigChange: (cfg: SplitConfig) => void;
  appreciationRate: number; // % apresiasi/inflasi harga rumah per tahun
  onAppreciationRateChange: (rate: number) => void;
}

export const AmortizationCalendar: React.FC<AmortizationCalendarProps> = ({
  schedule,
  totalInterest,
  totalPayment,
  originalTenorMonths,
  extraPayments,
  onAddExtraPayment,
  onRemoveExtraPayment,
  bankSchemes,
  selectedBankSchemeId,
  onSelectBankScheme,
  initialOutflow,
  propertyPrice,
  sellerTaxPercent,
  splitConfig,
  onSplitConfigChange,
  appreciationRate,
  onAppreciationRateChange,
}) => {
  const [activeExtraMonth, setActiveExtraMonth] = useState<number | null>(null);
  const [extraVal, setExtraVal] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [resaleMonth, setResaleMonth] = useState<number>(36);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Proyeksi nilai rumah pada bulan ke-m (dimajemukkan per tahun).
  const projectedValue = (monthNumber: number) =>
    propertyPrice * Math.pow(1 + appreciationRate / 100, (monthNumber - 1) / 12);

  const handleSaveExtra = (month: number) => {
    const num = parseInt(extraVal.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      onAddExtraPayment(month, num);
    }
    setActiveExtraMonth(null);
    setExtraVal('');
  };

  const actualTenorMonths = schedule.length;
  const isShortened = actualTenorMonths < originalTenorMonths;
  const monthsSaved = originalTenorMonths - actualTenorMonths;
  const yearsSaved = (monthsSaved / 12).toFixed(1);

  const periodsList: Array<{
    label: string;
    rate: number;
    monthsCount: number;
    totalInstallment: number;
    totalExtra: number;
  }> = [];

  schedule.forEach(row => {
    let lastPeriod = periodsList[periodsList.length - 1];
    if (!lastPeriod || lastPeriod.label !== row.label) {
      lastPeriod = {
        label: row.label,
        rate: row.interestRate,
        monthsCount: 0,
        totalInstallment: 0,
        totalExtra: 0,
      };
      periodsList.push(lastPeriod);
    }
    lastPeriod.monthsCount += 1;
    lastPeriod.totalInstallment += row.installment;
    lastPeriod.totalExtra += row.extraPayment;
  });

  // Akumulasi biaya yang sudah keluar per bulan (untuk perhitungan resale).
  // = Modal Awal (DP + biaya akad/transaksi) + akumulasi angsuran + pelunasan ekstra s/d bulan tsb.
  const cumulativeByMonth: Record<number, number> = {};
  let runningOutflow = initialOutflow;
  schedule.forEach(row => {
    runningOutflow += row.installment + row.extraPayment;
    cumulativeByMonth[row.monthNumber] = runningOutflow;
  });
  const totalOutflowAtPayoff = runningOutflow;

  // Estimasi untung/rugi jual pada bulan terpilih
  const rMonth = Math.min(Math.max(1, resaleMonth || 1), schedule.length);
  const rRow = schedule[rMonth - 1];
  const rValue = projectedValue(rMonth);
  const rSisaPokok = rRow ? rRow.remainingBalance : 0;
  const rTotalKeluar = cumulativeByMonth[rMonth] ?? initialOutflow;
  const rPajakPenjual = (sellerTaxPercent / 100) * rValue;
  const rNetProceeds = rValue - rPajakPenjual - rSisaPokok; // uang bersih diterima setelah lunasi KPR & pajak
  const rProfit = rNetProceeds - rTotalKeluar; // dibanding total modal yang sudah keluar

  // --- Ekspor data kalender (CSV / Excel / PDF) ---
  const activeScheme = bankSchemes.find(b => b.id === selectedBankSchemeId);
  const exportTitle = `Kalender Cicilan KPR — ${activeScheme?.bankName ?? ''} ${activeScheme?.schemeName ?? ''}`.trim();
  const exportMeta = [
    `Bank / Skema: ${activeScheme?.bankName ?? '-'} (${activeScheme?.schemeName ?? '-'})`,
    `Harga Rumah: ${formatRupiah(propertyPrice)}`,
    `Modal Awal (DP + Biaya): ${formatRupiah(initialOutflow)}`,
    `Total Bunga: ${formatRupiah(totalInterest)} | Total Cicilan + Bunga: ${formatRupiah(totalPayment)}`,
    `Apresiasi Harga: ${appreciationRate}%/tahun | Alokasi Bunga:Pokok: ${splitConfig.mode === 'fixed' ? `Rasio Tetap ${splitConfig.interestRatio}:${100 - splitConfig.interestRatio}` : 'Otomatis'}`,
  ];
  const exportHeaders = ['Bulan', 'Tanggal', 'Bunga (%)', 'Cicilan Pokok', 'Cicilan Bunga', 'Bunga:Pokok', 'Total Angsuran', 'Pelunasan Ekstra', 'Sisa Pokok', 'Total Biaya Keluar', 'Estimasi Nilai Rumah'];
  const exportData = schedule.map(row => {
    const ip = row.installment > 0 ? Math.round((row.interestPayment / row.installment) * 100) : 0;
    return {
      bulan: row.monthNumber,
      tanggal: row.dateStr,
      bungaPct: row.interestRate,
      pokok: Math.round(row.principalPayment),
      bunga: Math.round(row.interestPayment),
      rasio: `${ip}:${100 - ip}`,
      angsuran: Math.round(row.installment),
      ekstra: Math.round(row.extraPayment),
      sisaPokok: Math.round(row.remainingBalance),
      totalKeluar: Math.round(cumulativeByMonth[row.monthNumber]),
      nilaiRumah: Math.round(projectedValue(row.monthNumber)),
    };
  });
  const numericRows = exportData.map(d => [d.bulan, d.tanggal, d.bungaPct, d.pokok, d.bunga, d.rasio, d.angsuran, d.ekstra, d.sisaPokok, d.totalKeluar, d.nilaiRumah]);
  const displayRows = exportData.map(d => [
    `#${d.bulan}`, d.tanggal, `${d.bungaPct}%`, formatRupiah(d.pokok), formatRupiah(d.bunga),
    `${d.rasio.split(':')[0]}% : ${d.rasio.split(':')[1]}%`, formatRupiah(d.angsuran),
    d.ekstra > 0 ? formatRupiah(d.ekstra) : '-', formatRupiah(d.sisaPokok), formatRupiah(d.totalKeluar), formatRupiah(d.nilaiRumah),
  ]);
  const exportFilename = sanitizeFilename(`kalender-cicilan-${activeScheme?.bankName ?? 'kpr'}`);

  const handleExport = (kind: 'csv' | 'excel' | 'pdf') => {
    setShowExportMenu(false);
    if (kind === 'csv') downloadCsv(exportFilename, exportHeaders, numericRows, [exportTitle, ...exportMeta]);
    else if (kind === 'excel') downloadExcel(exportFilename, exportTitle, exportMeta, exportHeaders, displayRows);
    else exportPdf(exportTitle, exportMeta, exportHeaders, displayRows);
  };

  // Interest saved estimate (rough difference)
  // We can calculate this by running the calculation without extra payments, but since we are displaying the summary cards,
  // let's show the final payoff date and actual tenor clearly!

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '24px' }}>
      
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Kalender Pembayaran & Amortisasi</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Jadwal cicilan bulanan lengkap. Anda dapat menambahkan pelunasan ekstra pada bulan tertentu untuk mempercepat pelunasan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn" 
            style={{ 
              fontSize: '0.8rem', 
              padding: '6px 12px',
              background: viewMode === 'table' ? 'var(--primary)' : 'var(--bg-tertiary)',
              color: viewMode === 'table' ? '#ffffff' : 'var(--text-primary)',
            }}
            onClick={() => setViewMode('table')}
          >
            Tampilan Tabel
          </button>
          <button
            className="btn"
            style={{
              fontSize: '0.8rem',
              padding: '6px 12px',
              background: viewMode === 'cards' ? 'var(--primary)' : 'var(--bg-tertiary)',
              color: viewMode === 'cards' ? '#ffffff' : 'var(--text-primary)',
            }}
            onClick={() => setViewMode('cards')}
          >
            Tampilan Kartu Bulanan
          </button>

          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn"
              style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowExportMenu(v => !v)}
            >
              <Download size={14} /> Ekspor
            </button>
            {showExportMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowExportMenu(false)} />
                <div
                  className="glass-panel"
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50, padding: '6px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.18))' }}
                >
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.82rem', padding: '8px 10px' }} onClick={() => handleExport('csv')}>
                    <Table2 size={15} style={{ color: 'var(--primary)' }} /> CSV (.csv)
                  </button>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.82rem', padding: '8px 10px' }} onClick={() => handleExport('excel')}>
                    <FileSpreadsheet size={15} style={{ color: 'var(--success)' }} /> Excel (.xls)
                  </button>
                  <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '8px', fontSize: '0.82rem', padding: '8px 10px' }} onClick={() => handleExport('pdf')}>
                    <FileText size={15} style={{ color: 'var(--error)' }} /> PDF (cetak / simpan)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bank Scheme Selector */}
      <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Pilih Bank & Skema KPR untuk Kalender Amortisasi:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {bankSchemes.map(scheme => {
            const isActive = scheme.id === selectedBankSchemeId;
            return (
              <button
                key={scheme.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isActive ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'normal',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isActive ? '0 0 10px var(--primary-glow)' : 'none',
                }}
                onClick={() => onSelectBankScheme(scheme.id)}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--primary)' : 'var(--text-muted)'
                }} />
                <div>
                  <strong>{scheme.bankName}</strong> <span style={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 500 }}>({scheme.schemeName})</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pengaturan Alokasi Bunga:Pokok & Apresiasi Harga */}
      <div className="grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
        {/* Rasio Bunga:Pokok */}
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: '0.9rem' }}>Alokasi Cicilan: Bunga : Pokok</strong>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <button
              className="btn"
              style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', background: splitConfig.mode === 'auto' ? 'var(--primary)' : 'var(--bg-secondary)', color: splitConfig.mode === 'auto' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              onClick={() => onSplitConfigChange({ ...splitConfig, mode: 'auto' })}
            >
              Otomatis (Anuitas/Efektif)
            </button>
            <button
              className="btn"
              style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', background: splitConfig.mode === 'fixed' ? 'var(--primary)' : 'var(--bg-secondary)', color: splitConfig.mode === 'fixed' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              onClick={() => onSplitConfigChange({ ...splitConfig, mode: 'fixed' })}
            >
              Rasio Tetap
            </button>
          </div>
          {splitConfig.mode === 'fixed' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bunga {Math.round(splitConfig.interestRatio)}%</span>
                <span style={{ color: 'var(--text-secondary)' }}>Pokok {Math.round(100 - splitConfig.interestRatio)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={splitConfig.interestRatio}
                onChange={(e) => onSplitConfigChange({ ...splitConfig, interestRatio: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Nilai cicilan tetap; hanya proporsi bunga & pokok yang dipaksa ke rasio ini. Sisa pokok & lama pelunasan menyesuaikan (loan mungkin tidak lunas tepat di akhir tenor).
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Proporsi bunga:pokok dihitung akurat per bulan sesuai metode {bankSchemes.find(b => b.id === selectedBankSchemeId)?.calculationType === 'flat' ? 'Flat' : bankSchemes.find(b => b.id === selectedBankSchemeId)?.calculationType === 'effective' ? 'Efektif' : 'Anuitas'}. Kolom "Bunga:Pokok" menampilkan rasio aktualnya.
            </p>
          )}
        </div>

        {/* Apresiasi Harga Rumah */}
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            <strong style={{ fontSize: '0.9rem' }}>Apresiasi Harga Rumah / Tahun</strong>
          </div>
          <div className="input-wrapper" style={{ maxWidth: '160px' }}>
            <input
              type="number"
              step="0.5"
              className="input-field input-field-suffixed"
              value={appreciationRate || ''}
              onChange={(e) => onAppreciationRateChange(Number(e.target.value))}
            />
            <span className="input-suffix">% / thn</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Estimasi kenaikan harga rumah per tahun (dimajemukkan). Dipakai untuk kolom <strong>Estimasi Nilai Rumah</strong> & kartu untung/rugi jual. Basis: harga rumah saat ini {formatRupiah(propertyPrice)}.
          </p>
        </div>
      </div>

      {/* Tenor Shortening Banner */}
      {isShortened && (
        <div style={{ background: 'var(--success-light)', border: '1px solid rgba(52,211,153,0.3)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '40px', height: '40px', background: 'var(--success)', borderRadius: '50%', color: '#fff' }}>
            <Timer size={22} />
          </div>
          <div>
            <strong style={{ color: 'var(--success)', fontSize: '0.95rem' }}>Simulasi Pelunasan Dipercepat Aktif!</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Dengan pelunasan ekstra, KPR Anda lunas lebih cepat <strong>{monthsSaved} Bulan ({yearsSaved} Tahun)</strong>. Total tenor terpangkas dari {originalTenorMonths} bulan menjadi <strong>{actualTenorMonths} bulan</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL BUNGA DIBAYARKAN</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatRupiah(totalInterest)}
          </div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL CICILAN + BUNGA</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatRupiah(totalPayment)}
          </div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMASI LUNAS PADA</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {schedule[schedule.length - 1]?.dateStr || '-'}
          </div>
        </div>
      </div>

      {/* Resale Helper */}
      <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modal Awal (DP + Biaya Akad & Transaksi)</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{formatRupiah(initialOutflow)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Biaya Keluar (s/d Lunas)</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{formatRupiah(totalOutflowAtPayoff)}</div>
          </div>
        </div>

        {/* Estimasi Untung/Rugi Jual (interaktif) */}
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <strong style={{ fontSize: '0.9rem' }}>Estimasi Untung/Rugi bila dijual pada bulan ke-</strong>
            <div className="input-wrapper" style={{ width: '90px' }}>
              <input
                type="number"
                min={1}
                max={schedule.length}
                className="input-field"
                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                value={resaleMonth || ''}
                onChange={(e) => setResaleMonth(Number(e.target.value) || 1)}
              />
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ({rRow?.dateStr || '-'})
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimasi Harga Jual</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--success)' }}>{formatRupiah(rValue)}</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>− Pajak Penjual ({sellerTaxPercent}%)</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--warning)' }}>{formatRupiah(rPajakPenjual)}</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>− Sisa Pokok (Pelunasan KPR)</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--error)' }}>{formatRupiah(rSisaPokok)}</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>− Total Biaya Keluar</div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{formatRupiah(rTotalKeluar)}</strong>
            </div>
            <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>= Estimasi Untung/Rugi</div>
              <strong style={{ fontSize: '1.05rem', color: rProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                {rProfit >= 0 ? '+' : '−'}{formatRupiah(Math.abs(rProfit))}
              </strong>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            Untung/Rugi = Harga Jual − Pajak Penjual − Sisa Pokok − Total Biaya Keluar. Estimasi harga jual = harga rumah dimajemukkan {appreciationRate}%/tahun.
          </p>
        </div>
      </div>

      {/* Grouped Periods Summary */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Akumulasi Angsuran per Periode Bunga
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {periodsList.map((period, idx) => {
            const avgInstallment = period.totalInstallment / period.monthsCount;
            const isFloating = period.label.includes('Floating');
            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '16px', 
                  borderLeft: isFloating ? '4px solid var(--error)' : '4px solid var(--primary)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {period.label}
                  </span>
                  <span className={`badge ${isFloating ? 'badge-error' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                    {period.rate}%
                  </span>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Masa Tenor:</span>
                  <strong>{period.monthsCount} Bulan</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rata-rata Cicilan:</span>
                  <strong>{formatRupiah(avgInstallment)}/bln</strong>
                </div>

                {period.totalExtra > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--success)' }}>
                    <span>Pelunasan Ekstra:</span>
                    <strong>{formatRupiah(period.totalExtra)}</strong>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Bayar:</span>
                  <strong style={{ color: isFloating ? 'var(--error)' : 'var(--primary)' }}>
                    {formatRupiah(period.totalInstallment + period.totalExtra)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Bulan</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Tanggal</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Bunga (%)</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Cicilan Pokok</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Cicilan Bunga</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Bunga : Pokok</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Angsuran</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Pelunasan Ekstra</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Sisa Pokok</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Total Biaya Keluar</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Estimasi Nilai Rumah</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, idx) => {
                const prevRow = idx > 0 ? schedule[idx - 1] : null;
                const isRateChanged = prevRow && Math.abs(prevRow.installment - row.installment) > 1000;
                const isFloatingJustStarted = prevRow && prevRow.label.includes('Fixed') && row.label.includes('Floating');
                const pctIncrease = prevRow ? Math.round(((row.installment - prevRow.installment) / prevRow.installment) * 100) : 0;

                return (
                  <React.Fragment key={row.monthNumber}>
                    {/* Rate increase / change warning insertion */}
                    {isRateChanged && (
                      <tr style={{ background: isFloatingJustStarted ? 'var(--error-light)' : 'var(--warning-light)' }}>
                        <td colSpan={11} style={{ padding: '10px 16px', fontSize: '0.8rem', color: isFloatingJustStarted ? 'var(--error)' : 'var(--warning)', fontWeight: 600 }}>
                          ⚠️ Penyesuaian Angsuran: 
                          {isFloatingJustStarted 
                            ? ` Bunga berubah dari Fixed ke Floating (${row.interestRate}%). Cicilan naik dari ${formatRupiah(prevRow.installment)} menjadi ${formatRupiah(row.installment)} (Naik ${pctIncrease}%!).` 
                            : ` Bunga berganti tier (${row.interestRate}%). Cicilan berubah dari ${formatRupiah(prevRow.installment)} menjadi ${formatRupiah(row.installment)} (${pctIncrease >= 0 ? '+' : ''}${pctIncrease}%).`}
                        </td>
                      </tr>
                    )}

                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: row.monthNumber % 2 === 0 ? 'rgba(0,0,0,0.01)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{row.monthNumber}</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{row.dateStr}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${row.label.includes('Floating') ? 'badge-error' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                          {row.interestRate}% ({row.label.replace('Fixed ', '')})
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{formatRupiah(row.principalPayment)}</td>
                      <td style={{ padding: '12px 16px' }}>{formatRupiah(row.interestPayment)}</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {(() => {
                          const ip = row.installment > 0 ? Math.round((row.interestPayment / row.installment) * 100) : 0;
                          return `${ip}% : ${100 - ip}%`;
                        })()}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{formatRupiah(row.installment)}</td>
                      
                      {/* Extra Payment Cell */}
                      <td style={{ padding: '8px 16px' }}>
                        {extraPayments[row.monthNumber] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                            <strong>{formatRupiah(extraPayments[row.monthNumber])}</strong>
                            <button 
                              className="btn btn-ghost" 
                              style={{ padding: '2px', color: 'var(--error)' }}
                              onClick={() => onRemoveExtraPayment(row.monthNumber)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : activeExtraMonth === row.monthNumber ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <div className="input-wrapper" style={{ width: '100px' }}>
                              <input 
                                type="text"
                                className="input-field"
                                style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                                placeholder="Rp"
                                value={extraVal}
                                onChange={(e) => setExtraVal(e.target.value.replace(/[^0-9]/g, ''))}
                              />
                            </div>
                            <button className="btn btn-primary" style={{ padding: '4px' }} onClick={() => handleSaveExtra(row.monthNumber)}>
                              <Check size={12} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => setActiveExtraMonth(null)}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setActiveExtraMonth(row.monthNumber);
                              setExtraVal('');
                            }}
                          >
                            <Plus size={10} /> Tambah
                          </button>
                        )}
                      </td>
                      
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {formatRupiah(row.remainingBalance)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                        {formatRupiah(cumulativeByMonth[row.monthNumber])}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                        {formatRupiah(projectedValue(row.monthNumber))}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
          {schedule.map((row, idx) => {
            const prevRow = idx > 0 ? schedule[idx - 1] : null;
            const isFloatingJustStarted = prevRow && prevRow.label.includes('Fixed') && row.label.includes('Floating');

            return (
              <div 
                key={row.monthNumber} 
                className="glass-panel" 
                style={{ 
                  padding: '12px', 
                  fontSize: '0.8rem',
                  border: isFloatingJustStarted ? '1px solid var(--error)' : '1px solid var(--glass-border)',
                  background: isFloatingJustStarted ? 'var(--error-light)' : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Bulan #{row.monthNumber}</span>
                  <span className={`badge ${row.label.includes('Floating') ? 'badge-error' : 'badge-primary'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {row.interestRate}%
                  </span>
                </div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{row.dateStr}</strong>
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cicilan:</span>
                  <strong>{formatRupiah(row.installment)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Bunga:</span>
                  <span>{formatRupiah(row.interestPayment)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Pokok:</span>
                  <span>{formatRupiah(row.principalPayment)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Bunga:Pokok:</span>
                  <span>{(() => { const ip = row.installment > 0 ? Math.round((row.interestPayment / row.installment) * 100) : 0; return `${ip}%:${100 - ip}%`; })()}</span>
                </div>

                <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }}></div>

                {/* Extra Payment in Card */}
                <div>
                  {extraPayments[row.monthNumber] ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--success)' }}>
                      <span>Extra:</span>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {formatRupiah(extraPayments[row.monthNumber])}
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '0', color: 'var(--error)' }}
                          onClick={() => onRemoveExtraPayment(row.monthNumber)}
                        >
                          <X size={10} />
                        </button>
                      </strong>
                    </div>
                  ) : activeExtraMonth === row.monthNumber ? (
                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ padding: '2px 4px', fontSize: '0.7rem' }}
                        placeholder="Rp"
                        value={extraVal}
                        onChange={(e) => setExtraVal(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                      <button className="btn btn-primary" style={{ padding: '2px 4px', fontSize: '0.7rem' }} onClick={() => handleSaveExtra(row.monthNumber)}>
                        <Check size={10} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '4px', fontSize: '0.7rem' }}
                      onClick={() => {
                        setActiveExtraMonth(row.monthNumber);
                        setExtraVal('');
                      }}
                    >
                      + Pelunasan Ekstra
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                  Sisa: {formatRupiah(row.remainingBalance)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'right' }}>
                  Total Keluar: {formatRupiah(cumulativeByMonth[row.monthNumber])}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, textAlign: 'right' }}>
                  Nilai Rumah: {formatRupiah(projectedValue(row.monthNumber))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
