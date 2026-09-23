import type { Project } from "./types";

/**
 * SO101 / SmolVLA.
 *
 * Deliberately makes no performance claim. The work so far is hardware
 * bring-up and the validation that rules out wiring mistakes before a policy
 * gets blamed for them — which is the honest state of it, and is itself the
 * thing worth showing.
 */
export const so101: Project = {
  slug: "so101",
  subdomain: "so101",
  title: "SO101 Manipulation and SmolVLA Experiments",
  subtitle: "Policy training and evaluation on the LeRobot SO101 platform",
  status: "active-research",
  year: "2025 — present",
  role: "Author",
  category: "current-research",
  order: 3,

  thesis:
    "Before a manipulation policy can be judged, the pipeline feeding it has to be proven correct — so the first result here is that replayed actions reproduce their demonstrations.",

  summary:
    "A manipulation direction built on the LeRobot SO101 platform: hardware bring-up, a two-camera setup, SmolVLA training, and MuJoCo evaluation. The validated work so far is infrastructural — dataset checks, action replay, camera and normalisation verification — which is what has to be true before any policy number means anything.",

  links: [],

  stack: [
    "LeRobot",
    "SO101",
    "SmolVLA",
    "MuJoCo",
    "Python",
    "PyTorch",
  ],

  problem: {
    heading: "Problem",
    body: [
      "Most reported manipulation failures are not policy failures. They are camera ordering, normalisation, action scaling or dataset construction failures wearing a policy's name.",
      "The goal of this phase was to make that class of explanation unavailable before drawing any conclusion about the policy itself.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["Hardware, training and the evaluation scaffolding around both."],
    points: [
      "SO101 hardware setup with a two-camera configuration",
      "Leader and follower system bring-up",
      "SmolVLA training and dataset validation",
      "MuJoCo evaluation work",
      "Action replay verification through the evaluator",
      "Camera pipeline and image consistency verification",
      "State and action normalisation verification",
      "Policy chunking investigation",
      "Real-robot deployment preparation",
    ],
  },

  deepDive: [
    {
      heading: "Ruling out the wiring before blaming the policy",
      body: [
        "Recorded actions were replayed through the evaluator and reproduced successful demonstrations, with joint trajectories agreeing very closely. That single check invalidates a whole family of explanations for a future failure.",
        "Image consistency and state/action normalisation were verified separately, so a mismatch in either can be excluded rather than argued about.",
      ],
    },
  ],

  flows: [
    {
      title: "Ruling out the wiring, in order",
      caption:
        "Each step removes a class of explanation for a future failure. Running them in this order means that when a policy does underperform, the reason is not one of these.",
      steps: [
        { label: "Record demonstrations", detail: "Leader arm teleoperates the follower; two cameras record what the policy will see." },
        { label: "Validate the dataset", tone: "decision",
          branches: [
            { label: "Malformed episodes — fix before training, not after", tone: "bad" },
          ] },
        { label: "Replay the recorded actions through the evaluator", tone: "decision",
          branches: [
            { label: "Demonstrations reproduce, joint trajectories agree closely — the pipeline is sound", tone: "good" },
            { label: "They do not — the fault is in the harness, not the policy", tone: "bad" },
          ] },
        { label: "Verify the camera pipeline", detail: "Image consistency between what was recorded and what the policy is fed." },
        { label: "Verify state and action normalisation", detail: "So a scaling mismatch cannot masquerade as a policy failure." },
        { label: "Train SmolVLA, evaluate in MuJoCo", detail: "Only now does a policy number mean anything." },
        { label: "Real-robot deployment", detail: "In preparation, not done.", tone: "bad" },
      ],
    },
  ],

  tables: [
    {
      title: "What is verified, and what is not",
      caption:
        "Stated plainly because this project is early, and an active-research page that implies more than it has is worse than one that admits where it is.",
      head: ["Item", "State"],
      rows: [
        ["Hardware bring-up, leader and follower", "Working"],
        ["Two-camera setup", "Working"],
        ["Dataset validation", "Verified"],
        ["Action replay reproduces demonstrations", "Verified — joint trajectories agree closely"],
        ["Image consistency", "Verified"],
        ["State/action normalisation", "Verified"],
        ["Policy chunking behaviour", "Under investigation"],
        ["SmolVLA task performance", "No claim made"],
        ["Real-robot deployment", "In preparation"],
      ],
    },
  ],

  limitations: [
    "No policy performance claim is made yet. The validated work is infrastructural.",
    "Evaluation is in MuJoCo; real-robot deployment is in preparation, not done.",
    "Active research — nothing here should be read as a final result.",
  ],

  gallery: [
    {
      file: "so101-hardware.jpg",
      type: "image",
      caption:
        "Both cameras at the start and end of an episode — front (the policy's input) and wrist. Checking these against what the policy was actually fed is how a camera-ordering fault gets ruled out instead of argued about",
    },
    {
      file: "so101-cameras.jpg",
      type: "image",
      caption: "Front RealSense and wrist views from the real-arm workspace",
    },
    {
      file: "so101-rollout.mp4",
      type: "video",
      caption: "A SmolVLA rollout on the SO101",
    },
  ],

  attribution: [
    {
      kind: "based-on-external-research",
      detail:
        "LeRobot, the SO101 platform and SmolVLA are upstream work.",
    },
    {
      kind: "built-by-me",
      detail:
        "Hardware bring-up, the two-camera configuration, training runs, dataset validation and the evaluation and verification tooling.",
    },
    {
      kind: "experiment-by-me",
      detail:
        "Action replay verification, camera and normalisation checks, and the policy chunking investigation.",
    },
  ],

  related: ["ripple"],
};
