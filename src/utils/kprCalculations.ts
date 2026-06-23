import type {
  KprInputs,
  UpfrontCosts,
  AmortizationRow,
  CalculationSummary,
  SplitConfig
} from './types';
import { formatMonthYear } from './formatters';

// Helper to get rate for a specific month (1-indexed)
export const getRateForMonth = (
  month: number,
  inputs: KprInputs
): { rate: number; label: string } => {
  const { interestScheme, fixedRate, fixedYears, tieredTiers, floatingRate } = inputs;

  if (interestScheme === 'fixed') {
    const fixedMonths = fixedYears * 12;
    if (month <= fixedMonths) {
      return { rate: fixedRate, label: `Fixed (Thn 1-${fixedYears})` };
    } else {
      return { rate: floatingRate, label: 'Floating' };
    }
  } else {
    // Tiered
    let accumulatedMonths = 0;
    for (let i = 0; i < tieredTiers.length; i++) {
      const tier = tieredTiers[i];
      const tierMonths = tier.durationYears * 12;
      const startMonth = accumulatedMonths + 1;
      const endMonth = accumulatedMonths + tierMonths;
      
      if (month >= startMonth && month <= endMonth) {
        const startYearLabel = Math.floor(accumulatedMonths / 12) + 1;
        const endYearLabel = Math.floor(endMonth / 12);
        return { 
          rate: tier.rate, 
          label: `Fixed Tier ${i + 1} (Thn ${startYearLabel}-${endYearLabel})` 
        };
      }
      accumulatedMonths += tierMonths;
    }
    
    if (tieredTiers.length > 0) {
      const lastTier = tieredTiers[tieredTiers.length - 1];
      return { 
        rate: lastTier.rate, 
        label: `Fixed Tier ${tieredTiers.length} (Lanjutan)` 
      };
    }
    return { rate: floatingRate, label: 'Floating' };
  }
};

export const calculateKpr = (
  price: number,
  dpAmount: number,
  inputs: KprInputs,
  upfrontInputs: UpfrontCosts,
  extraPayments: Record<number, number> = {}, // monthNumber -> amount
  discount: number = 0,
  bookingFee: number = 0,
  splitConfig: SplitConfig = { mode: 'auto', interestRatio: 80 }
): CalculationSummary => {
  const netPrice = Math.max(0, price - discount);
  const plafond = Math.max(0, netPrice - dpAmount);
  const tenorMonths = inputs.tenorYears * 12;
  const amortizationSchedule: AmortizationRow[] = [];
  const extraPaymentMode = inputs.extraPaymentMode || 'reduce_installment';
  
  let remainingBalance = plafond;
  let hypotheticalBalance = plafond;
  let totalInterest = 0;
  let totalPayment = 0;
  let monthlyInstallmentInitial = 0;
  let monthlyInstallmentFloating = 0;

  // Variables to track rate and base installment for hypothetical annuity
  let lastRateHypothetical = -1;
  let baseInstallmentHypothetical = 0;

  for (let m = 1; m <= tenorMonths; m++) {
    if (remainingBalance <= 0) break;

    const { rate: annualRate, label } = getRateForMonth(m, inputs);
    const monthlyRate = annualRate / 100 / 12;
    const remainingMonths = tenorMonths - m + 1;

    // 1. Calculate hypothetical row (no extra payments) to find standard scheduled installment
    let hypotheticalInstallment = 0;
    let hypotheticalPrincipal = 0;
    let hypotheticalInterest = 0;

    if (inputs.calculationType === 'annuity') {
      if (annualRate !== lastRateHypothetical) {
        lastRateHypothetical = annualRate;
        if (monthlyRate > 0) {
          baseInstallmentHypothetical = hypotheticalBalance * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                                       (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        } else {
          baseInstallmentHypothetical = hypotheticalBalance / remainingMonths;
        }
      }
      hypotheticalInterest = hypotheticalBalance * monthlyRate;
      hypotheticalInstallment = Math.min(baseInstallmentHypothetical, hypotheticalBalance + hypotheticalInterest);
      hypotheticalPrincipal = hypotheticalInstallment - hypotheticalInterest;
    } else if (inputs.calculationType === 'effective') {
      hypotheticalPrincipal = hypotheticalBalance / remainingMonths;
      hypotheticalInterest = hypotheticalBalance * monthlyRate;
      hypotheticalInstallment = hypotheticalPrincipal + hypotheticalInterest;
    } else {
      // Flat
      hypotheticalPrincipal = plafond / tenorMonths;
      hypotheticalInterest = plafond * monthlyRate;
      hypotheticalInstallment = hypotheticalPrincipal + hypotheticalInterest;
    }
    hypotheticalBalance = Math.max(0, hypotheticalBalance - hypotheticalPrincipal);

    // 2. Calculate actual row (with extra payments)
    let installment = 0;
    let interestPayment = 0;
    let principalPayment = 0;

    if (inputs.calculationType === 'annuity') {
      if (extraPaymentMode === 'reduce_installment') {
        // Recalculate base installment every month using actual remaining balance and original remaining tenor
        let currentBaseInstallment = 0;
        if (monthlyRate > 0) {
          currentBaseInstallment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                                   (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        } else {
          currentBaseInstallment = remainingBalance / remainingMonths;
        }
        interestPayment = remainingBalance * monthlyRate;
        installment = Math.min(currentBaseInstallment, remainingBalance + interestPayment);
        principalPayment = installment - interestPayment;
      } else {
        // reduce_tenor: keep the hypothetical scheduled installment amount
        interestPayment = remainingBalance * monthlyRate;
        installment = Math.min(hypotheticalInstallment, remainingBalance + interestPayment);
        principalPayment = installment - interestPayment;
      }
    } else if (inputs.calculationType === 'effective') {
      if (extraPaymentMode === 'reduce_installment') {
        const basePrincipal = remainingBalance / remainingMonths;
        interestPayment = remainingBalance * monthlyRate;
        installment = basePrincipal + interestPayment;
        principalPayment = basePrincipal;
      } else {
        // reduce_tenor: keep the hypothetical principal payment amount
        principalPayment = Math.min(hypotheticalPrincipal, remainingBalance);
        interestPayment = remainingBalance * monthlyRate;
        installment = principalPayment + interestPayment;
      }
    } else {
      // Flat
      if (extraPaymentMode === 'reduce_installment') {
        const basePrincipal = remainingBalance / remainingMonths;
        interestPayment = remainingBalance * monthlyRate;
        installment = basePrincipal + interestPayment;
        principalPayment = basePrincipal;
      } else {
        // reduce_tenor: keep the hypothetical principal payment amount
        principalPayment = Math.min(hypotheticalPrincipal, remainingBalance);
        interestPayment = remainingBalance > 0 ? (plafond * monthlyRate) : 0;
        installment = principalPayment + interestPayment;
      }
    }

    // Override alokasi bunga:pokok dengan rasio tetap (mis. 80:20) bila diaktifkan.
    // Nilai cicilan tetap; hanya proporsi bunga vs pokok yang dipaksa.
    if (splitConfig.mode === 'fixed' && installment > 0) {
      const ratio = Math.min(100, Math.max(0, splitConfig.interestRatio)) / 100;
      interestPayment = installment * ratio;
      principalPayment = installment - interestPayment;
    }

    // Capture initial and floating installment examples for dashboard display
    if (m === 1) {
      monthlyInstallmentInitial = installment;
    }
    // Record first floating installment if floating starts
    const isFloating = label.includes('Floating');
    if (isFloating && monthlyInstallmentFloating === 0) {
      monthlyInstallmentFloating = installment;
    }

    // Get any extra payment simulated by the user for this specific month
    const extraPayment = extraPayments[m] || 0;
    
    // Ensure we don't pay more than sisa pokok
    let actualPrincipalPaid = principalPayment;
    let actualExtraPayment = extraPayment;

    if (actualPrincipalPaid + actualExtraPayment > remainingBalance) {
      if (actualPrincipalPaid > remainingBalance) {
        actualPrincipalPaid = remainingBalance;
        actualExtraPayment = 0;
        installment = actualPrincipalPaid + interestPayment;
      } else {
        actualExtraPayment = remainingBalance - actualPrincipalPaid;
      }
    }

    const currentBalanceBeforeExtra = remainingBalance - actualPrincipalPaid;
    const finalRemainingBalance = Math.max(0, currentBalanceBeforeExtra - actualExtraPayment);

    totalInterest += interestPayment;
    totalPayment += (installment + actualExtraPayment);

    amortizationSchedule.push({
      monthNumber: m,
      dateStr: formatMonthYear(inputs.startDate, m - 1),
      interestRate: annualRate,
      label,
      installment,
      principalPayment: actualPrincipalPaid,
      interestPayment,
      remainingBalance: finalRemainingBalance,
      extraPayment: actualExtraPayment,
    });

    remainingBalance = finalRemainingBalance;
  }

  // If floating was never reached, copy initial installment
  if (monthlyInstallmentFloating === 0) {
    monthlyInstallmentFloating = monthlyInstallmentInitial;
  }

  // Upfront costs calculations - support bank-specific fees if part of inputs (BankScheme)
  const provisiPercent = 'provisiPercent' in inputs ? (inputs as any).provisiPercent : 0;
  const adminFee = 'adminFee' in inputs ? (inputs as any).adminFee : 0;
  const appraisalFee = 'appraisalFee' in inputs ? (inputs as any).appraisalFee : 0;
  const notarisPercent = 'notarisPercent' in inputs ? (inputs as any).notarisPercent : 0;
  const asuransiPercent = 'asuransiPercent' in inputs ? (inputs as any).asuransiPercent : 0;

  const provisiCost = (provisiPercent / 100) * plafond;
  const adminCost = adminFee;
  const appraisalCost = appraisalFee;
  const notarisCost = (notarisPercent / 100) * plafond;
  const asuransiCost = (asuransiPercent / 100) * plafond;
  
  // Nilai Transaksi untuk perhitungan pajak (default = harga net)
  const transactionValue = upfrontInputs.transactionValue ?? netPrice;

  // BPHTB / Pajak Pembeli: 5% * (Transaksi - NPOPTKP)
  let bphtbCost = 0;
  if (upfrontInputs.useBphtbAuto) {
    bphtbCost = Math.max(0, (transactionValue - upfrontInputs.bphtbNpoptkp) * 0.05);
  }

  // Biaya transaksi jual-beli / notaris (fee tetap) — masuk total pembeli
  const transactionFeesCost =
    (upfrontInputs.ppjbFee ?? 0) +
    (upfrontInputs.skptFee ?? 0) +
    (upfrontInputs.ajbFee ?? 0) +
    (upfrontInputs.balikNamaFee ?? 0) +
    (upfrontInputs.pnbpFee ?? 0) +
    (upfrontInputs.cekSertifikatFee ?? 0) +
    (upfrontInputs.validasiPajakFee ?? 0);

  const customFeesCost = upfrontInputs.customFees.reduce((sum, fee) => sum + fee.amount, 0);

  const upfrontCostsTotal = provisiCost + adminCost + appraisalCost + notarisCost + asuransiCost + bphtbCost + transactionFeesCost + customFeesCost;
  const totalCashNeeded = Math.max(0, dpAmount - bookingFee) + upfrontCostsTotal;

  return {
    plafond,
    totalInterest,
    totalPayment,
    upfrontCostsTotal,
    totalCashNeeded,
    monthlyInstallmentInitial,
    monthlyInstallmentFloating,
    amortizationSchedule,
  };
};

export const getBphtbFormulaString = (price: number, npoptkp: number): string => {
  const taxable = Math.max(0, price - npoptkp);
  return `5% x (${price > npoptkp ? `Rp ${price.toLocaleString('id-ID')} - Rp ${npoptkp.toLocaleString('id-ID')}` : 'Harga di bawah NPOPTKP'}) = Rp ${(taxable * 0.05).toLocaleString('id-ID')}`;
};
