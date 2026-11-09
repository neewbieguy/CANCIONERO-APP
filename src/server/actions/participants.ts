"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyUsers } from "@/lib/notify";
import { can } from "@/lib/permissions";
import { publish, topics } from "@/lib/realtime";
import { requireTeamContext } from "@/lib/session";
import { formatShortDate } from "@/lib/dates";

type Result = { ok: true } | { ok: false; error: string };

async function loadEvent(eventId: string, teamId: string) {
  return db.event.findFirst({ where: { id: eventId, teamId }, select: { id: true, title: true, date: true } });
}

function touch(teamId: string, eventId: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/eventos/${eventId}`);
  publish(topics.team(teamId), { type: "refresh", scope: `event:${eventId}` });
}

export async function respondToEvent(eventId: string, status: "confirmed" | "declined"): Promise<Result> {
  const ctx = await requireTeamContext();
  const parsed = z.enum(["confirmed", "declined"]).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Estado inválido" };
  const event = await loadEvent(eventId, ctx.team.id);
  if (!event) return { ok: false, error: "Evento no encontrado" };

  const updated = await db.eventParticipant.updateMany({
    where: { eventId, userId: ctx.user.id },
    data: { status: parsed.data, respondedAt: new Date() },
  });
  if (updated.count === 0) return { ok: false, error: "No estás asignado a este evento" };

  const admins = await db.membership.findMany({
    where: { teamId: ctx.team.id, role: "admin", userId: { not: ctx.user.id } },
    select: { userId: true },
  });
  await notifyUsers(
    admins.map((a) => a.userId),
    {
      type: "event_updated",
      title: `${ctx.user.name ?? ctx.user.email} ${parsed.data === "confirmed" ? "confirmó" : "no puede ir a"} ${event.title}`,
      body: formatShortDate(event.date),
      link: `/eventos/${eventId}`,
    },
  );
  touch(ctx.team.id, eventId);
  return { ok: true };
}

const addSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().trim().min(1, "Elegí un rol").max(40),
});

export async function addParticipant(input: z.infer<typeof addSchema>): Promise<Result> {
  const ctx = await requireTeamContext();
  if (!can.manageEvents(ctx.membership)) return { ok: false, error: "No tenés permiso para gestionar eventos" };
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { eventId, userId, role } = parsed.data;

  const event = await loadEvent(eventId, ctx.team.id);
  if (!event) return { ok: false, error: "Evento no encontrado" };
  const member = await db.membership.findUnique({ where: { userId_teamId: { userId, teamId: ctx.team.id } } });
  if (!member) return { ok: false, error: "Esa persona no es miembro del equipo" };

  const existing = await db.eventParticipant.findUnique({ where: { eventId_userId: { eventId, userId } } });
  if (existing) {
    await db.eventParticipant.update({ where: { id: existing.id }, data: { role } });
  } else {
    const isSelf = userId === ctx.user.id;
    await db.eventParticipant.create({
      data: { eventId, userId, role, status: isSelf ? "confirmed" : "pending", respondedAt: isSelf ? new Date() : null },
    });
    if (!isSelf) {
      await notifyUsers([userId], {
        type: "event_invite",
        title: `Te asignaron a ${event.title}`,
        body: `${role} · ${formatShortDate(event.date)}`,
        link: `/eventos/${eventId}`,
      });
    }
  }
  touch(ctx.team.id, eventId);
  return { ok: true };
}

export async function removeParticipant(eventId: string, userId: string): Promise<Result> {
  const ctx = await requireTeamContext();
  if (!can.manageEvents(ctx.membership)) return { ok: false, error: "No tenés permiso para gestionar eventos" };
  const event = await loadEvent(eventId, ctx.team.id);
  if (!event) return { ok: false, error: "Evento no encontrado" };
  await db.eventParticipant.deleteMany({ where: { eventId, userId } });
  touch(ctx.team.id, eventId);
  return { ok: true };
}

export async function setParticipantStatus(
  eventId: string,
  userId: string,
  status: "pending" | "confirmed" | "declined",
): Promise<Result> {
  const ctx = await requireTeamContext();
  if (!can.manageEvents(ctx.membership) && userId !== ctx.user.id)
    return { ok: false, error: "No tenés permiso" };
  const parsed = z.enum(["pending", "confirmed", "declined"]).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Estado inválido" };
  const event = await loadEvent(eventId, ctx.team.id);
  if (!event) return { ok: false, error: "Evento no encontrado" };
  await db.eventParticipant.updateMany({
    where: { eventId, userId },
    data: { status: parsed.data, respondedAt: parsed.data === "pending" ? null : new Date() },
  });
  touch(ctx.team.id, eventId);
  return { ok: true };
}
