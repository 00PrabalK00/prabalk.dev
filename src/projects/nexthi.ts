import type { Project } from "./types";

/**
 * next_HI.
 *
 * The layer between ROS 2 and the motors. Unglamorous, and the place where a
 * mistake stops a 300 kg robot — or fails to.
 */
export const nexthi: Project = {
  slug: "next-hi",
  subdomain: "nexthi",
  title: "next_HI",
  subtitle: "CANopen hardware interface and the CiA 402 state machine",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "robot-systems",
  order: 6,
  compact: true,

  thesis:
    "A ros2_control plugin that speaks Kinco CANopen and manages the CiA 402 state machine, including the parts of it that are ugly and load-bearing.",

  summary:
    "Velocity commands translated into Kinco CANopen frames over SocketCAN, with position integrated from velocity feedback. Automatic CiA 402 state management and fault-reset sequences, heartbeat monitoring to confirm drives are actually ready, and command gating that refuses motion during initialization or fault.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/next_HI",
      kind: "repo",
    },
  ],

  stack: [
    "ros2_control",
    "CANopen",
    "CiA 402",
    "SocketCAN",
    "SLAM Toolbox",
    "Nav2",
  ],

  problem: {
    heading: "Problem",
    body: [
      "ROS 2 speaks in velocities; the drives speak CiA 402 over CANopen and have opinions about what state they are in. Between those two is a translation layer that has to be exactly right, because the failure mode is a heavy machine moving when it should not.",
      "The state machine is also not optional. A drive that faults and is never reset is a robot that stops for a person, every time.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "A ros2_control hardware interface, and the safety behaviour around it.",
    ],
    points: [
      "Velocity commands to Kinco CANopen frames over SocketCAN, position integrated from velocity feedback",
      "Automatic CiA 402 state management and fault-reset sequences",
      "Heartbeat monitoring, so 'ready' means the drive said so",
      "Command gating that blocks motion during initialization or fault",
      "A separate lift-actuator driver enforcing limit switches independently",
      "SLAM Toolbox mapping and Nav2 bringup on top, with DWB local and Navfn global planners",
    ],
  },

  tables: [
    {
      title: "What refuses motion",
      caption:
        "Each of these is a case where the correct behaviour is to not move, and where the default behaviour of a naive interface is to try.",
      head: ["Condition", "Behaviour"],
      rows: [
        ["Drive still initializing", "Commands gated; no motion"],
        ["Any drive reporting a fault", "Gated, then automatic reset sequence"],
        ["Heartbeat missing", "Drive is not treated as ready"],
        [
          "Lift actuator at a limit switch",
          "Enforced by its own driver, independently of the wheel drives",
        ],
      ],
    },
  ],

  limitations: [
    "Written against Kinco drives. The CiA 402 handling generalises; the frame-level specifics do not.",
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "The hardware interface, state machine handling, gating and the lift driver.",
    },
    {
      kind: "my-contribution-in-a-team",
      detail: "Built at Next Robotics Lab as part of the SMR300 deployment.",
    },
  ],

  related: ["smr300", "next-ekf"],
};
