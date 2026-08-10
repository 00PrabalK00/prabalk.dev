import { deviceUnauthorized, verifyDeviceRequest } from "@/lib/prabalos/auth-device";
import {
  getCounters,
  getIncoming,
  getMusic,
  getState,
  getVersion,
  listMessages,
  touchDevice,
} from "@/lib/prabalos/store";
import {
  ARTIST_MAX,
  PLACE_MAX,
  PREVIEW_MAX,
  NOTE_MAX,
  TITLE_MAX,
  clamp,
  clockFor,
  livePosition,
  mmss,
  stamp,
  toDeviceText,
} from "@/lib/prabalos/render";
import type { SyncPayload } from "@/lib/prabalos/types";
import { getVoiceNote } from "@/lib/prabalos/voice";
import { getFirmware, noteInstalledVersion } from "@/lib/prabalos/firmware";

/**
 * The device's only polling endpoint.
 *
 * State, messages and now-playing are collapsed into one request because each
 * additional TLS handshake on the ESP32 costs ~40 KB of peak heap and 200-600 ms
 * — the single most expensive thing the device does. Three endpoints polled
 * every five seconds would not survive alongside the Bluetooth stack; one
 * endpoint on a kept-alive socket will.
 *
 * Everything in the response is pre-rendered. See `lib/prabalos/render.ts`.
 */

// Unlike the GitHub aggregator next door, this route must never be cached: it
// is the device's view of live state, and a stale 5-minute payload would show
// the wrong presence to the people this whole thing exists for.
export const dynamic = "force-dynamic";

const DEFAULT_MSG_LIMIT = 8;
const MAX_MSG_LIMIT = 12;
/** 30/min leaves headroom over the nominal 12/min (5 s) poll for retries. */
// Rate limiting was removed from this route deliberately. Every request is
// already HMAC-signed with a device key and carries a single-use nonce, so an
// unauthenticated flood cannot get this far, and the INCR was costing a Redis
// command on every poll to defend against a device that would have to be
// compromised first.

export async function GET(req: Request): Promise<Response> {
  const auth = await verifyDeviceRequest(req);
  if (!auth.ok) {
    console.warn(`[prabalos] sync rejected: ${auth.reason}`);
    return deviceUnauthorized(auth.status);
  }

  // ---------------------------------------------------------------------
  // Cheap path first.
  //
  // This route used to read state, music, messages, counters, incoming, voice
  // and firmware — about fifteen Redis commands — and only then compare the
  // ETag and usually return 304. At a poll every few seconds that is roughly
  // 260,000 commands a day for a device whose state changes a handful of times
  // an hour, which exhausts a 500k/month plan in under two days.
  //
  // The version counter alone decides whether anything changed, so an unchanged
  // poll now costs one GET.
  // ---------------------------------------------------------------------
  const version = await getVersion();
  const etag = `"v${version}"`;

  if (req.headers.get("if-none-match") === etag) {
    // Telemetry is skipped here too. The device only sends it every few polls
    // (see POS_TELEMETRY_EVERY in the firmware), and writing it on every
    // request was a Redis command per poll for numbers nobody was watching.
    if (req.headers.get("x-pos-heap")) {
      await touchDevice(auth.deviceId, {
        fw: req.headers.get("x-pos-fw") ?? undefined,
        rssi: numHeader(req, "x-pos-rssi"),
        heap: numHeader(req, "x-pos-heap"),
        largestBlock: numHeader(req, "x-pos-block"),
        queue: numHeader(req, "x-pos-queue"),
        ip: clientIp(req),
      });
    }
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "no-store" },
    });
  }

  // Something changed. Now it is worth reading everything.
  if (req.headers.get("x-pos-heap")) {
    await touchDevice(auth.deviceId, {
      fw: req.headers.get("x-pos-fw") ?? undefined,
      rssi: numHeader(req, "x-pos-rssi"),
      heap: numHeader(req, "x-pos-heap"),
      largestBlock: numHeader(req, "x-pos-block"),
      queue: numHeader(req, "x-pos-queue"),
      ip: clientIp(req),
    });
  }

  const url = new URL(req.url);
  const msgLimit = clampInt(url.searchParams.get("msg_limit"), DEFAULT_MSG_LIMIT, 0, MAX_MSG_LIMIT);

  const runningVersion = req.headers.get("x-pos-fw") ?? "";

  const [state, music, messages, counters, incoming, voice, firmware] = await Promise.all([
    getState(),
    getMusic(),
    listMessages(msgLimit),
    getCounters(),
    getIncoming(),
    getVoiceNote().catch(() => null),
    getFirmware().catch(() => null),
  ]);

  // Recorded from the firmware we just fetched, rather than fetching it again.
  if (runningVersion && firmware && firmware.installed !== runningVersion) {
    await noteInstalledVersion(runningVersion).catch(() => {});
  }

  const now = Math.floor(Date.now() / 1000);
  const tzAway = process.env.PRABALOS_TZ_AWAY || "America/New_York";
  const tzHome = process.env.PRABALOS_TZ_HOME || "Asia/Bangkok";
  const away = clockFor(tzAway);
  const home = clockFor(tzHome);

  const pos = livePosition(music.progress, music.updated, music.duration, music.playing, now);

  const payload: SyncPayload = {
    v: version,
    status: state.status,
    place: clamp(toDeviceText(state.place), PLACE_MAX),
    note: clamp(toDeviceText(state.note), NOTE_MAX),
    online: state.online,
    ny_time: away.time,
    ny_day: away.day,
    home_time: home.time,
    home_day: home.day,
    music: {
      playing: music.playing,
      title: clamp(toDeviceText(music.title), TITLE_MAX),
      artist: clamp(toDeviceText(music.artist), ARTIST_MAX),
      pos: mmss(pos),
      len: music.duration > 0 ? mmss(music.duration) : "",
      pct: music.duration > 0 ? Math.round((pos / music.duration) * 100) : 0,
    },
    unread: messages.reduce((n, m) => n + (m.read ? 0 : 1), 0),
    msgs: messages.map((m) => ({
      id: m.id,
      preview: clamp(toDeviceText(m.text), PREVIEW_MAX),
      when: stamp(m.ts, tzHome),
      read: m.read,
    })),
    counters: { love: counters.loveFromHome, miss: counters.missFromHome },
    ...(incoming ? { incoming: { kind: "love" as const, id: incoming.id } } : {}),
    // Offered whether or not it has been played: the device auto-plays an
    // unplayed one and keeps a replay button for the rest.
    ...(voice ? { voice: { id: voice.id, secs: voice.secs, played: voice.played } } : {}),
    // Offered only when it differs from what the device reports running, so a
    // device that has already updated is never told to update again.
    ...(firmware && firmware.version !== runningVersion
      ? { fw: { ver: firmware.version, sha: firmware.sha256, bytes: firmware.bytes } }
      : {}),
  };

  return Response.json(payload, {
    headers: { ETag: etag, "Cache-Control": "no-store" },
  });
}

function numHeader(req: Request, name: string): number | undefined {
  const raw = req.headers.get(name);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw === null ? NaN : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/** Best-effort, for the dashboard's device panel only. Never a trust boundary. */
function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "";
}
