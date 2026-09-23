import type { Project } from "./types";

/**
 * RosScope.
 *
 * Gets its own page rather than living inside SMR300, because the tool is
 * useful independently of the robot it was written for. Sourced from the
 * existing site data.
 */
export const rosscope: Project = {
  slug: "rosscope",
  subdomain: "rosscope",
  title: "RosScope",
  subtitle: "ROS 2 fleet diagnostics — an oscilloscope for the graph",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "robot-systems",
  order: 2,

  thesis:
    "A Qt6 desktop tool that shows you what a ROS 2 graph is actually doing, instead of making you infer it from scrolling logs.",

  summary:
    "The debug tool built to survive a factory floor. ROS-aware process monitoring mapped to nodes and workspaces, graph inspection across topics, QoS, TF, Nav2 and lifecycle state, zombie and conflict detection, SSH-based fleet monitoring, and two UIs — an engineer mode for diagnostics and a stripped operator mode for the floor.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/RosScope",
      kind: "repo",
    },
  ],

  stack: ["C++17", "Qt6", "CMake", "ROS 2 Humble/Iron/Jazzy", "SSH"],

  problem: {
    heading: "Problem",
    body: [
      "When a ROS 2 system misbehaves on a live floor, the available evidence is a scrolling log and a guess. The graph's real state — who is publishing, on what QoS, whether TF is complete, whether a lifecycle node actually came up, whether a node that appears dead is still holding a topic — is all knowable and none of it is visible.",
      "The diagnosis loop was the bottleneck, not the fix.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["A desktop tool that inspects the running graph directly."],
    points: [
      "ROS-aware Linux process monitoring mapped to nodes, domains, PIDs, executables and workspaces",
      "Graph inspection across topics, QoS, TF, Nav2 and lifecycle state",
      "Zombie-process, conflict and missing-link detection",
      "Process control, snapshot export and session recording",
      "SSH-based remote fleet monitoring",
      "Dual UI — engineer mode for diagnostics, operator mode for the floor",
    ],
  },

  deepDive: [
    {
      heading: "Two audiences, one tool",
      body: [
        "An engineer debugging a QoS mismatch and an operator checking whether the robot is healthy need completely different surfaces over the same data. Shipping one UI would have meant either burying the diagnostics or exposing an operator to them; the split keeps both usable.",
      ],
    },
  ],

  flows: [
    {
      title: "Diagnosing a graph that has gone wrong",
      caption:
        "The loop RosScope is built to shorten. Every step here is something that was previously inferred from scrolling logs.",
      steps: [
        { label: "Something on the floor stops behaving" },
        { label: "Map processes to the ROS graph", detail: "Linux processes resolved to nodes, domains, PIDs, executables and workspaces." },
        { label: "Is a node actually alive?", tone: "decision",
          branches: [
            { label: "Process gone but topic held — zombie detected", tone: "bad" },
            { label: "Two nodes claiming the same name — conflict detected", tone: "bad" },
            { label: "Alive and singular — inspect the graph" },
          ] },
        { label: "Inspect topics, QoS, TF, Nav2 and lifecycle state", tone: "decision",
          branches: [
            { label: "QoS mismatch — publisher and subscriber never connect", tone: "bad" },
            { label: "Missing TF link — the transform tree is incomplete", tone: "bad" },
            { label: "Lifecycle node never activated", tone: "bad" },
            { label: "Graph healthy — look elsewhere", tone: "good" },
          ] },
        { label: "Snapshot or record the session", detail: "So the state can be compared later, or sent to someone not standing at the robot.", tone: "good" },
      ],
    },
  ],

  tables: [
    {
      title: "What it detects",
      caption:
        "Each of these is knowable from the running graph and invisible in a log stream, which is the whole argument for the tool.",
      head: ["Class", "What it means"],
      rows: [
        ["Zombie process", "The process is gone but its topic or service registration is still held"],
        ["Name conflict", "Two nodes claiming the same identity in the graph"],
        ["Missing link", "A topic with a publisher and no subscriber, or the reverse"],
        ["QoS mismatch", "Endpoints that will never connect because their policies are incompatible"],
        ["TF gaps", "An incomplete transform tree"],
        ["Lifecycle state", "A managed node that never reached active"],
      ],
    },
    {
      title: "Two modes, one tool",
      head: ["Mode", "For", "Shows"],
      rows: [
        ["Engineer", "Debugging", "Full graph, QoS, TF, lifecycle, process control, snapshots, SSH fleet monitoring"],
        ["Operator", "The floor", "A simplified runtime and safety view, with the diagnostics out of the way"],
      ],
    },
  ],

  gallery: [
    {
      file: "rosscope-ui.jpg",
      type: "image",
      caption:
        "Against a live ROS 2 Humble graph — domain view with process count, conflict state and TF/SLAM status, and every node resolved to its PID, executable and workspace. The health score reads DEGRADED because the graph genuinely is",
    },
    {
      file: "rosscope-demo.mp4",
      type: "video",
      caption: "Working through a live graph",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail: "RosScope is mine, written while deploying the SMR300 stack.",
    },
  ],

  related: ["smr300", "ripple"],
};
