import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // the aggregator has no crawlable content and costs an upstream call;
        // /login and /os are the private PrabalOS half and are unlinked anyway
        disallow: ["/api/", "/login", "/os"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
