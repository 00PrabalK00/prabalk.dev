"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Reveal — IntersectionObserver fade-up, respects reduced motion      */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as "div";
  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      className={`reveal ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}

/* ------------------------------------------------------------------ */
/* Counter — counts up once, on first view                             */
/* ------------------------------------------------------------------ */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 1400,
  decimals = 0,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.unobserve(el);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setDisplay(value);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          setDisplay(value * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  const shown =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString("en-US");

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Section shell — editorial: sticky index rail + wide measure          */
/* ------------------------------------------------------------------ */
export function Section({
  id,
  index,
  title,
  kicker,
  children,
  className = "",
}: {
  id: string;
  index: string;
  title: string;
  kicker?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-full max-w-[1440px] scroll-mt-28 px-5 py-24 sm:px-8 md:px-12 md:py-32 ${className}`}
    >
      <div className="hairline mb-14" />

      <div className="grid gap-y-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-x-16 xl:gap-x-24">
        <Reveal>
          <div className="mono top-28 text-[11px] leading-relaxed tracking-[0.2em] text-accent lg:sticky">
            {index.split(" / ").map((part, i) => (
              <div key={part} className={i ? "text-mute" : ""}>
                {part}
              </div>
            ))}
          </div>
        </Reveal>

        <div>
          <Reveal>
            <h2 className="text-[2.6rem] leading-[0.94] font-semibold tracking-[-0.04em] text-bone sm:text-6xl md:text-7xl">
              {title}
            </h2>
            {kicker && (
              <p className="mt-8 max-w-[46ch] text-lg leading-[1.65] text-mute sm:text-xl">
                {kicker}
              </p>
            )}
          </Reveal>
          <div className="mt-16 md:mt-20">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stat — number over caption, no container                            */
/* ------------------------------------------------------------------ */
export function Stat({
  value,
  prefix,
  suffix,
  label,
  sub,
  size = "lg",
  accent = "var(--color-accent)",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sub?: string;
  size?: "lg" | "md";
  accent?: string;
}) {
  return (
    <div>
      <div
        className={`font-semibold tracking-[-0.045em] tabular-nums ${
          size === "lg"
            ? "text-5xl sm:text-6xl md:text-[4.5rem]"
            : "text-3xl sm:text-4xl"
        }`}
        style={{ color: accent }}
      >
        <Counter value={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="mt-3 text-[13.5px] leading-snug text-bone">{label}</div>
      {sub && (
        <div className="mono mt-1 text-[10px] tracking-[0.14em] uppercase text-mute">
          {sub}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline label — replaces bordered chips                              */
/* ------------------------------------------------------------------ */
export function Chip({
  children,
  color,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className="mono text-[11px] tracking-[0.08em] text-mute"
      style={{ color }}
    >
      {children}
    </span>
  );
}

/** Slash-separated inline tech list. */
export function TechList({
  items,
  color,
}: {
  items: string[];
  color?: string;
}) {
  return (
    <p className="mono text-[11px] leading-relaxed tracking-[0.06em] text-mute">
      {items.map((t, i) => (
        <span key={t}>
          {i > 0 && <span style={{ color: color ?? "#34383f" }}> / </span>}
          {t}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Typewriter role cycler                                              */
/* ------------------------------------------------------------------ */
export function RoleCycler({ roles }: { roles: string[] }) {
  const [text, setText] = useState(roles[0] ?? "");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      const wait = (ms: number) =>
        new Promise<void>((r) => {
          timer = setTimeout(r, ms);
        });
      const next = roles[(idx + 1) % roles.length];
      const current = roles[idx];
      for (let i = current.length; i >= 0; i--) {
        if (cancelled) return;
        setText(current.slice(0, i));
        await wait(22);
      }
      for (let i = 0; i <= next.length; i++) {
        if (cancelled) return;
        setText(next.slice(0, i));
        await wait(38);
      }
      await wait(2200);
      if (!cancelled) setIdx((v) => (v + 1) % roles.length);
    };

    timer = setTimeout(run, 2200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [idx, roles]);

  return (
    <span className="mono text-accent">
      {text}
      <span className="blink">_</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Live clock — proves the page is alive                               */
/* ------------------------------------------------------------------ */
export function LiveClock({ tz, label }: { tz: string; label: string }) {
  const [time, setTime] = useState<string>("--:--:--");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tz]);

  return (
    <span className="mono text-[11px] text-mute">
      {label} <span className="text-bone">{time}</span>
    </span>
  );
}
