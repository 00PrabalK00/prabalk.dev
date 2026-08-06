"use client";

import { useMemo, useState } from "react";
import { mediaSlots, profile, SHIPPED_MEDIA, type MediaSlot } from "@/lib/data";
import { Reveal, Section } from "@/components/ui";
import MediaSlotView from "@/components/MediaSlot";

/** Grid footprint per span, at the sm breakpoint and up. */
const SPAN_CLASS: Record<NonNullable<MediaSlot["span"]> | "default", string> = {
  hero: "sm:col-span-2 lg:col-span-3",
  wide: "sm:col-span-2",
  tall: "row-span-2",
  normal: "",
  default: "",
};

const ASPECT: Record<NonNullable<MediaSlot["span"]> | "default", string> = {
  hero: "aspect-[16/9]",
  wide: "aspect-[16/10]",
  tall: "aspect-[3/4]",
  normal: "aspect-[4/3]",
  default: "aspect-[4/3]",
};

export default function Media() {
  const groups = useMemo(
    () => [...new Set(mediaSlots.map((m) => m.group))],
    []
  );
  const [group, setGroup] = useState<string>("All");
  const [showEmpty, setShowEmpty] = useState(false);

  const shown = useMemo(() => {
    const byGroup =
      group === "All" ? mediaSlots : mediaSlots.filter((m) => m.group === group);
    return showEmpty ? byGroup : byGroup.filter((m) => SHIPPED_MEDIA.has(m.file));
  }, [group, showEmpty]);

  const shippedCount = (g: string) =>
    mediaSlots.filter(
      (m) => (g === "All" || m.group === g) && SHIPPED_MEDIA.has(m.file)
    ).length;

  return (
    <Section
      id="media"
      index="08 / FIELD"
      title="From the field"
      kicker="Robots on real floors, sealed hulls in real water, boards on real benches."
    >
      <Reveal>
        <div className="mono mb-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-[11px] tracking-[0.14em] uppercase">
          {["All", ...groups].map((g) => {
            const n = shippedCount(g);
            const on = group === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`transition-colors ${
                  on ? "text-accent" : "text-mute hover:text-bone"
                } ${n === 0 && !showEmpty ? "opacity-40" : ""}`}
              >
                {g}
                <sup className="ml-1 text-[9px] opacity-60">{n}</sup>
                {on && <span className="mt-1.5 block h-px bg-accent" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowEmpty((v) => !v)}
            className="ml-auto text-mute/60 transition-colors hover:text-accent"
            title="Show the slots that are still waiting on a file"
          >
            {showEmpty ? "hide empty slots" : "show empty slots"}
          </button>
        </div>
      </Reveal>

      <div className="grid auto-rows-min grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {shown.map((m, i) => {
          const span = m.span ?? "default";
          return (
            <div key={m.file} className={SPAN_CLASS[span]}>
              <MediaSlotView file={m.file} index={i} aspect={ASPECT[span]} />
            </div>
          );
        })}
      </div>

      {shown.length === 0 && (
        <p className="mono py-10 text-[12px] text-mute">
          Nothing here yet — drop files into /public/media.
        </p>
      )}

      <Reveal delay={80}>
        <a
          href={profile.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-14 flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-line/60 pt-8"
        >
          <span className="text-2xl tracking-[-0.025em] text-bone transition-colors group-hover:text-accent sm:text-3xl">
            Build footage on YouTube
          </span>
          <span className="mono text-[11px] text-mute">
            {profile.youtube.replace("https://www.", "")}
          </span>
          <span className="mono ml-auto text-[11px] tracking-[0.14em] uppercase text-accent transition-transform group-hover:translate-x-1">
            Watch ↗
          </span>
        </a>
      </Reveal>
    </Section>
  );
}
