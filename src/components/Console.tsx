"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Boxes,
  Briefcase,
  Cpu,
  FileDown,
  Images,
  Mail,
  X,
  ScrollText,
  Terminal as TerminalIcon,
  Trophy,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { profile } from "@/lib/data";
import { cinema, setScenePaused } from "@/lib/scroll";
import Smr300Section from "@/components/Smr300Section";
import GithubLive from "@/components/GithubLive";
import Timeline from "@/components/Timeline";
import Projects from "@/components/Projects";
import { Honors, Patents, Skills } from "@/components/Patents";
import Media from "@/components/Media";
import Contact from "@/components/Contact";
import ThemeToggle from "@/components/ThemeToggle";
import GithubMini from "@/components/GithubMini";
import { LiveClock } from "@/components/ui";

/* ------------------------------------------------------------------ */
/* Brand marks                                                         */
/* lucide dropped brand icons in v1, so these two are inline.          */
/* ------------------------------------------------------------------ */
function GithubMark({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.8 18.3 5.1 18.3 5.1c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

function LinkedinMark({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Apps                                                                */
/* ------------------------------------------------------------------ */
type App = {
  id: string;
  name: string;
  cmd: string;
  desc: string;
  meta: string;
  Icon: LucideIcon;
  accent: string;
  render: () => React.ReactNode;
};

const APPS: App[] = [
  {
    id: "smr300",
    name: "smr300",
    cmd: "smr300",
    desc: "The 300 kg AMR — full autonomy stack, 300 logged trials",
    meta: "flagship",
    Icon: Truck,
    accent: "#4da6ff",
    render: () => <Smr300Section />,
  },
  {
    id: "github",
    name: "github.live",
    cmd: "github",
    desc: "Real-time activity straight off the GitHub API",
    meta: "live",
    Icon: Activity,
    accent: "#3ddc97",
    render: () => <GithubLive />,
  },
  {
    id: "projects",
    name: "projects",
    cmd: "projects",
    desc: "Underwater, airborne, robotic arms, developer tooling",
    meta: "15 builds",
    Icon: Boxes,
    accent: "#ff9d5c",
    render: () => <Projects />,
  },
  {
    id: "experience",
    name: "experience",
    cmd: "experience",
    desc: "Five roles, two degrees, $15K of hardware managed",
    meta: "2023 — now",
    Icon: Briefcase,
    accent: "#a78bfa",
    render: () => <Timeline />,
  },
  {
    id: "patents",
    name: "patents",
    cmd: "patents",
    desc: "A vehicle that flies and drives, and two more filings",
    meta: "3 filed",
    Icon: ScrollText,
    accent: "#22d3ee",
    render: () => <Patents />,
  },
  {
    id: "skills",
    name: "stack",
    cmd: "skills",
    desc: "Everything I've had to debug at 2 a.m. on a floor",
    meta: "5 groups",
    Icon: Cpu,
    accent: "#ff6b9d",
    render: () => <Skills />,
  },
  {
    id: "honors",
    name: "honors",
    cmd: "honors",
    desc: "2nd in Norway, two national hackathons, 150+ taught",
    meta: "6 records",
    Icon: Trophy,
    accent: "#7fe3d4",
    render: () => <Honors />,
  },
  {
    id: "media",
    name: "media",
    cmd: "media",
    desc: "Footage and photos from real floors and real water",
    meta: "gallery",
    Icon: Images,
    accent: "#4da6ff",
    render: () => <Media />,
  },
  {
    id: "contact",
    name: "contact",
    cmd: "contact",
    desc: "Email, links, and the résumé as a PDF",
    meta: "reach me",
    Icon: Mail,
    accent: "#3ddc97",
    render: () => <Contact />,
  },
];

const APP_BY_CMD = new Map(APPS.map((a) => [a.cmd, a]));

const COMMANDS = [
  "help",
  "ls",
  "open",
  "whoami",
  "neofetch",
  "resume",
  "download",
  "clear",
  "close",
  ...APPS.map((a) => a.cmd),
];

/* ------------------------------------------------------------------ */
/* Terminal                                                            */
/* ------------------------------------------------------------------ */
type Line = { kind: "in" | "out" | "err" | "ok" | "dim"; text: string };

const BANNER: Line[] = [
  { kind: "ok", text: "pk-os 2.6.1   ros2 humble   x86_64" },
  { kind: "dim", text: "9 directories mounted. `help` for commands." },
];

const HINTS = ["help", "ls", "whoami", "neofetch", "projects"];

export default function Console() {
  const [open, setOpen] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const app = useMemo(() => APPS.find((a) => a.id === open) ?? null, [open]);

  const say = useCallback((next: Line[]) => {
    setLines((prev) => [...prev, ...next].slice(-80));
  }, []);

  const launch = useCallback(
    (id: string) => {
      setOpen(id);
      const a = APPS.find((x) => x.id === id);
      if (a) say([{ kind: "ok", text: `opening ~/${a.cmd}` }]);
    },
    [say]
  );

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;
      say([{ kind: "in", text: cmd }]);
      setHistory((h) => [cmd, ...h].slice(0, 40));
      setHIdx(-1);

      const [verb, ...rest] = cmd.toLowerCase().split(/\s+/);
      const arg = rest.join(" ");

      switch (verb) {
        case "help":
          say([
            { kind: "dim", text: "navigation" },
            { kind: "out", text: "  ls               list every directory" },
            { kind: "out", text: "  open <name>      open one" },
            { kind: "out", text: "  close            close the window" },
            { kind: "dim", text: "about" },
            { kind: "out", text: "  whoami           short bio" },
            { kind: "out", text: "  neofetch         system summary" },
            { kind: "out", text: "  resume           open the PDF" },
            { kind: "out", text: "  download         save the PDF" },
            { kind: "dim", text: "tab completes · ↑ ↓ for history" },
          ]);
          break;
        case "ls":
        case "dir":
          say(
            APPS.map((a) => ({
              kind: "out" as const,
              text: `  ${a.cmd.padEnd(12)} ${a.meta}`,
            }))
          );
          break;
        case "open":
        case "cd":
        case "cat": {
          const target = APP_BY_CMD.get(arg);
          if (target) launch(target.id);
          else
            say([
              { kind: "err", text: `open: ${arg || "(nothing)"}: no such directory` },
              { kind: "dim", text: "try `ls`" },
            ]);
          break;
        }
        case "whoami":
          say([
            { kind: "ok", text: `${profile.name} — Robotics Software Engineer` },
            { kind: "out", text: profile.tagline },
            { kind: "dim", text: `${profile.location} · NYU Tandon MS '28` },
          ]);
          break;
        case "neofetch":
          say([
            { kind: "ok", text: "prabal@pk-os" },
            { kind: "dim", text: "──────────────────────────────" },
            { kind: "out", text: "Role     Robotics Software Engineer" },
            { kind: "out", text: "Stack    ROS 2 · Nav2 · C++ · CANopen" },
            { kind: "out", text: "Shipped  SMR300 — 300 kg industrial AMR" },
            { kind: "out", text: "Record   97% docking · 300 trials" },
            { kind: "out", text: "Patents  3 filed" },
            { kind: "out", text: "Langs    English · Hindi · Thai · Marathi" },
          ]);
          break;
        case "resume":
        case "cv":
          window.open(profile.resume, "_blank", "noopener");
          say([{ kind: "ok", text: `opening ${profile.resumeFileName}` }]);
          break;
        case "download": {
          const a = document.createElement("a");
          a.href = profile.resume;
          a.download = profile.resumeFileName;
          a.click();
          say([{ kind: "ok", text: `saving ${profile.resumeFileName}` }]);
          break;
        }
        case "clear":
          setLines(BANNER);
          break;
        case "close":
          setOpen(null);
          say([{ kind: "dim", text: "closed" }]);
          break;
        case "sudo":
          say([{ kind: "err", text: "prabal is not in the sudoers file." }]);
          break;
        case "exit":
          say([{ kind: "dim", text: "there is no exit. scroll up." }]);
          break;
        default: {
          const guess = APP_BY_CMD.get(verb);
          if (guess) launch(guess.id);
          else
            say([
              { kind: "err", text: `${verb}: command not found` },
              { kind: "dim", text: "`help` lists everything" },
            ]);
        }
      }
    },
    [say, launch]
  );

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lenis owns wheel and touch for the whole document, so an overlay's own
  // scroll container does nothing until the page scroller is paused. The WebGL
  // loop is frozen at the same time — it is fully hidden but would otherwise
  // keep spending the frame budget the window needs.
  useEffect(() => {
    cinema.setPageScroll(!open);
    setScenePaused(Boolean(open));
    return () => {
      cinema.setPageScroll(true);
      setScenePaused(false);
    };
  }, [open]);

  const complete = () => {
    const frag = input.trim().split(/\s+/).pop() ?? "";
    if (!frag) return;
    const hit = COMMANDS.find((c) => c.startsWith(frag) && c !== frag);
    if (!hit) return;
    const parts = input.trim().split(/\s+/);
    parts[parts.length - 1] = hit;
    setInput(parts.join(" "));
  };

  return (
    <section
      id="console"
      className="relative z-10 min-h-[100svh] w-full overflow-hidden bg-ink"
    >
      {/* faint grid so the panel isn't a flat void */}
      <div className="grid-paper pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, var(--c-accent-soft) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1720px] px-4 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
        {/* title bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border border-line bg-ink-2/70 px-4 py-3 backdrop-blur-sm">
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-fault/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffb020]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-pass/80" />
          </span>
          <span className="mono truncate text-[11.5px] text-mute">
            <span className="text-pass">prabal</span>
            <span className="text-mute/60">@</span>
            <span className="text-accent">pk-os</span>
            <span className="text-mute/60">:~$</span>
          </span>

          <span className="mono ml-auto flex items-center gap-4 text-[10px] tracking-[0.16em] uppercase text-mute/70">
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 transition-colors hover:text-accent sm:flex"
            >
              <GithubMark /> github
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 transition-colors hover:text-accent sm:flex"
            >
              <LinkedinMark /> linkedin
            </a>
            <a
              href={profile.resume}
              download={profile.resumeFileName}
              className="flex items-center gap-1.5 transition-colors hover:text-accent"
            >
              <FileDown size={13} strokeWidth={1.8} /> résumé
            </a>
            <ThemeToggle />
          </span>
        </div>

        {/* heading — kept compact so the first row of cards is on screen
            with it at 100% zoom on a laptop */}
        <div className="mt-7 mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mt-9 sm:mb-9">
          <div>
            <p className="mono mb-2.5 text-[10.5px] tracking-[0.24em] uppercase text-accent">
              Flight complete · system ready
            </p>
            <h2 className="text-[2rem] leading-[1] font-semibold tracking-[-0.04em] text-bone sm:text-[2.6rem] lg:text-5xl">
              Everything else lives in here.
            </h2>
          </div>
          <div className="mono flex gap-5 text-[10.5px] text-mute/70">
            <LiveClock tz="America/New_York" label="brooklyn" />
            <LiveClock tz="Asia/Bangkok" label="bangkok" />
          </div>
        </div>

        {/* items-start: without it the card column stretches to match the
            sidebar's height and every card grows a tail of dead space. */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-8">
          {/* app grid */}
          <div className="grid auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {APPS.map((a, i) => {
              const { Icon } = a;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => launch(a.id)}
                  className="group relative flex flex-col items-start overflow-hidden border border-line bg-ink-2/80 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-line-2 sm:p-5"
                  style={
                    {
                      "--card": a.accent,
                    } as React.CSSProperties
                  }
                >
                  {/* top accent that wipes in on hover */}
                  <span
                    className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                    style={{ background: a.accent }}
                  />
                  {/* corner wash */}
                  <span
                    className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
                    style={{ background: a.accent }}
                  />

                  <span className="flex w-full items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center border transition-all duration-300 group-hover:scale-105"
                      style={{
                        color: a.accent,
                        borderColor: `${a.accent}44`,
                        background: `${a.accent}14`,
                      }}
                    >
                      <Icon size={18} strokeWidth={1.7} />
                    </span>
                    <span className="mono truncate text-[14px] text-bone transition-colors group-hover:text-[color:var(--card)]">
                      {a.name}
                    </span>
                    <span className="mono ml-auto shrink-0 text-[9.5px] tracking-[0.14em] text-mute/40 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>

                  <span className="mt-3 block text-[12.5px] leading-snug text-mute">
                    {a.desc}
                  </span>

                  <span className="mono mt-3.5 flex w-full items-center justify-between text-[9.5px] tracking-[0.14em] uppercase">
                    <span className="text-mute/50">{a.meta}</span>
                    <span
                      className="translate-x-[-4px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      style={{ color: a.accent }}
                    >
                      open →
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* live panel + terminal — capped to the viewport so a long `ls`
              scrolls inside the log instead of pushing the pane off-screen */}
          <div className="flex flex-col gap-5 xl:sticky xl:top-8 xl:max-h-[calc(100svh-4rem)] xl:self-start">
            <div className="shrink-0">
              <GithubMini onOpen={() => launch("github")} />
            </div>

            <div className="flex h-[380px] min-h-0 flex-col border border-line bg-ink-2/80 backdrop-blur-sm sm:h-[420px] xl:h-auto xl:flex-1">
            <div className="mono flex items-center gap-2 border-b border-line px-4 py-2.5 text-[10px] tracking-[0.16em] uppercase text-mute">
              <TerminalIcon size={12} strokeWidth={1.8} />
              bash
              <span className="ml-auto text-mute/40 normal-case">80×24</span>
            </div>

            <div
              ref={logRef}
              data-lenis-prevent
              onClick={() => inputRef.current?.focus()}
              className="mono min-h-0 flex-1 cursor-text overflow-y-auto px-4 py-3.5 text-[12px] leading-[1.8]"
            >
              {lines.map((l, i) => (
                <div
                  key={i}
                  className={
                    l.kind === "in"
                      ? "text-bone"
                      : l.kind === "err"
                        ? "text-fault"
                        : l.kind === "ok"
                          ? "text-pass"
                          : l.kind === "dim"
                            ? "text-mute/50"
                            : "text-mute"
                  }
                >
                  {l.kind === "in" && (
                    <span className="text-accent select-none">❯ </span>
                  )}
                  <span className="whitespace-pre-wrap">{l.text}</span>
                </div>
              ))}
            </div>

            {/* suggestion chips */}
            <div className="flex flex-wrap gap-1.5 border-t border-line px-3 pt-2.5">
              {HINTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => run(h)}
                  className="mono border border-line px-2 py-1 text-[10px] text-mute/70 transition-colors hover:border-accent/50 hover:text-accent"
                >
                  {h}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2 px-4 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(input);
                setInput("");
              }}
            >
              <span className="mono shrink-0 text-[12px]">
                <span className="text-pass">prabal</span>
                <span className="text-mute/50">:</span>
                <span className="text-accent">~</span>
                <span className="text-mute/50">$</span>
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    complete();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const n = Math.min(hIdx + 1, history.length - 1);
                    if (n >= 0) {
                      setHIdx(n);
                      setInput(history[n]);
                    }
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const n = hIdx - 1;
                    setHIdx(n);
                    setInput(n >= 0 ? history[n] : "");
                  }
                }}
                spellCheck={false}
                autoComplete="off"
                aria-label="Terminal input"
                className="mono w-full bg-transparent text-[12px] text-bone caret-transparent outline-none"
              />
              {/* our own caret so it blinks even when the field is empty */}
              <span className="mono -ml-2 shrink-0 text-[12px] text-accent blink">
                ▋
              </span>
            </form>
            </div>
          </div>
        </div>
      </div>

      {/* window */}
      {app && (
        <div
          /* opaque, not a blur: a fullscreen backdrop-filter is repainted every
             frame and was the main cost while scrolling inside a window */
          className="fixed inset-0 z-50 flex flex-col bg-ink"
          role="dialog"
          aria-modal="true"
          aria-label={app.name}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-line bg-ink-2/80 px-3 py-2.5 backdrop-blur-sm sm:px-5">
            {/* Back is the primary action here, so it is a labelled control
                rather than a 12px traffic-light dot. */}
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mono group/back flex shrink-0 items-center gap-2 border border-line-2 bg-ink px-3 py-2 text-[11px] tracking-[0.14em] uppercase text-bone transition-all hover:border-accent hover:text-accent"
            >
              <ArrowLeft
                size={14}
                strokeWidth={2}
                className="transition-transform group-hover/back:-translate-x-0.5"
              />
              Back
            </button>

            <span className="mono flex min-w-0 items-center gap-2 truncate text-[12px]">
              <app.Icon size={13} strokeWidth={1.8} color={app.accent} />
              <span style={{ color: app.accent }}>~/{app.cmd}</span>
            </span>

            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="ml-auto grid h-9 w-9 shrink-0 place-items-center border border-line-2 bg-ink text-mute transition-all hover:border-fault hover:bg-fault/10 hover:text-fault"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* data-lenis-prevent keeps Lenis from eating this pane's wheel and
              touch events, which is what made the window unscrollable. */}
          <div
            data-lenis-prevent
            className="window-body flex-1 overflow-y-auto overscroll-contain"
          >
            {app.render()}
          </div>

          <div className="flex shrink-0 gap-0.5 overflow-x-auto border-t border-line px-2 py-1.5">
            {APPS.map((a) => {
              const Ico = a.Icon;
              const on = a.id === app.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setOpen(a.id)}
                  title={a.cmd}
                  className={`mono flex shrink-0 items-center gap-2 px-3 py-2 text-[10px] tracking-[0.12em] uppercase transition-colors ${
                    on ? "bg-ink-3" : "text-mute/60 hover:text-bone"
                  }`}
                  style={on ? { color: a.accent } : undefined}
                >
                  <Ico size={13} strokeWidth={1.8} />
                  <span className="hidden sm:inline">{a.cmd}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
