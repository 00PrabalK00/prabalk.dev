import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import { ackIncoming, markRead, rateLimit } from "@/lib/prabalos/store";

/**
 * The device acknowledging something it has shown.
 *
 * Two kinds:
 *   { "kind": "read",     "id": "m_9f" }  — a message was opened
 *   { "kind": "incoming", "id": "i_31" }  — the "Prabal sent love" screen was shown
 *
 * Incoming love is acked by id rather than blindly cleared, so a device that
 * reboots mid-animation and re-acks an old id cannot wipe a newer one that
 * arrived in the meantime.
 */

export const dynamic = "force-dynamic";

const RATE_LIMIT = 30;
const RATE_WINDOW_S = 60;
const ID_RE = /^[A-Za-z0-9_-]{3,64}$/;

export async function POST(req: Request): Promise<Response> {
  const auth = await verifyDeviceRequest(req);
  if (!auth.ok) {
    console.warn(`[prabalos] ack rejected: ${auth.reason}`);
    return deviceUnauthorized(auth.status);
  }

  const limited = await rateLimit(`ack:${auth.deviceId}`, RATE_LIMIT, RATE_WINDOW_S);
  if (!limited.ok) return deviceUnauthorized(429);

  let parsed: unknown;
  try {
    parsed = JSON.parse(auth.body);
  } catch {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const body = parsed as { kind?: unknown; id?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  if (!ID_RE.test(id)) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  let applied = false;
  if (body.kind === "read") applied = await markRead(id);
  else if (body.kind === "incoming") applied = await ackIncoming(id);
  else return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });

  // `applied: false` means the id was already gone — stale, not an error. The
  // firmware dequeues on either, since both mean "nothing left to do".
  return Response.json({ ok: true, applied }, { headers: { "Cache-Control": "no-store" } });
}
