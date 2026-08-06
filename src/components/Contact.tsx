"use client";

import { profile } from "@/lib/data";
import { LiveClock, Reveal } from "@/components/ui";

const MARQUEE = [
  "ROS 2",
  "Nav2",
  "CANopen",
  "CiA 402",
  "PGV",
  "LiDAR",
  "EKF",
  "C++17",
  "SLAM",
  "Jetson",
  "MAVROS",
  "KiCad",
  "YOLOv8",
  "ORB-SLAM3",
  "ros2_control",
  "Qt6",
  "Docker",
];

export default function Contact() {
  const links = [
    { label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    { label: "GitHub", value: `@${profile.githubUser}`, href: profile.github },
    { label: "LinkedIn", value: "in/prabalk", href: profile.linkedin },
    { label: "YouTube", value: "@evtol459", href: profile.youtube },
    { label: "Botopsy Lab", value: "botopsylab.com", href: profile.botopsy },
    {
      label: "Résumé",
      value: "Download PDF",
      href: profile.resume,
      download: profile.resumeFileName,
    },
  ];

  return (
    <footer id="contact" className="relative scroll-mt-28">
      <div className="overflow-hidden py-5">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="mono text-[11px] tracking-[0.22em] uppercase text-mute/35"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 pb-16 sm:px-10">
        <div className="hairline mb-20" />

        <Reveal>
          <p className="mono mb-8 text-[11px] tracking-[0.22em] uppercase text-accent">
            Open to robotics software &amp; autonomy roles
          </p>
          <h2 className="max-w-5xl text-[3rem] leading-[0.9] font-semibold tracking-[-0.045em] text-bone sm:text-[5.5rem] lg:text-[7rem]">
            Let&apos;s build
            <br />
            something that
            <br />
            <span className="text-glow">actually ships.</span>
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <ul className="mt-20">
            {links.map((l) => (
              <li key={l.label} className="border-t border-line/60 last:border-b">
                <a
                  href={l.href}
                  download={l.download}
                  target={l.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="group grid items-baseline gap-x-10 gap-y-1 py-6 sm:grid-cols-[180px_minmax(0,1fr)_28px]"
                >
                  <span className="mono text-[10px] tracking-[0.2em] uppercase text-mute">
                    {l.label}
                  </span>
                  <span className="mono truncate text-[15px] text-bone transition-colors group-hover:text-accent sm:text-[17px]">
                    {l.value}
                  </span>
                  <span className="mono hidden text-right text-mute transition-all group-hover:translate-x-1 group-hover:text-accent sm:block">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mono mt-20 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[11px] text-mute/60">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
            <span>© {new Date().getFullYear()} Prabal Khare</span>
            <LiveClock tz="America/New_York" label="Brooklyn" />
            <LiveClock tz="Asia/Bangkok" label="Bangkok" />
          </div>
          <a
            href="#top"
            className="tracking-[0.16em] uppercase transition-colors hover:text-accent"
          >
            ↑ Top
          </a>
        </div>
      </div>
    </footer>
  );
}
