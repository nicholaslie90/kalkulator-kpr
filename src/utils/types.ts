export interface PropertyProfile {
  id: string;
  name: string;
  developer: string;
  picName: string;
  picPhone: string;
  houseType: string; // e.g., "Tipe 36/72"
  landWidth: number; // meters
  landLength: number; // meters
  buildingArea: number; // m²
  bedrooms: string; // e.g. "3+1"
  bathrooms: string; // e.g. "2+1"
  carport: string; // e.g. "2 mobil"
  price: number; // Rp
  discount: number; // Rp
  discountPercent: number; // %
  dpPercent: number; // %
  dpAmount: number; // Rp
  notes: string;
  bookingFee?: number; // Rp
  createdAt: number;
}

export interface InterestTier {
  id: string;
  rate: number; // % per year
  durationYears: number; // years
}

export type CalculationType = 'annuity' | 'effective' | 'flat';
export type InterestScheme = 'fixed' | 'tiered';
export type ExtraPaymentMode = 'reduce_tenor' | 'reduce_installment';

export interface KprInputs {
  tenorYears: number;
  calculationType: CalculationType;
  interestScheme: InterestScheme;
  fixedRate: number; // used if scheme is 'fixed'
  fixedYears: number; // used if scheme is 'fixed'
  tieredTiers: InterestTier[]; // used if scheme is 'tiered'
  floatingRate: number;
  startDate: string; // "YYYY-MM"
  extraPaymentMode?: ExtraPaymentMode;
}

export interface BankScheme extends KprInputs {
  id: string;
  bankName: string;
  schemeName: string;
  provisiPercent: number; // Default 1%
  adminFee: number; // Default Rp 1,000,000
  appraisalFee: number; // Default Rp 1,500,000
  notarisPercent: number; // Default 1.5%
  asuransiPercent: number; // Default 1%
}

export interface CustomFee {
  id: string;
  name: string;
  amount: number;
}

export interface UpfrontCosts {
  useBphtbAuto: boolean;
  bphtbNpoptkp: number; // Default Rp 60,000,000
  customFees: CustomFee[];

  // Biaya transaksi jual-beli / notaris (semua optional → backward-compatible)
  transactionValue?: number; // Nilai Transaksi; default = harga net (price - discount)
  sellerTaxPercent?: number; // Pajak Penjual % (default 2.5) — info, tidak masuk total pembeli
  ppjbFee?: number; // Pengikatan Jual Beli (PPJB)
  skptFee?: number; // Pengecekan SKPT
  ajbFee?: number; // Akta Jual Beli (AJB)
  balikNamaFee?: number; // Balik Nama (BBN)
  pnbpFee?: number; // PNBP
  cekSertifikatFee?: number; // Cek sertifikat, validasi & cek zona
  validasiPajakFee?: number; // Validasi Pajak Pembeli
  renovasiFee?: number; // Biaya Renovasi
}

export interface SplitConfig {
  mode: 'auto' | 'fixed'; // 'auto' = anuitas/efektif/flat; 'fixed' = rasio bunga:pokok tetap
  interestRatio: number; // % dari cicilan yang dialokasikan ke bunga (mis. 80 → 80:20)
}

export interface AmortizationRow {
  monthNumber: number;
  dateStr: string;
  interestRate: number;
  label: string; // e.g., "Fixed 1", "Floating", etc.
  installment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  extraPayment: number;
}

export interface CalculationSummary {
  plafond: number;
  totalInterest: number;
  totalPayment: number;
  upfrontCostsTotal: number;
  totalCashNeeded: number; // DP + Upfront costs
  monthlyInstallmentInitial: number;
  monthlyInstallmentFloating: number;
  amortizationSchedule: AmortizationRow[];
}

export interface KprScenario {
  dpPercent: number;
  tenorYears: number;
}
