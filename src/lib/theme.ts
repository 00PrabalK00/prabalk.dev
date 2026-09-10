/**
 * There is one theme now.
 *
 * The Soft Beach palette has no dark counterpart — the five colours are beach
 * colours and every one of them dies on near-black — so the toggle, the stored
 * preference and the prefers-color-scheme branch are all gone.
 *
 * This module survives because the WebGL scene reads `themeStore.blend` every
 * frame to decide how far to push its materials toward the light-stage
 * treatment. Pinning it to 1 keeps that path live and constant rather than
 * threading a removal through the whole scene graph, where the same constant
 * would end up hard-coded in a dozen useFrame callbacks instead of one place.
 */

export type Theme = "light";

/** 0 = dark stage, 1 = light stage. Fixed: there is no other stage. */
export const themeStore: { current: Theme; blend: number } = {
  current: "light",
  blend: 1,
};

export function resolveTheme(): Theme {
  return "light";
}
