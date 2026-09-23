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
/*
 * Retuned for eight stations rather than six. The normalized numbers shrink,
 * but STAGE_VH in Cinema.tsx grows by the same proportion (3400 → 4500svh), so
 * a beat still occupies the same real scroll distance as it did before — ~207vh
 * of hold against the old ~211vh. The reading pace is unchanged; there is
 * simply more film.
 */
const FIRST = 0.335;
const SLOT = 0.073;
const TRANSIT = 0.019;
const HOLD = 0.046;

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
  | "graph"
  | "incident"
  | "bench";

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
    color: "#51e2f5",
    align: "right",
    kicker: "Project MIRA · 2nd place, TAC Challenge Norway 2024",
    title: "It had to survive the pressure hull.",
    body: "An autonomous underwater vehicle where every electrical decision was final the moment the hull was sealed.",
    facts: [
      "Electrical architecture and power distribution inside a sealed AUV hull",
      "Hydrophone and sensor-control subsystems, PCB prototyping",
      "ROS / MAVROS / MAVLink control software",
    ],
    link: "https://mira.prabalkhare.com",
  },
  {
    id: "vtol",
    kind: "vtol",
    pos: [10, 5, -38],
    view: [-7, 1.5, 9.5],
    color: "#4ecfc2",
    align: "left",
    kicker: "Autonomous VTOL UAV · Top 30 of 500, SIH 2023",
    title: "Find the person from the air.",
    body: "A vertical-takeoff search-and-rescue platform that flew its own scan pattern and picked victims out of thermal.",
    facts: [
      "Raspberry Pi + Pixhawk + MAVROS airframe with OpenCV and thermal imaging",
      "TensorFlow Lite and YOLOv5 inference on board",
      "Autonomous scan patterns and a custom battery management system",
    ],
    link: "https://pushpak.prabalkhare.com",
  },
  {
    id: "kurat",
    kind: "companion",
    pos: [-11, 1.5, -60],
    view: [7, 1.2, 9],
    color: "#ffa8b6",
    align: "right",
    kicker: "Kurat · Autonomous conversational robot",
    title: "Three brains, so one can fail.",
    body: "Perception, cognition and action are separated on purpose — each can degrade or recover without taking the others down.",
    facts: [
      "RealSense D435i + Jetson Orin Nano",
      "YOLOv8 perception, Whisper speech, ORB-SLAM3 localization, Nav2 navigation",
      "Real-time interaction under a modular autonomy split",
    ],
    link: "https://kurat.prabalkhare.com",
  },
  {
    id: "arm",
    kind: "arm",
    pos: [9, -3.5, -82],
    view: [-6.5, 2.8, 9.5],
    color: "#e0c94a",
    align: "left",
    kicker: "RobotDrawing · Simulated ABB IRB140",
    title: "I taught it to route. It lost.",
    body: "Robotic drawing reframed as a stroke-level travelling salesman problem, solved by a learned router — which then failed to beat the classical solver it was meant to replace.",
    facts: [
      "GNN + Pointer Network, imitation learning then reinforcement learning",
      "Simulated annealing: 26.8 pen-ups at 195 ms. The learned router: 28.8 at 10.9 s",
      "Slower and worse, across 28 images. Measuring it properly is how I know",
    ],
    link: "https://robotdrawing.prabalkhare.com",
  },
  {
    id: "dronekit",
    kind: "cloud",
    pos: [-8, 4.5, -104],
    view: [6, 0.5, 9.5],
    color: "#a28089",
    align: "right",
    kicker: "OpenDroneKit · Drone Entry",
    title: "Find the crack. Then predict it.",
    body: "Structural inspection that doesn't stop at detection — the crack gets projected onto the reconstruction and simulated forward in time.",
    facts: [
      "~40,000 defect images through YOLOv8 detection and U-Net segmentation",
      "Cracks mapped onto COLMAP 3D reconstructions",
      "FEniCSx simulation estimates propagation and flags severity",
    ],
    link: "https://opendronekit.prabalkhare.com",
  },
  {
    id: "continuum",
    kind: "graph",
    pos: [10, 0, -126],
    view: [-6.5, 1.5, 9],
    color: "#7fd9e8",
    align: "left",
    kicker: "Continuum · Open source",
    title: "Git, but for an agent's memory.",
    body: "Switch from Claude Code to Codex to Gemini without re-explaining the codebase, the bug, or what you already tried.",
    facts: [
      "Append-only SQLite event log → checkpoints → materialized current.md",
      "log / diff / blame / restore / branch / merge, plus semantic search",
      "Local-first — nothing leaves .continuum/ by default",
    ],
    link: "https://continuum.prabalkhare.com",
  },

  /* ---------------------------------------------------------------- *
   * Act III — the research wing.                                      *
   *                                                                   *
   * Everything before this point is a robot that was built. These two *
   * are questions being asked about robots that already exist, which  *
   * is why they sit past the others in open space rather than in the  *
   * same row: the flight arrives somewhere quieter.                   *
   * ---------------------------------------------------------------- */
  {
    id: "ripple",
    kind: "incident",
    pos: [-9, 1.5, -146],
    view: [6.5, 1.2, 10],
    color: "#51e2f5",
    align: "right",
    kicker: "Ripple · Active research",
    title: "It stopped. Now what?",
    body: "A site engineer that watches a Nav2 robot fail, recovers inside a budget you set, and asks a person when the evidence says the problem is physical — then remembers what worked at that spot.",
    facts: [
      "The model only emits tool calls; the edge validates, journals, then acts",
      "A keepout counts once the mask and costmap show it. An arrival counts once odometry settles",
      "123 unit tests, recovery 13/13 in simulation — and never yet on physical hardware",
    ],
    link: "https://ripple.prabalkhare.com",
  },
  {
    id: "so101",
    kind: "bench",
    pos: [9, -0.5, -166],
    view: [-6.5, 1.6, 10],
    color: "#9df9ef",
    align: "left",
    kicker: "SO101 · SmolVLA · Active research",
    title: "Rule out the wiring first.",
    body: "Most reported manipulation failures are not policy failures. They are camera ordering, normalisation or action scaling wearing a policy's name — so the first result here is that replayed actions reproduce their demonstrations.",
    facts: [
      "Leader and follower on the LeRobot SO101, two cameras, MuJoCo evaluation",
      "Recorded actions replayed through the evaluator reproduce the demonstrations",
      "No performance claim yet. That is the honest state of it",
    ],
    link: "https://so101.prabalkhare.com",
  },
];

export const STATIONS: Station[] = RAW.map((s, i) => ({ ...s, ...slot(i) }));

/** The four patents, rendered as monoliths at the end of the flight. */
export const MONOLITH_Z = -192;

export const OUTRO = {
  patents: { from: 0.936, to: 0.98 },
  handoff: { from: 0.99, to: 1.0 },
};
