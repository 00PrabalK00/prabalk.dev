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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`mono relative grid h-8 w-14 place-items-center overflow-hidden border border-line text-[10px] tracking-[0.12em] text-mute transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      <span
        className="absolute inset-y-0 w-1/2 bg-accent/12 transition-transform duration-400 ease-out"
        style={{
          transform: theme === "dark" ? "translateX(0)" : "translateX(100%)",
        }}
      />
      <span className="relative flex w-full items-center justify-around">
        <span className={theme === "dark" ? "text-accent" : "opacity-40"}>
          ●
        </span>
        <span className={theme === "light" ? "text-accent" : "opacity-40"}>
          ○
        </span>
      </span>
    </button>
  );
}
