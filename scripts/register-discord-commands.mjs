#!/usr/bin/env node
/**
 * Registers the PrabalOS slash commands with Discord. Run once, and again
 * whenever a command's name, description or options change.
 *
 *   node scripts/register-discord-commands.mjs
 *
 * Reads PRABALOS_DISCORD_APP_ID and PRABALOS_DISCORD_BOT_TOKEN from the
 * environment or from .env.local. The bot token is only needed here — the
 * running site never uses it, so it does not belong in Vercel's env at all.
 *
 * This is a PUT, so the list below is the complete set: a command removed from
 * this file is removed from Discord on the next run.
 */

import { readFileSync } from "node:fs";

/**
 * The status list, read out of types.ts.
 *
 * A plain Node script cannot import TypeScript, and copying the list here would
 * eventually drift from the one the device actually renders — registering a
 * choice the firmware has no icon for. Scraping the source keeps one
 * definition, and fails loudly rather than silently registering a stale list.
 */
function statuses() {
  const src = readFileSync(new URL("../src/lib/prabalos/types.ts", import.meta.url), "utf8");
  const block = src.match(/export const STATUSES = \[([\s\S]*?)\] as const;/);
  if (!block) throw new Error("Could not find STATUSES in src/lib/prabalos/types.ts");

  const found = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (found.length === 0) throw new Error("STATUSES parsed as empty");
  return found;
}

const STATUSES = statuses();

/** Loads .env.local without adding a dotenv dependency for a one-off script. */
function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    /* no .env.local — rely on the real environment */
  }
}

loadEnv();

const APP_ID = process.env.PRABALOS_DISCORD_APP_ID?.trim();
const TOKEN = process.env.PRABALOS_DISCORD_BOT_TOKEN?.trim();

if (!APP_ID || !TOKEN) {
  console.error(
    "Missing PRABALOS_DISCORD_APP_ID or PRABALOS_DISCORD_BOT_TOKEN.\n" +
      "Both are on the Discord Developer Portal:\n" +
      "  App ID  — General Information\n" +
      "  Token   — Bot → Reset Token",
  );
  process.exit(1);
}

const STRING = 3;

const commands = [
  {
    name: "status",
    description: "Set what the device shows you are doing",
    options: [
      {
        type: STRING,
        name: "status",
        description: "Presence",
        required: true,
        // Choices rather than free text: the device renders these against a
        // fixed icon table and has no fallback for an unknown string.
        choices: STATUSES.map((s) => ({ name: s, value: s })),
      },
      {
        type: STRING,
        name: "place",
        description: 'Optional soft place, e.g. "Brooklyn". Never an address.',
        required: false,
      },
    ],
  },
  {
    name: "say",
    description: "Send a message to the device",
    options: [
      { type: STRING, name: "message", description: "What to say", required: true },
    ],
  },
  {
    name: "note",
    description: "Set the daily note on the home screen (empty clears it)",
    options: [
      { type: STRING, name: "text", description: "The note", required: false },
    ],
  },
  { name: "love", description: "Send love to the device" },
  { name: "state", description: "What the device is showing, and its health" },
];

const res = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error(`Discord returned ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const registered = await res.json();
console.log(`Registered ${registered.length} commands:`);
for (const c of registered) console.log(`  /${c.name}`);
console.log("\nGlobal commands can take up to an hour to appear in every client.");
