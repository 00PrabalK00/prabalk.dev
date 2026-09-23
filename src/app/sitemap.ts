import type { MetadataRoute } from "next";
import { PROJECTS } from "@/projects";
import { SITE_URL } from "@/lib/site";

/**
 * The chooser, the two ways through it, and every case study.
 *
 * `/boring` carries the same content as `/cool-kids` in plain crawlable HTML —
 * no canvas, no scroll-driven reveal — so it is declared at the same priority
 * rather than treated as a lesser copy. The console sections on the cinematic
 * route are overlays, not routes, so they still have no URL of their own.
 *
 * Case studies are listed at the URL they canonicalise to: the subdomain when
 * a project has one, the apex path otherwise. Listing both would ask crawlers
 * to index the same document twice and then work out which one counts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const projects: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: p.subdomain
      ? `https://${p.subdomain}.prabalkhare.com`
      : `${SITE_URL}/p/${p.slug}`,
    changeFrequency: p.status.startsWith("active") ? "weekly" : "monthly",
    // Current research ranks above the historical catalogue, matching the
    // order the homepage presents them in.
    priority: p.category === "current-research" ? 0.9 : 0.8,
  }));

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/cool-kids`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/boring`, changeFrequency: "weekly", priority: 0.9 },
    ...projects,
  ];
}
