import type { Project } from "./types";

/**
 * Pushpak Viman / Transformation Drone.
 *
 * Combines the VTOL search-and-rescue work and the drone-rover transformation
 * patent into one story, since they share a motivation and a platform lineage.
 */
export const pushpak: Project = {
  slug: "pushpak",
  subdomain: "pushpak",
  title: "Pushpak Viman",
  subtitle: "Search-and-rescue UAV and the drone-rover transformation system",
  status: "completed",
  year: "2023 — 2025",
  role: "Author",
  category: "autonomy-and-perception",
  order: 4,

  thesis:
    "One vehicle that drives until the ground runs out and then flies, built for search and rescue in places where GPS does not work and a victim has to be found by heat.",

  summary:
    "A VTOL search-and-rescue platform with thermal victim detection — top 30 of 500 teams at Smart India Hackathon 2023 — and the patent-filed transformation system that followed it: four arms carrying both propellers and geared drive wheels, so the vehicle rolls over terrain and lifts off when it has to.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/Project-Pushpak-Viman-SIH",
      kind: "repo",
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
      "Search and rescue in a collapsed or GPS-denied environment has two failure modes: the vehicle cannot reach the space, and the victim cannot be seen. Ground robots get blocked; aircraft cannot enter confined spaces or linger.",
      "Thermal and visual detection answers the second problem. The transformation system answers the first.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["A flying search platform, then a vehicle that does not have to choose."],
    points: [
      "Raspberry Pi + Pixhawk + MAVROS airframe with OpenCV and thermal imaging for victim detection",
      "Dataset preparation with TensorFlow Lite and YOLOv5 inference",
      "Autonomous scan patterns and custom battery management",
      "Transformation system: four arms carrying both propellers and geared drive wheels",
      "AI-driven visual and thermal detection for GPS-denied environments",
    ],
  },

  flows: [
    {
      title: "Finding someone who cannot be seen",
      caption:
        "Search and rescue in a collapsed or GPS-denied space has two failure modes — the vehicle cannot reach it, and the victim cannot be seen. The transformation answers the first; thermal answers the second.",
      steps: [
        { label: "Launch over the search area", detail: "Pixhawk and MAVROS on a Raspberry Pi airframe." },
        { label: "Autonomous scan pattern" },
        { label: "Can the vehicle reach the space?", tone: "decision",
          branches: [
            { label: "Ground is passable — drive on the geared wheels" },
            { label: "Ground runs out — the same four arms lift it off" },
          ] },
        { label: "Detect", detail: "OpenCV and thermal imaging, with YOLOv5 via TensorFlow Lite on board.", tone: "decision",
          branches: [
            { label: "Thermal signature with visual confirmation — flag it", tone: "good" },
            { label: "Nothing — continue the pattern" },
          ] },
        { label: "Report position to the rescue team", tone: "good" },
      ],
    },
  ],

  tables: [
    {
      title: "One vehicle, two modes",
      caption:
        "The patent filing covers the arrangement: four arms carrying both the propellers and geared drive wheels, so neither mode needs separate hardware.",
      head: ["Mode", "Uses", "For"],
      rows: [
        ["Rover", "Geared drive wheels on the same four arms", "Rubble, confined spaces, long dwell time"],
        ["Drone", "Propellers on those arms", "Obstacles the ground cannot cross, overhead search"],
        ["Both", "Visual and thermal detection, GPS-denied operation", "Finding a person who cannot be seen"],
      ],
    },
  ],

  metrics: [
    {
      value: "Top 30",
      label: "Smart India Hackathon 2023",
      context: "Of 500 teams.",
    },
  ],

  limitations: [
    "Prototype and competition scope; not validated in a real rescue deployment.",
  ],

  gallery: [
    { file: "VTOL.jpeg", type: "image", caption: "The VTOL search-and-rescue airframe" },
    { file: "TransformationDroneVideo.mp4", type: "video", caption: "Transformation between drone and rover modes" },
    { file: "transformationdrone_dronemode.jpeg", type: "image", caption: "Drone mode" },
    { file: "transformationdrone_rovermode.jpeg", type: "image", caption: "Rover mode" },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "The airframe integration, detection pipeline, scan patterns and battery management, and the transformation system described in the patent filing.",
    },
    {
      kind: "based-on-external-research",
      detail: "YOLOv5, TensorFlow Lite, Pixhawk and MAVROS are upstream.",
    },
  ],

  related: ["opendronekit", "mira"],
};
