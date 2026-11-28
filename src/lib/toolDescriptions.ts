/**
 * Generates concise, action-oriented <=90-character benefit descriptions
 * tailored to each utility slug/category while avoiding generic boilerplate.
 */
function clampLine(text: string, maxLen = 90): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 48 ? sliced.slice(0, lastSpace) : sliced) + '…';
}

export function getToolBenefitDescription(
  title: string,
  slug: string,
  categorySlug?: string
): string {
  const s = slug.toLowerCase();

  if (s === 'pdf-compressor-target-kb' || (s.includes('pdf') && s.includes('compress'))) {
    return clampLine('Shrink PDFs to exact KB limits for UPSC, TNPSC, SSC, and visa portals.');
  }
  if (s.includes('pdf-merge')) {
    return clampLine('Combine multiple PDF files in order locally without uploads or watermarks.');
  }
  if (s.includes('pdf-split') || s.includes('extract')) {
    if (s.includes('plain-text')) {
      return clampLine('Extract searchable plain text from multi-page PDFs locally in memory.');
    }
    return clampLine('Split or extract exact PDF page ranges privately with zero file uploads.');
  }
  if (s.includes('pdf-to-jpg') || s.includes('pdf-to-png') || s.includes('pdf-to-webp')) {
    return clampLine('Render every PDF page as crisp high-DPI images and batch export to ZIP.');
  }
  if (s.includes('pdf-password')) {
    return clampLine('Lock or inspect PDF access security right inside your local browser.');
  }
  if (s.includes('images-to-pdf')) {
    return clampLine('Arrange JPG, PNG, or WebP photos onto A4/Letter PDF pages offline.');
  }
  if (s.includes('passport') || s.includes('visa-photo')) {
    return clampLine('Format UPSC, TNPSC, SSC & Passport photos and arrange printable A4 sheets.');
  }
  if (s.includes('20kb') || s.includes('50kb') || s.includes('100kb') || (s.includes('compress') && s.includes('image'))) {
    return clampLine('Compress batches of photos to exact KB targets offline via Web Workers.');
  }
  if (s.includes('exif')) {
    return clampLine('Inspect or strip GPS coordinates and camera metadata before sharing photos.');
  }
  if (s.includes('webp') || s.includes('png-to-jpg') || s.includes('jpg-to-png')) {
    return clampLine('Batch convert PNG, JPG & WebP images in browser memory with ZIP export.');
  }
  if (s.includes('resiz') && !s.includes('pdf')) {
    return clampLine('Resize photos to exact exam or social pixels without losing crispness.');
  }
  if (
    /(?:^|-)(land|cent|cents|ground|grounds|bigha|guntha|kanal|marla|katha|ankanam|ankadam|acre|acres)(?:-|$)/.test(
      s
    )
  ) {
    return clampLine('Convert Sq Ft, Cents, Grounds, Acres, Hectares & state-wise Bigha fast.');
  }
  if (s.includes('income-tax')) {
    return clampLine('Compare India FY 2026–27 New vs Old Tax Regime slabs and download reports.');
  }
  if (s.includes('emi') || s.includes('loan')) {
    return clampLine('Calculate EMIs with principal charts & 1-click PDF/CSV amortization.');
  }
  if (s.includes('sip') || s.includes('ppf') || s.includes('epf') || s.includes('nps')) {
    return clampLine('Project FY 2026–27 compounding wealth, charts & export PDF/CSV reports.');
  }
  if (s.includes('gst')) {
    return clampLine('Compute inclusive/exclusive 3%–28% CGST + SGST slabs in milliseconds.');
  }
  if (s.includes('csv-to-json')) {
    return clampLine('Parse CSV tables into clean JSON and pipe directly to formatters or TS.');
  }
  if (s.includes('typescript')) {
    return clampLine('Infer clean TypeScript interfaces straight from raw JSON payloads.');
  }
  if (s.includes('json')) {
    return clampLine('Validate, format, minify, or inspect JSON payloads locally with zero leaks.');
  }
  if (s.includes('qr')) {
    return clampLine('Generate sharp QR codes for URLs, UPI, Wi-Fi & vCards offline as PNG.');
  }
  if (s.includes('password') || s.includes('uuid') || s.includes('hash') || s.includes('sha')) {
    return clampLine('Generate cryptographic keys, passwords & hashes locally via WebCrypto.');
  }
  if (s.includes('bmi') || s.includes('bmr') || s.includes('calorie') || s.includes('protein')) {
    return clampLine('Track health targets, macros & fitness ranges offline with zero tracking.');
  }

  switch (categorySlug) {
    case 'pdf-tools':
      return clampLine(`${title} cleanly in browser RAM with zero uploads.`);
    case 'image-editing-optimization':
      return clampLine(`${title} offline with batch queue, Canvas speed & ZIP export.`);
    case 'indian-finance-tax-calculators':
      return clampLine(`${title} tuned for FY 2026–27 Indian rates with instant export.`);
    case 'construction-home-land-measurement':
      return clampLine(`${title} with regional Indian units & instant plot math.`);
    case 'developer-code-formatters':
      return clampLine(`${title} offline with instant syntax validation & workflow piping.`);
    case 'data-csv-spreadsheet':
      return clampLine(`${title} in browser memory with tabular parsing & clean exports.`);
    case 'cryptography-security-networking':
      return clampLine(`${title} offline via WebCrypto and local subnet math.`);
    case 'unit-measurement-converters':
      return clampLine(`${title} across global metric, imperial & regional units.`);
    default:
      return clampLine(`Run ${title} instantly inside your browser — 100% offline & private.`);
  }
}
