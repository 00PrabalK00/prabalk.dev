import { profile } from "@/lib/data";

/**
 * GitHub contribution graph, rendered on the server as plain SVG.
 *
 * The GraphQL contribution calendar needs a token; the public contributions
 * page GitHub serves to its own profile view does not. It carries every day's
 * date, a 0–4 level and a tooltip with the exact count, so it is parsed here at
 * build time and refreshed every six hours by ISR. No client JavaScript, and a
 * failed fetch simply renders nothing rather than an empty grid.
 */

type Day = { date: string; level: number; count: number };

const WEEKS = 22;
const CELL = 11;
const GAP = 3;
const COLORS = ["#e9eff0", "#bfe6e8", "#7fcfd4", "#2fa6ae", "#0b7a84"];

async function fetchDays(user: string): Promise<Day[] | null> {
  try {
    const res = await fetch(`https://github.com/users/${user}/contributions`, {
      next: { revalidate: 21600 },
      headers: { "User-Agent": "prabalkhare.com" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const counts = new Map<string, number>();
    for (const m of html.matchAll(
      /<tool-tip[^>]*for="(contribution-day-component-[\d-]+)"[^>]*>\s*([^<]*)/g,
    )) {
      const n = /^(\d[\d,]*) contribution/.exec(m[2].trim());
      counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
    }

    const days: Day[] = [];
    for (const m of html.matchAll(
      /data-date="(\d{4}-\d{2}-\d{2})"\s+id="(contribution-day-component-[\d-]+)"\s+data-level="(\d)"/g,
    )) {
      days.push({ date: m[1], level: Number(m[3]), count: counts.get(m[2]) ?? 0 });
    }
    if (days.length < 7 * WEEKS) return null;
    return days.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return null;
  }
}

export default async function GithubGraph({ className = "" }: { className?: string }) {
  const all = await fetchDays(profile.githubUser);
  if (!all) return null;

  // Columns are weeks starting on Sunday, like GitHub's own grid.
  const last = new Date(`${all[all.length - 1].date}T00:00:00Z`);
  const end = new Date(last);
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1));
  const byDate = new Map(all.map((d) => [d.date, d]));

  const cells: { x: number; y: number; day?: Day; key: string }[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    cells.push({
      x: Math.floor(i / 7) * (CELL + GAP),
      y: (i % 7) * (CELL + GAP),
      day: d <= last ? byDate.get(key) : undefined,
      key,
    });
  }

  const yearTotal = all.reduce((sum, d) => sum + d.count, 0);
  const width = WEEKS * (CELL + GAP) - GAP;
  const height = 7 * (CELL + GAP) - GAP;

  return (
    <a
      href={profile.github}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block w-fit rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-[#9fd4d8] ${className}`}
      aria-label={`${yearTotal} GitHub contributions in the last year`}
    >
      <p className="mb-3 flex items-baseline justify-between gap-4 text-[12.5px] text-zinc-500">
        <span className="font-semibold text-zinc-800">GitHub</span>
        <span>
          <span className="font-semibold text-[#0b7a84] tabular-nums">
            {yearTotal.toLocaleString("en-US")}
          </span>{" "}
          contributions in the last year
        </span>
      </p>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-hidden
        className="block max-w-full"
      >
        {cells.map((c) =>
          c.day || new Date(`${c.key}T00:00:00Z`) <= last ? (
            <rect
              key={c.key}
              x={c.x}
              y={c.y}
              width={CELL}
              height={CELL}
              rx={2}
              fill={COLORS[c.day?.level ?? 0]}
            >
              <title>
                {`${c.day?.count ?? 0} contribution${c.day?.count === 1 ? "" : "s"} on ${c.key}`}
              </title>
            </rect>
          ) : null,
        )}
      </svg>
      <p className="mt-2.5 flex items-center justify-end gap-1.5 text-[11px] text-zinc-400">
        Last 5 months
        <span className="ml-2">Less</span>
        {COLORS.map((c) => (
          <span
            key={c}
            className="inline-block h-[10px] w-[10px] rounded-[2px]"
            style={{ background: c }}
          />
        ))}
        <span>More</span>
      </p>
    </a>
  );
}
