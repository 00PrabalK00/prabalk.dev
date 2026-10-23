import type { MetadataRoute } from "next";
import { PROJECTS } from "@/projects";
import { SITE_URL } from "@/lib/site";

/**
 * The portfolio and every case study.
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
    ...projects,
  ];
}
