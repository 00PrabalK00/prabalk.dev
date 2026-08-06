"use client";

import { useState } from "react";
import { smr300 } from "@/lib/data";
import { Reveal, Section, Stat } from "@/components/ui";
import MediaSlot from "@/components/MediaSlot";

export default function Smr300Section() {
  const [openLayer, setOpenLayer] = useState<number | null>(0);

  return (
    <Section
      id="smr300"
      index="01 / FLAGSHIP"
      title="SMR300"
      kicker={smr300.blurb}
    >
      {/* metrics — numbers in open space */}
      <div className="grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-4">
        {smr300.metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 90}>
            <Stat
              value={m.value}
              suffix={m.suffix}
              label={m.label}
              sub={m.sub}
            />
          </Reveal>
        ))}
      </div>

      <div className="hairline my-20" />

      {/* engineering notes — long-form */}
      <div className="grid gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-16">
        <div className="space-y-12">
          {smr300.highlights.map((h, i) => (
            <Reveal key={h.title} delay={i * 70}>
              <article>
                <h3 className="text-xl leading-snug font-medium tracking-[-0.02em] text-bone sm:text-2xl">
                  {h.title}
                </h3>
                <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.7] text-mute">
                  {h.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* stack — accordion without chrome */}
        <Reveal delay={80}>
          <div className="lg:pt-2">
            <div className="mono mb-8 text-[10px] tracking-[0.2em] uppercase text-mute">
              Software stack · top to metal
            </div>

            <ul>
              {smr300.stack.map((layer, i) => {
                const open = openLayer === i;
                return (
                  <li key={layer.layer} className="border-t border-line/60 last:border-b">
                    <button
                      type="button"
                      onClick={() => setOpenLayer(open ? null : i)}
                      aria-expanded={open}
                      className="group flex w-full items-baseline gap-5 py-5 text-left"
                    >
                      <span
                        className="mono w-6 shrink-0 text-[10px] tracking-[0.14em]"
                        style={{ color: layer.color }}
                      >
                        L{4 - i}
                      </span>
                      <span
                        className={`flex-1 text-[17px] tracking-[-0.01em] transition-colors ${
                          open ? "text-bone" : "text-mute group-hover:text-bone"
                        }`}
                      >
                        {layer.layer}
                      </span>
                      <span
                        className="mono text-[11px] text-mute transition-transform duration-300"
                        style={{ transform: open ? "rotate(45deg)" : "none" }}
                      >
                        +
                      </span>
                    </button>

                    <div
                      className="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out"
                      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                    >
                      <div className="min-h-0">
                        <ul className="columns-1 gap-x-8 pb-6 pl-11 sm:columns-2">
                          {layer.items.map((it) => (
                            <li
                              key={it}
                              className="mono mb-2 text-[12.5px] leading-relaxed text-mute"
                            >
                              <span
                                className="mr-2"
                                style={{ color: layer.color }}
                              >
                                ·
                              </span>
                              {it}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mono mt-10 text-[11.5px] leading-loose text-mute">
              <span className="text-accent">$</span> ros2 action send_goal
              /dock_shelf smr300_msgs/action/DockShelf
              <br />
              <span className="text-pass">→ SUCCEEDED</span>{" "}
              <span className="text-mute/60">
                residual: x 0.014 m · y 0.011 m · yaw 0.9°
              </span>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="hairline my-20" />

      {/* four repos — editorial list */}
      <Reveal>
        <div className="mono mb-10 text-[10px] tracking-[0.2em] uppercase text-mute">
          Four repositories, one robot
        </div>
      </Reveal>

      <ul>
        {smr300.repos.map((r, i) => (
          <Reveal key={r.name} delay={i * 60}>
            <li className="border-t border-line/60 last:border-b">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid gap-x-10 gap-y-3 py-7 sm:grid-cols-[190px_minmax(0,1fr)]"
              >
                <div>
                  <div className="mono text-[14px] text-bone transition-colors group-hover:text-accent">
                    {r.name}
                  </div>
                  <div className="mono mt-1 text-[10px] tracking-[0.12em] uppercase text-mute/70">
                    {r.meta}
                  </div>
                </div>
                <p className="max-w-[58ch] text-[15px] leading-[1.7] text-mute">
                  {r.desc}
                  <span className="mono ml-2 inline-block text-mute/50 transition-all group-hover:translate-x-1 group-hover:text-accent">
                    ↗
                  </span>
                </p>
              </a>
            </li>
          </Reveal>
        ))}
      </ul>

      {/* media — asymmetric, full-bleed feel */}
      <div className="mt-20 space-y-3">
        <MediaSlot file="smr300-hero.jpg" aspect="aspect-[21/9]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <MediaSlot file="smr300-docking.jpg" aspect="aspect-[4/3]" />
          <MediaSlot file="smr300-rviz.jpg" aspect="aspect-[4/3]" />
          <MediaSlot file="smr300-operator-ui.jpg" aspect="aspect-[4/3]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
          <MediaSlot file="smr300-nodered.jpg" aspect="aspect-[4/3]" />
          <MediaSlot file="smr300-docking.mp4" aspect="aspect-[16/9]" />
        </div>
      </div>
    </Section>
  );
}
