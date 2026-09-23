import type { Project } from "./types";

/**
 * Recalibration-Free Stereo PTU.
 *
 * Presented as calibration and state estimation research rather than as
 * "perception hardware", which is what the previous one-line description
 * reduced it to.
 */
export const stereoptu: Project = {
  slug: "stereoptu",
  subdomain: "stereoptu",
  title: "Recalibration-Free Stereo PTU",
  subtitle: "Calibration and state estimation for a moving stereo pair",
  status: "completed",
  year: "2025",
  role: "Author",
  category: "autonomy-and-perception",
  order: 3,

  thesis:
    "A stereo pan-tilt unit whose extrinsics stay trustworthy as it moves, so the rig does not need to be recalibrated by hand every time it is used.",

  summary:
    "A stereo pair on a pan-tilt mount with an IMU reference and a laser anchor for absolute correction, with a six-state EKF estimating and correcting the errors that normally force recalibration, servo backlash and drift. Evaluated in synthetic and real conditions with reprojection and ablation analysis.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/Pan-Tilt-Calib",
      kind: "repo",
    },
  ],

  stack: [
    "Stereo vision",
    "SGBM",
    "MiDaS",
    "EKF",
    "UKF",
    "MPU9250",
    "VL53L0X",
    "Jetson Orin Nano",
  ],

  problem: {
    heading: "Problem",
    body: [
      "A stereo rig on a pan-tilt mount loses its calibration the moment it moves. Servo backlash and drift accumulate, the extrinsics stop describing the actual geometry, and depth quietly degrades until someone recalibrates by hand.",
      "Treating this as a state estimation problem rather than a maintenance chore is the point of the project.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["The rig, and the estimator that keeps it honest."],
    points: [
      "Stereo pair on a pan-tilt mount with MPU9250 IMU reference",
      "Laser anchor (VL53L0X) providing an absolute correction",
      "Six-state EKF with explicit backlash estimation and drift correction",
      "SGBM block matching fused with MiDaS monocular depth priors",
      "CAD, plus synthetic and real evaluation",
      "Reprojection analysis and ablation analysis",
    ],
  },

  flows: [
    {
      title: "Keeping the extrinsics honest",
      caption:
        "The rig loses calibration the moment it moves. Rather than recalibrating by hand, the errors that cause the drift are estimated as part of the state.",
      steps: [
        { label: "Command a pan/tilt move" },
        {
          label: "Servo backlash and drift accumulate",
          detail: "The extrinsics stop describing the actual geometry.",
          tone: "bad",
        },
        {
          label: "Six-state EKF",
          detail:
            "Backlash estimated explicitly rather than assumed away; IMU (MPU9250) provides the inertial reference.",
        },
        {
          label: "Laser anchor correction",
          detail:
            "A VL53L0X range to a known anchor gives an absolute correction, not just a relative one.",
        },
        {
          label: "Depth from stereo",
          detail: "SGBM block matching fused with MiDaS monocular priors.",
        },
        {
          label: "Reprojection error stays bounded, no manual recalibration",
          tone: "good",
        },
      ],
    },
  ],

  tables: [
    {
      title: "The rig",
      head: ["Part", "Role"],
      rows: [
        [
          "Stereo pair on a pan-tilt mount",
          "The sensor whose extrinsics are the problem",
        ],
        ["MPU9250 IMU", "Inertial reference for the filter"],
        ["VL53L0X laser anchor", "Absolute correction against a known point"],
        ["Jetson Orin Nano", "Runs estimation and depth"],
        ["Six-state EKF", "Backlash estimation and drift correction"],
      ],
    },
  ],

  experiments: [
    {
      name: "Synthetic and real evaluation",
      question:
        "Does modelling backlash and drift keep the extrinsics valid without manual recalibration?",
      method:
        "Synthetic and real evaluation with reprojection error analysis, plus ablations isolating the contribution of each estimator component.",
      result:
        "Ablation analysis separates what the backlash estimation, drift correction and laser anchor each contribute.",
    },
  ],

  limitations: [
    "Evaluated on one rig; the backlash model is fitted to this mount's characteristics.",
  ],

  gallery: [
    {
      file: "stereoptu-rig.jpg",
      type: "image",
      caption: "The rig, stereo pair on the pan-tilt mount, as modelled",
    },
    {
      file: "stereoptu-ablation.png",
      type: "image",
      caption:
        "Ablation: mean reprojection error with each estimator component removed",
    },
    {
      file: "stereoptu-reproj.png",
      type: "image",
      caption: "Reprojection error over time as backlash and drift accumulate",
    },
  ],

  attribution: [
    { kind: "built-by-me", detail: "Hardware, CAD, estimator and evaluation." },
    {
      kind: "based-on-external-research",
      detail: "SGBM and MiDaS are upstream methods.",
    },
  ],

  related: ["opendronekit", "smr300"],
};
