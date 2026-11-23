'use client';

import React, { useState, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Calculator, ArrowRight, DollarSign, Calendar, Activity, CheckCircle2, RefreshCw } from 'lucide-react';

export default function CalculatorEngine({ tool }: { tool: ToolDef }) {
  // Input states
  const [val1, setVal1] = useState<number>(100000); // e.g. Principal / Weight / Input A
  const [val2, setVal2] = useState<number>(8.5);    // e.g. Rate % / Height / Input B
  const [val3, setVal3] = useState<number>(5);      // e.g. Tenure (Years) / Input C
  const [val4, setVal4] = useState<number>(0);      // Extra input
  const [date1, setDate1] = useState<string>('1998-05-15');
  const [date2, setDate2] = useState<string>('2026-11-23');
  const [mode, setMode] = useState<string>('default');

  // Result state
  const [results, setResults] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const [breakdownPercent, setBreakdownPercent] = useState<number>(50);

  useEffect(() => {
    const slug = tool.slug;
    const res: { label: string; value: string; highlight?: boolean }[] = [];

    // 1. Home / Car / Personal Loan EMI Calculator
    if (slug.includes('emi') || slug.includes('loan')) {
      const P = Number(val1);
      const r = Number(val2) / 12 / 100;
      const n = Number(val3) * 12;

      if (P > 0 && r > 0 && n > 0) {
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - P;

        res.push({ label: 'Monthly EMI', value: `₹${Math.round(emi).toLocaleString()}`, highlight: true });
        res.push({ label: 'Total Interest Payable', value: `₹${Math.round(totalInterest).toLocaleString()}` });
        res.push({ label: 'Total Payment (Principal + Interest)', value: `₹${Math.round(totalPayment).toLocaleString()}` });
        setBreakdownPercent(Math.round((P / totalPayment) * 100));
      }
    }
    // 2. Mutual Fund SIP Calculator
    else if (slug.includes('sip')) {
      const P = Number(val1); // Monthly investment
      const i = Number(val2) / 12 / 100; // Monthly return
      const n = Number(val3) * 12; // Months

      if (P > 0 && i > 0 && n > 0) {
        const maturity = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        const invested = P * n;
        const wealthGain = maturity - invested;

        res.push({ label: 'Expected Total Wealth', value: `₹${Math.round(maturity).toLocaleString()}`, highlight: true });
        res.push({ label: 'Invested Amount', value: `₹${Math.round(invested).toLocaleString()}` });
        res.push({ label: 'Estimated Wealth Gain', value: `₹${Math.round(wealthGain).toLocaleString()}` });
        setBreakdownPercent(Math.round((invested / maturity) * 100));
      }
    }
    // 3. GST Calculator
    else if (slug.includes('gst')) {
      const amount = Number(val1);
      const rate = Number(val2) || 18;
      const gstAmount = (amount * rate) / 100;
      const totalAmount = amount + gstAmount;

      res.push({ label: 'Gross Total (Incl. GST)', value: `₹${totalAmount.toFixed(2)}`, highlight: true });
      res.push({ label: 'Total GST Amount', value: `₹${gstAmount.toFixed(2)}` });
      res.push({ label: `CGST (${rate / 2}%)`, value: `₹${(gstAmount / 2).toFixed(2)}` });
      res.push({ label: `SGST (${rate / 2}%)`, value: `₹${(gstAmount / 2).toFixed(2)}` });
    }
    // 4. Fixed Deposit / Compound Interest / PPF
    else if (slug.includes('deposit') || slug.includes('interest') || slug.includes('ppf') || slug.includes('compound')) {
      const P = Number(val1);
      const r = Number(val2) / 100;
      const t = Number(val3);
      const A = P * Math.pow(1 + r, t);
      const interest = A - P;

      res.push({ label: 'Maturity Value', value: `₹${Math.round(A).toLocaleString()}`, highlight: true });
      res.push({ label: 'Total Interest Earned', value: `₹${Math.round(interest).toLocaleString()}` });
      res.push({ label: 'Initial Principal', value: `₹${Math.round(P).toLocaleString()}` });
    }
    // 5. BMI (Body Mass Index) Calculator
    else if (slug.includes('bmi')) {
      const weight = Number(val1); // kg
      const heightM = Number(val2) / 100; // cm to m
      if (weight > 0 && heightM > 0) {
        const bmi = weight / (heightM * heightM);
        let category = 'Normal weight';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi >= 25 && bmi < 29.9) category = 'Overweight';
        else if (bmi >= 30) category = 'Obesity';

        res.push({ label: 'Your BMI Score', value: `${bmi.toFixed(1)} kg/m²`, highlight: true });
        res.push({ label: 'Weight Category', value: category });
        res.push({ label: 'Healthy Weight Range', value: `${(18.5 * heightM * heightM).toFixed(1)} - ${(24.9 * heightM * heightM).toFixed(1)} kg` });
      }
    }
    // 6. BMR & TDEE Calorie Calculator
    else if (slug.includes('bmr') || slug.includes('tdee') || slug.includes('calorie')) {
      const weight = Number(val1);
      const height = Number(val2);
      const age = Number(val3);
      // Mifflin-St Jeor formula
      const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      const tdee = bmr * 1.55; // moderate activity

      res.push({ label: 'Daily Maintenance Calories (TDEE)', value: `${Math.round(tdee)} kcal/day`, highlight: true });
      res.push({ label: 'Basal Metabolic Rate (BMR)', value: `${Math.round(bmr)} kcal/day` });
      res.push({ label: 'Weight Loss Deficit (0.5 kg/week)', value: `${Math.round(tdee - 500)} kcal/day` });
      res.push({ label: 'Weight Gain Surplus', value: `${Math.round(tdee + 400)} kcal/day` });
    }
    // 7. Age & Date Difference Calculator
    else if (slug.includes('age') || slug.includes('date-difference') || slug.includes('birthday')) {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(totalDays / 365.25);
      const months = Math.floor((totalDays % 365.25) / 30.4375);
      const days = Math.floor((totalDays % 365.25) % 30.4375);

      res.push({ label: 'Exact Age', value: `${years} Years, ${months} Months, ${days} Days`, highlight: true });
      res.push({ label: 'Total Days', value: `${totalDays.toLocaleString()} Days` });
      res.push({ label: 'Total Hours', value: `${(totalDays * 24).toLocaleString()} Hours` });
      res.push({ label: 'Total Minutes', value: `${(totalDays * 24 * 60).toLocaleString()} Minutes` });
    }
    // 8. Profit Margin & Markup Calculator
    else if (slug.includes('margin') || slug.includes('markup') || slug.includes('profit')) {
      const cost = Number(val1);
      const revenue = Number(val2);
      const profit = revenue - cost;
      const margin = (profit / revenue) * 100;
      const markup = (profit / cost) * 100;

      res.push({ label: 'Net Profit', value: `₹${profit.toFixed(2)}`, highlight: true });
      res.push({ label: 'Profit Margin', value: `${margin.toFixed(2)}%` });
      res.push({ label: 'Markup Percentage', value: `${markup.toFixed(2)}%` });
    }
    // 9. Percentage Calculator
    else if (slug.includes('percentage')) {
      const part = Number(val1);
      const total = Number(val2);
      const pct = (part / total) * 100;
      res.push({ label: 'Percentage Result', value: `${pct.toFixed(2)}%`, highlight: true });
      res.push({ label: `${part} as fraction of ${total}`, value: `${part} / ${total}` });
    }
    // 10. General Math / Physics / Construction fallback
    else {
      const a = Number(val1);
      const b = Number(val2);
      const c = Number(val3);
      const product = a * b;
      const sum = a + b + c;

      res.push({ label: 'Calculated Result', value: `${product.toLocaleString()}`, highlight: true });
      res.push({ label: 'Sum (A + B + C)', value: `${sum.toLocaleString()}` });
      res.push({ label: 'Average', value: `${(sum / 3).toFixed(2)}` });
    }

    setResults(res);
  }, [val1, val2, val3, val4, date1, date2, tool.slug]);

  const isLoanOrSip = tool.slug.includes('emi') || tool.slug.includes('loan') || tool.slug.includes('sip');
  const isDate = tool.slug.includes('age') || tool.slug.includes('date-difference') || tool.slug.includes('birthday');
  const isBmi = tool.slug.includes('bmi');
  const isGst = tool.slug.includes('gst');

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Dynamic Input Form */}
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
                <option value={18}>18% (Services & General)</option>
                <option value={28}>28% (Luxury & Vehicles)</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                {isLoanOrSip ? 'Principal / Monthly Amount' : 'Input Value A'}
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
                {isLoanOrSip ? 'Expected Interest / Return Rate (%)' : 'Input Value B'}
              </label>
              <input
                type="number"
                step="0.1"
                value={val2}
                onChange={(e) => setVal2(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
                {isLoanOrSip ? 'Tenure (Years)' : 'Input Value C'}
              </label>
              <input
                type="number"
                value={val3}
                onChange={(e) => setVal3(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
              />
            </div>
          </>
        )}
      </div>

      {/* Visual Breakdown Bar for Loans/SIP */}
      {isLoanOrSip && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <span>Principal ({breakdownPercent}%)</span>
            <span>Interest / Returns ({100 - breakdownPercent}%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${breakdownPercent}%` }} />
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${100 - breakdownPercent}%` }} />
          </div>
        </div>
      )}

      {/* Results Display Grid */}
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
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 font-medium">{r.label}</div>
            <div className={`font-mono font-bold tracking-tight ${r.highlight ? 'text-2xl text-blue-600 dark:text-blue-400' : 'text-lg'}`}>
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
