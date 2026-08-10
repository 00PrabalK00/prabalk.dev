/**
 * Server-side rendering for the device payload.
 *
 * Everything here exists because the ESP32 cannot do it cheaply or at all:
 *
 *   - Timezones. There is no tzdata on the chip, and shipping one to handle
 *     two zones with DST would cost more flash than the entire UI. The server
 *     has `Intl`, so both clocks are rendered here as strings.
 *   - Text measurement. The firmware draws a 6 px-per-character bitmap font
 *     with no wrapping, so a long title silently runs off the panel. Truncating
 *     server-side keeps the layout constants in one place instead of two.
 *   - Arithmetic on a track position that keeps advancing between polls.
 *
 * The character limits below are derived from the 320 px panel: the built-in
 * Adafruit GFX font is 6 px wide at size 1 and 12 px at size 2, and each screen
 * reserves ~16 px of horizontal padding.
 */

/** Now Playing renders title and artist at text size 2: (320-16)/12 ≈ 25. */
export const TITLE_MAX = 25;
export const ARTIST_MAX = 25;
/** Home screen inbox previews, size 1 with an icon column: ~38 chars. */
export const PREVIEW_MAX = 38;
/** The soft place string sits beside the status pill. */
export const PLACE_MAX = 18;
/** The daily note wraps to three lines of ~44 at size 1. */
export const NOTE_MAX = 132;
/** Message bodies on the detail screen: 5 lines of ~44. */
export const BODY_MAX = 220;

/**
 * Truncates on a word boundary where one is close enough, otherwise mid-word.
 * The ellipsis is a plain "..." rather than "…" because the device font is
 * ASCII-only and would render the Unicode character as a blank box.
 */
export function clamp(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 3);
  const space = cut.lastIndexOf(" ");
  const base = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${base.trimEnd()}...`;
}

/**
 * Strips anything the device cannot draw.
 *
 * The dashboard is a text box on a phone, so emoji arrive constantly — and the
 * GFX font has no glyphs above 0x7E, so an emoji renders as garbage boxes.
 * A few common ones are transliterated rather than dropped, because "Reached
 * home <3" carries the same feeling and "Reached home" does not.
 */
export function toDeviceText(text: string): string {
  return text
    .replace(/[❤️♥\u{1F495}\u{1F496}\u{1F497}\u{1F49B}\u{1F49C}\u{1F499}]/gu, "<3")
    .replace(/[\u{1F642}\u{1F600}-\u{1F603}\u{1F60A}]/gu, ":)")
    .replace(/[\u{1F614}\u{1F622}\u{1F625}\u{1F97A}]/gu, ":(")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    // Anything still non-ASCII would draw as a box; drop it.
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface Clock {
  time: string;
  day: string;
  /** Minutes east of UTC, including DST. The device keeps its own clock from
   *  SNTP and applies this, so the displayed time is second-accurate rather
   *  than as fresh as the last poll. */
  offsetMinutes: number;
}

/**
 * Offset of a zone from UTC right now, in minutes.
 *
 * Derived by formatting the same instant in the target zone and in UTC and
 * differencing, which is the only way to get this from Intl without shipping
 * a timezone database. Handles DST for free, because Intl already knows.
 */
function zoneOffsetMinutes(zone: string, at: Date): number {
  const local = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) => Number(local.find((p) => p.type === type)?.value ?? 0);
  // Intl renders midnight as hour 24 in some locales; normalise it.
  const hour = get("hour") % 24;

  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"),
                         get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/**
 * Renders a wall clock for an IANA zone. Falls back to UTC if the zone name is
 * bad rather than throwing — a typo in an env var should not take the device
 * offline.
 */
export function clockFor(zone: string, at: Date = new Date()): Clock {
  try {
    // 12-hour with a meridiem, e.g. "8:42 PM".
    //
    // The device splits this on the space and draws the digits large with the
    // AM/PM small beside them, so the shape is load-bearing: one ASCII space,
    // no leading zero on the hour.
    const raw = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(at);

    // Node emits a narrow no-break space (U+202F) before AM/PM on newer ICU
    // versions, and some runtimes use U+00A0. Neither is an ASCII space, so the
    // device's split would fail and the meridiem would vanish — and the font
    // cannot draw either character anyway.
    const time = raw.replace(/[  \s]+/g, " ").trim();

    const day = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      weekday: "short",
    }).format(at);

    return { time, day, offsetMinutes: zoneOffsetMinutes(zone, at) };
  } catch {
    return { time: "--:-- --", day: "---", offsetMinutes: 0 };
  }
}

/** "8:46 PM" in the home timezone — the parents read these, not Prabal. */
export function stamp(tsSec: number, zone: string): string {
  if (!tsSec) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(tsSec * 1000));
  } catch {
    return "";
  }
}

/** Seconds to "4:50". Anything past an hour gets "1:04:50". */
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * Extrapolates a track position forward from the last publish.
 *
 * The publisher stores (position, timestamp); this advances it by wall-clock
 * elapsed time so the progress bar keeps moving on the TFT even when nothing
 * has been pushed for a minute. Clamped to the track length so a stale
 * "playing" flag cannot run the bar past the end.
 */
export function livePosition(
  progress: number,
  updated: number,
  duration: number,
  playing: boolean,
  nowSec: number,
): number {
  if (!playing) return Math.max(0, progress);
  const elapsed = Math.max(0, nowSec - updated);
  const pos = progress + elapsed;
  return duration > 0 ? Math.min(pos, duration) : pos;
}
