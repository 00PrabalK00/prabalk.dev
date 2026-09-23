import type { Project } from "./types";

export const kurat: Project = {
  slug: "kurat",
  subdomain: "kurat",
  title: "Kurat",
  subtitle: "Autonomous conversational robot",
  status: "active-development",
  year: "2025 — present",
  role: "Author",
  category: "robot-systems",
  order: 3,

  thesis:
    "A companion robot split into three brains — perception, cognition, action — so that any one of them can fail and recover without taking the robot down with it.",

  summary:
    "A companion robot built on a three-brain architecture that separates perception, cognition and action so each can fail and recover independently. RealSense D435i and Jetson Orin Nano running YOLOv8, Whisper, ORB-SLAM3 and Nav2 for detection, speech, localization and navigation.",

  links: [],

  stack: [
    "ROS 2",
    "PyTorch",
    "YOLOv8",
    "Whisper",
    "ORB-SLAM3",
    "Nav2",
    "Jetson Orin Nano",
    "RealSense D435i",
  ],

  problem: {
    heading: "Problem",
    body: [
      "A robot that talks, sees and moves has three subsystems with completely different failure characteristics and timing requirements. Speech recognition stalling should not stop the robot navigating; a lost localization fix should not end a conversation.",
      "Coupling them into one pipeline means the slowest and least reliable component sets the behaviour of the whole robot.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "Three subsystems with independent failure and recovery, running on one embedded platform.",
    ],
    points: [
      "Perception — YOLOv8 detection and ORB-SLAM3 localization on RealSense D435i RGB-D",
      "Cognition — speech via Whisper, and the conversation system on top",
      "Action — Nav2 navigation on the mechanical platform",
      "Modular autonomy boundaries so each brain degrades on its own",
    ],
  },

  architecture: {
    heading: "Architecture",
    body: [
      "The three-brain split is the architecture: perception, cognition and action communicate through defined interfaces rather than a shared pipeline, so a failure in one is a degraded capability rather than a stopped robot. All three run on a Jetson Orin Nano with a RealSense D435i as the primary sensor.",
    ],
  },

  flows: [
    {
      title: "Three brains, so one can fail",
      caption:
        "The split is the architecture. Each brain degrades on its own rather than taking the robot down — speech stalling should not stop navigation, and a lost localization fix should not end a conversation.",
      steps: [
        { label: "Perception", detail: "YOLOv8 detection and ORB-SLAM3 localization on RealSense D435i RGB-D.", tone: "decision",
          branches: [
            { label: "Localization lost — navigation degrades, conversation continues", tone: "bad" },
          ] },
        { label: "Cognition", detail: "Whisper speech recognition and the conversation system.", tone: "decision",
          branches: [
            { label: "Speech stalls — the robot keeps moving", tone: "bad" },
          ] },
        { label: "Action", detail: "Nav2 navigation on the mechanical platform.", tone: "decision",
          branches: [
            { label: "Path blocked — recovery, while the other two brains carry on", tone: "bad" },
          ] },
        { label: "Each recovers independently", tone: "good" },
      ],
    },
  ],

  tables: [
    {
      title: "What runs where",
      caption:
        "All of it on a single Jetson Orin Nano, which is the constraint that shapes what can run concurrently.",
      head: ["Brain", "Models", "Sensor"],
      rows: [
        ["Perception", "YOLOv8, ORB-SLAM3", "RealSense D435i RGB-D"],
        ["Cognition", "Whisper, conversation system", "Microphone"],
        ["Action", "Nav2", "Odometry and the chassis"],
      ],
    },
  ],

  limitations: [
    "Active development — the conversation and navigation subsystems are not yet validated together at length.",
    "Running four models on a single Jetson Orin Nano constrains what can run concurrently.",
  ],

  gallery: [
    { file: "Kurat_body.jpeg", type: "image", caption: "Kurat — RealSense D435i and Jetson Orin Nano on a four-wheel chassis" },
    { file: "KURAT_Detection.jpeg", type: "image", caption: "Live detection running on the robot" },
  ],

  attribution: [
    { kind: "built-by-me", detail: "Kurat is mine — architecture, integration, hardware and software." },
    {
      kind: "based-on-external-research",
      detail: "YOLOv8, Whisper, ORB-SLAM3 and Nav2 are upstream, integrated here.",
    },
  ],

  related: ["smr300", "so101"],
};
