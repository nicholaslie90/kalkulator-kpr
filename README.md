# 🏠 KPR Smart Dashboard — Kalkulator KPR Indonesia

Dashboard premium untuk simulasi dan perbandingan Kredit Pemilikan Rumah (KPR) yang disesuaikan sepenuhnya dengan skema perbankan di Indonesia.

Dibangun dengan **Vite + React + TypeScript** dan desain modern dark-mode dengan efek glassmorphic.

![Built with](https://img.shields.io/badge/Built%20with-React%20%2B%20TypeScript-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Bundler-Vite-purple?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-222?style=flat-square)

> 🌐 **Live:** `https://<username>.github.io/kalkulator-kpr/` — berjalan sepenuhnya di browser, tanpa server. Semua data tersimpan **lokal di browser Anda** (IndexedDB), tidak pernah dikirim ke mana pun.

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

### 💾 Persistensi Data (Local-First)
- Database client-side **IndexedDB** + cadangan **localStorage**
- Data **hanya tersimpan di browser Anda** — tidak ada server, tidak ada cloud, tidak ada yang dikirim keluar
- **Export/Import JSON** — unduh seluruh state ke satu file dan impor kembali untuk berpindah perangkat/browser
- Saat pertama dibuka, aplikasi menampilkan **data contoh bawaan** sebagai titik awal; ganti dengan data Anda sendiri

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

## 🚀 Deploy ke GitHub Pages

Aplikasi ini di-deploy otomatis ke **GitHub Pages** lewat GitHub Actions.

### Setup (sekali saja)

1. Pastikan repository ini **publik** (GitHub Pages gratis hanya untuk repo publik; repo privat butuh GitHub Pro/Team/Enterprise). Karena aplikasi mulai dengan data kosong/contoh, **tidak ada data pribadi yang terekspos** di URL publik.
2. Buka **Settings → Pages → Build and deployment → Source** dan pilih **GitHub Actions**.
3. Push ke branch `main`. Workflow `.github/workflows/deploy.yml` akan build dan publish secara otomatis.
4. Situs tersedia di `https://<username>.github.io/kalkulator-kpr/`.

> ⚙️ **Catatan base path:** `vite.config.ts` di-set `base: '/kalkulator-kpr/'` agar aset termuat dengan benar di sub-path Pages. Jika nama repo Anda berbeda, sesuaikan nilai `base` tersebut.

---

## 💾 Memindahkan Data Antar Perangkat

Karena data hanya hidup di browser (IndexedDB), gunakan **Export/Import JSON** untuk berpindah perangkat atau browser:

1. **Export**: Klik tombol ⬇️ (Download) di header → file `kpr-seed.json` ter-unduh berisi seluruh state Anda.
2. **Import**: Di perangkat/browser lain, buka aplikasi lalu klik tombol ⬆️ (Upload) dan pilih file tersebut.

File ekspor adalah cadangan pribadi Anda — simpan sendiri; **jangan** commit ke repo publik jika berisi data sensitif.

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
├── .github/workflows/
│   └── deploy.yml             # 🚀 Build & deploy ke GitHub Pages
├── public/
│   └── favicon.svg
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

- Data properti dan simulasi KPR tersimpan **hanya di browser lokal** (IndexedDB) — tidak pernah dikirim ke server
- Gunakan fitur **Export/Import JSON** untuk memindahkan data antar perangkat
- Aplikasi berjalan sepenuhnya di client-side, **tidak ada server/backend**
- Di-deploy sebagai situs statis di **GitHub Pages**

---

<p align="center">
  <strong>KPR Smart Dashboard</strong> © 2026<br/>
  Didesain untuk Skema KPR Perbankan Indonesia 🇮🇩
</p>
