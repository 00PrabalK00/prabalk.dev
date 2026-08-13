import type { EventSender, EventType } from "./types";

/**
 * Push notifications for device events, over a Discord webhook.
 *
 * The point of this is that it costs nothing. The Redis write already happens
 * when the device posts an event; this piggybacks on that same request and adds
 * no reads, no writes, and no polling. It is strictly cheaper than the
 * alternative it replaces — with push working, the dashboard no longer has to
 * be left open to catch things, and an open dashboard was roughly 90% of the
 * command spend.
 *
 * Discord rather than WhatsApp: a webhook is one URL with no OAuth, no bot
 * user, and no approval process. WhatsApp needs Twilio or the Meta Business
 * API, which means a business verification, per-message cost, and — outside a
 * 24-hour session window — only pre-approved template messages. All of that to
 * deliver "someone pressed a button".
 *
 * Every function here is failure-tolerant by construction. A notification is a
 * courtesy; it must never turn a recorded button press into an error the device
 * will retry. Callers should still wrap these in `after()` so the device gets
 * its response without waiting on Discord at all.
 */

/** Absent in dev and on any deploy that has not set it — treated as "push
 *  disabled", not as a misconfiguration. */
function webhookUrl(): string | null {
  const raw = process.env.PRABALOS_DISCORD_WEBHOOK?.trim();
  if (!raw) return null;
  // Copy-pasting from Discord occasionally brings quotes along, the same way it
  // did for the Upstash values.
  const url = raw.replace(/^['"]|['"]$/g, "");
  return url.startsWith("https://discord.com/api/webhooks/") ||
    url.startsWith("https://discordapp.com/api/webhooks/")
    ? url
    : null;
}

export function notificationsConfigured(): boolean {
  return webhookUrl() !== null;
}

/**
 * Posts to the webhook, swallowing every failure.
 *
 * The timeout matters more than it looks: this runs inside `after()`, which is
 * bounded by the route's max duration, and a Discord outage that hangs the
 * socket would otherwise hold a serverless invocation open until the platform
 * kills it.
 */
async function post(content: string): Promise<void> {
  const url = webhookUrl();
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        // The device controls none of this text, but pinning mentions off means
        // a message can never become an @everyone even if that changes.
        allowed_mentions: { parse: [] },
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      // Deliberately logging status only. The URL is a bearer credential —
      // anyone holding it can post to the channel — so it must not reach logs.
      console.warn(`[prabalos] discord webhook returned ${res.status}`);
    }
  } catch (err) {
    const reason = err instanceof Error ? err.name : "unknown";
    console.warn(`[prabalos] discord webhook failed: ${reason}`);
  }
}

const SENDER_TEXT: Record<EventSender, string> = { mumma: "Mumma", papa: "Papa" };

/**
 * A button press.
 *
 * Who sent it leads the message, because that is the part worth being notified
 * about — the two of them share one object, and a notification that says only
 * which colour was pressed makes you work out the rest.
 *
 * `queued` marks a press that sat in the device's NVS queue while the WiFi was
 * down and only reached the server later. Worth saying out loud, because the
 * notification arriving now does not mean they pressed it now, and that
 * distinction is the whole point of the offline queue.
 */
export async function notifyEvent(
  type: EventType,
  from: EventSender,
  queued: boolean,
): Promise<void> {
  const who = SENDER_TEXT[from] ?? "Home";
  const line =
    type === "love"
      ? `❤️  **${who} loves you**`
      : `💙  **${who} misses you**`;
  const suffix = queued ? "\n_(sent earlier — the device was offline at the time)_" : "";
  await post(line + suffix);
}

/** A drawing. Only the most recent one is kept, so this is also the only
 *  warning that an earlier one is about to be replaced. */
export async function notifyDrawing(): Promise<void> {
  await post("✏️  **They drew you something** — open /os to see it before the next one replaces it");
}
