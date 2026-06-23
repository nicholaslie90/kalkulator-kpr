import React, { useState } from 'react';
import type { PropertyProfile } from '../utils/types';
import { formatRupiah } from '../utils/formatters';
import { CurrencyInput } from './CurrencyInput';
import { Plus, Trash2, Edit2, User, Phone, Building, ArrowRight, Info, Bed, Bath, Car, Copy } from 'lucide-react';

interface PropertyManagerProps {
  properties: PropertyProfile[];
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  onAddProperty: (property: PropertyProfile) => void;
  onUpdateProperty: (property: PropertyProfile) => void;
  onDeleteProperty: (id: string) => void;
}

export const PropertyManager: React.FC<PropertyManagerProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [houseType, setHouseType] = useState('');
  const [landWidth, setLandWidth] = useState(6);
  const [landLength, setLandLength] = useState(12);
  const [buildingArea, setBuildingArea] = useState(36);
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('1');
  const [carport, setCarport] = useState('1');
  const [price, setPrice] = useState(500000000);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dpPercent, setDpPercent] = useState(10);
  const [bookingFee, setBookingFee] = useState(0);
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setDeveloper('');
    setPicName('');
    setPicPhone('');
    setHouseType('');
    setLandWidth(6);
    setLandLength(12);
    setBuildingArea(36);
    setBedrooms('2');
    setBathrooms('1');
    setCarport('1');
    setPrice(500000000);
    setDiscountPercent(0);
    setDiscount(0);
    setDpPercent(10);
    setBookingFee(0);
    setNotes('');
    setEditId(null);
    setIsEditing(false);
  };

  const handleDuplicate = (property: PropertyProfile) => {
    const duplicated: PropertyProfile = {
      ...property,
      id: 'prop-' + Date.now(),
      name: `${property.name} (Copy)`,
      createdAt: Date.now()
    };
    onAddProperty(duplicated);
  };

  const handleEdit = (p: PropertyProfile) => {
    setEditId(p.id);
    setName(p.name);
    setDeveloper(p.developer);
    setPicName(p.picName);
    setPicPhone(p.picPhone);
    setHouseType(p.houseType);
    setLandWidth(p.landWidth);
    setLandLength(p.landLength);
    setBuildingArea(p.buildingArea);
    setBedrooms(p.bedrooms || '');
    setBathrooms(p.bathrooms || '');
    setCarport(p.carport || '');
    setPrice(p.price);
    setDiscountPercent(p.discountPercent || 0);
    setDiscount(p.discount || 0);
    setDpPercent(p.dpPercent);
    setBookingFee(p.bookingFee || 0);
    setNotes(p.notes);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) return;

    const netPrice = Math.max(0, price - discount);
    const dpAmount = Math.round((dpPercent / 100) * netPrice);

    const data: PropertyProfile = {
      id: editId || Date.now().toString(),
      name,
      developer,
      picName,
      picPhone,
      houseType,
      landWidth,
      landLength,
      buildingArea,
      bedrooms,
      bathrooms,
      carport,
      price,
      discount,
      discountPercent,
      dpPercent,
      dpAmount,
      bookingFee,
      notes,
      createdAt: editId ? (properties.find(p => p.id === editId)?.createdAt || Date.now()) : Date.now(),
    };

    if (editId) {
      onUpdateProperty(data);
    } else {
      onAddProperty(data);
    }
    resetForm();
  };

  const handlePriceChange = (val: string) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
    const newPrice = isNaN(parsed) ? 0 : parsed;
    setPrice(newPrice);
    
    // Recalculate discount nominal based on discount percent
    const newDiscount = Math.round((discountPercent / 100) * newPrice);
    setDiscount(newDiscount);
  };

  const handleDiscountPercentChange = (val: number) => {
    setDiscountPercent(val);
    const newDiscount = Math.round((val / 100) * price);
    setDiscount(newDiscount);
  };

  const handleDiscountChange = (val: string) => {
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
    const newDiscount = isNaN(parsed) ? 0 : parsed;
    setDiscount(newDiscount);
    const newPercent = price > 0 ? (newDiscount / price) * 100 : 0;
    setDiscountPercent(Number(newPercent.toFixed(2)));
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Toggle Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daftar Rumah & Properti</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Simpan beberapa pilihan properti dan bandingkan skema KPR-nya.
          </p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <Plus size={18} /> Tambah Properti Baru
          </button>
        )}
      </div>

      {/* Property Form */}
      {isEditing && (
        <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 600 }}>
            {editId ? 'Edit Properti' : 'Tambah Properti Baru'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Nama Identitas Properti *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Cluster Sakura - Kavling A-12"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Developer / Pengembang</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Ciputra Group"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label className="input-label">Tipe Rumah</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Tipe 36/72"
                  value={houseType}
                  onChange={(e) => setHouseType(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Dimensi Tanah (LxP meter)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="input-field"
                    style={{ textAlign: 'center' }}
                    min="1"
                    value={landWidth || ''}
                    onChange={(e) => setLandWidth(parseInt(e.target.value, 10) || 0)}
                  />
                  <span>x</span>
                  <input
                    type="number"
                    className="input-field"
                    style={{ textAlign: 'center' }}
                    min="1"
                    value={landLength || ''}
                    onChange={(e) => setLandLength(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Luas Tanah: {landWidth * landLength} m²
                </span>
              </div>
              <div className="input-group">
                <label className="input-label">Luas Bangunan (m²)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    className="input-field input-field-suffixed"
                    min="1"
                    value={buildingArea || ''}
                    onChange={(e) => setBuildingArea(parseInt(e.target.value, 10) || 0)}
                  />
                  <span className="input-suffix">m²</span>
                </div>
              </div>
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label className="input-label">Kamar Tidur (KT)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: 3+1 atau 2"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Kamar Mandi (KM)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: 2+1 atau 1"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Kapasitas Carport (Mobil)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: 2 mobil atau 1"
                  value={carport}
                  onChange={(e) => setCarport(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">PIC Pemasaran / Kontak Agen</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nama PIC/Marketing"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Nomor Telepon PIC</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: 08123456789"
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Harga Rumah (Rp) *</label>
                <div className="input-wrapper">
                  <span className="input-prefix">Rp</span>
                  <CurrencyInput
                    className="input-field input-field-prefixed"
                    placeholder="Harga Jual"
                    value={price}
                    onValueChange={(n) => handlePriceChange(String(n))}
                    required
                  />
                </div>
              </div>
              
              <div className="input-group">
                <label className="input-label">Diskon Rumah (%) / (Rp)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="input-wrapper" style={{ flex: 1 }}>
                    <input
                      type="number"
                      className="input-field input-field-suffixed"
                      placeholder="%"
                      min="0"
                      max="100"
                      value={discountPercent || ''}
                      onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                  <div className="input-wrapper" style={{ flex: 2 }}>
                    <span className="input-prefix">Rp</span>
                    <CurrencyInput
                      className="input-field input-field-prefixed"
                      placeholder="Nominal"
                      value={discount}
                      onValueChange={(n) => handleDiscountChange(String(n))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Down Payment (DP)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div className="input-wrapper" style={{ flex: 1.2 }}>
                    <input
                      type="number"
                      className="input-field input-field-suffixed"
                      min="0"
                      max="100"
                      value={dpPercent || ''}
                      onChange={(e) => setDpPercent(parseInt(e.target.value, 10) || 0)}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                  <div style={{ flex: 1.8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatRupiah(Math.round((dpPercent / 100) * (price - discount)))}
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  * Dihitung dari harga bersih: {formatRupiah(Math.max(0, price - discount))}
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Booking Fee (Uang Tanda Jadi) (Rp)</label>
                <div className="input-wrapper">
                  <span className="input-prefix">Rp</span>
                  <CurrencyInput
                    className="input-field input-field-prefixed"
                    placeholder="Contoh: 5.000.000"
                    value={bookingFee}
                    onValueChange={(n) => setBookingFee(n)}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  * Mengurangi DP Akad menjadi: <strong>{formatRupiah(Math.max(0, Math.round((dpPercent / 100) * (price - discount)) - bookingFee))}</strong>
                </span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Catatan Tambahan</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Catatan mengenai unit ini (contoh: bonus kanopi, biaya IPL, arah hadap rumah, dll.)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary">
                {editId ? 'Simpan Perubahan' : 'Simpan Properti'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Property Cards List */}
      <div className="grid-2">
        {properties.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Info size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            <p style={{ fontWeight: 600 }}>Belum ada properti terdaftar</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Tambahkan rumah impian Anda terlebih dahulu untuk memulai perhitungan simulasi KPR.
            </p>
          </div>
        ) : (
          properties.map((p) => {
            const isSelected = selectedPropertyId === p.id;
            return (
              <div 
                key={p.id} 
                className="glass-panel animate-fade-in" 
                style={{ 
                  padding: '20px', 
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                  boxShadow: isSelected ? '0 0 20px var(--primary-glow)' : 'var(--card-shadow)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</h4>
                      {p.developer && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                          <Building size={14} /> <span>{p.developer}</span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span className="badge badge-primary">Aktif di Kalkulator</span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Tipe: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.houseType || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Tanah: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.landWidth}x{p.landLength} m² ({p.landWidth * p.landLength} m²)</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Bangunan: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{p.buildingArea} m²</strong>
                    </div>
                    <div>
                     <span style={{ color: 'var(--text-muted)' }}>Plafond KPR: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(p.price - p.dpAmount - (p.discount || 0))}</strong>
                    </div>
                  </div>

                  {/* Property Specs KT/KM/Carport */}
                  {(p.bedrooms || p.bathrooms || p.carport) && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      {p.bedrooms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <Bed size={14} style={{ color: 'var(--text-muted)' }} /> <span>{p.bedrooms} KT</span>
                        </div>
                      )}
                      {p.bathrooms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <Bath size={14} style={{ color: 'var(--text-muted)' }} /> <span>{p.bathrooms} KM</span>
                        </div>
                      )}
                      {p.carport && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <Car size={14} style={{ color: 'var(--text-muted)' }} /> <span>{p.carport.toLowerCase().includes('mobil') ? p.carport : `${p.carport} Mobil`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Harga Properti</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{formatRupiah(p.price)}</strong>
                    </div>
                    {p.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px', color: 'var(--error)' }}>
                        <span>Diskon Rumah</span>
                        <strong>-{formatRupiah(p.discount)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>DP ({p.dpPercent}%)</span>
                      <strong style={{ color: 'var(--success)' }}>{formatRupiah(p.dpAmount)}</strong>
                    </div>
                    {p.bookingFee && p.bookingFee > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Booking Fee</span>
                          <strong style={{ color: 'var(--primary)' }}>{formatRupiah(p.bookingFee)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Sisa DP Akad</span>
                          <strong style={{ color: 'var(--success)' }}>{formatRupiah(Math.max(0, p.dpAmount - p.bookingFee))}</strong>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* PIC Details Box */}
                  {(p.picName || p.picPhone) && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                      {p.picName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <User size={14} className="text-muted" />
                          <span>PIC: <strong>{p.picName}</strong></span>
                        </div>
                      )}
                      {p.picPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <Phone size={14} className="text-muted" />
                          <a href={`tel:${p.picPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                            {p.picPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {p.notes && (
                    <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                      Note: {p.notes}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => handleEdit(p)} title="Edit Properti">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '8px', color: 'var(--primary)' }} onClick={() => handleDuplicate(p)} title="Duplikat Properti">
                      <Copy size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '8px', color: 'var(--error)' }} onClick={() => onDeleteProperty(p.id)} title="Hapus Properti">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {!isSelected && (
                    <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={() => onSelectProperty(p.id)}>
                      Pilih & Hitung KPR <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
