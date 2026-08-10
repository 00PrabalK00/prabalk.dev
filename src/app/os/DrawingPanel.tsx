"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CSRF_HEADER } from "@/lib/prabalos/constants";
import type { Overview } from "@/lib/prabalos/overview";

/**
 * Whatever they drew on the device, redrawn here.
 *
 * The device sends strokes rather than pixels, so this is a real vector
 * redraw: crisp at any size, and the PNG download can be rendered at 4x
 * without the softness a 320x240 bitmap would have had.
 */

const W = 320;
const H = 240;
const SCALE = 2;

export default function DrawingPanel({
  drawing,
  onChanged,
  onFlash,
}: {
  drawing: Overview["drawing"];
  onChanged: () => void;
  onFlash: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Which drawing the strokes on screen belong to. State rather than a ref,
   *  because it is compared during render and refs may not be. */
  const [shownId, setShownId] = useState<string | null>(drawing?.id ?? null);

  // A different drawing (or none) clears what is on screen immediately, during
  // render, so the old picture never lingers under a new timestamp.
  const currentId = drawing?.id ?? null;
  if (currentId !== shownId) {
    setShownId(currentId);
    setStrokes(null);
  }

  // The overview carries only metadata, so the blob is read once per id rather
  // than on every poll.
  //
  // The fetch lives inside the effect with a cancellation flag: a drawing that
  // is cleared while its strokes are still in flight must not repaint the
  // canvas when the response finally lands.
  useEffect(() => {
    if (!currentId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/prabalos/admin/drawing", {
          headers: { [CSRF_HEADER]: "1" },
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { strokes?: string };
        if (!cancelled) setStrokes(data.strokes ?? null);
      } catch {
        /* the next poll will bring it round again */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentId]);

  const render = useCallback((canvas: HTMLCanvasElement, data: string, scale: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = W * scale;
    canvas.height = H * scale;

    // Same near-black as the device panel, so what arrives looks like what
    // they drew rather than ink on white.
    ctx.fillStyle = "#0a0d12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#e4ecf5";
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of data.split("|")) {
      const points = stroke
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((p) => p.split(",").map(Number))
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

      if (points.length === 0) continue;

      ctx.beginPath();
      if (points.length === 1) {
        // A single tap is a dot, not a zero-length line, which would draw
        // nothing at all.
        ctx.arc(points[0][0] * scale, points[0][1] * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = "#e4ecf5";
        ctx.fill();
        continue;
      }
      ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
      }
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (canvasRef.current && strokes) render(canvasRef.current, strokes, SCALE);
  }, [strokes, render]);

  const download = useCallback(() => {
    if (!strokes) return;
    // Rendered fresh at 4x rather than scaling the preview — strokes are
    // vectors, so there is no reason to hand over a blurry copy.
    const off = document.createElement("canvas");
    render(off, strokes, 4);
    const url = off.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `prabalos-drawing-${drawing?.id ?? "note"}.png`;
    a.click();
  }, [strokes, render, drawing]);

  const remove = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/prabalos/admin/drawing", {
        method: "DELETE",
        headers: { [CSRF_HEADER]: "1" },
      });
      setStrokes(null);
      onFlash("Drawing cleared");
      onChanged();
    } finally {
      setBusy(false);
    }
  }, [onChanged, onFlash]);

  if (!drawing) {
    return (
      <p className="mono text-[11px] leading-relaxed text-mute">
        Nothing drawn yet. On the device: DRAW, scribble with the stylus, SEND. Only the most
        recent one is kept — download the ones worth keeping.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.16em] text-mute">
          {new Date(drawing.ts * 1000).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
        {!drawing.seen && (
          <span className="mono text-[9px] uppercase tracking-[0.14em] text-violet-300">new</span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded-none border border-line"
        style={{ imageRendering: "auto", aspectRatio: `${W} / ${H}` }}
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={download}
          disabled={!strokes}
          className="mono border border-accent px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent/10 disabled:border-line disabled:text-mute"
        >
          Download PNG
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="mono border border-line px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-mute transition-colors hover:border-fault hover:text-fault disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
