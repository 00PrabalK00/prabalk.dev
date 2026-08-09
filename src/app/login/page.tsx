import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/prabalos/guard";
import LoginForm from "./LoginForm";

/**
 * The private door.
 *
 * Nothing on the public site links here; it is reachable only by typing the
 * URL. That is not a security control on its own — the password and TOTP are —
 * but it does keep the page out of crawlers, previews and link unfurlers.
 */
export const metadata: Metadata = {
  title: "PrabalOS",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await isAuthed()) redirect("/os");

  const { next } = await searchParams;
  // Only same-origin relative paths are honoured. Anything else — an absolute
  // URL, a protocol-relative "//evil.example" — falls back to /os, so this
  // parameter can never become an open redirect.
  const target = next && /^\/(?!\/)[A-Za-z0-9/_\-?=&.]*$/.test(next) ? next : "/os";

  return (
    <main className="grid-paper-fine flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-[380px] border border-line bg-ink-2 p-7">
        <div className="mb-7">
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-bone">
            Prabal<span className="text-accent">OS</span>
          </h1>
          <p className="mono mt-1.5 text-[11px] uppercase tracking-[0.2em] text-mute">
            Private terminal
          </p>
        </div>

        <LoginForm next={target} />
      </div>
    </main>
  );
}
