import type { Project } from "./types";

/**
 * OpenDroneKit.
 *
 * Rewritten again once the project got its own site, opendronekit.com. That
 * site's /facts page is checked line by line against a pinned commit of the
 * public repository, so it is the source of truth here — not the older
 * portfolio copy, which still described a PyQt6 desktop app (it has no Qt
 * dependency; the shell is Edge WebView2) and a YOLOv8 / U-Net / FEniCSx
 * stack that is no longer what ships.
 *
 * The design principle worth stating outright is still "refuse rather than
 * fabricate": without a model it declines to guess and says why, and a
 * finding keeps the exact weights that produced it.
 */
export const opendronekit: Project = {
  slug: "opendronekit",
  subdomain: "opendronekit",
  title: "OpenDroneKit",
  subtitle:
    "Open-source, offline-first drone inspection and GIS toolkit for Windows",
  status: "active-development",
  year: "2025 to present",
  role: "Author",
  category: "autonomy-and-perception",
  order: 1,

  thesis:
    "Survey, inspect and measure. Nothing leaves your laptop.",

  summary:
    "A free, open-source desktop app that takes a drone inspection from flight plan to client report on the operator's own machine. It plans the mission, flies it over MAVLink, reconstructs the photos into georeferenced maps and elevation models that open in QGIS, marks cracks, corrosion and solar faults for a person to review, measures in metres rather than pixels, and writes the report.",

  links: [
    {
      label: "opendronekit.com",
      href: "https://opendronekit.com",
      kind: "site",
    },
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/OpenDroneKit",
      kind: "repo",
    },
  ],

  stack: [
    "Python 3.11",
    "COLMAP",
    "MAVLink 2 / ArduPilot",
    "SegFormer",
    "YOLO11",
    "SQLite / PostGIS",
    "Edge WebView2",
    "SITL",
  ],

  problem: {
    heading: "Problem",
    body: [
      "Infrastructure inspection happens where the connectivity is not. A system that assumes a cloud backend is useless on a bridge, a tower or a remote site, which is where the inspections are.",
      "The second problem is trust. An inspection tool that guesses produces reports nobody can act on: a fabricated defect wastes a crew's day, and a missed one is a structural risk. Deciding what the system does when it is uncertain is a design question, not an implementation detail.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "One desktop app covering the whole inspection loop in six steps: plan, fly, reconstruct, detect, measure, report.",
    ],
    points: [
      "Plan: 22 mission templates, from grid and corridor to facade, tower, wind turbine and orbit, laid out with geofence containment, no-fly detours, altitude bands and terrain-aware AGL or AMSL following",
      "Export to six autopilot formats: QGroundControl .plan, QGC WPL 110, DJI WPML .kmz, Litchi CSV, KML and GeoJSON",
      "Fly: MAVLink 2 upload of mission, geofence and rally points to ArduPilot, tested against Copter 4.5.7 in SITL",
      "Reconstruct: COLMAP structure-from-motion with georeferencing, producing a Cloud-Optimized GeoTIFF orthomosaic, DSM, DTM, hillshade, point cloud and mesh in a real coordinate system",
      "Detect: trained models mark cracks, corrosion and solar faults for a person to review, each finding stamped with the SHA-256 of the weights that produced it",
      "Measure: area, perimeter, volume and change against the real DSM and DTM",
      "Report: HTML, PDF, DOCX and Markdown from the same report sections",
      "Projects in SQLite, with PostgreSQL and PostGIS optional for multi-user deployments",
    ],
  },

  architecture: {
    heading: "Architecture",
    body: [
      "Plan, fly, reconstruct, detect, measure, report, with each stage producing artefacts the next can verify rather than trust. Georeferencing is solved at reconstruction, as a RANSAC Helmert similarity between camera centres and image geotags, so defects and measurements land in world coordinates rather than image coordinates.",
      "Everything runs on the operator's machine: processing, detection, measurement and reporting. Requesting cloud reconstruction runs locally and says so; no imagery leaves the machine.",
    ],
  },

  deepDive: [
    {
      heading: "Refuse rather than fabricate",
      body: [
        "The governing design rule. Without a model, the AI declines to guess and explains why. Without georeferenced rasters, the report states that measurements are absent rather than printing zeros. A mock flight driver exists for testing and is always labelled SIMULATED in the UI.",
        "A finding keeps the model key, the SHA-256 of the weights and its confidence. The reviewer's decision is stored separately, so review never erases what the model asserted, and a replaced weights file is reported as a mismatch rather than trusted.",
      ],
    },
    {
      heading: "Status is computed, not claimed",
      body: [
        "A capability counts as verified only when the tests it names pass against real inputs, and that status is computed from test results rather than set by hand. The repository tracks 167 capabilities this way.",
        "SITL earned its place: it caught missions putting NAV_TAKEOFF at sequence 0, which MAVLink reserves for home, after every mock-based test had passed.",
      ],
    },
  ],

  flows: [
    {
      title: "An inspection, end to end",
      caption:
        "Each stage produces artefacts the next one can verify rather than trust. The branches are where the system declines to continue, which is the design, not a failure of it.",
      steps: [
        {
          label: "Plan the mission",
          detail:
            "One of 22 templates, inside the geofence, around no-fly zones, following terrain.",
        },
        {
          label: "Fly it",
          detail: "MAVLink 2 to ArduPilot, validated in SITL first.",
        },
        {
          label: "Reconstruct",
          detail:
            "COLMAP, then georeferencing so results land in a real coordinate system.",
          tone: "decision",
          branches: [
            {
              label: "No CUDA COLMAP, skip dense stereo and say so",
              tone: "bad",
            },
            { label: "Orthomosaic, DSM, DTM and hillshade that open in QGIS" },
          ],
        },
        {
          label: "Detect",
          detail:
            "Cracks, corrosion and solar faults, each finding tied to the exact weights that produced it.",
          tone: "decision",
          branches: [
            {
              label: "No model installed, decline and explain why",
              tone: "bad",
            },
            { label: "Findings go to a person for review" },
          ],
        },
        {
          label: "Measure",
          detail: "Areas, lengths and volumes in metres, not pixels.",
        },
        { label: "Write the report", tone: "good" },
      ],
    },
  ],

  tables: [
    {
      title: "Defect models that ship",
      caption:
        "Each with its measured score and the weakness that limits it. Three other trained models were rejected rather than shipped, with the reasons kept.",
      head: ["Model", "Score", "Known weakness"],
      rows: [
        [
          "Crack segmentation · SegFormer-B5",
          "IoU 0.637 (held-out test)",
          "Thin and faint cracks are missed, so an empty mask is not evidence of a sound surface",
        ],
        [
          "Corrosion severity · SegFormer-B2",
          "Severe-pixel recall 0.788",
          "Errors fall between adjacent grades, so a reported grade can be one step optimistic",
        ],
        [
          "Solar cell defects · YOLO11l",
          "mAP50 0.8835",
          "Electroluminescence cell imagery only, not aerial or thermal photographs of installed panels",
        ],
        [
          "Solar thermal anomalies · ResNet18",
          "Balanced accuracy 0.724",
          "Soiling is the weak class: roughly two in three soiled modules are missed",
        ],
      ],
    },
  ],

  metrics: [
    {
      value: "167",
      label: "Tracked capabilities",
      context:
        "Status computed from passing tests against real inputs, never set by hand.",
    },
    {
      value: "77 / 77",
      label: "Images registered",
      context:
        "Public OpenDroneMap Aukerman survey: 1.27 px mean reprojection error, 1.22 m georeference RMSE.",
    },
    {
      value: "22",
      label: "Mission templates",
      context: "Exported to six autopilot formats.",
    },
  ],

  experiments: [
    {
      name: "Reconstruction on a public survey",
      question:
        "Does the reconstruction hold up on real imagery someone else captured?",
      method:
        "The OpenDroneMap Aukerman Park dataset, 77 photographs at 0.033 m/px, through COLMAP and georeferencing in EPSG:32617.",
      result:
        "77 of 77 images registered, 1.27 px mean reprojection error, 1.22 m georeference RMSE.",
    },
    {
      name: "Flight against a real autopilot",
      question: "Does mission upload survive a real MAVLink stack?",
      method: "ArduPilot Copter 4.5.7 in SITL, run locally in Docker.",
      result:
        "SITL caught a NAV_TAKEOFF-at-sequence-0 bug that every mock test had passed. Of three SITL flight tests, two pass; the third exposed a home-position bug that is being fixed.",
    },
  ],

  limitations: [
    "No Windows installer or tagged release yet; it runs from source with Python 3.11.",
    "Dense multi-view stereo needs a CUDA build of COLMAP. Without one, dense stereo is skipped and raster resolution drops to what the sparse cloud supports.",
    "No model has been measured on Indian sites.",
    "Reading FLIR or DJI thermal JPEGs directly is not implemented on main and is refused with that reason.",
  ],

  gallery: [
    {
      file: "odk-site-ortho-1600.webp",
      type: "image",
      caption:
        "Orthomosaic of the public Aukerman Park survey, 77 photographs at 0.033 m/px, reconstructed offline",
    },
    {
      file: "odk-site-crack-overlay.webp",
      type: "image",
      caption: "Crack segmentation overlay, marked for a person to review",
    },
    {
      file: "odk-mission.jpg",
      type: "image",
      caption:
        "The app over example data, the banner is the system's own, and it says so rather than implying a live connection",
    },
    {
      file: "odk-site-report-page-1.webp",
      type: "image",
      caption: "First page of a generated inspection report",
    },
    {
      file: "odk-defects.jpg",
      type: "image",
      caption:
        "Detector output on held-out CODEBRIM bridge imagery, efflorescence and spallation, with confidences",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "OpenDroneKit is mine: mission planning, flight integration, reconstruction pipeline, geospatial outputs, defect models, measurement and reporting.",
    },
    {
      kind: "based-on-external-research",
      detail:
        "COLMAP, MAVLink, ArduPilot, SegFormer, YOLO and ResNet are upstream tools and architectures, integrated and trained here rather than authored. Sample imagery is the Aukerman Park dataset from the OpenDroneMap project. Not affiliated with DroneKit or OpenDroneMap.",
    },
    {
      kind: "experiment-by-me",
      detail:
        "Model training, evaluation and the rejection decisions across the inspection task families.",
    },
  ],

  related: ["pushpak", "stereoptu"],
};
