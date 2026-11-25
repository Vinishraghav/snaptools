import type { CompactToolSeed, ToolEngine, ToolSpec } from './expandedToolsBuilder';

type AddFn = (
  list: CompactToolSeed[],
  seenSlugs: Set<string>,
  nextId: { value: number },
  slug: string,
  title: string,
  category: string,
  engine: ToolEngine,
  spec?: ToolSpec
) => void;

export function appendDailyUtilityTools(
  list: CompactToolSeed[],
  seenSlugs: Set<string>,
  nextId: { value: number },
  add: AddFn
) {
  // =========================================================================
  // 9A. EXPANDED INDIAN LAND UNITS PAIRWISE CONVERTERS
  // =========================================================================
  const allAreaUnits: [string, string, string][] = [
    ['sq_feet', 'sq-feet', 'Square Feet'],
    ['sq_yard_gaj', 'sq-yard-gaj', 'Square Yard (Gaj)'],
    ['sq_meter', 'sq-meter', 'Square Meter'],
    ['cent', 'cent', 'Cent'],
    ['ground', 'ground', 'Ground'],
    ['guntha', 'guntha', 'Guntha'],
    ['bigha', 'bigha', 'Bigha'],
    ['decimal', 'decimal', 'Decimal'],
    ['kanal', 'kanal', 'Kanal'],
    ['marla', 'marla', 'Marla'],
    ['biswa', 'biswa', 'Biswa'],
    ['katha', 'katha', 'Katha'],
    ['ankadam', 'ankadam', 'Ankadam'],
    ['acre', 'acre', 'Acre'],
    ['hectare', 'hectare', 'Hectare'],
    ['sq_km', 'sq-km', 'Square Kilometer'],
  ];
  for (const [k1, s1, l1] of allAreaUnits) {
    for (const [k2, s2, l2] of allAreaUnits) {
      if (k1 === k2) continue;
      add(
        list,
        seenSlugs,
        nextId,
        `${s1}-to-${s2}-converter`,
        `${l1} to ${l2} Converter`,
        'construction-home-land-measurement',
        'converter',
        { mode: 'unit-pair', group: 'area', from: k1, to: k2 }
      );
    }
  }

  // =========================================================================
  // 9B. WORLD TIMEZONE PAIRS & MEETING HOUR CONVERTERS (~650 Tools)
  // =========================================================================
  const timeZones = ['IST', 'UTC', 'GMT', 'EST', 'EDT', 'CST', 'MST', 'PST', 'PDT', 'CET', 'GST', 'SGT', 'HKT', 'JST', 'AEST', 'NZST', 'BRT'];
  for (const tz1 of timeZones) {
    for (const tz2 of timeZones) {
      if (tz1 === tz2) continue;
      add(
        list,
        seenSlugs,
        nextId,
        `${tz1.toLowerCase()}-to-${tz2.toLowerCase()}-timezone-converter`,
        `${tz1} to ${tz2} Time Zone Converter`,
        'date-time-travel-utilities',
        'converter',
        { mode: 'timezone', fromTz: tz1, toTz: tz2, defaultTime: '09:00' }
      );
    }
  }
  const tzPairsPopular: [string, string][] = [
    ['EST', 'IST'], ['PST', 'IST'], ['UTC', 'IST'], ['GMT', 'IST'],
    ['CET', 'IST'], ['GST', 'IST'], ['SGT', 'IST'], ['JST', 'IST'],
    ['AEST', 'IST'], ['IST', 'EST'], ['IST', 'PST'], ['IST', 'UTC'],
    ['IST', 'GMT'], ['IST', 'GST'], ['CST', 'IST'], ['EDT', 'IST'],
  ];
  const tzHours = [
    { h: 6, slug: '6-am', label: '6 AM', t24: '06:00' },
    { h: 7, slug: '7-am', label: '7 AM', t24: '07:00' },
    { h: 8, slug: '8-am', label: '8 AM', t24: '08:00' },
    { h: 9, slug: '9-am', label: '9 AM', t24: '09:00' },
    { h: 10, slug: '10-am', label: '10 AM', t24: '10:00' },
    { h: 11, slug: '11-am', label: '11 AM', t24: '11:00' },
    { h: 12, slug: '12-pm', label: '12 PM', t24: '12:00' },
    { h: 13, slug: '1-pm', label: '1 PM', t24: '13:00' },
    { h: 14, slug: '2-pm', label: '2 PM', t24: '14:00' },
    { h: 15, slug: '3-pm', label: '3 PM', t24: '15:00' },
    { h: 16, slug: '4-pm', label: '4 PM', t24: '16:00' },
    { h: 17, slug: '5-pm', label: '5 PM', t24: '17:00' },
    { h: 18, slug: '6-pm', label: '6 PM', t24: '18:00' },
    { h: 19, slug: '7-pm', label: '7 PM', t24: '19:00' },
    { h: 20, slug: '8-pm', label: '8 PM', t24: '20:00' },
    { h: 21, slug: '9-pm', label: '9 PM', t24: '21:00' },
    { h: 22, slug: '10-pm', label: '10 PM', t24: '22:00' },
    { h: 23, slug: '11-pm', label: '11 PM', t24: '23:00' },
  ];
  for (const [fTz, tTz] of tzPairsPopular) {
    for (const hr of tzHours) {
      add(
        list,
        seenSlugs,
        nextId,
        `${hr.slug}-${fTz.toLowerCase()}-to-${tTz.toLowerCase()}-timezone`,
        `${hr.label} ${fTz} to ${tTz} Time Converter`,
        'date-time-travel-utilities',
        'converter',
        { mode: 'timezone', fromTz: fTz, toTz: tTz, defaultTime: hr.t24 }
      );
    }
  }

  // =========================================================================
  // 9C. QUICK-VALUE LANDMARK UNIT CONVERTERS (~4,800 Popular Search Pairs)
  // =========================================================================
  const quickValues = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30, 32,
    35, 36, 40, 45, 48, 50, 60, 64, 72, 75, 80, 90, 100, 120, 125, 128, 150,
    180, 200, 250, 256, 300, 350, 400, 500, 512, 600, 750, 800, 1000, 1024,
    1200, 1500, 2000, 2400, 2500, 3000, 4000, 5000, 10000,
  ];
  const topPairs: { group: string; from: string; to: string; slug: string; title: string; cat: string }[] = [
    { group: 'area', from: 'sq_feet', to: 'cent', slug: 'sq-feet-to-cent', title: 'Sq Ft to Cent', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_feet', to: 'ground', slug: 'sq-feet-to-ground', title: 'Sq Ft to Ground', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_feet', to: 'sq_meter', slug: 'sq-feet-to-sq-meter', title: 'Sq Ft to Sq Meter', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_feet', to: 'sq_yard_gaj', slug: 'sq-feet-to-gaj', title: 'Sq Ft to Gaj (Sq Yard)', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_feet', to: 'acre', slug: 'sq-feet-to-acre', title: 'Sq Ft to Acre', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_feet', to: 'guntha', slug: 'sq-feet-to-guntha', title: 'Sq Ft to Guntha', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_feet', to: 'marla', slug: 'sq-feet-to-marla', title: 'Sq Ft to Marla', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_feet', to: 'decimal', slug: 'sq-feet-to-decimal', title: 'Sq Ft to Decimal', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'cent', to: 'sq_feet', slug: 'cent-to-sq-feet', title: 'Cent to Sq Ft', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'ground', to: 'sq_feet', slug: 'ground-to-sq-feet', title: 'Ground to Sq Ft', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'acre', to: 'sq_feet', slug: 'acre-to-sq-feet', title: 'Acre to Sq Ft', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'acre', to: 'cent', slug: 'acre-to-cent', title: 'Acre to Cent', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'acre', to: 'bigha', slug: 'acre-to-bigha', title: 'Acre to Bigha', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'acre', to: 'guntha', slug: 'acre-to-guntha', title: 'Acre to Guntha', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'acre', to: 'hectare', slug: 'acre-to-hectare', title: 'Acre to Hectare', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'hectare', to: 'acre', slug: 'hectare-to-acre', title: 'Hectare to Acre', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'bigha', to: 'sq_feet', slug: 'bigha-to-sq-feet', title: 'Bigha to Sq Ft', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'guntha', to: 'sq_feet', slug: 'guntha-to-sq-feet', title: 'Guntha to Sq Ft', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_meter', to: 'sq_feet', slug: 'sq-meter-to-sq-feet', title: 'Sq Meter to Sq Ft', cat: 'construction-home-land-measurement' },
    { group: 'area', from: 'sq_yard_gaj', to: 'sq_feet', slug: 'gaj-to-sq-feet', title: 'Gaj to Sq Ft', cat: 'construction-home-land-measurement' },
    { group: 'length', from: 'foot', to: 'centimeter', slug: 'feet-to-cm', title: 'Feet to cm', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'foot', to: 'meter', slug: 'feet-to-meter', title: 'Feet to Meters', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'foot', to: 'inch', slug: 'feet-to-inch', title: 'Feet to Inches', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'inch', to: 'centimeter', slug: 'inch-to-cm', title: 'Inches to cm', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'inch', to: 'millimeter', slug: 'inch-to-mm', title: 'Inches to mm', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'centimeter', to: 'inch', slug: 'cm-to-inch', title: 'cm to Inches', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'centimeter', to: 'foot', slug: 'cm-to-feet', title: 'cm to Feet', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'meter', to: 'foot', slug: 'meter-to-feet', title: 'Meters to Feet', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'meter', to: 'yard', slug: 'meter-to-yard', title: 'Meters to Yards', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'kilometer', to: 'mile', slug: 'km-to-miles', title: 'km to Miles', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'mile', to: 'kilometer', slug: 'miles-to-km', title: 'Miles to km', cat: 'unit-measurement-converters' },
    { group: 'length', from: 'millimeter', to: 'inch', slug: 'mm-to-inch', title: 'mm to Inches', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'kilogram', to: 'pound', slug: 'kg-to-lbs', title: 'kg to Pounds (lbs)', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'pound', to: 'kilogram', slug: 'lbs-to-kg', title: 'Pounds (lbs) to kg', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'kilogram', to: 'gram', slug: 'kg-to-gram', title: 'kg to Grams', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'gram', to: 'ounce', slug: 'gram-to-ounce', title: 'Grams to Ounces', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'ounce', to: 'gram', slug: 'ounce-to-gram', title: 'Ounces to Grams', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'tola_india', to: 'gram', slug: 'tola-to-gram', title: 'Gold Tola to Grams', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'carat', to: 'gram', slug: 'carat-to-gram', title: 'Carat to Grams', cat: 'unit-measurement-converters' },
    { group: 'weight', from: 'metric_ton', to: 'kilogram', slug: 'ton-to-kg', title: 'Metric Ton to kg', cat: 'unit-measurement-converters' },
    { group: 'temperature', from: 'celsius', to: 'fahrenheit', slug: 'celsius-to-fahrenheit', title: '°C to °F', cat: 'unit-measurement-converters' },
    { group: 'temperature', from: 'fahrenheit', to: 'celsius', slug: 'fahrenheit-to-celsius', title: '°F to °C', cat: 'unit-measurement-converters' },
    { group: 'volume', from: 'liter', to: 'milliliter', slug: 'liter-to-ml', title: 'Liters to mL', cat: 'unit-measurement-converters' },
    { group: 'volume', from: 'liter', to: 'gallon_us', slug: 'liter-to-gallon', title: 'Liters to Gallons', cat: 'unit-measurement-converters' },
    { group: 'volume', from: 'gallon_us', to: 'liter', slug: 'gallon-to-liter', title: 'Gallons to Liters', cat: 'unit-measurement-converters' },
    { group: 'volume', from: 'cup_us', to: 'milliliter', slug: 'cup-to-ml', title: 'Cups to mL', cat: 'unit-measurement-converters' },
    { group: 'volume', from: 'tablespoon_tbsp', to: 'milliliter', slug: 'tbsp-to-ml', title: 'Tablespoon to mL', cat: 'unit-measurement-converters' },
    { group: 'volume', from: 'cubic_meter', to: 'liter', slug: 'cubic-meter-to-liter', title: 'Cubic Meter to Liters', cat: 'unit-measurement-converters' },
    { group: 'storage', from: 'gigabyte', to: 'megabyte', slug: 'gb-to-mb', title: 'GB to MB', cat: 'unit-measurement-converters' },
    { group: 'storage', from: 'terabyte', to: 'gigabyte', slug: 'tb-to-gb', title: 'TB to GB', cat: 'unit-measurement-converters' },
    { group: 'storage', from: 'megabyte', to: 'kilobyte', slug: 'mb-to-kb', title: 'MB to KB', cat: 'unit-measurement-converters' },
    { group: 'transfer', from: 'mbps', to: 'MB_per_sec', slug: 'mbps-to-mb-sec', title: 'Mbps to MB/s Download Speed', cat: 'hardware-browser-utilities' },
    { group: 'transfer', from: 'gbps', to: 'mbps', slug: 'gbps-to-mbps', title: 'Gbps to Mbps', cat: 'hardware-browser-utilities' },
    { group: 'speed', from: 'km_h', to: 'mph', slug: 'kmh-to-mph', title: 'km/h to mph', cat: 'unit-measurement-converters' },
    { group: 'speed', from: 'mph', to: 'km_h', slug: 'mph-to-kmh', title: 'mph to km/h', cat: 'unit-measurement-converters' },
    { group: 'speed', from: 'm_s', to: 'km_h', slug: 'ms-to-kmh', title: 'm/s to km/h', cat: 'unit-measurement-converters' },
    { group: 'power', from: 'horsepower_hp', to: 'kilowatt', slug: 'hp-to-kw', title: 'Horsepower (HP) to kW', cat: 'geometry-physics-engineering' },
    { group: 'power', from: 'kilowatt', to: 'watt', slug: 'kw-to-watt', title: 'Kilowatts (kW) to Watts', cat: 'geometry-physics-engineering' },
    { group: 'energy', from: 'kilocalorie_kcal', to: 'kilojoule', slug: 'kcal-to-kj', title: 'kcal Calories to kJ', cat: 'health-fitness-nutrition' },
    { group: 'energy', from: 'kilowatt_hour_kWh', to: 'joule', slug: 'kwh-to-joule', title: 'kWh Units to Joules', cat: 'geometry-physics-engineering' },
    { group: 'pressure', from: 'psi', to: 'bar', slug: 'psi-to-bar', title: 'Tire Pressure PSI to Bar', cat: 'unit-measurement-converters' },
    { group: 'pressure', from: 'bar', to: 'psi', slug: 'bar-to-psi', title: 'Bar to Tire PSI', cat: 'unit-measurement-converters' },
    { group: 'typography', from: 'px_96dpi', to: 'em_16px', slug: 'px-to-em', title: 'CSS Pixels (px) to EM', cat: 'css-ui-design-color' },
    { group: 'typography', from: 'pt_point', to: 'px_96dpi', slug: 'pt-to-px', title: 'Font Points (pt) to Pixels', cat: 'css-ui-design-color' },
    { group: 'fuel', from: 'km_per_liter', to: 'mpg_us', slug: 'kmpl-to-mpg', title: 'km/L Mileage to MPG', cat: 'unit-measurement-converters' },
    { group: 'time', from: 'hour', to: 'minute', slug: 'hours-to-minutes', title: 'Hours to Minutes', cat: 'date-time-travel-utilities' },
    { group: 'time', from: 'minute', to: 'second', slug: 'minutes-to-seconds', title: 'Minutes to Seconds', cat: 'date-time-travel-utilities' },
    { group: 'time', from: 'day', to: 'hour', slug: 'days-to-hours', title: 'Days to Hours', cat: 'date-time-travel-utilities' },
    { group: 'charge', from: 'mAh', to: 'Ah', slug: 'mah-to-ah', title: 'Battery mAh to Ah', cat: 'hardware-browser-utilities' },
    { group: 'angle', from: 'degree', to: 'radian', slug: 'degrees-to-radians', title: 'Degrees to Radians', cat: 'mathematics-algebra-statistics' },
  ];

  for (const tp of topPairs) {
    for (const qv of quickValues) {
      add(
        list,
        seenSlugs,
        nextId,
        `convert-${qv}-${tp.slug}`,
        `Convert ${qv.toLocaleString('en-US')} ${tp.title}`,
        tp.cat,
        'converter',
        { mode: 'unit-pair', group: tp.group, from: tp.from, to: tp.to, defaultVal: qv }
      );
    }
  }

  // =========================================================================
  // 9D. EVERYDAY FINANCE: SALARY CTC, HOURLY WAGE, GRATUITY, FD, RD, PPF, BANK EMI (~6,800 Tools)
  // =========================================================================
  const lpaPackages = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 25, 28, 30, 35, 40, 45, 50, 60, 75, 100];
  const pfModes = [
    { slug: 'with-epf', label: 'Standard EPF', pf: 12 },
    { slug: 'no-pf', label: 'Zero PF Consultant', pf: 0 },
    { slug: 'double-epf', label: 'Full Matched EPF', pf: 24 },
  ];
  for (const lpa of lpaPackages) {
    for (const pm of pfModes) {
      const lpaSlug = String(lpa).replace('.', '-');
      add(
        list,
        seenSlugs,
        nextId,
        `${lpaSlug}-lpa-in-hand-salary-${pm.slug}`,
        `${lpa} LPA CTC to In-Hand Salary Calculator (${pm.label})`,
        'indian-finance-tax-calculators',
        'calculator',
        { formula: 'salary-ctc', v1: lpa * 100000, v2: pm.pf, v3: 0 }
      );
    }
  }

  const hourlyRates = [10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100, 125, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000];
  const weekHours = [20, 30, 35, 40, 45, 50];
  for (const hr of hourlyRates) {
    for (const wh of weekHours) {
      add(
        list,
        seenSlugs,
        nextId,
        `${hr}-per-hour-${wh}-hrs-week-salary-calculator`,
        `${hr}/hr Salary & Annual Pay Calculator (${wh} hrs/week)`,
        'business-ecommerce-accounting',
        'calculator',
        { formula: 'hourly-wage', v1: hr, v2: wh, v3: 52 }
      );
    }
  }

  const basicPays = [15000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 150000];
  const serviceYrs = [5, 7, 10, 12, 15, 20, 25, 30];
  for (const bp of basicPays) {
    for (const sy of serviceYrs) {
      add(
        list,
        seenSlugs,
        nextId,
        `gratuity-${bp}-basic-salary-${sy}-years`,
        `Gratuity Calculator on ₹${bp.toLocaleString('en-IN')} Basic Pay (${sy} Years)`,
        'indian-finance-tax-calculators',
        'calculator',
        { formula: 'gratuity', v1: bp, v2: sy, v3: 1 }
      );
    }
  }

  // Bank FD Quarterly Compounding Matrix
  const fdAmounts = [10000, 25000, 50000, 100000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 2500000, 5000000, 10000000];
  const fdRates = [6.0, 6.5, 6.75, 7.0, 7.25, 7.5, 7.75, 8.0, 8.25, 8.5, 8.75, 9.0];
  const fdYears = [1, 2, 3, 5, 7, 10];
  for (const amt of fdAmounts) {
    const aSlug = amt >= 100000 ? `${String(amt / 100000).replace('.', '-')}-lakh` : `${amt / 1000}k`;
    const aLbl = amt >= 100000 ? `₹${amt / 100000} Lakh` : `₹${amt / 1000}K`;
    for (const rate of fdRates) {
      const rSlug = String(rate).replace('.', '-');
      for (const yr of fdYears) {
        add(
          list,
          seenSlugs,
          nextId,
          `${aSlug}-fd-${rSlug}-percent-${yr}-years-calculator`,
          `${aLbl} Bank FD at ${rate}% Interest (${yr} Yr Quarterly)`,
          'indian-finance-tax-calculators',
          'calculator',
          { formula: 'fd-quarterly', v1: amt, v2: rate, v3: yr }
        );
      }
    }
  }

  // Monthly Recurring Deposit (RD) Matrix
  const rdDeposits = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 50000];
  const rdRates = [6.0, 6.5, 7.0, 7.25, 7.5, 8.0, 8.5];
  const rdYears = [1, 2, 3, 5, 7, 10];
  for (const dep of rdDeposits) {
    for (const rate of rdRates) {
      const rSlug = String(rate).replace('.', '-');
      for (const yr of rdYears) {
        add(
          list,
          seenSlugs,
          nextId,
          `rd-${dep}-per-month-${rSlug}-percent-${yr}-years`,
          `₹${dep.toLocaleString('en-IN')}/Mo RD Calculator at ${rate}% (${yr} Yr)`,
          'indian-finance-tax-calculators',
          'calculator',
          { formula: 'rd', v1: dep, v2: rate, v3: yr }
        );
      }
    }
  }

  // PPF Calculators
  const ppfYearly = [5000, 10000, 20000, 25000, 30000, 50000, 60000, 75000, 100000, 120000, 150000];
  const ppfYears = [15, 20, 25, 30];
  for (const amt of ppfYearly) {
    for (const yr of ppfYears) {
      add(
        list,
        seenSlugs,
        nextId,
        `ppf-${amt}-per-year-${yr}-years-maturity`,
        `₹${amt.toLocaleString('en-IN')}/Yr PPF Maturity Calculator (${yr} Years)`,
        'indian-finance-tax-calculators',
        'calculator',
        { formula: 'ppf', v1: amt, v2: 7.1, v3: yr }
      );
    }
  }

  // SIP Extended Expected Return Matrix
  const sipAmts = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000];
  const sipRates = [8, 10, 14, 15, 18, 20];
  const sipDurs = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30];
  for (const amt of sipAmts) {
    for (const r of sipRates) {
      for (const yr of sipDurs) {
        add(
          list,
          seenSlugs,
          nextId,
          `sip-${amt}-month-${r}-percent-${yr}-years`,
          `₹${amt.toLocaleString('en-IN')}/Mo SIP at ${r}% Return (${yr} Years)`,
          'indian-finance-tax-calculators',
          'calculator',
          { formula: 'sip', v1: amt, v2: r, v3: yr }
        );
      }
    }
  }

  // Bank-Branded EMI Matrix (SBI, HDFC, ICICI, Axis, Kotak, BOB)
  const banks = [
    { slug: 'sbi', name: 'SBI', spread: 0 },
    { slug: 'hdfc', name: 'HDFC', spread: 0.25 },
    { slug: 'icici', name: 'ICICI', spread: 0.35 },
    { slug: 'axis', name: 'Axis Bank', spread: 0.4 },
    { slug: 'kotak', name: 'Kotak Mahindra', spread: 0.3 },
    { slug: 'bob', name: 'Bank of Baroda', spread: -0.1 },
  ];
  const bankLoanKinds = [
    { slug: 'home-loan', name: 'Home Loan', baseRate: 8.5 },
    { slug: 'car-loan', name: 'Car Loan', baseRate: 9.2 },
    { slug: 'personal-loan', name: 'Personal Loan', baseRate: 11.2 },
    { slug: 'education-loan', name: 'Education Loan', baseRate: 9.5 },
    { slug: 'gold-loan', name: 'Gold Loan', baseRate: 9.4 },
  ];
  const bankAmts = [
    { slug: '1-lakh', val: 100000, label: '₹1L' },
    { slug: '2-lakh', val: 200000, label: '₹2L' },
    { slug: '3-lakh', val: 300000, label: '₹3L' },
    { slug: '5-lakh', val: 500000, label: '₹5L' },
    { slug: '10-lakh', val: 1000000, label: '₹10L' },
    { slug: '15-lakh', val: 1500000, label: '₹15L' },
    { slug: '20-lakh', val: 2000000, label: '₹20L' },
    { slug: '25-lakh', val: 2500000, label: '₹25L' },
    { slug: '30-lakh', val: 3000000, label: '₹30L' },
    { slug: '40-lakh', val: 4000000, label: '₹40L' },
    { slug: '50-lakh', val: 5000000, label: '₹50L' },
    { slug: '75-lakh', val: 7500000, label: '₹75L' },
    { slug: '1-crore', val: 10000000, label: '₹1Cr' },
  ];
  const bankYrs = [1, 2, 3, 5, 7, 10, 15, 20, 25];
  for (const bk of banks) {
    for (const lk of bankLoanKinds) {
      const rate = Number((lk.baseRate + bk.spread).toFixed(2));
      for (const amt of bankAmts) {
        for (const yr of bankYrs) {
          add(
            list,
            seenSlugs,
            nextId,
            `${bk.slug}-${amt.slug}-${lk.slug}-emi-${yr}-yr`,
            `${bk.name} ${amt.label} ${lk.name} EMI (${yr} Yr @ ${rate}%)`,
            'indian-finance-tax-calculators',
            'calculator',
            { formula: 'emi', v1: amt.val, v2: rate, v3: yr }
          );
        }
      }
    }
  }

  // =========================================================================
  // 9E. DAILY MATH: X% OF Y, SCORE MARKS %, CGPA EXACT SCALES (~2,600 Tools)
  // =========================================================================
  const pctPcts = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 22, 24, 25, 28,
    30, 33, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
  ];
  const pctBases = [
    50, 100, 120, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 750, 800, 900,
    1000, 1200, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000,
    7500, 8000, 9000, 10000, 12000, 15000, 18000, 20000, 25000, 30000, 35000,
    40000, 45000, 50000, 60000, 75000, 80000, 90000, 100000, 120000, 150000,
    200000, 250000, 500000, 750000, 1000000,
  ];
  for (const p of pctPcts) {
    for (const b of pctBases) {
      add(
        list,
        seenSlugs,
        nextId,
        `${p}-percent-of-${b}-calculator`,
        `${p}% of ${b.toLocaleString('en-IN')} Calculator`,
        'mathematics-algebra-statistics',
        'calculator',
        { formula: 'percent-of', v1: p, v2: b, v3: 1 }
      );
    }
  }

  // Exam Score Percentage Calculators ("X out of Y")
  const totalExamMarks = [100, 200, 300, 400, 500, 600, 700, 720, 800, 1000, 1200];
  for (const tot of totalExamMarks) {
    const step = Math.max(10, Math.round(tot / 20));
    for (let sc = step; sc < tot; sc += step) {
      add(
        list,
        seenSlugs,
        nextId,
        `${sc}-out-of-${tot}-percentage-calculator`,
        `${sc} Out of ${tot} Marks Percentage Calculator`,
        'education-academic-tools',
        'calculator',
        { formula: 'what-percent-is', v1: sc, v2: tot, v3: 1 }
      );
    }
  }

  // Exact Point CGPA-to-Percentage (5.0 to 10.0 in 0.1 steps on 10.0, 5.0, 4.0 scales)
  const cgpaMultipliers = [
    { name: '10.0 Scale (9.5x CBSE)', slug: 'cbse-10', mult: 9.5, maxGpa: 10 },
    { name: '10.0 Scale (10x Uni)', slug: 'uni-10', mult: 10, maxGpa: 10 },
    { name: '5.0 GPA Scale', slug: 'gpa-5', mult: 20, maxGpa: 5 },
    { name: '4.0 GPA Scale', slug: 'gpa-4', mult: 25, maxGpa: 4 },
  ];
  for (const sc of cgpaMultipliers) {
    for (let tenths = Math.round(sc.maxGpa * 4); tenths <= sc.maxGpa * 10; tenths += 1) {
      const val = Number((tenths / 10).toFixed(1));
      const vSlug = String(val).replace('.', '-');
      add(
        list,
        seenSlugs,
        nextId,
        `convert-${vSlug}-cgpa-to-percentage-${sc.slug}`,
        `Convert ${val} CGPA to Percentage (${sc.name})`,
        'education-academic-tools',
        'calculator',
        { formula: 'cgpa', v1: val, v2: sc.mult, v3: 100 }
      );
    }
  }

  // =========================================================================
  // 9F. DAILY SHOPPING DISCOUNTS, GST BILLING, TIP SPLIT, FUEL & ELECTRICITY (~2,200 Tools)
  // =========================================================================
  const retailPrices = [
    199, 299, 399, 499, 599, 699, 799, 999, 1299, 1499, 1999, 2499, 2999,
    3999, 4999, 5999, 7999, 9999, 14999, 19999, 24999, 29999, 39999, 49999,
    74999, 99999, 149999, 199999,
  ];
  const discountSlabs = [5, 10, 12, 15, 20, 25, 30, 33, 35, 40, 45, 50, 60, 70, 75, 80];
  for (const price of retailPrices) {
    for (const disc of discountSlabs) {
      add(
        list,
        seenSlugs,
        nextId,
        `${disc}-percent-off-${price}-price-calculator`,
        `${disc}% Off Discount on ₹${price.toLocaleString('en-IN')} Sale Calculator`,
        'business-ecommerce-accounting',
        'calculator',
        { formula: 'discount', v1: price, v2: disc, v3: 1 }
      );
    }
  }

  const gstPrices = [500, 1000, 1500, 2000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 200000, 500000];
  for (const gp of gstPrices) {
    for (const slab of [3, 5, 12, 18, 28]) {
      add(
        list,
        seenSlugs,
        nextId,
        `${slab}-percent-gst-on-${gp}-calculator`,
        `${slab}% GST on ₹${gp.toLocaleString('en-IN')} Invoice Calculator`,
        'business-ecommerce-accounting',
        'calculator',
        { formula: 'gst', v1: gp, v2: slab, v3: 1 }
      );
    }
  }

  const billAmounts = [500, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000];
  const billPeople = [2, 3, 4, 5, 6, 8, 10];
  const tipRates = [0, 5, 10, 15];
  for (const bAmt of billAmounts) {
    for (const ppl of billPeople) {
      for (const tip of tipRates) {
        add(
          list,
          seenSlugs,
          nextId,
          `split-${bAmt}-bill-${ppl}-ways-${tip}-tip`,
          `Split ₹${bAmt} Restaurant Bill Between ${ppl} (${tip}% Tip)`,
          'business-ecommerce-accounting',
          'calculator',
          { formula: 'tip-split', v1: bAmt, v2: tip, v3: ppl }
        );
      }
    }
  }

  // Trip Fuel Cost Calculator
  const tripDistances = [50, 100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500];
  const mileages = [10, 12, 14, 15, 16, 18, 20, 22, 25, 35, 45, 55, 65];
  const fuelTypes = [
    { slug: 'petrol', label: 'Petrol', rate: 102 },
    { slug: 'diesel', label: 'Diesel', rate: 92 },
    { slug: 'cng', label: 'CNG', rate: 82 },
  ];
  for (const d of tripDistances) {
    for (const m of mileages) {
      for (const ft of fuelTypes) {
        add(
          list,
          seenSlugs,
          nextId,
          `${d}km-trip-${m}kmpl-${ft.slug}-cost-calculator`,
          `${d} km ${ft.label} Trip Fuel Cost (${m} km/L Mileage)`,
          'date-time-travel-utilities',
          'calculator',
          { formula: 'fuel-cost', v1: d, v2: m, v3: ft.rate }
        );
      }
    }
  }

  // Home Appliance Electricity Bill Calculators
  const appliances: [string, string, number][] = [
    ['1-5-ton-ac', '1.5 Ton Split AC', 1500],
    ['1-ton-inverter-ac', '1 Ton Inverter AC', 1000],
    ['2-ton-ac', '2 Ton Split AC', 2000],
    ['water-geyser', 'Electric Water Geyser', 2000],
    ['room-heater', 'Room Heater', 1500],
    ['refrigerator', 'Double-Door Fridge', 220],
    ['ceiling-fan', 'Ceiling Fan', 75],
    ['bldc-fan', 'BLDC Energy Saver Fan', 32],
    ['led-tv', '55-Inch LED TV', 110],
    ['gaming-pc', 'Desktop / Gaming PC', 450],
    ['washing-machine', 'Washing Machine', 500],
    ['induction-stove', 'Induction Cooktop', 1800],
    ['microwave-oven', 'Microwave Oven', 1200],
    ['water-motor', '1 HP Water Pump Motor', 750],
    ['ev-scooter-charger', 'EV Scooter Charger', 600],
  ];
  const appHours = [1, 2, 4, 6, 8, 10, 12, 16, 24];
  const tariffs = [5, 7, 8, 10];
  for (const [aSlug, aName, watts] of appliances) {
    for (const hrs of appHours) {
      for (const tar of tariffs) {
        add(
          list,
          seenSlugs,
          nextId,
          `${aSlug}-${hrs}hrs-at-${tar}-rs-electricity-bill`,
          `${aName} (${watts}W, ${hrs}h/day @ ₹${tar}/unit) Monthly Bill`,
          'hardware-browser-utilities',
          'calculator',
          { formula: 'electricity-bill', v1: watts, v2: hrs, v3: tar }
        );
      }
    }
  }

  // =========================================================================
  // 9G. HEALTH & FITNESS PRESETS (BMI, TDEE, WATER, PROTEIN, HEART RATE) (~1,600 Tools)
  // =========================================================================
  const extraWeights = [42, 48, 52, 58, 62, 68, 72, 78, 82, 88, 92, 98, 105, 115, 125];
  const extraHeights = [148, 152, 158, 162, 168, 172, 178, 182, 188, 195];
  for (const wt of extraWeights) {
    for (const ht of extraHeights) {
      add(list, seenSlugs, nextId, `bmi-${wt}kg-${ht}cm-health-check`, `BMI Calculator for ${wt} kg & ${ht} cm`, 'health-fitness-nutrition', 'calculator', { formula: 'bmi', v1: wt, v2: ht, v3: 26 });
      add(list, seenSlugs, nextId, `tdee-calories-${wt}kg-${ht}cm`, `Daily Calorie TDEE (${wt} kg, ${ht} cm)`, 'health-fitness-nutrition', 'calculator', { formula: 'bmr', v1: wt, v2: ht, v3: 28 });
    }
  }

  const bodyWeightsAll = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];
  const workoutMins = [0, 30, 60, 90, 120];
  for (const wt of bodyWeightsAll) {
    for (const wm of workoutMins) {
      add(
        list,
        seenSlugs,
        nextId,
        `water-intake-${wt}kg-${wm}min-workout`,
        `Daily Water Intake for ${wt} kg Weight (${wm} min Workout)`,
        'health-fitness-nutrition',
        'calculator',
        { formula: 'water-intake', v1: wt, v2: wm, v3: 1 }
      );
    }
  }

  const proteinGoals = [
    { slug: 'maintenance', label: 'Daily Maintenance (0.8g/kg)', mult: 0.8 },
    { slug: 'fitness', label: 'Active Fitness (1.2g/kg)', mult: 1.2 },
    { slug: 'muscle-gain', label: 'Muscle Gain (1.6g/kg)', mult: 1.6 },
    { slug: 'fat-loss', label: 'Fat Loss Cut (1.8g/kg)', mult: 1.8 },
    { slug: 'athlete', label: 'Strength Athlete (2.0g/kg)', mult: 2.0 },
  ];
  for (const wt of bodyWeightsAll) {
    for (const pg of proteinGoals) {
      add(
        list,
        seenSlugs,
        nextId,
        `daily-protein-${wt}kg-${pg.slug}`,
        `Daily Protein Intake for ${wt} kg (${pg.label})`,
        'health-fitness-nutrition',
        'calculator',
        { formula: 'protein-intake', v1: wt, v2: pg.mult, v3: 3 }
      );
    }
  }

  for (let age = 18; age <= 75; age += 1) {
    for (const rhr of [55, 65, 75]) {
      add(
        list,
        seenSlugs,
        nextId,
        `target-heart-rate-age-${age}-resting-${rhr}`,
        `Target Heart Rate Zones for Age ${age} (Resting ${rhr} BPM)`,
        'health-fitness-nutrition',
        'calculator',
        { formula: 'heart-rate', v1: age, v2: rhr, v3: 1 }
      );
    }
  }

  // =========================================================================
  // 9H. PHOTO COMPRESSION, EXAM/VISA RESIZING & PDF TEMPLATES (~2,500 Tools)
  // =========================================================================
  const examPhotoPortals = [
    { slug: 'neet-ug-photo', label: 'NEET UG Photo', w: 200, h: 250, kb: 50 },
    { slug: 'jee-main-photo', label: 'JEE Main Application Photo', w: 200, h: 250, kb: 50 },
    { slug: 'ibps-po-photo', label: 'IBPS PO Bank Form Photo', w: 200, h: 230, kb: 50 },
    { slug: 'sbi-clerk-photo', label: 'SBI Exam Photo', w: 200, h: 230, kb: 50 },
    { slug: 'rrb-ntpc-photo', label: 'Railway RRB Form Photo', w: 240, h: 320, kb: 50 },
    { slug: 'gate-exam-photo', label: 'GATE Application Photo', w: 480, h: 640, kb: 200 },
    { slug: 'cat-exam-photo', label: 'CAT MBA Application Photo', w: 300, h: 400, kb: 80 },
    { slug: 'driving-license-photo', label: 'Parivahan Driving License Photo', w: 200, h: 250, kb: 20 },
    { slug: 'voter-id-photo', label: 'NVSP Voter ID Photo', w: 200, h: 250, kb: 50 },
    { slug: 'us-visa-ds160-photo', label: 'US Visa DS-160 Square Photo', w: 600, h: 600, kb: 240 },
    { slug: 'uk-visa-photo', label: 'UK Standard Visa Photo', w: 413, h: 531, kb: 100 },
    { slug: 'schengen-visa-photo', label: 'Schengen Visa 35x45mm Photo', w: 413, h: 531, kb: 100 },
    { slug: 'canada-pr-photo', label: 'Canada PR 50x70mm Photo', w: 420, h: 540, kb: 240 },
    { slug: 'pan-nsdl-signature', label: 'NSDL PAN Signature Scan', w: 400, h: 200, kb: 50 },
    { slug: 'ibps-signature', label: 'IBPS / SBI White-Paper Signature', w: 140, h: 60, kb: 20 },
  ];
  const kbTargetsExtra = [10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 500, 1024];
  for (const ep of examPhotoPortals) {
    add(
      list,
      seenSlugs,
      nextId,
      `${ep.slug}-resizer-exact`,
      `${ep.label} Resizer (${ep.w}×${ep.h} px, Under ${ep.kb}KB)`,
      'image-editing-optimization',
      'image',
      { width: ep.w, height: ep.h, targetKb: ep.kb, outputFormat: 'image/jpeg' }
    );
    for (const kb of kbTargetsExtra) {
      const kLabel = kb >= 1024 ? '1MB' : `${kb}KB`;
      const kSlug = kb >= 1024 ? '1mb' : `${kb}kb`;
      add(
        list,
        seenSlugs,
        nextId,
        `compress-${ep.slug}-to-${kSlug}`,
        `Compress ${ep.label} Under ${kLabel}`,
        'image-editing-optimization',
        'image',
        { width: ep.w, height: ep.h, targetKb: kb, outputFormat: 'image/jpeg' }
      );
    }
  }

  // Exact Pixel Dimension + Target KB Combinations across Formats
  const popularCanvasSizes: [number, number, string][] = [
    [1080, 1080, '1080×1080 Instagram Square'],
    [1080, 1350, '1080×1350 Instagram Portrait'],
    [1080, 1920, '1080×1920 Story / Reels / Status'],
    [1280, 720, '1280×720 YouTube Thumbnail'],
    [1200, 630, '1200×630 Blog OG Banner'],
    [1200, 628, '1200×628 LinkedIn Ad'],
    [1584, 396, '1584×396 LinkedIn Cover'],
    [1500, 500, '1500×500 X Header'],
    [1920, 1080, '1920×1080 Full HD Slide'],
    [800, 800, '800×800 E-Commerce Product'],
    [512, 512, '512×512 App Icon / Avatar'],
    [400, 400, '400×400 Profile DP'],
    [350, 450, '350×450 Passport 35×45mm'],
    [600, 600, '600×600 Visa 2×2 Inch'],
    [1240, 1754, '1240×1754 A4 Document Scan'],
    [1200, 1800, '1200×1800 4×6 Print Photo'],
  ];
  const imgCompressTargets = [20, 50, 100, 150, 200, 250, 300, 500, 1024];
  const imgFmts = [
    { ext: 'jpg', label: 'JPG', mime: 'image/jpeg' },
    { ext: 'webp', label: 'WebP', mime: 'image/webp' },
  ];
  for (const [w, h, desc] of popularCanvasSizes) {
    for (const kb of imgCompressTargets) {
      const kLabel = kb >= 1024 ? '1MB' : `${kb}KB`;
      const kSlug = kb >= 1024 ? '1mb' : `${kb}kb`;
      for (const fmt of imgFmts) {
        add(
          list,
          seenSlugs,
          nextId,
          `resize-${w}x${h}-under-${kSlug}-${fmt.ext}`,
          `Resize & Compress ${desc} Under ${kLabel} (${fmt.label})`,
          'image-editing-optimization',
          'image',
          { width: w, height: h, targetKb: kb, outputFormat: fmt.mime }
        );
      }
    }
  }

  // More PDF Document & Target KB Variants
  const pdfDocKinds = [
    'Resume PDF', 'Government Portal PDF', 'SSC Upload PDF', 'Bank Statement PDF',
    'College Assignment PDF', 'Aadhaar Scan PDF', 'Marksheet PDF', 'Job Application PDF',
    'E-Book PDF', 'Property Deed PDF', 'Tax Return PDF', 'Passport Copy PDF',
  ];
  const pdfKbs = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 2000, 5000];
  for (const pdk of pdfDocKinds) {
    const pSlug = pdk.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const kb of pdfKbs) {
      const kbLbl = kb >= 1000 ? `${kb / 1000}MB` : `${kb}KB`;
      const kbSl = kb >= 1000 ? `${kb / 1000}mb` : `${kb}kb`;
      add(
        list,
        seenSlugs,
        nextId,
        `compress-${pSlug}-to-${kbSl}`,
        `Compress ${pdk} Under ${kbLbl}`,
        'pdf-tools',
        'pdf',
        { targetKb: kb }
      );
    }
  }

  // =========================================================================
  // 9I. CONSTRUCTION, GEOMETRY, TIMERS, AUDIO, TEXT, DEV, CRYPTO (~3,500 Tools)
  // =========================================================================
  const roomW = [10, 12, 14, 15, 18, 20, 24, 25, 30, 35, 40];
  const roomL = [10, 12, 14, 15, 18, 20, 24, 25, 30, 40];
  for (const rw of roomW) {
    for (const rl of roomL) {
      for (const coats of [1, 2, 3]) {
        add(
          list,
          seenSlugs,
          nextId,
          `wall-paint-${rw}x${rl}-ft-${coats}-coats`,
          `${rw}×${rl} ft Wall Paint Estimator (${coats} Coat${coats > 1 ? 's' : ''})`,
          'construction-home-land-measurement',
          'calculator',
          { formula: 'paint', v1: rw, v2: rl, v3: coats }
        );
      }
      add(
        list,
        seenSlugs,
        nextId,
        `brick-wall-${rw}x${rl}-ft-quantity`,
        `${rw}×${rl} ft Wall Brick Count Estimator`,
        'construction-home-land-measurement',
        'calculator',
        { formula: 'brick', v1: rw, v2: rl, v3: 1 }
      );
      add(
        list,
        seenSlugs,
        nextId,
        `concrete-slab-${rw}x${rl}-ft-6-inch`,
        `${rw}×${rl} ft Concrete Slab & Cement Bags (6" Thick)`,
        'construction-home-land-measurement',
        'calculator',
        { formula: 'concrete', v1: rw, v2: rl, v3: 0.5 }
      );
    }
  }

  // Geometry Dimensional Presets (Circle Radii, Cubes, Squares, Cylinders)
  for (let r = 1; r <= 50; r++) {
    add(list, seenSlugs, nextId, `circle-radius-${r}-area-circumference`, `Circle Area & Circumference (Radius = ${r})`, 'geometry-physics-engineering', 'calculator', { formula: 'circle', v1: r, v2: 1, v3: 1 });
    add(list, seenSlugs, nextId, `sphere-radius-${r}-volume-area`, `Sphere Volume & Surface Area (r = ${r})`, 'geometry-physics-engineering', 'calculator', { formula: 'sphere', v1: r, v2: 1, v3: 1 });
    add(list, seenSlugs, nextId, `cube-side-${r}-volume-area`, `Cube Volume & Surface Area (Side = ${r})`, 'geometry-physics-engineering', 'calculator', { formula: 'cube', v1: r, v2: 1, v3: 1 });
  }

  // Countdown Timers across Everyday Routines (1..180 mins)
  const extraTimers = [1, 2, 3, 4, 5, 7, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 120, 150, 180];
  const extraTimerModes = ['Deep Work', 'Reading', 'Power Nap', 'Tabata', 'Breathing', 'Plank Hold', 'Presentation', 'Tea Steep', 'Code Sprint', 'Exam Practice'];
  for (const tm of extraTimerModes) {
    const tSlug = tm.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const mins of extraTimers) {
      add(
        list,
        seenSlugs,
        nextId,
        `${mins}-minute-${tSlug}-countdown-timer`,
        `${mins}-Minute ${tm} Countdown Timer`,
        'date-time-travel-utilities',
        'generator',
        { minutes: mins }
      );
    }
  }

  // Audio Frequency Tones (Every musical / test Hz across 4 wave shapes)
  const extraHzList = [
    40, 50, 60, 100, 110, 128, 136, 174, 256, 285, 396, 417, 432, 440, 528, 639,
    741, 852, 963, 1000, 1200, 1500, 1750, 2000, 2500, 3000, 4000, 5000, 8000, 10000, 12000, 15000,
  ];
  const waves: ('sine' | 'square' | 'triangle' | 'sawtooth')[] = ['sine', 'square', 'triangle', 'sawtooth'];
  const tonePurposes = ['Audio Speaker Test', 'Hearing Range Check', 'Binaural Tuning', 'Acoustic Calibration'];
  for (const hz of extraHzList) {
    for (const wv of waves) {
      for (const purp of tonePurposes) {
        const pSlug = purp.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        add(
          list,
          seenSlugs,
          nextId,
          `${hz}hz-${wv}-${pSlug}`,
          `${hz} Hz ${wv.charAt(0).toUpperCase() + wv.slice(1)} ${purp}`,
          'audio-video-animation',
          'media',
          { hz, wave: wv }
        );
      }
    }
  }

  // Extra BPM Metronomes (40..220 every 2 BPM)
  for (let bpm = 42; bpm <= 220; bpm += 2) {
    add(
      list,
      seenSlugs,
      nextId,
      `${bpm}-bpm-tempo-metronome`,
      `${bpm} BPM Tempo Metronome & Tapper`,
      'audio-video-animation',
      'media',
      { bpm }
    );
  }

  // Extra Regex Modes (Tester, Extractor, Validator across 35 patterns)
  const fullRegexList: [string, string, string][] = [
    ['email-address', 'Email Address', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-z]{2,}'],
    ['indian-mobile', 'Indian Mobile (+91)', '(?:\\+91|91|0)?[6-9]\\d{9}'],
    ['us-phone', 'US Phone Number', '(?:\\+?1[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}'],
    ['indian-pan', 'Indian PAN Card', '[A-Z]{5}[0-9]{4}[A-Z]'],
    ['indian-aadhaar', 'Indian Aadhaar (12-Digit)', '\\b[2-9]{1}[0-9]{3}\\s?[0-9]{4}\\s?[0-9]{4}\\b'],
    ['indian-gstin', 'Indian GSTIN Number', '\\d{2}[A-Z]{5}\\d{4}[A-Z]\\d[Z][A-Z\\d]'],
    ['indian-ifsc', 'Indian Bank IFSC', '[A-Z]{4}0[A-Z0-9]{6}'],
    ['upi-id', 'UPI Payment ID', '[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}'],
    ['indian-pincode', 'India PIN Code', '\\b[1-9][0-9]{5}\\b'],
    ['url-http', 'HTTP/HTTPS URL', 'https?:\\/\\/[^\\s/$.?#].[^\\s]*'],
    ['ipv4-address', 'IPv4 Address', '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b'],
    ['hex-color', 'CSS Hex Color', '#(?:[0-9a-fA-F]{3}){1,2}\\b'],
    ['uuid-v4', 'UUID v4 ID', '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'],
    ['date-iso', 'ISO Date YYYY-MM-DD', '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])'],
    ['date-indian', 'Date DD/MM/YYYY', '(?:0[1-9]|[12]\\d|3[01])\\/(?:0[1-9]|1[0-2])\\/\\d{4}'],
    ['url-slug', 'SEO URL Slug', '^[a-z0-9]+(?:-[a-z0-9]+)*$'],
    ['hashtag', 'Social Hashtag', '#[a-zA-Z0-9_]+'],
    ['jwt-token', 'JWT Bearer Token', 'eyJ[A-Za-z0-9-_]+\\.eyJ[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+'],
    ['html-tag', 'HTML Markup Tag', '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)'],
    ['mac-address', 'MAC Hardware Address', '([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})'],
    ['semver', 'SemVer Version', '\\bv?\\d+\\.\\d+\\.\\d+(?:-[\\w.-]+)?\\b'],
    ['credit-card', 'Credit Card Digits', '\\b(?:\\d[ -]*?){13,16}\\b'],
    ['time-24h', '24-Hour Time HH:MM', '\\b(?:[01]\\d|2[0-3]):[0-5]\\d\\b'],
    ['strong-password', 'Strong Password Check', '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$'],
    ['username', 'Username Handle', '^[a-zA-Z0-9_.-]{3,20}$'],
    ['vehicle-plate-in', 'Indian Vehicle Plate', '[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}'],
    ['indian-passport', 'Indian Passport Number', '[A-PR-WYa-pr-wy][1-9]\\d\\s?\\d{4}[1-9]'],
    ['isbn-13', 'ISBN Book Code', '(?:97[89][- ]?)?\\d{1,5}[- ]?\\d{1,7}[- ]?\\d{1,6}[- ]?[\\dX]'],
    ['lat-long', 'GPS Latitude/Longitude', '[-+]?([1-8]?\\d(\\.\\d+)?|90(\\.0+)?)\\s*,\\s*[-+]?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)'],
    ['youtube-id', 'YouTube Video ID', '(?:v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})'],
  ];
  const regexModes = ['Matcher', 'Pattern Validator', 'Bulk Extractor', 'Live Debugger'];
  for (const [rs, rt, pat] of fullRegexList) {
    for (const rm of regexModes) {
      const mSlug = rm.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      add(
        list,
        seenSlugs,
        nextId,
        `${rs}-regex-${mSlug}`,
        `${rt} Regex ${rm}`,
        'developer-code-formatters',
        'developer',
        { regexPattern: pat }
      );
    }
  }

  // Developer Code Workflows (JSON, SQL, HTML, XML, CSS, JS, YAML, Markdown)
  const devLangs = [
    { key: 'json', name: 'JSON' },
    { key: 'sql', name: 'SQL' },
    { key: 'html', name: 'HTML' },
    { key: 'xml', name: 'XML' },
    { key: 'css', name: 'CSS' },
    { key: 'javascript', name: 'JavaScript' },
    { key: 'yaml', name: 'YAML' },
    { key: 'markdown', name: 'Markdown' },
  ];
  const devContexts = [
    'REST API', 'GraphQL Response', 'Next.js Config', 'Package Manifest', 'Docker Compose',
    'CI Pipeline', 'Stripe Webhook', 'OpenAPI Spec', 'Tailwind Theme', 'Database Query',
    'Email Template', 'SVG Markup', 'Sitemap Feed', 'Auth Payload', 'Audit Log',
  ];
  for (const dl of devLangs) {
    for (const dc of devContexts) {
      const dSlug = dc.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      add(list, seenSlugs, nextId, `${dl.key}-${dSlug}-formatter`, `${dl.name} ${dc} Formatter`, 'developer-code-formatters', 'developer', { mode: 'format' });
      add(list, seenSlugs, nextId, `${dl.key}-${dSlug}-minifier`, `${dl.name} ${dc} Minifier`, 'developer-code-formatters', 'developer', { mode: 'minify' });
    }
  }

  // Crypto Passwords, Tokens & Keys (Extended Lengths 6..64 across additional Dev/Infra types)
  const extraKeyKinds = [
    { slug: 'jwt-signing-secret', name: 'JWT Signing Secret Generator' },
    { slug: 'mysql-database-password', name: 'MySQL Strong Password Generator' },
    { slug: 'postgres-user-password', name: 'PostgreSQL Password Generator' },
    { slug: 'redis-auth-token', name: 'Redis Auth Token Generator' },
    { slug: 'webhook-hmac-secret', name: 'Webhook HMAC Secret Generator' },
    { slug: 'wpa3-wifi-password', name: 'Wi-Fi WPA3 Passkey Generator' },
    { slug: 'env-encryption-key', name: '.env Encryption Key Generator' },
  ];
  const pwLengthsAll = [8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64];
  for (const ek of extraKeyKinds) {
    for (const len of pwLengthsAll) {
      add(
        list,
        seenSlugs,
        nextId,
        `${len}-char-${ek.slug}`,
        `${len}-Character ${ek.name}`,
        'cryptography-security-networking',
        'generator',
        { length: len, kind: ek.slug.includes('password') ? 'strong-password' : 'api-secret-token' }
      );
    }
  }

  // Daily Writing & SEO Text Utilities Matrix
  const writingChannels = [
    'SEO Meta Title', 'SEO Meta Description', 'Twitter X Post', 'LinkedIn Article',
    'YouTube Video Tags', 'Instagram Bio', 'WhatsApp Broadcast', 'Product Listing',
    'Cold Email', 'Academic Abstract', 'Press Release', 'Cover Letter', 'AI Prompt',
    'Slack Message', 'Git Commit Message',
  ];
  const writingActions = [
    { slug: 'word-character-counter', title: 'Word & Character Length Checker' },
    { slug: 'title-case-formatter', title: 'Title Case Formatter' },
    { slug: 'uppercase-converter', title: 'Uppercase Converter' },
    { slug: 'lowercase-converter', title: 'Lowercase Converter' },
    { slug: 'sentence-case-cleaner', title: 'Sentence Case Formatter' },
    { slug: 'whitespace-cleaner', title: 'Extra Space & Line Break Cleaner' },
    { slug: 'emoji-stripper', title: 'Clean Emoji Stripper' },
    { slug: 'duplicate-line-remover', title: 'Duplicate Line Remover' },
    { slug: 'fancy-unicode-font', title: 'Bold Fancy Unicode Styler' },
    { slug: 'url-slug-kebab-case', title: 'SEO Slug Generator (kebab-case)' },
  ];
  for (const ch of writingChannels) {
    const cSlug = ch.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const wa of writingActions) {
      add(
        list,
        seenSlugs,
        nextId,
        `${cSlug}-${wa.slug}`,
        `${ch} ${wa.title}`,
        ch.includes('SEO') || ch.includes('YouTube') || ch.includes('Instagram') || ch.includes('Twitter') || ch.includes('LinkedIn')
          ? 'seo-content-social-media'
          : 'text-string-manipulation',
        'text'
      );
    }
  }

  // QR Code Presets across Everyday Physical / Digital Places
  const extraQrPlaces = [
    'Classroom WiFi', 'Office Guest WiFi', 'Cafe Table WiFi', 'Restaurant Digital Menu',
    'UPI Shop Payment', 'Clinic Appointment', 'Wedding Invitation', 'Google Map Shop',
    'Real Estate Listing', 'Resume Portfolio', 'App Download', 'Feedback Survey',
    'WhatsApp Support', 'Event Check-In', 'Podcast Link', 'YouTube Subscribe',
    'Instagram Follow', 'Product Packaging', 'Warranty Registration', 'Crypto Wallet',
  ];
  for (const qp of extraQrPlaces) {
    const qSlug = qp.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    add(list, seenSlugs, nextId, `${qSlug}-qr-code-creator`, `${qp} QR Code Creator`, 'qr-barcode-generators', 'generator', { qrPreset: qSlug });
    add(list, seenSlugs, nextId, `printable-${qSlug}-qr-poster`, `Printable ${qp} QR Sticker Generator`, 'qr-barcode-generators', 'generator', { qrPreset: qSlug });
  }

  // Additional Data & Spreadsheet Generators (CSV, JSON, SQL, YAML, XML)
  const dataDomains = ['Students', 'Invoices', 'Inventory', 'Leads', 'Transactions', 'Patients', 'Bookings', 'Subscribers', 'Shipments', 'Tickets'];
  const rowCounts = [10, 25, 50, 100, 150, 200];
  for (const dd of dataDomains) {
    const dSlug = dd.toLowerCase();
    for (const rc of rowCounts) {
      add(
        list,
        seenSlugs,
        nextId,
        `mock-${rc}-${dSlug}-csv-generator`,
        `Generate ${rc} Sample ${dd} CSV Rows`,
        'data-csv-spreadsheet',
        'data',
        { mockCount: rc }
      );
    }
  }

  // CSS Aspect Ratio & Screen DPI Display Calculators (Expanded Resolutions & Ratios)
  const extraRes: [number, number, string][] = [
    [1280, 720, '720p HD'], [1366, 768, 'WXGA Laptop'], [1600, 900, 'HD+ Display'],
    [1920, 1200, 'WUXGA 16:10'], [2560, 1080, 'Ultrawide FHD'], [3440, 1440, 'Ultrawide WQHD'],
    [2880, 1800, 'Retina 15"'], [3024, 1964, 'MacBook Pro 14"'], [5120, 2880, '5K Studio Display'],
  ];
  const extraDiags = [13.3, 14, 15.6, 16, 24, 27, 32, 34, 49];
  for (const [rw, rh, rLbl] of extraRes) {
    for (const diag of extraDiags) {
      const dSlug = String(diag).replace('.', '-');
      add(
        list,
        seenSlugs,
        nextId,
        `ppi-dpi-${rLbl.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dSlug}-inch`,
        `${diag}" ${rLbl} (${rw}×${rh}) PPI & Aspect Calculator`,
        'css-ui-design-color',
        'calculator',
        { formula: 'dpi', v1: rw, v2: rh, v3: diag }
      );
    }
  }

  // =========================================================================
  // 9J. EXTRA DAILY HIGH-DEMAND PACK (+1,400 Tools to Clear 25,500+)
  // =========================================================================
  // Popular half-step height / weight / land converters (e.g., 5.5 feet to cm, 1.5 acre to sq feet)
  const halfValues = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];
  for (const tp of topPairs.slice(0, 42)) {
    for (const hv of halfValues) {
      const hvSlug = String(hv).replace('.', '-');
      add(
        list,
        seenSlugs,
        nextId,
        `convert-${hvSlug}-${tp.slug}`,
        `Convert ${hv} ${tp.title}`,
        tp.cat,
        'converter',
        { mode: 'unit-pair', group: tp.group, from: tp.from, to: tp.to, defaultVal: hv }
      );
    }
  }

  // Responsive CSS clamp() Fluid Typography Matrix
  const minPxList = [12, 14, 16, 18, 20, 22, 24, 28, 32];
  const maxPxList = [20, 24, 28, 32, 36, 40, 48, 56, 64, 72];
  const maxViewports = [1024, 1280, 1440, 1600];
  for (const minPx of minPxList) {
    for (const maxPx of maxPxList) {
      if (maxPx <= minPx) continue;
      for (const vp of maxViewports) {
        add(
          list,
          seenSlugs,
          nextId,
          `css-clamp-${minPx}px-to-${maxPx}px-${vp}vw`,
          `CSS clamp() Fluid Font (${minPx}px → ${maxPx}px @ ${vp}px)`,
          'css-ui-design-color',
          'calculator',
          { formula: 'clamp', v1: minPx, v2: maxPx, v3: vp }
        );
      }
    }
  }

  // Popular PNG Exact Canvas + Target Sizes for Logos / UI Icons / Avatars
  const iconPngSizes: [number, number, string][] = [
    [32, 32, 'Favicon 32×32'], [64, 64, 'Sticker 64×64'], [128, 128, 'Emoji 128×128'],
    [180, 180, 'Apple Touch 180×180'], [192, 192, 'PWA Icon 192×192'], [256, 256, 'Desktop Icon 256×256'],
    [512, 512, 'App Store 512×512'], [1024, 1024, 'HQ Square 1024×1024'],
  ];
  const iconKbs = [10, 20, 30, 50, 100, 200, 500];
  for (const [iw, ih, lbl] of iconPngSizes) {
    for (const kb of iconKbs) {
      add(
        list,
        seenSlugs,
        nextId,
        `resize-${iw}x${ih}-${kb}kb-png-optimizer`,
        `Resize & Optimize ${lbl} Under ${kb}KB (PNG)`,
        'image-editing-optimization',
        'image',
        { width: iw, height: ih, targetKb: kb, outputFormat: 'image/png' }
      );
    }
  }

  // Additional Marks Out Of Calculator for Popular Competitive Exams (JEE 300, NEET 720, CBSE 500, UPSC 1750)
  const competitiveTotals: [number, string][] = [
    [300, 'JEE Main'], [360, 'JEE Advanced'], [720, 'NEET UG'],
    [500, 'CBSE Class 12'], [600, 'State Board'], [1000, 'University Semester'], [1750, 'UPSC Mains'],
  ];
  for (const [tot, exName] of competitiveTotals) {
    const step = tot >= 1000 ? 50 : 15;
    for (let sc = step; sc < tot; sc += step) {
      add(
        list,
        seenSlugs,
        nextId,
        `${exName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sc}-out-of-${tot}-percent`,
        `${exName} Score Percentage (${sc} / ${tot} Marks)`,
        'education-academic-tools',
        'calculator',
        { formula: 'what-percent-is', v1: sc, v2: tot, v3: 1 }
      );
    }
  }

  // Everyday Compound Interest & Mutual Fund Lumpsum Wealth Scenarios
  const lumpAmts = [25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000];
  const lumpRates = [8, 10, 12, 14, 15];
  const lumpYears = [3, 5, 7, 10, 12, 15, 20, 25];
  for (const amt of lumpAmts) {
    const aSlug = amt >= 100000 ? `${amt / 100000}-lakh` : `${amt / 1000}k`;
    const aLbl = amt >= 100000 ? `₹${amt / 100000}L` : `₹${amt / 1000}K`;
    for (const r of lumpRates) {
      for (const y of lumpYears) {
        add(
          list,
          seenSlugs,
          nextId,
          `lumpsum-${aSlug}-at-${r}-percent-${y}-years`,
          `Mutual Fund Lumpsum ${aLbl} at ${r}% (${y} Years)`,
          'indian-finance-tax-calculators',
          'calculator',
          { formula: 'compound', v1: amt, v2: r, v3: y }
        );
      }
    }
  }

  // Extended UPI / Payment / Store QR Generators
  const upiApps = ['Google Pay GPay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Amazon Pay', 'CRED UPI'];
  const shopKinds = ['Kirana Store', 'Medical Pharmacy', 'Tea Stall', 'Salon', 'Coaching Center', 'Bakery', 'Gym Membership', 'Parking Fee', 'Donation Box', 'Freelance Invoice'];
  for (const ua of upiApps) {
    for (const sk of shopKinds) {
      const slug = `${ua.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sk.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr`;
      add(
        list,
        seenSlugs,
        nextId,
        slug,
        `${ua} QR Code Generator for ${sk}`,
        'qr-barcode-generators',
        'generator',
        { qrPreset: 'upi-payment' }
      );
    }
  }
}
