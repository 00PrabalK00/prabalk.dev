/**
 * Scroll plumbing for the cinematic stage.
 *
 * A module-level store rather than React state on purpose: the WebGL scene
 * reads progress every frame inside useFrame, and routing that through React
 * would re-render the tree 60 times a second.
 */

/** 0 → 1 across the height of the cinematic stage. */
export const cinema: {
  progress: number;
  /** Set by the stage once Lenis is live, so jumps use the same easing. */
  scrollTo: (px: number) => void;
} = {
  progress: 0,
  scrollTo: (px) => window.scrollTo({ top: px, behavior: "smooth" }),
};

/** Smoothstep — soft in, soft out. */
export const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Progress within [a, b], clamped to 0..1. */
export const range = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)));

/**
 * 0 → 1 → 0 across [a, b] with independent in/out ramps.
 *
 * Separate ramps matter: a beat's fade-out has to finish before the next
 * beat's fade-in starts, and the gaps either side are rarely equal.
 */
export function window01(p: number, a: number, b: number, fadeIn = 0.02, fadeOut = fadeIn) {
  if (p < a - fadeIn || p > b + fadeOut) return 0;
  if (p < a) return smoothstep((p - (a - fadeIn)) / fadeIn);
  if (p > b) return 1 - smoothstep((p - b) / fadeOut);
  return 1;
}

/**
 * Given ordered [from, to] windows, derive per-beat ramps that consume at most
 * 40% of the gap to the neighbouring beat — so two beats are never legible at
 * once, no matter how the act timings are retuned.
 */
export function deriveFades(
  windows: { from: number; to: number }[],
  max = 0.022
): { in: number; out: number }[] {
  return windows.map((w, i) => {
    const prev = windows[i - 1];
    const next = windows[i + 1];
    const gapBefore = prev ? w.from - prev.to : Infinity;
    const gapAfter = next ? next.from - w.to : Infinity;
    return {
      in: Math.max(0.004, Math.min(max, gapBefore * 0.4)),
      out: Math.max(0.004, Math.min(max, gapAfter * 0.4)),
    };
  });
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerp3 = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Frame-rate independent damping factor. */
export const damp = (dt: number, smoothing = 0.0015) =>
  1 - Math.pow(smoothing, dt);

/**
 * Coarse device tier. Phones get fewer particles, a lower DPR ceiling and a
 * shorter stage — a 3400vh flight is punishing on a 700px-tall screen, and
 * mobile GPUs choke on the particle counts a laptop shrugs off.
 */
export function isSmallScreen() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function isLowPower() {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  return isSmallScreen() || cores <= 4;
}
