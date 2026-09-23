import type { Project } from "./types";

export const smr300sim: Project = {
  slug: "smr300-sim",
  title: "smr300l_gazebo_ros2control",
  subtitle: "The SMR300 in simulation, so changes could be tested off the floor",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "bench",
  order: 4,

  thesis:
    "A factory floor is a bad place to find out an autonomy change was wrong, so the robot exists in Gazebo too.",

  summary:
    "A Gazebo simulation of the SMR300L with ros2_control, used to regression-test autonomy changes away from the physical robot. Also the simulator Ripple runs against.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/smr300l_gazebo_ros2control",
      kind: "repo",
    },
  ],

  stack: ["Gazebo", "ros2_control", "ROS 2"],

  built: {
    heading: "What it does",
    body: [
      "Models the SMR300L with the same ros2_control interfaces the real robot uses, so a navigation or docking change can be exercised before it reaches hardware. Ripple's demonstrations run against this simulator.",
    ],
  },

  limitations: [
    "A simulator agrees with the robot exactly as far as its model does. It catches logic regressions, not the sunlight-on-a-reflective-marker class of failure.",
  ],

  attribution: [{ kind: "built-by-me", detail: "The simulation and its control configuration." }],

  related: ["smr300", "ripple"],
};
