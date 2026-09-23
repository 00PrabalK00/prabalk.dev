import { buildLlmsTxt } from "@/lib/llms";

/**
 * /llms.txt — the short index.
 *
 * Static: the content is derived from manifests that only change at build time,
 * so there is no reason to render it per request.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
