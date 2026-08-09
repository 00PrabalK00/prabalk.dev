import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { claimEventId, rateLimit, recordEvent } from "@/lib/prabalos/store";
import { isEventType } from "@/lib/prabalos/types";

/**
 * The red and blue buttons.
 *
 * `event_id` is generated on the device at the instant of the press, before the
 * event ever touches the network, and reused on every retry. That is what makes
 * this endpoint safe to hammer: a press that spent three days in the ESP32's
 * NVS queue because the WiFi was down still increments the counter exactly
 * once, and the device can keep retrying until it sees a definitive answer.
 *
 * 200 means recorded. 409 means "already recorded" — which the firmware treats
 * as success and dequeues on, because a duplicate is proof of delivery.
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = 10;
const RATE_WINDOW_S = 60;
/** Bounds the id so a malformed device cannot write large keys into Redis. */
const EVENT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export async function POST(req: Request): Promise<Response> {
  const auth = await verifyDeviceRequest(req);
  if (!auth.ok) {
    console.warn(`[prabalos] event rejected: ${auth.reason}`);
    return deviceUnauthorized(auth.status);
  }

  const limited = await rateLimit(`event:${auth.deviceId}`, RATE_LIMIT, RATE_WINDOW_S);
  if (!limited.ok) return deviceUnauthorized(429);

  let parsed: unknown;
  try {
    parsed = JSON.parse(auth.body);
  } catch {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const body = parsed as { type?: unknown; event_id?: unknown; queued?: unknown };
  if (!isEventType(body.type)) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const eventId = typeof body.event_id === "string" ? body.event_id : "";
  if (!EVENT_ID_RE.test(eventId)) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (!(await claimEventId(eventId))) {
    // Already seen. Deliberately a success-shaped answer for the firmware.
    return Response.json(
      { ok: true, duplicate: true },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const queued = body.queued === true || body.queued === 1;
  const ev = await recordEvent(body.type, eventId, auth.deviceId, queued);

  return Response.json(
    { ok: true, id: ev.id, ts: ev.ts },
    { headers: { "Cache-Control": "no-store" } },
  );
}
