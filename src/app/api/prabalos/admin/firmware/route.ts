import { badRequest, ok, requireAdmin } from "@/lib/prabalos/admin";
import { verifyTotp } from "@/lib/prabalos/auth-user";
import { logAuth } from "@/lib/prabalos/store";
import {
  clearFirmware,
  FIRMWARE_MAX_BYTES,
  firmwareConfigured,
  putFirmware,
} from "@/lib/prabalos/firmware";

/**
 * Publish a firmware image.
 *
 * This is the most dangerous endpoint in the project — it replaces the code
 * running on a device in someone's home — so it is the only one that demands a
 * fresh TOTP code rather than trusting the session cookie. A borrowed or
 * unlocked laptop can set a status; it cannot flash firmware without the phone
 * in your pocket.
 *
 * Recovery codes are deliberately NOT accepted here. They exist for the case
 * where the authenticator is gone, and "I am on a stranger's phone in an
 * emergency" is precisely when you should not also be able to push code.
 *
 * The version and the raw .bin come as headers plus body rather than multipart:
 * one file, two scalars, and multipart would only add a parser to the most
 * security-sensitive route here.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;

export async function POST(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 120);

  const code = req.headers.get("x-pos-totp") ?? "";
  if (!verifyTotp(code)) {
    await logAuth({ ok: false, ip, ua, reason: "firmware upload: bad TOTP" });
    return Response.json(
      { error: "Enter a current authenticator code to publish firmware." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!firmwareConfigured()) {
    return Response.json(
      { error: "Firmware updates need Vercel Blob. Add BLOB_READ_WRITE_TOKEN and redeploy." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const version = (req.headers.get("x-pos-fw-version") ?? "").trim();
  if (!VERSION_RE.test(version)) {
    return Response.json(
      { error: "Version must look like 1.2.3." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const bin = await req.arrayBuffer();
  if (bin.byteLength < 100_000) return badRequest();
  if (bin.byteLength > FIRMWARE_MAX_BYTES) {
    return Response.json(
      {
        error: `Image is ${Math.round(bin.byteLength / 1024)} KB; an OTA slot holds ${Math.round(
          FIRMWARE_MAX_BYTES / 1024,
        )} KB.`,
      },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  // ESP32 application images start with 0xE9. Catching the wrong file here
  // costs nothing; catching it on the device costs a reboot loop in Bangkok.
  if (new DataView(bin).getUint8(0) !== 0xe9) {
    return Response.json(
      { error: "That is not an ESP32 image (missing 0xE9 magic byte)." },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const release = await putFirmware(bin, version);
  await logAuth({ ok: true, ip, ua, reason: `published firmware ${version}` });

  return ok({ ok: true, version: release.version, sha256: release.sha256, bytes: release.bytes });
}

/** Withdraw a pending update. */
export async function DELETE(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;
  if (!verifyTotp(req.headers.get("x-pos-totp") ?? "")) {
    return Response.json(
      { error: "Enter a current authenticator code." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  await clearFirmware();
  return ok();
}
