import { del, put } from "@vercel/blob";
import { nowSec, randomId, redis } from "./store";

/**
 * Voice notes.
 *
 * The format is decided by the weakest link, which is the ESP32: 16 kHz mono
 * 16-bit PCM in a WAV container. Not MP3, not Opus — a decoder for either
 * would need flash and heap this device does not have spare alongside WiFi and
 * TLS, whereas raw PCM goes from the socket into the I2S peripheral with no
 * processing at all. The browser records at that rate directly, so nothing is
 * ever transcoded server-side.
 *
 * At 32 KB/s a 20 second note is ~640 KB. That is far too large for Redis
 * values and far too large to buffer on the device, so the bytes live in
 * Vercel Blob and only the metadata is in Redis; the device streams them.
 */

const KEY = "pos:voice";

/** Bounded so a stuck recorder cannot upload something the device can't play
 *  and the blob store cannot cheaply hold. */
export const VOICE_MAX_SECONDS = 30;
export const VOICE_SAMPLE_RATE = 16000;
export const VOICE_MAX_BYTES = VOICE_MAX_SECONDS * VOICE_SAMPLE_RATE * 2 + 1024;

export interface VoiceNote {
  id: string;
  /** Blob pathname. Private blobs have no fetchable URL — reads go through
   *  get(pathname, { access: 'private' }) with the store token. */
  pathname: string;
  /** Duration in whole seconds, for the device's UI. */
  secs: number;
  bytes: number;
  ts: number;
  /** True once the device has played it. */
  played: boolean;
}

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Stores a new note, replacing any previous one.
 *
 * Only one note is held at a time, deliberately. This is a presence object,
 * not a voicemail system: a queue of unheard messages would turn a warm thing
 * into an obligation. The old blob is deleted rather than orphaned so the
 * store does not grow forever.
 */
export async function putVoiceNote(wav: ArrayBuffer, secs: number): Promise<VoiceNote> {
  const previous = await getVoiceNote();

  const id = `v_${randomId(8)}`;
  // Private, not public.
  //
  // A public blob is readable by anyone holding the URL — unguessable, but a
  // bearer token in disguise. These are voice messages to someone's parents;
  // private means the bytes cannot leave the store without the store token,
  // and playback stays behind the same signed-request check as everything else.
  const blob = await put(`prabalos/${id}.wav`, wav, {
    access: "private",
    contentType: "audio/wav",
    addRandomSuffix: true,
  });

  const note: VoiceNote = {
    id,
    pathname: blob.pathname,
    secs: Math.max(1, Math.round(secs)),
    bytes: wav.byteLength,
    ts: nowSec(),
    played: false,
  };

  await redis().hset(KEY, {
    id: note.id,
    pathname: note.pathname,
    secs: String(note.secs),
    bytes: String(note.bytes),
    ts: String(note.ts),
    played: "0",
  });
  await redis().incr("pos:ver");

  if (previous?.pathname) {
    // Best effort. An orphaned blob is untidy; a failed upload would be worse.
    try {
      await del(previous.pathname);
    } catch {
      /* ignore */
    }
  }

  return note;
}

export async function getVoiceNote(): Promise<VoiceNote | null> {
  const h = await redis().hgetall(KEY);
  if (!h || !h.id) return null;
  const num = (v: unknown, d = 0) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : d;
  };
  return {
    id: String(h.id),
    pathname: String(h.pathname ?? ""),
    secs: num(h.secs, 1),
    bytes: num(h.bytes),
    ts: num(h.ts),
    played: h.played === 1 || h.played === "1" || h.played === true,
  };
}

export async function markVoicePlayed(id: string): Promise<boolean> {
  const note = await getVoiceNote();
  if (!note || note.id !== id) return false;
  await redis().hset(KEY, { played: "1" });
  await redis().incr("pos:ver");
  return true;
}

export async function clearVoiceNote(): Promise<void> {
  const note = await getVoiceNote();
  if (note?.pathname) {
    try {
      await del(note.pathname);
    } catch {
      /* ignore */
    }
  }
  await redis().del(KEY);
  await redis().incr("pos:ver");
}
