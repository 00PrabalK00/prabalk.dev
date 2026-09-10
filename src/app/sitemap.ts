import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Three routes: the chooser, and the two ways through it.
 *
 * `/boring` carries the same content as `/cool-kids` in plain crawlable HTML —
 * no canvas, no scroll-driven reveal — so it is declared at the same priority
 * rather than treated as a lesser copy. The console sections on the cinematic
 * route are overlays, not routes, so they still have no URL of their own.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/cool-kids`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/boring`, changeFrequency: "weekly", priority: 0.9 },
  ];
}
