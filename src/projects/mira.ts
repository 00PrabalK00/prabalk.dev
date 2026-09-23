import type { Project } from "./types";

/**
 * Project MIRA.
 *
 * A team project, and the attribution section says so explicitly. The AUV was
 * built by Dreadnought Robotics; the electrical architecture and the MAVROS
 * control software were mine. Blurring that line would make the whole page
 * worth less.
 */
export const mira: Project = {
  slug: "mira",
  subdomain: "mira",
  title: "Project MIRA",
  subtitle: "Autonomous underwater vehicle",
  status: "completed",
  year: "2023 — 2025",
  role: "Electrical architecture and control software",
  category: "robot-systems",
  order: 4,

  thesis:
    "A sealed-hull AUV that placed 2nd at the TAC Challenge in Norway, 2024 — where every design decision is downstream of the fact that you cannot open the hull once it is closed.",

  summary:
    "A sealed-pressure-hull autonomous underwater vehicle built by Dreadnought Robotics. I owned the electrical architecture and power distribution inside the hull, the hydrophone and sensor-control subsystem integration, and the ROS / MAVROS / MAVLink control software.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/Project_MIRA_Details",
      kind: "repo",
    },
  ],

  stack: ["ROS", "MAVROS", "MAVLink", "ArduSub", "PCB design", "Power distribution"],

  problem: {
    heading: "Problem",
    body: [
      "A sealed pressure hull removes the normal debugging loop. Every board, connector and power path inside it has to work when the hull closes, because opening it in the field is not an option and a leak is terminal.",
      "That constraint drives the electrical architecture more than any performance requirement does.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["The electrical system inside the hull, and the control software driving it."],
    points: [
      "Electrical architecture and power distribution within a sealed pressure hull",
      "Hydrophone and sensor-control subsystem integration",
      "PCB prototyping",
      "ROS / MAVROS / MAVLink control software",
      "Cross-functional test coordination across the team",
    ],
  },

  metrics: [
    {
      value: "2nd",
      label: "TAC Challenge",
      context: "Norway, 2024, as part of the Dreadnought Robotics team.",
    },
  ],

  flows: [
    {
      title: "Designing for a hull you cannot open",
      caption:
        "Every electrical decision here is downstream of one constraint: once the pressure hull closes, nothing inside it can be reached, and a leak is terminal.",
      steps: [
        { label: "The hull closes", detail: "No further physical access. No debugging loop." },
        { label: "Power distribution inside the hull", detail: "Every rail has to come up correctly the first time." },
        { label: "Sensor and hydrophone subsystems integrated", detail: "Prototyped on PCB before anything was sealed." },
        { label: "Control stack", detail: "ROS / MAVROS / MAVLink, validated in ArduSub simulation first." },
        { label: "In the water", tone: "decision",
          branches: [
            { label: "A fault inside the hull — the mission ends, and stays ended", tone: "bad" },
            { label: "It holds — autonomous docking and the competition run", tone: "good" },
          ] },
      ],
    },
  ],

  tables: [
    {
      title: "Who did what",
      caption:
        "MIRA is Dreadnought Robotics' vehicle. This table exists so the line between the team's work and mine is not left to inference.",
      head: ["Area", "Whose"],
      rows: [
        ["Electrical architecture and power distribution", "Mine"],
        ["Hydrophone and sensor-control integration, PCB prototyping", "Mine"],
        ["ROS / MAVROS / MAVLink control software", "Mine"],
        ["Cross-functional test coordination", "Mine"],
        ["Mechanical design, pressure hull, frame and thrusters", "The team's"],
        ["Competition entry and the 2nd place at TAC Norway 2024", "The team's"],
      ],
    },
  ],

  limitations: [
    "Competition-scoped. The vehicle was built to a challenge specification rather than for sustained deployment.",
  ],

  gallery: [
    { file: "MIRA_AUV.jpeg", type: "image", caption: "Project MIRA — extruded aluminium frame, ducted thrusters, domed pressure housings" },
    {
      file: "VideoOfUsDoingAutonomousDockingAUV.mp4",
      type: "video",
      caption: "Underwater — an autonomous docking run",
    },
    { file: "TAC_PhotowithThrophy.jpeg", type: "image", caption: "TAC Challenge, Norway 2024" },
    { file: "mira-electronics.jpg", type: "image", caption: "Electronics stack inside the pressure hull", pending: true },
  ],

  attribution: [
    {
      kind: "my-contribution-in-a-team",
      detail:
        "Project MIRA is the work of the Dreadnought Robotics team. My contribution was the electrical architecture and power distribution, hydrophone and sensor-control integration, PCB prototyping, and the ROS/MAVROS/MAVLink control software. The vehicle, mechanical design and competition result are the team's.",
    },
  ],

  related: ["kurat", "pushpak"],
};
