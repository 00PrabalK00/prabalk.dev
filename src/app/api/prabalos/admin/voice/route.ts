import { badRequest, ok, requireAdmin } from "@/lib/prabalos/admin";
import {
  blobConfigured,
  clearVoiceNote,
  putVoiceNote,
  VOICE_MAX_BYTES,
  VOICE_MAX_SECONDS,
  VOICE_SAMPLE_RATE,
} from "@/lib/prabalos/voice";

/**
 * Upload a voice note from the dashboard.
 *
 * The body is the raw WAV produced by the browser — no multipart, because
 * there is exactly one field and a form envelope would only add parsing.
 *
 * The header is validated rather than trusted: the device streams these bytes
 * straight into an I2S peripheral configured for one specific format, so a
 * stereo or 44.1 kHz file would come out as noise at the wrong speed in a
 * device that has no way to tell anyone why.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  if (!blobConfigured()) {
    return Response.json(
      {
        error:
          "Voice notes need Vercel Blob. Create a Blob store and add BLOB_READ_WRITE_TOKEN, then redeploy.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await req.arrayBuffer();
  if (body.byteLength < 128) return badRequest();
  if (body.byteLength > VOICE_MAX_BYTES) {
    return Response.json(
      { error: `Too long. Keep it under ${VOICE_MAX_SECONDS} seconds.` },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const view = new DataView(body);
  const tag = (o: number) =>
    String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3));

  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return badRequest();

  // fmt chunk: 22 = channels, 24 = sample rate, 34 = bits per sample.
  const channels = view.getUint16(22, true);
  const rate = view.getUint32(24, true);
  const bits = view.getUint16(34, true);

  if (channels !== 1 || rate !== VOICE_SAMPLE_RATE || bits !== 16) {
    console.warn(`[prabalos] rejected voice note: ${channels}ch ${rate}Hz ${bits}bit`);
    return Response.json(
      { error: `Wrong format: needs mono ${VOICE_SAMPLE_RATE} Hz 16-bit.` },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const secs = (body.byteLength - 44) / (VOICE_SAMPLE_RATE * 2);
  const note = await putVoiceNote(body, secs);

  return ok({ ok: true, id: note.id, secs: note.secs, bytes: note.bytes });
}

/** Withdraw a note before it has been heard. */
export async function DELETE(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;
  await clearVoiceNote();
  return ok();
}
