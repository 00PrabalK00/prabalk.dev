"use client";

import { useEffect, useState } from "react";
import { applyTheme, resolveTheme, themeStore, type Theme } from "@/lib/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const sync = () => {
      const t = resolveTheme();
      themeStore.current = t;
      setTheme(t);
    };
    // read after mount so SSR markup and first client render agree
    const raf = requestAnimationFrame(sync);

    // follow the OS while the user hasn't made an explicit choice
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (!document.documentElement.hasAttribute("data-theme")) sync();
    };
    mq.addEventListener("change", onSystem);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onSystem);
    };
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`group relative grid h-9 w-9 shrink-0 place-items-center border border-line text-mute transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      {/* One icon that morphs: the moon is the sun with a bite taken out of
          it, via a mask circle that slides in. No layout shift, no two-state
          slider to misread. */}
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px] overflow-visible"
        aria-hidden
      >
        <defs>
          <mask id="theme-bite">
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <circle
              cx={isDark ? 15 : 26}
              cy={isDark ? 8 : 0}
              r="7.5"
              fill="black"
              style={{ transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)" }}
            />
          </mask>
        </defs>

        <circle
          cx="12"
          cy="12"
          r={isDark ? 8 : 5.2}
          fill="currentColor"
          mask="url(#theme-bite)"
          style={{ transition: "r 0.45s cubic-bezier(0.16,1,0.3,1)" }}
        />

        {/* sun rays — only present in light mode */}
        <g
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          style={{
            opacity: isDark ? 0 : 1,
            transform: `rotate(${isDark ? -45 : 0}deg)`,
            transformOrigin: "12px 12px",
            transition: "opacity 0.35s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="12"
              y1="2.6"
              x2="12"
              y2="4.9"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
        </g>
      </svg>
    </button>
  );
}
