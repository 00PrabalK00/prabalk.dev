import { buildLlmsFullTxt } from "@/lib/llms";

/** /llms-full.txt — every case study, flattened. See lib/llms.ts. */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
