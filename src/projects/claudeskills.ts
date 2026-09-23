import type { Project } from "./types";

export const claudeskills: Project = {
  slug: "claude-skills",
  title: "claude-skills",
  subtitle: "Reusable agent skills, packaged",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "bench",
  order: 5,
  compact: true,

  thesis:
    "The tooling layer under my own workflow, extracted so it can be reused.",

  summary:
    "Reusable agent skills packaged for Claude Code, the workflow layer that sits under the rest of this work rather than a project in its own right.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/claude-skills",
      kind: "repo",
    },
  ],

  stack: ["Shell", "Agent skills"],

  built: {
    heading: "What it is",
    body: [
      "Skills packaged so a workflow that worked once can be applied again without rebuilding it, the same motivation as Continuum, at a smaller scale.",
    ],
  },

  attribution: [
    { kind: "built-by-me", detail: "The skills and their packaging." },
  ],

  related: ["continuum"],
};
