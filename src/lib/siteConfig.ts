/**
 * Central site URL and brand configuration used across metadata,
 * canonical links, OpenGraph tags, structured JSON-LD, robots, and sitemaps.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://snaptool.me';

export const SITE_NAME = 'SnapTools';

export const ADSENSE_CLIENT_ID = (
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-5622567381988548'
).trim();
