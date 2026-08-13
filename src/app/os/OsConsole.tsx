"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CSRF_HEADER } from "@/lib/prabalos/constants";
import type { Overview } from "@/lib/prabalos/overview";
import VoiceRecorder from "./VoiceRecorder";
import FirmwarePanel from "./FirmwarePanel";
import DrawingPanel from "./DrawingPanel";
import { STATUSES, type Status } from "@/lib/prabalos/types";

/**
 * The control panel.
 *
 * Everything here is one person operating one device, so the interface is
 * optimised for "change a thing in two seconds from a phone" rather than for
 * density: big status buttons, a note box that saves on blur, and a send-love
 * button large enough to hit without looking.
 *
 * State is refetched every 5 s rather than pushed. A websocket would be
 * strictly better and strictly more machinery; at one viewer and one device,
 * polling is free.
 */

// 60 s, and paused while the tab is hidden.
//
// This panel used to poll every 5 s regardless, and each poll is ~8 Redis
// commands. A tab left open in a background window overnight was quietly
// spending more of the monthly quota than the device itself — at 15 s it was
// still ~480 commands an hour against the device's ~60, so the dashboard was
// roughly 90% of the bill.
//
// 60 s is affordable now that button presses and drawings push to Discord.
// Nothing arrives unannounced any more, so this poll no longer has to be the
// thing that catches events — it only has to refresh a page already being
// looked at, and a minute is quick enough for that.
const POLL_MS = 60000;

export default function OsConsole({ initial }: { initial: Overview }) {
  const router = useRouter();
  const [data, setData] = useState<Overview>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* "Last seen 4s ago" needs a clock, and reading Date.now() during render
     would make the component non-idempotent. Seed it from the server render
     and advance it from a timer instead. */
  const [now, setNow] = useState(initial.now);
  /** Last version seen, echoed to the server so it can answer "unchanged". */
  const versionRef = useRef(initial.version);

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const say = useCallback((msg: string) => {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      // Send the version we already have; the server answers "unchanged" for
      // two reads instead of re-fetching everything.
      const res = await fetch(`/api/prabalos/admin/overview?v=${versionRef.current}`, {
        headers: { [CSRF_HEADER]: "1" },
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) return;

      const payload = (await res.json()) as
        | (Overview & { unchanged?: false })
        | { unchanged: true; version: number; health: Overview["health"]; now: number };

      if ("unchanged" in payload && payload.unchanged) {
        // Only telemetry moved. Merge it rather than replacing state, so the
        // panels do not re-render for nothing.
        setData((prev) => ({ ...prev, health: payload.health, now: payload.now }));
        return;
      }

      versionRef.current = payload.version;
      setData(payload);
    } catch {
      /* a dropped poll is not worth surfacing; the next one will land */
    }
  }, [router]);

  useEffect(() => {
    const tick = () => {
      // A backgrounded tab tells you nothing and costs the same as a visible
      // one. Refresh immediately on return so it never looks stale.
      if (document.visibilityState === "visible") void refresh();
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const post = useCallback(
    async (path: string, body: unknown, label: string, note: string) => {
      setBusy(label);
      try {
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json", [CSRF_HEADER]: "1" },
          body: JSON.stringify(body),
        });
        if (res.status === 401) {
          router.replace("/login");
          return false;
        }
        if (!res.ok) {
          say("Rejected.");
          return false;
        }
        say(note);
        await refresh();
        return true;
      } catch {
        say("Network error.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [refresh, router, say],
  );

  return (
    <div className="min-h-screen bg-ink text-bone">
      <Header
        health={data.health}
        deviceId={data.deviceId}
        online={data.state.online}
        now={now}
        onLock={async () => {
          await fetch("/api/prabalos/logout", { method: "POST" });
          router.replace("/login");
          router.refresh();
        }}
      />

      {flash && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 border border-accent bg-ink-2 px-4 py-2">
          <span className="mono text-[11px] uppercase tracking-[0.16em] text-accent">{flash}</span>
        </div>
      )}

      <main className="mx-auto grid max-w-[1180px] gap-4 px-4 py-6 md:grid-cols-2 xl:grid-cols-3">
        <Presence data={data} post={post} busy={busy} />
        <Compose data={data} post={post} busy={busy} />
        <Voice data={data} refresh={refresh} say={say} />
        <FromHome data={data} />
        <Device data={data} now={now} />
        <Security data={data} />
        <Panel title="Drawing from home">
          <DrawingPanel drawing={data.drawing} onChanged={refresh} onFlash={say} />
        </Panel>
        <Panel title="Firmware">
          <FirmwarePanel
            firmware={data.firmware}
            deviceFw={data.health?.fw ?? ""}
            onChanged={refresh}
            onFlash={say}
          />
        </Panel>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Post = (path: string, body: unknown, label: string, note: string) => Promise<boolean>;

function Header({
  health,
  deviceId,
  online,
  now,
  onLock,
}: {
  health: Overview["health"];
  deviceId: string;
  online: boolean;
  now: number;
  onLock: () => void;
}) {
  const seen = health?.lastSeen ?? 0;
  const age = seen ? now - seen : Infinity;
  // The device reports telemetry every few polls rather than every one, to
  // keep Redis writes down, so liveness is judged over a wider window.
  const live = age < 150;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3">
        <h1 className="font-display text-[17px] font-semibold tracking-tight">
          Prabal<span className="text-accent">OS</span>
        </h1>

        <span
          className={`mono flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] ${
            live ? "text-pass" : "text-fault"
          }`}
          title={`${deviceId} — ${seen ? `last seen ${fmtAge(age)} ago` : "never seen"}`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${live ? "bg-pass" : "bg-fault"}`}
          />
          {live ? "device online" : "device offline"}
        </span>

        <span className="mono text-[10px] uppercase tracking-[0.16em] text-mute">
          you: {online ? "visible" : "hidden"}
        </span>

        <button
          onClick={onLock}
          className="mono ml-auto border border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-mute transition-colors hover:border-fault hover:text-fault"
        >
          Lock
        </button>
      </div>
    </header>
  );
}

function Panel({
  title,
  children,
  span,
}: {
  title: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <section className={`border border-line bg-ink-2 p-4 ${span ? "md:col-span-2" : ""}`}>
      <h2 className="mono mb-3 text-[10px] uppercase tracking-[0.2em] text-mute">{title}</h2>
      {children}
    </section>
  );
}

function Presence({ data, post, busy }: { data: Overview; post: Post; busy: string | null }) {
  const [place, setPlace] = useState(data.state.place);
  const [note, setNote] = useState(data.state.note);
  const [dirty, setDirty] = useState(false);
  const [synced, setSynced] = useState({ place: data.state.place, note: data.state.note });

  // Server state wins unless there are unsaved local edits — otherwise the 5 s
  // poll would yank characters out from under the cursor mid-sentence.
  //
  // Adjusted during render rather than in an effect: React re-runs this
  // component before painting, so the boxes never flash the stale value, and
  // there is no cascading second render.
  if (!dirty && (synced.place !== data.state.place || synced.note !== data.state.note)) {
    setSynced({ place: data.state.place, note: data.state.note });
    setPlace(data.state.place);
    setNote(data.state.note);
  }

  return (
    <Panel title="Presence">
      <div className="mb-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {STATUSES.map((s: Status) => {
          const active = data.state.status === s;
          return (
            <button
              key={s}
              disabled={busy !== null}
              onClick={() => post("/api/prabalos/admin/state", { status: s }, "status", `→ ${s}`)}
              className={`mono border px-2 py-2 text-[10px] uppercase tracking-[0.1em] transition-colors ${
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-line text-mute hover:border-line-2 hover:text-bone"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <label className="mb-3 flex flex-col gap-1.5">
        <span className="mono text-[10px] uppercase tracking-[0.16em] text-mute">
          Place (optional, never coordinates)
        </span>
        <input
          value={place}
          maxLength={40}
          onChange={(e) => {
            setPlace(e.target.value);
            setDirty(true);
          }}
          onBlur={async () => {
            if (await post("/api/prabalos/admin/state", { place }, "place", "Place saved"))
              setDirty(false);
          }}
          placeholder="Brooklyn"
          className="mono border border-line bg-ink-3 px-2.5 py-2 text-[13px] text-bone outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="mono text-[10px] uppercase tracking-[0.16em] text-mute">Daily note</span>
        <textarea
          value={note}
          maxLength={240}
          rows={3}
          onChange={(e) => {
            setNote(e.target.value);
            setDirty(true);
          }}
          onBlur={async () => {
            if (await post("/api/prabalos/admin/state", { note }, "note", "Note saved"))
              setDirty(false);
          }}
          placeholder="Classes until 3, lab after. Free to call after 8."
          className="mono resize-none border border-line bg-ink-3 px-2.5 py-2 text-[13px] leading-relaxed text-bone outline-none focus:border-accent"
        />
      </label>

      <button
        disabled={busy !== null}
        onClick={() =>
          post(
            "/api/prabalos/admin/state",
            { online: !data.state.online },
            "online",
            data.state.online ? "Hidden" : "Visible",
          )
        }
        className={`mono mt-3 w-full border px-3 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors ${
          data.state.online
            ? "border-pass text-pass hover:bg-pass/10"
            : "border-line text-mute hover:text-bone"
        }`}
      >
        {data.state.online ? "Showing as online" : "Showing as offline"}
      </button>
    </Panel>
  );
}

function Compose({ data, post, busy }: { data: Overview; post: Post; busy: string | null }) {
  const [text, setText] = useState("");

  return (
    <Panel title="Send home">
      <textarea
        value={text}
        rows={3}
        maxLength={500}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reached home <3"
        className="mono w-full resize-none border border-line bg-ink-3 px-2.5 py-2 text-[13px] leading-relaxed text-bone outline-none focus:border-accent"
      />
      <button
        disabled={busy !== null || text.trim().length === 0}
        onClick={async () => {
          if (await post("/api/prabalos/admin/message", { text }, "msg", "Message sent"))
            setText("");
        }}
        className="mono mt-2 w-full border border-accent bg-accent/10 px-3 py-2.5 text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/20 disabled:border-line disabled:bg-transparent disabled:text-mute"
      >
        Send message
      </button>

      {/* Side by side, and the same size. They are the same gesture in two
          directions, and making love the big one would quietly rank them. */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          disabled={busy !== null}
          onClick={() => post("/api/prabalos/admin/love", { kind: "love" }, "love", "Love sent home")}
          className="mono border border-fault bg-fault/10 px-3 py-4 text-[13px] uppercase tracking-[0.2em] text-fault transition-colors hover:bg-fault/20 disabled:opacity-50"
        >
          ♥ I love you
        </button>
        <button
          disabled={busy !== null}
          onClick={() => post("/api/prabalos/admin/love", { kind: "miss" }, "love", "Sent home")}
          className="mono border border-accent bg-accent/10 px-3 py-4 text-[13px] uppercase tracking-[0.2em] text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
        >
          ♥ I miss you
        </button>
      </div>

      {data.incoming && (
        <p className="mono mt-2 text-[10px] uppercase tracking-[0.14em] text-amber-400">
          Waiting for the device to show the {data.incoming.kind === "miss" ? "miss" : "love"}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-1.5">
        {data.messages.slice(0, 6).map((m) => (
          <li key={m.id} className="flex items-baseline gap-2 border-b border-line/60 pb-1.5">
            <span
              className={`mono shrink-0 text-[9px] uppercase tracking-[0.14em] ${
                m.read ? "text-mute" : "text-cyan"
              }`}
            >
              {m.read ? "read" : "new"}
            </span>
            <span className="mono truncate text-[12px] text-bone">{m.text}</span>
            <span className="mono ml-auto shrink-0 text-[10px] text-mute">{fmtClock(m.ts)}</span>
          </li>
        ))}
        {data.messages.length === 0 && (
          <li className="mono text-[11px] text-mute">Nothing sent yet.</li>
        )}
      </ul>
    </Panel>
  );
}

function Voice({
  data,
  refresh,
  say,
}: {
  data: Overview;
  refresh: () => void;
  say: (msg: string) => void;
}) {
  return (
    <Panel title="Voice note">
      <VoiceRecorder
        existing={
          data.voice ? { id: data.voice.id, secs: data.voice.secs, played: data.voice.played } : null
        }
        onChanged={refresh}
        onFlash={say}
      />
    </Panel>
  );
}

function FromHome({ data }: { data: Overview }) {
  return (
    <Panel title="From home">
      <div className="mb-4 flex gap-6">
        <Counter label="I love you" value={data.counters.loveFromHome} tone="text-fault" />
        <Counter label="I miss you" value={data.counters.missFromHome} tone="text-accent" />
        <Counter
          label="Sent by you"
          value={data.counters.loveFromPrabal + data.counters.missFromPrabal}
          tone="text-cyan"
        />
      </div>

      <ul className="flex max-h-[240px] flex-col gap-1.5 overflow-y-auto">
        {data.events.map((e) => (
          <li key={e.id} className="flex items-baseline gap-2 border-b border-line/60 pb-1.5">
            <span
              className={`mono text-[13px] ${e.type === "love" ? "text-fault" : "text-accent"}`}
            >
              ♥
            </span>
            {/* Events recorded before the buttons could tell them apart carry no
                sender; those were all the red button, which is Mumma's. */}
            <span className="mono text-[12px] text-bone">
              {e.from === "papa" ? "Papa" : "Mumma"}{" "}
              {e.type === "love" ? "loves you" : "misses you"}
            </span>
            {e.queued && (
              <span
                className="mono text-[9px] uppercase tracking-[0.14em] text-amber-400"
                title="Pressed while the device was offline"
              >
                queued
              </span>
            )}
            <span className="mono ml-auto text-[10px] text-mute">{fmtClock(e.ts)}</span>
          </li>
        ))}
        {data.events.length === 0 && (
          <li className="mono text-[11px] text-mute">No presses yet.</li>
        )}
      </ul>
    </Panel>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className={`font-display text-[26px] font-semibold leading-none ${tone}`}>{value}</div>
      <div className="mono mt-1 text-[9px] uppercase tracking-[0.16em] text-mute">{label}</div>
    </div>
  );
}

function Device({ data, now }: { data: Overview; now: number }) {
  const h = data.health;
  const age = h?.lastSeen ? now - h.lastSeen : null;

  // Below ~24 KB of contiguous free memory the ESP32 cannot complete a TLS
  // handshake, so this is the number that predicts every network failure the
  // device will ever have. It is on the dashboard for exactly that reason.
  const blockWarn = h ? h.largestBlock > 0 && h.largestBlock < 24576 : false;

  return (
    <Panel title="Device">
      {!h ? (
        <p className="mono text-[11px] text-mute">
          {data.deviceId} has never checked in. Nothing is wrong with the server — the firmware
          simply has not called yet.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <Stat k="Device" v={data.deviceId} />
          <Stat k="Firmware" v={h.fw || "?"} />
          <Stat k="Last seen" v={age === null ? "never" : `${fmtAge(age)} ago`} />
          <Stat k="Signal" v={h.rssi ? `${h.rssi} dBm` : "—"} />
          <Stat k="Free heap" v={h.heap ? `${Math.round(h.heap / 1024)} KB` : "—"} />
          <Stat
            k="Largest block"
            v={h.largestBlock ? `${Math.round(h.largestBlock / 1024)} KB` : "—"}
            warn={blockWarn}
          />
          <Stat k="Queued events" v={String(h.queue)} warn={h.queue > 0} />
          <Stat k="Local IP" v={h.ip || "—"} />
        </dl>
      )}

      {blockWarn && (
        <p className="mono mt-3 text-[10px] leading-relaxed text-amber-400">
          Largest contiguous block is under 24 KB. The device will start refusing TLS handshakes
          and queueing presses instead of dropping them. Usually means Bluetooth audio has been
          started and stopped a few times.
        </p>
      )}
    </Panel>
  );
}

function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div>
      <dt className="mono text-[9px] uppercase tracking-[0.16em] text-mute">{k}</dt>
      <dd className={`mono text-[12px] ${warn ? "text-amber-400" : "text-bone"}`}>{v}</dd>
    </div>
  );
}

function Security({ data }: { data: Overview }) {
  return (
    <Panel title="Access log">
      <ul className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto">
        {data.authLog.map((e, i) => (
          <li key={`${e.ts}-${i}`} className="flex items-baseline gap-2 border-b border-line/60 pb-1.5">
            <span
              className={`mono text-[9px] uppercase tracking-[0.14em] ${
                e.ok ? "text-pass" : "text-fault"
              }`}
            >
              {e.ok ? "ok" : "fail"}
            </span>
            <span className="mono text-[11px] text-bone">{e.reason}</span>
            <span className="mono truncate text-[10px] text-mute">{e.ip}</span>
            <span className="mono ml-auto shrink-0 text-[10px] text-mute">{fmtClock(e.ts)}</span>
          </li>
        ))}
        {data.authLog.length === 0 && (
          <li className="mono text-[11px] text-mute">No login attempts recorded.</li>
        )}
      </ul>
      <p className="mono mt-3 text-[10px] leading-relaxed text-mute">
        Failed attempts lock this IP out for 15 minutes after 5 tries. If you see failures you did
        not make, rotate PRABALOS_SESSION_KEY — every session dies with it.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function fmtAge(sec: number): string {
  if (!Number.isFinite(sec)) return "never";
  if (sec < 60) return `${Math.max(0, sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function fmtClock(tsSec: number): string {
  if (!tsSec) return "";
  return new Date(tsSec * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
