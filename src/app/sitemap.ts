import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Single page — the console sections are overlays, not routes, so there is
 * nothing else with its own URL to declare.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
