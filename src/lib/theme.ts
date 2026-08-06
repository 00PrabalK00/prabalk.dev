export type Theme = "light" | "dark";

export const THEME_KEY = "pk-theme";

/**
 * Inlined into <head> before paint so the page never flashes the wrong theme.
 * Kept as a string because it must run before React hydrates.
 */
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem('${THEME_KEY}');
if(s==='light'||s==='dark'){document.documentElement.setAttribute('data-theme',s);}
}catch(e){}})();`;

/** Module store so the WebGL scene can read the theme every frame. */
export const themeStore: { current: Theme; blend: number } = {
  current: "dark",
  blend: 0, // 0 = dark, 1 = light; eased for the 3D crossfade
};

export function resolveTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode — the in-memory store still works for this session */
  }
  themeStore.current = theme;
  window.dispatchEvent(new CustomEvent("pk-theme", { detail: theme }));
}
