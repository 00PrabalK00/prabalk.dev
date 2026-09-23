import type { Project } from "./types";

/**
 * HttpsOta.
 *
 * A small library with an unusually clean justification: it exists because a
 * specific remote ESP32 had to stay updatable when physical access was
 * impossible. Every feature maps to a failure that would have bricked it.
 */
export const httpsota: Project = {
  slug: "httpsota",
  subdomain: "httpsota",
  title: "HttpsOta",
  subtitle: "Over-the-air updates for ESP32, over TLS, with rollback",
  status: "open-source",
  year: "2025",
  role: "Author",
  category: "infrastructure",
  order: 4,

  thesis:
    "An OTA update library written for a device that could not be reached physically, so every failure mode that would brick it had to be handled before the first update was ever sent.",

  summary:
    "An ESP32 HTTPS OTA library with SHA-256 verification, download stall detection, total timeouts, dual OTA partition support and automatic rollback. Extracted from a deployed device where a failed update would have meant losing it entirely.",

  links: [
    {
      label: "Repository",
      href: "https://github.com/00PrabalK00/esp32-https-ota",
      kind: "repo",
    },
  ],

  stack: ["ESP32", "C++", "TLS", "SHA-256", "HMAC"],

  problem: {
    heading: "Problem",
    body: [
      "An update to a device you can physically reach is an inconvenience when it fails. An update to a device on another continent is the end of the device.",
      "The naive OTA path has several ways to end that way: a truncated download that verifies as complete, a stalled connection that never times out, a valid image that does not boot, a TLS check skipped because the device's clock is wrong.",
    ],
  },

  built: {
    heading: "What I built",
    body: [
      "A library whose feature list is a list of the ways this can go wrong.",
    ],
    points: [
      "SHA-256 verification of the downloaded image",
      "Download stall detection and total timeouts",
      "Progress callbacks",
      "Dual OTA partition support with automatic rollback",
      "TLS validation, with the certificate time dependency handled explicitly",
      "Heap guards, and handling for partition table failures",
      "Chunked transfer considerations",
      "An HMAC signing example",
    ],
  },

  deepDive: [
    {
      heading: "The failure analysis is the documentation",
      body: [
        "The README is written as an account of what breaks rather than a feature list, the certificate time dependency, the partition table failure mode, what a stalled chunked transfer looks like from the device's side. That is the part worth reading.",
      ],
    },
  ],

  flows: [
    {
      title: "An update, and every way it can fail",
      caption:
        "Each branch here is a way a naive OTA bricks a device you cannot reach. The library exists because this specific device was on another continent.",
      steps: [
        {
          label: "Poll the update endpoint",
          detail: "The server returns version, sha256 and size.",
        },
        {
          label: "Is there enough heap for a TLS handshake?",
          tone: "decision",
          branches: [
            { label: "No, refuse to start. LowMemory", tone: "bad" },
            { label: "Yes, open the connection" },
          ],
        },
        {
          label: "Download into the inactive OTA slot",
          detail: "Hashed while downloading, and sized from Content-Length.",
          tone: "decision",
          branches: [
            {
              label: "Connection dies mid-download, Stalled, retry later",
              tone: "bad",
            },
            {
              label: "Total timeout exceeded, give up rather than hang",
              tone: "bad",
            },
          ],
        },
        {
          label: "Verify SHA-256",
          tone: "decision",
          branches: [
            {
              label: "Mismatch, truncated or tampered. Nothing is installed",
              tone: "bad",
            },
            { label: "Match, mark the new slot bootable" },
          ],
        },
        {
          label: "Reboot into the new image",
          tone: "decision",
          branches: [
            {
              label: "It comes up and reports its version, done",
              tone: "good",
            },
            {
              label: "It does not, automatic rollback to the running slot",
              tone: "bad",
            },
          ],
        },
      ],
    },
  ],

  tables: [
    {
      title: "Failure modes, and what the device does",
      caption:
        "A truncated image and a tampered one look identical from the device, so both are rejected the same way, before install, never after.",
      head: ["Result", "Cause", "Consequence"],
      rows: [
        [
          "Stalled",
          "Network died mid-download",
          "Nothing installed; retry later",
        ],
        ["HashMismatch", "Truncated or tampered image", "Nothing installed"],
        [
          "LowMemory",
          "Not enough contiguous heap for TLS",
          "Handshake never started",
        ],
        [
          "Rollback",
          "New image did not boot",
          "Device returns to the running slot",
        ],
      ],
    },
    {
      title: "Things that bite you once",
      caption:
        "Documented because each cost real debugging time, and the symptom points somewhere other than the cause.",
      head: ["Symptom", "Actual cause"],
      rows: [
        [
          "`No bootable app partitions in the partition table`",
          "Looks like corrupt flash; is really an off-by-one partition table",
        ],
        [
          "Update reinstalls on every poll",
          "The device is not reporting the version it is running",
        ],
        [
          "Write fails part-way",
          "`Content-Length` missing, the device sizes its partition write from it",
        ],
        [
          "TLS validation fails on a fresh device",
          "The certificate check is time-dependent and the clock is not set",
        ],
      ],
    },
  ],

  limitations: [
    "Rollback protects against an image that does not boot. It cannot protect against an image that boots and then loses its network configuration.",
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail:
        "The library, extracted from the PrabalOS deployment it was written for.",
    },
  ],

  related: ["prabalos"],
};
