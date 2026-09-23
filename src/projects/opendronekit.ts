import type { Project } from "./types";

/**
 * OpenDroneKit.
 *
 * A full rewrite. The previous portfolio copy described a structural
 * inspection interface around YOLO, U-Net, COLMAP and FEniCSx, which is now a
 * subset of what the project does — it has become an offline-first geospatial
 * system, and the model evaluation work deserves its own section rather than a
 * bullet.
 *
 * The design principle worth stating outright is "refuse rather than
 * fabricate": a system that reports a defect it is not confident about is
 * worse than one that declines to answer, because a false negative on a crack
 * is a structural risk and a false positive burns the inspector's trust.
 */
export const opendronekit: Project = {
  slug: "opendronekit",
  subdomain: "opendronekit",
  title: "OpenDroneKit",
  subtitle:
    "Offline drone inspection — mission planning, flight, geospatial reconstruction and defect intelligence",
  status: "active-development",
  year: "2025 — present",
  role: "Author",
  category: "autonomy-and-perception",
  order: 1,

  thesis:
    "An offline-first inspection system that plans the flight, flies it, reconstructs the asset, finds the defects, and refuses to answer when it cannot answer honestly.",

  summary:
    "A drone inspection and geospatial platform that runs without a network connection: terrain-aware mission planning, MAVLink flight, COLMAP reconstruction with georeferencing, orthomosaic, DSM, DTM and hillshade generation, georeferenced defect projection, coverage QA, crack propagation and asset health scoring. The repository documents 167 capabilities. Its governing rule is to refuse rather than fabricate.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/OpenDroneKit",
      kind: "repo",
    },
  ],

  stack: [
    "Python",
    "PyQt6",
    "COLMAP",
    "MAVLink",
    "PostGIS",
    "YOLOv8",
    "U-Net",
    "FEniCSx",
    "SITL",
  ],

  problem: {
    heading: "Problem",
    body: [
      "Infrastructure inspection happens where the connectivity is not. A system that assumes a cloud backend is useless on a bridge, a tower or a remote site, which is where the inspections are.",
      "The second problem is trust. An inspection tool that guesses produces reports nobody can act on — a fabricated defect wastes a crew's day, and a missed one is a structural risk. Deciding what the system does when it is uncertain is a design question, not an implementation detail.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "An offline-first desktop system covering the whole inspection loop, from planning a flight to producing a report.",
    ],
    points: [
      "Mission planning, including terrain-aware planning",
      "MAVLink flight, validated against SITL",
      "COLMAP reconstruction with georeferencing",
      "Orthomosaic, DSM, DTM and hillshade generation",
      "Defect analytics with georeferenced defect projection",
      "Coverage QA, so gaps in the survey are visible rather than assumed away",
      "Crack propagation estimation and asset health scoring",
      "Multiple export formats and operator workspaces",
      "PostGIS storage, distributed processing, model provenance tracking",
      "Report generation",
    ],
  },

  architecture: {
    heading: "Architecture",
    body: [
      "Plan, fly, reconstruct, analyse, report — with each stage producing artefacts the next can verify rather than trust. Georeferencing is applied at reconstruction so defects land in world coordinates rather than image coordinates, which is what makes coverage QA and asset health scoring meaningful across repeat surveys.",
      "Model provenance is tracked explicitly: which model produced a given finding is recorded with the finding, so a later model change does not silently rewrite history.",
    ],
  },

  deepDive: [
    {
      heading: "Refuse rather than fabricate",
      body: [
        "The governing design rule. Where the system is not confident — insufficient coverage, a reconstruction that did not converge, a model operating outside its validated domain — it declines to produce a finding instead of producing a low-confidence one.",
        "This costs recall and buys the only thing that matters in an inspection report, which is that a stated finding can be acted on.",
      ],
    },
    {
      heading: "Model evaluation as a first-class concern",
      body: [
        "Several model families were evaluated rather than one being adopted: crack presence classification, crack segmentation, structural damage detection, corrosion severity segmentation and semantic land cover.",
        "Models were rejected. Known failure modes, dataset limitations, model identity checks and holdout design issues are recorded alongside the ones that were kept — a rejected model with a documented reason is more useful to the next person than a leaderboard.",
      ],
    },
  ],

  flows: [
    {
      title: "An inspection, end to end",
      caption:
        "Each stage produces artefacts the next one can verify rather than trust. The branches are where the system declines to continue — which is the design, not a failure of it.",
      steps: [
        { label: "Plan the mission", detail: "Terrain-aware planning over the asset." },
        { label: "Fly it", detail: "MAVLink, validated against SITL before anything real." },
        { label: "Reconstruct", detail: "COLMAP, then georeferencing so results land in world coordinates.", tone: "decision",
          branches: [
            { label: "Reconstruction did not converge — stop, and say so", tone: "bad" },
            { label: "Converged — produce orthomosaic, DSM, DTM, hillshade" },
          ] },
        { label: "Coverage QA", tone: "decision",
          branches: [
            { label: "Gaps in the survey — declared, not silently averaged over", tone: "bad" },
            { label: "Coverage sufficient — run defect analytics" },
          ] },
        { label: "Detect and project defects", detail: "Findings projected into world coordinates, with the model that produced each one recorded alongside it.", tone: "decision",
          branches: [
            { label: "Model outside its validated domain — refuse the finding", tone: "bad" },
            { label: "Confident — keep it, and estimate crack propagation" },
          ] },
        { label: "Asset health score and report", tone: "good" },
      ],
    },
  ],

  tables: [
    {
      title: "Models evaluated",
      caption:
        "Several families were tried and some were rejected. A rejected model with a documented reason is more useful to the next person than a leaderboard position.",
      head: ["Task", "Outcome"],
      rows: [
        ["Crack presence classification", "Evaluated"],
        ["Crack segmentation", "Evaluated"],
        ["Structural damage detection", "Evaluated — confusion matrix published, including the classes it misses"],
        ["Corrosion severity segmentation", "Evaluated"],
        ["Semantic land cover", "Experimental"],
        ["Rejected models", "Kept on record with their failure modes, dataset limitations and holdout design issues"],
      ],
    },
  ],

  metrics: [
    {
      value: "167",
      label: "Documented capabilities",
      context: "As enumerated in the repository's own documentation.",
    },
    {
      value: "~40,000",
      label: "Defect images processed",
      context: "Metal, brick and mixed defect imagery through detection and segmentation.",
    },
  ],

  experiments: [
    {
      name: "Model selection across inspection tasks",
      question:
        "Which models are trustworthy enough to put behind an inspection report?",
      method:
        "Evaluation across crack presence classification, crack segmentation, structural damage detection, corrosion severity segmentation and semantic land cover, with model identity checks and holdout design review.",
      result:
        "Some models were adopted and others explicitly rejected, with failure modes and dataset limitations recorded for both.",
    },
    {
      name: "Reconstruction and flight validation",
      question: "Does the pipeline hold up outside of curated inputs?",
      method: "Real reconstruction verification and SITL validation of the flight stack.",
      result:
        "Verified end to end against simulated flight and real reconstruction outputs.",
    },
  ],

  limitations: [
    "Holdout design issues were identified during model evaluation and constrain how far the reported model results generalise.",
    "Dataset limitations are documented per model; several families were rejected outright rather than shipped with caveats.",
    "The refuse-rather-than-fabricate rule means coverage gaps surface as declined findings, not as completed reports.",
  ],

  gallery: [
    { file: "opendronekit-ui.jpg", type: "image", caption: "The operator UI" },
    { file: "odk-mission.jpg", type: "image", caption: "Terrain-aware mission planning" },
    {
      file: "odk-reconstruction.jpg",
      type: "image",
      caption: "Reconstruction outputs — orthomosaic, DSM, hillshade",
    },
    {
      file: "odk-defects.jpg",
      type: "image",
      caption:
        "Detector output on held-out CODEBRIM bridge imagery — efflorescence and spallation, with confidences",
    },
    {
      file: "odk-models.png",
      type: "image",
      caption:
        "Normalised confusion matrix, structural detector. The background row is the honest part: most defect classes are still missed more often than caught, which is why models get rejected rather than shipped",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "OpenDroneKit is mine — planning, flight integration, reconstruction pipeline, geospatial outputs, defect analytics and the evaluation work.",
    },
    {
      kind: "based-on-external-research",
      detail:
        "COLMAP, MAVLink, YOLO, U-Net and FEniCSx are upstream tools and models, integrated here rather than authored.",
    },
    {
      kind: "experiment-by-me",
      detail:
        "The model evaluation and rejection decisions across the inspection task families.",
    },
  ],

  related: ["pushpak", "stereoptu"],
};
