import type { Project } from "./types";

export const facetrack: Project = {
  slug: "facetrack",
  title: "FaceTrack",
  subtitle: "Vision to actuation in the shortest possible loop",
  status: "completed",
  year: "2023",
  role: "Author",
  category: "bench",
  order: 2,

  thesis:
    "OpenCV finds a face, two servos follow it, and nothing sits between them but a serial line.",

  summary:
    "Webcam frames through OpenCV face detection, forehead coordinates computed and sent over serial to an Arduino driving two servos. Deliberately the smallest complete perception-to-actuation loop.",

  links: [
    { label: "Repository", href: "https://github.com/00PrabalK00/FaceTrack", kind: "repo" },
  ],

  stack: ["Python", "OpenCV", "Arduino"],

  built: {
    heading: "What it does",
    body: [
      "Captures frames, detects a face, computes the forehead point, and sends coordinates over serial. The Arduino maps them to two servo angles.",
    ],
  },

  limitations: ["A bench exercise. No smoothing, no prediction, and it loses the face the moment detection drops a frame."],

  gallery: [
    {
      file: "facetrack-demo.mp4",
      type: "video",
      caption:
        "The whole loop on a desk — OpenCV finding a face on screen while the servos below follow it over serial",
    },
  ],

  attribution: [{ kind: "built-by-me", detail: "Both halves." }],

  related: [],
};
