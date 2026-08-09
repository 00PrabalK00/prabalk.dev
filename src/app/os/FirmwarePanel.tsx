"use client";

import { useRef, useState } from "react";
import { CSRF_HEADER } from "@/lib/prabalos/constants";
import type { Overview } from "@/lib/prabalos/overview";

/**
 * Publish firmware to the device.
 *
 * The authenticator code is required here and nowhere else in the dashboard.
 * Everything else on this page changes what the device *shows*; this changes
 * what it *runs*, in a house on the other side of the world. An unlocked
 * laptop should be able to set a status and should not be able to flash
 * firmware.
 */
export default function FirmwarePanel({
  firmware,
  deviceFw,
  onChanged,
  onFlash,
}: {
  firmware: Overview["firmware"];
  deviceFw: string;
  onChanged: () => void;
  onFlash: (msg: string) => void;
}) {
  const [version, setVersion] = useState("");
  const [totp, setTotp] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pending = firmware && firmware.version !== deviceFw;

  async function publish() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      onFlash("Choose a .bin first.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/prabalos/admin/firmware", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          [CSRF_HEADER]: "1",
          "X-POS-FW-Version": version,
          "X-POS-TOTP": totp,
        },
        body: await file.arrayBuffer(),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; version?: string };
      if (res.ok) {
        onFlash(`Firmware ${data.version} published`);
        setTotp("");
        if (fileRef.current) fileRef.current.value = "";
        onChanged();
      } else {
        onFlash(data.error ?? `Rejected (${res.status})`);
      }
    } catch {
      onFlash("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    try {
      const res = await fetch("/api/prabalos/admin/firmware", {
        method: "DELETE",
        headers: { [CSRF_HEADER]: "1", "X-POS-TOTP": totp },
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      onFlash(res.ok ? "Update withdrawn" : (data.error ?? "Rejected"));
      if (res.ok) onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 flex items-baseline gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.16em] text-mute">Running</span>
        <span className="mono text-[12px] text-bone">{deviceFw || "unknown"}</span>
        {pending && (
          <span className="mono text-[10px] uppercase tracking-[0.14em] text-amber-400">
            {firmware.version} waiting to install
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".bin"
        className="mono border border-line bg-ink-3 px-2.5 py-2 text-[11px] text-mute file:mr-3 file:border-0 file:bg-line file:px-2 file:py-1 file:text-bone"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value.replace(/[^0-9.]/g, "").slice(0, 12))}
          placeholder="1.1.0"
          className="mono border border-line bg-ink-3 px-2.5 py-2 text-[13px] text-bone outline-none focus:border-accent"
        />
        <input
          value={totp}
          onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="6-digit code"
          className="mono border border-amber-500/60 bg-ink-3 px-2.5 py-2 text-[13px] tracking-[0.2em] text-bone outline-none focus:border-amber-400"
        />
      </div>

      <button
        disabled={busy || totp.length !== 6 || !/^\d+\.\d+\.\d+$/.test(version)}
        onClick={publish}
        className="mono border border-amber-500 bg-amber-500/10 px-3 py-2.5 text-[11px] uppercase tracking-[0.18em] text-amber-400 transition-colors hover:bg-amber-500/20 disabled:border-line disabled:bg-transparent disabled:text-mute"
      >
        Publish firmware
      </button>

      {pending && (
        <button
          disabled={busy || totp.length !== 6}
          onClick={withdraw}
          className="mono border border-line px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-mute transition-colors hover:border-fault hover:text-fault disabled:opacity-40"
        >
          Withdraw update
        </button>
      )}

      <p className="mono mt-1 text-[10px] leading-relaxed text-mute">
        Needs a live authenticator code — a session alone is not enough to replace the code running
        in someone&apos;s house. The device verifies the SHA-256 before rebooting, and the previous
        firmware stays bootable, so a bad image rolls back instead of bricking it.
      </p>
    </div>
  );
}
