"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CSRF_HEADER } from "@/lib/prabalos/constants";

/**
 * Records a voice note in exactly the format the device can play.
 *
 * Deliberately not MediaRecorder. That gives WebM/Opus, which would then need
 * transcoding on the server and a decoder on a chip that has neither the flash
 * nor the heap for one alongside WiFi and TLS. Instead the Web Audio API
 * captures at 16 kHz mono and this builds a WAV by hand, so the bytes the
 * browser uploads are the bytes the ESP32 feeds straight into I2S.
 *
 * ScriptProcessorNode is deprecated in favour of AudioWorklet, and is used
 * anyway: an AudioWorklet needs a separately served module file, and this is
 * one short callback on a page only one person will ever open.
 */

const SAMPLE_RATE = 16000;
const MAX_SECONDS = 30;

export default function VoiceRecorder({
  existing,
  onChanged,
  onFlash,
}: {
  existing: { id: string; secs: number; played: boolean } | null;
  onChanged: () => void;
  onFlash: (msg: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const lengthRef = useRef(0);

  const teardown = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Asking for 16 kHz here means the browser resamples, not us. Safari
      // ignores the hint, which is why the upload is validated server-side.
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      ctxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);

      chunksRef.current = [];
      lengthRef.current = 0;

      node.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));
        lengthRef.current += input.length;
        setSeconds(Math.floor(lengthRef.current / ctx.sampleRate));
      };

      source.connect(node);
      // ScriptProcessor only fires while connected to a destination. Routing
      // it to the speakers would echo the microphone, so it goes to a gain
      // node turned all the way down.
      const silent = ctx.createGain();
      silent.gain.value = 0;
      node.connect(silent);
      silent.connect(ctx.destination);

      setRecording(true);
      setSeconds(0);
    } catch {
      onFlash("Microphone blocked.");
    }
  }, [onFlash]);

  const stopAndSend = useCallback(async () => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const rate = ctx.sampleRate;
    const chunks = chunksRef.current;
    const total = lengthRef.current;
    setRecording(false);
    teardown();

    if (total < rate / 2) {
      onFlash("Too short.");
      return;
    }

    setBusy(true);
    try {
      const wav = encodeWav(chunks, total, rate);
      const res = await fetch("/api/prabalos/admin/voice", {
        method: "POST",
        headers: { "Content-Type": "audio/wav", [CSRF_HEADER]: "1" },
        body: wav,
      });

      if (res.ok) {
        onFlash("Voice note sent");
        onChanged();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        onFlash(data.error ?? `Rejected (${res.status})`);
      }
    } catch {
      onFlash("Upload failed.");
    } finally {
      setBusy(false);
    }
  }, [onChanged, onFlash, teardown]);

  // Hard stop at the cap, so a forgotten recording cannot produce a file the
  // device refuses and the blob store has to hold.
  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) void stopAndSend();
  }, [recording, seconds, stopAndSend]);

  const remove = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/prabalos/admin/voice", {
        method: "DELETE",
        headers: { [CSRF_HEADER]: "1" },
      });
      onFlash("Voice note removed");
      onChanged();
    } finally {
      setBusy(false);
    }
  }, [onChanged, onFlash]);

  return (
    <div>
      {!recording ? (
        <button
          disabled={busy}
          onClick={start}
          className="mono w-full border border-violet-400/70 bg-violet-400/10 px-3 py-4 text-[13px] uppercase tracking-[0.2em] text-violet-300 transition-colors hover:bg-violet-400/20 disabled:opacity-50"
        >
          ● Record a voice note
        </button>
      ) : (
        <button
          onClick={stopAndSend}
          className="mono w-full border border-fault bg-fault/15 px-3 py-4 text-[13px] uppercase tracking-[0.2em] text-fault transition-colors hover:bg-fault/25"
        >
          ■ Stop and send — {seconds}s / {MAX_SECONDS}s
        </button>
      )}

      {existing && (
        <div className="mt-3 flex items-center gap-3 border border-line bg-ink-3 px-3 py-2">
          <span className="mono text-[11px] text-bone">
            {existing.secs}s note waiting
          </span>
          <span
            className={`mono text-[9px] uppercase tracking-[0.14em] ${
              existing.played ? "text-mute" : "text-violet-300"
            }`}
          >
            {existing.played ? "played" : "not played yet"}
          </span>
          <button
            disabled={busy}
            onClick={remove}
            className="mono ml-auto text-[10px] uppercase tracking-[0.14em] text-mute transition-colors hover:text-fault"
          >
            Remove
          </button>
        </div>
      )}

      <p className="mono mt-3 text-[10px] leading-relaxed text-mute">
        Recorded at 16 kHz mono so the device can play it straight from the network with no
        decoding. Up to {MAX_SECONDS} seconds. Playing a note pauses the Bluetooth speaker — they
        share one audio output.
      </p>
    </div>
  );
}

/**
 * Builds a 16-bit PCM WAV. The device parses only this header layout, so the
 * field order and the 44-byte length are load-bearing.
 */
function encodeWav(chunks: Float32Array[], total: number, rate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + total * 2);
  const view = new DataView(buffer);

  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  ascii(0, "RIFF");
  view.setUint32(4, 36 + total * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // format: PCM
  view.setUint16(22, 1, true); // channels: mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, total * 2, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      // Clamp before scaling: values outside [-1, 1] would wrap and turn a
      // loud moment into a burst of noise.
      const s = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return buffer;
}
