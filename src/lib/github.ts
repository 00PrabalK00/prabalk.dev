/**
 * GitHub data model shared by the /api/github route handler and the client HUD.
 */

export type GhUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
  created_at: string;
};

export type GhRepo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  topics?: string[];
  fork: boolean;
  archived: boolean;
};

export type GhEvent = {
  id: string;
  type: string;
  repo: string;
  repoUrl: string;
  createdAt: string;
  summary: string;
  detail?: string;
  detailUrl?: string;
};

export type ContribDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type GithubPayload = {
  ok: boolean;
  fetchedAt: string;
  user: GhUser | null;
  repos: GhRepo[];
  events: GhEvent[];
  languages: { name: string; count: number; bytesShare: number }[];
  totals: { stars: number; forks: number; repos: number; contributions: number | null };
  contributions: ContribDay[] | null;
  lastPushedAt: string | null;
  error?: string;
};

export const emptyPayload = (error?: string): GithubPayload => ({
  ok: false,
  fetchedAt: new Date().toISOString(),
  user: null,
  repos: [],
  events: [],
  languages: [],
  totals: { stars: 0, forks: 0, repos: 0, contributions: null },
  contributions: null,
  lastPushedAt: null,
  error,
});

/** "4m ago" / "3h ago" / "6d ago" — deterministic, no locale drift. */
export function relTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 45) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export const LANG_COLOR: Record<string, string> = {
  "C++": "#f34b7d",
  Python: "#3572A5",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Makefile: "#427819",
  Java: "#b07219",
  C: "#555555",
  Jupyter: "#DA5B0B",
  Dockerfile: "#384d54",
  CMake: "#DA3434",
};

export const langColor = (name: string | null) =>
  (name && LANG_COLOR[name]) || "#7c828c";
