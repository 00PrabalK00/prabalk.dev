import type { Project } from "./types";

/**
 * RobotDrawing.
 *
 * Rewritten against the repository's own measurements rather than its README.
 *
 * The README advertises "SA-level quality with 20x speedup", from a table
 * giving SA 3000 ms and the learned router 150 ms. The committed batch run over
 * 28 images measures something else entirely: SA at 195 ms and the learned
 * router at 10,880 ms, with slightly worse pen-up counts. On the largest image
 * in the set the router took 4.7 minutes against SA's 1.9 seconds.
 *
 * Publishing the README number would have been repeating a claim this project's
 * own data contradicts. The measured result is reported instead, and the gap is
 * stated as an open question rather than resolved in either direction — the
 * 150 ms figure may well be model inference alone, with stroke extraction and
 * post-processing outside it, but nothing in the repository establishes that.
 */
export const robotdrawing: Project = {
  slug: "robotdrawing",
  subdomain: "robotdrawing",
  title: "RobotDrawing",
  subtitle: "Learned stroke routing for a simulated ABB IRB140",
  status: "completed",
  year: "2026",
  role: "Author",
  category: "autonomy-and-perception",
  order: 2,

  thesis:
    "Robotic drawing posed as a stroke-level routing problem, solved with a graph network and pointer decoder, and then measured honestly against the classical solvers it was meant to beat.",

  summary:
    "Drawing with a robot arm is a routing problem: which stroke next, and in which direction, to minimise pen-ups and travel. Formulated at stroke level rather than point level and solved with a GNN plus Pointer Network trained by imitation then reinforcement learning. On the committed 28-image benchmark the learned router did not beat simulated annealing on either axis, which is the result, and it is reported as such.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/RobotDrawing",
      kind: "repo",
    },
  ],

  stack: [
    "PyTorch",
    "PyTorch Geometric",
    "GNN",
    "Pointer Network",
    "Reinforcement learning",
    "CoppeliaSim",
    "ABB RAPID",
  ],

  problem: {
    heading: "Problem",
    body: [
      "Classical solvers produce good stroke orderings and take time to do it. At point level the problem is also far larger than it needs to be, the decision that matters is the order and direction of strokes, not of individual points.",
      "The hypothesis was that a learned router could match simulated annealing's ordering quality at a fraction of the runtime, by amortising the search into a trained model.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "A learned router, the classical baselines to judge it against, and the control layer that puts a stroke order on a real arm.",
    ],
    points: [
      "Stroke-level formulation with forward/reverse direction optimisation to cut pen-ups and travel",
      "GNN + Pointer Network trained in two phases: imitation learning warm-started from the classical solvers, then reinforcement learning",
      "Curriculum learning from simple to complex graphs",
      "RAPID export with configurable module, reference point, tool and velocity",
      "Greedy nearest-neighbour and simulated-annealing baselines",
      "A 28-image batch harness reporting pen-ups, pen-up distance, continuity and runtime per method",
      "Feature and flooding ablations",
      "A stroke-planning UI that exports ABB RAPID and drives an IRB140 in CoppeliaSim",
    ],
  },

  deepDive: [
    {
      heading: "Measuring it properly is what produced the result",
      body: [
        "The batch harness runs all three methods over the same 28 images and records runtime and quality per method per image, rather than reporting a representative figure. That is the only reason the gap between the README's claim and the system's behaviour is visible at all.",
        "The honest summary: simulated annealing wins on quality, greedy nearest-neighbour wins on speed by a wide margin, and the learned router currently loses on both.",
      ],
    },
  ],

  flows: [
    {
      title: "The pipeline, and where it was measured",
      caption:
        "The benchmark harness is the part that matters: all three methods run over the same 28 images and every image records runtime and quality per method. That is the only reason the gap between the README's claim and the system's behaviour is visible.",
      steps: [
        { label: "An image comes in" },
        {
          label: "Extract strokes",
          detail:
            "The problem is posed at stroke level rather than point level, the decision that matters is order and direction, not individual points.",
        },
        { label: "Build the stroke graph" },
        {
          label: "Route it",
          tone: "decision",
          branches: [
            { label: "Greedy nearest neighbour, 18 ms, 27.0 pen-ups" },
            {
              label: "Simulated annealing, 195 ms, 26.8 pen-ups",
              tone: "good",
            },
            {
              label: "Learned router (GNN + Pointer Net), 10.9 s, 28.8 pen-ups",
              tone: "bad",
            },
          ],
        },
        {
          label: "Direction flipping",
          detail: "Forward/reverse optimisation to cut pen-ups and travel.",
        },
        {
          label: "Export RAPID and draw it",
          detail:
            "The planned order is exported as an ABB RAPID module and executed by a simulated IRB140 in CoppeliaSim. No physical arm has run this.",
          tone: "good",
        },
      ],
    },
  ],

  tables: [
    {
      title: "The benchmark",
      caption:
        "28 images, all three methods, identical inputs. Lower is better on both columns. The README advertises ~150 ms inference and a 20× speedup over SA; these are the numbers the committed run actually produced.",
      head: ["Method", "Avg pen-ups", "Avg runtime"],
      rows: [
        ["Simulated annealing", "26.8", "195 ms"],
        ["Greedy nearest neighbour", "27.0", "18 ms"],
        ["Learned router", "28.8", "10,880 ms"],
      ],
    },
  ],

  metrics: [
    {
      value: "26.8 / 27.0 / 28.8",
      label: "Avg pen-ups, SA / greedy / learned",
      context: "Lower is better. Across the committed 28-image batch.",
    },
    {
      value: "195 ms / 18 ms / 10.9 s",
      label: "Avg runtime, SA / greedy / learned",
      context: "Same batch. The learned router is ~56× slower than SA here.",
    },
    {
      value: "28",
      label: "Images in the benchmark",
      context: "Each run through all three methods with identical inputs.",
    },
  ],

  experiments: [
    {
      name: "Learned routing vs. classical optimisation",
      question:
        "Can a learned router match simulated annealing's stroke-ordering quality at a fraction of the runtime?",
      method:
        "GNN + Pointer Network trained by imitation then RL, benchmarked against greedy nearest-neighbour and simulated annealing over 28 images on pen-ups, pen-up distance, continuity and wall-clock runtime.",
      result:
        "No. The learned router averaged 28.8 pen-ups against SA's 26.8, and 10.9 s against SA's 195 ms. The amortisation hypothesis did not hold on this benchmark.",
      negative: true,
    },
  ],

  limitations: [
    "The repository README advertises ~150 ms inference and a 20× speedup over SA. The committed batch results do not reproduce that, and the two have not been reconciled, the 150 ms may measure model inference alone, excluding stroke extraction and post-processing, but nothing in the repository establishes it.",
    "The learned router loses to simulated annealing on quality and to greedy nearest-neighbour on speed on this benchmark.",
    "28 images is a small benchmark, and pen-up counts vary enormously across them (0 to 302), so the averages hide a wide spread.",
    "The IRB140 is simulated in CoppeliaSim. RAPID is exported for a real controller, but no physical arm has ever executed one of these drawings, so nothing here is evidence about real-world tracking, pen pressure or mechanical repeatability.",
  ],

  gallery: [
    {
      file: "robotdrawing-compare.png",
      type: "image",
      caption:
        "Quality against runtime across all three methods. The learned router sits where you would least want it, slowest and highest pen-up count",
    },
    {
      file: "robotdrawing-runtime.png",
      type: "image",
      caption: "Runtime by method across the 28-image batch",
    },
    {
      file: "robotdrawing-penups.png",
      type: "image",
      caption: "Pen-up counts by method, lower is better",
    },
    {
      file: "robotdrawing-sim.png",
      type: "image",
      caption:
        "A simulated IRB140 with a felt pen drawing the planned stroke order in CoppeliaSim, the only arm that has ever executed one of these routes",
    },
    {
      file: "robotdrawing-ui.png",
      type: "image",
      caption:
        "The stroke-planning UI, contour graph and routed order for one image, solver selection, and the RAPID export panel that targets a real controller",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "Formulation, models, training, the benchmark harness, the stroke-planning UI and the RAPID export and CoppeliaSim integration.",
    },
    {
      kind: "experiment-by-me",
      detail:
        "The 28-image benchmark against classical solvers, including the negative result reported above.",
    },
  ],

  related: ["opendronekit"],
};
