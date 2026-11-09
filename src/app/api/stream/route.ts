import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscribe, topics, type RealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stream SSE del usuario: eventos de su equipo actual + los personales. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("No autorizado", { status: 401 });
  const userId = session.user.id;

  const teamId = new URL(req.url).searchParams.get("teamId");
  if (!teamId) return new Response("Falta teamId", { status: 400 });
  const member = await db.membership.findUnique({ where: { userId_teamId: { userId, teamId } } });
  if (!member) return new Response("Prohibido", { status: 403 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent | { type: "ping" }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          cleanup();
        }
      };
      send({ type: "ping" });
      const offTeam = subscribe(topics.team(teamId), send);
      const offUser = subscribe(topics.user(userId), send);
      const heartbeat = setInterval(() => send({ type: "ping" }), 25_000);
      cleanup = () => {
        clearInterval(heartbeat);
        offTeam();
        offUser();
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
