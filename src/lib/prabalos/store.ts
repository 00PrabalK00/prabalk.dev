import { Redis } from "@upstash/redis";
import type {
  DeviceEvent,
  DeviceHealth,
  EventType,
  IncomingLove,
  Message,
  MusicState,
  PresenceState,
  Status,
} from "./types";

/**
 * The only mutable store in the project.
 *
 * Everything PrabalOS knows lives in Upstash Redis behind this module, so the
 * key schema exists in exactly one file. The site's static content stays in
 * `src/lib/data.ts` and is untouched by any of this.
 *
 * Upstash's REST client deserializes values automatically, which means a stored
 * `"123"` comes back as the number `123` and a stored `"true"` as a boolean.
 * Nothing below trusts the returned type — every read goes through the coercers
 * so a schema drift shows up as a default rather than a runtime crash on the
 * device's only data source.
 */

const K = {
  state: "pos:state",
  music: "pos:music",
  /** List of message ids, newest first. */
  msgIds: "pos:msgs",
  msg: (id: string) => `pos:msg:${id}`,
  /** List of JSON-encoded DeviceEvent, newest first. */
  events: "pos:events",
  counters: "pos:counters",
  incoming: "pos:incoming",
  health: (device: string) => `pos:dev:${device}`,
  /** Monotonic version, doubles as the sync ETag. */
  version: "pos:ver",
  seen: (eventId: string) => `pos:seen:${eventId}`,
  nonce: (nonce: string) => `pos:nonce:${nonce}`,
  rate: (bucket: string) => `pos:rl:${bucket}`,
  session: (jti: string) => `pos:sess:${jti}`,
  authLog: "pos:authlog",
  loginFail: (ip: string) => `pos:lf:${ip}`,
} as const;

const MSG_CAP = 50;
const EVENT_CAP = 200;
const AUTHLOG_CAP = 50;
/** A replayed event id is rejected for a week — far longer than any plausible
 *  offline queue drain, which is the only legitimate source of retries. */
const SEEN_TTL_S = 7 * 24 * 60 * 60;
const NONCE_TTL_S = 300;

let client: Redis | null = null;

/**
 * Lazily constructed so that importing this module (which the public site's
 * build graph does, transitively, through the /os route) never throws at build
 * time when the env vars are absent.
 */
export function redis(): Redis {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "PrabalOS storage is not configured: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  client = new Redis({ url, token });
  return client;
}

export function storageConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/* ------------------------------------------------------------------ */
/* Coercers — see the note about Upstash auto-deserialization above.   */
/* ------------------------------------------------------------------ */

type Hash = Record<string, unknown> | null;

function str(h: Hash, field: string, fallback = ""): string {
  const v = h?.[field];
  return v === undefined || v === null ? fallback : String(v);
}

function int(h: Hash, field: string, fallback = 0): number {
  const v = h?.[field];
  if (v === undefined || v === null) return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function bool(h: Hash, field: string, fallback = false): boolean {
  const v = h?.[field];
  if (v === undefined || v === null) return fallback;
  if (typeof v === "boolean") return v;
  return v === 1 || v === "1" || v === "true";
}

export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

/* ------------------------------------------------------------------ */
/* Version / ETag                                                      */
/* ------------------------------------------------------------------ */

/**
 * Bumped by every write. The device sends the previous value back as
 * `If-None-Match`, so nine polls in ten cost a 304 with an empty body instead
 * of a JSON parse on a chip that cannot spare the heap.
 */
export async function bumpVersion(): Promise<number> {
  return await redis().incr(K.version);
}

export async function getVersion(): Promise<number> {
  const v = await redis().get<number | string>(K.version);
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/* ------------------------------------------------------------------ */
/* Presence                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_STATE: PresenceState = {
  status: "Available",
  place: "",
  note: "",
  online: false,
  updated: 0,
};

export async function getState(): Promise<PresenceState> {
  const h = await redis().hgetall(K.state);
  if (!h) return DEFAULT_STATE;
  return {
    status: (str(h, "status", DEFAULT_STATE.status) as Status) || DEFAULT_STATE.status,
    place: str(h, "place"),
    note: str(h, "note"),
    online: bool(h, "online"),
    updated: int(h, "updated"),
  };
}

export async function setState(patch: Partial<Omit<PresenceState, "updated">>): Promise<void> {
  const fields: Record<string, string> = { updated: String(nowSec()) };
  if (patch.status !== undefined) fields.status = patch.status;
  if (patch.place !== undefined) fields.place = patch.place;
  if (patch.note !== undefined) fields.note = patch.note;
  if (patch.online !== undefined) fields.online = patch.online ? "1" : "0";
  await redis().hset(K.state, fields);
  await bumpVersion();
}

/* ------------------------------------------------------------------ */
/* Music                                                               */
/* ------------------------------------------------------------------ */

const DEFAULT_MUSIC: MusicState = {
  playing: false,
  title: "",
  artist: "",
  progress: 0,
  duration: 0,
  updated: 0,
};

export async function getMusic(): Promise<MusicState> {
  const h = await redis().hgetall(K.music);
  if (!h) return DEFAULT_MUSIC;
  return {
    playing: bool(h, "playing"),
    title: str(h, "title"),
    artist: str(h, "artist"),
    progress: int(h, "progress"),
    duration: int(h, "duration"),
    updated: int(h, "updated"),
  };
}

/**
 * `progress` is stored as the position at write time; the sync route
 * extrapolates. Callers therefore only need to publish on track change or
 * seek, not once a second.
 */
export async function setMusic(patch: Partial<Omit<MusicState, "updated">>): Promise<void> {
  const fields: Record<string, string> = { updated: String(nowSec()) };
  if (patch.playing !== undefined) fields.playing = patch.playing ? "1" : "0";
  if (patch.title !== undefined) fields.title = patch.title;
  if (patch.artist !== undefined) fields.artist = patch.artist;
  if (patch.progress !== undefined) fields.progress = String(Math.max(0, patch.progress));
  if (patch.duration !== undefined) fields.duration = String(Math.max(0, patch.duration));
  await redis().hset(K.music, fields);
  await bumpVersion();
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

/**
 * Messages are an id list plus one hash per message, rather than a list of
 * JSON blobs. Marking one read is then a single HSET on a stable key; with
 * JSON-in-a-list it would be an LSET at an index that a concurrent LPUSH can
 * shift out from under you, silently marking the wrong message read.
 */
export async function addMessage(text: string): Promise<Message> {
  const msg: Message = { id: `m_${randomId(8)}`, text, ts: nowSec(), read: false };
  const p = redis().pipeline();
  p.hset(K.msg(msg.id), { text: msg.text, ts: String(msg.ts), read: "0" });
  p.lpush(K.msgIds, msg.id);
  p.ltrim(K.msgIds, 0, MSG_CAP - 1);
  p.incr(K.version);
  await p.exec();
  return msg;
}

export async function listMessages(limit: number): Promise<Message[]> {
  const n = Math.max(0, Math.min(limit, MSG_CAP));
  if (n === 0) return [];
  const ids = await redis().lrange<string>(K.msgIds, 0, n - 1);
  if (!ids.length) return [];

  const p = redis().pipeline();
  for (const id of ids) p.hgetall(K.msg(id));
  const rows = (await p.exec()) as Hash[];

  const out: Message[] = [];
  for (let i = 0; i < ids.length; i++) {
    const h = rows[i];
    // A trimmed-away or expired hash leaves a dangling id; skip rather than
    // rendering an empty row on the device.
    if (!h || Object.keys(h).length === 0) continue;
    out.push({
      id: ids[i],
      text: str(h, "text"),
      ts: int(h, "ts"),
      read: bool(h, "read"),
    });
  }
  return out;
}

export async function getMessage(id: string): Promise<Message | null> {
  const h = await redis().hgetall(K.msg(id));
  if (!h || Object.keys(h).length === 0) return null;
  return { id, text: str(h, "text"), ts: int(h, "ts"), read: bool(h, "read") };
}

export async function markRead(id: string): Promise<boolean> {
  const exists = await redis().exists(K.msg(id));
  if (!exists) return false;
  await redis().hset(K.msg(id), { read: "1" });
  await bumpVersion();
  return true;
}

export async function unreadCount(): Promise<number> {
  const msgs = await listMessages(MSG_CAP);
  return msgs.reduce((n, m) => n + (m.read ? 0 : 1), 0);
}

/* ------------------------------------------------------------------ */
/* Events from the device                                              */
/* ------------------------------------------------------------------ */

/**
 * Idempotency guard. The device generates `event_id` at the instant of the
 * button press and reuses it on every retry, so a press that sat in the NVS
 * queue for three days still lands exactly once.
 *
 * Returns false when this id has already been recorded.
 */
export async function claimEventId(eventId: string): Promise<boolean> {
  const res = await redis().set(K.seen(eventId), "1", { nx: true, ex: SEEN_TTL_S });
  return res === "OK";
}

export async function recordEvent(
  type: EventType,
  eventId: string,
  device: string,
  queued: boolean,
): Promise<DeviceEvent> {
  const ev: DeviceEvent = { id: eventId, type, ts: nowSec(), queued, device };
  const p = redis().pipeline();
  p.lpush(K.events, JSON.stringify(ev));
  p.ltrim(K.events, 0, EVENT_CAP - 1);
  p.hincrby(K.counters, type === "love" ? "love_from_home" : "miss_from_home", 1);
  p.incr(K.version);
  await p.exec();
  return ev;
}

export async function listEvents(limit = 30): Promise<DeviceEvent[]> {
  const raw = await redis().lrange<unknown>(K.events, 0, Math.max(0, limit - 1));
  const out: DeviceEvent[] = [];
  for (const item of raw) {
    // Upstash may hand back an already-parsed object or the raw string
    // depending on how the value round-trips; accept both.
    try {
      const ev = typeof item === "string" ? JSON.parse(item) : item;
      if (ev && typeof ev === "object") out.push(ev as DeviceEvent);
    } catch {
      /* skip a malformed row rather than failing the whole dashboard */
    }
  }
  return out;
}

export async function getCounters(): Promise<{
  loveFromHome: number;
  missFromHome: number;
  loveFromPrabal: number;
}> {
  const h = await redis().hgetall(K.counters);
  return {
    loveFromHome: int(h, "love_from_home"),
    missFromHome: int(h, "miss_from_home"),
    loveFromPrabal: int(h, "love_from_prabal"),
  };
}

/* ------------------------------------------------------------------ */
/* Love in the other direction                                         */
/* ------------------------------------------------------------------ */

/** Set by /os. Delivered once via sync, cleared by the device's ack. */
export async function sendLoveHome(): Promise<IncomingLove> {
  const love: IncomingLove = { id: `i_${randomId(6)}`, kind: "love", ts: nowSec() };
  const p = redis().pipeline();
  p.hset(K.incoming, { id: love.id, ts: String(love.ts) });
  p.hincrby(K.counters, "love_from_prabal", 1);
  p.incr(K.version);
  await p.exec();
  return love;
}

export async function getIncoming(): Promise<IncomingLove | null> {
  const h = await redis().hgetall(K.incoming);
  const id = str(h, "id");
  if (!id) return null;
  return { id, kind: "love", ts: int(h, "ts") };
}

/** Acked by id so a stale ack from a rebooting device cannot clear a newer one. */
export async function ackIncoming(id: string): Promise<boolean> {
  const current = await getIncoming();
  if (!current || current.id !== id) return false;
  await redis().del(K.incoming);
  await bumpVersion();
  return true;
}

/* ------------------------------------------------------------------ */
/* Device health                                                       */
/* ------------------------------------------------------------------ */

/**
 * Deliberately does NOT bump the version. Telemetry arrives with every poll;
 * bumping here would make the ETag change on every request and defeat the
 * entire 304 mechanism.
 */
export async function touchDevice(
  device: string,
  telemetry: Partial<Omit<DeviceHealth, "device" | "lastSeen">>,
): Promise<void> {
  const fields: Record<string, string> = { lastSeen: String(nowSec()) };
  if (telemetry.fw !== undefined) fields.fw = telemetry.fw;
  if (telemetry.rssi !== undefined) fields.rssi = String(telemetry.rssi);
  if (telemetry.heap !== undefined) fields.heap = String(telemetry.heap);
  if (telemetry.largestBlock !== undefined) fields.largestBlock = String(telemetry.largestBlock);
  if (telemetry.queue !== undefined) fields.queue = String(telemetry.queue);
  if (telemetry.ip !== undefined) fields.ip = telemetry.ip;
  await redis().hset(K.health(device), fields);
}

export async function getDeviceHealth(device: string): Promise<DeviceHealth | null> {
  const h = await redis().hgetall(K.health(device));
  if (!h || Object.keys(h).length === 0) return null;
  return {
    device,
    lastSeen: int(h, "lastSeen"),
    fw: str(h, "fw", "?"),
    rssi: int(h, "rssi"),
    heap: int(h, "heap"),
    largestBlock: int(h, "largestBlock"),
    queue: int(h, "queue"),
    ip: str(h, "ip"),
  };
}

/* ------------------------------------------------------------------ */
/* Replay + rate limiting                                              */
/* ------------------------------------------------------------------ */

/** Returns false when the nonce has been used inside the replay window. */
export async function claimNonce(nonce: string): Promise<boolean> {
  const res = await redis().set(K.nonce(nonce), "1", { nx: true, ex: NONCE_TTL_S });
  return res === "OK";
}

/**
 * Fixed-window counter. Coarse by design: the goal is to bound abuse of a
 * five-endpoint API used by one device and one person, not to be a fair
 * rate limiter.
 */
export async function rateLimit(
  bucket: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; count: number }> {
  const key = K.rate(bucket);
  const count = await redis().incr(key);
  if (count === 1) await redis().expire(key, windowSec);
  return { ok: count <= limit, count };
}

/* ------------------------------------------------------------------ */
/* Sessions and the auth log                                           */
/* ------------------------------------------------------------------ */

/** A session id is recorded server-side so that logout and "revoke all" can
 *  actually invalidate a cookie instead of merely asking the browser to drop it. */
export async function createSession(jti: string, ttlSec: number): Promise<void> {
  await redis().set(K.session(jti), nowSec(), { ex: ttlSec });
}

export async function sessionValid(jti: string): Promise<boolean> {
  return (await redis().exists(K.session(jti))) === 1;
}

export async function revokeSession(jti: string): Promise<void> {
  await redis().del(K.session(jti));
}

export async function logAuth(entry: {
  ok: boolean;
  ip: string;
  reason: string;
  ua: string;
}): Promise<void> {
  const p = redis().pipeline();
  p.lpush(K.authLog, JSON.stringify({ ...entry, ts: nowSec() }));
  p.ltrim(K.authLog, 0, AUTHLOG_CAP - 1);
  await p.exec();
}

export async function listAuthLog(
  limit = 20,
): Promise<Array<{ ok: boolean; ip: string; reason: string; ua: string; ts: number }>> {
  const raw = await redis().lrange<unknown>(K.authLog, 0, Math.max(0, limit - 1));
  const out: Array<{ ok: boolean; ip: string; reason: string; ua: string; ts: number }> = [];
  for (const item of raw) {
    try {
      const e = typeof item === "string" ? JSON.parse(item) : item;
      if (e && typeof e === "object") out.push(e as (typeof out)[number]);
    } catch {
      /* ignore malformed */
    }
  }
  return out;
}

/**
 * Login throttle. Returns the current failure count and how long the caller is
 * locked out for. The window is extended on every failure, so a script that
 * keeps trying keeps itself locked out.
 */
export async function loginFailures(ip: string): Promise<number> {
  const v = await redis().get<number | string>(K.loginFail(ip));
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function noteLoginFailure(ip: string, windowSec: number): Promise<number> {
  const key = K.loginFail(ip);
  const count = await redis().incr(key);
  await redis().expire(key, windowSec);
  return count;
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await redis().del(K.loginFail(ip));
}

/* ------------------------------------------------------------------ */

/** URL-safe random id. Uses the Web Crypto API so this works on any runtime. */
export function randomId(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let s = "";
  for (const b of buf) s += b.toString(16).padStart(2, "0");
  return s;
}
