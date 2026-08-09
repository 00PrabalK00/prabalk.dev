"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Two fields, one button. The password manager fills the first, the
 * authenticator app supplies the second.
 *
 * The server returns one generic error for every failure mode, so this
 * component has nothing clever to say either — it renders exactly what it is
 * given and never guesses which field was wrong.
 */
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/prabalos/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });

      if (res.ok) {
        // refresh() before replace(): /os is a server component that reads the
        // cookie, and the router may still be holding an RSC payload rendered
        // while it did not exist.
        router.refresh();
        router.replace(next);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string; remaining?: number };
      const remaining = typeof data.remaining === "number" ? data.remaining : null;
      setError(
        remaining !== null && remaining <= 2
          ? `${data.error ?? "Incorrect credentials."} ${remaining} attempt${
              remaining === 1 ? "" : "s"
            } left.`
          : (data.error ?? "Incorrect credentials."),
      );
      setCode("");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="mono text-[11px] uppercase tracking-[0.18em] text-mute">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
          className="mono rounded-none border border-line bg-ink-3 px-3 py-2.5 text-bone outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="mono text-[11px] uppercase tracking-[0.18em] text-mute">
          Authenticator code
        </span>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          className="mono rounded-none border border-line bg-ink-3 px-3 py-2.5 text-[18px] tracking-[0.4em] text-bone outline-none transition-colors focus:border-accent"
        />
      </label>

      {error && (
        <p role="alert" className="mono text-[12px] leading-relaxed text-fault">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || password.length === 0 || code.length !== 6}
        className="mono mt-1 border border-accent bg-accent/10 px-4 py-3 text-[12px] uppercase tracking-[0.22em] text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-mute"
      >
        {busy ? "Checking..." : "Unlock"}
      </button>
    </form>
  );
}
