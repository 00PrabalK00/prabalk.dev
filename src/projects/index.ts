import type { Project, ProjectCategory } from "./types";
import { botopsy } from "./botopsy";
import { claudeskills } from "./claudeskills";
import { continuum } from "./continuum";
import { continuumext } from "./continuumext";
import { contractencrypt } from "./contractencrypt";
import { facetrack } from "./facetrack";
import { gesturecar } from "./gesturecar";
import { infrencex } from "./infrencex";
import { nextekf } from "./nextekf";
import { nexthi } from "./nexthi";
import { smr300sim } from "./smr300sim";
import { flowpilot } from "./flowpilot";
import { httpsota } from "./httpsota";
import { kurat } from "./kurat";
import { mira } from "./mira";
import { opendronekit } from "./opendronekit";
import { prabalos } from "./prabalos";
import { pushpak } from "./pushpak";
import { ripple } from "./ripple";
import { robotdrawing } from "./robotdrawing";
import { rosscope } from "./rosscope";
import { smr300 } from "./smr300";
import { so101 } from "./so101";
import { stereoptu } from "./stereoptu";

/**
 * The project registry.
 *
 * One array is the source of truth for the case-study routes, the subdomain
 * map and the homepage ordering. Adding a project means adding a record here
 * and nothing else — no new page, no new route, no navigation edit.
 *
 * The consistency checks below run at module evaluation, which means they run
 * during `next build`. A typo in a `related` slug or two projects claiming the
 * same subdomain fails the build rather than shipping a dead link.
 */
export const PROJECTS: Project[] = [
  // Current research — what the portfolio should lead with.
  ripple,
  so101,
  // Robot systems
  smr300,
  rosscope,
  kurat,
  mira,
  nextekf,
  nexthi,
  // Autonomy and perception
  opendronekit,
  robotdrawing,
  stereoptu,
  pushpak,
  // Developer and robotics infrastructure
  continuum,
  continuumext,
  flowpilot,
  prabalos,
  httpsota,
  infrencex,
  botopsy,
  // Lab bench
  contractencrypt,
  facetrack,
  gesturecar,
  smr300sim,
  claudeskills,
];

/* ------------------------------------------------------------------ */
/* Integrity                                                           */
/* ------------------------------------------------------------------ */

const seenSlugs = new Set<string>();
const seenSubdomains = new Set<string>();

for (const p of PROJECTS) {
  if (seenSlugs.has(p.slug)) {
    throw new Error(`Duplicate project slug: ${p.slug}`);
  }
  seenSlugs.add(p.slug);

  if (p.subdomain) {
    if (seenSubdomains.has(p.subdomain)) {
      throw new Error(
        `Two projects claim the subdomain "${p.subdomain}" — one of them will be unreachable.`,
      );
    }
    seenSubdomains.add(p.subdomain);
  }
}

for (const p of PROJECTS) {
  for (const slug of p.related ?? []) {
    if (!seenSlugs.has(slug)) {
      // Not fatal in principle — but a related link that 404s is worse than no
      // related link, and the whole point of the registry is that this cannot
      // reach production unnoticed.
      throw new Error(
        `Project "${p.slug}" lists related project "${slug}", which does not exist.`,
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export const PROJECTS_BY_SLUG = new Map(PROJECTS.map((p) => [p.slug, p]));

/** Subdomain label -> slug. Consumed by the host-based rewrite in proxy.ts. */
export const SUBDOMAIN_TO_SLUG = new Map(
  PROJECTS.filter((p) => p.subdomain).map((p) => [p.subdomain!, p.slug]),
);

export function getProject(slug: string): Project | undefined {
  return PROJECTS_BY_SLUG.get(slug);
}

/**
 * Where a project's case study actually lives.
 *
 * The subdomain is the real address — it is what `generateMetadata`
 * canonicalises to and what gets shared. `/p/<slug>` exists so a project stays
 * reachable before its DNS is live and if a subdomain is ever retired, but it
 * should never be the URL a visitor is handed: landing on the apex path after
 * clicking "case study" makes the subdomains look decorative.
 *
 * Takes a slug so callers do not have to resolve the record first.
 */
export function projectUrl(slug: string): string {
  const p = PROJECTS_BY_SLUG.get(slug);
  if (p?.subdomain) return `https://${p.subdomain}.prabalkhare.com`;
  return `/p/${slug}`;
}

/** Every slug that has a case study, for generateStaticParams and the sitemap. */
export function allProjectSlugs(): string[] {
  return PROJECTS.map((p) => p.slug);
}

/**
 * Homepage ordering: current research first, archive last, and `order` within
 * each band. The point is that a visitor reads the current direction before the
 * historical catalogue, not after it.
 */
export const CATEGORY_ORDER: ProjectCategory[] = [
  "current-research",
  "robot-systems",
  "autonomy-and-perception",
  "infrastructure",
  "bench",
];

export function projectsByCategory(): { category: ProjectCategory; items: Project[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: PROJECTS.filter((p) => p.category === category).sort(
      (a, b) => a.order - b.order,
    ),
  })).filter((g) => g.items.length > 0);
}
