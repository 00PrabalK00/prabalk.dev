import type { Project } from "./types";

export const continuum: Project = {
  slug: "continuum",
  subdomain: "continuum",
  title: "Continuum",
  subtitle: "Open-source memory for AI coding agents",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "infrastructure",
  order: 1,

  thesis:
    "Git, but for the context an AI agent is holding, so switching from one agent to another does not mean re-explaining the codebase, the bug, and everything already tried.",

  summary:
    "A local-first memory layer for coding agents, built on an append-only event log with checkpoints as commits and a materialised current view. Ships as a Claude Code plugin and an MCP server, with branching, merging, semantic search over recorded decisions, and claim provenance.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/Continuum",
      kind: "repo",
    },
    {
      label: "Browser extension",
      href: "https://github.com/00PrabalK00/Continuum-Extension",
      kind: "repo",
    },
  ],

  stack: ["Python", "SQLite", "MCP", "Agent hooks", "CLI", "React", "MV3"],

  problem: {
    heading: "Problem",
    body: [
      "Context dies at the session boundary. An agent that spent an hour learning a codebase, forming hypotheses and ruling things out starts the next session knowing none of it, and switching between Claude Code, Codex and Gemini means paying that cost again each time.",
      "The information exists, it is just never written down in a form another agent can read.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["A three-layer architecture that deliberately mirrors Git."],
    points: [
      "An append-only SQLite event log, checkpoints as commits, and a materialised `current.md` view",
      "`continuum log / diff / blame / restore / branch / merge`",
      "`note`, `ask`, and semantic `search` over recorded decisions and hypotheses",
      "Decision versus hypothesis tracking, with claim provenance",
      "Local-first, everything in `.continuum/`, nothing uploads by default",
      "Ships as a Claude Code plugin and an MCP server",
    ],
  },

  deepDive: [
    {
      heading: "The browser extension",
      body: [
        "A capture surface rather than a separate product: it pulls context out of a GitHub PR, an AI chat, docs or an error page and routes it to an agent. Secrets for AWS, GitHub and OpenAI are redacted before anything leaves the page, with per-site permissions and private-tab blocking.",
        "A react-flow task graph provides approval controls to pause, resume or reject individual agent steps. MV3 content scripts talk to a Python native-messaging host bridging to the local CLI.",
      ],
    },
  ],

  flows: [
    {
      title: "Git, but for context",
      caption:
        "The three layers deliberately mirror Git, because the operations people already want from a memory are the ones Git defines.",
      steps: [
        {
          label: "An agent works, and records as it goes",
          detail: "Appended to a local SQLite event log.",
        },
        {
          label: "A checkpoint is written",
          detail:
            "Like a commit, and it records the git commit it was written against.",
        },
        {
          label: "current.md is materialised",
          detail:
            "A compact view of where the work actually is, 436 characters against 6,837 of raw history.",
        },
        {
          label: "Two agents, two branches",
          detail:
            "`continuum branch codex-lane` gives each its own line of context, so they stop overwriting each other.",
          tone: "decision",
          branches: [
            {
              label: "`continuum merge codex-lane` brings it back",
              tone: "good",
            },
            {
              label:
                "`log` / `diff` / `blame` / `restore` to see what changed and undo it",
            },
          ],
        },
        {
          label: "A different agent picks the work up",
          detail:
            "Claude Code, Codex or Gemini, without re-explaining the codebase, the bug, or what was already ruled out.",
          tone: "good",
        },
      ],
    },
  ],

  tables: [
    {
      title: "Benchmark",
      caption:
        "Measured against real agent CLIs, 30 trials per cell, on a project whose recorded state is controlled. Intervals are 95% Wilson score. The middle row is the uncomfortable one and it stays in the table, an agent left to open `.continuum/` itself answers just as well, so recording the context is what produces the accuracy. Injecting it is what makes it fast.",
      head: ["Arm", "Claude", "Codex"],
      rows: [
        [
          "Continuum injects the context",
          "100% (98 to 100)",
          "100% (98 to 100)",
        ],
        [
          "No injection; the agent reads .continuum/ itself",
          "100% (98 to 100)",
          "100% (98 to 100)",
        ],
        ["No project memory at all", "17% (12 to 24)", "20% (14 to 27)"],
      ],
    },
  ],

  metrics: [
    {
      value: "100%",
      label: "Recall accuracy with context injection",
      context: "Repository benchmark, against 17 to 20% without it.",
    },
    {
      value: "~94%",
      label: "Context compression",
      context: "Repository benchmark.",
    },
    {
      value: "5.5 s",
      label: "Agent response time",
      context: "Down from 17 to 21 s, per the repository benchmark.",
    },
  ],

  limitations: [
    "Injection is not what produces the accuracy. An agent left to open `.continuum/` itself scores identically, 100% either way. What injection buys is speed, not correctness, and the benchmark table says so rather than hiding the row.",
    "The reported numbers come from the project's own benchmark, not an independent evaluation.",
    "30 trials per cell. The intervals are Wilson score and are stated with the numbers because a bare percentage at that sample size would overclaim.",
  ],

  gallery: [
    {
      file: "continuum-ui.png",
      type: "image",
      caption:
        "The Now view, current task, decisions taken, and open questions carried between agent sessions",
    },
    {
      file: "continuum-benchmark.svg",
      type: "image",
      caption:
        "Recall accuracy with and without context injection, from the repository's own benchmark",
    },
    {
      file: "continuum-extension.png",
      type: "image",
      caption: "The browser extension, capture surface and task graph",
    },
  ],

  repos: [
    {
      name: "Continuum",
      href: "https://github.com/00PrabalK00/Continuum",
      contains: "The event log, CLI, MCP server and Claude Code plugin.",
    },
    {
      name: "Continuum-Extension",
      href: "https://github.com/00PrabalK00/Continuum-Extension",
      contains: "MV3 browser extension and the native-messaging host.",
    },
  ],

  attribution: [
    { kind: "built-by-me", detail: "Continuum and its extension are mine." },
  ],

  related: ["flowpilot"],
};
