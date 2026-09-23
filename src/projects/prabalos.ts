import type { Project } from "./types";

/**
 * PrabalOS.
 *
 * The feature list is not the story. The story is that this is a physical
 * device built for family communication that had to keep working after its
 * author moved thousands of kilometres away — which is what forced the remote
 * firmware update path, the recovery codes and the private blob storage.
 *
 * It lives in this repository (the /os control panel and the firmware), which
 * is why it was never represented as a project until now.
 */
export const prabalos: Project = {
  slug: "prabalos",
  subdomain: "prabalos",
  title: "PrabalOS",
  subtitle: "A connected ESP32 device for staying in touch",
  status: "deployed",
  year: "2025 to present",
  role: "Author",
  category: "infrastructure",
  order: 3,

  thesis:
    "A physical device for family communication that had to keep working, unattended, from the other side of the world, so everything about it is designed around not being able to touch it again.",

  summary:
    "An ESP32 device with a display, touch input, audio and physical buttons, backed by a web control panel: remote messaging, voice notes, drawings, device synchronisation and Discord integration, with TOTP-authenticated login, recovery codes, private blob storage and a remote firmware update path.",

  links: [],

  stack: [
    "ESP32",
    "C++",
    "Next.js",
    "TypeScript",
    "Redis",
    "TOTP",
    "Discord API",
  ],

  problem: {
    heading: "Problem",
    body: [
      "Moving thousands of kilometres away turns a hobby device into infrastructure. It has to stay up without physical access, survive a bad firmware flash, and be usable by people who are not going to debug it.",
      "Every interesting decision in the project follows from that: the device has to be updatable remotely, and the update path has to be able to fail safely.",
    ],
  },

  built: {
    heading: "What I built",
    body: ["The hardware, the firmware, the backend and the control panel."],
    points: [
      "ESP32 hardware with display, touch input, audio and physical buttons",
      "WiFi communication with backend APIs and device synchronisation",
      "Remote messaging, voice notes and drawings, with multi-sender interactions",
      "Discord integration",
      "Secure login with TOTP authentication and recovery codes",
      "Private blob storage and a remote firmware update flow",
      "Timezone handling",
    ],
  },

  deepDive: [
    {
      heading: "Designing for no physical access",
      body: [
        "Remote firmware delivery is the load-bearing feature. A device you cannot reach needs an update path that verifies what it downloaded and can roll back when the new image does not come up, which is the problem the HttpsOta library was extracted to solve.",
      ],
    },
  ],

  flows: [
    {
      title: "A message reaching a device on another continent",
      caption:
        "The interesting part is not the feature. It is that every hop has to survive the device being unreachable, asleep, or on a network nobody controls.",
      steps: [
        {
          label: "Someone writes, draws or records a voice note",
          detail: "From the web control panel, or via the Discord integration.",
        },
        {
          label: "Authenticated",
          detail:
            "TOTP, with recovery codes for the case where the authenticator is lost.",
          tone: "decision",
          branches: [
            {
              label:
                "Not authenticated, the API returns 401 rather than a redirect",
              tone: "bad",
            },
          ],
        },
        {
          label: "Stored",
          detail:
            "Private blob storage for drawings and voice notes; state in Redis.",
        },
        {
          label: "The device polls and synchronises",
          detail:
            "Over WiFi, on its own schedule, the backend never assumes it is reachable.",
        },
        {
          label: "It lands on the display",
          detail: "With touch, audio and physical buttons to respond.",
          tone: "good",
        },
      ],
    },
    {
      title: "Updating a device you cannot reach",
      caption:
        "The load-bearing feature. A failed update on a device thousands of kilometres away is the end of the device, which is why the OTA path was extracted into its own library.",
      steps: [
        { label: "A new firmware image is published" },
        { label: "The device checks version, hash and size" },
        {
          label: "Downloads to the inactive OTA slot",
          detail: "SHA-256 verified while downloading.",
          tone: "decision",
          branches: [
            {
              label: "Hash mismatch or stall, nothing is installed",
              tone: "bad",
            },
          ],
        },
        {
          label: "Reboots into the new image",
          tone: "decision",
          branches: [
            { label: "Comes up and reports its version", tone: "good" },
            {
              label: "Does not, automatic rollback to the previous slot",
              tone: "bad",
            },
          ],
        },
      ],
    },
  ],

  tables: [
    {
      title: "The parts",
      head: ["Layer", "What is there"],
      rows: [
        [
          "Device",
          "ESP32, display, touch input, audio, physical buttons, WiFi",
        ],
        ["Firmware", "Synchronisation, rendering, input handling, OTA client"],
        [
          "Backend",
          "APIs for messaging, voice notes, drawings and device sync; Redis state; private blob storage",
        ],
        [
          "Control panel",
          "Web UI for sending, plus firmware delivery and device status",
        ],
        [
          "Auth",
          "TOTP login, recovery codes, session guard on every write route",
        ],
        [
          "Integrations",
          "Discord, and timezone handling for a device in another timezone",
        ],
      ],
    },
  ],

  limitations: [
    "One deployed device. Nothing here is validated at fleet scale.",
  ],

  gallery: [
    {
      file: "prabalos-hardware.jpg",
      type: "image",
      caption:
        "The device, presence, both timezones side by side, and two buttons that need no explaining to use",
    },
  ],

  attribution: [
    {
      kind: "built-by-me",
      detail: "Hardware, firmware, backend, control panel and deployment.",
    },
  ],

  related: ["httpsota"],
};
