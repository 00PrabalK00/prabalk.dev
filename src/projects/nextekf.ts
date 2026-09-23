import type { Project } from "./types";

/**
 * next_EKF.
 *
 * Part of the SMR300 stack rather than a standalone product, but it earns a
 * page because the interesting part is methodological: the filter was tuned
 * from measured sensor noise instead of from guessed covariances.
 */
export const nextekf: Project = {
  slug: "next-ekf",
  subdomain: "nextekf",
  title: "next_EKF",
  subtitle: "Odometry and IMU fusion, tuned from measured noise",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "robot-systems",
  order: 5,
  compact: true,

  thesis:
    "Most EKF tuning is a guess dressed as a covariance. This one measures the IMU's actual noise first, then hands the filter numbers it can trust.",

  summary:
    "Fuses wheel odometry with IMU after characterising the sensor with Allan variance analysis. Bias instability and random-walk terms are extracted from real data and injected as covariances, so the filter weights encoder against IMU corrections on quantified uncertainty rather than assumed uniform reliability.",

  links: [
    { label: "Repository", href: "https://github.com/00PrabalK00/next_EKF", kind: "repo" },
  ],

  stack: ["ROS 2 Humble", "robot_localization", "Allan variance", "EKF", "C++"],

  problem: {
    heading: "Problem",
    body: [
      "An EKF is only as good as the covariances it is given, and in practice those are usually copied from an example or tuned until the output looks smooth. Smooth is not the same as correct — a filter can be confidently wrong in exactly the situations that matter.",
      "The IMU on this robot has real, measurable noise characteristics. Using them is cheaper than guessing and produces a filter whose behaviour can be explained.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["A characterisation step, then the fusion that consumes it."],
    points: [
      "Allan variance analysis extracting gyro and accelerometer bias-instability and random-walk terms",
      "Measured covariances injected into the IMU messages themselves",
      "Complementary filter for orientation",
      "robot_localization EKF fusing encoders and IMU into a Nav2-ready odometry estimate",
    ],
  },

  flows: [
    {
      title: "From raw sensor to a filter that can be justified",
      steps: [
        { label: "Log the IMU at rest", detail: "Long enough for the Allan deviation curve to be meaningful." },
        { label: "Allan variance analysis", detail: "Reads bias instability and random walk off the curve." },
        { label: "Inject the measured terms as covariances", detail: "Into the IMU messages, so the consumer does not have to be told separately." },
        { label: "EKF fuses encoders and IMU", detail: "Weighting each by quantified uncertainty." },
        { label: "Nav2-ready odometry", tone: "good" },
      ],
    },
  ],

  limitations: [
    "The measured terms describe this IMU on this platform. A different unit needs its own characterisation — the method transfers, the numbers do not.",
  ],

  attribution: [
    { kind: "built-by-me", detail: "The characterisation, the covariance injection and the fusion configuration." },
    { kind: "based-on-external-research", detail: "robot_localization and Allan variance analysis are established work." },
  ],

  related: ["smr300", "next-hi"],
};
