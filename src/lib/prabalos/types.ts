/**
 * PrabalOS wire types.
 *
 * The device is deliberately dumb: it has no timezone database, no string
 * measurement, no percentage arithmetic and very little heap. So everything in
 * `SyncPayload` is pre-rendered here — times formatted in both zones, titles
 * already truncated to what a 320 px line holds, progress already reduced to an
 * integer percent. The firmware's job is to blit what it is handed.
 *
 * Field names are short on purpose. At a 5 second poll interval the payload is
 * parsed ~17k times a day on a chip with ~40 KB of spare heap; every byte saved
 * is a byte ArduinoJson does not have to hold.
 */

/** The presence values the dashboard offers. Free-form is not allowed — the
 *  device renders these against a fixed icon table. */
export const STATUSES = [
  "Available",
  "In class",
  "Working",
  "At home",
  "Out",
  "Sleeping",
  "Travelling",
  "Free to call",
  "Busy",
] as const;

export type Status = (typeof STATUSES)[number];

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

/** Events the physical buttons produce. `love` is red (GPIO33), `miss_you` is
 *  blue (GPIO32). */
export const EVENT_TYPES = ["love", "miss_you"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function isEventType(v: unknown): v is EventType {
  return typeof v === "string" && (EVENT_TYPES as readonly string[]).includes(v);
}

/** What Prabal publishes about himself. */
export interface PresenceState {
  status: Status;
  /** Optional soft location — "Brooklyn", "Library". Never coordinates. */
  place: string;
  /** The daily note. Parents value this more than any tracking feature. */
  note: string;
  /** Manual online flag, toggled from /os. */
  online: boolean;
  /** Epoch seconds of the last write. */
  updated: number;
}

/**
 * Now playing, stored as a snapshot rather than a stream.
 *
 * `progress` is the position *at the moment `updated` was written*. The sync
 * route extrapolates forward from there, so a track keeps advancing on the TFT
 * even if the publisher only pushes once a minute. That is the whole reason
 * this is stored as (position, timestamp) instead of a live position.
 */
export interface MusicState {
  playing: boolean;
  title: string;
  artist: string;
  /** Seconds into the track at `updated`. */
  progress: number;
  /** Track length in seconds. 0 means unknown. */
  duration: number;
  updated: number;
}

/** A message from Prabal to home. */
export interface Message {
  id: string;
  text: string;
  /** Epoch seconds. */
  ts: number;
  read: boolean;
}

/** A button press received from the device. */
export interface DeviceEvent {
  id: string;
  type: EventType;
  /** Epoch seconds, as recorded by the server on receipt. */
  ts: number;
  /** True when the event sat in the device's NVS queue before delivery. */
  queued: boolean;
  device: string;
}

/** Love sent the other way — Prabal to home. Delivered once, then acked. */
export interface IncomingLove {
  id: string;
  kind: "love";
  ts: number;
}

/** Telemetry the device reports so /os can show whether it is healthy. */
export interface DeviceHealth {
  device: string;
  /** Epoch seconds of the last authenticated request. */
  lastSeen: number;
  fw: string;
  rssi: number;
  /** Free heap in bytes. The number that predicts every failure this thing has. */
  heap: number;
  /** Largest contiguous free block. Below ~24 KB, TLS handshakes start failing. */
  largestBlock: number;
  /** Pending events in the NVS ring buffer. */
  queue: number;
  ip: string;
}

/** One inbox row as the device renders it — preview only, no body. */
export interface SyncMessage {
  id: string;
  preview: string;
  when: string;
  read: boolean;
}

/** The single polling payload. See the note at the top of this file. */
export interface SyncPayload {
  /** Monotonic version, also the ETag. */
  v: number;
  status: Status;
  place: string;
  note: string;
  online: boolean;
  ny_time: string;
  ny_day: string;
  home_time: string;
  home_day: string;
  music: {
    playing: boolean;
    title: string;
    artist: string;
    /** "2:13" */
    pos: string;
    /** "4:50" */
    len: string;
    /** 0-100, already rounded. */
    pct: number;
  };
  unread: number;
  msgs: SyncMessage[];
  counters: { love: number; miss: number };
  /** Present only when there is undelivered love from Prabal. */
  incoming?: { kind: "love"; id: string };
  /**
   * Present whenever a voice note exists, played or not.
   *
   * `played` is what tells the device whether to play it on arrival. The note
   * itself stays available for replay until it is removed from /os — a
   * message you can only hear once is a worse version of a message.
   */
  voice?: { id: string; secs: number; played: boolean };
  /** Present only when published firmware differs from what the device runs. */
  fw?: { ver: string; sha: string; bytes: number };
}
