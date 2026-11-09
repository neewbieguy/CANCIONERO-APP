import "server-only";
import { addHours, isToday } from "date-fns";
import { db } from "@/lib/db";
import { formatTime } from "@/lib/dates";
import { notifyUsers } from "@/lib/notify";

/**
 * Manda el recordatorio "Mañana/Hoy tenés…" a los participantes (que no rechazaron)
 * de los eventos de las próximas 24 horas. Cada evento se recuerda una sola vez.
 */
export async function sendEventReminders(now = new Date()) {
  const events = await db.event.findMany({
    where: { date: { gt: now, lte: addHours(now, 24) }, reminderSentAt: null },
    include: {
      team: { select: { name: true } },
      participants: { where: { status: { not: "declined" } }, select: { userId: true, role: true } },
    },
  });

  let notified = 0;
  for (const e of events) {
    // Se marca primero para no mandarlo dos veces si dos procesos corren a la vez
    const claimed = await db.event.updateMany({ where: { id: e.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    if (claimed.count === 0) continue;

    const when = isToday(e.date) ? "Hoy" : "Mañana";
    // Agrupamos por rol para que cada uno vea el suyo
    const byRole = new Map<string, string[]>();
    for (const p of e.participants) byRole.set(p.role, [...(byRole.get(p.role) ?? []), p.userId]);
    for (const [role, userIds] of byRole) {
      await notifyUsers(userIds, {
        type: "event_reminder",
        title: `${when}: ${e.title}`,
        body: [`${formatTime(e.date)} hs`, role, e.location].filter(Boolean).join(" · "),
        link: `/eventos/${e.id}`,
      });
      notified += userIds.length;
    }
  }
  return { events: events.length, notified };
}
