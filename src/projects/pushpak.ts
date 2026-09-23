import type { Project } from "./types";

/**
 * Pushpak Viman.
 *
 * Rewritten after the portfolio was found to be treating this and the VTOL
 * prototype as one project. They are separate: the VTOL is an airframe, and
 * Pushpak Viman is the victim-detection work — a dataset pipeline, detection
 * models and real-time inference, on a drone-rover platform that can drive to
 * where it cannot fly.
 *
 * Team project, led by the author. The attribution section says so rather than
 * implying sole authorship of the implementation.
 */
export const pushpak: Project = {
  slug: "pushpak",
  subdomain: "pushpak",
  title: "Pushpak Viman",
  subtitle: "Finding people under debris, from a transforming drone",
  status: "completed",
  year: "2023 to 2025",
  role: "Team lead",
  category: "autonomy-and-perception",
  order: 4,

  thesis:
    "A rescue vehicle that drives where it cannot fly, and a detection pipeline trained to find a person in rubble rather than a person in a photograph.",

  summary:
    "An autonomous rescue initiative built around victim detection from aerial and ground imagery. A victim-under-debris dataset prepared and split, annotations converted from Pascal VOC through to TFRecord, detection models trained and run in real time, and hand-landmark tracking for gesture control, on a platform whose four arms carry both propellers and geared drive wheels.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/Project-Pushpak-Viman-SIH",
      kind: "repo",
    },
    {
      label: "Footage",
      href: "https://www.youtube.com/@evtol459",
      kind: "video",
    },
  ],

  stack: [
    "Python",
    "OpenCV",
    "TensorFlow Lite",
    "YOLOv5",
    "MediaPipe",
    "PyTorch",
    "Pascal VOC",
    "TFRecord",
  ],

  problem: {
    heading: "Problem",
    body: [
      "A person trapped under debris does not look like a person. They look like an arm, or a patch of fabric, in an image mostly made of broken concrete, which is a different detection problem from the one most models are trained on.",
      "Reaching them is a second problem. A ground vehicle gets blocked; an aircraft cannot enter a confined space or linger. The platform carries propellers and geared drive wheels on the same four arms so it does not have to choose.",
    ],
  },

  built: {
    heading: "What we built",
    body: [
      "A complete pipeline from raw dataset to real-time inference, and the vehicle it runs on.",
    ],
    points: [
      "Automated splitting of a victim-under-debris dataset",
      "Annotation conversion from Pascal VOC XML through CSV to TFRecord",
      "Detection model training and inference with TensorFlow Lite and YOLOv5",
      "Real-time video and image inference with bounding-box visualisation",
      "Hand-landmark tracking via MediaPipe for gesture-based control",
      "Satellite land-cover classification for navigation context",
      "A drone-rover platform whose arms carry both propellers and drive wheels",
    ],
  },

  flows: [
    {
      title: "From a dataset to a vehicle that can act on it",
      caption:
        "Most of the work is before the model, a detection pipeline is only as good as the annotations feeding it, and converting them correctly is where the time goes.",
      steps: [
        { label: "Collect victim-under-debris imagery" },
        {
          label: "Split the dataset",
          detail:
            "Automated, so the train/test boundary is reproducible rather than ad hoc.",
        },
        {
          label: "Convert annotations",
          detail: "Pascal VOC XML → CSV → TFRecord.",
        },
        {
          label: "Train detection models",
          detail: "TensorFlow Lite and YOLOv5.",
        },
        {
          label: "Real-time inference with visualisation",
          tone: "decision",
          branches: [
            {
              label: "Detection, flag the position for the rescue team",
              tone: "good",
            },
            { label: "Nothing, keep searching" },
          ],
        },
        {
          label: "Reach the location",
          detail:
            "Drive on the geared wheels, or fly when the ground runs out.",
          tone: "good",
        },
      ],
    },
  ],

  tables: [
    {
      title: "One vehicle, two modes",
      caption:
        "The arrangement is the subject of a patent filing: four arms carrying both the propellers and the geared drive wheels, so neither mode needs separate hardware.",
      head: ["Mode", "Uses", "For"],
      rows: [
        [
          "Rover",
          "Geared drive wheels on the four arms",
          "Rubble, confined spaces, long dwell time",
        ],
        [
          "Drone",
          "Propellers on those same arms",
          "Ground the vehicle cannot cross, overhead search",
        ],
        [
          "Both",
          "Visual detection and GPS-denied operation",
          "Finding a person who cannot be seen",
        ],
      ],
    },
  ],

  limitations: [
    "Detection was trained and evaluated on a collected dataset, not validated in a real rescue.",
    "The satellite land-cover work supports navigation context; it is not a victim-detection result.",
    "A prototype and a competition entry, not a deployed system.",
  ],

  gallery: [
    {
      file: "pushpak-detection.mp4",
      type: "video",
      caption: "Detection running on imagery, with bounding boxes drawn live",
    },
    {
      file: "TransformationDroneVideo.mp4",
      type: "video",
      caption: "The platform changing between drone and rover",
    },
    {
      file: "transformationdrone_dronemode.jpeg",
      type: "image",
      caption: "Drone mode",
    },
    {
      file: "transformationdrone_rovermode.jpeg",
      type: "image",
      caption: "Rover mode",
    },
  ],

  attribution: [
    {
      kind: "my-contribution-in-a-team",
      detail:
        "Pushpak Viman is my project and I led the team. The detection pipeline in the repository was implemented with teammates rather than by me alone.",
    },
    {
      kind: "built-by-me",
      detail:
        "The transforming drone-rover arrangement, which is the subject of a patent filing.",
    },
    {
      kind: "based-on-external-research",
      detail:
        "YOLOv5, TensorFlow Lite and MediaPipe are upstream. The satellite land-cover dataset is from the MDPI Remote Sensing journal.",
    },
  ],

  related: ["vtol", "opendronekit"],
};
