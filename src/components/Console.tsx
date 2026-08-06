"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/lib/data";
import Smr300Section from "@/components/Smr300Section";
import GithubLive from "@/components/GithubLive";
import Timeline from "@/components/Timeline";
import Projects from "@/components/Projects";
import { Honors, Patents, Skills } from "@/components/Patents";
import Media from "@/components/Media";
import Contact from "@/components/Contact";
import ThemeToggle from "@/components/ThemeToggle";

/* ------------------------------------------------------------------ */
/* Apps                                                                */
/* ------------------------------------------------------------------ */
type App = {
  id: string;
  name: string;
  cmd: string;
  desc: string;
  glyph: string;
  accent: string;
  render: () => React.ReactNode;
};

const APPS: App[] = [
  {
    id: "smr300",
    name: "SMR300",
    cmd: "smr300",
    desc: "300 kg AMR · full autonomy stack",
    glyph: "▤",
    accent: "#4da6ff",
    render: () => <Smr300Section />,
  },
  {
    id: "github",
    name: "github.live",
    cmd: "github",
    desc: "Live activity · repos · languages",
    glyph: "◈",
    accent: "#3ddc97",
    render: () => <GithubLive />,
  },
  {
    id: "projects",
    name: "projects",
    cmd: "projects",
    desc: "15 builds · robotics, vision, tooling",
    glyph: "◆",
    accent: "#ff9d5c",
    render: () => <Projects />,
  },
  {
    id: "experience",
    name: "experience",
    cmd: "experience",
    desc: "Roles, education, leadership",
    glyph: "▸",
    accent: "#a78bfa",
    render: () => <Timeline />,
  },
  {
    id: "patents",
    name: "patents",
    cmd: "patents",
    desc: "4 filings · IP record",
    glyph: "⬢",
    accent: "#22d3ee",
    render: () => <Patents />,
  },
  {
    id: "skills",
    name: "stack",
    cmd: "skills",
    desc: "Languages, frameworks, hardware",
    glyph: "⌘",
    accent: "#ff6b9d",
    render: () => <Skills />,
  },
  {
    id: "honors",
    name: "honors",
    cmd: "honors",
    desc: "Competitions · teaching",
    glyph: "★",
    accent: "#7fe3d4",
    render: () => <Honors />,
  },
  {
    id: "media",
    name: "media",
    cmd: "media",
    desc: "Photos and footage from the field",
    glyph: "▣",
    accent: "#4da6ff",
    render: () => <Media />,
  },
  {
    id: "contact",
    name: "contact",
    cmd: "contact",
    desc: "Email, links, résumé",
    glyph: "✉",
    accent: "#3ddc97",
    render: () => <Contact />,
  },
];

const APP_BY_CMD = new Map(APPS.map((a) => [a.cmd, a]));

/* ------------------------------------------------------------------ */
/* Terminal log                                                        */
/* ------------------------------------------------------------------ */
type Line = { kind: "in" | "out" | "err" | "ok"; text: string };

const BANNER: Line[] = [
  { kind: "out", text: "pk-os 2.6.1  ·  ros2 humble  ·  x86_64" },
  { kind: "out", text: "Type `help` for commands, or click an icon below." },
];

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
    setLines((prev) => [...prev, ...next].slice(-60));
  }, []);

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
            { kind: "out", text: "ls                 list everything here" },
            { kind: "out", text: "open <name>        open a section" },
            { kind: "out", text: "whoami             short bio" },
            { kind: "out", text: "neofetch           system summary" },
            { kind: "out", text: "resume             open the PDF" },
            { kind: "out", text: "clear              clear this log" },
            { kind: "out", text: "close              close the open window" },
          ]);
          break;
        case "ls":
        case "dir":
          say(
            APPS.map((a) => ({
              kind: "out" as const,
              text: `${a.cmd.padEnd(12)} ${a.desc}`,
            }))
          );
          break;
        case "open":
        case "cd":
        case "cat": {
          const target = APP_BY_CMD.get(arg);
          if (target) {
            setOpen(target.id);
            say([{ kind: "ok", text: `opening ${target.cmd}…` }]);
          } else {
            say([
              { kind: "err", text: `${arg || "(nothing)"}: no such section` },
              { kind: "out", text: "try `ls`" },
            ]);
          }
          break;
        }
        case "whoami":
          say([
            { kind: "out", text: `${profile.name} — Robotics Software Engineer` },
            { kind: "out", text: profile.tagline },
            { kind: "out", text: `${profile.location} · NYU Tandon MS '28` },
          ]);
          break;
        case "neofetch":
          say([
            { kind: "ok", text: "prabal@pk-os" },
            { kind: "out", text: "─────────────────────────────" },
            { kind: "out", text: "Role     Robotics Software Engineer" },
            { kind: "out", text: "Stack    ROS 2 · Nav2 · C++ · CANopen" },
            { kind: "out", text: "Shipped  SMR300 — 300 kg industrial AMR" },
            { kind: "out", text: "Record   97% docking · 300 logged trials" },
            { kind: "out", text: "Patents  4 filed" },
            { kind: "out", text: "Langs    English · Hindi · Thai · Marathi" },
          ]);
          break;
        case "resume":
          window.open(profile.resumeDrive, "_blank", "noopener");
          say([{ kind: "ok", text: "opening résumé in a new tab" }]);
          break;
        case "clear":
          setLines(BANNER);
          break;
        case "close":
          setOpen(null);
          say([{ kind: "ok", text: "closed" }]);
          break;
        case "sudo":
          say([{ kind: "err", text: "prabal is not in the sudoers file." }]);
          break;
        case "exit":
          say([{ kind: "out", text: "there is no exit. scroll up." }]);
          break;
        default: {
          const guess = APP_BY_CMD.get(verb);
          if (guess) {
            setOpen(guess.id);
            say([{ kind: "ok", text: `opening ${guess.cmd}…` }]);
          } else {
            say([{ kind: "err", text: `${verb}: command not found` }]);
          }
        }
      }
    },
    [say]
  );

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Esc closes the open window
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section
      id="console"
      className="relative z-10 min-h-[100svh] w-full bg-ink"
    >
      <div className="mx-auto w-full max-w-[1680px] px-4 py-16 sm:px-8 sm:py-24">
        {/* window chrome */}
        <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="mono flex items-center gap-2 text-[11px] tracking-[0.16em] text-mute">
            <span className="inline-block h-2 w-2 rounded-full bg-fault/70" />
            <span className="inline-block h-2 w-2 rounded-full bg-accent/70" />
            <span className="inline-block h-2 w-2 rounded-full bg-pass/70" />
            <span className="ml-2">prabal@pk-os: ~</span>
          </span>
          <span className="mono ml-auto flex items-center gap-4 text-[10px] tracking-[0.16em] uppercase text-mute/70">
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              github
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              linkedin
            </a>
            <ThemeToggle />
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          {/* icon grid */}
          <div>
            <p className="mono mb-6 text-[10px] tracking-[0.2em] uppercase text-mute">
              Pick a directory
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {APPS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setOpen(a.id)}
                  className="group relative flex flex-col items-start gap-3 border border-line bg-ink-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-ink-3 sm:p-5"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center border text-[15px] transition-colors sm:h-11 sm:w-11"
                    style={{
                      color: a.accent,
                      borderColor: `${a.accent}55`,
                      background: `${a.accent}12`,
                    }}
                  >
                    {a.glyph}
                  </span>
                  <span className="min-w-0">
                    <span className="mono block truncate text-[13px] text-bone transition-colors group-hover:text-accent">
                      {a.name}
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-snug text-mute">
                      {a.desc}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* terminal */}
          <div className="flex min-h-[340px] flex-col border border-line bg-ink-2 lg:min-h-[460px]">
            <div className="mono border-b border-line px-4 py-2.5 text-[10px] tracking-[0.16em] uppercase text-mute">
              bash
            </div>

            <div
              ref={logRef}
              className="mono flex-1 overflow-y-auto px-4 py-3 text-[12px] leading-[1.75]"
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
                          : "text-mute"
                  }
                >
                  {l.kind === "in" && <span className="text-accent">$ </span>}
                  <span className="whitespace-pre-wrap">{l.text}</span>
                </div>
              ))}
            </div>

            <form
              className="flex items-center gap-2 border-t border-line px-4 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(input);
                setInput("");
              }}
            >
              <span className="mono text-[12px] text-accent">$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
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
                placeholder="help"
                className="mono w-full bg-transparent text-[12px] text-bone outline-none placeholder:text-mute/40"
              />
            </form>
          </div>
        </div>
      </div>

      {/* window */}
      {app && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink/92 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={app.name}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
            <span className="mono flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="grid h-3 w-3 place-items-center rounded-full bg-fault/80 text-[7px] text-ink transition-transform hover:scale-125"
              >
                ×
              </button>
              <span className="inline-block h-3 w-3 rounded-full bg-line-2" />
              <span className="inline-block h-3 w-3 rounded-full bg-line-2" />
            </span>
            <span
              className="mono truncate text-[12px]"
              style={{ color: app.accent }}
            >
              ~/{app.cmd}
            </span>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mono ml-auto shrink-0 text-[10px] tracking-[0.16em] uppercase text-mute transition-colors hover:text-accent"
            >
              esc · close
            </button>
          </div>

          <div className="window-body flex-1 overflow-y-auto overscroll-contain">
            {app.render()}
          </div>

          {/* app switcher along the bottom */}
          <div className="flex shrink-0 gap-1 overflow-x-auto border-t border-line px-3 py-2">
            {APPS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpen(a.id)}
                className={`mono shrink-0 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-colors ${
                  a.id === app.id
                    ? "text-bone"
                    : "text-mute/60 hover:text-bone"
                }`}
                style={a.id === app.id ? { color: a.accent } : undefined}
              >
                {a.cmd}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
