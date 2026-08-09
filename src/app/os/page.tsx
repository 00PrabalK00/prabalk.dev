import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/prabalos/guard";
import { overview } from "@/lib/prabalos/overview";
import { storageConfigured } from "@/lib/prabalos/store";
import OsConsole from "./OsConsole";

/**
 * The PrabalOS control panel.
 *
 * `proxy.ts` has already bounced anonymous requests before this renders, but
 * the check is repeated here because the proxy runs at the edge with no view
 * of Redis and therefore cannot know about a revoked session. Defence in depth
 * on a page that publishes presence to a physical device.
 */
export const metadata: Metadata = {
  title: "PrabalOS",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function OsPage() {
  if (!(await isAuthed())) redirect("/login");

  if (!storageConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-5">
        <div className="max-w-[460px] border border-fault bg-ink-2 p-6">
          <h1 className="font-display text-[18px] font-semibold text-bone">Storage unconfigured</h1>
          <p className="mono mt-3 text-[12px] leading-relaxed text-mute">
            Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the project environment.
            Until then there is nowhere to keep presence, messages or button presses.
          </p>
        </div>
      </main>
    );
  }

  // Read straight from the store for the first paint. Fetching our own HTTP
  // route here would mean a round trip and forwarding the session cookie to
  // ourselves, for identical data.
  const initial = await overview();
  return <OsConsole initial={initial} />;
}
