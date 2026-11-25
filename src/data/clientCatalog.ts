import coreToolsRaw from './coreTools.json';
import { CATEGORY_NAME_LOOKUP } from './catalogMeta';

export interface SearchToolItem {
  id: number;
  slug: string;
  title: string;
  category: string;
  categoryName: string;
}

type CoreTuple = [number, string, string, string, string];
type IndexTuple = [number, string, string, string];

export const CORE_TOOLS_LIST: SearchToolItem[] = (coreToolsRaw as CoreTuple[]).map(
  ([id, slug, title, category]) => ({
    id,
    slug,
    title,
    category,
    categoryName: CATEGORY_NAME_LOOKUP[category] || 'General Utilities',
  })
);

let fullIndexCache: SearchToolItem[] | null = null;
let fullIndexPromise: Promise<SearchToolItem[]> | null = null;

export function loadFullToolsIndex(): Promise<SearchToolItem[]> {
  if (fullIndexCache) {
    return Promise.resolve(fullIndexCache);
  }
  if (!fullIndexPromise) {
    fullIndexPromise = fetch('/tools-index.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tool index');
        return res.json() as Promise<IndexTuple[]>;
      })
      .then((rows) => {
        const mapped = rows.map(([id, slug, title, category]) => ({
          id,
          slug,
          title,
          category,
          categoryName: CATEGORY_NAME_LOOKUP[category] || 'General Utilities',
        }));
        fullIndexCache = mapped;
        return mapped;
      })
      .catch(() => CORE_TOOLS_LIST);
  }
  return fullIndexPromise;
}
