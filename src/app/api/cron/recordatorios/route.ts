import { sendEventReminders } from "@/server/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manda los recordatorios pendientes. Protegido con CRON_SECRET:
 * Vercel Cron manda "Authorization: Bearer <CRON_SECRET>" automáticamente.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("No autorizado", { status: 401 });
  }
  const result = await sendEventReminders();
  return Response.json({ ok: true, ...result });
}
