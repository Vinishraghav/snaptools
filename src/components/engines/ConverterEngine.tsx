'use client';

import React, { useEffect, useState } from 'react';
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

function detectUnitGroup(tool: ToolDef): string {
  if (tool.spec?.mode === 'unit-pair' && typeof tool.spec.group === 'string' && UNIT_GROUPS[tool.spec.group]) {
    return tool.spec.group;
  }
  if (tool.spec?.mode === 'base-pair') return 'number-base';

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
  if (slug.includes('area') || slug.includes('acre') || slug.includes('paper-size')) return 'area';
  return 'length';
}

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

  const [fromUnit, setFromUnit] = useState<string>(initialFrom);
  const [targetUnit, setTargetUnit] = useState<string>(initialTo);
  const [inputValue, setInputValue] = useState<number>(100);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const initialBase = typeof tool.spec?.fromBase === 'number' ? tool.spec.fromBase : 10;
  const initialToBase = typeof tool.spec?.toBase === 'number' ? tool.spec.toBase : 2;
  const [baseInput, setBaseInput] = useState<string>(
    initialBase === 16 ? 'FF' : initialBase === 2 ? '11111111' : initialBase === 8 ? '377' : '255'
  );
  const [sourceBase, setSourceBase] = useState<number>(initialBase);

  useEffect(() => {
    const type = detectUnitGroup(tool);
    if (type === 'number-base') {
      const fb = typeof tool.spec?.fromBase === 'number' ? tool.spec.fromBase : 10;
      setSourceBase(fb);
      setBaseInput(fb === 16 ? 'FF' : fb === 2 ? '11111111' : fb === 8 ? '377' : '255');
      return;
    }
    const grp = UNIT_GROUPS[type] || UNIT_GROUPS.length;
    const keys = Object.keys(grp.units);
    setFromUnit(typeof tool.spec?.from === 'string' && grp.units[tool.spec.from] ? tool.spec.from : keys[1] || keys[0]);
    setTargetUnit(typeof tool.spec?.to === 'string' && grp.units[tool.spec.to] ? tool.spec.to : keys[0]);
  }, [tool]);

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
