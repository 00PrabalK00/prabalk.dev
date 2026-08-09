import { ok, requireAdmin } from "@/lib/prabalos/admin";
import { sendLoveHome } from "@/lib/prabalos/store";

/**
 * The reverse direction: Prabal presses a button here, their screen lights up.
 *
 * Only one undelivered love is held at a time. If the device is offline and
 * this is pressed five times, the parents see one heart when it reconnects
 * rather than five queued animations — the counter still records all five.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const love = await sendLoveHome();
  return ok({ ok: true, id: love.id });
}
