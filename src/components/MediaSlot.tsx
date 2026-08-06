"use client";

import { useState } from "react";
import { mediaSlots } from "@/lib/data";

/**
 * Renders /public/media/<file> if it exists, otherwise a quiet labelled
 * placeholder naming the file to drop in. Nothing breaks when empty.
 */
export default function MediaSlot({
  file,
  aspect = "aspect-[4/3]",
}: {
  file: string;
  index?: number;
  aspect?: string;
}) {
  const [failed, setFailed] = useState(false);
  const meta = mediaSlots.find((m) => m.file === file);
  const isVideo = file.endsWith(".mp4") || file.endsWith(".webm");
  const src = `/media/${file}`;

  return (
    <figure className={`group relative overflow-hidden bg-ink-2 ${aspect}`}>
      {!failed &&
        (isVideo ? (
          <video
            src={src}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
          />
        ) : (
          // Plain <img>: user-dropped files of unknown dimensions, and
          // next/image would fail the build when a slot is empty.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={meta?.caption ?? file}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
            onError={() => setFailed(true)}
          />
        ))}

      {failed && (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="text-center">
            <div className="mono text-[10px] tracking-[0.2em] uppercase text-mute/40">
              {isVideo ? "video" : "image"}
            </div>
            <div className="mono mt-3 text-[11.5px] text-accent/60">
              /media/{file}
            </div>
            {meta?.caption && (
              <div className="mx-auto mt-2 max-w-[24ch] text-[12px] leading-snug text-mute/50">
                {meta.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {!failed && meta?.caption && (
        <figcaption className="touch-caption mono absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink to-transparent px-4 py-3 text-[10px] tracking-[0.14em] uppercase text-bone/80 transition-transform duration-500 group-hover:translate-y-0">
          {meta.caption}
        </figcaption>
      )}
    </figure>
  );
}
