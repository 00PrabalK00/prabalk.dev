import type { Project } from "./types";

/**
 * Autonomous VTOL UAV.
 *
 * Separated from Pushpak Viman, which the portfolio had been treating as one
 * project. They are not: this is a prototype airframe with no repository, and
 * Pushpak Viman is the victim-detection work that has one.
 */
export const vtol: Project = {
  slug: "vtol",
  subdomain: "vtol",
  title: "Autonomous VTOL UAV",
  subtitle: "A search-and-rescue airframe with thermal victim detection",
  status: "completed",
  year: "2023",
  role: "Author",
  category: "autonomy-and-perception",
  order: 5,

  thesis:
    "A vertical-takeoff platform built to search an area no one can walk into, and to find a person by heat rather than by sight.",

  summary:
    "A VTOL search-and-rescue prototype on a Raspberry Pi and Pixhawk airframe, flying autonomous scan patterns with OpenCV and thermal imaging for victim detection. Detection ran on board through TensorFlow Lite and YOLOv5, with a custom battery-management arrangement for the endurance the scan patterns needed.",

  links: [
    {
      label: "Flight footage",
      href: "https://www.youtube.com/@evtol459",
      kind: "video",
    },
  ],

  stack: [
    "Python",
    "MAVROS",
    "Pixhawk",
    "Raspberry Pi",
    "OpenCV",
    "TensorFlow Lite",
    "YOLOv5",
    "Thermal imaging",
  ],

  problem: {
    heading: "Problem",
    body: [
      "Searching a disaster site from the ground is slow and sometimes impossible. Searching it from the air is fast and nearly useless if the only sensor is a colour camera pointed at rubble that looks like more rubble.",
      "Vertical takeoff matters for the same reason: there is rarely a runway where the search is.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["An airframe that can take off anywhere and detect on board."],
    points: [
      "Raspberry Pi and Pixhawk airframe flown through MAVROS",
      "Autonomous scan patterns over the search area",
      "OpenCV and thermal imaging for victim detection",
      "Dataset preparation, with TensorFlow Lite and YOLOv5 inference on board",
      "Custom battery management for the endurance a scan pattern needs",
    ],
  },

  flows: [
    {
      title: "A search pass",
      caption:
        "Detection runs on the aircraft rather than on a ground station, because the link is the first thing to go at a disaster site.",
      steps: [
        { label: "Vertical takeoff", detail: "No runway needed, which is the point of the airframe." },
        { label: "Fly the scan pattern", detail: "Autonomous coverage of the search area via MAVROS." },
        { label: "Detect on board", detail: "Thermal and visual, TFLite and YOLOv5 on the Raspberry Pi.", tone: "decision",
          branches: [
            { label: "Heat signature with visual support — flag the position", tone: "good" },
            { label: "Nothing — continue the pattern" },
          ] },
        { label: "Report to the rescue team", tone: "good" },
      ],
    },
  ],

  limitations: [
    "A prototype. It was flown and it detected, but it was never deployed in a real rescue and has no repository behind it.",
    "Thermal detection finds warm bodies, which in a real site includes fires, machinery and animals. Discrimination was not solved.",
  ],

  gallery: [
    {
      file: "VTOL.jpeg",
      type: "image",
      caption: "The airframe",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "The airframe integration, flight software, scan patterns, detection pipeline and battery management.",
    },
    {
      kind: "based-on-external-research",
      detail: "Pixhawk, MAVROS, YOLOv5 and TensorFlow Lite are upstream.",
    },
  ],

  related: ["pushpak"],
};
