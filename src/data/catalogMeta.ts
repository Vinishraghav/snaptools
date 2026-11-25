import type { Category } from './categories';
import { CATEGORIES } from './categories';
import metaJson from './catalogMeta.json';

export const TOTAL_TOOLS_COUNT: number = metaJson.totalCount;
export const TOTAL_TOOLS_LABEL: string = metaJson.totalLabel;

const countsRecord = metaJson.categoryCounts as Record<string, number>;

export const SYNCED_CATEGORIES: Category[] = CATEGORIES.map((c) => ({
  ...c,
  count: countsRecord[c.slug] ?? c.count,
}));

export const CATEGORY_NAME_LOOKUP: Record<string, string> = Object.fromEntries(
  SYNCED_CATEGORIES.map((c) => [c.slug, c.name])
);
