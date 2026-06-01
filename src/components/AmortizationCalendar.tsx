import React, { useState } from 'react';
import type { AmortizationRow, BankScheme } from '../utils/types';
import { formatRupiah } from '../utils/formatters';
import { Plus, X, Check, Timer } from 'lucide-react';

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
}) => {
  const [activeExtraMonth, setActiveExtraMonth] = useState<number | null>(null);
  const [extraVal, setExtraVal] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

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
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Angsuran</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Pelunasan Ekstra</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Sisa Pokok</th>
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
                        <td colSpan={8} style={{ padding: '10px 16px', fontSize: '0.8rem', color: isFloatingJustStarted ? 'var(--error)' : 'var(--warning)', fontWeight: 600 }}>
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
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
