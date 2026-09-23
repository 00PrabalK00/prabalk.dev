import type { Project } from "./types";

/**
 * Continuum Extension.
 *
 * A capture surface for Continuum rather than a separate product. It gets its
 * own page because the security design — redacting before anything leaves the
 * page — is the interesting part and would be buried as a subsection.
 */
export const continuumext: Project = {
  slug: "continuum-extension",
  subdomain: "continuumext",
  title: "Continuum Extension",
  subtitle: "Browser capture surface for agent context",
  status: "open-source",
  year: "2026",
  role: "Author",
  category: "infrastructure",
  order: 5,

  thesis:
    "Pull context out of a PR, an AI chat or an error page and route it to an agent — with credentials stripped before it ever leaves the tab.",

  summary:
    "An MV3 extension that captures context from GitHub PRs and issues, ChatGPT/Claude/Gemini/Perplexity conversations, docs and error pages, then hands it to the local Continuum CLI through a native-messaging host. A react-flow task graph provides approval controls to pause, resume or reject individual agent steps.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/Continuum-Extension",
      kind: "repo",
    },
  ],

  stack: ["React", "Vite", "Tailwind", "MV3", "Native messaging", "Python"],

  problem: {
    heading: "Problem",
    body: [
      "Most of the context an agent needs is in a browser tab — the PR discussion, the error page, the chat where the approach was worked out. Copying it by hand is the reason it never gets recorded.",
      "But a capture tool that scrapes pages is also a credential exfiltration tool if it is careless, so the redaction has to happen before anything leaves the page rather than server-side afterwards.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["A capture surface with the security boundary at the page, not the backend."],
    points: [
      "Captures from GitHub PRs and issues, AI chats, docs and error pages",
      "Secret redaction for AWS, GitHub and OpenAI credentials before anything leaves the page",
      "Per-site permissions and private-tab blocking",
      "react-flow task graph with pause, resume and reject on individual steps",
      "MV3 content scripts over a Python native-messaging host, bridging to the local CLI on 127.0.0.1:7357",
    ],
  },

  flows: [
    {
      title: "Capture, redacted first",
      caption:
        "The order matters. Redaction happens in the page, before the native-messaging hop, so a credential never reaches the host process at all.",
      steps: [
        { label: "Something worth keeping is on screen" },
        { label: "Is this site allowed, and is the tab private?", tone: "decision",
          branches: [
            { label: "Private tab, or site not permitted — capture refused", tone: "bad" },
            { label: "Allowed — capture proceeds" },
          ] },
        { label: "Redact in-page", detail: "AWS, GitHub and OpenAI credential patterns stripped before the message is constructed." },
        { label: "Native-messaging host", detail: "Local only — 127.0.0.1:7357, no remote endpoint." },
        { label: "Recorded into .continuum/", tone: "good" },
      ],
    },
  ],

  limitations: [
    "Redaction is pattern-based. It covers the credential formats it knows and cannot promise to catch a secret that looks like ordinary text.",
  ],

  attribution: [{ kind: "built-by-me", detail: "The extension and the native-messaging host." }],

  related: ["continuum"],
};
