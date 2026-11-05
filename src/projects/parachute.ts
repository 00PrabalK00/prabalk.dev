import type { Project } from "./types";

/**
 * Data-driven parachute design.
 *
 * NYU Tandon course project, still in its simulation phase. Every number here
 * is a simulation estimate and is labelled as one: the physical drops that
 * would decide the question have not happened yet, and the page should not
 * read as if they had.
 */
export const parachute: Project = {
  slug: "parachute",
  subdomain: "parachute",
  title: "Data-Driven Parachute Design",
  subtitle: "Can a data-driven search beat a hole in the middle?",
  status: "active-research",
  year: "2026",
  role: "Author, course team project",
  category: "current-research",
  order: 1,

  thesis:
    "Compare data-driven design methods on one honest question: given 250 cm² of plastic, which canopy shape lands slowest, and does a search over shapes find anything a central vent does not.",

  summary:
    "A MuJoCo drop simulator, OpenFOAM CFD on form-found canopies, a Gaussian-process surrogate and seven optimisers benchmarked on the same budget. In simulation the GA rediscovered the central vent, and a fresh CFD check showed its surrogate had been optimistic. Physical drops are next.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/DataDriven",
      kind: "repo",
    },
  ],

  stack: [
    "MuJoCo",
    "OpenFOAM",
    "MATLAB",
    "Python",
    "pymoo",
    "scikit-learn",
    "ESP32-S3",
    "BNO085",
  ],

  problem: {
    heading: "Problem",
    body: [
      "The setup is deliberately small: 250 cm² of plastic cut into any flat 2D shape, six lines, a payload dropped from 4 m. Free fall lands at 8.9 m/s. The objective is the lowest landing speed, with pitch stability as a second objective.",
      "The course question is comparative: which data-driven design methods, encodings, dimensionality reduction, surrogate models and optimisers, actually help on a problem like this, judged by one scoring rule applied identically to every method. The obvious baseline is a plain canopy with a hole in the middle, and the interesting outcome is whether a search can beat it.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "The whole pipeline to date, from shape encoding to the benchmark, with every output tagged by evidence level so a simulation estimate cannot be mistaken for a measured result.",
    ],
    points: [
      "Shape encodings at 3, 7 and 9 variables, from outline and slit parameters to the heights of 61 smooth bumps in 9 symmetric groups; every design must be cuttable, and 78% of free-form samples pass",
      "Form-finding by dynamic relaxation, turning a flat cut pattern into an inflated canopy shape",
      "PCA, autoencoder and VAE dimensionality reduction over 1,883 sampled shapes",
      "OpenFOAM v2406 CFD (k-ω SST) on form-found canopies, checked against reference drag coefficients for a disc and a cup",
      "MuJoCo drop simulator with a virtual BNO085 IMU and virtual RealSense RGB-D, writing the same observation bundle a real drop will produce",
      "A shared sim/real estimation pipeline: ArUco PnP, depth detection, LED clock sync, an error-state EKF with an RTS smoother",
      "Gaussian-process surrogate and a benchmark of GA, PSO, multi-objective GA, Bayesian optimisation, simulated annealing, tabu search and random search",
      "ESP32-S3 IMU logger firmware and a printed drop-day kit with cutting templates for the real tests",
    ],
  },

  flows: [
    {
      title: "From encoding to a checked design",
      caption:
        "The surrogate is cheap enough to search and wrong enough to need checking. Winners go back through fresh CFD rather than being reported off the model.",
      steps: [
        {
          label: "Encode a shape",
          detail: "3, 7 or 9 design variables; uncuttable shapes are rejected.",
        },
        {
          label: "Form-find and run CFD",
          detail: "Dynamic relaxation for the inflated shape, then OpenFOAM.",
        },
        {
          label: "Fit the surrogate",
          detail: "Gaussian process trained on the design-of-experiments runs.",
        },
        {
          label: "Search on the surrogate",
          detail: "GA, PSO, Bayesian optimisation and others, 200 evaluations each.",
        },
        {
          label: "Fresh CFD on the winners",
          tone: "decision",
          branches: [
            { label: "Surrogate optimistic by 0.06 to 0.17 m/s", tone: "bad" },
            { label: "All five checked winners inflated stably", tone: "good" },
          ],
        },
        {
          label: "Real drops decide",
          detail: "Pending. Simulation estimates are not the result.",
        },
      ],
    },
  ],

  metrics: [
    {
      value: "6.31 m/s",
      label: "Lowest checked landing speed, 12% central vent",
      context:
        "CFD estimate under the simulation's assumed payload and drop height, against 6.45 m/s for the plain canopy and 8.9 m/s free fall. Not yet a physical measurement.",
    },
    {
      value: "0.97",
      label: "Held-out IoU, 9-D autoencoder",
      context:
        "Reconstruction overlap on sampled shapes the autoencoder never trained on, out of 1,883 sampled shapes.",
    },
    {
      value: "−0.052 m/s",
      label: "GA median best score against random search",
      context:
        "200 evaluations × 10 runs per method on the surrogate, with 0.03 m/s test noise. GA median 6.260 m/s against 6.312 m/s for random search.",
    },
    {
      value: "780",
      label: "CFD runs in the inflation scan",
      context:
        "Converged designs at both angles; 64% stable. Plus 130 CFD runs on canopies and 45 form-found converged designs.",
    },
  ],

  tables: [
    {
      title: "Optimiser benchmark",
      caption:
        "Median best surrogate landing speed found, 200 evaluations × 10 runs. Lower is better. Simulation estimates.",
      head: ["Method", "Median (m/s)", "IQR (m/s)"],
      rows: [
        ["GA", "6.260", "0.020"],
        ["PSO", "6.271", "0.018"],
        ["Multi-objective GA", "6.288", "0.041"],
        ["Bayesian optimisation", "6.293", "0.023"],
        ["Simulated annealing", "6.303", "0.043"],
        ["Random search", "6.312", "0.016"],
        ["Tabu search", "6.475", "0.248"],
      ],
    },
    {
      title: "Surrogate against fresh CFD",
      caption: "The three GA winners, as predicted and as re-checked.",
      head: ["Design", "Predicted (m/s)", "CFD (m/s)"],
      rows: [
        ["GA winner 1", "6.27", "6.33"],
        ["GA winner 2", "6.27", "6.44"],
        ["GA winner 3", "6.27", "6.36"],
      ],
    },
  ],

  experiments: [
    {
      name: "Vent against plain canopy",
      question: "Does a central hole land slower than a plain canopy of the same area?",
      method:
        "CFD on form-found canopies with 0%, 12%, 30% and 49% open area, then 45 converged designs across open fractions.",
      result:
        "The 12% vent gave 6.31 m/s against 6.45 m/s plain, 0.14 m/s slower with 54% less pitch instability, though not yet self-righting. Around 10% open did best; above 30% drag falls away and speed rises.",
    },
    {
      name: "Can a search beat the vent?",
      question:
        "Does a data-driven search over nine shape variables find a canopy that beats the 12% vent?",
      method:
        "GA on the GP surrogate, 200 evaluations, with the best designs re-checked by fresh CFD.",
      result:
        "The GA reinvented the central hole. Its best design predicted 6.27 m/s but checked at 6.33 m/s in CFD, so the vent keeps the lowest checked estimate by 0.02 m/s, a gap with no uncertainty estimate yet.",
      negative: true,
    },
    {
      name: "Is three repeats enough for the real drops?",
      question: "How many physical drops per design does the comparison need?",
      method: "Power estimate assuming 0.06 m/s drop-to-drop noise.",
      result:
        "Three repeats can detect a 0.139 m/s gap, about the same size as the vent's whole 0.14 m/s gain, so three repeats per design is not enough.",
      negative: true,
    },
  ],

  limitations: [
    "Every number is a simulation estimate. Physical validation is pending, and no design is claimed to win until real drops say so.",
    "The simulated canopy is rigid, so slits barely open (under 1 mm) and cannot show inflation; their effect enters only through the aerodynamic map.",
    "Optimising on the surrogate also finds the surrogate's mistakes: checked winners came in 0.06 to 0.17 m/s slower than predicted.",
    "Payload mass, line length and canopy mass are still placeholders, and the tilted-canopy CFD runs on a coarse mesh.",
  ],

  gallery: [
    {
      file: "parachute-ga-search.mp4",
      type: "video",
      caption: "The GA searching nine shape variables; grey shapes are infeasible",
    },
    {
      file: "parachute-inflation.mp4",
      type: "video",
      caption: "Form-finding, flat cut pattern to inflated canopy",
    },
    {
      file: "parachute-encoding.mp4",
      type: "video",
      caption: "How nine variables make a canopy, always 250 cm² of plastic",
    },
    {
      file: "parachute-sim-drop.mp4",
      type: "video",
      caption: "Simulated drop with virtual RealSense RGB-D, slow motion",
    },
    {
      file: "parachute-open-area.jpg",
      type: "image",
      caption: "Landing speed against open area, 45 converged designs",
    },
    {
      file: "parachute-surrogate-check.jpg",
      type: "image",
      caption: "Fresh CFD against the surrogate's predictions for the GA winners",
    },
    {
      file: "parachute-benchmark.jpg",
      type: "image",
      caption: "Optimiser benchmark, median best score against random search",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "All code, simulation, CFD, surrogate modelling, optimisation, firmware and analysis to date.",
    },
    {
      kind: "my-contribution-in-a-team",
      detail:
        "Course team project for ROB-GY 7863B at NYU Tandon with Pranav Lavande and Walter Kimball. The midway presentation was delivered by all three of us.",
    },
    {
      kind: "based-on-external-research",
      detail:
        "MuJoCo, OpenFOAM, pymoo and scikit-learn are upstream tools; dynamic relaxation (Day, 1965), k-ω SST (Menter, 1994), the VAE (Kingma & Welling, 2014) and NSGA-II (Deb et al., 2002) are upstream methods. Reference drag coefficients from Hoerner (1965).",
    },
  ],

  related: ["wren", "ripple"],
};
