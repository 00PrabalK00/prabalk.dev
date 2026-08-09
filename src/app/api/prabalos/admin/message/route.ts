import { badRequest, ok, readJson, requireAdmin, text } from "@/lib/prabalos/admin";
import { addMessage } from "@/lib/prabalos/store";

/** A message from Prabal to home. Appears on the device within one poll. */

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const body = await readJson<{ text?: unknown }>(req);
  if (!body) return badRequest();

  // The full text is kept; the device gets a truncated preview in /sync and
  // the clamped body from /message/[id]. Keeping the original means a future
  // screen with a bigger font does not need a data migration.
  const msg = text(body.text, 500);
  if (!msg) return badRequest();

  const created = await addMessage(msg);
  return ok({ ok: true, id: created.id, ts: created.ts });
}
