/**
 * The project record.
 *
 * One shape for every case study, so that adding a project is a data change
 * rather than a new page. The structure follows the evidence order a reader
 * actually needs: what is this, why was it hard, what did you build, what did
 * you measure, and — the section most portfolios omit — what did not work.
 *
 * Two rules are encoded in the types rather than left to discipline:
 *
 *  1. `attribution` is required. Every project states what was built by this
 *     author versus what is upstream work, a team's, or a reproduction. A
 *     portfolio that blurs that line is worth less than one that does not.
 *  2. Metrics carry their own context. A number without the trial count and
 *     the conditions it was measured under is decoration, so `Metric` cannot
 *     be constructed without saying where it came from.
 */

/** Where a project actually is, so an old prototype cannot pose as current work. */
export type ProjectStatus =
  | "active-research"
  | "active-development"
  | "completed"
  | "deployed"
  | "open-source"
  | "archived";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  "active-research": "Active research",
  "active-development": "Active development",
  completed: "Completed",
  deployed: "Deployed",
  "open-source": "Open source",
  archived: "Archived",
};

/**
 * How a claim relates to the author's own work. Required on every project, and
 * used verbatim in the Attribution section.
 */
export type AttributionKind =
  | "built-by-me"
  | "my-contribution-in-a-team"
  | "based-on-external-research"
  | "reproduction-and-extension"
  | "experiment-by-me";

export const ATTRIBUTION_LABEL: Record<AttributionKind, string> = {
  "built-by-me": "Built by me",
  "my-contribution-in-a-team": "My contribution within a team",
  "based-on-external-research": "Based on external research",
  "reproduction-and-extension": "Reproduction and extension",
  "experiment-by-me": "Experiment performed by me",
};

export type AttributionClaim = {
  kind: AttributionKind;
  /** What specifically falls under this classification. */
  detail: string;
};

/**
 * A measured result. `context` is not optional on purpose — "97%" means
 * nothing without "across 150 logged shelf-docking trials".
 */
export type Metric = {
  value: string;
  label: string;
  context: string;
};

export type Section = {
  heading: string;
  /** Paragraphs. Rendered in order, no markdown parsing. */
  body: string[];
  /** Optional supporting list rendered under the prose. */
  points?: string[];
  /** A clip or figure belonging to this section rather than the gallery. */
  media?: MediaRef;
};

/**
 * A step in a flow diagram.
 *
 * Flows are rendered as styled HTML rather than handed to a diagramming
 * library: mermaid and friends need JavaScript at runtime, and these pages are
 * static documents. A vertical chain with labelled branches covers every
 * diagram these projects actually need — an incident loop, a recovery ladder, a
 * setup sequence — and it stays readable on a phone, which a wide graph does
 * not.
 */
export type FlowStep = {
  label: string;
  detail?: string;
  /**
   * `decision` renders as a question, `good` as a verified outcome, `bad` as a
   * refusal or failure. The tones are the point of these diagrams: a path the
   * system declines to take should not look like one it takes.
   */
  tone?: "default" | "decision" | "good" | "bad";
  /** Outcomes branching off this step. */
  branches?: { label: string; tone?: "default" | "good" | "bad" }[];
};

export type Flow = {
  title: string;
  caption?: string;
  steps: FlowStep[];
};

export type TableBlock = {
  title: string;
  caption?: string;
  head: string[];
  rows: string[][];
};

export type Experiment = {
  name: string;
  question: string;
  method: string;
  /** Plain-language outcome. Negative results belong here, stated as findings. */
  result: string;
  /** True when the result did not confirm the hypothesis. Rendered as such. */
  negative?: boolean;
};

export type MediaRef = {
  /** Path under /public, or a slot id that is not shipped yet. */
  file: string;
  type: "image" | "video";
  caption: string;
  /** Missing media is declared rather than silently absent. */
  pending?: boolean;
};

export type ProjectLink = {
  label: string;
  href: string;
  kind: "repo" | "demo" | "video" | "paper" | "dataset" | "patent" | "site";
};

/** One repository in a project that spans several. */
export type RepoRef = {
  name: string;
  href: string;
  /** What lives in it, so the map is useful rather than a list of URLs. */
  contains: string;
};

export type TimelineEntry = {
  when: string;
  what: string;
};

export type ProjectCategory =
  | "current-research"
  | "robot-systems"
  | "autonomy-and-perception"
  | "infrastructure"
  | "bench";

export const CATEGORY_LABEL: Record<ProjectCategory, string> = {
  "current-research": "Current research",
  "robot-systems": "Robot systems",
  "autonomy-and-perception": "Autonomy and perception",
  infrastructure: "Developer and robotics infrastructure",
  bench: "Lab bench",
};

export type Project = {
  slug: string;
  /** The subdomain this resolves at, without the apex. Omit for bench projects. */
  subdomain?: string;
  title: string;
  /** One line. What it is, not how impressive it is. */
  subtitle: string;
  status: ProjectStatus;
  year: string;
  role: string;
  category: ProjectCategory;
  /** Ordering within a category. Lower sorts first. */
  order: number;
  /**
   * Render as a line in a list rather than a full media row.
   *
   * Some projects are real and worth a case study without warranting a
   * 420px-wide figure on the index — a CLI, a browser extension, a simulation
   * package. Giving everything the same row made the index longer without
   * making it more informative.
   */
  compact?: boolean;

  /** One sentence that could stand alone as the project's thesis. */
  thesis: string;
  /** Homepage card copy. Longer than the thesis, shorter than the problem. */
  summary: string;

  hero?: MediaRef;
  links: ProjectLink[];
  stack: string[];

  problem?: Section;
  built?: Section;
  architecture?: Section;
  deepDive?: Section[];
  /** Diagrams — rendered as static HTML, no runtime library. */
  flows?: Flow[];
  /** Reference tables: safety tiers, test matrices, comparisons. */
  tables?: TableBlock[];

  metrics?: Metric[];
  experiments?: Experiment[];
  /** What broke, what remains unsolved. Required reading for research work. */
  limitations?: string[];

  gallery?: MediaRef[];
  repos?: RepoRef[];
  timeline?: TimelineEntry[];
  attribution: AttributionClaim[];
  /** Slugs of related projects. Validated at build by the registry. */
  related?: string[];
};
