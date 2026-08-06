"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/lib/data";
import {
  langColor,
  relTime,
  type ContribDay,
  type GithubPayload,
} from "@/lib/github";
import { Counter, Reveal, Section } from "@/components/ui";

const POLL_MS = 60_000;

/* ------------------------------------------------------------------ */
/* Contribution heatmap                                                */
/* ------------------------------------------------------------------ */
const SHADE = [
  "#16181c",
  "rgba(255,176,32,0.24)",
  "rgba(255,176,32,0.46)",
  "rgba(255,176,32,0.72)",
  "#4da6ff",
];

function Heatmap({ days }: { days: ContribDay[] }) {
  const weeks = useMemo(() => {
    const out: ContribDay[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out.slice(-53);
  }, [days]);

  return (
    <div data-lenis-prevent className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} contribution${d.count === 1 ? "" : "s"}`}
                className="h-[10px] w-[10px] transition-transform hover:scale-150"
                style={{ background: SHADE[d.level] }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shown when no GITHUB_TOKEN is configured (calendar is GraphQL-only). */
function HeatmapPlaceholder() {
  return (
    <div data-lenis-prevent className="relative overflow-x-auto pb-1">
      <div className="flex min-w-max gap-[3px] opacity-25">
        {Array.from({ length: 53 }).map((_, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((__, di) => {
              const seed = (wi * 7 + di) % 11;
              const level = seed > 8 ? 3 : seed > 6 ? 2 : seed > 3 ? 1 : 0;
              return (
                <div
                  key={di}
                  className="h-[10px] w-[10px]"
                  style={{ background: SHADE[level] }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="mono absolute inset-0 grid place-items-center text-[10px] tracking-[0.16em] uppercase text-mute">
        Set GITHUB_TOKEN to stream the graph
      </p>
    </div>
  );
}

const EVENT_GLYPH: Record<string, string> = {
  PushEvent: "◆",
  CreateEvent: "+",
  DeleteEvent: "−",
  PullRequestEvent: "⇄",
  IssuesEvent: "!",
  IssueCommentEvent: "”",
  WatchEvent: "★",
  ForkEvent: "⑂",
  ReleaseEvent: "▲",
  PublicEvent: "○",
};

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
export default function GithubLive() {
  const [data, setData] = useState<GithubPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const prevEventId = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/github", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: GithubPayload = await res.json();
      setData(json);
      setError(json.ok ? null : (json.error ?? "unavailable"));
      const top = json.events[0]?.id ?? null;
      if (prevEventId.current && top && top !== prevEventId.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 2600);
      }
      prevEventId.current = top;
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    }
  }, []);

  useEffect(() => {
    // Deferred to the first frame after paint: the fetch shouldn't compete with
    // hero rendering, and `now` must not be read during render (hydration).
    const kick = requestAnimationFrame(() => {
      setNow(Date.now());
      load();
    });
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(kick);
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const live = Boolean(data?.ok);
  const totals = data?.totals;

  return (
    <Section
      id="github"
      index="02 / LIVE"
      title="Live from the terminal"
      kicker="This reads the GitHub API through a cached server route and refreshes every sixty seconds. It is not a screenshot — if I push in the next minute, it lands here."
    >
      {/* status line */}
      <Reveal>
        <div className="mono flex flex-wrap items-center gap-x-7 gap-y-2 text-[11px] text-mute">
          <span className="flex items-center gap-2">
            <span
              className={`relative inline-block h-1.5 w-1.5 rounded-full ${
                live ? "bg-pass pulse-ring text-pass" : "bg-fault text-fault"
              }`}
            />
            <span className={live ? "text-pass" : "text-fault"}>
              {live ? "connected" : "offline"}
            </span>
          </span>

          <span>@{profile.githubUser}</span>

          {data?.lastPushedAt && now && (
            <span>
              last push{" "}
              <span className="text-accent">
                {relTime(data.lastPushedAt, now)}
              </span>
            </span>
          )}

          {data?.fetchedAt && now && (
            <span className="text-mute/60">
              synced {relTime(data.fetchedAt, now)}
            </span>
          )}

          {pulse && <span className="text-accent">new activity</span>}
          {error && <span className="text-fault">{error}</span>}

          <button
            type="button"
            onClick={load}
            className="tracking-[0.14em] uppercase text-mute/60 transition-colors hover:text-accent"
          >
            refresh
          </button>
        </div>
      </Reveal>

      {/* counters */}
      <Reveal delay={60}>
        <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-4">
          {[
            { label: "Public repos", value: totals?.repos ?? 0 },
            { label: "Stars earned", value: totals?.stars ?? 0 },
            { label: "Forks", value: totals?.forks ?? 0 },
            {
              label: "Contributions this year",
              value: totals?.contributions ?? 0,
              gated: totals?.contributions == null,
            },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-semibold tracking-[-0.045em] tabular-nums text-bone sm:text-5xl">
                {s.gated ? (
                  <span className="text-line-2">—</span>
                ) : (
                  <Counter value={s.value} />
                )}
              </div>
              <div className="mt-3 text-[13px] text-mute">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="hairline my-16" />

      <div className="grid gap-y-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-x-16">
        {/* activity stream */}
        <div>
          <div className="mono mb-6 flex items-baseline justify-between text-[10px] tracking-[0.2em] uppercase text-mute">
            <span>Activity stream</span>
            <span className="text-accent">{data?.events.length ?? 0}</span>
          </div>

          <ol data-lenis-prevent className="max-h-[440px] overflow-y-auto pr-2">
            {(data?.events ?? []).map((e) => (
              <li
                key={e.id}
                className="group border-t border-line/50 py-3.5 first:border-t-0"
              >
                <div className="flex items-start gap-3.5">
                  <span className="mono mt-0.5 w-3 shrink-0 text-[11px] text-accent/70">
                    {EVENT_GLYPH[e.type] ?? "·"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <a
                        href={e.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono text-[12.5px] text-bone transition-colors hover:text-accent"
                      >
                        {e.repo.split("/")[1] ?? e.repo}
                      </a>
                      <span className="mono text-[11px] text-mute">
                        {e.summary}
                      </span>
                    </div>
                    {e.detail && (
                      <p className="mt-1 truncate text-[12.5px] text-mute/70">
                        {e.detailUrl ? (
                          <a
                            href={e.detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-bone"
                          >
                            {e.detail}
                          </a>
                        ) : (
                          e.detail
                        )}
                      </p>
                    )}
                  </div>
                  <span className="mono shrink-0 text-[10px] text-mute/50">
                    {now ? relTime(e.createdAt, now) : ""}
                  </span>
                </div>
              </li>
            ))}

            {!data && !error && (
              <li className="mono py-4 text-[12px] text-mute">
                establishing link<span className="blink">…</span>
              </li>
            )}
          </ol>
        </div>

        {/* languages + heatmap */}
        <div>
          <div className="mono mb-6 text-[10px] tracking-[0.2em] uppercase text-mute">
            Language distribution
          </div>

          <div className="mb-5 flex h-1.5 w-full overflow-hidden">
            {(data?.languages ?? []).map((l) => (
              <div
                key={l.name}
                title={`${l.name} · ${l.bytesShare}%`}
                style={{
                  width: `${l.bytesShare}%`,
                  background: langColor(l.name),
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {(data?.languages ?? []).slice(0, 9).map((l) => (
              <span
                key={l.name}
                className="mono flex items-center gap-2 text-[11px] text-mute"
              >
                <span
                  className="inline-block h-1.5 w-1.5"
                  style={{ background: langColor(l.name) }}
                />
                {l.name}
                <span className="text-mute/50">{l.bytesShare}%</span>
              </span>
            ))}
          </div>

          <div className="mono mt-14 mb-6 text-[10px] tracking-[0.2em] uppercase text-mute">
            Contribution graph
          </div>
          {data?.contributions ? (
            <Heatmap days={data.contributions} />
          ) : (
            <HeatmapPlaceholder />
          )}
        </div>
      </div>

      <div className="hairline my-16" />

      {/* repositories as an editorial index */}
      <Reveal>
        <div className="mono mb-8 flex items-baseline justify-between text-[10px] tracking-[0.2em] uppercase text-mute">
          <span>Repositories</span>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent transition-colors hover:text-bone"
          >
            View all ↗
          </a>
        </div>
      </Reveal>

      <ul>
        {(data?.repos ?? []).slice(0, 12).map((r) => (
          <li key={r.name} className="border-t border-line/50 last:border-b">
            <a
              href={r.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid items-baseline gap-x-8 gap-y-1 py-5 sm:grid-cols-[210px_minmax(0,1fr)_auto]"
            >
              <div className="mono flex items-center gap-2.5 text-[13px] text-bone transition-colors group-hover:text-accent">
                {r.language && (
                  <span
                    className="inline-block h-1.5 w-1.5 shrink-0"
                    style={{ background: langColor(r.language) }}
                  />
                )}
                {r.name}
              </div>
              <p className="max-w-[60ch] text-[14px] leading-relaxed text-mute">
                {r.description ?? "—"}
              </p>
              <div className="mono flex shrink-0 gap-5 text-[10.5px] text-mute/60">
                <span>★ {r.stargazers_count}</span>
                <span>{now ? relTime(r.pushed_at, now) : ""}</span>
              </div>
            </a>
          </li>
        ))}

        {!data &&
          Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="border-t border-line/50 py-6">
              <div className="h-3 w-1/3 animate-pulse bg-ink-3" />
            </li>
          ))}
      </ul>
    </Section>
  );
}
