import coreToolsRaw from './coreTools.json';
import { CATEGORIES } from './categories';
import { buildAllTools, ToolEngine, ToolSpec } from './expandedToolsBuilder';
import { getToolBenefitDescription } from '@/lib/toolDescriptions';

export type { ToolEngine, ToolSpec };

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolDef {
  id: number;
  slug: string;
  title: string;
  category: string;
  categoryName: string;
  description: string;
  engine: ToolEngine;
  spec?: ToolSpec;
  features: string[];
  howToUse: string[];
  faqs: ToolFAQ[];
  keywords: string[];
}

type RawCoreTuple = [number, string, string, string, ToolEngine];

const CATEGORY_NAME_MAP = new Map<string, string>(
  CATEGORIES.map((c) => [c.slug, c.name])
);

const compactSeeds = buildAllTools(coreToolsRaw as RawCoreTuple[]);

// Empty arrays on registry items keep client JS bundle ultra-light across 5,000+ tools;
// getToolBySlug() hydrates rich features, howToUse, and FAQs on the server for each tool page.
const EMPTY_STRINGS: string[] = [];
const EMPTY_FAQS: ToolFAQ[] = [];

export const TOOLS_REGISTRY: ToolDef[] = compactSeeds.map((seed) => {
  const categoryName = CATEGORY_NAME_MAP.get(seed.category) || 'General Utilities';
  const normalizedEngine: ToolEngine =
    /(?:^|-)(cent|cents|ground|grounds|bigha|guntha|kanal|marla|katha|ankanam|ankadam)(?:-|$)|land-area/i.test(
      seed.slug
    )
      ? 'converter'
      : seed.engine;
  return {
    id: seed.id,
    slug: seed.slug,
    title: seed.title,
    category: seed.category,
    categoryName,
    description: getToolBenefitDescription(seed.title, seed.slug, seed.category),
    engine: normalizedEngine,
    spec: seed.spec,
    features: EMPTY_STRINGS,
    howToUse: EMPTY_STRINGS,
    faqs: EMPTY_FAQS,
    keywords: seed.slug.split('-').filter((w) => w.length > 2),
  };
});

export const TOTAL_TOOLS_COUNT: number = TOOLS_REGISTRY.length;
export const TOTAL_TOOLS_LABEL: string = TOTAL_TOOLS_COUNT.toLocaleString('en-US');

// Synchronize accurate category counts dynamically
const categoryCounter = new Map<string, number>();
for (const t of TOOLS_REGISTRY) {
  categoryCounter.set(t.category, (categoryCounter.get(t.category) || 0) + 1);
}
for (const cat of CATEGORIES) {
  cat.count = categoryCounter.get(cat.slug) || 0;
}

export const TOOLS_BY_SLUG = new Map<string, ToolDef>(
  TOOLS_REGISTRY.map((t) => [t.slug, t])
);

function hydrateToolDetails(base: ToolDef): ToolDef {
  const title = base.title;
  const lowerTitle = title.toLowerCase();

  return {
    ...base,
    description: getToolBenefitDescription(title, base.slug, base.category),
    features: [
      `100% Free & Client-Side: Run ${lowerTitle} directly in your browser with zero server round-trips.`,
      `Privacy First Guarantee: Files and personal values never leave your device memory.`,
      `Zero Rate Limits: Unlimited operations across desktop and mobile browsers.`,
      `Clean Instant Export: Copy results or download outputs with one click.`,
    ],
    howToUse: [
      `Open the ${title} workspace above and inspect any preloaded sample defaults or preset options.`,
      `Upload your local file or enter custom values into the input fields.`,
      `Adjust tool-specific parameters, units, target sizes, or formatting choices if needed.`,
      `Review live computed output immediately and copy or download your final result.`,
    ],
    faqs: [
      {
        question: `Is the ${title} completely free to use?`,
        answer: `Yes, ${title} on SnapTools is 100% free with unlimited runs and zero registration required.`,
      },
      {
        question: `Does ${title} upload my files or inputs to any external server?`,
        answer: `Never. Everything runs strictly inside your browser memory using client-side Web APIs, HTML5 Canvas, and JavaScript.`,
      },
      {
        question: `Does ${title} work on mobile phones as well as laptops?`,
        answer: `Yes! All SnapTools utilities adapt automatically to iOS, Android, Windows, macOS, and Linux screen sizes.`,
      },
    ],
  };
}

export function getToolBySlug(slug: string): ToolDef | undefined {
  const base = TOOLS_BY_SLUG.get(slug);
  return base ? hydrateToolDetails(base) : undefined;
}

export function getToolsByCategory(categorySlug: string): ToolDef[] {
  return TOOLS_REGISTRY.filter((t) => t.category === categorySlug);
}

export function getRelatedTools(tool: ToolDef, limit = 6): ToolDef[] {
  return TOOLS_REGISTRY
    .filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, limit);
}
