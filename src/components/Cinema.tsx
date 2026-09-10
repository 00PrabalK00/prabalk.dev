"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { cinema, deriveFades, isSmallScreen, window01 } from "@/lib/scroll";
import { ACT1_END, OUTRO, STATIONS } from "@/lib/cinema";
import { profile } from "@/lib/data";
import { eggState, unlock, watchKonami } from "@/lib/eggs";

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
    title: "Three filings.",
    body: "A vehicle that drives and flies, a bottle that heats and cools its own contents, and an IMU module that stays honest under vibration.",
    facts: [
      "Transformation Drone — autonomous drone-rover · 202641035669",
      "Thermoregulation System for Portable Water Containers · pending",
      "IMU Calibration and Sensor Fusion Module · pending",
    ],
    accent: "#51e2f5",
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
// Desktop gets the full-length flight. On a phone the same progress is spread
// over far less pixel height, so the whole thing is shortened rather than
// asking someone to swipe through 34 screens.
const STAGE_VH = 3400;
const STAGE_VH_SM = 2100;

export default function Cinema() {
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hudRef = useRef<HTMLDivElement>(null);
  const secretRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /**
     * Stage travel, cached.
     *
     * offsetHeight forces the browser to flush pending layout before it can
     * answer. Reading it every frame, immediately before writing styles to
     * every beat, is the classic layout thrash — and the number only changes
     * when the viewport or the stage height does.
     */
    let travel = 0;
    const measure = () => {
      const stage = stageRef.current;
      travel = stage ? stage.offsetHeight - window.innerHeight : 0;
    };

    // Stage height is set here rather than in a media query so the rAF loop and
    // the DOM agree on exactly one number.
    const sizeStage = () => {
      if (stageRef.current) {
        stageRef.current.style.height = `${isSmallScreen() ? STAGE_VH_SM : STAGE_VH}svh`;
      }
      measure();
    };
    sizeStage();
    window.addEventListener("resize", sizeStage);

    // Weighted smooth scroll. Without this the camera move feels like a
    // slideshow rather than one continuous take.
    const lenis = reduced
      ? null
      : new Lenis({ duration: 1.15, wheelMultiplier: 0.9, touchMultiplier: 1.4 });

    // Route programmatic jumps through Lenis so they share the same easing.
    if (lenis) {
      cinema.scrollTo = (px) => lenis.scrollTo(px, { duration: 1.6 });
      cinema.setPageScroll = (enabled) => (enabled ? lenis.start() : lenis.stop());
    }

    // ↑↑↓↓←→←→BA — barrel roll and a rainbow scan
    const stopKonami = watchKonami(() => {
      eggState.unsafe = true;
      eggState.unsafeAt = performance.now();
      unlock("unsafe");
    });

    let raf = 0;
    let lastP = -1;
    let lastMoveAt = performance.now();
    let sawUnsafe = false;

    /**
     * Last value written to each element, so unchanged frames touch no DOM.
     *
     * Integer steps rather than the float itself: a Float32Array would round
     * each stored value to float32 and the comparison against a float64 `q`
     * would then fail for most values, writing every frame regardless and
     * quietly defeating the guard.
     */
    const OPACITY_STEPS = 500;
    const lastStep = new Int16Array(BEATS.length).fill(-1);

    const frame = (time: number) => {
      lenis?.raf(time);

      const stage = stageRef.current;
      if (stage) {
        // getBoundingClientRect is a read the scroll position genuinely
        // requires; offsetHeight is not, and is served from `travel`.
        const rect = stage.getBoundingClientRect();
        const total = travel;
        const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        cinema.progress = p;

        /* ---- unsafe mode: armed by keyboard OR by five taps on the robot,
               so the HUD is driven off the flag rather than the key handler ---- */
        if (eggState.unsafe && !sawUnsafe) {
          sawUnsafe = true;
          if (hudRef.current) {
            hudRef.current.textContent =
              "SAFETY GATING DISABLED · do not try this on a real 300 kg AMR";
            hudRef.current.style.opacity = "1";
            setTimeout(() => {
              if (hudRef.current && !eggState.idle)
                hudRef.current.style.opacity = "0";
            }, 5000);
          }
        }

        /* ---- easter eggs driven by scroll ---- */
        if (Math.abs(p - lastP) > 0.0004) {
          lastMoveAt = time;
          lastP = p;
          if (eggState.idle) {
            eggState.idle = false;
            if (hudRef.current) hudRef.current.style.opacity = "0";
          }
        } else if (
          !eggState.idle &&
          time - lastMoveAt > 45_000 &&
          p > 0.02 &&
          p < 0.95
        ) {
          // stopped mid-flight: the robot leaves the planned path
          eggState.idle = true;
          unlock("idle");
          if (hudRef.current) {
            hudRef.current.textContent =
              "OPERATOR IDLE · AUTONOMOUS ROAM ENGAGED";
            hudRef.current.style.opacity = "1";
          }
        }

        // the 3% marker — has to be found on purpose
        if (secretRef.current) {
          const near = Math.abs(p - 0.97) < 0.0022;
          secretRef.current.style.opacity = near ? "1" : "0";
          if (near) unlock("threepercent");
        }

        if (p > 0.995) unlock("flight");

        // fade the whole 3D stage out as the DOM content takes over
        if (overlayRef.current) {
          overlayRef.current.style.opacity = String(
            p > 0.985 ? Math.max(0, 1 - (p - 0.985) / 0.015) : 1
          );
        }

        // Drive each beat's opacity directly — no React re-render per frame.
        //
        // Guarded by the previous value, because assigning to el.style marks
        // the element dirty whether or not the value differs, and at any given
        // moment all but one or two of the ~18 beats are sitting at a flat 0.
        // Unguarded, this was ~54 style invalidations per frame to express a
        // change in two of them.
        for (let i = 0; i < BEATS.length; i++) {
          const el = beatRefs.current[i];
          if (!el) continue;
          const b = BEATS[i];
          const f = FADES[i];
          const o = reduced ? 1 : window01(p, b.from, b.to, f.in, f.out);
          // Quantised: sub-percent differences are invisible and still cost a
          // full style recalculation to apply.
          const step = Math.round(o * OPACITY_STEPS);
          if (step === lastStep[i]) continue;
          lastStep[i] = step;
          const q = step / OPACITY_STEPS;

          el.style.opacity = String(q);
          el.style.transform = reduced
            ? "none"
            : `translate3d(0, ${(1 - q) * 26}px, 0)`;
          // Promote only while it is actually on screen. Holding a layer for
          // every beat permanently costs memory for nothing; promoting none of
          // them repaints the text on every opacity step.
          el.style.willChange = q > 0 && q < 1 ? "opacity, transform" : "auto";
          el.style.visibility = q === 0 ? "hidden" : "visible";
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sizeStage);
      stopKonami();
      cinema.setPageScroll = () => {};
      lenis?.destroy();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      id="top"
      className="relative"
      style={{ height: `${STAGE_VH}svh` }}
    >
      {/* pinned viewport */}
      {/* bg-ink so any pixel the canvas doesn't cover is the same colour as
          the clear colour, rather than showing the page through */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        <div ref={overlayRef} className="absolute inset-0">
          <div className="absolute inset-0">
            <CinemaScene />
          </div>

          {/* film grain + vignette */}
          <div className="scanlines pointer-events-none absolute inset-0" />
          {/* Vignette in the stage's own colour — a black vignette over a
              light sweep reads as dirt on the lens. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 85% 70% at 50% 50%, transparent 40%, color-mix(in srgb, var(--c-ink) 82%, transparent) 100%)",
            }}
          />

          {/* beats */}
          {BEATS.map((b, i) => (
            <div
              key={`beat-${i}`}
              ref={(el) => {
                beatRefs.current[i] = el;
              }}
              className="absolute inset-0 flex items-center px-5 sm:px-12 lg:px-20"
              style={{
                opacity: 0,
                // Hidden rather than merely transparent: a fully-faded beat
                // still carried a full-viewport scrim gradient into the paint,
                // eighteen of them stacked over the canvas.
                visibility: "hidden",
                // Static. These sit over the canvas and would otherwise swallow
                // clicks meant for the robot — it was being re-asserted on every
                // frame, which is eighteen more style invalidations for a value
                // that never changes.
                pointerEvents: "none",
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
                      ? "linear-gradient(to right, color-mix(in srgb, var(--c-ink) var(--scrim-1), transparent) 0%, color-mix(in srgb, var(--c-ink) var(--scrim-2), transparent) 34%, color-mix(in srgb, var(--c-ink) var(--scrim-3), transparent) 58%, transparent 78%)"
                      : b.align === "right"
                        ? "linear-gradient(to left, color-mix(in srgb, var(--c-ink) var(--scrim-1), transparent) 0%, color-mix(in srgb, var(--c-ink) var(--scrim-2), transparent) 34%, color-mix(in srgb, var(--c-ink) var(--scrim-3), transparent) 58%, transparent 78%)"
                        : "radial-gradient(ellipse 62% 58% at 50% 50%, color-mix(in srgb, var(--c-ink) var(--scrim-1), transparent) 0%, color-mix(in srgb, var(--c-ink) var(--scrim-2), transparent) 45%, transparent 80%)",
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
                    style={{ color: `color-mix(in srgb, ${b.accent ?? "var(--c-accent)"}, black var(--accent-darken))` }}
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
                    <div className="text-[24vw] leading-[0.82] font-semibold tracking-[-0.06em] tabular-nums text-accent sm:text-[13vw] lg:text-[11rem]">
                      {b.metric.value}
                    </div>
                    <div className="mono mt-5 text-[12px] tracking-[0.16em] uppercase text-bone/80">
                      {b.metric.label}
                    </div>
                  </div>
                )}

                {b.title && (
                  <h2 className="text-[8.5vw] leading-[1.04] font-semibold tracking-[-0.04em] text-bone sm:text-[2.6rem] md:text-5xl lg:text-6xl">
                    {b.title}
                  </h2>
                )}

                {b.body && (
                  <p
                    className={`mt-5 text-[15px] leading-[1.65] text-bone/85 sm:mt-7 sm:text-[16px] md:text-lg ${
                      b.align === "center" ? "mx-auto max-w-[46ch]" : "max-w-[44ch]"
                    }`}
                  >
                    {b.body}
                  </p>
                )}

                {b.facts && (
                  <ul
                    className={`mt-6 hidden space-y-3 sm:mt-8 sm:block ${
                      b.align === "center" ? "mx-auto max-w-[52ch] text-left" : "max-w-[44ch]"
                    }`}
                  >
                    {b.facts.map((f) => (
                      <li key={f} className="flex gap-4">
                        <span
                          className="mt-[9px] h-px w-5 shrink-0"
                          style={{ background: `color-mix(in srgb, ${b.accent ?? "var(--c-accent)"}, black var(--accent-darken))` }}
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

          {/* egg HUD — konami / idle roam */}
          <div
            ref={hudRef}
            className="mono pointer-events-none absolute top-6 left-1/2 z-20 -translate-x-1/2 border border-fault/50 bg-fault/10 px-3 py-1.5 text-[10px] tracking-[0.16em] whitespace-nowrap text-fault uppercase opacity-0 transition-opacity duration-500"
          />

          {/* the 3% marker — only at exactly 97% of the flight */}
          <div
            ref={secretRef}
            className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center opacity-0 transition-opacity duration-300"
          >
            <p className="mono max-w-[34ch] text-center text-[12px] leading-relaxed text-accent">
              97%. the other 3% is why I logged 150 trials.
            </p>
          </div>

          {/* flight manifest — where you are in the route */}
          <StationIndex />

          {/* persistent chrome */}
          {/* min-w-0 + wrapping: this row used to force the page wider than a
              phone viewport, which is what produced the mismatched strip down
              the left edge. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-5 pb-6 sm:px-12 sm:pb-7">
            <span className="mono shrink-0 text-[10px] tracking-[0.22em] uppercase text-mute/60">
              Scroll
            </span>
            <div className="pointer-events-auto flex min-w-0 items-center gap-4 sm:gap-6">
              {[
                { label: "GitHub", href: profile.github, small: false },
                { label: "LinkedIn", href: profile.linkedin, small: false },
                { label: "Résumé", href: profile.resume, small: true },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mono text-[10px] tracking-[0.16em] uppercase text-mute transition-colors hover:text-accent ${
                    l.small ? "" : "hidden sm:inline"
                  }`}
                >
                  {l.label}
                </a>
              ))}
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
    { id: "smr300", label: "SMR300", from: 0, to: ACT1_END, color: "#51e2f5" },
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
      color: "#51e2f5",
    },
  ];

  useEffect(() => {
    let raf = 0;
    // Which legs were lit last frame, as a bitmask, and whether the rail was
    // faded. The lit set changes a handful of times across the whole flight;
    // without this the loop rewrote colour, opacity and a width on every tick
    // to say nothing had changed — and each width write fed a CSS transition
    // that then had to be re-evaluated.
    //
    // A mask rather than a single index because the leg ranges are padded and
    // do overlap, so two can legitimately be lit at once.
    let lastMask = -1;
    let lastFaded: boolean | null = null;

    const tick = () => {
      const p = cinema.progress;

      let mask = 0;
      for (let i = 0; i < legs.length; i++) {
        if (p >= legs[i].from - 0.05 && p <= legs[i].to + 0.03) mask |= 1 << i;
      }

      if (mask !== lastMask) {
        for (let i = 0; i < legs.length; i++) {
          const el = items.current[i];
          if (!el) continue;
          const lit = (mask & (1 << i)) !== 0;
          el.style.color = lit ? legs[i].color : "";
          el.style.opacity = lit ? "1" : "0.55";
          const bar = el.lastElementChild as HTMLElement | null;
          if (bar) bar.style.width = lit ? "22px" : "9px";
        }
        lastMask = mask;
      }

      const faded = p > 0.985;
      if (wrap.current && faded !== lastFaded) {
        wrap.current.style.opacity = faded ? "0" : "1";
        lastFaded = faded;
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
          style={{ opacity: 0.55 }}
        >
          <span className="whitespace-nowrap">{leg.label}</span>
          <span
            // width only, not `all` — `all` makes the browser watch every
            // animatable property on an element whose width is the one thing
            // that moves.
            className="h-px bg-current transition-[width] duration-300"
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
    // Quantised to the bar's own resolution. A 320-step scale is finer than a
    // hairline can show, and every distinct value costs a style recalculation.
    let last = -1;
    const tick = () => {
      const q = Math.round(cinema.progress * 320) / 320;
      if (ref.current && q !== last) {
        last = q;
        ref.current.style.transform = `scaleX(${q})`;
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
