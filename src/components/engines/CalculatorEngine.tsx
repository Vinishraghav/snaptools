'use client';

import React, { useState, useEffect } from 'react';
import { ToolDef } from '@/data/toolsRegistry';

interface CalculatorDefaults {
  v1: number;
  v2: number;
  v3: number;
}

function getDefaultInputs(tool: ToolDef): CalculatorDefaults {
  const s = tool.spec;
  if (s && typeof s.v1 === 'number' && typeof s.v2 === 'number') {
    return { v1: s.v1, v2: s.v2, v3: typeof s.v3 === 'number' ? s.v3 : 1 };
  }
  const slug = tool.slug;
  if (slug.includes('bmi')) return { v1: 70, v2: 175, v3: 25 };
  if (slug.includes('bmr') || slug.includes('tdee') || slug.includes('calorie')) return { v1: 70, v2: 175, v3: 28 };
  if (slug.includes('sip')) return { v1: 10000, v2: 12, v3: 10 };
  if (slug.includes('emi') || slug.includes('loan')) return { v1: 2500000, v2: 8.5, v3: 20 };
  if (slug.includes('gst')) return { v1: 10000, v2: 18, v3: 1 };
  if (slug.includes('aspect-ratio')) return { v1: 1920, v2: 1080, v3: 1280 };
  if (slug.includes('dpi') || slug.includes('ppi')) return { v1: 2560, v2: 1440, v3: 27 };
  if (slug.includes('clamp')) return { v1: 16, v2: 32, v3: 1280 };
  if (slug.includes('deposit') || slug.includes('interest') || slug.includes('ppf') || slug.includes('compound')) {
    return { v1: 100000, v2: 7.5, v3: 5 };
  }
  if (slug.includes('margin') || slug.includes('markup') || slug.includes('profit')) return { v1: 500, v2: 750, v3: 1 };
  if (slug.includes('percentage')) return { v1: 45, v2: 100, v3: 1 };
  return { v1: 100, v2: 10, v3: 5 };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function intToIp(intVal: number): string {
  return [(intVal >>> 24) & 255, (intVal >>> 16) & 255, (intVal >>> 8) & 255, intVal & 255].join('.');
}

function detectFormula(tool: ToolDef): string {
  if (typeof tool.spec?.formula === 'string') return tool.spec.formula;
  const slug = tool.slug;
  if (slug.includes('subnet') || slug.includes('cidr')) return 'subnet';
  if (slug.includes('chmod')) return 'chmod';
  if (slug.includes('aspect-ratio')) return 'aspect-ratio';
  if (slug.includes('dpi') || slug.includes('ppi')) return 'dpi';
  if (slug.includes('clamp')) return 'clamp';
  if (slug.includes('emi') || slug.includes('loan')) return 'emi';
  if (slug.includes('sip')) return 'sip';
  if (slug.includes('gst')) return 'gst';
  if (slug.includes('deposit') || slug.includes('interest') || slug.includes('ppf') || slug.includes('compound')) return 'compound';
  if (slug.includes('bmi')) return 'bmi';
  if (slug.includes('bmr') || slug.includes('tdee') || slug.includes('calorie')) return 'bmr';
  if (slug.includes('age') || slug.includes('date-difference') || slug.includes('birthday')) return 'date';
  if (slug.includes('margin') || slug.includes('markup') || slug.includes('profit')) return 'profit';
  if (slug.includes('percentage')) return 'percentage';
  return 'general';
}

export default function CalculatorEngine({ tool }: { tool: ToolDef }) {
  const initial = getDefaultInputs(tool);
  const [val1, setVal1] = useState<number>(initial.v1);
  const [val2, setVal2] = useState<number>(initial.v2);
  const [val3, setVal3] = useState<number>(initial.v3);
  const [date1, setDate1] = useState<string>('1998-05-15');
  const [date2, setDate2] = useState<string>('2026-11-23');
  const [cidrInput, setCidrInput] = useState<string>(
    typeof tool.spec?.cidr === 'string' ? tool.spec.cidr : '192.168.1.0/24'
  );
  const [chmodBits, setChmodBits] = useState<number[]>([
    typeof tool.spec?.chmodO === 'number' ? tool.spec.chmodO : 7,
    typeof tool.spec?.chmodG === 'number' ? tool.spec.chmodG : 5,
    typeof tool.spec?.chmodP === 'number' ? tool.spec.chmodP : 5,
  ]);

  const [results, setResults] = useState<{ label: string; value: string; highlight?: boolean }[]>([]);
  const [breakdownPercent, setBreakdownPercent] = useState<number>(50);

  const formula = detectFormula(tool);
  const unitSuffix = typeof tool.spec?.unit === 'string' ? ` (${tool.spec.unit})` : '';

  useEffect(() => {
    const d = getDefaultInputs(tool);
    setVal1(d.v1);
    setVal2(d.v2);
    setVal3(d.v3);
    if (typeof tool.spec?.cidr === 'string') setCidrInput(tool.spec.cidr);
    if (typeof tool.spec?.chmodO === 'number') {
      setChmodBits([
        tool.spec.chmodO,
        typeof tool.spec.chmodG === 'number' ? tool.spec.chmodG : 5,
        typeof tool.spec.chmodP === 'number' ? tool.spec.chmodP : 5,
      ]);
    }
  }, [tool]);

  useEffect(() => {
    const res: { label: string; value: string; highlight?: boolean }[] = [];
    const a = Number(val1);
    const b = Number(val2);
    const c = Number(val3);

    switch (formula) {
      case 'subnet': {
        const [ipStr, prefixStr] = cidrInput.trim().split('/');
        const prefix = Math.min(32, Math.max(0, Number(prefixStr ?? 24)));
        const octets = (ipStr || '').split('.').map(Number);
        if (octets.length === 4 && octets.every((o) => !isNaN(o) && o >= 0 && o <= 255)) {
          const ipInt = ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
          const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
          const net = (ipInt & mask) >>> 0;
          const broadcast = (net | (~mask >>> 0)) >>> 0;
          const usable = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.max(0, Math.pow(2, 32 - prefix) - 2);
          res.push({ label: 'Network Address', value: `${intToIp(net)}/${prefix}`, highlight: true });
          res.push({ label: 'Subnet Mask', value: intToIp(mask) });
          res.push({ label: 'Broadcast Address', value: intToIp(broadcast) });
          res.push({ label: 'First Usable Host', value: prefix >= 31 ? intToIp(net) : intToIp(net + 1) });
          res.push({ label: 'Last Usable Host', value: prefix >= 31 ? intToIp(broadcast) : intToIp(broadcast - 1) });
          res.push({ label: 'Usable Hosts', value: usable.toLocaleString() });
        } else {
          res.push({ label: 'Error', value: 'Invalid CIDR (e.g. 192.168.1.0/24)' });
        }
        break;
      }
      case 'chmod': {
        const sym = (n: number) => `${n & 4 ? 'r' : '-'}${n & 2 ? 'w' : '-'}${n & 1 ? 'x' : '-'}`;
        const numeric = chmodBits.join('');
        res.push({ label: 'Numeric Mode', value: numeric, highlight: true });
        res.push({ label: 'Symbolic Mode', value: `-${sym(chmodBits[0])}${sym(chmodBits[1])}${sym(chmodBits[2])}` });
        res.push({ label: 'Shell Command', value: `chmod ${numeric} filename` });
        break;
      }
      case 'aspect-ratio': {
        const w = Math.max(1, a);
        const h = Math.max(1, b);
        const targetW = Math.max(1, c);
        const div = gcd(w, h);
        res.push({ label: 'Aspect Ratio', value: `${w / div}:${h / div}`, highlight: true });
        res.push({ label: 'Decimal Ratio', value: (w / h).toFixed(3) });
        res.push({ label: `Scaled Height (at ${targetW}px)`, value: `${Math.round((targetW * h) / w)} px` });
        break;
      }
      case 'dpi': {
        const diag = Math.max(0.1, c);
        const ppi = Math.sqrt(a * a + b * b) / diag;
        res.push({ label: 'Pixel Density', value: `${ppi.toFixed(1)} PPI`, highlight: true });
        res.push({ label: 'Total Pixels', value: `${((a * b) / 1e6).toFixed(2)} MP` });
        res.push({ label: 'Dot Pitch', value: `${(25.4 / ppi).toFixed(4)} mm` });
        break;
      }
      case 'clamp': {
        const maxVw = Math.max(320, c);
        const minVw = 375;
        const slope = ((b - a) / (maxVw - minVw)) * 100;
        const intercept = a - (slope * minVw) / 100;
        res.push({
          label: 'Generated CSS clamp()',
          value: `clamp(${a}px, ${intercept.toFixed(2)}px + ${slope.toFixed(2)}vw, ${b}px)`,
          highlight: true,
        });
        break;
      }
      case 'emi': {
        const r = b / 12 / 100;
        const n = c * 12;
        if (a > 0 && r > 0 && n > 0) {
          const emi = (a * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
          const total = emi * n;
          res.push({ label: 'Monthly EMI', value: `₹${Math.round(emi).toLocaleString()}`, highlight: true });
          res.push({ label: 'Total Interest Payable', value: `₹${Math.round(total - a).toLocaleString()}` });
          res.push({ label: 'Total Payment', value: `₹${Math.round(total).toLocaleString()}` });
          setBreakdownPercent(Math.round((a / total) * 100));
        }
        break;
      }
      case 'sip': {
        const i = b / 12 / 100;
        const n = c * 12;
        if (a > 0 && i > 0 && n > 0) {
          const mat = a * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
          const inv = a * n;
          res.push({ label: 'Expected Total Wealth', value: `₹${Math.round(mat).toLocaleString()}`, highlight: true });
          res.push({ label: 'Invested Amount', value: `₹${Math.round(inv).toLocaleString()}` });
          res.push({ label: 'Wealth Gain', value: `₹${Math.round(mat - inv).toLocaleString()}` });
          setBreakdownPercent(Math.round((inv / mat) * 100));
        }
        break;
      }
      case 'gst': {
        const rate = b || 18;
        const gstAmt = (a * rate) / 100;
        const revBase = a / (1 + rate / 100);
        res.push({ label: `Total Incl. ${rate}% GST`, value: `₹${(a + gstAmt).toFixed(2)}`, highlight: true });
        res.push({ label: 'Added GST Amount', value: `₹${gstAmt.toFixed(2)}` });
        res.push({ label: 'Base Price (If GST Already Included)', value: `₹${revBase.toFixed(2)}` });
        break;
      }
      case 'compound': {
        const mat = a * Math.pow(1 + b / 100, c);
        res.push({ label: 'Maturity Value', value: `₹${Math.round(mat).toLocaleString()}`, highlight: true });
        res.push({ label: 'Interest Earned', value: `₹${Math.round(mat - a).toLocaleString()}` });
        res.push({ label: 'Principal', value: `₹${Math.round(a).toLocaleString()}` });
        break;
      }
      case 'simple-interest': {
        const si = (a * b * c) / 100;
        res.push({ label: 'Simple Interest', value: `₹${si.toFixed(2)}`, highlight: true });
        res.push({ label: 'Total Amount', value: `₹${(a + si).toFixed(2)}` });
        break;
      }
      case 'discount': {
        const saved = (a * b) / 100;
        res.push({ label: 'Final Discounted Price', value: `₹${(a - saved).toFixed(2)}`, highlight: true });
        res.push({ label: 'You Save', value: `₹${saved.toFixed(2)}` });
        res.push({ label: 'Discount %', value: `${b}%` });
        break;
      }
      case 'markup-target': {
        const sell = a * (1 + b / 100);
        res.push({ label: 'Selling Price', value: `₹${sell.toFixed(2)}`, highlight: true });
        res.push({ label: 'Profit Per Unit', value: `₹${(sell - a).toFixed(2)}` });
        res.push({ label: 'Gross Margin %', value: `${sell > 0 ? (((sell - a) / sell) * 100).toFixed(2) : '0'}%` });
        break;
      }
      case 'percent-of': {
        const val = (a / 100) * b;
        res.push({ label: `${a}% of ${b.toLocaleString()}`, value: val.toFixed(4).replace(/\.?0+$/, ''), highlight: true });
        res.push({ label: `${b} + ${a}%`, value: (b + val).toFixed(2) });
        res.push({ label: `${b} - ${a}%`, value: (b - val).toFixed(2) });
        break;
      }
      case 'bmi': {
        const hm = b / 100;
        if (a > 0 && hm > 0) {
          const bmi = a / (hm * hm);
          const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obesity';
          res.push({ label: 'Your BMI Score', value: `${bmi.toFixed(1)} kg/m²`, highlight: true });
          res.push({ label: 'Weight Category', value: cat });
          res.push({ label: 'Healthy Weight Range', value: `${(18.5 * hm * hm).toFixed(1)} - ${(24.9 * hm * hm).toFixed(1)} kg` });
        }
        break;
      }
      case 'bmr': {
        const bmrVal = 10 * a + 6.25 * b - 5 * c + 5;
        const tdee = bmrVal * 1.55;
        res.push({ label: 'Daily Maintenance (TDEE)', value: `${Math.round(tdee)} kcal/day`, highlight: true });
        res.push({ label: 'Basal Metabolic Rate', value: `${Math.round(bmrVal)} kcal/day` });
        res.push({ label: 'Fat Loss (-500 kcal)', value: `${Math.round(tdee - 500)} kcal/day` });
        break;
      }
      case 'date': {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
          const totalDays = Math.floor(Math.abs(d2.getTime() - d1.getTime()) / 86400000);
          res.push({
            label: 'Exact Age / Span',
            value: `${Math.floor(totalDays / 365.25)}Y ${Math.floor((totalDays % 365.25) / 30.4375)}M ${Math.floor((totalDays % 365.25) % 30.4375)}D`,
            highlight: true,
          });
          res.push({ label: 'Total Days', value: `${totalDays.toLocaleString()} Days` });
          res.push({ label: 'Total Hours', value: `${(totalDays * 24).toLocaleString()} Hours` });
        }
        break;
      }
      case 'profit': {
        const p = b - a;
        res.push({ label: 'Net Profit', value: `₹${p.toFixed(2)}`, highlight: true });
        res.push({ label: 'Profit Margin', value: `${b > 0 ? ((p / b) * 100).toFixed(2) : '0'}%` });
        res.push({ label: 'Markup %', value: `${a > 0 ? ((p / a) * 100).toFixed(2) : '0'}%` });
        break;
      }
      case 'percentage': {
        const pct = b !== 0 ? (a / b) * 100 : 0;
        res.push({ label: 'Percentage', value: `${pct.toFixed(2)}%`, highlight: true });
        res.push({ label: 'Ratio', value: `${a} / ${b}` });
        break;
      }
      case 'circle': {
        res.push({ label: `Area (πr²)`, value: (Math.PI * a * a).toFixed(4), highlight: true });
        res.push({ label: 'Circumference (2πr)', value: (2 * Math.PI * a).toFixed(4) });
        res.push({ label: 'Diameter (2r)', value: (2 * a).toFixed(4) });
        break;
      }
      case 'rectangle': {
        res.push({ label: 'Area (W × H)', value: (a * b).toFixed(2), highlight: true });
        res.push({ label: 'Perimeter', value: (2 * (a + b)).toFixed(2) });
        res.push({ label: 'Diagonal', value: Math.sqrt(a * a + b * b).toFixed(4) });
        break;
      }
      case 'triangle': {
        res.push({ label: 'Area (½ × b × h)', value: (0.5 * a * b).toFixed(3), highlight: true });
        break;
      }
      case 'pythagoras': {
        const hyp = Math.sqrt(a * a + b * b);
        res.push({ label: 'Hypotenuse (√(a² + b²))', value: hyp.toFixed(4), highlight: true });
        res.push({ label: 'Triangle Area', value: (0.5 * a * b).toFixed(3) });
        break;
      }
      case 'sphere': {
        res.push({ label: 'Volume (4/3 πr³)', value: ((4 / 3) * Math.PI * a * a * a).toFixed(4), highlight: true });
        res.push({ label: 'Surface Area (4πr²)', value: (4 * Math.PI * a * a).toFixed(4) });
        break;
      }
      case 'cylinder': {
        res.push({ label: 'Volume (πr²h)', value: (Math.PI * a * a * b).toFixed(4), highlight: true });
        res.push({ label: 'Surface Area', value: (2 * Math.PI * a * (a + b)).toFixed(4) });
        break;
      }
      case 'cone': {
        const slant = Math.sqrt(a * a + b * b);
        res.push({ label: 'Volume (⅓ πr²h)', value: ((1 / 3) * Math.PI * a * a * b).toFixed(4), highlight: true });
        res.push({ label: 'Slant Height', value: slant.toFixed(4) });
        res.push({ label: 'Total Surface Area', value: (Math.PI * a * (a + slant)).toFixed(4) });
        break;
      }
      case 'cube': {
        res.push({ label: 'Volume (s³)', value: (a * a * a).toFixed(3), highlight: true });
        res.push({ label: 'Surface Area (6s²)', value: (6 * a * a).toFixed(3) });
        res.push({ label: 'Space Diagonal', value: (a * Math.sqrt(3)).toFixed(4) });
        break;
      }
      case 'quadratic': {
        if (a === 0) {
          res.push({ label: 'Linear Root', value: b !== 0 ? (-c / b).toFixed(4) : 'Invalid (a=b=0)', highlight: true });
        } else {
          const disc = b * b - 4 * a * c;
          res.push({ label: 'Discriminant (b² - 4ac)', value: disc.toFixed(3) });
          if (disc >= 0) {
            res.push({ label: 'Root x₁', value: ((-b + Math.sqrt(disc)) / (2 * a)).toFixed(4), highlight: true });
            res.push({ label: 'Root x₂', value: ((-b - Math.sqrt(disc)) / (2 * a)).toFixed(4), highlight: true });
          } else {
            const real = (-b / (2 * a)).toFixed(3);
            const imag = (Math.sqrt(-disc) / (2 * a)).toFixed(3);
            res.push({ label: 'Complex Roots', value: `${real} ± ${imag}i`, highlight: true });
          }
        }
        break;
      }
      case 'ohms': {
        const v = a * b;
        res.push({ label: 'Voltage (V = I × R)', value: `${v.toFixed(3)} V`, highlight: true });
        res.push({ label: 'Power (P = I² × R)', value: `${(v * a).toFixed(3)} W` });
        break;
      }
      case 'kinetic': {
        res.push({ label: 'Kinetic Energy (½mv²)', value: `${(0.5 * a * b * b).toFixed(2)} J`, highlight: true });
        break;
      }
      case 'potential': {
        res.push({ label: 'Potential Energy (mgh)', value: `${(a * b * c).toFixed(2)} J`, highlight: true });
        break;
      }
      case 'force': {
        res.push({ label: 'Force (F = ma)', value: `${(a * b).toFixed(3)} N`, highlight: true });
        break;
      }
      case 'speed': {
        res.push({ label: 'Average Speed (D / T)', value: b !== 0 ? `${(a / b).toFixed(3)} units/hr` : '0', highlight: true });
        break;
      }
      case 'concrete': {
        const cuFt = a * b * c;
        const cuM = cuFt * 0.0283168;
        res.push({ label: 'Concrete Volume', value: `${cuFt.toFixed(2)} cu.ft (${cuM.toFixed(2)} m³)`, highlight: true });
        res.push({ label: 'Est. Cement (50kg Bags, M20)', value: `${Math.ceil(cuM * 8)} Bags` });
        break;
      }
      case 'brick': {
        const area = a * b;
        res.push({ label: 'Wall Area', value: `${area.toFixed(1)} sq ft`, highlight: true });
        res.push({ label: 'Bricks Required (9" Wall)', value: `${Math.ceil(area * 9.5).toLocaleString()} Bricks` });
        res.push({ label: 'Bricks Required (4.5" Partition)', value: `${Math.ceil(area * 5).toLocaleString()} Bricks` });
        break;
      }
      case 'tile': {
        const area = a * b;
        const tileArea = Math.max(0.25, c);
        const rawTiles = area / tileArea;
        res.push({ label: 'Total Floor Area', value: `${area.toFixed(1)} sq ft`, highlight: true });
        res.push({ label: 'Tiles (+10% Wastage)', value: `${Math.ceil(rawTiles * 1.1).toLocaleString()} Tiles` });
        break;
      }
      case 'paint': {
        const area = a * b * c;
        res.push({ label: 'Total Coated Area', value: `${area.toFixed(1)} sq ft`, highlight: true });
        res.push({ label: 'Paint Needed (~100 sq ft/L)', value: `${(area / 100).toFixed(1)} Liters` });
        break;
      }
      case 'cgpa': {
        const pct = a * b;
        res.push({ label: 'Equivalent Percentage', value: `${Math.min(100, pct).toFixed(2)}%`, highlight: true });
        break;
      }
      default: {
        res.push({ label: 'Product (A × B)', value: (a * b).toLocaleString(), highlight: true });
        res.push({ label: 'Sum (A + B + C)', value: (a + b + c).toLocaleString() });
        res.push({ label: 'Average', value: ((a + b + c) / 3).toFixed(2) });
      }
    }

    setResults(res);
  }, [val1, val2, val3, date1, date2, cidrInput, chmodBits, formula]);

  const getFieldLabels = (): [string, string?, string?] => {
    switch (formula) {
      case 'sip': return ['Monthly SIP Investment (₹)', 'Expected Annual Return (%)', 'Investment Duration (Years)'];
      case 'emi': return ['Loan Amount (₹)', 'Interest Rate (% p.a.)', 'Loan Tenure (Years)'];
      case 'compound':
      case 'simple-interest': return ['Principal Amount (₹)', 'Annual Rate (%)', 'Tenure (Years)'];
      case 'bmr': return ['Weight (kg)', 'Height (cm)', 'Age (Years)'];
      case 'profit': return ['Cost Price (₹)', 'Selling Price (₹)'];
      case 'discount': return ['Original Price (₹)', 'Discount (%)'];
      case 'markup-target': return ['Cost Price (₹)', 'Markup / Margin (%)'];
      case 'percent-of': return ['Percentage (%)', 'Base Number'];
      case 'percentage': return ['Part Value', 'Total Value'];
      case 'aspect-ratio': return ['Source Width (px)', 'Source Height (px)', 'Target Width (px)'];
      case 'dpi': return ['Screen Width (px)', 'Screen Height (px)', 'Diagonal Size (in)'];
      case 'clamp': return ['Min Font Size (px)', 'Max Font Size (px)', 'Max Viewport (px)'];
      case 'circle':
      case 'sphere': return [`Radius${unitSuffix}`];
      case 'cube': return [`Side Length${unitSuffix}`];
      case 'rectangle':
      case 'brick': return [`Length / Width${unitSuffix}`, `Height / Breadth${unitSuffix}`];
      case 'triangle':
      case 'pythagoras': return [`Base / Side A${unitSuffix}`, `Height / Side B${unitSuffix}`];
      case 'cylinder':
      case 'cone': return [`Radius${unitSuffix}`, `Height${unitSuffix}`];
      case 'quadratic': return ['Coefficient a (x²)', 'Coefficient b (x)', 'Constant c'];
      case 'ohms': return ['Current I (Amperes)', 'Resistance R (Ohms)'];
      case 'kinetic': return ['Mass m (kg)', 'Velocity v (m/s)'];
      case 'potential': return ['Mass m (kg)', 'Height h (m)', 'Gravity g (m/s²)'];
      case 'force': return ['Mass m (kg)', 'Acceleration a (m/s²)'];
      case 'speed': return ['Distance', 'Time (Hours)'];
      case 'concrete': return ['Length (ft)', 'Width (ft)', 'Slab Thickness (ft)'];
      case 'tile': return ['Room Length (ft)', 'Room Width (ft)', 'Tile Area (sq ft)'];
      case 'paint': return ['Wall Width (ft)', 'Wall Height (ft)', 'Number of Coats'];
      case 'cgpa': return ['Your CGPA / Score', 'Multiplier (e.g. 9.5)'];
      default: return ['Input Value A', 'Input Value B', 'Input Value C'];
    }
  };

  const [label1, label2, label3] = getFieldLabels();
  const isLoanOrSip = formula === 'emi' || formula === 'sip';

  const toggleChmodBit = (roleIdx: number, bitVal: number) => {
    setChmodBits((prev) => prev.map((v, idx) => (idx === roleIdx ? v ^ bitVal : v)));
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {formula === 'subnet' ? (
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            IPv4 CIDR Block (e.g. 192.168.1.0/24)
          </label>
          <input
            type="text"
            value={cidrInput}
            onChange={(e) => setCidrInput(e.target.value)}
            className="w-full max-w-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden"
          />
        </div>
      ) : formula === 'chmod' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Owner', 'Group', 'Public / Others'].map((role, rIdx) => (
            <div key={role} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="text-xs font-bold text-neutral-900 dark:text-white">{role}</div>
              {[
                { label: 'Read (4)', bit: 4 },
                { label: 'Write (2)', bit: 2 },
                { label: 'Execute (1)', bit: 1 },
              ].map((perm) => (
                <label key={perm.label} className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input type="checkbox" checked={(chmodBits[rIdx] & perm.bit) !== 0} onChange={() => toggleChmodBit(rIdx, perm.bit)} />
                  {perm.label}
                </label>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {formula === 'date' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Date of Birth / Start Date</label>
                <input type="date" value={date1} onChange={(e) => setDate1(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Target Date / Today</label>
                <input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
              </div>
            </>
          ) : formula === 'bmi' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Weight (kg)</label>
                <input type="number" value={val1} onChange={(e) => setVal1(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Height (cm)</label>
                <input type="number" value={val2} onChange={(e) => setVal2(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
              </div>
            </>
          ) : formula === 'gst' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Base Amount (₹)</label>
                <input type="number" value={val1} onChange={(e) => setVal1(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">GST Slab (%)</label>
                <select value={val2} onChange={(e) => setVal2(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden">
                  <option value={3}>3% (Gold / Jewelry)</option>
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
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">{label1}</label>
                <input type="number" step="any" value={val1} onChange={(e) => setVal1(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
              </div>
              {label2 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">{label2}</label>
                  <input type="number" step="any" value={val2} onChange={(e) => setVal2(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
                </div>
              )}
              {label3 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">{label3}</label>
                  <input type="number" step="any" value={val3} onChange={(e) => setVal3(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono focus:outline-hidden" />
                </div>
              )}
            </>
          )}
        </div>
      )}

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
            <div className={`font-mono font-bold tracking-tight break-all ${r.highlight ? 'text-xl text-blue-600 dark:text-blue-400' : 'text-base'}`}>
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
