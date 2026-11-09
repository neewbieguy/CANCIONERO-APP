"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { pushEnabled, sendPushToUsers } from "@/lib/push";
import { requireUser } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Guarda la suscripción push de este dispositivo para el usuario logueado. */
export async function subscribePush(input: z.input<typeof subscriptionSchema>): Promise<Result> {
  const user = await requireUser();
  if (!pushEnabled) return { ok: false, error: "Las notificaciones push no están configuradas en el servidor" };
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Suscripción inválida" };
  const { endpoint, keys } = parsed.data;

  // Si el dispositivo estaba asociado a otra cuenta (celular compartido), pasa a esta
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
  });
  return { ok: true };
}

export async function unsubscribePush(endpoint: string): Promise<Result> {
  const user = await requireUser();
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return { ok: true };
}

/** Manda una notificación de prueba a todos los dispositivos del usuario. */
export async function sendTestPush(): Promise<Result> {
  const user = await requireUser();
  if (!pushEnabled) return { ok: false, error: "Las notificaciones push no están configuradas en el servidor" };
  const count = await db.pushSubscription.count({ where: { userId: user.id } });
  if (count === 0) return { ok: false, error: "No hay dispositivos con notificaciones activadas" };
  await sendPushToUsers([user.id], {
    title: "¡Las notificaciones funcionan! 🎶",
    body: "Así te vamos a avisar de asignaciones y cambios en los eventos.",
    link: "/ajustes",
  });
  return { ok: true };
}
