'use client';

import React, { useState, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';

interface CalculatorDefaults {
  v1: number;
  v2: number;
  v3: number;
}

function getDefaultInputs(slug: string): CalculatorDefaults {
  if (slug.includes('bmi')) return { v1: 70, v2: 175, v3: 25 };
  if (slug.includes('bmr') || slug.includes('tdee') || slug.includes('calorie')) {
    return { v1: 70, v2: 175, v3: 28 };
  }
  if (slug.includes('sip')) return { v1: 10000, v2: 12, v3: 10 };
  if (slug.includes('emi') || slug.includes('loan')) {
    return { v1: 2500000, v2: 8.5, v3: 20 };
  }
  if (slug.includes('gst')) return { v1: 10000, v2: 18, v3: 1 };
  if (
    slug.includes('deposit') ||
    slug.includes('interest') ||
    slug.includes('ppf') ||
    slug.includes('compound')
  ) {
    return { v1: 100000, v2: 7.5, v3: 5 };
  }
  if (
    slug.includes('margin') ||
    slug.includes('markup') ||
    slug.includes('profit')
  ) {
    return { v1: 500, v2: 750, v3: 1 };
  }
  if (slug.includes('percentage')) return { v1: 45, v2: 100, v3: 1 };
  return { v1: 100, v2: 10, v3: 5 };
}

export default function CalculatorEngine({ tool }: { tool: ToolDef }) {
  const initial = getDefaultInputs(tool.slug);
  const [val1, setVal1] = useState<number>(initial.v1);
  const [val2, setVal2] = useState<number>(initial.v2);
  const [val3, setVal3] = useState<number>(initial.v3);
  const [date1, setDate1] = useState<string>('1998-05-15');
  const [date2, setDate2] = useState<string>('2026-11-23');

  const [results, setResults] = useState<
    { label: string; value: string; highlight?: boolean }[]
  >([]);
  const [breakdownPercent, setBreakdownPercent] = useState<number>(50);

  // Reset appropriate defaults whenever user switches to a different calculator tool
  useEffect(() => {
    const d = getDefaultInputs(tool.slug);
    setVal1(d.v1);
    setVal2(d.v2);
    setVal3(d.v3);
  }, [tool.slug]);

  useEffect(() => {
    const slug = tool.slug;
    const res: { label: string; value: string; highlight?: boolean }[] = [];

    if (slug.includes('emi') || slug.includes('loan')) {
      const P = Number(val1);
      const r = Number(val2) / 12 / 100;
      const n = Number(val3) * 12;

      if (P > 0 && r > 0 && n > 0) {
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - P;

        res.push({
          label: 'Monthly EMI',
          value: `₹${Math.round(emi).toLocaleString()}`,
          highlight: true,
        });
        res.push({
          label: 'Total Interest Payable',
          value: `₹${Math.round(totalInterest).toLocaleString()}`,
        });
        res.push({
          label: 'Total Payment (Principal + Interest)',
          value: `₹${Math.round(totalPayment).toLocaleString()}`,
        });
        setBreakdownPercent(Math.round((P / totalPayment) * 100));
      }
    } else if (slug.includes('sip')) {
      const P = Number(val1);
      const i = Number(val2) / 12 / 100;
      const n = Number(val3) * 12;

      if (P > 0 && i > 0 && n > 0) {
        const maturity = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        const invested = P * n;
        const wealthGain = maturity - invested;

        res.push({
          label: 'Expected Total Wealth',
          value: `₹${Math.round(maturity).toLocaleString()}`,
          highlight: true,
        });
        res.push({
          label: 'Invested Amount',
          value: `₹${Math.round(invested).toLocaleString()}`,
        });
        res.push({
          label: 'Estimated Wealth Gain',
          value: `₹${Math.round(wealthGain).toLocaleString()}`,
        });
        setBreakdownPercent(Math.round((invested / maturity) * 100));
      }
    } else if (slug.includes('gst')) {
      const amount = Number(val1);
      const rate = Number(val2) || 18;
      const gstAmount = (amount * rate) / 100;
      const totalAmount = amount + gstAmount;

      res.push({
        label: 'Gross Total (Incl. GST)',
        value: `₹${totalAmount.toFixed(2)}`,
        highlight: true,
      });
      res.push({ label: 'Total GST Amount', value: `₹${gstAmount.toFixed(2)}` });
      res.push({
        label: `CGST (${rate / 2}%)`,
        value: `₹${(gstAmount / 2).toFixed(2)}`,
      });
      res.push({
        label: `SGST (${rate / 2}%)`,
        value: `₹${(gstAmount / 2).toFixed(2)}`,
      });
    } else if (
      slug.includes('deposit') ||
      slug.includes('interest') ||
      slug.includes('ppf') ||
      slug.includes('compound')
    ) {
      const P = Number(val1);
      const r = Number(val2) / 100;
      const t = Number(val3);
      const A = P * Math.pow(1 + r, t);
      const interest = A - P;

      res.push({
        label: 'Maturity Value',
        value: `₹${Math.round(A).toLocaleString()}`,
        highlight: true,
      });
      res.push({
        label: 'Total Interest Earned',
        value: `₹${Math.round(interest).toLocaleString()}`,
      });
      res.push({
        label: 'Initial Principal',
        value: `₹${Math.round(P).toLocaleString()}`,
      });
    } else if (slug.includes('bmi')) {
      const weight = Number(val1);
      const heightM = Number(val2) / 100;
      if (weight > 0 && heightM > 0) {
        const bmi = weight / (heightM * heightM);
        let category = 'Normal weight';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi >= 25 && bmi < 30) category = 'Overweight';
        else if (bmi >= 30) category = 'Obesity';

        res.push({
          label: 'Your BMI Score',
          value: `${bmi.toFixed(1)} kg/m²`,
          highlight: true,
        });
        res.push({ label: 'Weight Category', value: category });
        res.push({
          label: 'Healthy Weight Range',
          value: `${(18.5 * heightM * heightM).toFixed(1)} - ${(24.9 * heightM * heightM).toFixed(1)} kg`,
        });
      }
    } else if (
      slug.includes('bmr') ||
      slug.includes('tdee') ||
      slug.includes('calorie')
    ) {
      const weight = Number(val1);
      const height = Number(val2);
      const age = Number(val3);
      const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      const tdee = bmr * 1.55;

      res.push({
        label: 'Daily Maintenance Calories (TDEE)',
        value: `${Math.round(tdee)} kcal/day`,
        highlight: true,
      });
      res.push({
        label: 'Basal Metabolic Rate (BMR)',
        value: `${Math.round(bmr)} kcal/day`,
      });
      res.push({
        label: 'Weight Loss Deficit (0.5 kg/week)',
        value: `${Math.round(tdee - 500)} kcal/day`,
      });
      res.push({
        label: 'Weight Gain Surplus',
        value: `${Math.round(tdee + 400)} kcal/day`,
      });
    } else if (
      slug.includes('age') ||
      slug.includes('date-difference') ||
      slug.includes('birthday')
    ) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffMs = Math.abs(d2.getTime() - d1.getTime());
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = Math.floor(totalDays / 365.25);
        const months = Math.floor((totalDays % 365.25) / 30.4375);
        const days = Math.floor((totalDays % 365.25) % 30.4375);

        res.push({
          label: 'Exact Duration / Age',
          value: `${years} Years, ${months} Months, ${days} Days`,
          highlight: true,
        });
        res.push({
          label: 'Total Days',
          value: `${totalDays.toLocaleString()} Days`,
        });
        res.push({
          label: 'Total Hours',
          value: `${(totalDays * 24).toLocaleString()} Hours`,
        });
        res.push({
          label: 'Total Minutes',
          value: `${(totalDays * 24 * 60).toLocaleString()} Minutes`,
        });
      }
    } else if (
      slug.includes('margin') ||
      slug.includes('markup') ||
      slug.includes('profit')
    ) {
      const cost = Number(val1);
      const revenue = Number(val2);
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const markup = cost > 0 ? (profit / cost) * 100 : 0;

      res.push({
        label: 'Net Profit',
        value: `₹${profit.toFixed(2)}`,
        highlight: true,
      });
      res.push({ label: 'Profit Margin', value: `${margin.toFixed(2)}%` });
      res.push({ label: 'Markup Percentage', value: `${markup.toFixed(2)}%` });
    } else if (slug.includes('percentage')) {
      const part = Number(val1);
      const total = Number(val2);
      const pct = total !== 0 ? (part / total) * 100 : 0;
      res.push({
        label: 'Percentage Result',
        value: `${pct.toFixed(2)}%`,
        highlight: true,
      });
      res.push({ label: 'Ratio', value: `${part} / ${total}` });
    } else {
      const a = Number(val1);
      const b = Number(val2);
      const c = Number(val3);
      const product = a * b;
      const sum = a + b + c;

      res.push({
        label: 'Calculated Product (A × B)',
        value: `${product.toLocaleString()}`,
        highlight: true,
      });
      res.push({ label: 'Sum (A + B + C)', value: `${sum.toLocaleString()}` });
      res.push({ label: 'Average', value: `${(sum / 3).toFixed(2)}` });
    }

    setResults(res);
  }, [val1, val2, val3, date1, date2, tool.slug]);

  const slug = tool.slug;
  const isSip = slug.includes('sip');
  const isLoan = slug.includes('emi') || slug.includes('loan');
  const isDepositOrInterest =
    slug.includes('deposit') ||
    slug.includes('interest') ||
    slug.includes('ppf') ||
    slug.includes('compound');
  const isLoanOrSip = isSip || isLoan;
  const isDate =
    slug.includes('age') ||
    slug.includes('date-difference') ||
    slug.includes('birthday');
  const isBmi = slug.includes('bmi');
  const isCalorie =
    slug.includes('bmr') || slug.includes('tdee') || slug.includes('calorie');
  const isGst = slug.includes('gst');
  const isProfit =
    slug.includes('margin') ||
    slug.includes('markup') ||
    slug.includes('profit');
  const isPercentage = slug.includes('percentage');

  const getFieldLabels = (): [string, string, string?] => {
    if (isSip) {
      return [
        'Monthly SIP Investment (₹)',
        'Expected Annual Return (%)',
        'Investment Duration (Years)',
      ];
    }
    if (isLoan) {
      return [
        'Loan Amount (₹)',
        'Interest Rate (% p.a.)',
        'Loan Tenure (Years)',
      ];
    }
    if (isDepositOrInterest) {
      return [
        'Principal Deposit (₹)',
        'Annual Interest Rate (%)',
        'Tenure (Years)',
      ];
    }
    if (isCalorie) {
      return ['Weight (kg)', 'Height (cm)', 'Age (Years)'];
    }
    if (isProfit) {
      return ['Cost Price (₹)', 'Selling Price / Revenue (₹)'];
    }
    if (isPercentage) {
      return ['Part Value', 'Total Value'];
    }
    return ['Input Value A', 'Input Value B', 'Input Value C'];
  };

  const [label1, label2, label3] = getFieldLabels();

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isDate ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Date of Birth / Start Date
              </label>
              <input
                type="date"
                value={date1}
                onChange={(e) => setDate1(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Target Date / Today
              </label>
              <input
                type="date"
                value={date2}
                onChange={(e) => setDate2(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
          </>
        ) : isBmi ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Weight (kg)
              </label>
              <input
                type="number"
                value={val1}
                onChange={(e) => setVal1(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                value={val2}
                onChange={(e) => setVal2(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
          </>
        ) : isGst ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                Base Amount (₹)
              </label>
              <input
                type="number"
                value={val1}
                onChange={(e) => setVal1(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                GST Slab (%)
              </label>
              <select
                value={val2}
                onChange={(e) => setVal2(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              >
                <option value={5}>5% (Essential Goods)</option>
                <option value={12}>12% (Standard Items)</option>
                <option value={18}>18% (Services &amp; General)</option>
                <option value={28}>28% (Luxury &amp; Vehicles)</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                {label1}
              </label>
              <input
                type="number"
                value={val1}
                onChange={(e) => setVal1(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                {label2}
              </label>
              <input
                type="number"
                step="0.1"
                value={val2}
                onChange={(e) => setVal2(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
            {label3 && (
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                  {label3}
                </label>
                <input
                  type="number"
                  value={val3}
                  onChange={(e) => setVal3(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
                />
              </div>
            )}
          </>
        )}
      </div>

      {isLoanOrSip && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <span>Principal ({breakdownPercent}%)</span>
            <span>Interest / Returns ({100 - breakdownPercent}%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${breakdownPercent}%` }}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${100 - breakdownPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
        {results.map((r, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border transition-all ${
              r.highlight
                ? 'bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10 border-blue-500/30 text-blue-950 dark:text-blue-100 shadow-md'
                : 'bg-neutral-50 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
            }`}
          >
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
              {r.label}
            </div>
            <div
              className={`font-mono font-bold tracking-tight ${
                r.highlight ? 'text-2xl text-blue-600 dark:text-blue-400' : 'text-lg'
              }`}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
