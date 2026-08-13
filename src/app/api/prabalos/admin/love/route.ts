import { ok, readJson, requireAdmin } from "@/lib/prabalos/admin";
import { sendFeelingHome } from "@/lib/prabalos/store";

/**
 * The reverse direction: Prabal presses a button here, their screen lights up.
 *
 * Both feelings share this route because they are the same operation with a
 * different word on the overlay, and the device holds exactly one undelivered
 * message either way. If this is pressed five times while the device is
 * offline, the parents see one screen when it reconnects rather than five
 * queued animations — the counters still record all five.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  // Body optional. A missing or unparseable one means love, which is what this
  // route did unconditionally before the miss button existed.
  const body = await readJson<{ kind?: unknown }>(req);
  const kind = body?.kind === "miss" ? "miss" : "love";

  const sent = await sendFeelingHome(kind);
  return ok({ ok: true, id: sent.id, kind: sent.kind });
}
