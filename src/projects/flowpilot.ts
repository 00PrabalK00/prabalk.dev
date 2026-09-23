import type { Project } from "./types";

/**
 * FlowPilot.
 *
 * Framed as what it is — a direct consequence of shipping Node-RED operator
 * tooling on a factory floor — rather than as a standalone AI product. The
 * validation layers exist because the author has watched what happens when a
 * flow that controls a robot is deployed without them.
 */
export const flowpilot: Project = {
  slug: "flowpilot",
  subdomain: "flowpilot",
  title: "FlowPilot",
  subtitle: "AI control plane for Node-RED",
  status: "active-development",
  year: "2026",
  role: "Author",
  category: "infrastructure",
  order: 2,

  thesis:
    "An AI that drafts Node-RED flows in plain English and is not permitted to deploy one until it has survived five independent layers of validation.",

  summary:
    "Built out of the Node-RED dashboards shipped on a factory floor. Natural-language flow authoring behind schema validation, node-catalog checks, static analysis of function code, security scanning and sandboxed runtime simulation, then snapshots, approval gates, health checks and automatic rollback on deploy.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/FlowPilot",
      kind: "repo",
    },
  ],

  stack: ["React", "Vite", "Express", "WebSocket", "SQLite", "MCP", "Node-RED"],

  problem: {
    heading: "Problem",
    body: [
      "Node-RED flows on a factory floor move physical things. An AI that writes one is useful; an AI that deploys one unchecked is a hazard, and the failure is not a bad diff, it is a robot doing something unexpected.",
      "The interesting problem is not generation. It is what has to be true before a generated flow is allowed to run.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "Generation behind a validation pipeline, and a deploy path that can undo itself.",
    ],
    points: [
      "Five-layer validation, JSON schema, node catalog, function-code static analysis, security scanning, sandboxed runtime simulation",
      "Safe deployment with snapshots, approval gates, health checks and automatic rollback on failure",
      "Live monitoring over SSE/WebSocket",
      "Role-based permission engine gating tool use by risk level",
      "Outbound-only connector tunnel, so the Node-RED instance is never exposed to the internet",
      "Audit trail, local model support and a security preflight",
    ],
  },

  deepDive: [
    {
      heading: "Outbound-only by design",
      body: [
        "The connector tunnels outward from the Node-RED instance rather than accepting inbound connections. An industrial controller should not have an open port facing the internet regardless of how good the authentication is, and this removes the question entirely.",
      ],
    },
  ],

  flows: [
    {
      title: "From a sentence to a deployed flow",
      caption:
        "Generation is the easy half. Everything after it exists because these flows move physical things, and a bad one is not a bad diff, it is a robot doing something unexpected.",
      steps: [
        { label: "Describe the flow in plain English" },
        {
          label: "Five validation passes",
          tone: "decision",
          branches: [
            { label: "JSON schema, is it a well-formed flow at all" },
            { label: "Node catalog, do these nodes exist on this instance" },
            { label: "Static analysis of function code" },
            { label: "Security scan" },
            { label: "Sandboxed runtime simulation" },
          ],
        },
        {
          label: "Any pass fails",
          detail: "The flow does not reach the instance.",
          tone: "bad",
        },
        {
          label: "Approval gate",
          detail:
            "A role-based permission engine gates tool use by risk level; approval is not optional.",
        },
        {
          label: "Snapshot, then deploy",
          detail:
            "Over an outbound-only connector tunnel, the Node-RED instance is never exposed to the internet.",
        },
        {
          label: "Health check after deploy",
          tone: "decision",
          branches: [
            {
              label: "Healthy, keep it, and record the audit trail",
              tone: "good",
            },
            {
              label: "Unhealthy, automatic rollback to the snapshot",
              tone: "bad",
            },
          ],
        },
      ],
    },
  ],

  tables: [
    {
      title: "The five passes",
      caption:
        "In order. A flow has to survive all of them before an approval gate is even offered.",
      head: ["Pass", "Catches"],
      rows: [
        ["JSON schema", "Malformed flows, wrong shapes, missing wiring"],
        ["Node catalog", "Nodes that do not exist on the target instance"],
        [
          "Function static analysis",
          "Unsafe or broken code inside function nodes",
        ],
        ["Security scan", "Credential exposure and dangerous operations"],
        [
          "Sandboxed simulation",
          "What the flow actually does at runtime, before it touches hardware",
        ],
      ],
    },
  ],

  limitations: [
    "Validation reduces the risk of a bad flow reaching hardware; it does not eliminate it. Approval gates are deliberately not optional.",
  ],

  gallery: [
    {
      file: "flowpilot-ui.png",
      type: "image",
      caption:
        "FlowPilot alongside a Node-RED UGV drive flow, drive controller, fault guard and an E-STOP latch selected for explanation",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "FlowPilot is mine. It came directly out of the Node-RED operator tooling built for the SMR300 deployment.",
    },
  ],

  related: ["smr300", "continuum"],
};
