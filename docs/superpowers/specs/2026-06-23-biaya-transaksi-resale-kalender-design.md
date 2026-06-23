# Design: Biaya Transaksi Jual-Beli, Kumulatif Biaya di Kalender & Caret-Preserving Price Input

Date: 2026-06-23

## Goal

1. Tambahkan 9 biaya transaksi jual-beli / notaris (dari catatan user) ke bagian **Biaya**.
2. Di **Kalender Cicilan**, tampilkan **jumlah biaya yang sudah keluar per bulan** (kumulatif) agar mudah menghitung resale value.
3. Saat mengedit **Harga Rumah** (dan input nominal lain), kursor tidak melompat ke akhir ketika diedit di tengah-tengah.

## The 9 transaction costs

| # | Item | Tipe |
|---|------|------|
| 1 | Pajak Penjual (Transaksi × 2.5%) | % — **info only, tidak masuk total pembeli** |
| 2 | Pajak Pembeli (Transaksi − pengurang) × 5% | % — reuse blok BPHTB yang ada |
| 3 | Pengikatan Jual Beli (PPJB) | Rp tetap (editable) |
| 4 | Pengecekan SKPT | Rp tetap (editable) |
| 5 | Akta Jual Beli (AJB) | Rp tetap (editable) |
| 6 | Balik Nama (BBN) | Rp tetap (editable) |
| 7 | PNBP | Rp tetap (editable) |
| 8 | Cek sertifikat, Validasi sertifikat & cek zona | Rp tetap (editable) |
| 9 | Validasi Pajak Pembeli | Rp tetap (editable) |

Items 3–9 **masuk** ke total biaya pembeli. Item 1 ditampilkan sebagai referensi (untuk resale-as-seller), **tidak** dijumlahkan.

## Decisions (confirmed with user)

- **Penempatan:** gabung ke panel biaya yang sudah ada (`UpfrontCostsForm`), sebagai subsection baru.
- **Nilai Transaksi:** field terpisah `transactionValue`, default = harga net (price − discount), editable. Menggerakkan Pajak Penjual & Pajak Pembeli.
- **Pajak Penjual:** info terpisah, tidak masuk total pembeli.
- **Kolom kalender:** total modal kumulatif = `initialOutflow + Σ(angsuran + pelunasan ekstra)` s/d bulan tsb, di mana `initialOutflow = dpAmount + upfrontCostsTotal`.

## Data model (`src/utils/types.ts`)

Extend `UpfrontCosts` — semua field **optional** (backward-compatible, default via `??`, tanpa migrasi):

```ts
transactionValue?: number;   // default = price - discount
sellerTaxPercent?: number;   // default 2.5
ppjbFee?: number;
skptFee?: number;
ajbFee?: number;
balikNamaFee?: number;
pnbpFee?: number;
cekSertifikatFee?: number;
validasiPajakFee?: number;
```

`useBphtbAuto` + `bphtbNpoptkp` (sudah ada) tetap dipakai sebagai Pajak Pembeli #2 — tidak ada duplikasi.

Default estimasi (di `DEFAULT_UPFRONT`): PPJB 1.000.000, SKPT 200.000, AJB 2.500.000, Balik Nama 2.000.000, PNBP 250.000, Cek Sertifikat 300.000, Validasi Pajak 200.000. `transactionValue` undefined → fallback ke harga net. `sellerTaxPercent` 2.5.

## Calculation (`src/utils/kprCalculations.ts`)

- Resolve `txValue = upfrontInputs.transactionValue ?? netPrice`.
- BPHTB (Pajak Pembeli) dihitung dari `txValue`: `max(0, (txValue − npoptkp) × 5%)`.
- `upfrontCostsTotal` += jumlah 7 fixed fees.
- Seller tax dihitung tapi **tidak** dimasukkan ke total.

## UI — `UpfrontCostsForm.tsx`

Subsection baru "Biaya Transaksi, Notaris & Balik Nama":
- Input **Nilai Transaksi** (default harga net).
- Kartu info **Pajak Penjual** 2.5% × transaksi + badge "Ditanggung Penjual — tidak masuk total".
- 7 input Rupiah untuk fee tetap (masuk total).
- Blok BPHTB di-relabel: formula `5% × (Transaksi − Pengurang)`, hint pengurang bisa diset 250jt.
- Kartu total existing otomatis ikut bertambah.

## Kalender — `AmortizationCalendar.tsx`

- Prop baru `initialOutflow: number`.
- Kolom baru **"Total Biaya Keluar"** (kumulatif) di table & card view.
- Caption resale: *"Resale ≈ Harga Jual − Pajak Penjual − Sisa Pokok; bandingkan dengan Total Biaya Keluar."*

## `App.tsx`

- Pass `initialOutflow={dpAmount + summary.upfrontCostsTotal}`.
- Update donut BPHTB pakai `transactionValue`, masukkan fixed fees ke "Biaya Lainnya".

## Caret-preserving currency input (`src/components/CurrencyInput.tsx`)

Komponen baru reusable: input teks ber-format `id-ID` yang mempertahankan posisi kursor saat edit di tengah. Mekanisme: hitung jumlah digit sebelum caret di nilai mentah → reformat → kembalikan caret setelah jumlah digit yang sama (via `useLayoutEffect`). Menampilkan string kosong saat nilai 0 (agar placeholder muncul, konsisten dgn "strip leading zeros").

Terapkan ke Harga Rumah, Diskon (Rp), Booking Fee di `PropertyManager`, dan input nominal di `UpfrontCostsForm` (admin, appraisal, NPOPTKP, custom fee, fixed fees baru).

## Out of scope

Simulator skenario resale penuh — kolom kumulatif + Sisa Pokok sudah cukup untuk hitung manual.
