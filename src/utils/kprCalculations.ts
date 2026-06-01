import type { 
  KprInputs, 
  UpfrontCosts, 
  AmortizationRow, 
  CalculationSummary
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
  bookingFee: number = 0
): CalculationSummary => {
  const netPrice = Math.max(0, price - discount);
  const plafond = Math.max(0, netPrice - dpAmount);
  const tenorMonths = inputs.tenorYears * 12;
  const amortizationSchedule: AmortizationRow[] = [];
  
  let remainingBalance = plafond;
  let totalInterest = 0;
  let totalPayment = 0;
  let monthlyInstallmentInitial = 0;
  let monthlyInstallmentFloating = 0;

  // Variables to track rate and base installment for annuity
  let lastRate = -1;
  let baseInstallment = 0;

  for (let m = 1; m <= tenorMonths; m++) {
    if (remainingBalance <= 0) break;

    const { rate: annualRate, label } = getRateForMonth(m, inputs);
    const monthlyRate = annualRate / 100 / 12;
    const remainingMonths = tenorMonths - m + 1;

    let installment = 0;
    let interestPayment = 0;
    let principalPayment = 0;

    if (inputs.calculationType === 'annuity') {
      // Annuity: Installment changes when interest rate changes
      if (annualRate !== lastRate) {
        lastRate = annualRate;
        if (monthlyRate > 0) {
          // Annuity formula: P * r * (1+r)^n / ((1+r)^n - 1)
          baseInstallment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                            (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        } else {
          baseInstallment = remainingBalance / remainingMonths;
        }
      }
      
      interestPayment = remainingBalance * monthlyRate;
      installment = Math.min(baseInstallment, remainingBalance + interestPayment);
      principalPayment = installment - interestPayment;
      
    } else if (inputs.calculationType === 'effective') {
      // Effective: Fixed principal payment, interest based on remaining balance
      // Note: If rate changes, we still pay the remaining balance divided by remaining months as principal
      // In Indonesia, effective principal is Plafond / Tenor, but with rate changes and potential extra payments, 
      // we recalculate the base principal as remainingBalance / remainingMonths to ensure it pays off.
      const basePrincipal = remainingBalance / remainingMonths;
      interestPayment = remainingBalance * monthlyRate;
      installment = basePrincipal + interestPayment;
      principalPayment = basePrincipal;
      
    } else {
      // Flat: Interest calculated from Plafond (original loan amount), fixed principal
      // flat interest = Plafond * rate_annual / 12
      // flat principal = Plafond / tenorMonths
      // If interest rate changes, interest payment changes to Plafond * new_rate_annual / 12
      const basePrincipal = plafond / tenorMonths;
      interestPayment = plafond * monthlyRate;
      installment = basePrincipal + interestPayment;
      principalPayment = basePrincipal;
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
  
  // BPHTB: 5% * (NetPrice - NPOPTKP)
  let bphtbCost = 0;
  if (upfrontInputs.useBphtbAuto) {
    bphtbCost = Math.max(0, (netPrice - upfrontInputs.bphtbNpoptkp) * 0.05);
  }

  const customFeesCost = upfrontInputs.customFees.reduce((sum, fee) => sum + fee.amount, 0);

  const upfrontCostsTotal = provisiCost + adminCost + appraisalCost + notarisCost + asuransiCost + bphtbCost + customFeesCost;
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
