import {
  getCounters,
  getVersion,
  getDeviceHealth,
  getIncoming,
  getMusic,
  getState,
  listAuthLog,
  listEvents,
  listMessages,
} from "./store";
import { getVoiceNote } from "./voice";
import { getFirmware } from "./firmware";

/**
 * Everything the dashboard shows, gathered in one pass.
 *
 * Lives here rather than in the route so that the /os server component can
 * call it directly for the first paint — going out over HTTP to your own
 * origin just to render a page is a round trip and a cookie-forwarding problem
 * for no benefit. The route exists for the client-side poll.
 */
export async function overview() {
  const deviceId = process.env.PRABALOS_DEVICE_ID || "PRABALOS_HOME_01";

  const [state, music, messages, events, counters, incoming, health, authLog, voice, firmware] =
    await Promise.all([
    getState(),
    getMusic(),
    listMessages(20),
    listEvents(30),
    getCounters(),
    getIncoming(),
    getDeviceHealth(deviceId),
    listAuthLog(10),
      getVoiceNote().catch(() => null),
      getFirmware().catch(() => null),
    ]);

  return {
    /** Bumped by every write; the dashboard sends it back so an unchanged poll
     *  costs two reads instead of a dozen. */
    version: await getVersion(),
    state,
    music,
    messages,
    events,
    counters,
    incoming,
    health,
    authLog,
    deviceId,
    voice,
    firmware,
    /** Server clock, so "last seen 4s ago" does not depend on the viewer's
     *  device being set correctly — and so the component never has to read
     *  Date.now() during render. */
    now: Math.floor(Date.now() / 1000),
  };
}

export type Overview = Awaited<ReturnType<typeof overview>>;
