import "server-only";
import { db } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push";
import type { NotificationType } from "@/lib/constants";

/** Crea notificaciones en la campana (y push si está configurado) para varios usuarios. */
export async function notifyUsers(
  userIds: string[],
  data: { type: NotificationType; title: string; body?: string; link?: string },
) {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return;
  await db.notification.createMany({
    data: unique.map((userId) => ({ userId, type: data.type, title: data.title, body: data.body, link: data.link })),
  });
  void sendPushToUsers(unique, { title: data.title, body: data.body, link: data.link }).catch(() => {});
}
