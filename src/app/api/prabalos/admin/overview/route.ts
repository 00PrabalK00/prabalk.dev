import { ok, requireAdmin } from "@/lib/prabalos/admin";
import { overview } from "@/lib/prabalos/overview";

/**
 * Everything the dashboard shows, in one call.
 *
 * The panel polls this every few seconds. Same reasoning as the device's
 * /sync — one request beats five, and the payload is small enough that
 * splitting it would only add round trips.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;
  return ok(await overview());
}
