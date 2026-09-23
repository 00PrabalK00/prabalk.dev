import type { Project } from "./types";

/**
 * SMR300.
 *
 * The anchor project: this is the one that establishes the work has run on
 * industrial hardware on a live floor rather than only in simulation. Sourced
 * from the existing site data, which was written from the deployment itself.
 *
 * The numbers here belong to an employer's deployment and are the ones already
 * published on the live site. Nothing beyond that is added.
 */
export const smr300: Project = {
  slug: "smr300",
  subdomain: "smr300",
  title: "SMR300",
  subtitle: "Autonomy stack for a 300 kg industrial AMR",
  status: "deployed",
  year: "2026",
  role: "Robotics Software Intern — autonomy stack owner",
  category: "robot-systems",
  order: 1,

  thesis:
    "A company's ROS 1 architecture replaced with a ROS 2 Humble stack written to be reused across a fleet, then validated over 300 logged trials on a live factory floor.",

  summary:
    "The full autonomy stack for a 300 kg industrial autonomous mobile robot: LiDAR perception, PGV floor-tag localization, Nav2 navigation, CANopen and CiA 402 drives, and an operator platform for engineers who do not write code. Docks with 97% success and 2 cm mean error across 150 trials.",

  links: [
    {
      label: "OpenRosWarehouse",
      href: "https://github.com/00PrabalK00/OpenRosWarehouse",
      kind: "repo",
    },
  ],

  stack: [
    "ROS 2 Humble",
    "Nav2",
    "CANopen",
    "CiA 402",
    "PGV",
    "LiDAR",
    "C++",
    "Python",
    "Node-RED",
  ],

  problem: {
    heading: "Problem",
    body: [
      "The existing architecture was ROS 1 and had been written around one robot. A fleet needs a stack that can be configured rather than rewritten, and a factory floor needs one that degrades safely instead of stopping dead.",
      "It also needed to be operable by engineers who do not write code, which rules out a system whose configuration surface is a set of YAML files and a terminal.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "A layered stack — hardware, autonomy, operator — where each layer can be configured without editing the one below it.",
    ],
    points: [
      "Reusable ROS 2 autonomy stack integrating LiDAR, PGV, Nav2, an AI camera, CANopen and CiA 402",
      "Reflective-marker shelf recognition for two- and four-legged shelves",
      "PGV floor-tag localization with wheel-odometry fallback",
      "Sector safety gating, safe aborts and alerts",
      "Operator platform: mapping, map editing, URDF and sensor configuration, Nav2 tuning, mission control, deployment validation",
      "Node-RED dashboard, evaluated by 5 operators and 2 engineers",
    ],
  },

  architecture: {
    heading: "Architecture",
    body: [
      "Three layers. The hardware layer speaks CANopen to Kinco servos through the full CiA 402 state machine. The autonomy layer runs Nav2 path planning, PGV localization with odometry fallback, shelf recognition and docking actions, sector safety gating and runtime diagnostics. The operator layer is the configuration and mission surface that sits on top of both.",
    ],
  },

  deepDive: [
    {
      heading: "CiA 402 that recovers instead of stopping",
      body: [
        "The ros2_control hardware plugin drives the servos through the full CiA 402 state machine with automatic fault reset, motor heartbeat monitoring, and command gating that refuses motion during initialization or error states. A separate lift-actuator driver enforces its limit switches independently, so a fault in one cannot move the other.",
      ],
    },
    {
      heading: "Localization that degrades rather than fails",
      body: [
        "PGV tag reads stream over RS-485 into a ROS 2 localization source backed by a tag map, with wheel-odometry fallback and explicit safety conditions when tag confidence drops. Getting there required URDF and sensor calibration, TF corrections, and confirmed SDO writes on the hardware interface.",
      ],
    },
    {
      heading: "Estimation tuned from measured noise",
      body: [
        "Allan variance analysis on the IMU produced real bias-instability and random-walk terms, which were injected as covariances into the IMU messages. The EKF then weights encoder against IMU corrections on measured uncertainty rather than assumed uniform reliability.",
      ],
    },
    {
      heading: "Failure diagnosis on a live floor",
      body: [
        "Intermittent docking failures were traced to direct sunlight entering through open factory doors and saturating the reflective-marker return. An environmental failure mode, not a software regression — which is the kind of answer that only comes from instrumenting the robot on the floor it actually runs on.",
      ],
    },
  ],

  flows: [
    {
      title: "A docking attempt",
      caption:
        "The sequence that runs 97% of the time and, more importantly, what happens the other 3%. Nothing lifts until the pose has been validated.",
      steps: [
        { label: "Approach the shelf", detail: "Nav2 drives to the pre-dock pose." },
        { label: "Cluster the LiDAR return", detail: "Reflective-marker signatures isolated for two- and four-legged shelves." },
        { label: "Is the approach corridor clean?", tone: "decision",
          branches: [
            { label: "No — sector safety gating blocks motion", tone: "bad" },
            { label: "Yes — continue to the center check" },
          ] },
        { label: "Center check on the computed pose", tone: "decision",
          branches: [
            { label: "Within tolerance — lift", tone: "good" },
            { label: "Out of tolerance — reposition and retry" },
            { label: "Retry exhausted — safe abort and alert", tone: "bad" },
          ] },
        { label: "Lift the shelf", detail: "The lift actuator enforces its own limit switches, independently of the drives.", tone: "good" },
      ],
    },
    {
      title: "CiA 402, and how it recovers",
      caption:
        "The drive state machine the hardware interface drives over CANopen. The point of the diagram is the fault path: a fault resets automatically rather than stopping the robot for a person.",
      steps: [
        { label: "Switch on disabled" },
        { label: "Ready to switch on", detail: "Heartbeat monitoring confirms the drives are actually present." },
        { label: "Operation enabled", detail: "Velocity commands translated to Kinco CANopen frames over SocketCAN; position integrated from velocity feedback." },
        { label: "Is the drive in fault?", tone: "decision",
          branches: [
            { label: "Yes — automatic fault reset sequence, then re-enable" },
            { label: "No — motion permitted", tone: "good" },
          ] },
        { label: "Command gating", detail: "Motion is refused during initialization or while any drive reports an error state.", tone: "bad" },
      ],
    },
  ],

  tables: [
    {
      title: "The three layers",
      caption:
        "Each layer is configurable without editing the one below it. That is what makes the stack reusable across a fleet rather than tuned to one robot.",
      head: ["Layer", "What lives there"],
      rows: [
        ["Operator", "Mission control and monitoring, map editor and zone management, URDF and sensor configuration, Nav2 parameter tuning, Node-RED dashboard, deployment validation"],
        ["Autonomy", "Nav2 planning and following, PGV localization with odometry fallback, shelf recognition and docking actions, sector safety gating and safe abort, obstacle detection, runtime diagnostics"],
        ["Hardware", "ros2_control plugin, Kinco drives over CANopen, the CiA 402 state machine, lift actuator with independent limit switches, LiDAR and PGV interfaces"],
      ],
    },
    {
      title: "Validation on a live floor",
      caption:
        "300 logged trials, split across the two behaviours that matter. These are the numbers already published by the deployment.",
      head: ["Test", "Trials", "Result"],
      rows: [
        ["Shelf docking", "150", "97% success, 2 cm mean error"],
        ["Point to point", "150", "3 cm mean mismatch, down from 5 cm"],
        ["Operator platform", "5 operators, 2 engineers", "Node-RED dashboard evaluated in use"],
      ],
    },
  ],

  metrics: [
    {
      value: "97%",
      label: "Shelf docking success",
      context: "Across 150 logged shelf-docking trials on a live factory floor.",
    },
    {
      value: "2 cm",
      label: "Mean docking error",
      context: "Same 150-trial set.",
    },
    {
      value: "3 cm",
      label: "Point-to-point mismatch",
      context: "Down from 5 cm, across 150 point-to-point runs.",
    },
  ],

  limitations: [
    "Reflective-marker docking is sensitive to direct sunlight on the approach corridor; mitigated by safe abort and retry rather than solved.",
    "Validated on one platform. Fleet reuse is designed for and not yet demonstrated across differing hardware.",
  ],

  gallery: [
    { file: "Shelf_Docking_SMR300.mp4", type: "video", caption: "Autonomous shelf docking — approach, align, lift" },
    { file: "SMR300_onFactoryFloor.jpeg", type: "image", caption: "SMR300 on the factory floor, squaring up to a shelf" },
    { file: "UI_SMR300ControlPlane.jpeg", type: "image", caption: "Operator control plane — live scan, path editor, safety groups" },
    { file: "PGV_Mode_SMR300.mp4", type: "video", caption: "PGV mode — tag-referenced localization run" },
    {
      file: "smr300-operator.jpg",
      type: "image",
      caption:
        "Operator control plane mid-run — live LiDAR return, planned path, saved zones, and the robot aligning to a shelf point under AUTO",
    },
    {
      file: "smr300-nodered.jpg",
      type: "image",
      caption: "Node-RED — the guarded robot task queue flow",
    },
  ],

  repos: [
    {
      name: "OpenRosWarehouse",
      href: "https://github.com/00PrabalK00/OpenRosWarehouse",
      contains: "The ROS 2 autonomy stack — navigation, docking, safety gating and bringup.",
    },
    {
      name: "next_HI",
      href: "https://github.com/00PrabalK00/next_HI",
      contains: "The ros2_control hardware interface: CANopen and the CiA 402 state machine.",
    },
    {
      name: "next_EKF",
      href: "https://github.com/00PrabalK00/next_EKF",
      contains: "State estimation, with covariances derived from Allan variance analysis.",
    },
  ],

  attribution: [
    {
      kind: "my-contribution-in-a-team",
      detail:
        "Built at Next Robotics Lab. I architected and wrote the ROS 2 autonomy stack, the hardware interface, the localization and estimation work, and the operator platform, and ran the validation trials. The robot platform and the business context are the company's.",
    },
  ],

  related: ["rosscope", "ripple"],
};
