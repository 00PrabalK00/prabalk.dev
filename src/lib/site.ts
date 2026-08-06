/**
 * Canonical origin, in one place.
 *
 * Vercel currently serves the apex with a 308 to www, so www is the real
 * canonical — pointing rel=canonical and og:url at a URL that redirects is a
 * needless hop for crawlers. If the Vercel project's primary domain is ever
 * flipped to the bare apex, set NEXT_PUBLIC_SITE_URL rather than editing code.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.prabalkhare.com"
).replace(/\/$/, "");
