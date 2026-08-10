import { ok, requireAdmin } from "@/lib/prabalos/admin";
import { overview } from "@/lib/prabalos/overview";
import { getDeviceHealth, getVersion } from "@/lib/prabalos/store";

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

  // Cheap path, same idea as the device's /sync.
  //
  // A full overview is about a dozen Redis reads. Polled every few seconds by
  // an open tab, that was outspending the device several times over — the
  // read-to-write ratio in the Upstash console made it obvious: the device
  // writes, the dashboard reads.
  //
  // Almost nothing changes between polls, and the version counter says so for
  // one read. Device telemetry is the exception: it moves without bumping the
  // version, so health is fetched too and merged client-side.
  const since = Number(new URL(req.url).searchParams.get("v"));
  if (Number.isFinite(since) && since > 0) {
    const version = await getVersion();
    if (version === since) {
      const deviceId = process.env.PRABALOS_DEVICE_ID || "PRABALOS_HOME_01";
      const health = await getDeviceHealth(deviceId).catch(() => null);
      return ok({ unchanged: true, version, health, now: Math.floor(Date.now() / 1000) });
    }
  }

  return ok(await overview());
}
