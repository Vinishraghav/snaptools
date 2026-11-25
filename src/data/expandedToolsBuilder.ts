import { appendDailyUtilityTools } from './expandedPack25k';

export type ToolEngine =
  | 'pdf'
  | 'image'
  | 'text'
  | 'developer'
  | 'data'
  | 'calculator'
  | 'converter'
  | 'media'
  | 'generator';

export interface ToolSpec {
  [key: string]: string | number | boolean | undefined;
}

export interface CompactToolSeed {
  id: number;
  slug: string;
  title: string;
  category: string;
  engine: ToolEngine;
  spec?: ToolSpec;
}

type SeedEntry = [number, string, string, string, ToolEngine, ToolSpec?];

function addTool(
  list: CompactToolSeed[],
  seenSlugs: Set<string>,
  nextIdRef: { value: number },
  slug: string,
  title: string,
  category: string,
  engine: ToolEngine,
  spec?: ToolSpec
) {
  if (seenSlugs.has(slug)) return;
  seenSlugs.add(slug);
  list.push({
    id: nextIdRef.value++,
    slug,
    title,
    category,
    engine,
    spec,
  });
}

const UNIT_LABEL_NAMES: Record<string, Record<string, string>> = {
  length: {
    millimeter: 'Millimeters (mm)',
    centimeter: 'Centimeters (cm)',
    meter: 'Meters (m)',
    kilometer: 'Kilometers (km)',
    inch: 'Inches (in)',
    foot: 'Feet (ft)',
    yard: 'Yards (yd)',
    mile: 'Miles (mi)',
  },
  weight: {
    milligram: 'Milligrams (mg)',
    gram: 'Grams (g)',
    kilogram: 'Kilograms (kg)',
    metric_ton: 'Metric Tons (t)',
    ounce: 'Ounces (oz)',
    pound: 'Pounds (lbs)',
    tola_india: 'Tola (India)',
    troy_ounce: 'Troy Ounces',
    carat: 'Carats (ct)',
  },
  area: {
    sq_millimeter: 'Square Millimeters',
    sq_centimeter: 'Square Centimeters',
    sq_feet: 'Square Feet (sq ft)',
    sq_yard_gaj: 'Square Yards (Gaj)',
    sq_meter: 'Square Meters (sq m)',
    cent: 'Cent',
    ground: 'Ground (Tamil Nadu)',
    guntha: 'Guntha',
    bigha: 'Bigha',
    acre: 'Acres',
    hectare: 'Hectares',
    sq_km: 'Square Kilometers',
  },
  volume: {
    milliliter: 'Milliliters (mL)',
    teaspoon_tsp: 'Teaspoons (tsp)',
    tablespoon_tbsp: 'Tablespoons (tbsp)',
    cup_us: 'Cups (US)',
    pint_us: 'Pints',
    quart_us: 'Quarts',
    liter: 'Liters (L)',
    gallon_us: 'Gallons (US)',
    cubic_meter: 'Cubic Meters (m³)',
  },
  time: {
    nanosecond: 'Nanoseconds',
    microsecond: 'Microseconds',
    millisecond: 'Milliseconds (ms)',
    second: 'Seconds (s)',
    minute: 'Minutes (min)',
    hour: 'Hours (hr)',
    day: 'Days',
    week: 'Weeks',
    year_365: 'Years',
  },
  storage: {
    bit: 'Bits',
    byte: 'Bytes',
    kilobyte: 'Kilobytes (KB)',
    megabyte: 'Megabytes (MB)',
    gigabyte: 'Gigabytes (GB)',
    terabyte: 'Terabytes (TB)',
    petabyte: 'Petabytes (PB)',
  },
  transfer: {
    bps: 'bps',
    kbps: 'Kbps',
    mbps: 'Mbps',
    gbps: 'Gbps',
    KB_per_sec: 'KB/s',
    MB_per_sec: 'MB/s',
    GB_per_sec: 'GB/s',
  },
  pressure: {
    pascal: 'Pascal (Pa)',
    kilopascal: 'Kilopascal (kPa)',
    bar: 'Bar',
    psi: 'PSI',
    atm: 'Atmosphere (atm)',
    mmHg_torr: 'mmHg (Torr)',
  },
  energy: {
    joule: 'Joules (J)',
    kilojoule: 'Kilojoules (kJ)',
    calorie: 'Calories (cal)',
    kilocalorie_kcal: 'Kilocalories (kcal)',
    watt_hour: 'Watt-Hours (Wh)',
    kilowatt_hour_kWh: 'Kilowatt-Hours (kWh)',
    btu: 'BTU',
  },
  power: {
    watt: 'Watts (W)',
    kilowatt: 'Kilowatts (kW)',
    megawatt: 'Megawatts (MW)',
    horsepower_hp: 'Horsepower (HP)',
    btu_per_hour: 'BTU/hr',
  },
  force: {
    dyne: 'Dyne',
    newton: 'Newtons (N)',
    kilonewton: 'Kilonewtons (kN)',
    kgf: 'Kilogram-Force (kgf)',
    pound_force_lbf: 'Pound-Force (lbf)',
  },
  torque: {
    newton_meter: 'Newton-Meters (Nm)',
    lb_ft: 'Pound-Feet (lb-ft)',
    kgf_meter: 'Kilogram-Meters (kgf·m)',
  },
  density: {
    kg_per_m3: 'kg/m³',
    g_per_cm3: 'g/cm³',
    lb_per_ft3: 'lb/ft³',
  },
  angle: {
    degree: 'Degrees (°)',
    radian: 'Radians (rad)',
    gradian: 'Gradians (gon)',
    arcminute: 'Arcminutes (′)',
  },
  frequency: {
    hertz_hz: 'Hertz (Hz)',
    kilohertz_khz: 'Kilohertz (kHz)',
    megahertz_mhz: 'Megahertz (MHz)',
    gigahertz_ghz: 'Gigahertz (GHz)',
  },
  typography: {
    px_96dpi: 'Pixels (px)',
    pt_point: 'Points (pt)',
    em_16px: 'EM',
    millimeter: 'Millimeters (mm)',
    centimeter: 'Centimeters (cm)',
    inch: 'Inches (in)',
  },
  charge: {
    coulomb: 'Coulombs (C)',
    mAh: 'mAh',
    Ah: 'Ah',
    faraday: 'Faradays',
  },
  fuel: {
    km_per_liter: 'km/L',
    mpg_us: 'MPG (US)',
    mpg_uk: 'MPG (UK)',
    liters_per_100km: 'L/100km',
  },
  astronomical: {
    kilometer: 'Kilometers (km)',
    au_astronomical_unit: 'Astronomical Units (AU)',
    light_year: 'Light Years (ly)',
    parsec: 'Parsecs (pc)',
  },
  temperature: {
    celsius: 'Celsius (°C)',
    fahrenheit: 'Fahrenheit (°F)',
    kelvin: 'Kelvin (K)',
  },
  speed: {
    km_h: 'km/h',
    mph: 'mph',
    m_s: 'm/s',
    knot: 'Knots',
    mach: 'Mach',
  },
};

function shortSlug(k: string): string {
  return k.replace(/_us|_india|_365|_per_sec|_96dpi|_16px|_point|_year/g, '').replace(/_/g, '-');
}

function shortTitle(s: string): string {
  return s.replace(/\s*\([^)]*\)/g, '').trim();
}

export function buildAllTools(baseSeeds: SeedEntry[]): CompactToolSeed[] {
  const list: CompactToolSeed[] = [];
  const seenSlugs = new Set<string>();
  let maxId = 0;

  for (const [id, slug, title, category, engine, spec] of baseSeeds) {
    seenSlugs.add(slug);
    list.push({ id, slug, title, category, engine, spec });
    if (id > maxId) maxId = id;
  }

  const nextId = { value: maxId + 1 };

  // =========================================================================
  // 1. ALL UNIT-TO-UNIT PAIRWISE CONVERTERS (~740+ 100% Working Tools)
  // =========================================================================
  for (const [group, unitMap] of Object.entries(UNIT_LABEL_NAMES)) {
    const keys = Object.keys(unitMap);
    const cat =
      group === 'area'
        ? 'construction-home-land-measurement'
        : ['force', 'torque', 'pressure', 'energy', 'power', 'density', 'charge', 'astronomical'].includes(group)
          ? 'geometry-physics-engineering'
          : group === 'typography'
            ? 'css-ui-design-color'
            : 'unit-measurement-converters';

    for (const u1 of keys) {
      for (const u2 of keys) {
        if (u1 === u2) continue;
        const slug = `${shortSlug(u1)}-to-${shortSlug(u2)}-converter`;
        const title = `${shortTitle(unitMap[u1])} to ${shortTitle(unitMap[u2])} Converter`;
        addTool(list, seenSlugs, nextId, slug, title, cat, 'converter', {
          mode: 'unit-pair',
          group,
          from: u1,
          to: u2,
        });
      }
    }
  }

  // Number Base Pairwise Converters (20 exact pairs)
  const bases = [
    { key: 'binary', base: 2, label: 'Binary' },
    { key: 'octal', base: 8, label: 'Octal' },
    { key: 'decimal', base: 10, label: 'Decimal' },
    { key: 'hex', base: 16, label: 'Hexadecimal' },
    { key: 'base36', base: 36, label: 'Base36' },
  ];
  for (const b1 of bases) {
    for (const b2 of bases) {
      if (b1.key === b2.key) continue;
      addTool(
        list,
        seenSlugs,
        nextId,
        `${b1.key}-to-${b2.key}-number-converter`,
        `${b1.label} to ${b2.label} Number Converter`,
        'developer-code-formatters',
        'converter',
        { mode: 'base-pair', fromBase: b1.base, toBase: b2.base }
      );
    }
  }

  // =========================================================================
  // 2. TARGET KB IMAGE COMPRESSORS, PIXEL RESIZERS & FORMAT/FILTER COMBINATORS (~550 Tools)
  // =========================================================================
  const kbSizes = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 120, 150, 200, 250, 300, 400, 500, 750, 1024];
  const imgKinds = [
    { slug: 'image', label: 'Image', format: 'image/jpeg' },
    { slug: 'jpg', label: 'JPG Photo', format: 'image/jpeg' },
    { slug: 'png', label: 'PNG Image', format: 'image/jpeg' },
    { slug: 'webp', label: 'WebP Image', format: 'image/webp' },
    { slug: 'signature', label: 'Exam Signature', format: 'image/jpeg' },
    { slug: 'passport-photo', label: 'Passport Photo', format: 'image/jpeg' },
    { slug: 'pan-card-photo', label: 'PAN Card Photo', format: 'image/jpeg' },
    { slug: 'upsc-photo', label: 'UPSC Application Photo', format: 'image/jpeg' },
    { slug: 'ssc-photo', label: 'SSC Form Photo', format: 'image/jpeg' },
    { slug: 'aadhaar-photo', label: 'Document Photo', format: 'image/jpeg' },
  ];
  for (const kind of imgKinds) {
    for (const kb of kbSizes) {
      const kbLabel = kb >= 1024 ? '1MB' : `${kb}KB`;
      const kbSlug = kb >= 1024 ? '1mb' : `${kb}kb`;
      addTool(
        list,
        seenSlugs,
        nextId,
        `compress-${kind.slug}-to-${kbSlug}`,
        `Compress ${kind.label} to ${kbLabel}`,
        'image-editing-optimization',
        'image',
        { targetKb: kb, outputFormat: kind.format }
      );
    }
  }

  // Square & Social/Exam Pixel Resizers
  const squareDims = [16, 24, 32, 48, 64, 72, 96, 120, 128, 144, 150, 160, 180, 192, 200, 213, 240, 250, 256, 300, 320, 400, 480, 500, 512, 600, 640, 720, 800, 900, 1000, 1024, 1080, 1200, 1500, 2048];
  const imgOutExts = [
    { ext: 'png', mime: 'image/png', label: 'PNG' },
    { ext: 'jpg', mime: 'image/jpeg', label: 'JPG' },
    { ext: 'webp', mime: 'image/webp', label: 'WebP' },
  ];
  for (const d of squareDims) {
    for (const fmt of imgOutExts) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `resize-${fmt.ext}-image-to-${d}x${d}`,
        `Resize ${fmt.label} Image to ${d}×${d} px`,
        'image-editing-optimization',
        'image',
        { width: d, height: d, outputFormat: fmt.mime }
      );
    }
  }

  const rectDims: [number, number, string][] = [
    [320, 240, '320×240 QVGA'],
    [640, 480, '640×480 VGA'],
    [800, 600, '800×600 SVGA'],
    [1024, 768, '1024×768 XGA'],
    [1200, 628, '1200×628 LinkedIn / Ad'],
    [1200, 630, '1200×630 OpenGraph Social'],
    [1280, 720, '1280×720 YouTube Thumbnail'],
    [1366, 768, '1366×768 Laptop Banner'],
    [1440, 900, '1440×900 Hero Banner'],
    [1500, 500, '1500×500 X Header'],
    [1584, 396, '1584×396 LinkedIn Cover'],
    [1600, 900, '1600×900 Widescreen'],
    [1920, 1080, '1920×1080 Full HD'],
    [1080, 1350, '1080×1350 Instagram Portrait'],
    [1080, 1920, '1080×1920 Story / Reels'],
    [2560, 1440, '2560×1440 QHD'],
    [3840, 2160, '3840×2160 4K UHD'],
    [350, 450, 'Passport 35×45mm'],
    [413, 531, 'Indian Visa Photo'],
    [600, 200, 'Exam Signature Banner'],
  ];
  for (const [w, h, desc] of rectDims) {
    for (const fmt of imgOutExts) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `resize-${fmt.ext}-to-${w}x${h}`,
        `Resize ${fmt.label} to ${desc}`,
        'image-editing-optimization',
        'image',
        { width: w, height: h, outputFormat: fmt.mime }
      );
    }
  }

  // Image Source Format -> Filter/Target Matrix
  const srcFormats = ['png', 'jpg', 'webp', 'bmp', 'gif', 'svg', 'avif', 'ico'];
  const imgTransforms = [
    { slug: 'grayscale', label: 'Grayscale', filter: 'grayscale' },
    { slug: 'sepia', label: 'Sepia Vintage', filter: 'sepia' },
    { slug: 'blur', label: 'Blur Background', filter: 'blur' },
    { slug: 'pixelate', label: 'Pixelate Censor', filter: 'pixelate' },
    { slug: 'rotate-90', label: 'Rotate 90°', filter: 'rotate90' },
    { slug: 'rotate-180', label: 'Rotate 180°', filter: 'rotate180' },
    { slug: 'flip-horizontal', label: 'Flip Horizontal', filter: 'flipH' },
    { slug: 'white-border', label: 'Add White Border', filter: 'border' },
    { slug: 'square-1-1', label: 'Square 1:1 Crop', filter: 'square' },
    { slug: 'circle-avatar', label: 'Circle Avatar', filter: 'circle' },
    { slug: 'base64-string', label: 'to Base64 Data URI', filter: 'base64' },
  ];
  for (const sf of srcFormats) {
    for (const tr of imgTransforms) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `${sf}-image-${tr.slug}`,
        `${sf.toUpperCase()} Image ${tr.label}`,
        'image-editing-optimization',
        'image',
        { filter: tr.filter, outputFormat: sf === 'jpg' ? 'image/jpeg' : sf === 'webp' ? 'image/webp' : 'image/png' }
      );
    }
  }

  // =========================================================================
  // 3. SPECIALIZED CALCULATORS (EMI, SIP, FD, GST, Discount, Percent, Geometry, Physics, Net) (~1,350 Tools)
  // =========================================================================
  const loanTypes = [
    { slug: 'home-loan', name: 'Home Loan', rate: 8.5 },
    { slug: 'car-loan', name: 'Car Loan', rate: 9.2 },
    { slug: 'personal-loan', name: 'Personal Loan', rate: 11.5 },
    { slug: 'education-loan', name: 'Education Loan', rate: 9.5 },
    { slug: 'business-loan', name: 'Business Loan', rate: 13.0 },
    { slug: 'gold-loan', name: 'Gold Loan', rate: 9.8 },
    { slug: 'bike-loan', name: 'Two-Wheeler Loan', rate: 11.0 },
  ];
  const loanAmounts = [
    { slug: '1-lakh', val: 100000, label: '₹1 Lakh' },
    { slug: '2-lakh', val: 200000, label: '₹2 Lakh' },
    { slug: '3-lakh', val: 300000, label: '₹3 Lakh' },
    { slug: '5-lakh', val: 500000, label: '₹5 Lakh' },
    { slug: '7-lakh', val: 700000, label: '₹7 Lakh' },
    { slug: '10-lakh', val: 1000000, label: '₹10 Lakh' },
    { slug: '15-lakh', val: 1500000, label: '₹15 Lakh' },
    { slug: '20-lakh', val: 2000000, label: '₹20 Lakh' },
    { slug: '25-lakh', val: 2500000, label: '₹25 Lakh' },
    { slug: '30-lakh', val: 3000000, label: '₹30 Lakh' },
    { slug: '40-lakh', val: 4000000, label: '₹40 Lakh' },
    { slug: '50-lakh', val: 5000000, label: '₹50 Lakh' },
    { slug: '75-lakh', val: 7500000, label: '₹75 Lakh' },
    { slug: '1-crore', val: 10000000, label: '₹1 Crore' },
    { slug: '2-crore', val: 20000000, label: '₹2 Crore' },
  ];
  const loanYears = [3, 5, 10, 15, 20, 25];

  for (const lt of loanTypes) {
    for (const amt of loanAmounts) {
      for (const yrs of loanYears) {
        addTool(
          list,
          seenSlugs,
          nextId,
          `${amt.slug}-${lt.slug}-emi-${yrs}-years`,
          `${amt.label} ${lt.name} EMI Calculator (${yrs} Years)`,
          'indian-finance-tax-calculators',
          'calculator',
          { formula: 'emi', v1: amt.val, v2: lt.rate, v3: yrs }
        );
      }
    }
  }

  // SIP Mutual Fund Presets
  const sipAmounts = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000];
  const sipYears = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30];
  for (const amt of sipAmounts) {
    for (const yrs of sipYears) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `sip-${amt}-per-month-for-${yrs}-years`,
        `₹${amt.toLocaleString('en-IN')}/Month SIP Calculator (${yrs} Years)`,
        'indian-finance-tax-calculators',
        'calculator',
        { formula: 'sip', v1: amt, v2: 12, v3: yrs }
      );
    }
  }

  // FD & Compound Interest Presets
  const depositAmounts = [10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000, 10000000];
  const depositYears = [1, 2, 3, 5, 7, 10];
  const depositTypes = [
    { slug: 'fixed-deposit', name: 'Fixed Deposit (FD)', rate: 7.1 },
    { slug: 'compound-interest', name: 'Compound Interest', rate: 8.5 },
  ];
  for (const dt of depositTypes) {
    for (const amt of depositAmounts) {
      for (const yrs of depositYears) {
        const amtLabel = amt >= 100000 ? `${amt / 100000}-lakh` : `${amt / 1000}k`;
        const amtTitle = amt >= 100000 ? `₹${amt / 100000} Lakh` : `₹${amt / 1000}K`;
        addTool(
          list,
          seenSlugs,
          nextId,
          `${amtLabel}-${dt.slug}-${yrs}-year`,
          `${amtTitle} ${dt.name} Calculator (${yrs} Yr)`,
          'indian-finance-tax-calculators',
          'calculator',
          { formula: 'compound', v1: amt, v2: dt.rate, v3: yrs }
        );
      }
    }
  }

  // GST Slab & Industry Calculators
  const gstSlabs = [3, 5, 12, 18, 28];
  const gstSectors = ['General', 'Electronics', 'SaaS Software', 'Restaurant', 'Real Estate', 'Textiles', 'Transport', 'Medical', 'Jewelry', 'E-Commerce'];
  for (const slab of gstSlabs) {
    for (const sec of gstSectors) {
      const secSlug = sec.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addTool(
        list,
        seenSlugs,
        nextId,
        `${slab}-percent-gst-${secSlug}-calculator`,
        `${slab}% GST ${sec} Tax Calculator`,
        'business-ecommerce-accounting',
        'calculator',
        { formula: 'gst', v1: 10000, v2: slab, v3: 1 }
      );
    }
  }

  // Discounts (5% to 95%) & Specific Percentage Calculators
  for (let pct = 5; pct <= 95; pct += 5) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `${pct}-percent-discount-sale-calculator`,
      `${pct}% Off Discount Price Calculator`,
      'business-ecommerce-accounting',
      'calculator',
      { formula: 'discount', v1: 1000, v2: pct, v3: 1 }
    );
    addTool(
      list,
      seenSlugs,
      nextId,
      `${pct}-percent-markup-profit-calculator`,
      `${pct}% Markup & Retail Price Calculator`,
      'business-ecommerce-accounting',
      'calculator',
      { formula: 'markup-target', v1: 500, v2: pct, v3: 1 }
    );
  }
  const pctValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 22, 25, 30, 33, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 120, 150, 200];
  for (const p of pctValues) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `what-is-${p}-percent-of-number-calculator`,
      `${p}% Percentage Calculator`,
      'mathematics-algebra-statistics',
      'calculator',
      { formula: 'percent-of', v1: p, v2: 1000, v3: 1 }
    );
  }

  // 2D / 3D Geometry, Physics & Civil Construction Formulas
  const formulaDefs: { slug: string; title: string; cat: string; formula: string; v1: number; v2: number; v3: number }[] = [
    { slug: 'circle-area-circumference-calculator', title: 'Circle Area & Circumference Calculator', cat: 'geometry-physics-engineering', formula: 'circle', v1: 10, v2: 1, v3: 1 },
    { slug: 'rectangle-area-perimeter-calculator', title: 'Rectangle Area & Perimeter Calculator', cat: 'geometry-physics-engineering', formula: 'rectangle', v1: 12, v2: 8, v3: 1 },
    { slug: 'triangle-area-calculator', title: 'Triangle Area Calculator (Base & Height)', cat: 'geometry-physics-engineering', formula: 'triangle', v1: 10, v2: 6, v3: 1 },
    { slug: 'right-triangle-hypotenuse-pythagoras-calculator', title: 'Pythagoras Hypotenuse Calculator', cat: 'geometry-physics-engineering', formula: 'pythagoras', v1: 3, v2: 4, v3: 1 },
    { slug: 'sphere-volume-surface-area-calculator', title: 'Sphere Volume & Surface Area Calculator', cat: 'geometry-physics-engineering', formula: 'sphere', v1: 5, v2: 1, v3: 1 },
    { slug: 'cylinder-volume-surface-area-calculator', title: 'Cylinder Volume & Surface Area Calculator', cat: 'geometry-physics-engineering', formula: 'cylinder', v1: 5, v2: 12, v3: 1 },
    { slug: 'cone-volume-slant-calculator', title: 'Cone Volume & Surface Area Calculator', cat: 'geometry-physics-engineering', formula: 'cone', v1: 5, v2: 12, v3: 1 },
    { slug: 'cube-volume-diagonal-calculator', title: 'Cube Volume & Diagonal Calculator', cat: 'geometry-physics-engineering', formula: 'cube', v1: 6, v2: 1, v3: 1 },
    { slug: 'quadratic-equation-roots-calculator', title: 'Quadratic Equation Solver (ax² + bx + c = 0)', cat: 'mathematics-algebra-statistics', formula: 'quadratic', v1: 1, v2: -5, v3: 6 },
    { slug: 'simple-interest-rate-calculator', title: 'Simple Interest Calculator', cat: 'mathematics-algebra-statistics', formula: 'simple-interest', v1: 50000, v2: 8, v3: 3 },
    { slug: 'ohms-law-voltage-power-calculator', title: "Ohm's Law Voltage & Power Calculator (V = IR)", cat: 'geometry-physics-engineering', formula: 'ohms', v1: 5, v2: 10, v3: 1 },
    { slug: 'kinetic-energy-physics-calculator', title: 'Kinetic Energy Calculator (½mv²)', cat: 'geometry-physics-engineering', formula: 'kinetic', v1: 10, v2: 15, v3: 1 },
    { slug: 'potential-energy-gravity-calculator', title: 'Gravitational Potential Energy (mgh)', cat: 'geometry-physics-engineering', formula: 'potential', v1: 10, v2: 20, v3: 9.81 },
    { slug: 'force-mass-acceleration-newton-calculator', title: 'Force Calculator (F = ma)', cat: 'geometry-physics-engineering', formula: 'force', v1: 25, v2: 9.81, v3: 1 },
    { slug: 'speed-distance-time-calculator', title: 'Speed, Distance & Time Calculator', cat: 'geometry-physics-engineering', formula: 'speed', v1: 120, v2: 2, v3: 1 },
    { slug: 'concrete-slab-volume-bags-calculator', title: 'Concrete Slab Volume & Cement Bags Estimator', cat: 'construction-home-land-measurement', formula: 'concrete', v1: 20, v2: 15, v3: 0.5 },
    { slug: 'wall-brick-masonry-estimator', title: 'Wall Brick & Mortar Quantity Estimator', cat: 'construction-home-land-measurement', formula: 'brick', v1: 12, v2: 10, v3: 1 },
    { slug: 'room-floor-tile-quantity-calculator', title: 'Floor Tile Quantity & Cost Calculator', cat: 'construction-home-land-measurement', formula: 'tile', v1: 15, v2: 12, v3: 4 },
    { slug: 'wall-paint-liter-coverage-calculator', title: 'Wall Paint Liters & Coats Coverage Calculator', cat: 'construction-home-land-measurement', formula: 'paint', v1: 14, v2: 10, v3: 2 },
    { slug: 'cgpa-to-percentage-indian-university-calculator', title: 'CGPA to Percentage Calculator (9.5 Multiplier)', cat: 'education-academic-tools', formula: 'cgpa', v1: 8.6, v2: 9.5, v3: 100 },
  ];
  for (const f of formulaDefs) {
    addTool(list, seenSlugs, nextId, f.slug, f.title, f.cat, 'calculator', {
      formula: f.formula,
      v1: f.v1,
      v2: f.v2,
      v3: f.v3,
    });
  }

  // Geometry / Physics / Construction Multi-Unit Scale Presets (Meters, Feet, Inches, CM)
  const units = ['Meters', 'Feet', 'Inches', 'Centimeters'];
  for (const u of units) {
    for (const f of formulaDefs.slice(0, 8)) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `${f.slug}-in-${u.toLowerCase()}`,
        `${f.title} (${u})`,
        f.cat,
        'calculator',
        { formula: f.formula, v1: f.v1, v2: f.v2, v3: f.v3, unit: u }
      );
    }
  }

  // IPv4 Subnet Presets /8 .. /30
  for (let prefix = 8; prefix <= 30; prefix++) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `ipv4-cidr-slash-${prefix}-subnet-calculator`,
      `IPv4 /${prefix} Subnet Mask & Host Calculator`,
      'cryptography-security-networking',
      'calculator',
      { cidr: `192.168.1.0/${prefix}` }
    );
  }

  // Linux Chmod Presets
  const chmodPresets: [number, number, number, string][] = [
    [4, 0, 0, 'Owner Read-Only (SSH Key)'],
    [4, 4, 4, 'All Read-Only'],
    [6, 0, 0, 'Private Read/Write'],
    [6, 4, 0, 'Group Readable'],
    [6, 4, 4, 'Standard File'],
    [6, 6, 4, 'Shared Team File'],
    [6, 6, 6, 'All Read/Write'],
    [7, 0, 0, 'Owner Full Script'],
    [7, 5, 0, 'Group Executable'],
    [7, 5, 5, 'Standard Web Directory'],
    [7, 7, 5, 'Collaborative Directory'],
    [7, 7, 7, 'Full Access All'],
  ];
  for (const [o, g, p, desc] of chmodPresets) {
    const code = `${o}${g}${p}`;
    addTool(
      list,
      seenSlugs,
      nextId,
      `linux-chmod-${code}-permission-calculator`,
      `Linux chmod ${code} Permission Calculator (${desc})`,
      'cryptography-security-networking',
      'calculator',
      { chmodO: o, chmodG: g, chmodP: p }
    );
  }

  // Aspect Ratio & Screen PPI Presets
  const ratios: [number, number, string][] = [
    [16, 9, '16:9 HD/4K Widescreen'],
    [4, 3, '4:3 Classic Display'],
    [21, 9, '21:9 Ultrawide'],
    [9, 16, '9:16 Vertical Reels/Shorts'],
    [1, 1, '1:1 Square Post'],
    [3, 2, '3:2 DSLR Photo'],
    [16, 10, '16:10 Laptop Display'],
  ];
  for (const [rw, rh, name] of ratios) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `aspect-ratio-${rw}-${rh}-scaler`,
      `${name} Aspect Ratio Calculator`,
      'css-ui-design-color',
      'calculator',
      { formula: 'aspect-ratio', v1: rw * 120, v2: rh * 120, v3: 1920 }
    );
  }

  const screenSizes = [5.5, 6.1, 6.7, 11, 13.3, 14, 15.6, 16, 21.5, 24, 27, 32, 34, 43, 55, 65];
  const resolutions: [number, number, string][] = [
    [1920, 1080, '1080p Full HD'],
    [2560, 1440, '1440p QHD'],
    [3840, 2160, '4K UHD'],
  ];
  for (const inches of screenSizes) {
    for (const [rw, rh, rName] of resolutions) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `screen-ppi-${String(inches).replace('.', '-')}-inch-${rName.split(' ')[0].toLowerCase()}`,
        `${inches}" ${rName} Screen PPI & Pixel Density Calculator`,
        'hardware-browser-utilities',
        'calculator',
        { formula: 'dpi', v1: rw, v2: rh, v3: inches }
      );
    }
  }

  // =========================================================================
  // 4. SECURITY TOKENS, CRYPTO HASHES, QR, BARCODE, TIMERS, DICE (~520 Tools)
  // =========================================================================
  const pwLengths = [6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
  const pwKinds = [
    { slug: 'strong-password', name: 'Strong Password Generator' },
    { slug: 'alphanumeric-password', name: 'Alphanumeric Password Generator' },
    { slug: 'wifi-wpa2-key', name: 'Wi-Fi WPA2 Password Generator' },
    { slug: 'api-secret-token', name: 'API Secret Token Generator' },
    { slug: 'nanoid-id', name: 'NanoID Random ID Generator' },
    { slug: 'pin-code', name: 'Numeric PIN Generator' },
  ];
  for (const kind of pwKinds) {
    for (const len of pwLengths) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `${len}-character-${kind.slug}`,
        `${len}-Character ${kind.name}`,
        'cryptography-security-networking',
        'generator',
        { length: len, kind: kind.slug }
      );
    }
  }

  const qrUseCases = [
    'Website URL', 'Wi-Fi Login', 'WhatsApp Chat', 'UPI Payment', 'Email Address', 'SMS Message',
    'Phone Number', 'Instagram Profile', 'YouTube Channel', 'LinkedIn Profile', 'Facebook Page',
    'X Twitter Profile', 'GitHub Repo', 'Google Maps Location', 'Google Review Link', 'Restaurant Menu',
    'Event RSVP Ticket', 'Zoom Meeting', 'App Store Link', 'PayPal Payment', 'Telegram Channel',
    'Discord Invite', 'Spotify Track', 'Digital Business Card', 'Resume Link',
  ];
  for (const useCase of qrUseCases) {
    const ucSlug = useCase.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addTool(
      list,
      seenSlugs,
      nextId,
      `${ucSlug}-qr-code-maker`,
      `${useCase} QR Code Generator`,
      'qr-barcode-generators',
      'generator',
      { qrPreset: ucSlug }
    );
    addTool(
      list,
      seenSlugs,
      nextId,
      `custom-hd-${ucSlug}-qr-generator`,
      `HD Printable ${useCase} QR Code Maker`,
      'qr-barcode-generators',
      'generator',
      { qrPreset: ucSlug }
    );
  }

  const timerMinutes = [1, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 120];
  const timerModes = ['Focus Study', 'Pomodoro Work', 'Workout HIIT', 'Meditation', 'Exam Mock Test', 'Cooking Kitchen'];
  for (const tm of timerModes) {
    for (const mins of timerMinutes) {
      const tSlug = tm.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addTool(
        list,
        seenSlugs,
        nextId,
        `${mins}-minute-${tSlug}-timer`,
        `${mins}-Minute ${tm} Countdown Timer`,
        'date-time-travel-utilities',
        'generator',
        { minutes: mins }
      );
    }
  }

  const diceSides = [4, 6, 8, 10, 12, 20, 100];
  for (const s of diceSides) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `roll-d${s}-polyhedral-dice`,
      `Online D${s} Virtual Dice Roller (1-${s})`,
      'qr-barcode-generators',
      'generator',
      { sides: s }
    );
  }

  const hashAlgos = [
    { key: 'sha-1', name: 'SHA-1' },
    { key: 'sha-256', name: 'SHA-256' },
    { key: 'sha-384', name: 'SHA-384' },
    { key: 'sha-512', name: 'SHA-512' },
  ];
  const hashTargets = ['String Text', 'Password Checksum', 'API Payload', 'JSON Object', 'Email Address', 'License Key'];
  for (const ha of hashAlgos) {
    for (const ht of hashTargets) {
      const hSlug = ht.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addTool(
        list,
        seenSlugs,
        nextId,
        `${ha.key}-${hSlug}-hash-generator`,
        `${ha.name} ${ht} Hash Generator`,
        'cryptography-security-networking',
        'generator',
        { algo: ha.key }
      );
    }
  }

  // =========================================================================
  // 5. TEXT CIPHERS (ROT1-ROT25), EXTRACTORS, AFFIXES & LOREM (~320 Tools)
  // =========================================================================
  for (let shift = 1; shift <= 25; shift++) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `caesar-cipher-rot-${shift}-encoder`,
      `Caesar Cipher ROT-${shift} Encoder & Decoder`,
      'text-string-manipulation',
      'text',
      { shift }
    );
  }
  for (let paras = 1; paras <= 20; paras++) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `generate-${paras}-paragraphs-lorem-ipsum`,
      `Generate ${paras} Paragraph${paras > 1 ? 's' : ''} of Lorem Ipsum`,
      'text-string-manipulation',
      'text',
      { loremCount: paras }
    );
  }
  const affixes = [
    { slug: 'markdown-quote-prefix', title: 'Add > Blockquote Prefix to Every Line', affix: '> ', isSuffix: false },
    { slug: 'bullet-dot-prefix', title: 'Add • Bullet Prefix to Every Line', affix: '• ', isSuffix: false },
    { slug: 'dash-list-prefix', title: 'Add - Dash Prefix to Every Line', affix: '- ', isSuffix: false },
    { slug: 'checkbox-task-prefix', title: 'Add [ ] Checklist Prefix to Every Line', affix: '- [ ] ', isSuffix: false },
    { slug: 'js-comment-prefix', title: 'Add // Code Comment Prefix to Lines', affix: '// ', isSuffix: false },
    { slug: 'python-hash-prefix', title: 'Add # Comment Prefix to Every Line', affix: '# ', isSuffix: false },
    { slug: 'sql-comment-prefix', title: 'Add -- SQL Comment Prefix to Lines', affix: '-- ', isSuffix: false },
    { slug: 'semicolon-suffix', title: 'Add ; Semicolon Suffix to Every Line', affix: ';', isSuffix: true },
    { slug: 'comma-suffix', title: 'Add , Comma Suffix to Every Line', affix: ',', isSuffix: true },
    { slug: 'br-html-suffix', title: 'Add <br> Tag Suffix to Every Line', affix: '<br>', isSuffix: true },
  ];
  for (const ax of affixes) {
    addTool(
      list,
      seenSlugs,
      nextId,
      ax.slug,
      ax.title,
      'text-string-manipulation',
      'text',
      { affix: ax.affix, suffixMode: ax.isSuffix }
    );
  }

  const textContexts = ['Essay', 'Blog Post', 'Instagram Caption', 'YouTube Description', 'LinkedIn Post', 'Twitter Thread', 'College Assignment', 'Research Paper', 'Code Documentation', 'Resume Summary'];
  const textOps = [
    { slug: 'word-counter', title: 'Word & Character Counter' },
    { slug: 'uppercase-converter', title: 'Uppercase Converter' },
    { slug: 'lowercase-converter', title: 'Lowercase Converter' },
    { slug: 'title-case-converter', title: 'Title Case Formatter' },
    { slug: 'sentence-case-converter', title: 'Sentence Case Formatter' },
    { slug: 'whitespace-cleaner', title: 'Extra Space & Line Cleaner' },
    { slug: 'emoji-stripper', title: 'Emoji Remover' },
    { slug: 'duplicate-line-remover', title: 'Duplicate Line Remover' },
    { slug: 'fancy-unicode-font', title: 'Bold Fancy Unicode Converter' },
  ];
  for (const ctx of textContexts) {
    for (const op of textOps) {
      const cSlug = ctx.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addTool(
        list,
        seenSlugs,
        nextId,
        `${cSlug}-${op.slug}`,
        `${ctx} ${op.title}`,
        'seo-content-social-media',
        'text'
      );
    }
  }

  // =========================================================================
  // 6. DEVELOPER REGEX PATTERNS, CODE FORMATTERS & TABULAR CONVERSIONS (~350 Tools)
  // =========================================================================
  const regexPresets: [string, string, string][] = [
    ['email-address', 'Email Address Validation Regex Tester', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-z]{2,}'],
    ['indian-mobile-number', 'Indian Mobile (+91) Regex Tester', '(?:\\+91|91|0)?[6-9]\\d{9}'],
    ['us-phone-number', 'US Phone Number Regex Tester', '(?:\\+?1[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}'],
    ['indian-pan-card', 'Indian PAN Card Format Regex Tester', '[A-Z]{5}[0-9]{4}[A-Z]'],
    ['indian-gstin', 'Indian GSTIN Number Regex Tester', '\\d{2}[A-Z]{5}\\d{4}[A-Z]\\d[Z][A-Z\\d]'],
    ['indian-ifsc', 'Indian Bank IFSC Code Regex Tester', '[A-Z]{4}0[A-Z0-9]{6}'],
    ['indian-pincode', 'India 6-Digit PIN Code Regex Tester', '\\b[1-9][0-9]{5}\\b'],
    ['url-http', 'HTTP/HTTPS URL Matcher Regex Tester', 'https?:\\/\\/[^\\s/$.?#].[^\\s]*'],
    ['ipv4-address', 'IPv4 Address Regex Tester', '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b'],
    ['hex-color', 'CSS Hex Color Code Regex Tester', '#(?:[0-9a-fA-F]{3}){1,2}\\b'],
    ['uuid-v4', 'UUID v4 Pattern Regex Tester', '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'],
    ['date-iso', 'ISO Date (YYYY-MM-DD) Regex Tester', '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])'],
    ['slug-string', 'URL Slug Pattern Regex Tester', '^[a-z0-9]+(?:-[a-z0-9]+)*$'],
    ['hashtag', 'Social Media Hashtag Regex Tester', '#[a-zA-Z0-9_]+'],
    ['jwt-token', 'JWT Bearer Token Regex Tester', 'eyJ[A-Za-z0-9-_]+\\.eyJ[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+'],
    ['html-tag', 'HTML Tag Extractor Regex Tester', '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)'],
    ['mac-address', 'MAC Address Format Regex Tester', '([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})'],
    ['semver-version', 'Semantic Version (SemVer) Regex Tester', '\\bv?\\d+\\.\\d+\\.\\d+(?:-[\\w.-]+)?\\b'],
  ];
  for (const [rSlug, rTitle, rPat] of regexPresets) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `${rSlug}-regex-tester`,
      rTitle,
      'developer-code-formatters',
      'developer',
      { regexPattern: rPat }
    );
  }

  // Dev Format / Minify Variants across use-cases
  const codeLangs = [
    { key: 'json', name: 'JSON' },
    { key: 'sql', name: 'SQL' },
    { key: 'html', name: 'HTML' },
    { key: 'xml', name: 'XML' },
    { key: 'css', name: 'CSS' },
    { key: 'javascript', name: 'JavaScript' },
  ];
  const codeDomains = ['API Response', 'Config File', 'Database Schema', 'Webpage Snippet', 'Webhook Payload', 'Build Bundle', 'Production Asset', 'Debug Dump'];
  for (const cl of codeLangs) {
    for (const dom of codeDomains) {
      const dSlug = dom.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addTool(list, seenSlugs, nextId, `${cl.key}-${dSlug}-formatter`, `${cl.name} ${dom} Formatter`, 'developer-code-formatters', 'developer', { mode: 'format' });
      addTool(list, seenSlugs, nextId, `${cl.key}-${dSlug}-minifier`, `${cl.name} ${dom} Minifier`, 'developer-code-formatters', 'developer', { mode: 'minify' });
    }
  }

  // Data Generator Row Counts & Tabular Formats
  const mockRows = [5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200];
  const mockDatasets = ['Mock Users', 'Mock Customers', 'Mock Orders', 'Mock Employees', 'Mock Products', 'Luhn Test Credit Cards'];
  for (const ds of mockDatasets) {
    for (const rc of mockRows) {
      const dsSlug = ds.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const finalSlug = dsSlug.includes('credit') ? `fake-${rc}-credit-card-test-numbers` : `generate-${rc}-${dsSlug}-csv`;
      addTool(
        list,
        seenSlugs,
        nextId,
        finalSlug,
        `Generate ${rc} ${ds}`,
        'data-csv-spreadsheet',
        'data',
        { mockCount: rc }
      );
    }
  }

  // =========================================================================
  // 7. PDF TOOLS & AUDIO/MEDIA PRESETS (~500 Tools)
  // =========================================================================
  const pdfKbTargets = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 2000, 5000];
  const pdfDocKinds = ['PDF', 'Resume PDF', 'Marksheet PDF', 'Application Form PDF', 'Invoice PDF', 'Scan PDF'];
  for (const pk of pdfDocKinds) {
    for (const kb of pdfKbTargets) {
      const pSlug = pk.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const kbTxt = kb >= 1000 ? `${kb / 1000}MB` : `${kb}KB`;
      addTool(
        list,
        seenSlugs,
        nextId,
        `compress-${pSlug}-to-${kb}kb`,
        `Compress ${pk} to ${kbTxt}`,
        'pdf-tools',
        'pdf',
        { targetKb: kb }
      );
    }
  }

  const gridMmSizes = [3, 4, 5, 6, 8, 10, 12, 15, 20];
  for (const mm of gridMmSizes) {
    addTool(list, seenSlugs, nextId, `${mm}mm-graph-paper-pdf-generator`, `${mm}mm Printable Graph Paper PDF`, 'pdf-tools', 'pdf', { gridSize: mm * 2.83 });
    addTool(list, seenSlugs, nextId, `${mm}mm-ruled-lined-paper-pdf`, `${mm}mm Ruled Lined Sheet PDF`, 'education-academic-tools', 'pdf', { gridSize: mm * 2.83 });
  }

  // Audio Frequencies (Hz) x Waveforms
  const hzValues = [20, 30, 40, 50, 60, 100, 110, 128, 136, 174, 256, 285, 320, 396, 417, 432, 440, 500, 528, 639, 741, 852, 963, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 14000, 16000, 17400];
  const waveTypes = ['sine', 'square', 'triangle', 'sawtooth'];
  for (const hz of hzValues) {
    for (const wt of waveTypes) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `${hz}hz-${wt}-wave-tone-generator`,
        `${hz} Hz ${wt.charAt(0).toUpperCase() + wt.slice(1)} Wave Audio Tone Generator`,
        'audio-video-animation',
        'media',
        { hz, wave: wt }
      );
    }
  }

  for (let bpm = 40; bpm <= 220; bpm += 5) {
    addTool(
      list,
      seenSlugs,
      nextId,
      `${bpm}-bpm-online-metronome-tap-tempo`,
      `${bpm} BPM Online Musician Metronome`,
      'audio-video-animation',
      'media',
      { bpm }
    );
  }

  const pixelTests = [
    { slug: 'pure-red', label: 'Pure Red (#FF0000)', idx: 0 },
    { slug: 'pure-green', label: 'Pure Green (#00FF00)', idx: 1 },
    { slug: 'pure-blue', label: 'Pure Blue (#0000FF)', idx: 2 },
    { slug: 'pure-white', label: 'Pure White (#FFFFFF)', idx: 3 },
    { slug: 'pure-black', label: 'Pure Black (#000000)', idx: 4 },
  ];
  const displayNames = ['Monitor', 'Laptop Screen', 'OLED Display', '4K TV', 'Mobile Screen', 'Tablet'];
  for (const dn of displayNames) {
    for (const pt of pixelTests) {
      const dSlug = dn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addTool(
        list,
        seenSlugs,
        nextId,
        `${dSlug}-dead-pixel-${pt.slug}-test`,
        `${dn} Dead Pixel Test - ${pt.label}`,
        'hardware-browser-utilities',
        'media',
        { colorIndex: pt.idx }
      );
    }
  }

  // Video & Audio File Presets cleanly routed to Media Studio
  const mediaFormats = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'mp3', 'wav', 'm4a', 'ogg', 'flac'];
  const mediaActions = [
    { slug: 'player-inspector', title: 'Local File Player & Inspector' },
    { slug: 'playback-speed-controller', title: 'Playback Speed Changer (0.5x-2x)' },
    { slug: 'frame-screenshot-grabber', title: 'Frame Screenshot Extractor' },
    { slug: 'rotation-preview-player', title: '90°/180°/270° Rotation Previewer' },
    { slug: 'mute-audio-tester', title: 'Mute & Audio Channel Preview' },
  ];
  for (const mf of mediaFormats) {
    for (const ma of mediaActions) {
      if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(mf) && (ma.slug.includes('frame') || ma.slug.includes('rotation'))) {
        continue;
      }
      addTool(
        list,
        seenSlugs,
        nextId,
        `${mf}-${ma.slug}`,
        `${mf.toUpperCase()} ${ma.title}`,
        'audio-video-animation',
        'media'
      );
    }
  }

  // =========================================================================
  // 8. TOP-UP TO EXCEED 5,300+ TOOLS ACROSS HIGH-DEMAND FORMULAS & CONVERTERS
  // =========================================================================
  // Additional Loan Tenures & Specific Financial Scenarios so every category is rich & >5000 total
  const extraYears = [1, 2, 7, 12, 30];
  for (const lt of loanTypes.slice(0, 4)) {
    for (const amt of loanAmounts) {
      for (const yrs of extraYears) {
        addTool(
          list,
          seenSlugs,
          nextId,
          `${amt.slug}-${lt.slug}-emi-${yrs}-years`,
          `${amt.label} ${lt.name} EMI Calculator (${yrs} Years)`,
          'indian-finance-tax-calculators',
          'calculator',
          { formula: 'emi', v1: amt.val, v2: lt.rate, v3: yrs }
        );
      }
    }
  }

  // Health BMI & TDEE Scenarios by Goal / Target
  const weightsKg = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120];
  const heightsCm = [150, 155, 160, 165, 170, 175, 180, 185, 190];
  for (const wt of weightsKg) {
    for (const ht of heightsCm) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `bmi-calculator-${wt}kg-${ht}cm`,
        `BMI Check Calculator (${wt} kg, ${ht} cm Preset)`,
        'health-fitness-nutrition',
        'calculator',
        { formula: 'bmi', v1: wt, v2: ht, v3: 25 }
      );
      addTool(
        list,
        seenSlugs,
        nextId,
        `daily-calorie-tdee-${wt}kg-${ht}cm`,
        `Daily Calorie & BMR Calculator (${wt} kg, ${ht} cm)`,
        'health-fitness-nutrition',
        'calculator',
        { formula: 'bmr', v1: wt, v2: ht, v3: 28 }
      );
    }
  }

  // Profit Margin Cost Price Presets for E-commerce Sellers
  const sellPlatforms = ['Amazon India', 'Flipkart', 'Meesho', 'Shopify', 'Etsy', 'E-Commerce Retail', 'Wholesale', 'Freelance SaaS'];
  const marginPcts = [10, 15, 20, 25, 30, 35, 40, 50];
  for (const sp of sellPlatforms) {
    for (const mp of marginPcts) {
      const sSlug = sp.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      addTool(
        list,
        seenSlugs,
        nextId,
        `${sSlug}-${mp}-percent-profit-margin-calculator`,
        `${sp} ${mp}% Profit Margin & Markup Calculator`,
        'business-ecommerce-accounting',
        'calculator',
        { formula: 'markup-target', v1: 1000, v2: mp, v3: 1 }
      );
    }
  }

  // Additional Images-to-PDF & Paper Size PDF Presets
  const pdfPapers = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B4', 'B5', 'Letter', 'Legal', 'Tabloid', 'Executive'];
  for (const p of pdfPapers) {
    const pLower = p.toLowerCase();
    addTool(list, seenSlugs, nextId, `images-to-${pLower}-pdf-converter`, `Convert Images to ${p} PDF`, 'pdf-tools', 'pdf', { paperSize: p });
    addTool(list, seenSlugs, nextId, `resize-pdf-to-${pLower}-format`, `Resize PDF Pages to ${p} Standard`, 'pdf-tools', 'pdf', { resizePaper: p });
    addTool(list, seenSlugs, nextId, `text-to-${pLower}-pdf-generator`, `Text to ${p} PDF Generator`, 'pdf-tools', 'pdf', { paperSize: p });
  }

  // Additional Exact Percentage Combinations (Part of Total & Reverse Percentage)
  const commonBaseAmounts = [100, 250, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];
  const quickPcts = [5, 10, 12, 15, 18, 20, 25, 30, 40, 50, 75, 80, 90];
  for (const base of commonBaseAmounts) {
    for (const qp of quickPcts) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `${qp}-percent-of-${base}-calculator`,
        `${qp}% of ${base.toLocaleString('en-IN')} Calculator`,
        'mathematics-algebra-statistics',
        'calculator',
        { formula: 'percent-of', v1: qp, v2: base, v3: 1 }
      );
    }
  }

  // Construction Room Size & Paint Estimators
  const roomDims = [10, 12, 14, 15, 18, 20, 25, 30, 40, 50];
  for (const rw of roomDims) {
    for (const rl of roomDims) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `${rw}x${rl}-ft-floor-tile-area-calculator`,
        `${rw}×${rl} ft Room Floor Area & Tile Calculator`,
        'construction-home-land-measurement',
        'calculator',
        { formula: 'tile', v1: rw, v2: rl, v3: 4 }
      );
    }
  }

  // Academic GPA Grade Scale Converters
  const gradeScales = [4.0, 5.0, 7.0, 10.0];
  for (const gs of gradeScales) {
    for (let gpa = 50; gpa <= 95; gpa += 5) {
      addTool(
        list,
        seenSlugs,
        nextId,
        `cgpa-${gpa}-percent-on-${String(gs).replace('.', '-')}-scale`,
        `${gpa}% Equivalent Grade on ${gs.toFixed(1)} GPA Scale`,
        'education-academic-tools',
        'calculator',
        { formula: 'cgpa', v1: Number(((gpa / 100) * gs).toFixed(2)), v2: 100 / gs, v3: 100 }
      );
    }
  }

  appendDailyUtilityTools(list, seenSlugs, nextId, addTool);

  return list;
}
