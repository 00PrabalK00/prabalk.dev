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

/**
 * Stage background + fog, per theme.
 *
 * Light mode is a studio sweep, not a white void: a cool mid-grey gives the
 * chrome something to reflect and stops pale geometry disappearing. Exposure
 * comes DOWN in light — pushing it up was blowing every highlight to paper
 * white and flattening the whole scene.
 */
export const STAGE = {
  dark: { bg: "#0a0d12", fog: "#0a0d12", exposure: 1.0 },
  light: { bg: "#c9d2dd", fog: "#c9d2dd", exposure: 0.92 },
} as const;

/**
 * How far a material is pushed toward its dark counterpart in light mode.
 * Objects designed to read against near-black are far too pale to sit on a
 * light sweep, so surfaces darken and emissives calm right down.
 */
export const LIGHT_ADJUST = {
  /** multiply surface colour by this at full light */
  surface: 0.42,
  /** multiply emissive colour by this at full light */
  emissiveColor: 0.55,
  /** scale emissiveIntensity by this at full light */
  emissiveIntensity: 0.3,
  /** additive blending is invisible on a light background */
  additiveOpacity: 0.55,
} as const;
