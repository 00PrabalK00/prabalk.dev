/**
 * Colours shared by the WebGL scene. Deliberately chosen to read against both
 * the dark (#0A0D12) and light (#E4EAF2) stage backgrounds, so the 3D act
 * doesn't need a second colourway when the theme flips.
 */
export const P = {
  accent: "#4da6ff",
  accentHot: "#8ac6ff",
  teal: "#7fe3d4",
  pass: "#3ddc97",
  fault: "#ff5c5c",
  violet: "#a78bfa",

  steel: "#39424f",
  steelLight: "#5b6878",
  steelDark: "#1d242e",
  rubber: "#14181e",
  deck: "#4a5566",
} as const;

/** Stage background + fog, per theme. */
export const STAGE = {
  dark: { bg: "#0a0d12", fog: "#0a0d12", exposure: 1.0 },
  light: { bg: "#dfe6ef", fog: "#dfe6ef", exposure: 1.15 },
} as const;
