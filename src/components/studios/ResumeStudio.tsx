'use client';

import React, { useState } from 'react';
import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { FileCheck2, Plus, Trash2, Download, CheckCircle2 } from 'lucide-react';
import {
  toWinAnsiSafe,
  hexToPdfRgb,
  wrapPdfText,
  triggerBlobDownload,
} from '@/lib/pdfStudios';
import AdSlot from '@/components/ads/AdSlot';

interface ExperienceItem {
  id: number;
  role: string;
  company: string;
  period: string;
  bullets: string;
}

interface EducationItem {
  id: number;
  degree: string;
  school: string;
  year: string;
}

export default function ResumeStudio() {
  const [fullName, setFullName] = useState('Aarav Krishnan');
  const [headline, setHeadline] = useState('Senior Full-Stack Engineer');
  const [contactLine, setContactLine] = useState(
    'aarav.dev@example.com  |  +91 98765 43210  |  Chennai, India  |  github.com/aarav-dev'
  );
  const [accentHex, setAccentHex] = useState('#0f766e');
  const [summary, setSummary] = useState(
    'Full-stack developer with 5+ years of experience shipping high-performance Next.js, TypeScript, and client-side WebAssembly products scaled to hundreds of thousands of monthly users.'
  );
  const [skillsText, setSkillsText] = useState(
    'TypeScript, React 19, Next.js, Tailwind CSS, Node.js, PostgreSQL, PDF/Canvas APIs, System Design'
  );

  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      id: 1,
      role: 'Senior Frontend Engineer',
      company: 'NovaWeb Labs',
      period: '2024 – Present',
      bullets:
        'Architected zero-backend browser document tools serving 150K+ monthly visits with sub-second FCP.\nReduced production client bundle size by 42% using edge metadata splitting.',
    },
    {
      id: 2,
      role: 'Software Engineer',
      company: 'CloudPulse India',
      period: '2021 – 2024',
      bullets:
        'Built real-time analytics dashboards and automated CI/CD checks across 12 microservices.\nMentored 4 junior developers on clean TypeScript patterns and accessibility.',
    },
  ]);

  const [educations, setEducations] = useState<EducationItem[]>([
    {
      id: 1,
      degree: 'B.E. in Computer Science & Engineering',
      school: 'Anna University, Chennai',
      year: '2021',
    },
  ]);

  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const addExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'Software Developer',
        company: 'Company Name',
        period: '2023 – 2024',
        bullets: 'Delivered key product features cleanly ahead of deadline.',
      },
    ]);
  };

  const addEducation = () => {
    setEducations((prev) => [
      ...prev,
      { id: Date.now(), degree: 'Certification / Degree', school: 'Institute Name', year: '2023' },
    ]);
  };

  const downloadResumePdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const accent = hexToPdfRgb(accentHex);

    const pageW = 595.28;
    const pageH = 841.89;
    const margin = 46;
    const maxW = pageW - margin * 2;

    let page: PDFPage = pdfDoc.addPage([pageW, pageH]);
    let y = pageH - 48;

    const ensureSpace = (needed: number) => {
      if (y - needed < 48) {
        page = pdfDoc.addPage([pageW, pageH]);
        y = pageH - 48;
      }
    };

    const drawSectionHeading = (title: string) => {
      ensureSpace(32);
      page.drawText(title, { x: margin, y, size: 10.5, font: fontBold, color: accent });
      page.drawLine({
        start: { x: margin, y: y - 4 },
        end: { x: pageW - margin, y: y - 4 },
        thickness: 0.9,
        color: accent,
      });
      y -= 18;
    };

    // Header
    page.drawText(toWinAnsiSafe(fullName), {
      x: margin,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.08, 0.08, 0.1),
    });
    y -= 20;
    if (headline.trim()) {
      page.drawText(toWinAnsiSafe(headline), {
        x: margin,
        y,
        size: 12,
        font: fontBold,
        color: accent,
      });
      y -= 16;
    }
    const contactLines = wrapPdfText(contactLine, fontRegular, 9.2, maxW);
    contactLines.forEach((cl) => {
      page.drawText(cl, { x: margin, y, size: 9.2, font: fontRegular, color: rgb(0.35, 0.35, 0.4) });
      y -= 13;
    });
    y -= 12;

    // Summary
    if (summary.trim()) {
      drawSectionHeading('PROFESSIONAL SUMMARY');
      const sumLines = wrapPdfText(summary, fontRegular, 9.8, maxW);
      sumLines.forEach((line) => {
        ensureSpace(15);
        page.drawText(line, { x: margin, y, size: 9.8, font: fontRegular, color: rgb(0.15, 0.15, 0.18) });
        y -= 14;
      });
      y -= 10;
    }

    // Skills
    if (skillsText.trim()) {
      drawSectionHeading('CORE SKILLS');
      const skillLines = wrapPdfText(skillsText, fontRegular, 9.8, maxW);
      skillLines.forEach((line) => {
        ensureSpace(15);
        page.drawText(line, { x: margin, y, size: 9.8, font: fontRegular, color: rgb(0.15, 0.15, 0.18) });
        y -= 14;
      });
      y -= 10;
    }

    // Experience
    if (experiences.length > 0) {
      drawSectionHeading('EXPERIENCE');
      for (const exp of experiences) {
        ensureSpace(44);
        const headerStr = toWinAnsiSafe(`${exp.role} — ${exp.company}`);
        page.drawText(headerStr, { x: margin, y, size: 10.5, font: fontBold, color: rgb(0.1, 0.1, 0.12) });
        const periodStr = toWinAnsiSafe(exp.period);
        const pw = fontRegular.widthOfTextAtSize(periodStr, 9.5);
        page.drawText(periodStr, {
          x: pageW - margin - pw,
          y,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.4, 0.4, 0.45),
        });
        y -= 15;

        const bulletItems = exp.bullets
          .split(/\r?\n/)
          .map((b) => b.trim())
          .filter(Boolean);
        for (const b of bulletItems) {
          const wrapped = wrapPdfText(`* ${b}`, fontRegular, 9.5, maxW - 10);
          wrapped.forEach((wl, idx) => {
            ensureSpace(14);
            page.drawText(wl, {
              x: margin + (idx === 0 ? 4 : 12),
              y,
              size: 9.5,
              font: fontRegular,
              color: rgb(0.18, 0.18, 0.22),
            });
            y -= 13.5;
          });
        }
        y -= 8;
      }
    }

    // Education
    if (educations.length > 0) {
      drawSectionHeading('EDUCATION');
      for (const edu of educations) {
        ensureSpace(26);
        page.drawText(toWinAnsiSafe(edu.degree), {
          x: margin,
          y,
          size: 10.2,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.12),
        });
        const yw = fontRegular.widthOfTextAtSize(toWinAnsiSafe(edu.year), 9.5);
        page.drawText(toWinAnsiSafe(edu.year), {
          x: pageW - margin - yw,
          y,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.4, 0.4, 0.45),
        });
        y -= 14;
        page.drawText(toWinAnsiSafe(edu.school), {
          x: margin,
          y,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.32, 0.32, 0.36),
        });
        y -= 18;
      }
    }

    const bytes = await pdfDoc.save();
    const safeName = (fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'resume') + '-cv.pdf';
    triggerBlobDownload(bytes, safeName);
    setExportStatus(`Downloaded ${safeName}`);
    setTimeout(() => setExportStatus(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 mb-2">
            <FileCheck2 className="w-3.5 h-3.5" /> Clean ATS-Readable Resume Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            ATS Resume &amp; CV PDF Builder
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Build a crisp single-column ATS-friendly resume with live paper preview and instant vector PDF export.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {exportStatus && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> {exportStatus}
            </span>
          )}
          <button
            onClick={downloadResumePdf}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer transition"
          >
            <Download className="w-4 h-4" /> Download Resume PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <div className="xl:col-span-6 space-y-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Profile &amp; Theme</div>
            <div className="flex items-center gap-2">
              {['#0f766e', '#2563eb', '#7c3aed', '#b91c1c', '#18181b'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccentHex(c)}
                  style={{ backgroundColor: c }}
                  aria-label={`Select accent ${c}`}
                  className={`w-5 h-5 rounded-full cursor-pointer ${
                    accentHex === c ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-bold"
            />
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Job Title / Role"
              className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
            />
          </div>

          <input
            value={contactLine}
            onChange={(e) => setContactLine(e.target.value)}
            placeholder="Email | Phone | Location | Portfolio"
            className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
          />

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Professional Summary
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase mb-1">
              Skills (comma separated)
            </label>
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
            />
          </div>

          {/* Experience */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Work Experience</span>
              <button
                onClick={addExperience}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Role
              </button>
            </div>
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2"
              >
                <div className="grid grid-cols-12 gap-2">
                  <input
                    value={exp.role}
                    onChange={(e) =>
                      setExperiences((p) =>
                        p.map((x) => (x.id === exp.id ? { ...x, role: e.target.value } : x))
                      )
                    }
                    placeholder="Role"
                    className="col-span-5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) =>
                      setExperiences((p) =>
                        p.map((x) => (x.id === exp.id ? { ...x, company: e.target.value } : x))
                      )
                    }
                    placeholder="Company"
                    className="col-span-4 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                  />
                  <input
                    value={exp.period}
                    onChange={(e) =>
                      setExperiences((p) =>
                        p.map((x) => (x.id === exp.id ? { ...x, period: e.target.value } : x))
                      )
                    }
                    placeholder="2023-2025"
                    className="col-span-2 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[11px]"
                  />
                  <button
                    onClick={() => setExperiences((p) => p.filter((x) => x.id !== exp.id))}
                    className="col-span-1 flex items-center justify-center text-neutral-400 hover:text-rose-500 cursor-pointer"
                    aria-label="Delete experience"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={exp.bullets}
                  onChange={(e) =>
                    setExperiences((p) =>
                      p.map((x) => (x.id === exp.id ? { ...x, bullets: e.target.value } : x))
                    )
                  }
                  placeholder="One impact bullet per line..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                />
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Education</span>
              <button
                onClick={addEducation}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </button>
            </div>
            {educations.map((edu) => (
              <div key={edu.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  value={edu.degree}
                  onChange={(e) =>
                    setEducations((p) =>
                      p.map((x) => (x.id === edu.id ? { ...x, degree: e.target.value } : x))
                    )
                  }
                  placeholder="Degree"
                  className="col-span-5 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold"
                />
                <input
                  value={edu.school}
                  onChange={(e) =>
                    setEducations((p) =>
                      p.map((x) => (x.id === edu.id ? { ...x, school: e.target.value } : x))
                    )
                  }
                  placeholder="University / School"
                  className="col-span-4 px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs"
                />
                <input
                  value={edu.year}
                  onChange={(e) =>
                    setEducations((p) =>
                      p.map((x) => (x.id === edu.id ? { ...x, year: e.target.value } : x))
                    )
                  }
                  placeholder="Year"
                  className="col-span-2 px-2 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono"
                />
                <button
                  onClick={() => setEducations((p) => p.filter((x) => x.id !== edu.id))}
                  className="col-span-1 flex justify-center text-neutral-400 hover:text-rose-500 cursor-pointer"
                  aria-label="Delete education"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Paper Preview */}
        <div className="xl:col-span-6">
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white text-neutral-900 p-7 sm:p-9 shadow-2xl space-y-5 text-xs">
            <div>
              <h2 className="text-2xl font-black text-neutral-950">{fullName}</h2>
              <div style={{ color: accentHex }} className="text-sm font-bold mt-0.5">
                {headline}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1.5">{contactLine}</div>
            </div>

            {summary.trim() && (
              <div className="space-y-1.5">
                <div
                  style={{ color: accentHex, borderColor: accentHex }}
                  className="text-[11px] font-black uppercase tracking-wider border-b pb-1"
                >
                  Professional Summary
                </div>
                <p className="text-neutral-700 leading-relaxed">{summary}</p>
              </div>
            )}

            {skillsText.trim() && (
              <div className="space-y-1.5">
                <div
                  style={{ color: accentHex, borderColor: accentHex }}
                  className="text-[11px] font-black uppercase tracking-wider border-b pb-1"
                >
                  Core Skills
                </div>
                <p className="text-neutral-700">{skillsText}</p>
              </div>
            )}

            {experiences.length > 0 && (
              <div className="space-y-3">
                <div
                  style={{ color: accentHex, borderColor: accentHex }}
                  className="text-[11px] font-black uppercase tracking-wider border-b pb-1"
                >
                  Experience
                </div>
                {experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between font-bold text-neutral-900">
                      <span>
                        {exp.role} &mdash; {exp.company}
                      </span>
                      <span className="text-neutral-500 font-normal">{exp.period}</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-neutral-700">
                      {exp.bullets
                        .split(/\r?\n/)
                        .map((b) => b.trim())
                        .filter(Boolean)
                        .map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {educations.length > 0 && (
              <div className="space-y-2">
                <div
                  style={{ color: accentHex, borderColor: accentHex }}
                  className="text-[11px] font-black uppercase tracking-wider border-b pb-1"
                >
                  Education
                </div>
                {educations.map((edu) => (
                  <div key={edu.id} className="flex justify-between">
                    <div>
                      <div className="font-bold text-neutral-900">{edu.degree}</div>
                      <div className="text-neutral-500">{edu.school}</div>
                    </div>
                    <div className="text-neutral-500 font-mono">{edu.year}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AdSlot slotId="studio-resume-banner" format="horizontal" />
    </div>
  );
}
