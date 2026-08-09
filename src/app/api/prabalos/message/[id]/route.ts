import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { getMessage, rateLimit } from "@/lib/prabalos/store";
import { BODY_MAX, clamp, stamp, toDeviceText } from "@/lib/prabalos/render";

/**
 * Full message body, fetched only when a message is actually opened.
 *
 * The sync payload carries previews so that the inbox costs nothing extra on
 * every poll; bodies come from here on demand. That split is what keeps the
 * 5-second payload under a couple of kilobytes and inside ArduinoJson's
 * filtered-parse budget.
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = 20;
const RATE_WINDOW_S = 60;

export async function GET(req: Request, ctx: RouteContext<"/api/prabalos/message/[id]">) {
  const auth = await verifyDeviceRequest(req);
  if (!auth.ok) {
    console.warn(`[prabalos] message rejected: ${auth.reason}`);
    return deviceUnauthorized(auth.status);
  }

  const limited = await rateLimit(`msg:${auth.deviceId}`, RATE_LIMIT, RATE_WINDOW_S);
  if (!limited.ok) return deviceUnauthorized(429);

  const { id } = await ctx.params;
  const msg = await getMessage(id);
  if (!msg) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  const tzHome = process.env.PRABALOS_TZ_HOME || "Asia/Bangkok";
  const url = new URL(req.url);
  const raw = Number(url.searchParams.get("body_chars"));
  const max = Number.isFinite(raw) ? Math.max(40, Math.min(BODY_MAX, Math.trunc(raw))) : BODY_MAX;

  return Response.json(
    {
      id: msg.id,
      text: clamp(toDeviceText(msg.text), max),
      when: stamp(msg.ts, tzHome),
      read: msg.read,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
