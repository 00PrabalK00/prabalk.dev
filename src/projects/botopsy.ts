import type { Project } from "./types";

/**
 * Botopsy Lab.
 *
 * Has its own product domain, so this page is a case study that links out
 * rather than a second marketing site.
 */
export const botopsy: Project = {
  slug: "botopsy",
  subdomain: "botopsy",
  title: "Botopsy Lab",
  subtitle: "Failure-first robotics education",
  status: "active-development",
  year: "2026",
  role: "Author",
  category: "infrastructure",
  order: 7,

  thesis:
    "Students get a broken robot, diagnose it, repair it, and prove the fix — because that is the loop the job actually consists of.",

  summary:
    "Browser-accessible ROS and ROS 2 environments with VM checkpoints and save/resume, built around a diagnose-modify-test-prove loop instead of lecture-and-quiz. Six courses and 96 graded labs planned, plus a separate teacher-led curriculum for grades 3–8.",

  links: [{ label: "botopsylab.com", href: "https://botopsylab.com", kind: "site" }],

  stack: ["ROS 2", "Browser VMs", "Autograding", "Curriculum design"],

  problem: {
    heading: "Problem",
    body: [
      "Robotics teaching usually hands a student a working system and asks them to extend it. The actual job is the opposite: something is broken, the logs are unhelpful, and the skill is narrowing it down.",
      "Setting up ROS is also the first thing that stops people, and it teaches nothing.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["An environment where the robot is already broken, and grading checks that you proved the fix."],
    points: [
      "Browser-accessible ROS and ROS 2 environments — no local install",
      "VM checkpoints with save and resume, so a lab can be left and returned to",
      "Six courses, 96 graded labs planned",
      "Diagnose → modify → test → prove loop with automated grading",
      "A separate teacher-led curriculum for grades 3–8",
    ],
  },

  gallery: [
    {
      file: "botopsy-lab.png",
      type: "image",
      caption:
        "The premise, stated on the front page — a broken ROS 2 system, the real tools, and a test that checks your fix rather than your answer",
    },
  ],

  limitations: [
    "Course and lab counts are the plan, not the shipped total.",
  ],

  attribution: [
    { kind: "built-by-me", detail: "The platform, curriculum design and the grading model." },
  ],

  related: ["rosscope"],
};
