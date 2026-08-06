/**
 * The cinematic script. Single source of truth for both the WebGL scene
 * (camera path, station geometry) and the DOM text beats, so the copy can
 * never drift out of sync with where the camera actually is.
 *
 * All timings are absolute scroll progress, 0 → 1 across the whole stage.
 */

export const ACT1_END = 0.32; // warehouse act ends, fog swallows everything

/**
 * Station pacing. Each station owns a SLOT: a short TRANSIT while the camera
 * flies in, then a long HOLD where the camera barely moves and the copy is
 * fully up. The gap between one station's copy ending and the next beginning
 * is what stops beats colliding mid-read.
 */
const FIRST = 0.335;
const SLOT = 0.098;
const TRANSIT = 0.026;
const HOLD = 0.062;

const slot = (i: number) => {
  const enter = FIRST + i * SLOT;
  return { enter, from: enter + TRANSIT, to: enter + TRANSIT + HOLD };
};

export type StationKind =
  | "auv"
  | "vtol"
  | "companion"
  | "arm"
  | "cloud"
  | "graph";

export type Station = {
  id: string;
  kind: StationKind;
  /** where the object sits in space */
  pos: [number, number, number];
  /** camera offset from the object when parked in front of it */
  view: [number, number, number];
  color: string;
  /** camera starts its approach here */
  enter: number;
  /** scroll window during which the copy is up and the camera barely moves */
  from: number;
  to: number;
  /** which side the copy sits on — opposite the object */
  align: "left" | "right";
  kicker: string;
  title: string;
  body: string;
  facts: string[];
  link?: string;
};

const RAW: Omit<Station, "enter" | "from" | "to">[] = [
  {
    id: "mira",
    kind: "auv",
    pos: [-9, -2.5, -16],
    view: [6.5, 2.2, 9],
    color: "#38bdf8",
    align: "right",
    kicker: "Project MIRA · 2nd place, TAC Challenge Norway 2024",
    title: "It had to survive the pressure hull.",
    body: "An autonomous underwater vehicle where every electrical decision was final the moment the hull was sealed.",
    facts: [
      "Electrical architecture and power distribution inside a sealed AUV hull",
      "Hydrophone and sensor-control subsystems, PCB prototyping",
      "ROS / MAVROS / MAVLink control software",
    ],
  },
  {
    id: "vtol",
    kind: "vtol",
    pos: [10, 5, -38],
    view: [-7, 1.5, 9.5],
    color: "#3ddc97",
    align: "left",
    kicker: "Autonomous VTOL UAV · Top 30 of 500, SIH 2023",
    title: "Find the person from the air.",
    body: "A vertical-takeoff search-and-rescue platform that flew its own scan pattern and picked victims out of thermal.",
    facts: [
      "Raspberry Pi + Pixhawk + MAVROS airframe with OpenCV and thermal imaging",
      "TensorFlow Lite and YOLOv5 inference on board",
      "Autonomous scan patterns and a custom battery management system",
    ],
  },
  {
    id: "kurat",
    kind: "companion",
    pos: [-11, 1.5, -60],
    view: [7, 1.2, 9],
    color: "#ff6b9d",
    align: "right",
    kicker: "Kurat · Autonomous conversational robot",
    title: "Three brains, so one can fail.",
    body: "Perception, cognition and action are separated on purpose — each can degrade or recover without taking the others down.",
    facts: [
      "RealSense D435i + Jetson Orin Nano",
      "YOLOv8 perception, Whisper speech, ORB-SLAM3 localization, Nav2 navigation",
      "Real-time interaction under a modular autonomy split",
    ],
  },
  {
    id: "arm",
    kind: "arm",
    pos: [9, -3.5, -82],
    view: [-6.5, 2.8, 9.5],
    color: "#ff9d5c",
    align: "left",
    kicker: "RobotDrawing · ABB IRB140",
    title: "Teach it to route, not to draw.",
    body: "Robotic drawing reframed as a stroke-level travelling salesman problem, solved by a learned router instead of a slow classical solver.",
    facts: [
      "GNN + Pointer Network, imitation learning then reinforcement learning",
      "Curriculum learning scales past 300 strokes",
      "~150 ms inference — simulated-annealing quality, roughly 20× faster",
    ],
  },
  {
    id: "dronekit",
    kind: "cloud",
    pos: [-8, 4.5, -104],
    view: [6, 0.5, 9.5],
    color: "#a78bfa",
    align: "right",
    kicker: "OpenDroneKit · Drone Entry",
    title: "Find the crack. Then predict it.",
    body: "Structural inspection that doesn't stop at detection — the crack gets projected onto the reconstruction and simulated forward in time.",
    facts: [
      "~40,000 defect images through YOLOv8 detection and U-Net segmentation",
      "Cracks mapped onto COLMAP 3D reconstructions",
      "FEniCSx simulation estimates propagation and flags severity",
    ],
  },
  {
    id: "continuum",
    kind: "graph",
    pos: [10, 0, -126],
    view: [-6.5, 1.5, 9],
    color: "#22d3ee",
    align: "left",
    kicker: "Continuum · Open source",
    title: "Git, but for an agent's memory.",
    body: "Switch from Claude Code to Codex to Gemini without re-explaining the codebase, the bug, or what you already tried.",
    facts: [
      "Append-only SQLite event log → checkpoints → materialized current.md",
      "log / diff / blame / restore / branch / merge, plus semantic search",
      "Local-first — nothing leaves .continuum/ by default",
    ],
  },
];

export const STATIONS: Station[] = RAW.map((s, i) => ({ ...s, ...slot(i) }));

/** The four patents, rendered as monoliths at the end of the flight. */
export const MONOLITH_Z = -152;

export const OUTRO = {
  patents: { from: 0.936, to: 0.98 },
  handoff: { from: 0.99, to: 1.0 },
};
