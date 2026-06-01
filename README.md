# 🏠 KPR Smart Dashboard — Kalkulator KPR Indonesia

Dashboard premium untuk simulasi dan perbandingan Kredit Pemilikan Rumah (KPR) yang disesuaikan sepenuhnya dengan skema perbankan di Indonesia.

Dibangun dengan **Vite + React + TypeScript** dan desain modern dark-mode dengan efek glassmorphic.

![Built with](https://img.shields.io/badge/Built%20with-React%20%2B%20TypeScript-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Bundler-Vite-purple?style=flat-square)
![License](https://img.shields.io/badge/License-Private-red?style=flat-square)

---

## ✨ Fitur Utama

### 📊 Skema & Bunga Multi-Bank
- Kelola beberapa penawaran bank KPR secara bersamaan (BCA, Mandiri, BTN, dll.)
- **Fixed Biasa** atau **Fixed Berjenjang (Tiered Promo)** — bunga fixed bertahap yang realistis
- Tipe perhitungan: Anuitas, Efektif, dan Flat
- **Drag & Drop** untuk menyusun ulang urutan penawaran bank
- Validasi otomatis jika total tahun jenjang bunga melebihi tenor

### 🏡 Kelola Properti
- Tambah, edit, hapus, dan **duplikat** profil properti dengan cepat
- Data lengkap: harga, diskon, DP, Booking Fee, tipe rumah, dimensi tanah/bangunan, developer, PIC agen
- Dropdown properti aktif menampilkan dimensi luas tanah (e.g. "Philo 7x14")

### 💰 Biaya Akad & Pajak
- Hitung otomatis: Provisi, Administrasi, Appraisal, Notaris/APHT, Asuransi KPR
- Kalkulator pajak **BPHTB** dengan NPOPTKP daerah yang dapat diubah
- Tambahkan biaya kustom (Booking Fee, Renovasi, dll.)
- Visualisasi **Donut Chart** SVG untuk breakdown biaya

### 📅 Kalender Cicilan (Amortisasi)
- Tabel amortisasi lengkap dengan nama bulan nyata (Juli 2026, Agustus 2026, ...)
- **Pemilih Skema Bank** interaktif — bandingkan kalender antar bank secara instan
- Notifikasi visual saat bunga naik/transisi periode
- **Simulasi Pelunasan Ekstra** — tambahkan pembayaran tambahan di bulan mana saja
- **Ringkasan per Periode Bunga**: total angsuran, rata-rata cicilan, dan jumlah pelunasan ekstra

### ⚖️ Bandingkan Pilihan (Side-by-Side)
- Perbandingan semua properti secara berdampingan
- Dimensi luas tanah di header kolom untuk perbandingan fisik unit
- Detail: Harga, DP, Booking Fee, Sisa DP di Akad, Plafond, Angsuran, Modal Awal
- Perbandingan penawaran bank dengan **badge otomatis** (Cicilan Terendah, Bunga Terhemat, dll.)
- Simulasi skenario DP/Tenor

### 💾 Persistensi Data & Sinkronisasi Git
- Database client-side **IndexedDB** + cadangan **localStorage**
- **Export/Import JSON** — simpan state database ke file `kpr-seed.json`
- **Auto-seed** saat clone di laptop baru: data otomatis ter-load dari `public/kpr-seed.json`
- Cocok untuk private repository — data KPR aman tersimpan di Git

---

## 🚀 Quick Start

### Install & Jalankan
```bash
git clone https://github.com/nicholaslie90/kalkulator-kpr.git
cd kalkulator-kpr
npm install
npm run dev
```

Buka **http://localhost:5173/** di browser.

### Build Production
```bash
npm run build
npm run preview
```

---

## 💾 Sinkronisasi Data via Git

Aplikasi ini menggunakan **IndexedDB** sebagai database lokal di browser. Karena IndexedDB tidak bisa langsung di-push ke Git, disediakan mekanisme **Export/Import JSON**:

### Workflow Sinkronisasi

```
┌──────────────────────────────────────────────────────────────┐
│  1. Edit data di browser (properti, bank, cicilan, dll.)     │
│  2. Klik tombol ⬇ Export di header kanan atas                │
│  3. Simpan file "kpr-seed.json" ke folder public/            │
│  4. git add, commit, push                                    │
│  5. Di laptop lain: git clone/pull → npm install → npm run dev│
│  6. Data otomatis ter-load dari kpr-seed.json! ✅            │
└──────────────────────────────────────────────────────────────┘
```

### Detail Langkah

1. **Export Data**: Klik tombol ⬇️ (Download) di header → file `kpr-seed.json` ter-download
2. **Simpan ke Project**: Pindahkan/replace file tersebut ke `public/kpr-seed.json`
3. **Commit & Push**:
   ```bash
   cp ~/Downloads/kpr-seed.json public/kpr-seed.json
   git add -A
   git commit -m "update: sync kpr data"
   git push
   ```
4. **Clone di Laptop Lain**: Saat pertama kali buka di browser baru (tanpa data IndexedDB/localStorage), aplikasi akan otomatis fetch `kpr-seed.json` dan meng-import seluruh data.

### Import Manual
Klik tombol ⬆️ (Upload) di header untuk meng-import file JSON secara manual kapan saja.

---

## 🛠️ Tech Stack

| Teknologi | Penggunaan |
|-----------|------------|
| **Vite** | Build tool & dev server |
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vanilla CSS** | Styling dengan design system premium |
| **IndexedDB** | Database lokal browser |
| **Lucide React** | Icon library |
| **SVG Charts** | Visualisasi donut & area chart kustom |

---

## 📁 Struktur Project

```
kalkulator-kpr/
├── public/
│   ├── favicon.svg
│   └── kpr-seed.json          # 💾 Data snapshot untuk sinkronisasi Git
├── src/
│   ├── components/
│   │   ├── AmortizationCalendar.tsx   # Kalender cicilan & pelunasan ekstra
│   │   ├── KprCalculatorForm.tsx      # Form skema bunga & multi-bank
│   │   ├── KprCharts.tsx              # SVG donut & area chart
│   │   ├── PropertyComparison.tsx     # Perbandingan side-by-side
│   │   ├── PropertyManager.tsx        # CRUD profil properti
│   │   └── UpfrontCostsForm.tsx       # Biaya akad, pajak, BPHTB
│   ├── utils/
│   │   ├── formatters.ts             # Format Rupiah & tanggal Indonesia
│   │   ├── kprCalculations.ts        # Logika kalkulasi anuitas/flat/efektif
│   │   ├── localDb.ts                # IndexedDB wrapper + export/import
│   │   └── types.ts                  # TypeScript type definitions
│   ├── App.tsx                        # Root component & state management
│   ├── index.css                      # Design system CSS (dark/light)
│   └── main.tsx                       # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📝 Catatan

- Ini adalah **private repository** untuk keperluan pribadi
- Data properti dan simulasi KPR tersimpan aman di browser lokal
- Gunakan fitur Export/Import untuk memindahkan data antar perangkat via Git
- Aplikasi berjalan sepenuhnya di client-side, **tidak ada server/backend**

---

<p align="center">
  <strong>KPR Smart Dashboard</strong> © 2026<br/>
  Didesain untuk Skema KPR Perbankan Indonesia 🇮🇩
</p>
