"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { cinema, deriveFades, window01 } from "@/lib/scroll";
import { ACT1_END, OUTRO, STATIONS } from "@/lib/cinema";
import { profile } from "@/lib/data";
import ThemeToggle from "@/components/ThemeToggle";

const CinemaScene = dynamic(() => import("@/components/three/CinemaScene"), {
  ssr: false,
  loading: () => null,
});

/* ------------------------------------------------------------------ */
/* Beats — each owns a slice of the scroll                             */
/* ------------------------------------------------------------------ */
type Beat = {
  from: number;
  to: number;
  align: "left" | "center" | "right";
  kicker?: string;
  title?: string;
  big?: string;
  body?: string;
  metric?: { value: string; label: string };
  facts?: string[];
  accent?: string;
  link?: string;
};

/** Act I beats, in act-local time — rescaled to absolute below. */
const ACT1_BEATS: Beat[] = [
  {
    from: 0.0,
    to: 0.1,
    align: "left",
    kicker: "Robotics Software Engineer · Brooklyn, NY",
    big: "PRABAL\nKHARE",
    body: "I build the whole robot. Sensors, comms, localization, navigation, controls, operator tooling — and the deployment that proves it works.",
  },
  {
    from: 0.13,
    to: 0.23,
    align: "right",
    kicker: "Perception",
    title: "It sees before it moves.",
    body: "A 2D LiDAR scan at the front of the chassis. Reflective-marker clustering isolates two- and four-legged shelf signatures out of the return.",
  },
  {
    from: 0.26,
    to: 0.36,
    align: "left",
    kicker: "Localization",
    title: "PGV over RS-485.",
    body: "Floor tags stream into a ROS 2 localization source backed by a tag map, with wheel-odometry fallback and safety conditions when tag confidence drops.",
  },
  {
    from: 0.39,
    to: 0.49,
    align: "right",
    kicker: "Navigation",
    metric: { value: "3 cm", label: "point-to-point mismatch, down from 5" },
    body: "Nav2 path following with zone management and sector safety gating. 150 point-to-point runs on a live factory floor.",
  },
  {
    from: 0.52,
    to: 0.62,
    align: "left",
    kicker: "Docking",
    title: "Center check. Reposition. Or abort.",
    body: "The pose is validated before the lift moves. If it fails, it retries — and if it fails again, it aborts safely instead of guessing.",
  },
  {
    from: 0.65,
    to: 0.75,
    align: "center",
    kicker: "Result",
    metric: { value: "97%", label: "docking success · 2 cm mean error · 150 trials" },
  },
  {
    from: 0.78,
    to: 0.88,
    align: "left",
    kicker: "SMR300",
    title: "300 kg. Built to be reused.",
    body: "I replaced the company's ROS 1 architecture with a ROS 2 Humble stack designed for a fleet, not a prototype — CANopen and CiA 402 drives, ros2_control, an AI camera, and an operator platform for engineers who don't write code.",
  },
  {
    from: 0.9,
    to: 0.99,
    align: "center",
    kicker: "Keep going",
    title: "That's one robot.",
    body: "There are five more ahead.",
  },
];

/** Act I (rescaled) + one beat per station + the patent and handoff beats. */
const BEATS: Beat[] = [
  ...ACT1_BEATS.map((b) => ({
    ...b,
    from: b.from * ACT1_END,
    to: b.to * ACT1_END,
  })),
  ...STATIONS.map(
    (s): Beat => ({
      from: s.from,
      to: s.to,
      align: s.align,
      kicker: s.kicker,
      title: s.title,
      body: s.body,
      facts: s.facts,
      accent: s.color,
      link: s.link,
    })
  ),
  {
    from: OUTRO.patents.from,
    to: OUTRO.patents.to,
    align: "center",
    kicker: "Intellectual property",
    title: "Four filings.",
    body: "Hybrid aerial-ground robotics, portable thermoregulation, IMU calibration and sensor fusion, and a smart elevator system.",
    facts: [
      "Transformation Drone — autonomous drone-rover · 202641035669",
      "Thermoregulation System for Portable Water Containers · pending",
      "IMU Calibration and Sensor Fusion Module · pending",
      "Smart Elevator System and Method Thereof · 202441007367",
    ],
    accent: "#4da6ff",
  },
  {
    from: OUTRO.handoff.from,
    to: 1.0,
    align: "center",
    kicker: "Keep scrolling",
    title: "The full record is below.",
    body: "Live GitHub activity, every repository, the deep dive on the SMR300 stack, and how to reach me.",
  },
];

/** Ramps sized from the real gaps — no two beats are ever legible at once. */
const FADES = deriveFades(BEATS);

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */
const STAGE_VH = 3400; // total scroll length of the cinematic, in vh

export default function Cinema() {
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Weighted smooth scroll. Without this the camera move feels like a
    // slideshow rather than one continuous take.
    const lenis = reduced
      ? null
      : new Lenis({ duration: 1.15, wheelMultiplier: 0.9, touchMultiplier: 1.4 });

    // Route programmatic jumps through Lenis so they share the same easing.
    if (lenis) cinema.scrollTo = (px) => lenis.scrollTo(px, { duration: 1.6 });

    let raf = 0;
    const frame = (time: number) => {
      lenis?.raf(time);

      const stage = stageRef.current;
      if (stage) {
        const rect = stage.getBoundingClientRect();
        const total = stage.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        cinema.progress = p;

        // fade the whole 3D stage out as the DOM content takes over
        if (overlayRef.current) {
          overlayRef.current.style.opacity = String(
            p > 0.985 ? Math.max(0, 1 - (p - 0.985) / 0.015) : 1
          );
        }

        // drive each beat's opacity directly — no React re-render per frame
        BEATS.forEach((b, i) => {
          const el = beatRefs.current[i];
          if (!el) return;
          const f = FADES[i];
          const o = reduced ? 1 : window01(p, b.from, b.to, f.in, f.out);
          el.style.opacity = String(o);
          el.style.transform = reduced
            ? "none"
            : `translate3d(0, ${(1 - o) * 26}px, 0)`;
          el.style.pointerEvents = o > 0.5 ? "auto" : "none";
        });
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      id="top"
      className="relative"
      style={{ height: `${STAGE_VH}vh` }}
    >
      {/* pinned viewport */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div ref={overlayRef} className="absolute inset-0">
          <div className="absolute inset-0">
            <CinemaScene />
          </div>

          {/* film grain + vignette */}
          <div className="scanlines pointer-events-none absolute inset-0" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 85% 70% at 50% 50%, transparent 40%, rgba(5,5,6,0.75) 100%)",
            }}
          />

          {/* beats */}
          {BEATS.map((b, i) => (
            <div
              key={`beat-${i}`}
              ref={(el) => {
                beatRefs.current[i] = el;
              }}
              className="absolute inset-0 flex items-center px-6 sm:px-12 lg:px-20"
              style={{
                opacity: 0,
                justifyContent:
                  b.align === "left"
                    ? "flex-start"
                    : b.align === "right"
                      ? "flex-end"
                      : "center",
              }}
            >
              {/* Readability scrim. The 3D behind the copy is bright and busy
                  (grid lines, racking, floor), so body text needs the stage
                  darkened under it. A gradient rather than a panel keeps it
                  invisible as a shape. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    b.align === "left"
                      ? "linear-gradient(to right, var(--c-ink) 0%, color-mix(in srgb, var(--c-ink) 82%, transparent) 34%, color-mix(in srgb, var(--c-ink) 40%, transparent) 58%, transparent 78%)"
                      : b.align === "right"
                        ? "linear-gradient(to left, var(--c-ink) 0%, color-mix(in srgb, var(--c-ink) 82%, transparent) 34%, color-mix(in srgb, var(--c-ink) 40%, transparent) 58%, transparent 78%)"
                        : "radial-gradient(ellipse 62% 58% at 50% 50%, color-mix(in srgb, var(--c-ink) 88%, transparent) 0%, color-mix(in srgb, var(--c-ink) 60%, transparent) 45%, transparent 80%)",
                }}
              />

              <div
                className={`relative max-w-[38rem] ${
                  b.align === "center" ? "text-center" : ""
                }`}
              >
                {b.kicker && (
                  <p
                    className="mono mb-6 text-[11px] leading-relaxed tracking-[0.24em] uppercase"
                    style={{ color: b.accent ?? "var(--color-accent)" }}
                  >
                    {b.kicker}
                  </p>
                )}

                {b.big && (
                  <h1 className="text-[16vw] leading-[0.84] font-semibold tracking-[-0.05em] whitespace-pre-line text-bone sm:text-[10vw] lg:text-[8.5rem]">
                    {b.big}
                  </h1>
                )}

                {b.metric && (
                  <div>
                    <div className="text-[20vw] leading-[0.82] font-semibold tracking-[-0.06em] tabular-nums text-accent sm:text-[13vw] lg:text-[11rem]">
                      {b.metric.value}
                    </div>
                    <div className="mono mt-5 text-[12px] tracking-[0.16em] uppercase text-bone/80">
                      {b.metric.label}
                    </div>
                  </div>
                )}

                {b.title && (
                  <h2 className="text-[2.4rem] leading-[1.02] font-semibold tracking-[-0.04em] text-bone sm:text-6xl">
                    {b.title}
                  </h2>
                )}

                {b.body && (
                  <p
                    className={`mt-7 text-[16px] leading-[1.7] text-bone/85 sm:text-lg ${
                      b.align === "center" ? "mx-auto max-w-[46ch]" : "max-w-[44ch]"
                    }`}
                  >
                    {b.body}
                  </p>
                )}

                {b.facts && (
                  <ul
                    className={`mt-8 space-y-3 ${
                      b.align === "center" ? "mx-auto max-w-[52ch] text-left" : "max-w-[44ch]"
                    }`}
                  >
                    {b.facts.map((f) => (
                      <li key={f} className="flex gap-4">
                        <span
                          className="mt-[9px] h-px w-5 shrink-0"
                          style={{ background: b.accent ?? "var(--color-accent)" }}
                        />
                        <span className="text-[14px] leading-[1.65] text-bone/75">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}

          {/* flight manifest — where you are in the route */}
          <StationIndex />

          {/* persistent chrome */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-7 sm:px-12">
            <span className="mono text-[10px] tracking-[0.22em] uppercase text-mute/60">
              Scroll
            </span>
            <div className="pointer-events-auto flex items-center gap-6">
              {[
                { label: "GitHub", href: profile.github },
                { label: "LinkedIn", href: profile.linkedin },
                { label: "Résumé", href: profile.resumeDrive },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-[10px] tracking-[0.16em] uppercase text-mute transition-colors hover:text-accent"
                >
                  {l.label}
                </a>
              ))}
              <ThemeToggle />
            </div>
          </div>

          {/* progress hairline */}
          <ProgressBar />
        </div>
      </div>
    </div>
  );
}

/**
 * A vertical manifest of the flight. Ticks light as the camera reaches each
 * station; clicking one scrolls straight to it.
 */
function StationIndex() {
  const wrap = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  const legs = [
    { id: "smr300", label: "SMR300", from: 0, to: ACT1_END, color: "#4da6ff" },
    ...STATIONS.map((s) => ({
      id: s.id,
      label: s.kicker.split(" · ")[0],
      from: s.from,
      to: s.to,
      color: s.color,
    })),
    {
      id: "patents",
      label: "Patents",
      from: OUTRO.patents.from,
      to: OUTRO.patents.to,
      color: "#4da6ff",
    },
  ];

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = cinema.progress;
      legs.forEach((leg, i) => {
        const el = items.current[i];
        if (!el) return;
        const on = p >= leg.from - 0.05 && p <= leg.to + 0.03;
        el.style.color = on ? leg.color : "";
        el.style.opacity = on ? "1" : "0.32";
        const bar = el.lastElementChild as HTMLElement | null;
        if (bar) bar.style.width = on ? "22px" : "9px";
      });
      if (wrap.current) {
        wrap.current.style.opacity = p > 0.985 ? "0" : "1";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // legs is derived from module-level constants and never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jump = (at: number) => {
    const stage = document.getElementById("top");
    if (!stage) return;
    const top = stage.getBoundingClientRect().top + window.scrollY;
    const total = stage.offsetHeight - window.innerHeight;
    cinema.scrollTo(top + total * at);
  };

  return (
    <div
      ref={wrap}
      className="absolute top-1/2 right-6 hidden -translate-y-1/2 flex-col gap-3.5 transition-opacity duration-500 lg:flex"
    >
      {legs.map((leg, i) => (
        <button
          key={leg.id}
          type="button"
          onClick={() => jump(leg.from + 0.012)}
          ref={(el) => {
            items.current[i] = el;
          }}
          className="mono group flex items-center justify-end gap-3 text-[9.5px] tracking-[0.16em] uppercase text-mute transition-opacity"
          style={{ opacity: 0.32 }}
        >
          <span className="whitespace-nowrap">{leg.label}</span>
          <span
            className="h-px bg-current transition-all duration-300"
            style={{ width: 9 }}
          />
        </button>
      ))}
    </div>
  );
}

function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) {
        ref.current.style.transform = `scaleX(${cinema.progress})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line/40">
      <div ref={ref} className="h-full origin-left bg-accent" />
    </div>
  );
}
