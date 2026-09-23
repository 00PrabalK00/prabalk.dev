import type { Project } from "./types";

export const infrencex: Project = {
  slug: "infrencex",
  subdomain: "infrencex",
  title: "InfrenceX CLI",
  subtitle: "Agentic terminal over a decentralized model market",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "infrastructure",
  order: 6,

  thesis:
    "A terminal coding agent that routes each task to whichever provider is cheapest and available, and fails over without losing the conversation.",

  summary:
    "An Ink-based TUI with live token and cost tracking, subagent monitoring, and automatic provider failover that preserves conversation history. Five role-aware personas, a plan-first mode requiring approval before changes, and an extensible plugin framework supporting Skills and ESM/Claude-format plugins.",

  links: [
    { label: "Repository", href: "https://github.com/00PrabalK00/INFRX", kind: "repo" },
  ],

  stack: ["Node.js", "Ink", "TypeScript", "JSON-RPC", "MCP"],

  problem: {
    heading: "Problem",
    body: [
      "Provider choice is usually a config value set once and forgotten, which means paying list price for work that a cheaper model would have done identically — and losing the session when that provider has an outage.",
      "Failover is the harder half. Switching provider mid-task is only useful if the conversation survives the switch.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["A terminal agent whose routing layer is the point."],
    points: [
      "Ink TUI with live token and cost tracking, and subagent monitoring",
      "Automatic provider failover preserving conversation history",
      "Dynamic routing against the InfrenceX market with seller availability monitoring",
      "Five role-aware personas and a plan-first mode requiring approval before changes",
      "Plugin framework for Skills and ESM/Claude-format plugins, plus an IDE JSON-RPC bridge",
    ],
  },

  limitations: [
    "Routing quality depends on the market's availability signals; a provider that is listed but degraded still has to be discovered by failing.",
  ],

  attribution: [{ kind: "built-by-me", detail: "The CLI, routing, failover and plugin framework." }],

  related: ["continuum"],
};
