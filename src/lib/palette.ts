/**
 * Colours shared by the WebGL scene — Soft Beach.
 *
 * The stage is permanently pale now, which inverts what these have to do. The
 * old set was picked to glow against near-black; against a bright sweep the
 * same values wash out, so the structural greys warm up into the sand family
 * and darken, and the accents keep their hue while dropping enough value to
 * still read as objects rather than as haze.
 */
export const P = {
  accent: "#2bb8d4", // bright blue, held back from #51e2f5 so edges survive
  accentHot: "#51e2f5", // the vivid one, for emissives and highlights
  teal: "#4ecfc2", // blue green
  pass: "#4ecfc2",
  fault: "#e8899b", // pink sand
  violet: "#a28089", // dark sand

  /* Structure. Warm, because everything they sit against is warm now. */
  steel: "#6e5a61",
  steelLight: "#9c848c",
  steelDark: "#4a3b40",
  rubber: "#33282c",
  deck: "#7d666e",
} as const;

/**
 * Stage background + fog.
 *
 * `dark` is retained as the far end of the blend the scene still lerps across,
 * but nothing selects it any more — the theme is pinned light. It is kept a
 * touch deeper than the page ground rather than at the old near-black so that,
 * if the blend is ever eased from something other than 1, it passes through a
 * colour that belongs to this palette.
 *
 * The light sweep is a soft blue-green rather than a white void: pale chrome
 * on white has nothing to reflect and vanishes. Exposure stays below 1 —
 * pushing it up blows every highlight to paper and flattens the scene.
 */
export const STAGE = {
  dark: { bg: "#7fb6bd", fog: "#7fb6bd", exposure: 1.0 },
  light: { bg: "#cfe9e8", fog: "#cfe9e8", exposure: 0.86 },
} as const;

/**
 * How far a material is pushed toward its dark counterpart in light mode.
 * Objects designed to read against near-black are far too pale to sit on a
 * light sweep, so surfaces darken and emissives calm right down.
 */
export const LIGHT_ADJUST = {
  /** multiply surface colour by this at full light */
  surface: 0.34,
  /** multiply emissive colour by this at full light */
  emissiveColor: 0.48,
  /** scale emissiveIntensity by this at full light */
  emissiveIntensity: 0.3,
  /** additive blending is invisible on a light background */
  additiveOpacity: 0.55,
} as const;
