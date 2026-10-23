import type { Project } from "./types";

/**
 * Wren.
 *
 * Replaces the earlier "SO101 Manipulation and SmolVLA Experiments" entry,
 * which described the bring-up phase. The bring-up became a policy: a small
 * flow-matching visuomotor model for the same SO-101 arm, with trained-in
 * real-time chunking and Jetson inference. Everything here comes from the
 * public repository's README (github.com/00PrabalK00/wren), including the
 * caveat that the real-arm result is small-n and not yet significant.
 */
export const wren: Project = {
  slug: "wren",
  subdomain: "wren",
  title: "Wren",
  subtitle: "A small, fast visuomotor policy for low-cost robot arms",
  status: "active-development",
  year: "2026",
  role: "Author",
  category: "robot-systems",
  order: 2,

  thesis:
    "The recipe behind billion-parameter robot policies, scaled down about 30× to a $200 arm and a Jetson, and measured on real hardware.",

  summary:
    "Wren looks through a scene camera and a wrist camera, reads the joint angles, and outputs the next 1.6 s of motion for a 6-DoF SO-101 arm. 61M trainable parameters: a shared DINOv2 encoder, a transformer trunk and a flow-matching DiT action expert with trained-in real-time chunking. It trains on one 8 GB laptop GPU in about 6 hours and runs at about 110 ms per query on a Jetson Orin Nano.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/wren",
      kind: "repo",
    },
  ],

  stack: [
    "PyTorch",
    "LeRobot",
    "DINOv2",
    "Flow matching",
    "Jetson Orin Nano",
    "CUDA graphs",
    "SO-101",
  ],

  problem: {
    heading: "Problem",
    body: [
      "The policies that work on real arms are large: hundreds of millions to billions of parameters, trained on clusters, run on desktop GPUs. A $200 arm with an edge computer cannot use them, and the ones small enough to fit tend to jitter at every chunk boundary.",
      "The question was whether the evidence-backed recipe, pretrained patch tokens, flow matching and trained-in chunk continuity, survives being scaled down to hardware a student can buy.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "The policy and everything around it, from recording demonstrations to running on the Jetson.",
    ],
    points: [
      "The model: DINOv2 ViT-S/14 shared by both cameras, 80 patch tokens per view so spatial layout survives, a 6-layer transformer trunk and a 6-block flow-matching DiT action expert",
      "Training-time real-time chunking: a random clean prefix is excluded from the loss, so the model learns to continue a plan already under way",
      "Edge inference: sampling is shape-static, so the whole prediction is one CUDA graph, cutting Jetson model time from 288 ms to 83 ms",
      "A real-time runner with async inference, timestamped chunks, a 50 Hz servo executor and per-query logs",
      "A ZMQ inference server on the Jetson Orin Nano",
      "Episode Studio, a web app for 100 Hz teleoperation, LeRobot recording and live policy tests",
      "A literature review behind every design choice: 7,162 abstracts screened, about 480 papers read in full",
    ],
  },

  architecture: {
    heading: "Architecture",
    body: [
      "Scene and wrist cameras go through one shared DINOv2 encoder, fine-tuned at a tenth of the trunk's learning rate. Their 160 patch tokens, a joint-state token and a task token form a 162-token memory for a 6-layer transformer trunk.",
      "A flow-matching DiT action expert cross-attends to that memory and turns Gaussian noise into 16 absolute joint targets, 1.6 s at 10 fps, in 8 Euler steps. The first steps can be pinned to the plan the arm is already executing, which is what makes consecutive chunks join without blending.",
    ],
  },

  deepDive: [
    {
      heading: "Chunk continuity is trained in, not blended",
      body: [
        "During training, a random prefix of 0 to 4 steps is given clean and excluded from the loss. On the robot, each new chunk is pinned to what the arm will be doing when it lands, so consecutive chunks meet without a blending step.",
        "On the real arm the median switch jump is 0.2°, against several degrees for ACT. Offline, chunk-switch disagreement at 60k steps drops from 1.7° to 0.7° with it.",
      ],
    },
    {
      heading: "Never blind at the gripper",
      body: [
        "30% of scene tokens are masked, and occasionally the whole scene view, but the wrist camera is never dropped. Joint angles get about 1° of noise and are hidden 30% of the time, so the model cannot just copy them.",
        "Augmentation jitters brightness, contrast, saturation and sharpness but never hue, because the colour of the object is signal.",
      ],
    },
  ],

  flows: [
    {
      title: "One query, end to end",
      caption:
        "What happens every time the runner asks for the next chunk. The pinned prefix is the step that removes the jitter.",
      steps: [
        {
          label: "Capture",
          detail: "Scene camera streamed from the Jetson, wrist camera over USB, six joint angles.",
        },
        {
          label: "Encode",
          detail: "Shared DINOv2, 80 patch tokens per camera, into a 162-token memory.",
        },
        {
          label: "Pin the prefix",
          detail: "The steps the arm will already be executing are fixed, not sampled.",
          tone: "decision",
        },
        {
          label: "Sample",
          detail: "8 Euler steps of flow matching, captured as one CUDA graph.",
        },
        {
          label: "Execute about 0.6 s, then switch",
          detail: "50 Hz servo executor; the next chunk lands on top of this one.",
          tone: "good",
        },
      ],
    },
  ],

  tables: [
    {
      title: "Real arm, pick up a pumpkin and place it in a tray",
      caption:
        "Scored from saved frames on 2026-09-27. Small n and not interleaved, so the difference is not statistically significant yet. Both policies share the same failure: hovering at the grasp without committing.",
      head: ["Policy", "Success", "Switch-jump p90"],
      rows: [
        ["Wren 60k (61M)", "7/10", "0.7–4.2°"],
        ["ACT 80k (baseline)", "5/9", "1.6–1.8°"],
        [
          "SmolVLA (450M, fine-tuned)",
          "Completed the task in earlier informal runs",
          "~350 ms per query; needed RTC and smoothing to stop jitter",
        ],
      ],
    },
  ],

  metrics: [
    {
      value: "61M",
      label: "Trainable parameters",
      context: "Trains in about 6 h on one 8 GB laptop GPU.",
    },
    {
      value: "108 ms",
      label: "Round trip on a Jetson Orin Nano",
      context: "After capturing the prediction as one CUDA graph; 314 ms before.",
    },
    {
      value: "7/10",
      label: "Real-arm successes",
      context: "Against ACT's 5/9. Small n, not yet significant.",
    },
  ],

  experiments: [
    {
      name: "Real-arm trials against ACT",
      question:
        "Does the scaled-down recipe beat a standard baseline on the real arm?",
      method:
        "100 teleoperated episodes (19,832 frames) over two camera positions and several lighting setups; Wren 60k and ACT 80k run on the same task and scored from saved frames.",
      result:
        "7/10 for Wren against 5/9 for ACT. Not statistically significant yet; the next step is an interleaved 10-spot round, then targeted demos at the failing spots.",
    },
    {
      name: "Jetson latency",
      question: "Can it run fast enough on edge hardware to react?",
      method:
        "Per-stage latency benchmark on a Jetson Orin Nano in 25 W mode with clocks pinned.",
      result:
        "Eager PyTorch was limited by the ARM CPU issuing kernels, not by the GPU. One CUDA graph took model time from 288 ms to 83 ms and the round trip to 108 ms.",
    },
  ],

  limitations: [
    "The real-arm result is small n and not interleaved; the difference from ACT is not statistically significant yet.",
    "Offline errors are measured on frames that were also in training, so they are optimistic.",
    "One task so far: pick up a pumpkin and place it in a tray.",
    "Every component has close prior work. The contribution is empirical, this combination at this scale on real hardware, not a new mechanism.",
  ],

  gallery: [
    {
      file: "wren-pumpkin.mp4",
      type: "video",
      caption: "Wren on the real SO-101, reaching for the pumpkin",
    },
    {
      file: "wren-pumpkin-trials.mp4",
      type: "video",
      caption:
        "Real-arm trials: pick up the pumpkin and place it in the tray, including a run where the pumpkin is moved by hand mid-episode",
    },
    {
      file: "so101-cameras.jpg",
      type: "image",
      caption:
        "What the policy sees: the scene camera and the wrist camera on the SO-101 workspace",
    },
    {
      file: "so101-rollout.mp4",
      type: "video",
      caption: "The SO-101 arm running a policy rollout",
    },
    {
      file: "so101-hardware.jpg",
      type: "image",
      caption:
        "Front and wrist views at the start and end of an episode, checked against what the policy was actually fed",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "The policy, training recipe, real-time runner, Jetson inference server, Episode Studio and the literature review are mine.",
    },
    {
      kind: "based-on-external-research",
      detail:
        "DINOv2 (Meta), LeRobot and the SO-101 arm are upstream. The design follows published work on flow matching, DiT action experts and training-time real-time chunking (Black et al.), with CT-VAM, ABC-DiT, FlowDPG and MINERVA as the closest prior art.",
    },
    {
      kind: "experiment-by-me",
      detail: "The real-arm trials against ACT and the Jetson latency work.",
    },
  ],

  related: ["ripple", "kurat"],
};
