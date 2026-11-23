'use client';

import React, { useState } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { ArrowRightLeft, Ruler, Scale, Thermometer, HardDrive, Gauge, Copy, Check } from 'lucide-react';

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
    },
  },
  temperature: {
    name: 'Temperature',
    baseUnit: 'celsius',
    units: {
      celsius: (v, toBase) => v,
      fahrenheit: (v, toBase) => (toBase ? ((v - 32) * 5) / 9 : (v * 9) / 5 + 32),
      kelvin: (v, toBase) => (toBase ? v - 273.15 : v + 273.15),
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
    name: 'Area',
    baseUnit: 'sq_meter',
    units: {
      sq_meter: 1,
      sq_feet: 0.092903,
      acre: 4046.86,
      hectare: 10000,
      sq_km: 1000000,
    },
  },
};

export default function ConverterEngine({ tool }: { tool: ToolDef }) {
  // Detect group from tool slug
  let detectedType = 'length';
  const slug = tool.slug;
  if (slug.includes('weight') || slug.includes('mass') || slug.includes('gold-weight')) detectedType = 'weight';
  else if (slug.includes('temperature') || slug.includes('oven')) detectedType = 'temperature';
  else if (slug.includes('storage') || slug.includes('download-time') || slug.includes('bandwidth')) detectedType = 'storage';
  else if (slug.includes('speed') || slug.includes('mileage')) detectedType = 'speed';
  else if (slug.includes('area') || slug.includes('feet-to-meter') || slug.includes('acre')) detectedType = 'area';

  const group = UNIT_GROUPS[detectedType] || UNIT_GROUPS.length;
  const unitKeys = Object.keys(group.units);

  const [fromUnit, setFromUnit] = useState<string>(unitKeys[1] || unitKeys[0]);
  const [inputValue, setInputValue] = useState<number>(100);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute base value
  const toBaseValue = (val: number, unit: string): number => {
    const factor = group.units[unit];
    if (typeof factor === 'function') {
      return factor(val, true);
    }
    return val * (factor || 1);
  };

  // Compute target value from base
  const fromBaseValue = (baseVal: number, unit: string): number => {
    const factor = group.units[unit];
    if (typeof factor === 'function') {
      return factor(baseVal, false);
    }
    return baseVal / (factor || 1);
  };

  const baseVal = toBaseValue(inputValue, fromUnit);

  const handleCopy = (valStr: string, key: string) => {
    navigator.clipboard.writeText(valStr);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* Primary Input row */}
      <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            Enter Value to Convert
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            Source Unit
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
      </div>

      {/* Simultaneous All-Unit Conversion Matrix */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Simultaneous Multi-Unit Output Matrix
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {unitKeys.map((u) => {
            const converted = fromBaseValue(baseVal, u);
            const formatted =
              Math.abs(converted) < 0.0001 || Math.abs(converted) > 1000000
                ? converted.toExponential(4)
                : Number(converted.toFixed(6)).toString();

            const isCurrent = u === fromUnit;

            return (
              <div
                key={u}
                onClick={() => handleCopy(formatted, u)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/40'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium text-neutral-500 capitalize">{u.replace(/_/g, ' ')}</div>
                  <div className="text-base font-mono font-bold text-neutral-900 dark:text-white mt-0.5">
                    {formatted}
                  </div>
                </div>
                <div className="text-neutral-400 group-hover:text-blue-500">
                  {copiedKey === u ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
