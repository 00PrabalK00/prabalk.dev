"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENT_EVENT, type Achievement } from "@/lib/eggs";
import { profile } from "@/lib/data";

type Toast = Achievement & { count: number; total: number; key: number };

export default function Achievements() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let n = 0;
    const onUnlock = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<Toast, "key">;
      const key = ++n;
      setToasts((t) => [...t, { ...d, key }]);
      setTimeout(
        () => setToasts((t) => t.filter((x) => x.key !== key)),
        5200
      );
    };
    window.addEventListener(ACHIEVEMENT_EVENT, onUnlock);
    return () => window.removeEventListener(ACHIEVEMENT_EVENT, onUnlock);
  }, []);

  // One greeting for anyone who opens DevTools — which, on a robotics
  // portfolio, is most of the people worth reaching.
  useEffect(() => {
    const head = "color:#4da6ff;font-weight:700;font-family:monospace";
    const body = "color:#7a8798;font-family:monospace";
    const link = "color:#e6edf5;font-family:monospace";
    console.log(
      `%c
   ___
  [o o]   Looking for a robotics engineer?
  |___|
  /| |\\   ROS 2 · Nav2 · C++ · CANopen · SLAM
`,
      head
    );
    console.log(
      "%cI shipped a 300 kg AMR at 97%% docking success over 300 logged trials\non a live factory floor. I'd like to do that again.",
      body
    );
    console.log(`%c${profile.email}`, link);
    console.log(
      "%cBuilt with Next.js 16, React Three Fiber and Tailwind v4.\nSource: github.com/00PrabalK00/prabalk.dev\n\nPS — there are undocumented commands in the terminal below.",
      body
    );
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.key}
          className="glow-accent flex items-center gap-3 border border-accent/40 bg-ink-2/95 px-4 py-3 backdrop-blur-sm"
          style={{ animation: "toast-in 0.45s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <span className="text-accent">◆</span>
          <span>
            <span className="mono block text-[9.5px] tracking-[0.2em] uppercase text-mute">
              Achievement · {t.count}/{t.total}
            </span>
            <span className="mono mt-0.5 block text-[12.5px] text-bone">
              {t.title}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
