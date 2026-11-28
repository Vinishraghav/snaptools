export interface ExamImagePreset {
  id: string;
  portal: string;
  label: string;
  width: number;
  height: number;
  targetKb: number;
  maxKb: number;
  minKb: number;
  dpiLabel: string;
  guide: string;
}

export const EXAM_IMAGE_PRESETS: ExamImagePreset[] = [
  {
    id: 'upsc-photo',
    portal: 'UPSC Civil Services',
    label: 'UPSC Photo (500x500px, 20–300KB)',
    width: 500,
    height: 500,
    targetKb: 120,
    minKb: 20,
    maxKb: 300,
    dpiLabel: 'Square 350–1000px JPG',
    guide: 'Square portrait (1:1), clear front face, 20KB–300KB JPG.',
  },
  {
    id: 'upsc-sign',
    portal: 'UPSC Civil Services',
    label: 'UPSC Signature (400x200px, 20–300KB)',
    width: 400,
    height: 200,
    targetKb: 45,
    minKb: 20,
    maxKb: 300,
    dpiLabel: '2:1 Rectangular JPG',
    guide: 'Black ink on plain white paper, 20KB–300KB JPG.',
  },
  {
    id: 'tnpsc-photo',
    portal: 'TNPSC',
    label: 'TNPSC Photo (3.5x4.5cm, 20–50KB)',
    width: 413,
    height: 531,
    targetKb: 40,
    minKb: 20,
    maxKb: 50,
    dpiLabel: '300 DPI (3.5cm x 4.5cm)',
    guide: 'Include printed name & date below photo if required by TNPSC OTR.',
  },
  {
    id: 'tnpsc-sign',
    portal: 'TNPSC',
    label: 'TNPSC Signature (3.5x1.5cm, 10–20KB)',
    width: 413,
    height: 177,
    targetKb: 17,
    minKb: 10,
    maxKb: 20,
    dpiLabel: '300 DPI (3.5cm x 1.5cm)',
    guide: 'Clean horizontal signature, 10KB–20KB JPG.',
  },
  {
    id: 'ssc-photo',
    portal: 'SSC (CGL / CHSL)',
    label: 'SSC Photo (3.5x4.5cm, 20–50KB)',
    width: 413,
    height: 531,
    targetKb: 42,
    minKb: 20,
    maxKb: 50,
    dpiLabel: '300 DPI (3.5cm x 4.5cm)',
    guide: 'Both ears visible, no spectacles/cap, 20KB–50KB JPG.',
  },
  {
    id: 'ssc-sign',
    portal: 'SSC (CGL / CHSL)',
    label: 'SSC Signature (4.0x2.0cm, 10–20KB)',
    width: 472,
    height: 236,
    targetKb: 17,
    minKb: 10,
    maxKb: 20,
    dpiLabel: '300 DPI (4.0cm x 2.0cm)',
    guide: 'Crisp black ink signature without blur, 10KB–20KB JPG.',
  },
  {
    id: 'ibps-photo',
    portal: 'IBPS / SBI Banking',
    label: 'IBPS/SBI Photo (200x230px, 20–50KB)',
    width: 200,
    height: 230,
    targetKb: 38,
    minKb: 20,
    maxKb: 50,
    dpiLabel: '200x230px Exact',
    guide: 'Light/white background preferred, 20KB–50KB JPG.',
  },
  {
    id: 'ibps-sign',
    portal: 'IBPS / SBI Banking',
    label: 'IBPS/SBI Signature (140x60px, 10–20KB)',
    width: 140,
    height: 60,
    targetKb: 16,
    minKb: 10,
    maxKb: 20,
    dpiLabel: '140x60px Exact',
    guide: 'Not in ALL CAPS; 10KB–20KB JPG.',
  },
  {
    id: 'ibps-thumb',
    portal: 'IBPS / SBI Banking',
    label: 'IBPS Left Thumb Impression (240x240px, 20–50KB)',
    width: 240,
    height: 240,
    targetKb: 38,
    minKb: 20,
    maxKb: 50,
    dpiLabel: '240x240px (3x3cm)',
    guide: 'Blue/black stamp pad on white paper, zero smudge.',
  },
  {
    id: 'ibps-decl',
    portal: 'IBPS / SBI Banking',
    label: 'IBPS Handwritten Declaration (800x400px, 50–100KB)',
    width: 800,
    height: 400,
    targetKb: 80,
    minKb: 50,
    maxKb: 100,
    dpiLabel: '800x400px Exact',
    guide: 'Handwritten in English on plain white paper with black ink.',
  },
  {
    id: 'pan-photo',
    portal: 'PAN Card (NSDL / UTIITSL)',
    label: 'PAN Photo (213x213px, 300 DPI, <30KB)',
    width: 213,
    height: 213,
    targetKb: 26,
    minKb: 5,
    maxKb: 30,
    dpiLabel: '213x213px @ 300 DPI',
    guide: 'Exact 2.5x2.5cm square (<30KB JPG).',
  },
  {
    id: 'pan-sign',
    portal: 'PAN Card (NSDL / UTIITSL)',
    label: 'PAN Signature (400x200px, 600 DPI, <60KB)',
    width: 400,
    height: 200,
    targetKb: 48,
    minKb: 5,
    maxKb: 60,
    dpiLabel: '400x200px @ 600 DPI',
    guide: 'Clear black ink signature (<60KB JPG).',
  },
  {
    id: 'passport-seva',
    portal: 'Indian Passport Seva',
    label: 'Indian Passport Seva (2x2 inch / 630x630px)',
    width: 630,
    height: 630,
    targetKb: 150,
    minKb: 20,
    maxKb: 300,
    dpiLabel: '630x630px (2x2 in) White BG',
    guide: 'Plain pure white background checklist: zero shadows, neutral expression, ears clear.',
  },
];

export interface PdfPortalPreset {
  id: string;
  label: string;
  targetKb: number;
}

export const PDF_PORTAL_PRESETS: PdfPortalPreset[] = [
  { id: 'upsc-pdf', label: 'UPSC Marksheet / ID PDF (Under 300 KB)', targetKb: 280 },
  { id: 'tnpsc-pdf', label: 'TNPSC Certificate PDF (Under 200 KB)', targetKb: 185 },
  { id: 'ssc-ibps-pdf', label: 'SSC / IBPS Document PDF (Under 500 KB)', targetKb: 460 },
  { id: 'digilocker-visa', label: 'Visa / Embassy / Portal PDF (Under 1 MB)', targetKb: 950 },
];
