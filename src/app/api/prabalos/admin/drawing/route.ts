import { ok, requireAdmin } from "@/lib/prabalos/admin";
import { clearDrawing, getDrawingStrokes, markDrawingSeen } from "@/lib/prabalos/drawing";

/** Fetch the current drawing's strokes for the dashboard, or discard it. */

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const strokes = await getDrawingStrokes();
  if (!strokes) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  await markDrawingSeen().catch(() => {});
  return ok({ ok: true, strokes });
}

export async function DELETE(req: Request): Promise<Response> {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;
  await clearDrawing();
  return ok();
}
