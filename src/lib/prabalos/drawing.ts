import { del, get, put } from "@vercel/blob";
import { nowSec, randomId, redis } from "./store";

/**
 * Drawings sent from the device.
 *
 * Someone draws on the touchscreen with the stylus and it arrives here. Held
 * one at a time and deliberately not archived: this is a note passed under a
 * door, not a gallery. Download the ones worth keeping, then clear it.
 *
 * Stored as strokes rather than pixels. A 320x240 bitmap is 9.6 KB even at one
 * bit per pixel and looks like exactly what it is — a low-resolution capture —
 * whereas the strokes are a few hundred coordinates, arrive in a fraction of
 * the bytes over a link the device pays for in heap, and redraw crisply at any
 * size on the dashboard. It also means a drawing can be re-rendered later at
 * whatever resolution a download wants.
 *
 * Wire format, chosen to be trivial for the firmware to emit:
 *
 *   "x,y x,y x,y|x,y x,y|..."   strokes separated by |, points by spaces
 */

const KEY = "pos:draw";

/** The device caps its own capture; this is the backstop. */
export const DRAWING_MAX_BYTES = 24 * 1024;

export interface Drawing {
  id: string;
  pathname: string;
  bytes: number;
  ts: number;
  /** True once it has been opened on the dashboard. */
  seen: boolean;
}

export function drawingConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function putDrawing(strokes: string): Promise<Drawing> {
  const previous = await getDrawing();

  const id = `d_${randomId(8)}`;
  const blob = await put(`prabalos/${id}.strokes`, strokes, {
    access: "private",
    contentType: "text/plain",
    addRandomSuffix: true,
  });

  const drawing: Drawing = {
    id,
    pathname: blob.pathname,
    bytes: strokes.length,
    ts: nowSec(),
    seen: false,
  };

  await redis().hset(KEY, {
    id: drawing.id,
    pathname: drawing.pathname,
    bytes: String(drawing.bytes),
    ts: String(drawing.ts),
    seen: "0",
  });
  await redis().incr("pos:ver");

  // One at a time. A new drawing replaces the old one rather than stacking up,
  // which is the behaviour asked for and also means the store never grows.
  if (previous?.pathname) {
    try {
      await del(previous.pathname);
    } catch {
      /* an orphan is untidy; a failed upload would be worse */
    }
  }

  return drawing;
}

export async function getDrawing(): Promise<Drawing | null> {
  const h = await redis().hgetall(KEY);
  if (!h || !h.id) return null;
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    id: String(h.id),
    pathname: String(h.pathname ?? ""),
    bytes: num(h.bytes),
    ts: num(h.ts),
    seen: h.seen === 1 || h.seen === "1" || h.seen === true,
  };
}

/** The stroke data itself, read through the store with its token. */
export async function getDrawingStrokes(): Promise<string | null> {
  const drawing = await getDrawing();
  if (!drawing?.pathname) return null;

  const result = await get(drawing.pathname, { access: "private" });
  if (!result) return null;
  return await new Response(result.stream).text();
}

export async function markDrawingSeen(): Promise<void> {
  const drawing = await getDrawing();
  if (!drawing || drawing.seen) return;
  await redis().hset(KEY, { seen: "1" });
}

export async function clearDrawing(): Promise<void> {
  const drawing = await getDrawing();
  if (drawing?.pathname) {
    try {
      await del(drawing.pathname);
    } catch {
      /* ignore */
    }
  }
  await redis().del(KEY);
  await redis().incr("pos:ver");
}
