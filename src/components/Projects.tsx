"use client";

import { useMemo, useState } from "react";
import { benchProjects, projects } from "@/lib/data";
import { Reveal, Section } from "@/components/ui";

const FILTERS = ["All", "Robotics", "Perception & AI", "Tooling"] as const;
type Filter = (typeof FILTERS)[number];

const BUCKET: Record<string, Filter> = {
  Kurat: "Robotics",
  "Project MIRA": "Robotics",
  "Autonomous VTOL UAV": "Robotics",
  RosScope: "Tooling",
  next_EKF: "Robotics",
  next_HI: "Robotics",
  RobotDrawing: "Perception & AI",
  "Recalibration-Free Stereo PTU": "Perception & AI",
  OpenDroneKit: "Perception & AI",
  Continuum: "Tooling",
  "Continuum Extension": "Tooling",
  "InfrenceX CLI": "Tooling",
  "Botopsy Lab": "Tooling",
  FlowPilot: "Tooling",
  ContractEncrypt: "Perception & AI",
};

export default function Projects() {
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      filter === "All"
        ? projects
        : projects.filter((p) => BUCKET[p.name] === filter),
    [filter]
  );

  return (
    <Section
      id="projects"
      index="04 / WORK"
      title="Things I built"
      kicker="Underwater vehicles, drones, arms, AMRs, and the tooling that made them debuggable. Open any entry for the engineering detail."
    >
      {/* filters as plain text */}
      <Reveal>
        <div className="mono flex flex-wrap gap-x-8 gap-y-3 text-[11px] tracking-[0.14em] uppercase">
          {FILTERS.map((f) => {
            const n =
              f === "All"
                ? projects.length
                : projects.filter((p) => BUCKET[p.name] === f).length;
            const on = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`transition-colors ${
                  on ? "text-accent" : "text-mute hover:text-bone"
                }`}
              >
                {f}
                <sup className="ml-1 text-[9px] opacity-50">{n}</sup>
                {on && <span className="mt-1.5 block h-px bg-accent" />}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* the index */}
      <ul className="mt-14">
        {shown.map((p, i) => {
          const isOpen = open === p.name;
          return (
            <Reveal key={p.name} delay={Math.min(i, 6) * 45}>
              <li className="border-t border-line/60 last:border-b">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : p.name)}
                  aria-expanded={isOpen}
                  className="group grid w-full items-baseline gap-x-10 gap-y-2 py-8 text-left sm:grid-cols-[minmax(0,1fr)_130px_28px]"
                >
                  <div className="min-w-0">
                    <h3
                      className="text-[1.9rem] leading-none font-semibold tracking-[-0.035em] transition-colors sm:text-[2.4rem]"
                      style={{ color: isOpen ? p.accent : undefined }}
                    >
                      <span className={isOpen ? "" : "text-bone group-hover:text-accent"}>
                        {p.name}
                      </span>
                    </h3>
                    <p
                      className="mono mt-2.5 text-[11px] tracking-[0.12em] uppercase"
                      style={{ color: p.accent }}
                    >
                      {p.kind}
                    </p>
                  </div>

                  <span className="mono text-[11px] tracking-[0.1em] text-mute/60">
                    {p.year}
                  </span>

                  <span
                    className="mono hidden text-right text-[13px] text-mute transition-transform duration-300 sm:block"
                    style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                  >
                    +
                  </span>
                </button>

                <div
                  className="grid overflow-hidden transition-[grid-template-rows] duration-600 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="min-h-0">
                    <div className="grid gap-x-16 gap-y-8 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div>
                        <p className="max-w-[50ch] text-[17px] leading-[1.6] text-bone/85">
                          {p.blurb}
                        </p>
                        <p className="mono mt-8 max-w-[46ch] text-[11px] leading-relaxed tracking-[0.05em] text-mute/70">
                          {p.tech.map((t, ti) => (
                            <span key={t}>
                              {ti > 0 && <span className="text-line-2"> / </span>}
                              {t}
                            </span>
                          ))}
                        </p>
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mono mt-6 inline-block text-[11px] tracking-[0.14em] uppercase transition-opacity hover:opacity-70"
                            style={{ color: p.accent }}
                          >
                            {p.linkLabel ?? "Link"} ↗
                          </a>
                        )}
                      </div>

                      <ul className="space-y-5">
                        {p.bullets.map((b) => (
                          <li key={b} className="flex gap-5">
                            <span
                              className="mt-[10px] h-px w-5 shrink-0"
                              style={{ background: p.accent }}
                            />
                            <span className="max-w-[56ch] text-[14.5px] leading-[1.7] text-mute">
                              {b}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            </Reveal>
          );
        })}
      </ul>

      {/* bench */}
      <Reveal>
        <div className="mono mt-20 mb-8 text-[10px] tracking-[0.2em] uppercase text-mute">
          Also on the bench
        </div>
      </Reveal>
      <ul>
        {benchProjects.map((b, i) => (
          <Reveal key={b.name} delay={i * 50}>
            <li className="border-t border-line/50 last:border-b">
              <a
                href={b.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid gap-x-10 gap-y-2 py-5 sm:grid-cols-[230px_minmax(0,1fr)]"
              >
                <div>
                  <div className="mono text-[13px] text-bone transition-colors group-hover:text-accent">
                    {b.name}
                  </div>
                  <div className="mono mt-1 text-[10px] text-mute/50">
                    {b.tech}
                  </div>
                </div>
                <p className="max-w-[58ch] text-[14px] leading-relaxed text-mute">
                  {b.desc}
                </p>
              </a>
            </li>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
