import {
  emptyPayload,
  type ContribDay,
  type GhEvent,
  type GhRepo,
  type GhUser,
  type GithubPayload,
} from "@/lib/github";

/**
 * Server-side GitHub aggregator.
 *
 * Runs on every request but leans on Next's fetch cache (revalidate: 300) so the
 * upstream API sees at most one call per resource per 5 minutes regardless of
 * traffic. Set GITHUB_TOKEN to lift the 60 req/hr unauthenticated ceiling and to
 * unlock the contribution calendar (GraphQL-only, requires auth).
 */

const USER = process.env.NEXT_PUBLIC_GITHUB_USER || "00PrabalK00";
const TOKEN = process.env.GITHUB_TOKEN;
const REVALIDATE = 300;

// NOTE: do not add `export const dynamic = "force-dynamic"` here. It forces
// every fetch() in this route to { cache: 'no-store', revalidate: 0 }, which
// silently defeats REVALIDATE below — each visitor would then hit the GitHub
// API directly and burn the 60 req/hr unauthenticated limit shared across the
// host's IP pool. The route is already request-time because it does network
// I/O; the fetch cache is what keeps upstream calls to one per 5 minutes.

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "prabalk-portfolio",
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function gh<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: headers(),
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Contribution calendar is GraphQL-only and needs a token; null without one. */
async function contributions(): Promise<{ days: ContribDay[]; total: number } | null> {
  if (!TOKEN) return null;
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount contributionLevel } }
          }
        }
      }
    }`;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login: USER } }),
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const cal =
      json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) return null;
    const levelMap: Record<string, ContribDay["level"]> = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    };
    const days: ContribDay[] = [];
    for (const w of cal.weeks) {
      for (const d of w.contributionDays) {
        days.push({
          date: d.date,
          count: d.contributionCount,
          level: levelMap[d.contributionLevel] ?? 0,
        });
      }
    }
    return { days, total: cal.totalContributions };
  } catch {
    return null;
  }
}

type RawEvent = {
  id: string;
  type: string | null;
  created_at: string;
  repo: { name: string };
  payload: Record<string, unknown>;
};

/** Turn a raw GitHub event into one readable HUD line. */
function describe(e: RawEvent): GhEvent | null {
  const repo = e.repo?.name ?? "";
  const base = {
    id: e.id,
    type: e.type ?? "Event",
    repo,
    repoUrl: `https://github.com/${repo}`,
    createdAt: e.created_at,
  };
  const p = e.payload as {
    commits?: { message: string; sha: string }[];
    ref?: string;
    ref_type?: string;
    action?: string;
    pull_request?: { title?: string; html_url?: string; number?: number };
    issue?: { title?: string; html_url?: string; number?: number };
    release?: { name?: string; tag_name?: string; html_url?: string };
    forkee?: { full_name?: string };
  };

  switch (e.type) {
    case "PushEvent": {
      const n = p.commits?.length ?? 0;
      const msg = p.commits?.[p.commits.length - 1]?.message?.split("\n")[0];
      return {
        ...base,
        summary: `pushed ${n} commit${n === 1 ? "" : "s"} to ${(p.ref ?? "").replace("refs/heads/", "")}`,
        detail: msg,
      };
    }
    case "CreateEvent":
      return { ...base, summary: `created ${p.ref_type ?? "ref"} ${p.ref ?? ""}`.trim() };
    case "DeleteEvent":
      return { ...base, summary: `deleted ${p.ref_type ?? "ref"} ${p.ref ?? ""}`.trim() };
    case "PullRequestEvent":
      return {
        ...base,
        summary: `${p.action ?? "updated"} PR #${p.pull_request?.number ?? ""}`,
        detail: p.pull_request?.title,
        detailUrl: p.pull_request?.html_url,
      };
    case "IssuesEvent":
      return {
        ...base,
        summary: `${p.action ?? "updated"} issue #${p.issue?.number ?? ""}`,
        detail: p.issue?.title,
        detailUrl: p.issue?.html_url,
      };
    case "IssueCommentEvent":
      return {
        ...base,
        summary: `commented on #${p.issue?.number ?? ""}`,
        detail: p.issue?.title,
        detailUrl: p.issue?.html_url,
      };
    case "WatchEvent":
      return { ...base, summary: "starred" };
    case "ForkEvent":
      return { ...base, summary: "forked", detail: p.forkee?.full_name };
    case "ReleaseEvent":
      return {
        ...base,
        summary: `released ${p.release?.tag_name ?? ""}`,
        detail: p.release?.name ?? undefined,
        detailUrl: p.release?.html_url,
      };
    case "PublicEvent":
      return { ...base, summary: "made public" };
    case "MemberEvent":
      return { ...base, summary: "updated collaborators" };
    default:
      return null;
  }
}

export async function GET() {
  const [user, repos, rawEvents, contrib] = await Promise.all([
    gh<GhUser>(`/users/${USER}`),
    gh<GhRepo[]>(`/users/${USER}/repos?per_page=100&sort=pushed`),
    gh<RawEvent[]>(`/users/${USER}/events/public?per_page=100`),
    contributions(),
  ]);

  if (!user && !repos) {
    return Response.json(emptyPayload("github unreachable or rate limited"), {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }

  const allRepos = (repos ?? []).filter((r) => !r.archived);
  const own = allRepos.filter((r) => !r.fork);

  const langCounts = new Map<string, number>();
  for (const r of own) {
    if (!r.language) continue;
    langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }
  const langTotal = [...langCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const languages = [...langCounts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      bytesShare: Math.round((count / langTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const events = (rawEvents ?? [])
    .map(describe)
    .filter((e): e is GhEvent => Boolean(e))
    .slice(0, 30);

  const sortedRepos = [...allRepos].sort((a, b) => {
    if (a.fork !== b.fork) return a.fork ? 1 : -1;
    if (b.stargazers_count !== a.stargazers_count)
      return b.stargazers_count - a.stargazers_count;
    return +new Date(b.pushed_at) - +new Date(a.pushed_at);
  });

  const payload: GithubPayload = {
    ok: true,
    fetchedAt: new Date().toISOString(),
    user,
    repos: sortedRepos.slice(0, 24),
    events,
    languages,
    totals: {
      stars: own.reduce((s, r) => s + r.stargazers_count, 0),
      forks: own.reduce((s, r) => s + r.forks_count, 0),
      repos: own.length,
      contributions: contrib?.total ?? null,
    },
    contributions: contrib?.days ?? null,
    lastPushedAt:
      allRepos.map((r) => r.pushed_at).sort().at(-1) ??
      events[0]?.createdAt ??
      null,
  };

  return Response.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
