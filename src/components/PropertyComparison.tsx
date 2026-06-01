import React from 'react';
import type { PropertyProfile, KprInputs, UpfrontCosts, KprScenario, BankScheme } from '../utils/types';
import { calculateKpr } from '../utils/kprCalculations';
import { formatRupiah } from '../utils/formatters';
import { CheckCircle } from 'lucide-react';

interface PropertyComparisonProps {
  properties: PropertyProfile[];
  inputs: KprInputs;
  upfrontCosts: UpfrontCosts;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  scenarios: KprScenario[];
  onUpdateScenarios: (scenarios: KprScenario[]) => void;
  bankSchemes: BankScheme[];
  selectedBankSchemeId: string | null;
  onSelectBankScheme: (id: string) => void;
}

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({
  properties,
  inputs,
  upfrontCosts,
  selectedPropertyId,
  onSelectProperty,
  scenarios,
  onUpdateScenarios,
  bankSchemes,
  selectedBankSchemeId,
  onSelectBankScheme,
}) => {
  if (properties.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Belum ada data properti untuk dibandingkan</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Silakan tambahkan beberapa properti terlebih dahulu pada tab "Daftar Rumah".
        </p>
      </div>
    );
  }

  // Calculate calculations for all properties
  const comparedData = properties.map(p => {
    const calc = calculateKpr(p.price, p.dpAmount, inputs, upfrontCosts, {}, p.discount || 0, p.bookingFee || 0);
    return {
      property: p,
      calc,
    };
  });

  // Find active property for Bank Comparison
  const activeProp = properties.find(p => p.id === selectedPropertyId) || properties[0] || null;

  let minInitialVal = Infinity;
  let minFloatingVal = Infinity;
  let minInterestVal = Infinity;
  let minUpfrontVal = Infinity;

  if (activeProp && bankSchemes.length > 0) {
    bankSchemes.forEach(scheme => {
      const schemeUpfrontCosts = {
        useBphtbAuto: upfrontCosts.useBphtbAuto,
        bphtbNpoptkp: upfrontCosts.bphtbNpoptkp,
        customFees: upfrontCosts.customFees,
      };
      const calc = calculateKpr(
        activeProp.price,
        activeProp.dpAmount,
        scheme,
        schemeUpfrontCosts,
        {},
        activeProp.discount || 0,
        activeProp.bookingFee || 0
      );
      if (calc.monthlyInstallmentInitial < minInitialVal) minInitialVal = calc.monthlyInstallmentInitial;
      if (calc.monthlyInstallmentFloating < minFloatingVal) minFloatingVal = calc.monthlyInstallmentFloating;
      if (calc.totalInterest < minInterestVal) minInterestVal = calc.totalInterest;
      if (calc.totalCashNeeded < minUpfrontVal) minUpfrontVal = calc.totalCashNeeded;
    });
  }

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Perbandingan Properti</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Perbandingan komprehensif skema keuangan untuk masing-masing rumah pilihan Anda.
        </p>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, width: '200px' }}>Parameter</th>
              {comparedData.map(item => (
                <th 
                  key={item.property.id} 
                  style={{ 
                    padding: '16px', 
                    borderLeft: '1px solid var(--border-color)',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent',
                    width: `${80 / comparedData.length}%`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{item.property.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.property.developer || 'Developer N/A'}
                      </div>
                      {item.property.landWidth && item.property.landLength && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                          Tanah: {item.property.landWidth}x{item.property.landLength}
                        </div>
                      )}
                    </div>
                    {selectedPropertyId === item.property.id && (
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Aktif</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            
            {/* Action Row */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Operasi</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {selectedPropertyId === item.property.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem' }}>
                      <CheckCircle size={16} /> Sedang Dihitung
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }} 
                      onClick={() => onSelectProperty(item.property.id)}
                    >
                      Muat di Kalkulator
                    </button>
                  )}
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Harga Properti</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: 'var(--text-primary)',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.property.price)}
                </td>
              ))}
            </tr>

            {/* Diskon Rumah */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Diskon Properti</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    color: 'var(--error)',
                    fontWeight: 600,
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {item.property.discount > 0 ? `-${formatRupiah(item.property.discount)} (${item.property.discountPercent || 0}%)` : 'Rp 0'}
                </td>
              ))}
            </tr>

            {/* Down Payment */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Down Payment (DP)</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    color: 'var(--success)',
                    fontWeight: 600,
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.property.dpAmount)} ({item.property.dpPercent}%)
                </td>
              ))}
            </tr>

            {/* Booking Fee */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Booking Fee (Tanda Jadi)</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.property.bookingFee || 0)}
                </td>
              ))}
            </tr>

            {/* Sisa DP Akad */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sisa DP di Akad</td>
              {comparedData.map(item => {
                const sisaDp = Math.max(0, item.property.dpAmount - (item.property.bookingFee || 0));
                return (
                  <td 
                    key={item.property.id} 
                    style={{ 
                      padding: '12px 16px', 
                      borderLeft: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                    }}
                  >
                    {formatRupiah(sisaDp)}
                  </td>
                );
              })}
            </tr>

            {/* Plafond */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Plafond KPR (Pinjaman)</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontWeight: 600,
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.calc.plafond)}
                </td>
              ))}
            </tr>

            {/* Initial Monthly Payment */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Angsuran Awal (Fixed)</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.calc.monthlyInstallmentInitial)} / bln
                </td>
              ))}
            </tr>

            {/* Floating Monthly Payment */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {inputs.interestScheme === 'tiered' ? 'Angsuran Akhir (Fixed)' : 'Estimasi Angsuran Floating'}
              </td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontWeight: 700,
                    color: inputs.interestScheme === 'tiered' ? 'var(--text-primary)' : 'var(--error)',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.calc.monthlyInstallmentFloating)} / bln
                </td>
              ))}
            </tr>

            {/* Upfront Costs / Biaya Akad */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Biaya Akad & Pajak</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontWeight: 600,
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.calc.upfrontCostsTotal)}
                </td>
              ))}
            </tr>

            {/* Total Cash Needed */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--success-light)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--success)' }}>Modal Awal (DP + Akad)</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--success)',
                    background: selectedPropertyId === item.property.id ? 'rgba(52, 211, 153, 0.25)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.calc.totalCashNeeded)}
                </td>
              ))}
            </tr>

            {/* Total Interest Paid */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Bunga Selama Tenor</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.calc.totalInterest)}
                </td>
              ))}
            </tr>

            {/* Total Overall Payment */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Pembayaran KPR</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {formatRupiah(item.calc.totalPayment)}
                </td>
              ))}
            </tr>

            {/* Tipe & Ukuran */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tipe & Dimensi</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  <div>Tipe: <strong>{item.property.houseType || '-'}</strong></div>
                  <div>Tanah: {item.property.landWidth}x{item.property.landLength} m ({item.property.landWidth * item.property.landLength} m²)</div>
                  <div>Bangunan: {item.property.buildingArea} m²</div>
                </td>
              ))}
            </tr>

            {/* Fasilitas Rumah */}
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>KT / KM / Carport</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  <div>Kamar Tidur: <strong>{item.property.bedrooms || '-'}</strong></div>
                  <div>Kamar Mandi: <strong>{item.property.bathrooms || '-'}</strong></div>
                  <div>Carport: <strong>{item.property.carport ? (item.property.carport.toLowerCase().includes('mobil') ? item.property.carport : `${item.property.carport} Mobil`) : '-'}</strong></div>
                </td>
              ))}
            </tr>

            {/* Marketing PIC */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Kontak PIC Pemasaran</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {item.property.picName ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.property.picName}</div>
                      {item.property.picPhone && (
                        <a href={`tel:${item.property.picPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                          {item.property.picPhone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Belum diisi</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Notes */}
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Catatan Unit</td>
              {comparedData.map(item => (
                <td 
                  key={item.property.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderLeft: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    background: selectedPropertyId === item.property.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  {item.property.notes || '-'}
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>

      {/* 2. BANK COMPARISON SECTION */}
      {activeProp && (
        <div style={{ borderTop: '2px dashed var(--border-color)', marginTop: '24px', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Perbandingan Penawaran Bank KPR</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Simulasi perbandingan skema bank KPR untuk properti aktif (<strong>{activeProp.name}</strong>) berdasarkan harga dan DP saat ini.
            </p>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Bank & Skema</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Detail Bunga</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Cicilan Awal</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Cicilan Floating / Akhir</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Modal Awal (DP + Akad)</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Bunga</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Operasi</th>
                </tr>
              </thead>
              <tbody>
                {bankSchemes.map(scheme => {
                  const schemeUpfrontCosts = {
                    useBphtbAuto: upfrontCosts.useBphtbAuto,
                    bphtbNpoptkp: upfrontCosts.bphtbNpoptkp,
                    customFees: upfrontCosts.customFees,
                  };
                  
                  const calc = calculateKpr(
                    activeProp.price,
                    activeProp.dpAmount,
                    scheme,
                    schemeUpfrontCosts,
                    {},
                    activeProp.discount || 0,
                    activeProp.bookingFee || 0
                  );

                  const isSelected = scheme.id === selectedBankSchemeId;
                  const isLowestInitial = calc.monthlyInstallmentInitial === minInitialVal;
                  const isLowestFloating = calc.monthlyInstallmentFloating === minFloatingVal;
                  const isLowestInterest = calc.totalInterest === minInterestVal;
                  const isLowestUpfront = calc.totalCashNeeded === minUpfrontVal;

                  return (
                    <tr 
                      key={scheme.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        background: isSelected ? 'var(--primary-light)' : 'transparent',
                        transition: 'background-color var(--transition-fast)'
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: isSelected ? 'var(--primary)' : 'var(--bg-tertiary)',
                            color: isSelected ? '#fff' : 'var(--text-primary)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.8rem'
                          }}>
                            {scheme.bankName.charAt(0) || 'B'}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{scheme.bankName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {scheme.schemeName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        <div>
                          {scheme.interestScheme === 'fixed' 
                            ? `${scheme.fixedRate}% Fixed (${scheme.fixedYears} Thn)` 
                            : `${scheme.tieredTiers.map(t => `${t.rate}% (${t.durationYears}th)`).join(' → ')}`
                          }
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {scheme.interestScheme === 'fixed' ? `Floating: ${scheme.floatingRate}% | ` : ''}Tenor: {scheme.tenorYears} Thn
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {formatRupiah(calc.monthlyInstallmentInitial)}
                          {isLowestInitial && (
                            <span 
                              style={{ 
                                fontSize: '0.65rem', 
                                backgroundColor: 'var(--success-light)', 
                                color: 'var(--success)', 
                                padding: '2px 4px', 
                                borderRadius: '4px',
                                fontWeight: 700
                              }}
                              title="Cicilan Awal Terendah"
                            >
                              Terendah
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        <div style={{ color: scheme.interestScheme === 'tiered' ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {formatRupiah(calc.monthlyInstallmentFloating)}
                          {scheme.interestScheme === 'tiered' ? (
                            <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 4px', borderRadius: '4px', fontWeight: 700 }}>
                              Fixed Akhir
                            </span>
                          ) : (
                            isLowestFloating && (
                              <span 
                                style={{ 
                                  fontSize: '0.65rem', 
                                  backgroundColor: 'var(--success-light)', 
                                  color: 'var(--success)', 
                                  padding: '2px 4px', 
                                  borderRadius: '4px',
                                  fontWeight: 700
                                }}
                                title="Cicilan Floating Terendah"
                              >
                                Terendah
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {formatRupiah(calc.totalCashNeeded)}
                          {isLowestUpfront && (
                            <span 
                              style={{ 
                                fontSize: '0.65rem', 
                                backgroundColor: 'rgba(52, 211, 153, 0.15)', 
                                color: 'var(--success)', 
                                padding: '2px 4px', 
                                borderRadius: '4px',
                                fontWeight: 700
                              }}
                              title="Modal Pertama Terendah"
                            >
                              Termurah
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {formatRupiah(calc.totalInterest)}
                          {isLowestInterest && (
                            <span 
                              style={{ 
                                fontSize: '0.65rem', 
                                backgroundColor: 'var(--success-light)', 
                                color: 'var(--success)', 
                                padding: '2px 4px', 
                                borderRadius: '4px',
                                fontWeight: 700
                              }}
                              title="Akumulasi Bunga Terendah"
                            >
                              Terhemat
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          type="button"
                          className={isSelected ? 'btn btn-primary' : 'btn btn-secondary'}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => onSelectBankScheme(scheme.id)}
                          disabled={isSelected}
                        >
                          {isSelected ? 'Aktif' : 'Pilih Bank'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPR Scenario Simulation Section */}
      {selectedPropertyId && properties.find(p => p.id === selectedPropertyId) && (() => {
        const activeProp = properties.find(p => p.id === selectedPropertyId)!;
        
        const handleScenarioChange = (idx: number, field: 'dpPercent' | 'tenorYears', val: number) => {
          const updated = scenarios.map((sc, i) => {
            if (i === idx) {
              return { ...sc, [field]: val };
            }
            return sc;
          });
          onUpdateScenarios(updated);
        };

        const scenarioResults = scenarios.map(sc => {
          const scenarioDpAmount = Math.round((sc.dpPercent / 100) * activeProp.price);
          const scenarioInputs: KprInputs = {
            ...inputs,
            tenorYears: sc.tenorYears
          };
          const calc = calculateKpr(
            activeProp.price,
            scenarioDpAmount,
            scenarioInputs,
            upfrontCosts,
            {},
            activeProp.discount || 0,
            activeProp.bookingFee || 0
          );
          return {
            dpPercent: sc.dpPercent,
            dpAmount: scenarioDpAmount,
            tenorYears: sc.tenorYears,
            calc
          };
        });

        return (
          <div style={{ borderTop: '2px dashed var(--border-color)', marginTop: '40px', paddingTop: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Simulasi Skenario DP & Tenor KPR</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                Bandingkan skema keuangan untuk rumah aktif (<strong>{activeProp.name}</strong>) berdasarkan 3 skenario DP dan jangka waktu tenor.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid-3">
              {scenarios.map((sc, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Skenario {String.fromCharCode(65 + idx)}</strong>
                  <div className="grid-2">
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>DP (%)</label>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="input-field input-field-suffixed"
                          style={{ padding: '8px 30px 8px 12px', fontSize: '0.85rem' }}
                          value={sc.dpPercent || ''}
                          onChange={(e) => handleScenarioChange(idx, 'dpPercent', parseInt(e.target.value, 10) || 0)}
                        />
                        <span className="input-suffix" style={{ right: '8px', fontSize: '0.8rem' }}>%</span>
                      </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>Tenor (Thn)</label>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          className="input-field input-field-suffixed"
                          style={{ padding: '8px 30px 8px 12px', fontSize: '0.85rem' }}
                          value={sc.tenorYears || ''}
                          onChange={(e) => handleScenarioChange(idx, 'tenorYears', parseInt(e.target.value, 10) || 0)}
                        />
                        <span className="input-suffix" style={{ right: '8px', fontSize: '0.8rem' }}>Thn</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Uang Muka: <strong>{formatRupiah(Math.round((sc.dpPercent / 100) * activeProp.price))}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Scenarios Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, width: '220px' }}>Parameter Simulasi</th>
                    {scenarioResults.map((_, idx) => (
                      <th key={idx} style={{ padding: '12px 16px', borderLeft: '1px solid var(--border-color)', width: '25%' }}>
                        Skenario {String.fromCharCode(65 + idx)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Setting [DP % / Tenor]</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)' }}>
                        <strong>DP {res.dpPercent}%</strong>, Tenor <strong>{res.tenorYears} Tahun</strong>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nominal Uang Muka (DP)</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)', color: 'var(--success)', fontWeight: 500 }}>
                        {formatRupiah(res.dpAmount)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Booking Fee (Tanda Jadi)</td>
                    {scenarioResults.map((_, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {formatRupiah(activeProp.bookingFee || 0)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sisa DP di Akad</td>
                    {scenarioResults.map((res, idx) => {
                      const sisaDp = Math.max(0, res.dpAmount - (activeProp.bookingFee || 0));
                      return (
                        <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {formatRupiah(sisaDp)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Plafond KPR (Pinjaman)</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)' }}>
                        {formatRupiah(res.calc.plafond)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Angsuran Awal (Fixed)</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatRupiah(res.calc.monthlyInstallmentInitial)} / bln
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {inputs.interestScheme === 'tiered' ? 'Angsuran Akhir (Fixed)' : 'Estimasi Angsuran Floating'}
                    </td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ 
                        padding: '10px 16px', 
                        borderLeft: '1px solid var(--border-color)', 
                        fontWeight: 700, 
                        color: inputs.interestScheme === 'tiered' ? 'var(--text-primary)' : 'var(--error)' 
                      }}>
                        {formatRupiah(res.calc.monthlyInstallmentFloating)} / bln
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Biaya Akad & Pajak</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)' }}>
                        {formatRupiah(res.calc.upfrontCostsTotal)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--success-light)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--success)' }}>Modal Pertama (DP + Akad)</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)', fontWeight: 800, color: 'var(--success)' }}>
                        {formatRupiah(res.calc.totalCashNeeded)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Bunga Selama Tenor</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)' }}>
                        {formatRupiah(res.calc.totalInterest)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Pembayaran KPR</td>
                    {scenarioResults.map((res, idx) => (
                      <td key={idx} style={{ padding: '10px 16px', borderLeft: '1px solid var(--border-color)', fontWeight: 600 }}>
                        {formatRupiah(res.calc.totalPayment)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
