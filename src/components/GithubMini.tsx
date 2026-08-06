"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { langColor, relTime, type GithubPayload } from "@/lib/github";
import { profile } from "@/lib/data";

const POLL_MS = 60_000;

const GLYPH: Record<string, string> = {
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

/**
 * Compact live GitHub panel for the console sidebar. Shares the same cached
 * /api/github route as the full section, so showing both costs one upstream
 * call per five minutes rather than two.
 */
export default function GithubMini({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const [data, setData] = useState<GithubPayload | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const prevTop = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/github", { cache: "no-store" });
      if (!res.ok) return;
      const json: GithubPayload = await res.json();
      setData(json);
      const top = json.events[0]?.id ?? null;
      if (prevTop.current && top && top !== prevTop.current) {
        setPulse(true);
        setTimeout(() => setPulse(false), 3000);
      }
      prevTop.current = top;
    } catch {
      /* the panel degrades to its last good state */
    }
  }, []);

  useEffect(() => {
    const kick = requestAnimationFrame(() => {
      setNow(Date.now());
      load();
    });
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      cancelAnimationFrame(kick);
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  const live = Boolean(data?.ok);

  // last 18 weeks of the contribution calendar, if a token is configured
  const weeks = useMemo(() => {
    if (!data?.contributions) return null;
    const out: (typeof data.contributions)[] = [];
    for (let i = 0; i < data.contributions.length; i += 7)
      out.push(data.contributions.slice(i, i + 7));
    return out.slice(-18);
  }, [data]);

  const shade = ["#171d26", "rgba(77,166,255,0.28)", "rgba(77,166,255,0.5)", "rgba(77,166,255,0.75)", "#4da6ff"];

  return (
    <div className="flex flex-col border border-line bg-ink-2/80 backdrop-blur-sm">
      {/* header */}
      <div className="mono flex items-center gap-2 border-b border-line px-4 py-2.5 text-[10px] tracking-[0.16em] uppercase text-mute">
        <Activity size={12} strokeWidth={1.8} />
        github.live
        <span
          className={`relative ml-1 inline-block h-1.5 w-1.5 rounded-full ${
            live ? "bg-pass pulse-ring text-pass" : "bg-fault text-fault"
          }`}
        />
        {pulse && (
          <span className="text-accent normal-case tracking-normal">
            new activity
          </span>
        )}
        <span className="ml-auto normal-case tracking-normal text-mute/50">
          {data?.lastPushedAt && now ? relTime(data.lastPushedAt, now) : "—"}
        </span>
      </div>

      {/* counters */}
      <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
        {[
          { label: "repos", value: data?.totals.repos },
          { label: "stars", value: data?.totals.stars },
          {
            label: "commits/yr",
            value: data?.totals.contributions ?? undefined,
          },
        ].map((s) => (
          <div key={s.label} className="px-3 py-3">
            <div className="text-xl font-semibold tracking-tight tabular-nums text-bone">
              {s.value ?? <span className="text-line-2">—</span>}
            </div>
            <div className="mono mt-0.5 text-[9.5px] tracking-[0.12em] uppercase text-mute/60">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* contribution strip — hidden on short viewports where the sidebar is
          already competing with the terminal for height */}
      {weeks && (
        <div className="hidden border-b border-line px-4 py-3 [@media(min-height:820px)]:block">
          <div className="flex gap-[2px]">
            {weeks.map((w, i) => (
              <div key={i} className="flex flex-col gap-[2px]">
                {w.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count}`}
                    className="h-[7px] w-[7px]"
                    style={{ background: shade[d.level] }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* language bar */}
      {data?.languages?.length ? (
        <div className="border-b border-line px-4 py-3">
          <div className="mb-2 flex h-1 w-full overflow-hidden">
            {data.languages.map((l) => (
              <div
                key={l.name}
                title={`${l.name} ${l.bytesShare}%`}
                style={{ width: `${l.bytesShare}%`, background: langColor(l.name) }}
              />
            ))}
          </div>
          <div className="mono flex flex-wrap gap-x-3 gap-y-1 text-[9.5px] text-mute/70">
            {data.languages.slice(0, 4).map((l) => (
              <span key={l.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5"
                  style={{ background: langColor(l.name) }}
                />
                {l.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* recent activity */}
      <ol data-lenis-prevent className="max-h-[150px] overflow-y-auto">
        {(data?.events ?? []).slice(0, 8).map((e) => (
          <li key={e.id} className="border-b border-line/50 px-4 py-2 last:border-0">
            <div className="flex items-baseline gap-2">
              <span className="mono w-3 shrink-0 text-[10px] text-accent/70">
                {GLYPH[e.type] ?? "·"}
              </span>
              <a
                href={e.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mono truncate text-[11px] text-bone transition-colors hover:text-accent"
              >
                {e.repo.split("/")[1] ?? e.repo}
              </a>
              <span className="mono ml-auto shrink-0 text-[9.5px] text-mute/50">
                {now ? relTime(e.createdAt, now) : ""}
              </span>
            </div>
            <p className="mono mt-0.5 truncate pl-5 text-[10.5px] text-mute/70">
              {e.summary}
              {e.detail ? ` — ${e.detail}` : ""}
            </p>
          </li>
        ))}

        {!data && (
          <li className="mono px-4 py-4 text-[11px] text-mute/60">
            establishing link<span className="blink">…</span>
          </li>
        )}
      </ol>

      {/* footer */}
      <div className="mono flex items-center gap-4 border-t border-line px-4 py-2.5 text-[10px] tracking-[0.14em] uppercase">
        <button
          type="button"
          onClick={onOpen}
          className="text-accent transition-opacity hover:opacity-70"
        >
          open full →
        </button>
        <a
          href={profile.github}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-mute/60 transition-colors hover:text-accent"
        >
          @{profile.githubUser}
        </a>
      </div>
    </div>
  );
}
