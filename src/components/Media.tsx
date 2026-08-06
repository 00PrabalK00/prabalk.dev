"use client";

import { profile } from "@/lib/data";
import { Reveal, Section } from "@/components/ui";
import MediaSlot from "@/components/MediaSlot";

export default function Media() {
  return (
    <Section
      id="media"
      index="08 / FIELD"
      title="From the field"
      kicker="Robots on real floors, sealed hulls in real water, boards on real benches."
    >
      {/* asymmetric editorial layout, not an even grid */}
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <MediaSlot file="mira-auv.jpg" aspect="aspect-[16/10]" />
          <MediaSlot file="mira-electronics.jpg" aspect="aspect-[16/10]" />
        </div>

        <MediaSlot file="mira-norway.jpg" aspect="aspect-[21/9]" />

        <div className="grid gap-4 sm:grid-cols-3">
          <MediaSlot file="kurat-robot.jpg" aspect="aspect-[3/4]" />
          <MediaSlot file="vtol-uav.jpg" aspect="aspect-[3/4]" />
          <MediaSlot file="transformation-drone.jpg" aspect="aspect-[3/4]" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
          <MediaSlot file="pcb-animatronic.jpg" aspect="aspect-square" />
          <MediaSlot file="pcb-rccar.jpg" aspect="aspect-square" />
          <MediaSlot file="workshop-kicad.jpg" aspect="aspect-square" />
        </div>
      </div>

      {/* channel */}
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
