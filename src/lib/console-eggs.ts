/**
 * Undocumented terminal commands. Split out of Console.tsx because the joke
 * payloads are longer than the real command handling.
 */

export type EggLine = { kind: "in" | "out" | "err" | "ok" | "dim"; text: string };

const out = (text: string): EggLine => ({ kind: "out", text });
const dim = (text: string): EggLine => ({ kind: "dim", text });
const ok = (text: string): EggLine => ({ kind: "ok", text });
const err = (text: string): EggLine => ({ kind: "err", text });

/* ------------------------------------------------------------------ */
/* ros2 — the site described as a ROS graph                            */
/* ------------------------------------------------------------------ */
const NODES = [
  "/flight/director",
  "/flight/smr300_sim",
  "/flight/station_manager",
  "/console/app_launcher",
  "/console/shell",
  "/github/activity_poller",
  "/theme/state_publisher",
];

const TOPICS = [
  ["/flight/scroll_progress", "std_msgs/msg/Float32"],
  ["/flight/camera_pose", "geometry_msgs/msg/Pose"],
  ["/flight/robot_pose", "geometry_msgs/msg/Pose"],
  ["/flight/scan", "sensor_msgs/msg/LaserScan"],
  ["/console/keystrokes", "std_msgs/msg/String"],
  ["/github/events", "pk_msgs/msg/ActivityFeed"],
  ["/theme/state", "std_msgs/msg/Bool"],
];

function ros2(args: string[], progress: number): EggLine[] {
  const [sub, verb] = args;

  if (sub === "node" && verb === "list") return NODES.map(out);

  if (sub === "topic" && verb === "list")
    return TOPICS.map(([t]) => out(t));

  if (sub === "topic" && verb === "echo") {
    const topic = args[2];
    if (topic === "/flight/scroll_progress")
      return [
        out(`data: ${progress.toFixed(4)}`),
        dim("---"),
        out(`data: ${Math.min(1, progress + 0.0014).toFixed(4)}`),
        dim("---"),
        dim("(ctrl-c to stop, if this were a real terminal)"),
      ];
    if (topic === "/theme/state")
      return [out(`data: ${document.documentElement.dataset.theme ?? "system"}`), dim("---")];
    if (topic && TOPICS.some(([t]) => t === topic))
      return [dim(`waiting for message on ${topic}...`), dim("(nothing publishing right now)")];
    return [err(`topic '${topic ?? ""}' does not appear to be published yet`)];
  }

  if (sub === "topic" && verb === "info") {
    const topic = args[2];
    const hit = TOPICS.find(([t]) => t === topic);
    if (!hit) return [err(`unknown topic: ${topic ?? ""}`)];
    return [
      out(`Type: ${hit[1]}`),
      out("Publisher count: 1"),
      out("Subscription count: 1"),
    ];
  }

  if (sub === "doctor")
    return [
      ok("All 7 checks passed"),
      dim("(the eighth check is whether he sleeps. it does not pass.)"),
    ];

  if (sub === "launch")
    return [
      ok("[INFO] process started with pid [1]"),
      out("[smr300_bringup] lifecycle -> ACTIVE"),
      dim("this one already ran. scroll up."),
    ];

  return [
    dim("usage: ros2 <command>"),
    out("  node list            list running nodes"),
    out("  topic list           list topics"),
    out("  topic echo <topic>   print messages"),
    out("  topic info <topic>   topic type and counts"),
    out("  doctor               check the system"),
  ];
}

/* ------------------------------------------------------------------ */
/* htop — projects as processes                                        */
/* ------------------------------------------------------------------ */
function htop(): EggLine[] {
  return [
    dim("  PID USER     CPU%  MEM%  S  COMMAND"),
    out("  001 prabal   97.0  42.1  R  smr300_autonomy_stack"),
    out("  002 prabal   64.8  31.7  R  kurat_perception --three-brain"),
    out("  003 prabal   38.2  12.9  R  continuum --daemon"),
    out("  004 prabal   21.5  18.4  R  rosscope --engineer-mode"),
    out("  005 prabal   12.1  06.2  S  opendronekit --offline"),
    out("  006 prabal    8.7  04.4  S  botopsy_lab --curriculum"),
    out("  007 prabal    2.1  91.4  D  masters_thesis"),
    err("  008 root      0.0   0.0  Z  sleep_schedule"),
    dim(""),
    dim("  Load average: 3.14  2.71  1.61"),
    dim("  Tasks: 8 total, 5 running, 2 sleeping, 1 zombie"),
  ];
}

/* ------------------------------------------------------------------ */
/* man prabal                                                          */
/* ------------------------------------------------------------------ */
function man(page: string | undefined): EggLine[] {
  if (page && page !== "prabal")
    return [err(`No manual entry for ${page}`)];

  return [
    dim("PRABAL(1)                 User Commands                PRABAL(1)"),
    dim(""),
    out("NAME"),
    out("     prabal - designs, builds and debugs robots that ship"),
    dim(""),
    out("SYNOPSIS"),
    out("     prabal [--ros2] [--cpp] [--hardware] [--operator-tooling]"),
    dim(""),
    out("DESCRIPTION"),
    out("     Takes a robot from sensor driver to factory floor. Reads"),
    out("     datasheets. Writes the operator UI too, because someone"),
    out("     has to and it is usually nobody."),
    dim(""),
    out("OPTIONS"),
    out("     --ros2        preferred runtime. Humble."),
    out("     --cpp         the language he actually enjoys"),
    out("     --hardware    will open the enclosure"),
    out("     --coffee      required for operation"),
    dim(""),
    out("EXIT STATUS"),
    out("     0    docked within 2 cm"),
    out("     1    sunlight through an open factory door"),
    dim(""),
    out("BUGS"),
    out("     Refactors working code at 2 a.m."),
    out("     Report bugs to prabalkhare.1010@gmail.com"),
    dim(""),
    out("SEE ALSO"),
    out("     hire(1), ros2(1), htop(1)"),
  ];
}

/* ------------------------------------------------------------------ */
/* rm -rf /                                                            */
/* ------------------------------------------------------------------ */
export const RM_FRAMES: EggLine[][] = [
  [
    err("removing /flight/smr300 ..."),
    err("removing /projects/mira ..."),
    err("removing /projects/kurat ..."),
  ],
  [
    err("removing /patents/202641035669 ..."),
    err("removing /github/activity ..."),
    err("removing /prabal/dignity ..."),
  ],
  [
    err("  !! SEGMENTATION FAULT !!"),
    err("  kernel panic - not syncing"),
  ],
  [
    dim("restoring from backup ..."),
    dim("..."),
    ok("nice try. it's a static site."),
  ],
];

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */
export const EGG_COMMANDS = [
  "ros2",
  "htop",
  "man",
  "hire",
  "achievements",
  "sudo",
  "rm",
  "vim",
  "coffee",
  "uptime",
];

export function runEgg(
  verb: string,
  args: string[],
  progress: number
): EggLine[] | null {
  switch (verb) {
    case "ros2":
      return ros2(args, progress);
    case "htop":
    case "top":
      return htop();
    case "man":
      return man(args[0]);
    case "vim":
    case "vi":
      return [
        dim("entering vim..."),
        out("~"),
        out("~"),
        err("E37: No write since last change"),
        dim("just kidding. you're free. (this is why he uses VS Code)"),
      ];
    case "coffee":
      return [
        out("brewing..."),
        err("418 I'm a teapot"),
        dim("RFC 2324 compliant."),
      ];
    case "uptime":
      return [
        out(" up 3 years, 11 months  ·  load average: 3.14, 2.71, 1.61"),
        dim(" first line of robot code: 2022"),
      ];
    default:
      return null;
  }
}
