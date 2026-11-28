'use client';

import React, { useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Copy, Check, ArrowLeftRight } from 'lucide-react';

interface UnitGroup {
  name: string;
  baseUnit: string;
  units: Record<string, number | ((val: number, toBase: boolean) => number)>;
}

const UNIT_GROUPS: Record<string, UnitGroup> = {
  length: {
    name: 'Length',
    baseUnit: 'meter',
    units: {
      millimeter: 0.001,
      centimeter: 0.01,
      meter: 1,
      kilometer: 1000,
      inch: 0.0254,
      foot: 0.3048,
      yard: 0.9144,
      mile: 1609.344,
    },
  },
  weight: {
    name: 'Weight / Mass',
    baseUnit: 'kilogram',
    units: {
      milligram: 0.000001,
      gram: 0.001,
      kilogram: 1,
      metric_ton: 1000,
      ounce: 0.0283495,
      pound: 0.453592,
      tola_india: 0.0116638,
      troy_ounce: 0.0311035,
      carat: 0.0002,
    },
  },
  temperature: {
    name: 'Temperature',
    baseUnit: 'celsius',
    units: {
      celsius: (v) => v,
      fahrenheit: (v, toBase) => (toBase ? ((v - 32) * 5) / 9 : (v * 9) / 5 + 32),
      kelvin: (v, toBase) => (toBase ? v - 273.15 : v + 273.15),
    },
  },
  volume: {
    name: 'Volume / Liquid',
    baseUnit: 'liter',
    units: {
      milliliter: 0.001,
      teaspoon_tsp: 0.00492892,
      tablespoon_tbsp: 0.0147868,
      cup_us: 0.236588,
      pint_us: 0.473176,
      quart_us: 0.946353,
      liter: 1,
      gallon_us: 3.78541,
      cubic_meter: 1000,
    },
  },
  storage: {
    name: 'Digital Storage',
    baseUnit: 'megabyte',
    units: {
      bit: 1 / (8 * 1024 * 1024),
      byte: 1 / (1024 * 1024),
      kilobyte: 1 / 1024,
      megabyte: 1,
      gigabyte: 1024,
      terabyte: 1024 * 1024,
      petabyte: 1024 * 1024 * 1024,
    },
  },
  transfer: {
    name: 'Data Transfer Rate',
    baseUnit: 'mbps',
    units: {
      bps: 0.000001,
      kbps: 0.001,
      mbps: 1,
      gbps: 1000,
      KB_per_sec: 0.008,
      MB_per_sec: 8,
      GB_per_sec: 8000,
    },
  },
  time: {
    name: 'Time',
    baseUnit: 'second',
    units: {
      nanosecond: 1e-9,
      microsecond: 1e-6,
      millisecond: 0.001,
      second: 1,
      minute: 60,
      hour: 3600,
      day: 86400,
      week: 604800,
      year_365: 31536000,
    },
  },
  speed: {
    name: 'Speed',
    baseUnit: 'km_h',
    units: {
      km_h: 1,
      mph: 1.60934,
      m_s: 3.6,
      knot: 1.852,
      mach: 1234.8,
    },
  },
  area: {
    name: 'Area & Land',
    baseUnit: 'sq_meter',
    units: {
      sq_millimeter: 0.000001,
      sq_centimeter: 0.0001,
      sq_feet: 0.092903,
      sq_yard_gaj: 0.836127,
      sq_meter: 1,
      cent: 40.4686,
      ground: 222.967,
      guntha: 101.1714,
      bigha: 2529.285,
      decimal: 40.4686,
      kanal: 505.857,
      marla: 25.2929,
      biswa: 126.46,
      katha: 126.44,
      ankadam: 6.689,
      acre: 4046.86,
      hectare: 10000,
      sq_km: 1000000,
    },
  },
  pressure: {
    name: 'Pressure',
    baseUnit: 'kilopascal',
    units: {
      pascal: 0.001,
      kilopascal: 1,
      bar: 100,
      psi: 6.89476,
      atm: 101.325,
      mmHg_torr: 0.133322,
    },
  },
  energy: {
    name: 'Energy',
    baseUnit: 'kilojoule',
    units: {
      joule: 0.001,
      kilojoule: 1,
      calorie: 0.004184,
      kilocalorie_kcal: 4.184,
      watt_hour: 3.6,
      kilowatt_hour_kWh: 3600,
      btu: 1.05506,
    },
  },
  power: {
    name: 'Power',
    baseUnit: 'watt',
    units: {
      watt: 1,
      kilowatt: 1000,
      megawatt: 1000000,
      horsepower_hp: 745.7,
      btu_per_hour: 0.293071,
    },
  },
  force: {
    name: 'Force',
    baseUnit: 'newton',
    units: {
      dyne: 0.00001,
      newton: 1,
      kilonewton: 1000,
      kgf: 9.80665,
      pound_force_lbf: 4.44822,
    },
  },
  torque: {
    name: 'Torque',
    baseUnit: 'newton_meter',
    units: {
      newton_meter: 1,
      lb_ft: 1.35582,
      kgf_meter: 9.80665,
    },
  },
  density: {
    name: 'Density',
    baseUnit: 'kg_per_m3',
    units: {
      kg_per_m3: 1,
      g_per_cm3: 1000,
      lb_per_ft3: 16.0185,
    },
  },
  angle: {
    name: 'Angle',
    baseUnit: 'degree',
    units: {
      degree: 1,
      radian: 180 / Math.PI,
      gradian: 0.9,
      arcminute: 1 / 60,
    },
  },
  frequency: {
    name: 'Frequency',
    baseUnit: 'hertz_hz',
    units: {
      hertz_hz: 1,
      kilohertz_khz: 1000,
      megahertz_mhz: 1000000,
      gigahertz_ghz: 1000000000,
    },
  },
  typography: {
    name: 'Typography / Pixels',
    baseUnit: 'px_96dpi',
    units: {
      px_96dpi: 1,
      pt_point: 96 / 72,
      em_16px: 16,
      millimeter: 96 / 25.4,
      centimeter: 96 / 2.54,
      inch: 96,
    },
  },
  charge: {
    name: 'Electric Charge',
    baseUnit: 'mAh',
    units: {
      coulomb: 1 / 3.6,
      mAh: 1,
      Ah: 1000,
      faraday: 26801480,
    },
  },
  fuel: {
    name: 'Fuel Economy',
    baseUnit: 'km_per_liter',
    units: {
      km_per_liter: 1,
      mpg_us: 0.425144,
      mpg_uk: 0.354006,
      liters_per_100km: (v) => (v > 0 ? 100 / v : 0),
    },
  },
  astronomical: {
    name: 'Astronomical Distance',
    baseUnit: 'kilometer',
    units: {
      kilometer: 1,
      au_astronomical_unit: 149597870.7,
      light_year: 9.4607e12,
      parsec: 3.0857e13,
    },
  },
};

const TIMEZONES: Record<string, { label: string; offsetMin: number }> = {
  IST: { label: 'IST (India UTC+5:30)', offsetMin: 330 },
  UTC: { label: 'UTC (Universal Time)', offsetMin: 0 },
  GMT: { label: 'GMT (London UTC+0)', offsetMin: 0 },
  EST: { label: 'EST (US East UTC-5)', offsetMin: -300 },
  EDT: { label: 'EDT (US East DST UTC-4)', offsetMin: -240 },
  CST: { label: 'CST (US Central UTC-6)', offsetMin: -360 },
  MST: { label: 'MST (US Mountain UTC-7)', offsetMin: -420 },
  PST: { label: 'PST (US Pacific UTC-8)', offsetMin: -480 },
  PDT: { label: 'PDT (US Pacific DST UTC-7)', offsetMin: -420 },
  CET: { label: 'CET (Europe UTC+1)', offsetMin: 60 },
  GST: { label: 'GST (Dubai/UAE UTC+4)', offsetMin: 240 },
  SGT: { label: 'SGT (Singapore UTC+8)', offsetMin: 480 },
  HKT: { label: 'HKT (Hong Kong UTC+8)', offsetMin: 480 },
  JST: { label: 'JST (Tokyo UTC+9)', offsetMin: 540 },
  AEST: { label: 'AEST (Sydney UTC+10)', offsetMin: 600 },
  NZST: { label: 'NZST (Auckland UTC+12)', offsetMin: 720 },
  BRT: { label: 'BRT (Brazil UTC-3)', offsetMin: -180 },
};

function formatTzMinutes(utcMinutes: number, targetOffset: number): { hhmm: string; ampm: string; dayShift: string } {
  const raw = utcMinutes + targetOffset;
  const dayOffset = Math.floor(raw / 1440);
  const minsInDay = ((raw % 1440) + 1440) % 1440;
  const h24 = Math.floor(minsInDay / 60);
  const m = minsInDay % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hhmm = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const ampm = `${h12}:${String(m).padStart(2, '0')} ${period}`;
  const dayShift = dayOffset > 0 ? 'Next Day (+1d)' : dayOffset < 0 ? 'Previous Day (-1d)' : 'Same Day';
  return { hhmm, ampm, dayShift };
}

function detectUnitGroup(tool: ToolDef): string {
  if (tool.spec?.mode === 'unit-pair' && typeof tool.spec.group === 'string' && UNIT_GROUPS[tool.spec.group]) {
    return tool.spec.group;
  }
  if (tool.spec?.mode === 'base-pair') return 'number-base';
  if (tool.spec?.mode === 'timezone' || tool.slug.includes('timezone') || tool.slug.includes('time-zone')) return 'timezone';

  const slug = tool.slug;
  if (slug.includes('number-base') || slug.includes('bin-oct-dec-hex')) return 'number-base';
  if (slug.includes('transfer-rate') || slug.includes('bandwidth')) return 'transfer';
  if (slug.includes('binary-vs-decimal') || slug.includes('storage') || slug.includes('download-time')) return 'storage';
  if (slug.includes('volume') || slug.includes('cooking') || slug.includes('butter-flour') || slug.includes('flow-rate')) return 'volume';
  if (slug.includes('time-converter') || slug.includes('beat-rate')) return 'time';
  if (slug.includes('pressure')) return 'pressure';
  if (slug.includes('energy')) return 'energy';
  if (slug.includes('power')) return 'power';
  if (slug.includes('force') || slug.includes('acceleration')) return 'force';
  if (slug.includes('torque')) return 'torque';
  if (slug.includes('density') || slug.includes('concentration')) return 'density';
  if (slug.includes('angle')) return 'angle';
  if (slug.includes('frequency') || slug.includes('wavelength')) return 'frequency';
  if (slug.includes('typography') || slug.includes('pixels-to')) return 'typography';
  if (slug.includes('charge') || slug.includes('inductance')) return 'charge';
  if (slug.includes('fuel') || slug.includes('mileage')) return 'fuel';
  if (slug.includes('astronomical')) return 'astronomical';
  if (slug.includes('weight') || slug.includes('mass') || slug.includes('gold') || slug.includes('carat') || slug.includes('yarn')) return 'weight';
  if (slug.includes('temperature') || slug.includes('oven')) return 'temperature';
  if (slug.includes('speed') || slug.includes('wind-speed')) return 'speed';
  if (
    slug.includes('area') ||
    slug.includes('acre') ||
    slug.includes('land') ||
    slug.includes('cent') ||
    slug.includes('ground') ||
    slug.includes('bigha') ||
    slug.includes('guntha') ||
    slug.includes('kanal') ||
    slug.includes('marla') ||
    slug.includes('katha') ||
    slug.includes('ankanam') ||
    slug.includes('ankadam') ||
    slug.includes('hectare') ||
    slug.includes('sq-feet') ||
    slug.includes('sqft') ||
    slug.includes('paper-size')
  ) {
    return 'area';
  }
  return 'length';
}

interface BighaStatePreset {
  id: string;
  label: string;
  sqFtPerBigha: number;
  sqFtPerKatha: number;
}

const BIGHA_STATES: BighaStatePreset[] = [
  { id: 'up-pucca', label: 'Uttar Pradesh (Pucca: 27,225 sq ft)', sqFtPerBigha: 27225, sqFtPerKatha: 1361.25 },
  { id: 'rajasthan', label: 'Rajasthan (17,424 sq ft)', sqFtPerBigha: 17424, sqFtPerKatha: 871.2 },
  { id: 'wb', label: 'West Bengal (14,400 sq ft)', sqFtPerBigha: 14400, sqFtPerKatha: 720 },
  { id: 'gujarat', label: 'Gujarat (17,424 sq ft)', sqFtPerBigha: 17424, sqFtPerKatha: 871.2 },
  { id: 'bihar', label: 'Bihar / Jharkhand (27,220 sq ft)', sqFtPerBigha: 27220, sqFtPerKatha: 1361 },
  { id: 'punjab', label: 'Punjab / Haryana (10,890 sq ft)', sqFtPerBigha: 10890, sqFtPerKatha: 544.5 },
  { id: 'assam', label: 'Assam (14,400 sq ft)', sqFtPerBigha: 14400, sqFtPerKatha: 2880 },
  { id: 'hp', label: 'Himachal / Uttarakhand (8,712 sq ft)', sqFtPerBigha: 8712, sqFtPerKatha: 435.6 },
];

const SQM_PER_SQFT = 0.09290304;

function formatNum(n: number): string {
  if (n === 0) return '0';
  if (!isFinite(n)) return '0';
  return Math.abs(n) < 0.0001 || Math.abs(n) > 1000000
    ? n.toExponential(4)
    : Number(n.toFixed(6)).toString();
}

export default function ConverterEngine({ tool }: { tool: ToolDef }) {
  const detectedType = detectUnitGroup(tool);
  const isNumberBase = detectedType === 'number-base';
  const isTimezone = detectedType === 'timezone';

  const group = UNIT_GROUPS[detectedType] || UNIT_GROUPS.length;
  const unitKeys = Object.keys(group.units);

  const initialFrom =
    typeof tool.spec?.from === 'string' && group.units[tool.spec.from]
      ? tool.spec.from
      : unitKeys[1] || unitKeys[0];
  const initialTo =
    typeof tool.spec?.to === 'string' && group.units[tool.spec.to]
      ? tool.spec.to
      : unitKeys[0];
  const initialVal = typeof tool.spec?.defaultVal === 'number' ? tool.spec.defaultVal : 100;

  const [fromUnit, setFromUnit] = useState<string>(initialFrom);
  const [targetUnit, setTargetUnit] = useState<string>(initialTo);
  const [inputValue, setInputValue] = useState<number>(initialVal);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [fromTz, setFromTz] = useState<string>(
    typeof tool.spec?.fromTz === 'string' && TIMEZONES[tool.spec.fromTz] ? tool.spec.fromTz : 'EST'
  );
  const [toTz, setToTz] = useState<string>(
    typeof tool.spec?.toTz === 'string' && TIMEZONES[tool.spec.toTz] ? tool.spec.toTz : 'IST'
  );
  const [tzTime, setTzTime] = useState<string>(
    typeof tool.spec?.defaultTime === 'string' ? tool.spec.defaultTime : '09:00'
  );

  const initialBase = typeof tool.spec?.fromBase === 'number' ? tool.spec.fromBase : 10;
  const initialToBase = typeof tool.spec?.toBase === 'number' ? tool.spec.toBase : 2;
  const [baseInput, setBaseInput] = useState<string>(
    initialBase === 16 ? 'FF' : initialBase === 2 ? '11111111' : initialBase === 8 ? '377' : '255'
  );
  const [sourceBase, setSourceBase] = useState<number>(initialBase);

  const [bighaStateId, setBighaStateId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('bigha');
      if (p && BIGHA_STATES.some((s) => s.id === p)) return p;
    }
    return 'up-pucca';
  });
  const [landValue, setLandValue] = useState<number>(() => {
    if (tool.slug.includes('acre')) return 1;
    if (typeof tool.spec?.defaultVal === 'number') return tool.spec.defaultVal;
    return 1;
  });
  const [landFromKey, setLandFromKey] = useState<string>(() => {
    const s = tool.slug.toLowerCase();
    if (s.includes('cent-to') || s.startsWith('cent')) return 'cent';
    if (s.includes('ground-to') || s.startsWith('ground')) return 'ground';
    if (s.includes('bigha-to') || s.startsWith('bigha')) return 'bigha';
    if (s.includes('guntha-to') || s.startsWith('guntha')) return 'guntha';
    if (s.includes('hectare-to') || s.startsWith('hectare')) return 'hectare';
    if (s.includes('sq-feet') || s.includes('sq-ft') || s.includes('sqft')) return 'sqft';
    if (s.includes('acre')) return 'acre';
    return 'acre';
  });
  const [plotWidthFt, setPlotWidthFt] = useState<number>(40);
  const [plotLengthFt, setPlotLengthFt] = useState<number>(60);

  const toBaseValue = (val: number, unit: string): number => {
    const factor = group.units[unit];
    if (typeof factor === 'function') return factor(val, true);
    return val * (factor || 1);
  };

  const fromBaseValue = (baseVal: number, unit: string): number => {
    const factor = group.units[unit];
    if (typeof factor === 'function') return factor(baseVal, false);
    return baseVal / (factor || 1);
  };

  const baseVal = toBaseValue(inputValue, fromUnit);
  const directConverted = formatNum(fromBaseValue(baseVal, targetUnit));

  const handleSwapUnits = () => {
    setFromUnit(targetUnit);
    setTargetUnit(fromUnit);
  };

  const handleCopy = (valStr: string, key: string) => {
    navigator.clipboard.writeText(valStr);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (isTimezone) {
    const [hhStr, mmStr] = (tzTime || '09:00').split(':');
    const inMins = (Number(hhStr) || 0) * 60 + (Number(mmStr) || 0);
    const utcMins = inMins - (TIMEZONES[fromTz]?.offsetMin || 0);
    const direct = formatTzMinutes(utcMins, TIMEZONES[toTz]?.offsetMin || 0);
    return (
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Time (24h)</label>
            <input
              type="time"
              value={tzTime}
              onChange={(e) => setTzTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg font-mono font-bold focus:outline-hidden"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">From Time Zone</label>
            <select
              value={fromTz}
              onChange={(e) => setFromTz(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold focus:outline-hidden"
            >
              {Object.entries(TIMEZONES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1 flex justify-center pb-1">
            <button
              type="button"
              onClick={() => { setFromTz(toTz); setToTz(fromTz); }}
              title="Swap Time Zones"
              className="p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-500 transition"
            >
              <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">To Time Zone</label>
            <select
              value={toTz}
              onChange={(e) => setToTz(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold focus:outline-hidden"
            >
              {Object.entries(TIMEZONES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          onClick={() => handleCopy(`${direct.ampm} ${toTz} (${direct.dayShift})`, 'tz-spotlight')}
          className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/30 cursor-pointer flex items-center justify-between gap-4"
        >
          <div>
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {tzTime} {fromTz} =
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {direct.ampm}{' '}
              <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                ({direct.hhmm} {toTz} &bull; {direct.dayShift})
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-600 shrink-0">
            {copiedKey === 'tz-spotlight' ? 'Copied' : 'Copy'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(TIMEZONES).map(([code, tz]) => {
            const conv = formatTzMinutes(utcMins, tz.offsetMin);
            const active = code === toTz;
            return (
              <div
                key={code}
                onClick={() => handleCopy(`${conv.ampm} ${code}`, code)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40'
                }`}
              >
                <div className="text-[11px] font-medium text-neutral-500">{tz.label}</div>
                <div className="text-base font-mono font-bold text-neutral-900 dark:text-white mt-0.5">{conv.ampm}</div>
                <div className="text-[10px] text-neutral-400">{conv.hhmm} &bull; {conv.dayShift}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (detectedType === 'area') {
    const activeState = BIGHA_STATES.find((s) => s.id === bighaStateId) || BIGHA_STATES[0];
    const landUnits: Array<{ key: string; label: string; sqFtFactor: number; hint: string }> = [
      { key: 'sqft', label: 'Square Feet (Sq. Ft.)', sqFtFactor: 1, hint: 'Base standard' },
      { key: 'sqm', label: 'Square Meters (Sq. m)', sqFtFactor: 10.7639104167, hint: 'Metric SI' },
      { key: 'acre', label: 'Acres', sqFtFactor: 43560, hint: '43,560 sq ft' },
      { key: 'hectare', label: 'Hectares', sqFtFactor: 107639.104167, hint: '10,000 sq m' },
      { key: 'cent', label: 'Cents', sqFtFactor: 435.6, hint: '1/100 Acre' },
      { key: 'ground', label: 'Grounds', sqFtFactor: 2400, hint: '2,400 sq ft (TN)' },
      { key: 'ankanam', label: 'Ankanam', sqFtFactor: 72, hint: '72 sq ft (AP/TS)' },
      { key: 'guntha', label: 'Guntha / Gunta', sqFtFactor: 1089, hint: '1,089 sq ft (MH/KA/GJ)' },
      { key: 'bigha', label: `Bigha (${activeState.label.split(' (')[0]})`, sqFtFactor: activeState.sqFtPerBigha, hint: `${activeState.sqFtPerBigha.toLocaleString()} sq ft` },
      { key: 'kanal', label: 'Kanal', sqFtFactor: 5445, hint: '5,445 sq ft (North India)' },
      { key: 'marla', label: 'Marla', sqFtFactor: 272.25, hint: '272.25 sq ft (1/20 Kanal)' },
      { key: 'katha', label: `Katha (${activeState.label.split(' (')[0]})`, sqFtFactor: activeState.sqFtPerKatha, hint: `${activeState.sqFtPerKatha.toLocaleString()} sq ft` },
    ];

    const fromUnitObj = landUnits.find((u) => u.key === landFromKey) || landUnits[2];
    const totalSqFt = (Number.isFinite(landValue) ? landValue : 0) * fromUnitObj.sqFtFactor;
    const sqSideFt = Math.sqrt(Math.max(0, totalSqFt));
    const sqSideM = Math.sqrt(Math.max(0, totalSqFt * SQM_PER_SQFT));
    const centsVal = totalSqFt / 435.6;
    const groundsVal = totalSqFt / 2400;

    return (
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
              Unified Indian Land &amp; Area Conversion Matrix
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Convert simultaneously across Sq Ft, Cents, Grounds, Acres, Guntha, Kanal, Marla, Katha &amp; state-wise Bigha.
            </p>
          </div>
          <div className="w-full md:w-72">
            <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
              Bigha / Katha State Standard
            </label>
            <select
              value={bighaStateId}
              onChange={(e) => setBighaStateId(e.target.value)}
              aria-label="Select state Bigha standard"
              className="w-full min-h-[44px] px-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-bold text-neutral-900 dark:text-white cursor-pointer"
            >
              {BIGHA_STATES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Input Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Area Value</label>
            <input
              type="number"
              min={0}
              step="any"
              value={landValue}
              onChange={(e) => setLandValue(parseFloat(e.target.value) || 0)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-2xl font-mono font-bold text-neutral-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Input Unit</label>
            <select
              value={landFromKey}
              onChange={(e) => setLandFromKey(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-900 dark:text-white cursor-pointer"
            >
              {landUnits.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Plot Dimension Equivalency Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 space-y-3">
          <div className="text-sm sm:text-base font-extrabold text-emerald-900 dark:text-emerald-200">
            {landValue.toLocaleString()} {fromUnitObj.label} ={' '}
            {Math.round(totalSqFt).toLocaleString()} Sq. Ft. &asymp;{' '}
            {Number(centsVal.toFixed(2)).toLocaleString()} Cents &asymp;{' '}
            {Number(groundsVal.toFixed(2)).toLocaleString()} Grounds
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-700 dark:text-neutral-300">
            <span>
              Equivalent square plot dimensions:{' '}
              <strong className="font-mono">
                {sqSideFt.toFixed(1)} ft &times; {sqSideFt.toFixed(1)} ft
              </strong>{' '}
              ({sqSideM.toFixed(1)} m &times; {sqSideM.toFixed(1)} m)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-neutral-500">Custom Plot:</span>
              <input
                type="number"
                min={1}
                value={plotWidthFt}
                onChange={(e) => setPlotWidthFt(Number(e.target.value) || 0)}
                aria-label="Plot width in feet"
                className="w-20 min-h-[36px] px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-center"
              />
              <span>&times;</span>
              <input
                type="number"
                min={1}
                value={plotLengthFt}
                onChange={(e) => setPlotLengthFt(Number(e.target.value) || 0)}
                aria-label="Plot length in feet"
                className="w-20 min-h-[36px] px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-center"
              />
              <span>ft</span>
              <button
                type="button"
                onClick={() => {
                  setLandFromKey('sqft');
                  setLandValue(plotWidthFt * plotLengthFt);
                }}
                className="min-h-[36px] px-3 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer hover:bg-emerald-700 transition"
              >
                Apply {(plotWidthFt * plotLengthFt).toLocaleString()} Sq Ft
              </button>
            </div>
          </div>
        </div>

        {/* Simultaneous All-Unit Conversion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {landUnits.map((u) => {
            const outVal = formatNum(totalSqFt / u.sqFtFactor);
            const isSelected = u.key === landFromKey;
            return (
              <button
                key={u.key}
                type="button"
                onClick={() => handleCopy(`${outVal} ${u.label}`, `land-${u.key}`)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                  <span className="font-bold text-neutral-700 dark:text-neutral-200">{u.label}</span>
                  <span>{copiedKey === `land-${u.key}` ? 'Copied!' : u.hint}</span>
                </div>
                <div className="text-xl font-mono font-extrabold text-neutral-900 dark:text-white truncate">
                  {outVal}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (isNumberBase) {
    const parsedDec = parseInt(baseInput.trim(), sourceBase);
    const isValid = !isNaN(parsedDec);
    const bases = [
      { label: 'Binary (Base 2)', base: 2 },
      { label: 'Octal (Base 8)', base: 8 },
      { label: 'Decimal (Base 10)', base: 10 },
      { label: 'Hexadecimal (Base 16)', base: 16 },
      { label: 'Base 36', base: 36 },
    ];

    return (
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Input Number
            </label>
            <input
              type="text"
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Input Base (Radix)
            </label>
            <select
              value={sourceBase}
              onChange={(e) => setSourceBase(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold focus:outline-hidden"
            >
              {bases.map((b) => (
                <option key={b.base} value={b.base}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bases.map((b) => {
            const val = isValid ? parsedDec.toString(b.base).toUpperCase() : 'Invalid Input';
            const isHighlighted = b.base === initialToBase;
            return (
              <div
                key={b.base}
                onClick={() => isValid && handleCopy(val, String(b.base))}
                className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                  isHighlighted
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/60 hover:border-blue-500'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-medium text-neutral-500">{b.label}</div>
                  <div className="text-base font-mono font-bold text-neutral-900 dark:text-white break-all mt-0.5">
                    {val}
                  </div>
                </div>
                {copiedKey === String(b.base) ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Direct From -> To Converter Controls */}
      <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            Enter {group.name} Value
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            From Unit
          </label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold capitalize focus:outline-hidden"
          >
            {unitKeys.map((u) => (
              <option key={u} value={u}>
                {u.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1 flex justify-center pb-1">
          <button
            type="button"
            onClick={handleSwapUnits}
            title="Swap Units"
            className="p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-500 transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            To Unit
          </label>
          <select
            value={targetUnit}
            onChange={(e) => setTargetUnit(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold capitalize focus:outline-hidden"
          >
            {unitKeys.map((u) => (
              <option key={u} value={u}>
                {u.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Direct Result Spotlight */}
      <div
        onClick={() => handleCopy(directConverted, 'direct-spotlight')}
        className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/30 cursor-pointer flex items-center justify-between gap-4 hover:shadow-md transition"
      >
        <div>
          <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 capitalize">
            {inputValue} {fromUnit.replace(/_/g, ' ')} =
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {directConverted}{' '}
            <span className="text-sm font-semibold capitalize text-neutral-600 dark:text-neutral-400">
              {targetUnit.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 shrink-0">
          {copiedKey === 'direct-spotlight' ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy Result
            </>
          )}
        </div>
      </div>

      {/* Full Unit Matrix */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Complete {group.name} Conversion Matrix
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {unitKeys.map((u) => {
            const formatted = formatNum(fromBaseValue(baseVal, u));
            const isTarget = u === targetUnit;
            const isCurrent = u === fromUnit;

            return (
              <div
                key={u}
                onClick={() => handleCopy(formatted, u)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                  isTarget
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30'
                    : isCurrent
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/40'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-medium text-neutral-500 capitalize">
                    {u.replace(/_/g, ' ')}
                  </div>
                  <div className="text-base font-mono font-bold text-neutral-900 dark:text-white mt-0.5 truncate">
                    {formatted}
                  </div>
                </div>
                <div className="text-neutral-400 group-hover:text-blue-500 shrink-0">
                  {copiedKey === u ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
