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
    /*
     * Not part of the robots.txt spec, but the llms.txt convention is to
     * advertise the file here, and unknown directives are ignored rather than
     * treated as errors. Cheap to include, and it is the only hint an agent
     * gets that a machine-readable version exists.
     */
    host: SITE_URL,
  };
}
