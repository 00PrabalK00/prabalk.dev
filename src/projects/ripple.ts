import type { Project } from "./types";

/**
 * Ripple.
 *
 * Rewritten against the live site and the public repository rather than from
 * the brief, which conflated two related but distinct bodies of work:
 *
 *   - Ripple, the product: an always-on site engineer for Nav2 robots. Public,
 *     documented, demonstrated on a simulated SMR300, with a published test
 *     matrix. Everything here is verifiable.
 *   - Ripple research: recovery evaluation over frozen VLA policies. Private,
 *     and the source of the negative results.
 *
 * Keeping those apart is the point. The engineering claim — Ripple observes a
 * failure and executes a bounded, verified intervention — is demonstrated. The
 * research question — does intervening actually raise final task success — is
 * separate, and its honest answer is "sometimes".
 *
 * This repo now owns ripple.prabalkhare.com. The content below was replicated
 * from the standalone site before the hostname was moved, so the switch costs
 * nothing: same claims, same clips, same diagrams, one deployment.
 */
export const ripple: Project = {
  slug: "ripple",
  subdomain: "ripple",
  title: "Ripple",
  subtitle: "An always-on site engineer for Nav2 robots",
  status: "active-research",
  year: "2025 — present",
  role: "Author",
  category: "current-research",
  order: 1,

  thesis:
    "A robot stops. Ripple works out why, recovers within limits you set, asks a person when the problem is physical, and remembers what worked at that spot.",

  summary:
    "Ripple watches a Nav2 robot, diagnoses why it stopped, and recovers inside a budget you configure — clearing costmaps, probing routes, routing around a tight spot, backing out under teleop. When the evidence says the problem is physical, it stops and asks an engineer in plain words. Every closed incident leaves a lesson attached to that place, so the same corner does not cost the same time twice.",

  links: [
    { label: "Live site", href: "https://ripple.prabalkhare.com", kind: "site" },
    { label: "Repository", href: "https://github.com/00PrabalK00/ripple", kind: "repo" },
  ],

  stack: [
    "ROS 2 Humble",
    "Nav2",
    "PostgreSQL",
    "GLM 5.3",
    "OpenRouter",
    "Gazebo",
    "RosScope",
    "Node.js",
  ],

  problem: {
    heading: "Problem",
    body: [
      "A robot that stops on a factory floor is not usually broken. It is blocked, or mislocalised, or holding for a safety controller — and the fix is often a costmap clear, a retry, or a route around a pallet nobody logged.",
      "What makes it expensive is that a person has to work out which one it is, every time, and the same corner causes the same trouble for months. The hard part is not the recovery action; it is deciding which action is safe to take without a human, and proving it worked.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "An orchestrator that runs an incident loop around a live Nav2 robot, with an edge layer that decides what the model is allowed to do.",
    ],
    points: [
      "Observer watching for stalls, safety holds and lifecycle changes",
      "Incident loop: detected → investigating → recovering or escalated → resolved",
      "A recovery ladder — read diagnostics, clear local then global costmap, probe the route, retry or route around, bounded teleop escape",
      "navigate_via: the model picks one to three waypoints on open floor; the edge refuses any too close to a wall, obstacle or keepout and suggests a clear one",
      "Keepouts applied to Nav2's mask and costmap, and verified there before they count",
      "Human escalation over a chat channel, where an allowlisted operator's message is itself the approval",
      "Site memory: every closed incident becomes a lesson attached to that place",
      "`ripple setup`, a wizard that crawls the workspace and the live ROS graph, plus `ripple doctor`",
      "Action journal in PostgreSQL, dashboard, and RosScope integration",
    ],
  },

  architecture: {
    heading: "Architecture",
    body: [
      "The model decides; the edge enforces. GLM 5.3 only ever emits tool calls. Every call is validated and policy-checked by the edge and journaled to PostgreSQL before it reaches ROS, and the robot's own safety controller sits above everything Ripple does.",
      "Outcomes are verified, not assumed. A keepout counts once the published mask and the costmap show it. An arrival counts once odometry has settled and the pose is within tolerance. A recovery counts once odometry confirms the motion.",
      "People are a channel, not a dashboard. Engineers talk to Ripple on Ambiguous or on the local dashboard, and an allowlisted operator's message is itself the approval for what it asks.",
      "One file per robot. `ripple.json` holds topics, safety controller, stations and recovery limits, so a second robot is a new file rather than new code — a stock-Nav2 profile runs with no code changes.",
    ],
    media: {
      file: "ripple-dashboard.mp4",
      type: "video",
      caption:
        "Site control — a keepout drawn on the map is verified in the mask and costmap, then the robot plans around it",
    },
  },

  flows: [
    {
      title: "The incident loop",
      caption:
        "An incident is a state machine, not a retry counter. It can only close on a verified arrival, and it escalates rather than guessing when the evidence says the problem is physical.",
      steps: [
        { label: "Detected", detail: "The observer sees a stall, a safety hold or a lifecycle change." },
        { label: "Investigating", detail: "Read state, logs and diagnostics; form a hypothesis.", tone: "decision",
          branches: [
            { label: "A recovery step can run → Recovering" },
            { label: "Evidence says it is physical → Escalated", tone: "bad" },
          ] },
        { label: "Recovering", detail: "Bounded actions inside a per-incident budget.", tone: "decision",
          branches: [
            { label: "Verified arrival → Resolved", tone: "good" },
            { label: "Retry failed or budget spent → Escalated", tone: "bad" },
          ] },
        { label: "Escalated", detail: "Ripple stops and asks the engineer, in plain words." },
        { label: "Human context", detail: "The reply becomes site state: keepouts, availability, a new destination." },
        { label: "Resolved", detail: "Closed on a verified arrival, and only on a verified arrival.", tone: "good" },
      ],
    },
    {
      title: "The recovery ladder",
      caption:
        "What Ripple is allowed to try, in order, and where each rung hands off to a person instead of trying harder.",
      steps: [
        { label: "Incident opens", detail: "Read state, logs, diagnostics; form a hypothesis." },
        { label: "Is the safety controller holding?", tone: "decision",
          branches: [
            { label: "E-stop, or a person in control → ask the engineer", tone: "bad" },
            { label: "Obstacle → teleop back out (override only in simulation)" },
            { label: "No → clear the local costmap" },
          ] },
        { label: "Clear the global costmap, probe the route", tone: "decision",
          branches: [
            { label: "A path exists → retry, or navigate_via around the tight spot" },
            { label: "No path → ask the engineer", tone: "bad" },
          ] },
        { label: "Retry or route around", tone: "decision",
          branches: [
            { label: "Verified arrival → resolved", tone: "good" },
            { label: "Fails again → ask the engineer", tone: "bad" },
          ] },
        { label: "The engineer replies", detail: "The reply becomes site state, and the ladder resumes from there." },
      ],
    },
    {
      title: "How a lesson is made",
      caption:
        "Memory is written only from outcomes the edge verified. It is shown to the model as data, never as permission — the guardrail comes from the memory-poisoning literature, because a store an agent can write to is an injection surface.",
      steps: [
        { label: "An incident closes" },
        { label: "A lesson is written for that place", detail: "The recipe that worked, what did not help, what the safety layer refused, what the engineer taught, and the evidence for each." },
        { label: "A new incident happens nearby", detail: "Recall by proximity, situation, recency and reliability." },
        { label: "The best lessons enter the model's briefing" },
        { label: "Recovery runs through the edge", tone: "decision",
          branches: [
            { label: "Verified → upvote the recipe", tone: "good" },
            { label: "Not verified → downvote, and mark what did not help", tone: "bad" },
          ] },
        { label: "Repeated trouble becomes a suggestion for a person", detail: "A keepout, or a slow zone. Ripple never applies those itself." },
      ],
    },
    {
      title: "Setting it up",
      caption:
        "`ripple setup` is a terminal wizard. It checks the keys live, crawls the robot rather than asking you to describe it, and only asks about the fields it cannot work out.",
      steps: [
        { label: "Keys: OpenRouter, Ambiguous", detail: "Checked live, and kept masked." },
        { label: "Escalation channel and operators", detail: "Where Ripple asks for help, and who may command the robot." },
        { label: "Crawl the workspace and the live ROS graph", detail: "Every topic, action and service matched by message type and by the node that publishes or serves it — so different names on another robot do not matter." },
        { label: "Confirm only the uncertain fields" },
        { label: "Write ripple.json and a private .env" },
        { label: "ripple doctor", detail: "Checks every entry against the robot.", tone: "good" },
      ],
    },
  ],

  tables: [
    {
      title: "Safety model",
      caption:
        "What the model may do without asking, what needs an operator, and what is simply not exposed. The teleop safety override exists only on profiles that declare a simulation; the profile validator refuses it otherwise. Teleop never overrides an e-stop and always stops inside its minimum clearance.",
      head: ["Level", "Examples", "Who decides"],
      rows: [
        ["Observe", "Health, logs, diagnostics, route probes", "Always allowed"],
        ["Recover", "Clear costmaps, retry, navigate_via, lifecycle reset, bounded escape and teleop", "Automatic within per-incident budgets"],
        ["Command", "Navigate, keepouts, station availability", "An allowlisted operator's message is the approval"],
        ["Never", "Raw motor commands, shell, disabling collision checks", "Not exposed"],
      ],
    },
    {
      title: "Tested",
      head: ["Tier", "What it covers"],
      rows: [
        ["Unit", "123 offline tests: edge tools and policy, navigator via legs, keepouts, teleop and escape, the observer, Ambiguous, the dashboard API, the GLM client, setup, doctor, site memory"],
        ["TUI", "The setup dialogs, driven by keypresses in a pseudo-terminal"],
        ["Live", "Against the simulator: recovery 13/13, second robot profile and memory 9/9, via routes and pending keepouts 7/7, the full demo 7/7 with a real reply on Ambiguous, site learning 5/5"],
      ],
    },
  ],

  deepDive: [
    {
      heading: "Outcomes are verified, not assumed",
      body: [
        "This is the load-bearing idea. A keepout counts once the published mask and the costmap actually show it. An arrival counts once odometry has settled and the pose is inside tolerance. A recovery counts once odometry confirms the motion happened.",
        "An agent that believes its own tool calls succeeded is an agent that reports success while the robot sits still. Verification at the edge is what makes the incident log worth reading.",
      ],
    },
    {
      heading: "A safety model with a 'never' tier",
      body: [
        "Observing is always allowed. Recovering — costmap clears, retries, navigate_via, lifecycle reset, bounded escape — is automatic within a per-incident budget. Commanding, meaning navigation, keepouts and station availability, requires an allowlisted operator's message as approval.",
        "Raw motor commands, shell access and disabling collision checks are simply not exposed. The teleop safety override exists only on profiles that declare themselves a simulation, and the profile validator refuses it otherwise; teleop never overrides an e-stop and always stops inside its minimum clearance.",
      ],
    },
    {
      heading: "Memory that cannot become permission",
      body: [
        "Lessons are drawn from ExpeL, ReasoningBank, CLIN, Agent Workflow Memory and Generative Agents — but the guardrails come from the memory-poisoning literature, because a memory an agent can write to is an injection surface.",
        "So: lessons come only from outcomes the edge verified and from allowlisted people, each lists its evidence, and they are shown to the model as data and never as permissions. Repeated trouble becomes a suggestion for a person — a keepout, a slow zone — which Ripple never applies itself.",
      ],
    },
  ],

  metrics: [
    {
      value: "123",
      label: "Offline unit tests",
      context:
        "Edge tools and policy, navigator via legs, keepouts, teleop and escape, observer, escalation channel, dashboard API, GLM client, setup, doctor and site memory.",
    },
    {
      value: "13/13",
      label: "Live recovery runs",
      context: "Against the simulated SMR300 in Gazebo.",
    },
    {
      value: "7/7",
      label: "Full demo steps",
      context:
        "Including a real engineer reply typed live during the recorded run, which became the keepout, the new destination and the report.",
    },
  ],

  experiments: [
    {
      name: "Learning one place",
      question:
        "Does a lesson attached to a location actually make the next incident there cheaper?",
      method:
        "The same obstruction stopped the robot three times at one spot. The first incident left a lesson; the next two were briefed with it.",
      result:
        "The second and third runs skipped the step the safety layer had refused — one step fewer — though each still took 27–29 s. An earlier run went 45 s → 32 s → 30 s. The saving is real but modest, and it is a step count more than a clock time.",
    },
    {
      name: "Second robot profile",
      question: "Does a new robot need new code?",
      method:
        "A second, stock-Nav2 profile was run against the same system using only a new `ripple.json`.",
      result: "Runs with no code changes. 9/9 on profile and memory checks.",
    },
  ],

  limitations: [
    "One robot, in simulation. Ripple has not been run on physical hardware.",
    "AMCL can lose track while the robot spins in a tight dock. Recovering needs a person to re-seed the pose, plus a costmap clear for the obstacle marks laid down while it was lost.",
    "Site learning saves a step rather than a large amount of time — 27–29 s per incident either way in the recorded run.",
    "The frozen-policy recovery experiments that grew out of this work are reported under SO101, where the arm and the evaluation live.",
  ],

  gallery: [
    {
      file: "ripple-dashboard.mp4",
      type: "video",
      caption:
        "Site control — a walkway is closed on the map, the keepout is verified in Nav2's mask and costmap, and the robot plans around it",
    },
    {
      file: "ripple-incident.mp4",
      type: "video",
      caption:
        "Something software cannot fix — a pallet blocks the dock. Ripple reads diagnostics, clears the costmap and retries; when Nav2 aborts again it stops and asks",
    },
    {
      file: "ripple-escalation.mp4",
      type: "video",
      caption:
        "The engineer answers in plain words. Ripple applies a keepout over the dock once the robot has left it, marks the dock unavailable, drives to the charger and closes on a verified arrival",
    },
    {
      file: "ripple-recovery.mp4",
      type: "video",
      caption:
        "Re-routing through its own waypoints — the edge refuses a point too close to a rack and every leg is planned before the robot moves",
    },
    {
      file: "ripple-memory.mp4",
      type: "video",
      caption:
        "Learning the place — the same block stops the robot three times; the first incident leaves a lesson and the next two skip the step the safety layer refused",
    },
    {
      file: "ripple-setup.mp4",
      type: "video",
      caption:
        "`ripple setup` on the simulated robot — keys stay masked, the live ROS graph is crawled, and doctor checks every entry against the robot",
    },
  ],

  timeline: [
    { when: "AI Tinkerers NYC hackathon", what: "First version — a robot agent that reacts to failures." },
    { when: "After the hackathon", what: "Rebuilt as a site engineer for Nav2: incident loop, recovery ladder, edge-enforced tool calls." },
    { when: "Site memory", what: "Closed incidents become lessons attached to a place, with memory-poisoning guardrails." },
    { when: "Research arm", what: "The same question asked of frozen VLA policies — Cosmos Policy and SmolVLA." },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "Ripple — the orchestrator, edge and policy layer, navigator, keepouts, site memory, dashboard, setup and doctor tooling, and the test suite.",
    },
    {
      kind: "experiment-by-me",
      detail: "The live simulator runs and the site-learning measurements.",
    },
    {
      kind: "based-on-external-research",
      detail:
        "Nav2, GLM 5.3, SmolVLA, Cosmos Policy, LeRobot and LIBERO are upstream. The memory design draws on ExpeL, ReasoningBank, CLIN, Agent Workflow Memory and Generative Agents. The simulator is the external SMR300L Gazebo ROS2 Control package.",
    },
  ],

  related: ["so101", "rosscope", "smr300"],
};
