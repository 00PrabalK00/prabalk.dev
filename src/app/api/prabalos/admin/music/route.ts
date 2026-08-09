import { badRequest, ok, readJson, requireAdmin, text } from "@/lib/prabalos/admin";
import { setMusic } from "@/lib/prabalos/store";

/**
 * Now playing — metadata only, never audio.
 *
 * The device shows what Prabal is listening to; it does not stream it from
 * America. Their own phone can pair over Bluetooth when they want the box to
 * be a speaker.
 *
 * `progress` is stored as the position at the moment of the write. The sync
 * route extrapolates from there, so a companion app only needs to publish on
 * track change or seek rather than once a second.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const body = await readJson<{
    playing?: unknown;
    title?: unknown;
    artist?: unknown;
    progress?: unknown;
    duration?: unknown;
  }>(req);
  if (!body) return badRequest();

  const patch: Parameters<typeof setMusic>[0] = {};

  if (body.playing !== undefined) {
    if (typeof body.playing !== "boolean") return badRequest();
    patch.playing = body.playing;
  }
  if (body.title !== undefined) {
    const title = text(body.title, 120);
    if (title === null) return badRequest();
    patch.title = title;
  }
  if (body.artist !== undefined) {
    const artist = text(body.artist, 120);
    if (artist === null) return badRequest();
    patch.artist = artist;
  }
  if (body.progress !== undefined) {
    const n = Number(body.progress);
    if (!Number.isFinite(n) || n < 0 || n > 86400) return badRequest();
    patch.progress = Math.trunc(n);
  }
  if (body.duration !== undefined) {
    const n = Number(body.duration);
    if (!Number.isFinite(n) || n < 0 || n > 86400) return badRequest();
    patch.duration = Math.trunc(n);
  }

  if (Object.keys(patch).length === 0) return badRequest();

  await setMusic(patch);
  return ok();
}
