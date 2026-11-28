'use client';

import React, { useMemo, useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import {
  Calculator,
  Calendar,
  Activity,
  DollarSign,
  Download,
  FileSpreadsheet,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
} from 'lucide-react';

type CalcKind =
  | 'income-tax'
  | 'emi'
  | 'sip'
  | 'ppf'
  | 'epf'
  | 'nps'
  | 'fd'
  | 'rd'
  | 'compound'
  | 'cagr'
  | 'discount'
  | 'tip'
  | 'percentage'
  | 'margin'
  | 'gst'
  | 'salary'
  | 'inflation'
  | 'bmi'
  | 'bmr'
  | 'water'
  | 'sleep'
  | 'pace'
  | 'date-diff'
  | 'age';

interface YearRow {
  year: number;
  investedOrPrincipal: number;
  interestOrGain: number;
  closingBalance: number;
}

function toWinAnsiSafe(input: string): string {
  return input
    .replace(/\u20B9/g, 'Rs.')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function formatINR(num: number): string {
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

function computeNewRegimeTaxFY2627(grossIncome: number, isSalaried: boolean): {
  stdDed: number;
  taxable: number;
  slabTax: number;
  rebate87A: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  slabs: Array<{ range: string; rate: string; tax: number }>;
} {
  const stdDed = isSalaried ? 75000 : 0;
  const taxable = Math.max(0, grossIncome - stdDed);

  const bands = [
    { limit: 400000, rate: 0, label: 'Up to ₹4,00,000' },
    { limit: 800000, rate: 0.05, label: '₹4,00,001 – ₹8,00,000' },
    { limit: 1200000, rate: 0.1, label: '₹8,00,001 – ₹12,00,000' },
    { limit: 1600000, rate: 0.15, label: '₹12,00,001 – ₹16,00,000' },
    { limit: 2000000, rate: 0.2, label: '₹16,00,001 – ₹20,00,000' },
    { limit: 2400000, rate: 0.25, label: '₹20,00,001 – ₹24,00,000' },
    { limit: Infinity, rate: 0.3, label: 'Above ₹24,00,000' },
  ];

  let prev = 0;
  let slabTax = 0;
  const slabs: Array<{ range: string; rate: string; tax: number }> = [];
  for (const b of bands) {
    const portion = Math.max(0, Math.min(taxable, b.limit) - prev);
    const t = portion * b.rate;
    slabTax += t;
    slabs.push({ range: b.label, rate: `${Math.round(b.rate * 100)}%`, tax: t });
    prev = b.limit;
  }

  let rebate87A = 0;
  let afterRebate = slabTax;
  if (taxable <= 1200000) {
    rebate87A = Math.min(60000, slabTax);
    afterRebate = 0;
  } else {
    // Marginal relief right above ₹12,00,000 taxable income
    const excess = taxable - 1200000;
    if (afterRebate > excess) {
      rebate87A = afterRebate - excess;
      afterRebate = excess;
    }
  }

  let surchargeRate = 0;
  if (taxable > 20000000) surchargeRate = 0.25;
  else if (taxable > 10000000) surchargeRate = 0.15;
  else if (taxable > 5000000) surchargeRate = 0.1;

  const surcharge = afterRebate * surchargeRate;
  const cess = (afterRebate + surcharge) * 0.04;
  return {
    stdDed,
    taxable,
    slabTax,
    rebate87A,
    surcharge,
    cess,
    totalTax: afterRebate + surcharge + cess,
    slabs,
  };
}

function computeOldRegimeTaxFY2627(
  grossIncome: number,
  isSalaried: boolean,
  deductions80C: number,
  deductions80D: number,
  otherDeductions: number,
  ageGroup: 'under60' | 'senior' | 'super'
): {
  stdDed: number;
  totalDeductions: number;
  taxable: number;
  slabTax: number;
  rebate87A: number;
  surcharge: number;
  cess: number;
  totalTax: number;
} {
  const stdDed = isSalaried ? 50000 : 0;
  const totalDeductions = stdDed + Math.min(150000, deductions80C) + deductions80D + otherDeductions;
  const taxable = Math.max(0, grossIncome - totalDeductions);

  const basicExempt = ageGroup === 'super' ? 500000 : ageGroup === 'senior' ? 300000 : 250000;
  let slabTax = 0;
  if (taxable > basicExempt && ageGroup !== 'super') {
    slabTax += Math.max(0, Math.min(taxable, 500000) - basicExempt) * 0.05;
  }
  if (taxable > 500000) {
    slabTax += Math.max(0, Math.min(taxable, 1000000) - 500000) * 0.2;
  }
  if (taxable > 1000000) {
    slabTax += (taxable - 1000000) * 0.3;
  }

  let rebate87A = 0;
  let afterRebate = slabTax;
  if (taxable <= 500000) {
    rebate87A = Math.min(12500, slabTax);
    afterRebate = Math.max(0, slabTax - rebate87A);
  }

  let surchargeRate = 0;
  if (taxable > 50000000) surchargeRate = 0.37;
  else if (taxable > 20000000) surchargeRate = 0.25;
  else if (taxable > 10000000) surchargeRate = 0.15;
  else if (taxable > 5000000) surchargeRate = 0.1;

  const surcharge = afterRebate * surchargeRate;
  const cess = (afterRebate + surcharge) * 0.04;
  return {
    stdDed,
    totalDeductions,
    taxable,
    slabTax,
    rebate87A,
    surcharge,
    cess,
    totalTax: afterRebate + surcharge + cess,
  };
}

function detectCalcType(tool: ToolDef): CalcKind {
  const slug = tool.slug.toLowerCase();
  if (slug.includes('income-tax') || slug.includes('tax-regime') || slug.includes('itr-')) return 'income-tax';
  if (slug.includes('ppf') || slug.includes('public-provident')) return 'ppf';
  if (slug.includes('epf') || slug.includes('employee-provident') || slug.includes('pf-calculator')) return 'epf';
  if (slug.includes('nps') || slug.includes('national-pension')) return 'nps';
  if (slug.includes('sip') || slug.includes('mutual-fund')) return 'sip';
  if (slug.includes('emi') || slug.includes('home-loan') || slug.includes('car-loan') || slug.includes('personal-loan') || slug.includes('loan')) return 'emi';
  if (slug.includes('fd-') || slug.includes('fixed-deposit')) return 'fd';
  if (slug.includes('rd-') || slug.includes('recurring-deposit')) return 'rd';
  if (slug.includes('compound')) return 'compound';
  if (slug.includes('cagr')) return 'cagr';
  if (slug.includes('discount') || slug.includes('sale')) return 'discount';
  if (slug.includes('tip-')) return 'tip';
  if (slug.includes('percentage')) return 'percentage';
  if (slug.includes('margin') || slug.includes('markup')) return 'margin';
  if (slug.includes('gst')) return 'gst';
  if (slug.includes('salary') || slug.includes('paycheck')) return 'salary';
  if (slug.includes('inflation')) return 'inflation';
  if (slug.includes('bmi')) return 'bmi';
  if (slug.includes('bmr') || slug.includes('tdee') || slug.includes('calorie')) return 'bmr';
  if (slug.includes('water-intake')) return 'water';
  if (slug.includes('sleep')) return 'sleep';
  if (slug.includes('pace')) return 'pace';
  if (slug.includes('days-between') || slug.includes('countdown') || slug.includes('date-calculator')) return 'date-diff';
  if (slug.includes('age') || tool.category === 'date-time-calculators') return 'age';
  if (tool.category === 'health-fitness-nutrition') return 'bmi';
  return 'emi';
}

function SvgDonutAndBars({
  primaryLabel,
  secondaryLabel,
  primaryVal,
  secondaryVal,
  rows,
  barTitle = 'Year-by-Year Progression',
  xLabels,
}: {
  primaryLabel: string;
  secondaryLabel: string;
  primaryVal: number;
  secondaryVal: number;
  rows: YearRow[];
  barTitle?: string;
  xLabels?: string[];
}) {
  const total = Math.max(1, primaryVal + secondaryVal);
  const pFrac = Math.min(1, Math.max(0, primaryVal / total));
  const r = 42;
  const c = 2 * Math.PI * r;
  const pDash = c * pFrac;
  const sDash = c - pDash;

  const displayBars = rows.length > 15
    ? rows.filter((_, i) => i === 0 || i === rows.length - 1 || i % Math.ceil(rows.length / 12) === 0)
    : rows;
  const maxBar = Math.max(1, ...displayBars.map((row) => row.closingBalance));

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
      {/* Donut Breakdown */}
      <div className="md:col-span-5 flex items-center gap-4">
        <svg viewBox="0 0 110 110" className="w-28 h-28 shrink-0 -rotate-90" aria-label="Breakdown chart">
          <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="14" className="text-neutral-200 dark:text-neutral-800" />
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke="#2563eb"
            strokeWidth="14"
            strokeDasharray={`${pDash} ${sDash}`}
          />
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth="14"
            strokeDasharray={`${sDash} ${pDash}`}
            strokeDashoffset={-pDash}
          />
        </svg>
        <div className="space-y-2 text-xs min-w-0">
          <div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span className="truncate">{primaryLabel}</span>
            </div>
            <div className="font-mono font-bold text-neutral-900 dark:text-white">
              {formatINR(primaryVal)} ({Math.round(pFrac * 100)}%)
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{secondaryLabel}</span>
            </div>
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {formatINR(secondaryVal)} ({Math.round((1 - pFrac) * 100)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Growth / Comparison SVG Bar Chart */}
      <div className="md:col-span-7 flex flex-col justify-between">
        <div className="text-[11px] font-bold uppercase text-neutral-400 mb-2">
          {barTitle}
        </div>
        <div className="w-full h-28 flex items-end gap-1.5 pt-2">
          {displayBars.map((row, idx) => {
            const totalH = Math.max(8, Math.round((row.closingBalance / maxBar) * 100));
            const basePart =
              row.closingBalance > 0
                ? Math.min(100, Math.round((row.investedOrPrincipal / row.closingBalance) * 100))
                : 50;
            const axisLabel = xLabels?.[idx] ?? `Y${row.year}`;
            return (
              <div
                key={row.year}
                title={`${axisLabel}: ${formatINR(row.closingBalance)}`}
                className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-[14px]"
              >
                <div
                  style={{ height: `${totalH}%` }}
                  className="w-full rounded-t-md overflow-hidden flex flex-col-reverse bg-emerald-500/85"
                >
                  <div style={{ height: `${basePart}%` }} className="w-full bg-blue-600/90" />
                </div>
                <span className="text-[9px] font-mono text-neutral-400">{axisLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CalculatorEngine({ tool }: { tool: ToolDef }) {
  const calcType = detectCalcType(tool);
  const isIndiaFinance =
    calcType === 'income-tax' ||
    calcType === 'emi' ||
    calcType === 'sip' ||
    calcType === 'ppf' ||
    calcType === 'epf' ||
    calcType === 'nps';

  // Common Financial Inputs
  const [principal, setPrincipal] = useState<number>(
    calcType === 'sip' ? 15000 : calcType === 'ppf' ? 150000 : calcType === 'nps' ? 10000 : 3500000
  );
  const [rate, setRate] = useState<number>(
    calcType === 'emi'
      ? 8.5
      : calcType === 'sip'
        ? 12
        : calcType === 'ppf'
          ? 7.1
          : calcType === 'epf'
            ? 8.25
            : calcType === 'nps'
              ? 10
              : 7
  );
  const [tenureYears, setTenureYears] = useState<number>(
    calcType === 'ppf' ? 15 : calcType === 'epf' || calcType === 'nps' ? 25 : 20
  );

  // EPF specific
  const [basicMonthly, setBasicMonthly] = useState<number>(45000);
  const [empContribPct, setEmpContribPct] = useState<number>(12);
  const [annualHikePct, setAnnualHikePct] = useState<number>(6);

  // Income Tax FY 2026-27 specific
  const [grossSalary, setGrossSalary] = useState<number>(1500000);
  const [isSalaried, setIsSalaried] = useState<boolean>(true);
  const [ded80C, setDed80C] = useState<number>(150000);
  const [ded80D, setDed80D] = useState<number>(25000);
  const [otherDed, setOtherDed] = useState<number>(50000);
  const [ageGroup, setAgeGroup] = useState<'under60' | 'senior' | 'super'>('under60');

  // Misc calc states
  const [cagrEnd, setCagrEnd] = useState<number>(1200000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstInclusive, setGstInclusive] = useState<boolean>(false);
  const [pctA, setPctA] = useState<number>(25);
  const [pctB, setPctB] = useState<number>(400);
  const [birthDate, setBirthDate] = useState<string>('1998-06-15');
  const [endDate, setEndDate] = useState<string>('2026-11-28');
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(172);
  const [ageNum, setAgeNum] = useState<number>(28);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [exportMsg, setExportMsg] = useState<string>('');

  // Yearly calculation model for India finance instruments
  const financeModel = useMemo((): {
    headlineLabel: string;
    headlineVal: string;
    kpiA: { label: string; val: string; raw: number };
    kpiB: { label: string; val: string; raw: number };
    kpiC: { label: string; val: string; raw: number };
    formula: string;
    rows: YearRow[];
  } | null => {
    if (calcType === 'emi') {
      const P = Math.max(0, principal);
      const r = Math.max(0.01, rate) / 1200;
      const n = Math.max(1, Math.round(tenureYears * 12));
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const totalPayment = emi * n;
      const totalInterest = totalPayment - P;

      const rows: YearRow[] = [];
      let bal = P;
      for (let yr = 1; yr <= tenureYears; yr++) {
        let yrInterest = 0;
        let yrPrincipal = 0;
        for (let m = 0; m < 12; m++) {
          const mInt = bal * r;
          const mPrin = Math.min(bal, emi - mInt);
          yrInterest += mInt;
          yrPrincipal += mPrin;
          bal = Math.max(0, bal - mPrin);
        }
        rows.push({
          year: yr,
          investedOrPrincipal: yrPrincipal,
          interestOrGain: yrInterest,
          closingBalance: bal,
        });
      }

      return {
        headlineLabel: 'Monthly Loan EMI',
        headlineVal: formatINR(emi),
        kpiA: { label: 'Principal Loan', val: formatINR(P), raw: P },
        kpiB: { label: 'Total Interest', val: formatINR(totalInterest), raw: totalInterest },
        kpiC: { label: 'Total Repayment', val: formatINR(totalPayment), raw: totalPayment },
        formula: 'EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1], where r = Annual Rate / 1200, n = Years × 12',
        rows,
      };
    }

    if (calcType === 'sip') {
      const monthly = Math.max(0, principal);
      const r = Math.max(0.01, rate) / 1200;
      const rows: YearRow[] = [];
      let bal = 0;
      for (let yr = 1; yr <= tenureYears; yr++) {
        for (let m = 0; m < 12; m++) {
          bal = (bal + monthly) * (1 + r);
        }
        const inv = monthly * yr * 12;
        rows.push({
          year: yr,
          investedOrPrincipal: inv,
          interestOrGain: Math.max(0, bal - inv),
          closingBalance: bal,
        });
      }
      const totalInv = monthly * tenureYears * 12;
      const estGains = Math.max(0, bal - totalInv);
      return {
        headlineLabel: 'Estimated Maturity Value',
        headlineVal: formatINR(bal),
        kpiA: { label: 'Total Invested', val: formatINR(totalInv), raw: totalInv },
        kpiB: { label: 'Wealth Gained', val: formatINR(estGains), raw: estGains },
        kpiC: { label: 'ROI Multiple', val: `${(bal / Math.max(1, totalInv)).toFixed(2)}x`, raw: bal },
        formula: 'FV = P × [((1 + i)^n - 1) / i] × (1 + i), compounded monthly',
        rows,
      };
    }

    if (calcType === 'ppf') {
      const annualDeposit = Math.min(150000, Math.max(500, principal));
      const r = rate / 100;
      const rows: YearRow[] = [];
      let bal = 0;
      for (let yr = 1; yr <= tenureYears; yr++) {
        bal = (bal + annualDeposit) * (1 + r);
        const inv = annualDeposit * yr;
        rows.push({
          year: yr,
          investedOrPrincipal: inv,
          interestOrGain: Math.max(0, bal - inv),
          closingBalance: bal,
        });
      }
      const totalInv = annualDeposit * tenureYears;
      const totalInt = Math.max(0, bal - totalInv);
      return {
        headlineLabel: 'PPF Tax-Free Maturity (E-E-E)',
        headlineVal: formatINR(bal),
        kpiA: { label: 'Total Deposited', val: formatINR(totalInv), raw: totalInv },
        kpiB: { label: 'PPF Interest Earned', val: formatINR(totalInt), raw: totalInt },
        kpiC: { label: 'Annual Cap (80C)', val: '₹1,50,000', raw: totalInv },
        formula: 'Annual Compounding (Govt notified 7.1% p.a.): Bal(y) = (Bal(y-1) + AnnualDeposit) × (1 + r)',
        rows,
      };
    }

    if (calcType === 'epf') {
      const rMonthly = rate / 1200;
      const rows: YearRow[] = [];
      let bal = 0;
      let cumContrib = 0;
      let curBasic = basicMonthly;
      for (let yr = 1; yr <= tenureYears; yr++) {
        const empM = curBasic * (empContribPct / 100);
        const erTotal = curBasic * 0.12;
        const epsCap = Math.min(1250, curBasic * 0.0833);
        const erEpfM = Math.max(0, erTotal - epsCap);
        const mTotal = empM + erEpfM;
        for (let m = 0; m < 12; m++) {
          bal = (bal + mTotal) * (1 + rMonthly);
          cumContrib += mTotal;
        }
        rows.push({
          year: yr,
          investedOrPrincipal: cumContrib,
          interestOrGain: Math.max(0, bal - cumContrib),
          closingBalance: bal,
        });
        curBasic *= 1 + annualHikePct / 100;
      }
      return {
        headlineLabel: 'Projected EPF Corpus',
        headlineVal: formatINR(bal),
        kpiA: { label: 'Employee + Employer EPF', val: formatINR(cumContrib), raw: cumContrib },
        kpiB: { label: 'EPF Interest (8.25%)', val: formatINR(bal - cumContrib), raw: bal - cumContrib },
        kpiC: { label: 'Monthly EPS Split', val: '8.33% (Max ₹1,250)', raw: bal },
        formula: 'EPFO Monthly Accrual: Employee 12% + Employer (12% - EPS 8.33% capped at ₹1,250/mo) @ 8.25% p.a.',
        rows,
      };
    }

    if (calcType === 'nps') {
      const monthly = Math.max(500, principal);
      const rM = rate / 1200;
      const rows: YearRow[] = [];
      let bal = 0;
      for (let yr = 1; yr <= tenureYears; yr++) {
        for (let m = 0; m < 12; m++) {
          bal = (bal + monthly) * (1 + rM);
        }
        const inv = monthly * yr * 12;
        rows.push({
          year: yr,
          investedOrPrincipal: inv,
          interestOrGain: Math.max(0, bal - inv),
          closingBalance: bal,
        });
      }
      const totalInv = monthly * tenureYears * 12;
      const lump60 = bal * 0.6;
      const annuity40 = bal * 0.4;
      const estMonthlyPension = (annuity40 * 0.06) / 12;
      return {
        headlineLabel: 'NPS Corpus & Monthly Pension',
        headlineVal: formatINR(bal),
        kpiA: { label: '60% Tax-Free Lumpsum', val: formatINR(lump60), raw: lump60 },
        kpiB: { label: '40% Annuity Fund', val: formatINR(annuity40), raw: annuity40 },
        kpiC: { label: 'Est. Pension (@6% Annuity)', val: `${formatINR(estMonthlyPension)}/mo`, raw: totalInv },
        formula: 'Corpus = Monthly SIP × [((1+i)^n - 1)/i] × (1+i); Split: 60% Exempt Lumpsum + 40% Annuity',
        rows,
      };
    }

    return null;
  }, [calcType, principal, rate, tenureYears, basicMonthly, empContribPct, annualHikePct]);

  const taxReport = useMemo(() => {
    if (calcType !== 'income-tax') return null;
    const newReg = computeNewRegimeTaxFY2627(grossSalary, isSalaried);
    const oldReg = computeOldRegimeTaxFY2627(grossSalary, isSalaried, ded80C, ded80D, otherDed, ageGroup);
    const diff = oldReg.totalTax - newReg.totalTax;
    const best = diff >= 0 ? 'New Tax Regime' : 'Old Tax Regime';
    return {
      newReg,
      oldReg,
      best,
      savings: Math.abs(diff),
    };
  }, [calcType, grossSalary, isSalaried, ded80C, ded80D, otherDed, ageGroup]);

  const exportCsv = () => {
    let csv = '';
    if (taxReport) {
      csv = [
        'Regime,Gross Income,Taxable Income,Slab Tax,Rebate 87A,Surcharge,4% Cess,Total Tax Payable',
        `New Regime (FY 2026-27),${grossSalary},${taxReport.newReg.taxable},${Math.round(taxReport.newReg.slabTax)},${Math.round(taxReport.newReg.rebate87A)},${Math.round(taxReport.newReg.surcharge)},${Math.round(taxReport.newReg.cess)},${Math.round(taxReport.newReg.totalTax)}`,
        `Old Regime (FY 2026-27),${grossSalary},${taxReport.oldReg.taxable},${Math.round(taxReport.oldReg.slabTax)},${Math.round(taxReport.oldReg.rebate87A)},${Math.round(taxReport.oldReg.surcharge)},${Math.round(taxReport.oldReg.cess)},${Math.round(taxReport.oldReg.totalTax)}`,
      ].join('\n');
    } else if (financeModel) {
      csv = [
        'Year,Principal or Invested (INR),Interest or Gain (INR),Closing Balance (INR)',
        ...financeModel.rows.map(
          (r) =>
            `${r.year},${Math.round(r.investedOrPrincipal)},${Math.round(r.interestOrGain)},${Math.round(r.closingBalance)}`
        ),
      ].join('\n');
    } else {
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snaptools-${calcType}-fy2026-27.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setExportMsg('Exported CSV spreadsheet locally!');
    setTimeout(() => setExportMsg(''), 3000);
  };

  const exportPdfReport = async () => {
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      let page = doc.addPage([595.28, 841.89]);
      let y = 785;

      page.drawText(toWinAnsiSafe(`SnapTools Financial Report - ${tool.title}`), {
        x: 45,
        y,
        size: 16,
        font: bold,
        color: rgb(0.1, 0.28, 0.72),
      });
      y -= 20;
      page.drawText('Updated for FY 2026-27 (AY 2027-28) | 100% Client-Side Computation', {
        x: 45,
        y,
        size: 10,
        font,
        color: rgb(0.35, 0.35, 0.4),
      });
      y -= 28;

      if (taxReport) {
        const lines = [
          `Gross Annual Income: Rs. ${Math.round(grossSalary).toLocaleString('en-IN')}`,
          `Recommended Regime: ${taxReport.best} (Saves Rs. ${Math.round(taxReport.savings).toLocaleString('en-IN')})`,
          '',
          `NEW REGIME (Sec 115BAC): Taxable = Rs. ${Math.round(taxReport.newReg.taxable).toLocaleString('en-IN')} | Total Tax = Rs. ${Math.round(taxReport.newReg.totalTax).toLocaleString('en-IN')}`,
          `OLD REGIME (with Deductions): Taxable = Rs. ${Math.round(taxReport.oldReg.taxable).toLocaleString('en-IN')} | Total Tax = Rs. ${Math.round(taxReport.oldReg.totalTax).toLocaleString('en-IN')}`,
          '',
          'New Regime FY 2026-27 Slab Breakdown:',
          ...taxReport.newReg.slabs.map((s) => `  - ${toWinAnsiSafe(s.range)} (${s.rate}): Rs. ${Math.round(s.tax).toLocaleString('en-IN')}`),
        ];
        for (const ln of lines) {
          page.drawText(toWinAnsiSafe(ln), { x: 45, y, size: 10.5, font, color: rgb(0.1, 0.1, 0.1) });
          y -= 18;
        }
      } else if (financeModel) {
        const summaryLines = [
          `${financeModel.headlineLabel}: ${toWinAnsiSafe(financeModel.headlineVal)}`,
          `${financeModel.kpiA.label}: ${toWinAnsiSafe(financeModel.kpiA.val)}`,
          `${financeModel.kpiB.label}: ${toWinAnsiSafe(financeModel.kpiB.val)}`,
          `${financeModel.kpiC.label}: ${toWinAnsiSafe(financeModel.kpiC.val)}`,
          `Formula: ${toWinAnsiSafe(financeModel.formula)}`,
          '',
          'Year  | Principal / Invested      | Interest / Gain          | Closing Balance',
          '--------------------------------------------------------------------------------',
        ];
        for (const ln of summaryLines) {
          page.drawText(ln, { x: 45, y, size: 10, font: ln.startsWith('Year') ? bold : font, color: rgb(0.12, 0.12, 0.12) });
          y -= 16;
        }
        for (const row of financeModel.rows) {
          if (y < 52) {
            page = doc.addPage([595.28, 841.89]);
            y = 790;
          }
          const line = `Yr ${String(row.year).padStart(2, '0')} | Rs. ${Math.round(row.investedOrPrincipal).toLocaleString('en-IN').padEnd(20)} | Rs. ${Math.round(row.interestOrGain).toLocaleString('en-IN').padEnd(19)} | Rs. ${Math.round(row.closingBalance).toLocaleString('en-IN')}`;
          page.drawText(line, { x: 45, y, size: 9.5, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 15;
        }
      }

      const bytes = await doc.save();
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snaptools-${calcType}-report-fy2026-27.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      setExportMsg('Downloaded formatted PDF report!');
      setTimeout(() => setExportMsg(''), 3000);
    } catch {
      setExportMsg('Could not export PDF report.');
    }
  };

  return (
    <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Header Badge + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
          <Calculator className="w-5 h-5 text-blue-600" />
          <span>{tool.title}</span>
          {isIndiaFinance && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3 h-3" /> Updated for FY 2026&ndash;27 (AY 2027&ndash;28)
            </span>
          )}
        </div>

        {(financeModel || taxReport) && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>
            <button
              type="button"
              onClick={exportPdfReport}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> PDF Report
            </button>
          </div>
        )}
      </div>

      {exportMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {exportMsg}
        </div>
      )}

      {/* 1. INDIA INCOME TAX FY 2026-27 CALCULATOR */}
      {calcType === 'income-tax' && taxReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">
                Gross Annual Income (₹)
              </label>
              <input
                type="number"
                value={grossSalary}
                onChange={(e) => setGrossSalary(Math.max(0, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-base font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">
                Age Bracket (Old Regime Exemption)
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as 'under60' | 'senior' | 'super')}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 font-semibold"
              >
                <option value="under60">Below 60 Years (₹2.5L Exempt)</option>
                <option value="senior">Senior Citizen 60–80 (₹3L Exempt)</option>
                <option value="super">Super Senior 80+ (₹5L Exempt)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 font-bold text-neutral-700 dark:text-neutral-200 cursor-pointer pt-5">
              <input
                type="checkbox"
                checked={isSalaried}
                onChange={(e) => setIsSalaried(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Salaried Employee (Std Ded ₹75k New / ₹50k Old)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">
                Section 80C (Old Regime, Max ₹1.5L)
              </label>
              <input
                type="number"
                max={150000}
                value={ded80C}
                onChange={(e) => setDed80C(Math.min(150000, Math.max(0, Number(e.target.value))))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">
                Section 80D Health Insurance (Old)
              </label>
              <input
                type="number"
                value={ded80D}
                onChange={(e) => setDed80D(Math.max(0, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">
                HRA / Sec 24(b) / NPS 80CCD(1B) (Old)
              </label>
              <input
                type="number"
                value={otherDed}
                onChange={(e) => setOtherDed(Math.max(0, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-mono"
              />
            </div>
          </div>

          {/* Winner Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-indigo-500/10 border border-emerald-400/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                FY 2026&ndash;27 Recommendation
              </div>
              <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-0.5">
                {taxReport.best} saves {formatINR(taxReport.savings)}/year
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <div>
                <div className="text-neutral-500">New Regime Tax</div>
                <div className="text-lg font-mono font-extrabold text-blue-600">{formatINR(taxReport.newReg.totalTax)}</div>
              </div>
              <div>
                <div className="text-neutral-500">Old Regime Tax</div>
                <div className="text-lg font-mono font-extrabold text-neutral-800 dark:text-neutral-200">{formatINR(taxReport.oldReg.totalTax)}</div>
              </div>
            </div>
          </div>

          <SvgDonutAndBars
            primaryLabel="Annual Take-Home"
            secondaryLabel="New Regime Tax Payable"
            primaryVal={Math.max(0, grossSalary - taxReport.newReg.totalTax)}
            secondaryVal={taxReport.newReg.totalTax}
            barTitle="Take-Home vs Tax: New vs Old Regime"
            xLabels={['New Regime', 'Old Regime']}
            rows={[
              { year: 1, investedOrPrincipal: Math.max(0, grossSalary - taxReport.newReg.totalTax), interestOrGain: taxReport.newReg.totalTax, closingBalance: grossSalary },
              { year: 2, investedOrPrincipal: Math.max(0, grossSalary - taxReport.oldReg.totalTax), interestOrGain: taxReport.oldReg.totalTax, closingBalance: grossSalary },
            ]}
          />

          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
              <Info className="w-4 h-4 text-blue-600" /> Official FY 2026&ndash;27 Formula (Sec 115BAC New vs Old)
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              New Regime Tax Slabs: 0–₹4L (0%), ₹4L–₹8L (5%), ₹8L–₹12L (10%), ₹12L–₹16L (15%), ₹16L–₹20L (20%), ₹20L–₹24L (25%), &gt;₹24L (30%) + Sec 87A Rebate zeroing tax up to ₹12L taxable (₹12.75L salaried) + Surcharge + 4% Cess.
            </p>
          </div>
        </div>
      )}

      {/* 2. EMI / SIP / PPF / EPF / NPS FINANCIAL WORKBENCH */}
      {financeModel && (
        <div className="space-y-6">
          {calcType === 'epf' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">Basic + DA (Monthly ₹)</label>
                <input
                  type="number"
                  value={basicMonthly}
                  onChange={(e) => setBasicMonthly(Number(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">Employee Share (%)</label>
                <input
                  type="number"
                  min={12}
                  max={100}
                  value={empContribPct}
                  onChange={(e) => setEmpContribPct(Number(e.target.value) || 12)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">EPF Interest (% p.a.)</label>
                <input
                  type="number"
                  step={0.05}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 8.25)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">
                  Annual Salary Hike ({annualHikePct}%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={annualHikePct}
                  onChange={(e) => setAnnualHikePct(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="block font-bold text-neutral-500 uppercase mb-1">Years to Retirement ({tenureYears}y)</label>
                <input
                  type="range"
                  min={1}
                  max={38}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-11 accent-blue-600"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">
                  {calcType === 'emi'
                    ? 'Loan Amount (₹)'
                    : calcType === 'ppf'
                      ? 'Yearly PPF Deposit (Max ₹1.5L)'
                      : 'Monthly Contribution (₹)'}
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-base font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">
                  Interest / Expected Return ({rate}% p.a.)
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0.5}
                  max={40}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value) || 0)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-base font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">
                  Tenure: {tenureYears} Years
                </label>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-11 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
              <div className="text-[11px] font-semibold text-blue-100 uppercase">{financeModel.headlineLabel}</div>
              <div className="text-2xl font-mono font-black mt-1">{financeModel.headlineVal}</div>
            </div>
            {[financeModel.kpiA, financeModel.kpiB, financeModel.kpiC].map((k) => (
              <div
                key={k.label}
                className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/70"
              >
                <div className="text-[11px] font-bold text-neutral-500 uppercase">{k.label}</div>
                <div className="text-lg font-mono font-extrabold text-neutral-900 dark:text-white mt-1">
                  {k.val}
                </div>
              </div>
            ))}
          </div>

          <SvgDonutAndBars
            primaryLabel={financeModel.kpiA.label}
            secondaryLabel={financeModel.kpiB.label}
            primaryVal={financeModel.kpiA.raw}
            secondaryVal={financeModel.kpiB.raw}
            rows={financeModel.rows}
          />

          {/* Formula Disclosure + Expandable Amortization / Projection Table */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <Info className="w-4 h-4 text-blue-600" /> Mathematical Formula
              </span>
              <button
                type="button"
                onClick={() => setShowSchedule((s) => !s)}
                className="min-h-[36px] px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showSchedule ? 'Hide Schedule Table' : `View ${financeModel.rows.length}-Year Schedule`}</span>
              </button>
            </div>
            <code className="block font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
              {financeModel.formula}
            </code>

            {showSchedule && (
              <div className="max-h-72 overflow-y-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="py-2 pr-3">Year</th>
                      <th className="py-2 pr-3">{financeModel.kpiA.label}</th>
                      <th className="py-2 pr-3">{financeModel.kpiB.label}</th>
                      <th className="py-2">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {financeModel.rows.map((r) => (
                      <tr key={r.year}>
                        <td className="py-1.5 pr-3 font-bold">Y{r.year}</td>
                        <td className="py-1.5 pr-3">{formatINR(r.investedOrPrincipal)}</td>
                        <td className="py-1.5 pr-3 text-emerald-600 dark:text-emerald-400">
                          {formatINR(r.interestOrGain)}
                        </td>
                        <td className="py-1.5 font-bold">{formatINR(r.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. GST & BUSINESS CALCULATORS */}
      {calcType === 'gst' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">Amount (₹)</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-base font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">GST Slab (%)</label>
              <div className="flex gap-1.5">
                {[3, 5, 12, 18, 28].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGstRate(s)}
                    className={`flex-1 min-h-[44px] rounded-xl font-bold cursor-pointer ${
                      gstRate === s ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 font-bold pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={gstInclusive}
                onChange={(e) => setGstInclusive(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Amount Already Includes GST
            </label>
          </div>
          {(() => {
            const base = gstInclusive ? principal / (1 + gstRate / 100) : principal;
            const gstAmt = base * (gstRate / 100);
            return (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-500">Taxable Base</div>
                  <div className="text-lg font-mono font-bold mt-1">{formatINR(base)}</div>
                </div>
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-500">CGST ({gstRate / 2}%)</div>
                  <div className="text-lg font-mono font-bold mt-1">{formatINR(gstAmt / 2)}</div>
                </div>
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-500">SGST ({gstRate / 2}%)</div>
                  <div className="text-lg font-mono font-bold mt-1">{formatINR(gstAmt / 2)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-600 text-white">
                  <div className="text-blue-100">Grand Invoice Total</div>
                  <div className="text-lg font-mono font-black mt-1">{formatINR(base + gstAmt)}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. HEALTH & FITNESS (BMI / BMR / WATER / SLEEP / PACE) */}
      {(calcType === 'bmi' || calcType === 'bmr' || calcType === 'water' || calcType === 'sleep' || calcType === 'pace') && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">Age (Years)</label>
              <input
                type="number"
                value={ageNum}
                onChange={(e) => setAgeNum(Number(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">Sex</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-semibold"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          {(() => {
            const hm = Math.max(0.5, heightCm / 100);
            const bmi = weightKg / (hm * hm);
            const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + (gender === 'male' ? 5 : -161);
            const waterLiters = weightKg * 0.033;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                    <Activity className="w-4 h-4" /> BMI Index
                  </div>
                  <div className="text-2xl font-mono font-black mt-1">{bmi.toFixed(1)}</div>
                </div>
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <div className="font-bold text-neutral-500">BMR (Basal Calories)</div>
                  <div className="text-2xl font-mono font-black mt-1">{Math.round(bmr)} kcal/day</div>
                </div>
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <div className="font-bold text-neutral-500">Recommended Water</div>
                  <div className="text-2xl font-mono font-black mt-1">{waterLiters.toFixed(2)} L/day</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. AGE & DATE DIFFERENCE */}
      {(calcType === 'age' || calcType === 'date-diff') && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">Start / Birth Date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-500 uppercase mb-1">Target Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
              />
            </div>
          </div>
          {(() => {
            const d1 = new Date(birthDate);
            const d2 = new Date(endDate);
            const diffDays = Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
            const years = Math.floor(diffDays / 365.25);
            const months = Math.floor((diffDays % 365.25) / 30.4375);
            return (
              <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600 shrink-0" />
                <div className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                  {years} Years, {months} Months ({diffDays.toLocaleString()} Total Days)
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. REMAINING GENERAL FINANCIAL / MATH CALCULATORS (FD, RD, COMPOUND, CAGR, DISCOUNT, TIP, PERCENTAGE, MARGIN, SALARY, INFLATION) */}
      {!taxReport &&
        !financeModel &&
        calcType !== 'gst' &&
        calcType !== 'bmi' &&
        calcType !== 'bmr' &&
        calcType !== 'water' &&
        calcType !== 'sleep' &&
        calcType !== 'pace' &&
        calcType !== 'age' &&
        calcType !== 'date-diff' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">
                  {calcType === 'percentage' ? 'Percentage (%)' : 'Primary Value / Principal'}
                </label>
                <input
                  type="number"
                  value={calcType === 'percentage' ? pctA : principal}
                  onChange={(e) =>
                    calcType === 'percentage'
                      ? setPctA(Number(e.target.value) || 0)
                      : setPrincipal(Number(e.target.value) || 0)
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-base font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">
                  {calcType === 'percentage'
                    ? 'Of Base Value'
                    : calcType === 'cagr'
                      ? 'Final Value'
                      : 'Rate / Discount (%)'}
                </label>
                <input
                  type="number"
                  value={
                    calcType === 'percentage' ? pctB : calcType === 'cagr' ? cagrEnd : rate
                  }
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    if (calcType === 'percentage') setPctB(v);
                    else if (calcType === 'cagr') setCagrEnd(v);
                    else setRate(v);
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-base font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-500 uppercase mb-1">Years / Multiplier</label>
                <input
                  type="number"
                  min={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono text-base font-bold"
                />
              </div>
            </div>

            {(() => {
              let label = 'Computed Result';
              let valueText = '';
              if (calcType === 'percentage') {
                label = `${pctA}% of ${pctB}`;
                valueText = ((pctA / 100) * pctB).toLocaleString(undefined, { maximumFractionDigits: 4 });
              } else if (calcType === 'cagr') {
                const cagr = principal > 0 && cagrEnd > 0 ? (Math.pow(cagrEnd / principal, 1 / tenureYears) - 1) * 100 : 0;
                label = `${tenureYears}-Year CAGR`;
                valueText = `${cagr.toFixed(2)}% p.a.`;
              } else if (calcType === 'discount' || calcType === 'margin') {
                const finalP = principal * (1 - rate / 100);
                label = 'Final Price After Adjustment';
                valueText = formatINR(finalP);
              } else if (calcType === 'tip') {
                const tip = principal * (rate / 100);
                label = `Total With ${rate}% Tip`;
                valueText = `${formatINR(principal + tip)} (Tip: ${formatINR(tip)})`;
              } else if (calcType === 'inflation') {
                const futureCost = principal * Math.pow(1 + rate / 100, tenureYears);
                label = `Inflation-Adjusted Cost (${tenureYears}y)`;
                valueText = formatINR(futureCost);
              } else if (calcType === 'salary') {
                label = 'Estimated Monthly Gross';
                valueText = `${formatINR(principal / 12)}/month`;
              } else {
                const maturity = principal * Math.pow(1 + rate / 400, tenureYears * 4);
                label = 'Compounded Maturity Value';
                valueText = formatINR(maturity);
              }
              return (
                <div className="p-5 rounded-2xl bg-blue-600 text-white flex items-center gap-3">
                  <DollarSign className="w-6 h-6 shrink-0 text-blue-200" />
                  <div>
                    <div className="text-[11px] uppercase font-bold text-blue-100">{label}</div>
                    <div className="text-2xl font-mono font-black">{valueText}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
    </div>
  );
}
