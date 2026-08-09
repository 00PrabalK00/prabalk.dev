import { badRequest, ok, readJson, requireAdmin, text } from "@/lib/prabalos/admin";
import { setState } from "@/lib/prabalos/store";
import { isStatus } from "@/lib/prabalos/types";

/** Presence, soft place and the daily note — the three things the home screen
 *  is actually for. */

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const body = await readJson<{
    status?: unknown;
    place?: unknown;
    note?: unknown;
    online?: unknown;
  }>(req);
  if (!body) return badRequest();

  const patch: Parameters<typeof setState>[0] = {};

  if (body.status !== undefined) {
    if (!isStatus(body.status)) return badRequest();
    patch.status = body.status;
  }
  if (body.place !== undefined) {
    // Deliberately free text, and deliberately never coordinates. "Brooklyn"
    // answers the question parents are actually asking; a latitude does not.
    const place = text(body.place, 40);
    if (place === null) return badRequest();
    patch.place = place;
  }
  if (body.note !== undefined) {
    const note = text(body.note, 240);
    if (note === null) return badRequest();
    patch.note = note;
  }
  if (body.online !== undefined) {
    if (typeof body.online !== "boolean") return badRequest();
    patch.online = body.online;
  }

  if (Object.keys(patch).length === 0) return badRequest();

  await setState(patch);
  return ok();
}
