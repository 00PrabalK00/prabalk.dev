import { discordConfigured, isAllowedUser, verifyDiscordRequest } from "@/lib/prabalos/discord-verify";
import {
  addMessage,
  getDeviceHealth,
  getState,
  nowSec,
  sendLoveHome,
  setState,
  unreadCount,
} from "@/lib/prabalos/store";
import { isStatus } from "@/lib/prabalos/types";

/**
 * Discord slash commands.
 *
 * The webhook that pushes notifications is outbound only — there is no way to
 * send anything back through it — so commands arrive here instead. Discord
 * POSTs each interaction to this route, which means it works on serverless with
 * no always-on gateway connection to keep alive.
 *
 * Everything here answers within Discord's 3 second deadline without deferring,
 * because each command is one or two Redis writes. If anything slower is ever
 * added it will need a type 5 response and a follow-up instead.
 */

export const dynamic = "force-dynamic";

/** Interaction types. */
const PING = 1;
const APPLICATION_COMMAND = 2;

/** Callback types. */
const PONG = 1;
const MESSAGE = 4;

/** Visible only to whoever ran the command. */
const EPHEMERAL = 1 << 6;

type Option = { name: string; value?: unknown; options?: Option[] };

function reply(content: string, ephemeral = false): Response {
  return Response.json(
    {
      type: MESSAGE,
      data: {
        content,
        allowed_mentions: { parse: [] },
        ...(ephemeral ? { flags: EPHEMERAL } : {}),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function optionValue(options: Option[] | undefined, name: string): string | null {
  const found = options?.find((o) => o.name === name);
  return typeof found?.value === "string" ? found.value : null;
}

/** How long ago, in words. The device health timestamps are seconds. */
function ago(ts: number): string {
  const s = Math.max(0, nowSec() - ts);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function runCommand(name: string, options: Option[] | undefined): Promise<Response> {
  switch (name) {
    case "status": {
      const status = optionValue(options, "status");
      if (!isStatus(status)) return reply("That is not one of the statuses.", true);

      const place = optionValue(options, "place");
      await setState(place === null ? { status } : { status, place: place.slice(0, 40) });

      return reply(`Status set to **${status}**${place ? ` — ${place}` : ""}.`);
    }

    case "say": {
      const text = optionValue(options, "message")?.trim();
      if (!text) return reply("Nothing to send.", true);
      // Same cap the dashboard composer uses, so a message that arrives this
      // way cannot be one the device is unable to render.
      await addMessage(text.slice(0, 240));
      return reply(`Sent to the device:\n> ${text.slice(0, 240)}`);
    }

    case "note": {
      const text = optionValue(options, "text");
      if (text === null) return reply("Nothing to set.", true);
      await setState({ note: text.slice(0, 240) });
      return reply(text ? `Note set:\n> ${text.slice(0, 240)}` : "Note cleared.");
    }

    case "love": {
      await sendLoveHome();
      return reply("❤️  Sent home. It will show on the device at the next poll.");
    }

    case "state": {
      const [state, unread, health] = await Promise.all([
        getState(),
        unreadCount(),
        getDeviceHealth(process.env.PRABALOS_DEVICE_ID ?? "PRABALOS_HOME_01").catch(() => null),
      ]);

      const lines = [
        `**${state.status}**${state.place ? ` — ${state.place}` : ""}`,
        state.note ? `> ${state.note}` : null,
        `Unread on device: ${unread}`,
        health
          ? `Device: seen ${ago(health.lastSeen)}, firmware ${health.fw || "?"}, queue ${health.queue}`
          : "Device: never seen",
      ].filter(Boolean);

      return reply(lines.join("\n"), true);
    }

    default:
      return reply("Unknown command.", true);
  }
}

export async function POST(req: Request): Promise<Response> {
  // Raw bytes, before any parsing. Re-serialising the JSON would change key
  // order and whitespace and the signature would fail for a reason that looks
  // like a bad key and is not.
  const raw = await req.text();

  const okSig = verifyDiscordRequest(
    raw,
    req.headers.get("x-signature-ed25519"),
    req.headers.get("x-signature-timestamp"),
  );

  // 401 specifically, and before anything else is looked at. Discord probes
  // this endpoint with deliberately-bad signatures and removes it if a bad one
  // is ever answered with a 200.
  if (!okSig) {
    return new Response("invalid request signature", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let body: {
    type?: number;
    data?: { name?: string; options?: Option[] };
    member?: { user?: { id?: string } };
    user?: { id?: string };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (body.type === PING) {
    return Response.json({ type: PONG }, { headers: { "Cache-Control": "no-store" } });
  }

  if (body.type !== APPLICATION_COMMAND) {
    return new Response(null, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  // A valid signature proves the request came from Discord, not who typed the
  // command. `member` is present in a server, `user` in a DM.
  const userId = body.member?.user?.id ?? body.user?.id;
  if (!isAllowedUser(userId)) {
    console.warn("[prabalos] discord command from a non-allowed user");
    return reply("Not for you.", true);
  }

  if (!discordConfigured()) {
    return reply("Commands are not configured on the server.", true);
  }

  try {
    return await runCommand(body.data?.name ?? "", body.data?.options);
  } catch (err) {
    // Never let an exception become a Discord timeout — an unanswered
    // interaction shows "The application did not respond", which says nothing
    // about what went wrong.
    console.error("[prabalos] discord command failed:", err);
    return reply("That failed on the server. Try /os.", true);
  }
}
