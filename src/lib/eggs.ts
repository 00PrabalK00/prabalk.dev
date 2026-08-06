"use client";

/**
 * Easter-egg plumbing: achievements, the Konami sequence, and a synthesised
 * chirp. Deliberately dependency-free — none of this is worth a package, and
 * the audio is generated so there is no asset to load for a joke.
 */

export type Achievement = {
  id: string;
  title: string;
  hint: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "terminal", title: "Dropped to a shell", hint: "Run any command" },
  { id: "ros2", title: "Sourced the workspace", hint: "It's a robotics site. Try the obvious." },
  { id: "explorer", title: "Read the whole record", hint: "Open every directory" },
  { id: "flight", title: "Full mission profile", hint: "Scroll the flight end to end" },
  { id: "horn", title: "Horn activated", hint: "The robot is clickable" },
  { id: "unsafe", title: "Safety gating disabled", hint: "↑↑↓↓←→←→BA" },
  { id: "idle", title: "Autonomous roam", hint: "Walk away mid-flight" },
  { id: "threepercent", title: "The other 3%", hint: "Stop at exactly the right moment" },
];

const KEY = "pk-achievements";
export const ACHIEVEMENT_EVENT = "pk-achievement";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function unlockedIds(): Set<string> {
  return read();
}

/** Fires a toast the first time only; repeat calls are silent no-ops. */
export function unlock(id: string) {
  if (typeof window === "undefined") return;
  const have = read();
  if (have.has(id)) return;
  have.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...have]));
  } catch {
    /* private mode — the toast still fires, it just won't persist */
  }
  const found = ACHIEVEMENTS.find((a) => a.id === id);
  if (!found) return;
  window.dispatchEvent(
    new CustomEvent(ACHIEVEMENT_EVENT, {
      detail: { ...found, count: have.size, total: ACHIEVEMENTS.length },
    })
  );
}

/* ------------------------------------------------------------------ */
/* Konami                                                              */
/* ------------------------------------------------------------------ */
const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function watchKonami(onHit: () => void) {
  let i = 0;
  const onKey = (e: KeyboardEvent) => {
    // ignore while typing in the terminal
    if (e.target instanceof HTMLInputElement) return;
    const want = SEQUENCE[i];
    const got = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    i = got === want ? i + 1 : got === SEQUENCE[0] ? 1 : 0;
    if (i === SEQUENCE.length) {
      i = 0;
      onHit();
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}

/* ------------------------------------------------------------------ */
/* Audio                                                               */
/* ------------------------------------------------------------------ */
let ctx: AudioContext | null = null;

/** Two-tone forklift chirp. Must be called from a user gesture. */
export function chirp() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;

    [
      { f: 880, t: 0, d: 0.11 },
      { f: 1320, t: 0.13, d: 0.14 },
    ].forEach(({ f, t, d }) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "square";
      osc.frequency.value = f;
      // short attack/decay so it reads as a beep, not a tone
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.08, now + t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + t);
      osc.stop(now + t + d + 0.02);
    });
  } catch {
    /* audio blocked — the visual half of the egg still fires */
  }
}

/* ------------------------------------------------------------------ */
/* Shared flags the WebGL scene reads every frame                      */
/* ------------------------------------------------------------------ */
export const eggState = {
  /** Konami: barrel roll + rainbow scan. */
  unsafe: false,
  unsafeAt: 0,
  /** Robot horn was just pressed — drives the beacon flash. */
  hornAt: 0,
  /** No scroll for a while: the robot leaves the planned path. */
  idle: false,
};
