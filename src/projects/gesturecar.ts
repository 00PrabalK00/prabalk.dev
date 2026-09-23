import type { Project } from "./types";

export const gesturecar: Project = {
  slug: "gesture-car",
  title: "Gesture-Controlled Car",
  subtitle: "An IMU glove commanding a car over ESP-NOW",
  status: "completed",
  year: "2023",
  role: "Author",
  category: "bench",
  order: 3,

  thesis:
    "No pairing, no router, no broker — ESP-NOW puts the glove and the car on the same link and nothing else is in the way.",

  summary:
    "Gesture data from an IMU glove transmitted as binary over ESP-NOW, received by an ESP device and passed to an Arduino over serial for motor control.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/Gesture-Controlled-Car",
      kind: "repo",
    },
  ],

  stack: ["C++", "ESP-NOW", "Arduino", "IMU"],

  built: {
    heading: "What it does",
    body: [
      "The glove reads orientation and packs it into a small binary frame. ESP-NOW carries it without an access point or a pairing step, which is the reason latency stays inside a frame.",
    ],
  },

  gallery: [
    {
      file: "gesture-car.jpg",
      type: "image",
      caption: "The glove and the car — an IMU on the back of the hand, the receiver on the chassis",
    },
  ],

  limitations: ["Bench project. No failsafe — losing the link does not stop the car."],

  attribution: [{ kind: "built-by-me", detail: "Glove, link and motor control." }],

  related: [],
};
