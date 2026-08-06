/**
 * Single source of truth for every piece of portfolio content.
 * Editing this file changes the site — no component edits required.
 */

export const profile = {
  name: "Prabal Khare",
  initials: "PK",
  roles: [
    "Robotics Software Engineer",
    "Autonomy Engineer",
    "Mechatronics Engineer",
    "ROS 2 Engineer",
  ],
  tagline:
    "I build the whole robot — sensors, comms, localization, navigation, controls, operator tooling, and the deployment that proves it works.",
  location: "Brooklyn, New York",
  previousLocation: "Bangkok, Thailand",
  email: "prabalkhare.1010@gmail.com",
  github: "https://github.com/00PrabalK00",
  githubUser: "00PrabalK00",
  linkedin: "https://www.linkedin.com/in/prabalk",
  youtube: "https://www.youtube.com/@evtol459",
  /** Served from this origin so it always resolves and can be downloaded
   *  directly — no Google sign-in wall, no broken share link. */
  resume: "/Prabal_Khare_Resume.pdf",
  resumeFileName: "Prabal_Khare_Resume.pdf",
  /** Kept as a mirror in case the Drive copy is ever the newer one. */
  resumeDrive:
    "https://drive.google.com/file/d/1GmldZ472upLU58mr1qOuZ3cXxaoN7R9H/view",
  botopsy: "https://botopsylab.com",
  languages: ["English", "Hindi", "Thai", "Marathi", "German (basic)"],
};

export const heroStats = [
  { value: 300, suffix: " kg", label: "AMR shipped" },
  { value: 97, suffix: "%", label: "Docking success" },
  { value: 2, suffix: " cm", label: "Docking error" },
  { value: 3, suffix: "", label: "Patents filed" },
];

export const education = [
  {
    school: "New York University",
    sub: "Tandon School of Engineering",
    degree: "M.S. Mechatronics and Robotics",
    place: "Brooklyn, NY",
    period: "Aug 2026 — May 2028",
    status: "incoming",
  },
  {
    school: "Vellore Institute of Technology",
    sub: "VIT Chennai",
    degree: "B.Tech Computer Engineering — Robotics & AI Specialization",
    place: "Chennai, India",
    period: "2022 — Jul 2026",
    status: "completing",
  },
];

export type Experience = {
  company: string;
  role: string;
  place: string;
  period: string;
  accent: string;
  tags: string[];
  bullets: string[];
  link?: string;
};

export const experience: Experience[] = [
  {
    company: "Next Robotics Lab Co., Ltd.",
    role: "Robotics Software Intern",
    place: "Pathum Thani, Thailand",
    period: "Jan 2026 — Jul 2026",
    accent: "#4DA6FF",
    tags: ["ROS 2 Humble", "Nav2", "CANopen", "CiA 402", "PGV", "LiDAR", "C++"],
    link: "https://github.com/00PrabalK00/OpenRosWarehouse",
    bullets: [
      "Architected a reusable ROS 2 autonomy stack for the 300 kg SMR300 AMR — integrating LiDAR, PGV, Nav2, an AI camera, CANopen and CiA 402 — replacing the company's prior ROS 1 architecture.",
      "Validated navigation across 150 shelf-docking trials and 150 point-to-point runs: 97% docking success, 2 cm shelf docking error, point-to-point mismatch cut from 5 cm to a 3 cm mean.",
      "Implemented reflective-marker recognition for two- and four-legged shelves using LiDAR clustering, center checks, automatic repositioning, sector safety gating, safe aborts and alerts; root-caused failures traced to sunlight reflections at open factory doors.",
      "Built an operator platform for mapping, map editing, URDF and sensor configuration, Nav2 parameter tuning, mission control, monitoring and deployment validation — plus a Node-RED dashboard evaluated by 5 operators and 2 engineers.",
      "Developed Python, C++, JavaScript and Web API components for path following, zone management, map handling, robot profiles, workflow management and robot bringup.",
    ],
  },
  {
    company: "Theta Sound",
    role: "Hardware Engineering Intern",
    place: "Remote",
    period: "Jan 2025 — Oct 2025",
    accent: "#7DD3FC",
    tags: ["KiCad", "PCB", "ANC", "PPG", "IMU", "Power budgeting"],
    bullets: [
      "Researched smart-earphone architectures and produced multiple PCB layouts and simulated prototypes — evaluating Qualcomm audio platforms, ANC, Bluetooth, microphones, battery systems, PPG and IMU health sensing, and sensor fusion.",
      "Modeled board footprint, battery life and power consumption to guide an early prototype for engineers and manufacturers; led a KiCad PCB design workshop for 50 attendees.",
    ],
  },
  {
    company: "Drone Entry",
    role: "AI Software Development Intern",
    place: "Thailand",
    period: "Jun 2025 — Aug 2025",
    accent: "#A78BFA",
    tags: ["PyQt6", "YOLOv8", "U-Net", "COLMAP", "FEniCSx"],
    link: "https://github.com/00PrabalK00/OpenDroneKit",
    bullets: [
      "Built OpenDroneKit — a PyQt6 structural-inspection workflow spanning ~40,000 metal, brick and other defect images, integrating YOLOv8 detection and U-Net crack segmentation.",
      "Mapped detected cracks onto COLMAP 3D reconstructions and connected segmentation masks to FEniCSx simulations to estimate crack propagation over time and flag structural severity.",
      "Implemented desktop workflows for project setup, dataset import, defect analysis, reconstruction and report generation.",
    ],
  },
  {
    company: "Drone Academy",
    role: "R&D Summer Intern — Robotics & Drones",
    place: "Thailand",
    period: "May 2025 — Jun 2025",
    accent: "#34D399",
    tags: ["PCB", "Raspberry Pi 4", "Animatronics", "Local LLM", "TTS"],
    bullets: [
      "Designed and fabricated 3 PCBs — an animatronic head, Raspberry Pi 4 I/O, and an RC car kit — driving eye, jaw and head servos plus a speaker through GPIO.",
      "Ran text-to-speech and a 2B-parameter language model locally on an 8 GB Raspberry Pi 4; validated the RC car board for sale as a build-your-own educational product.",
    ],
  },
  {
    company: "Dreadnought Robotics",
    role: "Resource Head · Systems Department",
    place: "Chennai, India",
    period: "Aug 2023 — Jun 2025",
    accent: "#F87171",
    tags: ["ROS", "MAVROS", "MAVLink", "AUV", "Power distribution"],
    bullets: [
      "Managed a $15K+ budget, inventory and procurement for 120 members across 4 departments — comparing alternatives on cost, availability and system fit.",
      "For Project MIRA, designed electrical systems for reliable operation inside a sealed AUV pressure hull and developed ROS, MAVROS and MAVLink control software — contributing to 2nd place at TAC Challenge Norway 2024.",
      "Integrated power distribution, hydrophones and sensor-control subsystems while coordinating cross-functional testing across hardware and software teams.",
    ],
  },
];

export const smr300 = {
  name: "SMR300",
  subtitle: "300 kg industrial autonomous mobile robot",
  blurb:
    "The full autonomy stack — written to be reused across a fleet, not to survive one demo. Rebuilt from a legacy ROS 1 architecture into ROS 2 Humble, validated over 300 logged trials on a live factory floor.",
  metrics: [
    { value: 97, suffix: "%", label: "Shelf docking success", sub: "150 trials" },
    { value: 2, suffix: " cm", label: "Shelf docking error", sub: "mean" },
    { value: 3, suffix: " cm", label: "Point-to-point mismatch", sub: "down from 5 cm" },
    { value: 300, suffix: " kg", label: "Platform mass", sub: "industrial AMR" },
  ],
  stack: [
    {
      layer: "Operator layer",
      color: "#4DA6FF",
      items: [
        "Mission control & monitoring",
        "Map editor + zone management",
        "URDF / sensor configuration UI",
        "Nav2 parameter tuning",
        "Node-RED dashboard",
        "Deployment validation",
      ],
    },
    {
      layer: "Autonomy layer",
      color: "#7DD3FC",
      items: [
        "Nav2 path planning & following",
        "PGV localization + odometry fallback",
        "Shelf recognition & docking actions",
        "Sector safety gating / safe abort",
        "Obstacle detection",
        "Runtime diagnostics",
      ],
    },
    {
      layer: "Platform layer",
      color: "#A78BFA",
      items: [
        "ROS 2 Humble bringup",
        "TF tree + URDF",
        "Map management",
        "Robot profiles",
        "Workflow engine",
      ],
    },
    {
      layer: "Hardware layer",
      color: "#34D399",
      items: [
        "2D LiDAR",
        "PGV over RS-485",
        "AI camera",
        "CANopen bus",
        "CiA 402 motor drives",
        "Industrial safety I/O",
      ],
    },
  ],
  repos: [
    {
      name: "OpenRosWarehouse",
      desc: "The operator + mission layer. Browser-based control, zone and waypoint missions, template shelf recognition, directional LiDAR safety, URDF config tooling, lift-height metadata.",
      meta: "153 commits",
      url: "https://github.com/00PrabalK00/OpenRosWarehouse",
    },
    {
      name: "next_HI",
      desc: "The hardware bridge. ros2_control plugin translating velocity commands into Kinco CANopen frames, CiA 402 state machine with automatic fault recovery, lift actuator driver with limit-switch protection, motor heartbeat gating.",
      meta: "SocketCAN · ros2_control",
      url: "https://github.com/00PrabalK00/next_HI",
    },
    {
      name: "next_EKF",
      desc: "The estimation layer. Allan-variance noise characterization feeding real covariances into IMU messages, complementary filter for orientation, robot_localization EKF fusing encoders and IMU.",
      meta: "Humble · robot_localization",
      url: "https://github.com/00PrabalK00/next_EKF",
    },
    {
      name: "RosScope",
      desc: "The debug tool I built to survive the floor. Qt6/C++17 desktop app: ROS-aware process monitoring, graph and QoS inspection, TF/Nav2/lifecycle health, zombie and conflict detection, SSH fleet control, engineer vs operator modes.",
      meta: "C++17 · Qt6 · CMake",
      url: "https://github.com/00PrabalK00/RosScope",
    },
  ],
  highlights: [
    {
      title: "Reflective-marker shelf docking",
      body: "LiDAR clustering isolates two- and four-legged shelf signatures, a center check validates the pose, and automatic repositioning retries before a safe abort fires. Sector safety gating blocks motion when the approach corridor is not clean.",
    },
    {
      title: "PGV localization with graceful degradation",
      body: "PGV tag reads stream over RS-485 into a ROS 2 localization source backed by a tag map, with wheel-odometry fallback and safety conditions when tag confidence drops. Required URDF and sensor calibration plus TF corrections and confirmed SDO writes on the hardware interface.",
    },
    {
      title: "Failure diagnosis on a live floor",
      body: "Intermittent docking failures were traced to direct sunlight entering through open factory doors and saturating the reflective-marker return — an environmental failure mode, not a software regression.",
    },
    {
      title: "CiA 402 that recovers instead of stopping",
      body: "The ros2_control hardware plugin drives Kinco servos over CANopen through the full CiA 402 state machine, with automatic fault reset, motor heartbeat monitoring, and command gating that refuses motion during initialization or error states. A separate lift-actuator driver enforces limit switches independently.",
    },
    {
      title: "Estimation tuned from measured noise, not guesses",
      body: "Allan variance analysis on the IMU produced real bias-instability and random-walk terms, which were injected as covariances into the IMU messages so the EKF weights encoder versus IMU corrections on measured uncertainty rather than assumed uniform reliability.",
    },
  ],
};

export type Project = {
  name: string;
  kind: string;
  year: string;
  blurb: string;
  bullets: string[];
  tech: string[];
  link?: string;
  linkLabel?: string;
  accent: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    name: "Kurat",
    kind: "Autonomous conversational robot",
    year: "2025 — present",
    blurb:
      "A companion robot built on a three-brain architecture that separates perception, cognition and action so each can fail and recover independently.",
    bullets: [
      "Three-brain split — perception, cognition, action — for modular autonomy and reliable real-time interaction.",
      "Intel RealSense D435i + Jetson Orin Nano running YOLOv8, Whisper, ORB-SLAM3 and Nav2 for perception, speech, localization and navigation.",
    ],
    tech: ["ROS 2", "PyTorch", "YOLOv8", "Whisper", "ORB-SLAM3", "Nav2", "Jetson"],
    accent: "#4DA6FF",
    featured: true,
  },
  {
    name: "Project MIRA",
    kind: "Autonomous underwater vehicle",
    year: "2023 — 2025",
    blurb:
      "Sealed-hull AUV that took 2nd place at the TAC Challenge in Norway, 2024. I owned the electrical architecture and the MAVROS control software.",
    bullets: [
      "Electrical architecture and power distribution inside a sealed pressure hull.",
      "Hydrophone and sensor-control subsystem integration, PCB prototyping.",
      "ROS / MAVROS / MAVLink control software and cross-functional test coordination.",
    ],
    tech: ["ROS", "MAVROS", "MAVLink", "PCB", "Power distribution"],
    accent: "#38BDF8",
    featured: true,
  },
  {
    name: "OpenDroneKit",
    kind: "Structural inspection toolkit",
    year: "2025",
    blurb:
      "Offline-first drone inspection desktop app: mission planning, defect analytics, and crack propagation estimation over a 3D reconstruction.",
    bullets: [
      "~40,000 metal, brick and mixed defect images through YOLOv8 detection and U-Net crack segmentation.",
      "Cracks projected onto COLMAP reconstructions, then fed to FEniCSx to estimate propagation and flag severity.",
      "PyQt6 workflows for project setup, dataset import, analysis, reconstruction and reporting.",
    ],
    tech: ["PyQt6", "YOLOv8", "U-Net", "COLMAP", "FEniCSx", "Python"],
    link: "https://github.com/00PrabalK00/OpenDroneKit",
    linkLabel: "Repository",
    accent: "#A78BFA",
    featured: true,
  },
  {
    name: "Autonomous VTOL UAV",
    kind: "Search and rescue",
    year: "2023",
    blurb:
      "VTOL search-and-rescue platform with thermal victim detection. Top 30 of 500 teams, Smart India Hackathon 2023.",
    bullets: [
      "Raspberry Pi + Pixhawk + MAVROS airframe with OpenCV and thermal imaging for victim detection.",
      "Dataset preparation, TensorFlow Lite and YOLOv5 inference, autonomous scan patterns, custom battery management.",
    ],
    tech: ["Python", "MAVROS", "Pixhawk", "OpenCV", "TFLite", "YOLOv5"],
    accent: "#34D399",
  },
  {
    name: "RosScope",
    kind: "ROS 2 fleet diagnostics",
    year: "2026",
    blurb:
      "An oscilloscope for ROS 2. A Qt6 desktop tool that shows you what the graph is actually doing instead of making you infer it from scrolling logs.",
    bullets: [
      "ROS-aware Linux process monitoring mapped to nodes, domains, PIDs, executables and workspaces.",
      "Graph inspection across topics, QoS, TF, Nav2 and lifecycle state, with zombie-process, conflict and missing-link detection.",
      "Process control, snapshot export, session recording, and SSH-based remote fleet monitoring.",
      "Dual UI: an engineer mode for diagnostics and a stripped operator mode for the floor.",
    ],
    tech: ["C++17", "Qt6", "CMake", "ROS 2 Humble/Iron/Jazzy", "SSH"],
    link: "https://github.com/00PrabalK00/RosScope",
    linkLabel: "Repository",
    accent: "#FF6B9D",
    featured: true,
  },
  {
    name: "next_EKF",
    kind: "Odometry + IMU fusion",
    year: "2026",
    blurb:
      "Fuses wheel odometry with IMU after measuring the sensor's real noise parameters — so the filter is tuned on evidence, not on a guess.",
    bullets: [
      "Allan variance analysis extracts gyro and accelerometer bias-instability and random-walk terms.",
      "Measured covariances are injected into the IMU messages so the EKF weights corrections by quantified uncertainty.",
      "Complementary filter for orientation, then robot_localization EKF fusing encoders and IMU into a Nav2-ready odometry estimate.",
    ],
    tech: ["ROS 2 Humble", "robot_localization", "Allan variance", "C++", "EKF"],
    link: "https://github.com/00PrabalK00/next_EKF",
    linkLabel: "Repository",
    accent: "#7FE3D4",
  },
  {
    name: "next_HI",
    kind: "CANopen hardware interface",
    year: "2026",
    blurb:
      "The layer between ROS 2 and the motors: a ros2_control plugin that speaks Kinco CANopen and manages the CiA 402 state machine, including the ugly parts.",
    bullets: [
      "Velocity commands translated to Kinco CANopen frames over SocketCAN, with position integrated from velocity feedback.",
      "Automatic CiA 402 state management and fault-reset sequences; heartbeat monitoring confirms drives are actually ready.",
      "Command gating blocks motion during initialization or fault; separate lift-actuator driver enforces limit switches.",
      "SLAM Toolbox mapping and Nav2 bringup with DWB local and Navfn global planners on top.",
    ],
    tech: ["ros2_control", "CANopen", "CiA 402", "SocketCAN", "SLAM Toolbox", "Nav2"],
    link: "https://github.com/00PrabalK00/next_HI",
    linkLabel: "Repository",
    accent: "#F97316",
  },
  {
    name: "RobotDrawing",
    kind: "Learned motion planning · ABB IRB140",
    year: "2026",
    blurb:
      "Robotic drawing as a stroke-level TSP, solved by a learned router instead of a slow classical solver — same quality, roughly 20× faster.",
    bullets: [
      "Formulated at stroke level rather than point level, with forward/reverse direction optimization to cut pen-ups and travel.",
      "Graph Neural Network + Pointer Network trained in two phases: imitation learning from classical solvers, then reinforcement learning.",
      "Curriculum learning scales to 300+ strokes; ~150 ms inference per drawing, matching simulated-annealing quality ~20× faster.",
      "Driven onto an ABB IRB140 arm through a control and UI layer.",
    ],
    tech: ["PyTorch", "PyTorch Geometric", "GNN", "Pointer Network", "RL", "ABB IRB140"],
    link: "https://github.com/00PrabalK00/RobotDrawing",
    linkLabel: "Repository",
    accent: "#2DD4BF",
  },
  {
    name: "Recalibration-Free Stereo PTU",
    kind: "Perception hardware",
    year: "2025",
    blurb:
      "A stereo pan-tilt unit designed so that the extrinsics stay trustworthy without repeated manual recalibration.",
    bullets: [
      "Stereo pair on a pan-tilt mount with IMU reference and a laser anchor for absolute correction.",
      "EKF/UKF state estimation fusing SGBM block matching with MiDaS monocular depth priors.",
    ],
    tech: ["Stereo vision", "SGBM", "MiDaS", "EKF", "UKF", "IMU"],
    accent: "#60A5FA",
  },
  {
    name: "Continuum",
    kind: "Open-source AI agent memory",
    year: "2026",
    blurb:
      "Git, but for the context your AI agent is holding. Switch from Claude Code to Codex to Gemini without re-explaining the codebase, the bug, or what you already tried.",
    bullets: [
      "Three-layer architecture mirroring Git: an append-only SQLite event log, checkpoints as commits, and a materialized `current.md` view.",
      "`continuum log / diff / blame / restore / branch / merge` — plus `note`, `ask`, and semantic `search` over recorded decisions and hypotheses.",
      "Local-first: everything lives in `.continuum/`, nothing uploads by default. Ships as a Claude Code plugin and an MCP server.",
      "Repo benchmark reports 100% recall accuracy with context injection versus 17–20% without, ~94% context compression, and agent response time dropping from 17–21 s to 5.5 s.",
    ],
    tech: ["Python", "SQLite", "MCP", "Agent hooks", "CLI"],
    link: "https://github.com/00PrabalK00/Continuum",
    linkLabel: "Repository",
    accent: "#22D3EE",
    featured: true,
  },
  {
    name: "Continuum Extension",
    kind: "Browser control plane",
    year: "2026",
    blurb:
      "Turns the browser into a capture surface for Continuum — pull context out of a PR, an AI chat, or a Stack Overflow thread and route it straight to an agent.",
    bullets: [
      "Captures context from GitHub PRs and issues, ChatGPT/Claude/Gemini/Perplexity chats, docs and error pages.",
      "Secret redaction for AWS, GitHub and OpenAI credentials before anything leaves the page; per-site permissions and private-tab blocking.",
      "react-flow task graph with approval controls to pause, resume or reject individual agent steps.",
      "MV3 content scripts and side panels over a Python native-messaging host bridging to the local `continuum` CLI on 127.0.0.1:7357.",
    ],
    tech: ["React", "Vite", "Tailwind", "MV3", "Native messaging", "Python"],
    link: "https://github.com/00PrabalK00/Continuum-Extension",
    linkLabel: "Repository",
    accent: "#818CF8",
  },
  {
    name: "InfrenceX CLI",
    kind: "Agentic terminal + model marketplace",
    year: "2026",
    blurb:
      "A terminal coding agent wired to a decentralized model market — it routes each task to whichever provider is cheapest and available, and fails over without losing the conversation.",
    bullets: [
      "Ink-based TUI with live token/cost tracking and subagent monitoring.",
      "Automatic provider failover preserving conversation history; five role-aware personas and a plan-first mode requiring approval before changes.",
      "Extensible plugin framework supporting Skills and ESM/Claude-format plugins, plus an IDE JSON-RPC bridge.",
      "Dynamic model routing against the InfrenceX market with seller availability monitoring.",
    ],
    tech: ["Node.js", "Ink", "TypeScript", "JSON-RPC", "MCP"],
    link: "https://github.com/00PrabalK00/INFRX",
    linkLabel: "Repository",
    accent: "#E879F9",
  },
  {
    name: "Botopsy Lab",
    kind: "Robotics education platform",
    year: "2026",
    blurb:
      "Failure-first robotics education. Students get a broken robot, diagnose it, repair it, and prove the fix — in the browser, with automated grading.",
    bullets: [
      "Browser-accessible ROS and ROS 2 environments with VM checkpoints and save/resume.",
      "Six courses, 96 graded labs planned; separate teacher-led curriculum for grades 3–8.",
      "Diagnose → modify → test → prove loop instead of lecture-and-quiz.",
    ],
    tech: ["ROS 2", "Browser VMs", "Autograding", "Curriculum design"],
    link: "https://botopsylab.com",
    linkLabel: "botopsylab.com",
    accent: "#FF9D5C",
  },
  {
    name: "FlowPilot",
    kind: "AI control plane for Node-RED",
    year: "2026",
    blurb:
      "Built out of the Node-RED dashboards I shipped on a factory floor: an AI that drafts flows in plain English but never deploys one that hasn't survived five layers of validation.",
    bullets: [
      "Five-layer validation — JSON schema, node catalog, function-code static analysis, security scanning, and sandboxed runtime simulation.",
      "Safe deployment with snapshots, approval gates, health checks and automatic rollback on failure.",
      "Live monitoring over SSE/WebSocket, plus a role-based permission engine gating tool use by risk level.",
      "Outbound-only connector tunnels to Node-RED so the instance is never exposed to the internet.",
    ],
    tech: ["React", "Vite", "Express", "WebSocket", "SQLite", "MCP", "Node-RED"],
    link: "https://github.com/00PrabalK00/FlowPilot",
    linkLabel: "Repository",
    accent: "#C084FC",
  },
  {
    name: "ContractEncrypt",
    kind: "Post-quantum cryptography study",
    year: "2025",
    blurb:
      "Implemented lattice-based and ECC encryption side by side, then simulated quantum attacks on both to see which assumption actually survives.",
    bullets: [
      "LWE-based lattice scheme versus P-256 ECDH with AES-CBC, implemented from the primitives.",
      "Benchmarked encryption/decryption speed, ciphertext size, Shannon entropy and bit-flip resilience.",
      "Quantum attack circuits simulated in Qiskit / Qiskit-Aer against both schemes.",
    ],
    tech: ["Python", "NumPy", "PyCryptodome", "Qiskit", "LWE", "ECC"],
    link: "https://github.com/00PrabalK00/ContractEncrypt",
    linkLabel: "Repository",
    accent: "#94A3B8",
  },
];

/** Smaller builds — the bench, not the portfolio. */
export const benchProjects = [
  {
    name: "FaceTrack",
    desc: "OpenCV face detection driving two servos through an Arduino over serial — vision to actuation in the shortest possible loop.",
    tech: "Python · OpenCV · Arduino",
    link: "https://github.com/00PrabalK00/FaceTrack",
  },
  {
    name: "Gesture-Controlled Car",
    desc: "IMU glove commanding a car over ESP-NOW — no pairing, no router, sub-frame latency.",
    tech: "C++ · ESP-NOW · Arduino",
    link: "https://github.com/00PrabalK00/Gesture-Controlled-Car",
  },
  {
    name: "smr300l_gazebo_ros2control",
    desc: "Gazebo simulation of the SMR300L with ros2_control, so autonomy changes could be regression-tested off the factory floor.",
    tech: "Gazebo · ros2_control",
    link: "https://github.com/00PrabalK00/smr300l_gazebo_ros2control",
  },
  {
    name: "claude-skills",
    desc: "Reusable agent skills packaged for Claude Code — the tooling layer under my own workflow.",
    tech: "Shell · Agent skills",
    link: "https://github.com/00PrabalK00/claude-skills",
  },
];

export const patents = [
  {
    title: "Transformation Drone — Autonomous Drone-Rover System",
    number: "202641035669",
    status: "Filed",
    body: "One vehicle that drives and flies. Four arms carry both the propellers and geared drive wheels, so it rolls through terrain on the ground and lifts off when the ground runs out — with AI-driven visual and thermal detection for search and rescue in GPS-denied environments.",
    tags: ["UAV-UGV", "Search & rescue", "GPS-denied", "Thermal", "Raspberry Pi"],
  },
  {
    title: "Thermoregulation System for Portable Water Containers",
    number: "Number pending",
    status: "Filed",
    body: "A smart bottle that heats or cools its own contents. A Peltier stack under the body circulates water through inlet and outlet lines, with a sealed compartment for the microcontroller, battery and wiring, and an integrated pill dispenser on the side — so medication and the water to take it with travel together.",
    tags: ["Peltier", "Thermal design", "BMS", "Pill dispenser", "Embedded"],
  },
  {
    title: "IMU Calibration and Sensor Fusion Module",
    number: "Number pending",
    status: "Filed",
    body: "Bias, scale-factor and misalignment calibration with complementary and EKF-based fusion for stable attitude estimation under vibration.",
    tags: ["IMU", "Calibration", "EKF", "Attitude estimation"],
  },
];

export const skills = [
  {
    group: "Programming",
    items: ["C++", "Python", "JavaScript", "TypeScript", "MATLAB"],
  },
  {
    group: "Robotics & Autonomy",
    items: [
      "ROS 2 Humble",
      "ROS 1",
      "Nav2",
      "SLAM",
      "tf2",
      "URDF",
      "RViz",
      "Gazebo",
      "Localization",
      "Path planning",
      "Robot bringup",
      "AMRs",
      "MAVROS",
      "MAVLink",
    ],
  },
  {
    group: "Controls & Embedded",
    items: [
      "CANopen",
      "CiA 402",
      "RS-485",
      "PID control",
      "Sensor fusion",
      "EKF / UKF",
      "Raspberry Pi",
      "Arduino",
      "Pixhawk",
      "Motor drivers",
      "PCB design",
      "KiCad",
    ],
  },
  {
    group: "Perception & Vision",
    items: [
      "OpenCV",
      "YOLOv8",
      "U-Net",
      "PyTorch",
      "TensorFlow",
      "ORB-SLAM3",
      "COLMAP",
      "RealSense D435i",
      "LiDAR",
      "PGV",
      "SGBM",
      "MiDaS",
    ],
  },
  {
    group: "Tools & Platforms",
    items: [
      "Linux",
      "Docker",
      "Git",
      "Node-RED",
      "PyQt6",
      "FEniCSx",
      "Jetson Orin Nano",
      "CUDA",
      "TensorRT",
      "MCP servers",
    ],
  },
];

export const honors = [
  {
    title: "TAC Challenge Norway 2024",
    result: "2nd Place",
    body: "International autonomous underwater vehicle competition — Project MIRA.",
    year: "2024",
  },
  {
    title: "Smart India Hackathon 2024",
    result: "Top 5 of 400",
    body: "National hardware and software innovation competition.",
    year: "2024",
  },
  {
    title: "Smart India Hackathon 2023",
    result: "Top 30 of 500",
    body: "Autonomous VTOL search-and-rescue UAV.",
    year: "2023",
  },
  {
    title: "GEOFEST CMU 2020",
    result: "2nd Place",
    body: "Carnegie Mellon University geoscience festival.",
    year: "2020",
  },
  {
    title: "KiCad PCB Design Workshop",
    result: "50 attendees",
    body: "Led hands-on PCB layout training for engineering students.",
    year: "2025",
  },
  {
    title: "Machine Learning Workshop",
    result: "100+ students",
    body: "Led an applied ML workshop for the university robotics community.",
    year: "2024",
  },
];

export const leadership = [
  { value: 15000, prefix: "$", suffix: "+", label: "Budget managed" },
  { value: 120, suffix: "", label: "Team members supported" },
  { value: 4, suffix: "", label: "Departments" },
  { value: 150, suffix: "+", label: "Students taught" },
];

/**
 * Media slots. Drop matching files into /public/media/ and they light up
 * automatically — every slot degrades to a styled placeholder if absent.
 * Filenames are documented in /public/media/MANIFEST.md.
 */
export type MediaSlot = {
  file: string;
  type: "image" | "video";
  caption: string;
  group: string;
  /** Layout weight in the gallery grid. Hero spans the full row. */
  span?: "hero" | "wide" | "normal" | "tall";
};

export const mediaSlots: MediaSlot[] = [
  /* ---------------- present in /public/media ---------------- */
  {
    file: "Shelf_Docking_SMR300.mp4",
    type: "video",
    caption: "Autonomous shelf docking — approach, align, lift",
    group: "SMR300",
    span: "hero",
  },
  {
    file: "SMR300_onFactoryFloor.jpeg",
    type: "image",
    caption: "SMR300 on the factory floor, squaring up to a shelf",
    group: "SMR300",
    span: "wide",
  },
  {
    file: "UI_SMR300ControlPlane.jpeg",
    type: "image",
    caption: "Operator control plane — live scan, path editor, safety groups",
    group: "SMR300",
    span: "wide",
  },
  {
    file: "PGV_Mode_SMR300.mp4",
    type: "video",
    caption: "PGV mode — tag-referenced localization run",
    group: "SMR300",
    span: "wide",
  },
  {
    file: "MIRA_AUV.jpeg",
    type: "image",
    caption:
      "Project MIRA — extruded aluminium frame, ducted thrusters, domed pressure housings",
    group: "Project MIRA",
    span: "hero",
  },
  {
    file: "TAC_PhotowithThrophy.jpeg",
    type: "image",
    caption: "Second place, TAC Challenge Norway 2024 — Dreadnought Robotics",
    group: "Project MIRA",
    span: "wide",
  },
  {
    file: "transformationdrone_rovermode.jpeg",
    type: "image",
    caption: "Transformation Drone — rover mode, driving on geared hubs",
    group: "Patents",
    span: "wide",
  },
  {
    file: "transformationdrone_dronemode.jpeg",
    type: "image",
    caption: "Transformation Drone — flight mode, arms deployed",
    group: "Patents",
    span: "wide",
  },
  {
    file: "thermobottle.jpg",
    type: "image",
    caption:
      "Thermoregulating bottle — Peltier loop, sealed electronics bay, pill dispenser",
    group: "Patents",
  },
  {
    file: "VTOL.jpeg",
    type: "image",
    caption:
      "VTOL search-and-rescue quadplane — plank wing, four lift rotors, exposed avionics",
    group: "UAV",
    span: "hero",
  },
  {
    file: "DNT_Team_Pic.jpeg",
    type: "image",
    caption: "Dreadnought Robotics — 120 members, 4 departments",
    group: "Team",
    span: "wide",
  },
  {
    file: "portrait.jpg",
    type: "image",
    caption: "Prabal Khare",
    group: "Team",
    span: "tall",
  },

  /* ---------------- wanted, still empty ---------------- */
  { file: "smr300-rviz.jpg", type: "image", caption: "Nav2 costmap and planned path in RViz", group: "SMR300" },
  { file: "smr300-nodered.jpg", type: "image", caption: "Node-RED operator dashboard", group: "SMR300" },
  { file: "rosscope-ui.jpg", type: "image", caption: "RosScope — engineer mode", group: "SMR300" },

  { file: "mira-electronics.jpg", type: "image", caption: "Sealed-hull electronics and power distribution", group: "Project MIRA" },
  { file: "mira-underwater.mp4", type: "video", caption: "MIRA under test", group: "Project MIRA", span: "wide" },

  { file: "transform-drone.mp4", type: "video", caption: "Ground-to-air transition", group: "Patents", span: "wide" },

  { file: "vtol-flight.mp4", type: "video", caption: "VTOL flight test", group: "UAV", span: "wide" },

  { file: "kurat-robot.jpg", type: "image", caption: "Kurat companion robot", group: "Kurat", span: "tall" },
  { file: "robotdrawing-abb.mp4", type: "video", caption: "ABB IRB140 drawing a learned stroke route", group: "Hardware", span: "wide" },
  { file: "pcb-animatronic.jpg", type: "image", caption: "Animatronic head PCB", group: "Hardware" },
  { file: "pcb-rccar.jpg", type: "image", caption: "RC car control board", group: "Hardware" },
  { file: "opendronekit-ui.jpg", type: "image", caption: "OpenDroneKit — defect analysis", group: "Hardware" },

  { file: "workshop-kicad.jpg", type: "image", caption: "KiCad workshop — 50 attendees", group: "Team", span: "wide" },
];

/** Only the slots whose files actually exist should drive the default view. */
export const SHIPPED_MEDIA = new Set([
  "Shelf_Docking_SMR300.mp4",
  "SMR300_onFactoryFloor.jpeg",
  "UI_SMR300ControlPlane.jpeg",
  "PGV_Mode_SMR300.mp4",
  "MIRA_AUV.jpeg",
  "TAC_PhotowithThrophy.jpeg",
  "transformationdrone_rovermode.jpeg",
  "transformationdrone_dronemode.jpeg",
  "thermobottle.jpg",
  "DNT_Team_Pic.jpeg",
  "portrait.jpg",
  "VTOL.jpeg",
]);
