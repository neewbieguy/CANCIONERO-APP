"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { formatShortDate } from "@/lib/dates";
import { notifyUsers } from "@/lib/notify";
import { can } from "@/lib/permissions";
import { isSameSet, moveId, templateMoments } from "@/lib/setlist";
import { requireTeamContext, type TeamContext } from "@/lib/session";
import { EVENT_TEMPLATES, getTemplate } from "@/lib/templates";

type Result = { ok: true } | { ok: false; error: string };
const NO_PERMISSION = "No tenés permiso para gestionar eventos";

/** Contexto + chequeo de permiso de eventos. */
async function requireEventManager(): Promise<{ ok: true; ctx: TeamContext } | { ok: false; error: string }> {
  const ctx = await requireTeamContext();
  if (!can.manageEvents(ctx.membership)) return { ok: false, error: NO_PERMISSION };
  return { ok: true, ctx };
}

function touch(eventId?: string) {
  revalidatePath("/", "layout");
  if (eventId) revalidatePath(`/eventos/${eventId}`);
}

async function findEvent(eventId: string, teamId: string) {
  return db.event.findFirst({ where: { id: eventId, teamId } });
}

// ---------- Evento ----------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const eventSchema = z
  .object({
    title: z.string().trim().min(2, "El título necesita al menos 2 caracteres").max(80),
    date: z.coerce.date({ message: "Fecha inválida" }),
    endDate: z.coerce.date().optional().nullable(),
    template: z.enum(EVENT_TEMPLATES.map((t) => t.id) as [string, ...string[]]).default("custom"),
    location: optionalText(80),
    notes: optionalText(2000),
  })
  .refine((v) => !v.endDate || v.endDate > v.date, { message: "La hora de fin tiene que ser después del inicio", path: ["endDate"] });

export type EventInput = z.input<typeof eventSchema>;

export async function createEvent(input: EventInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const data = parsed.data;

  const moments = templateMoments(getTemplate(data.template));
  const event = await db.event.create({
    data: {
      teamId: ctx.team.id,
      title: data.title,
      date: data.date,
      endDate: data.endDate ?? null,
      template: data.template,
      location: data.location,
      notes: data.notes,
      setlist: { create: moments.map((m, order) => ({ ...m, order })) },
    },
  });
  touch();
  return { ok: true, id: event.id };
}

export async function updateEvent(eventId: string, input: EventInput): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const event = await findEvent(eventId, ctx.team.id);
  if (!event) return { ok: false, error: "Evento no encontrado" };
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const data = parsed.data;

  await db.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      date: data.date,
      endDate: data.endDate ?? null,
      template: data.template,
      location: data.location,
      notes: data.notes,
    },
  });

  // Si cambió la fecha o el lugar, avisamos a los participantes
  const moved = event.date.getTime() !== data.date.getTime() || event.location !== data.location;
  if (moved) {
    const participants = await db.eventParticipant.findMany({
      where: { eventId, userId: { not: ctx.user.id } },
      select: { userId: true },
    });
    await notifyUsers(
      participants.map((p) => p.userId),
      {
        type: "event_updated",
        title: `Cambió ${data.title}`,
        body: [formatShortDate(data.date), data.location].filter(Boolean).join(" · "),
        link: `/eventos/${eventId}`,
      },
    );
  }
  touch(eventId);
  return { ok: true };
}

/** Solo las notas (las puede editar quien gestiona eventos). */
export async function updateEventNotes(eventId: string, notes: string): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsed = z.string().max(2000, "Máximo 2000 caracteres").safeParse(notes);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Notas inválidas" };
  const updated = await db.event.updateMany({
    where: { id: eventId, teamId: ctx.team.id },
    data: { notes: parsed.data.trim() || null },
  });
  if (updated.count === 0) return { ok: false, error: "Evento no encontrado" };
  touch(eventId);
  return { ok: true };
}

export async function deleteEvent(eventId: string): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const event = await db.event.findFirst({
    where: { id: eventId, teamId: ctx.team.id },
    include: { participants: { select: { userId: true } } },
  });
  if (!event) return { ok: false, error: "Evento no encontrado" };

  await db.event.delete({ where: { id: eventId } });
  if (event.date > new Date()) {
    await notifyUsers(
      event.participants.map((p) => p.userId).filter((id) => id !== ctx.user.id),
      { type: "event_updated", title: `Se canceló ${event.title}`, body: formatShortDate(event.date), link: "/eventos" },
    );
  }
  touch();
  return { ok: true };
}

/** Copia el evento (setlist y roles) a una nueva fecha. Los participantes quedan pendientes. */
export async function duplicateEvent(eventId: string, date: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsedDate = z.coerce.date().safeParse(date);
  if (!parsedDate.success) return { ok: false, error: "Fecha inválida" };

  const src = await db.event.findFirst({
    where: { id: eventId, teamId: ctx.team.id },
    include: { setlist: { orderBy: { order: "asc" } }, participants: true },
  });
  if (!src) return { ok: false, error: "Evento no encontrado" };

  const shift = parsedDate.data.getTime() - src.date.getTime();
  const copy = await db.event.create({
    data: {
      teamId: ctx.team.id,
      title: src.title,
      date: parsedDate.data,
      endDate: src.endDate ? new Date(src.endDate.getTime() + shift) : null,
      template: src.template,
      location: src.location,
      notes: src.notes,
      setlist: {
        create: src.setlist.map((i) => ({
          type: i.type,
          order: i.order,
          songId: i.songId,
          title: i.title,
          key: i.key,
          durationMin: i.durationMin,
          notes: i.notes,
        })),
      },
      participants: {
        create: src.participants.map((p) => ({
          userId: p.userId,
          role: p.role,
          status: p.userId === ctx.user.id ? "confirmed" : "pending",
          respondedAt: p.userId === ctx.user.id ? new Date() : null,
        })),
      },
    },
  });

  await notifyUsers(
    src.participants.map((p) => p.userId).filter((id) => id !== ctx.user.id),
    { type: "event_invite", title: `Te asignaron a ${copy.title}`, body: formatShortDate(copy.date), link: `/eventos/${copy.id}` },
  );
  touch();
  return { ok: true, id: copy.id };
}

// ---------- Setlist ----------

async function nextOrder(eventId: string) {
  const last = await db.setlistItem.findFirst({ where: { eventId }, orderBy: { order: "desc" }, select: { order: true } });
  return (last?.order ?? -1) + 1;
}

const keySchema = z
  .string()
  .trim()
  .max(4)
  .regex(/^([A-G][#b]?m?)?$/, "Tono inválido (ej: G, Bb, F#m)")
  .optional()
  .transform((v) => v || null);

const durationSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(600)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const addSongSchema = z.object({
  eventId: z.string().min(1),
  songId: z.string().min(1, "Elegí una canción"),
  key: keySchema,
  notes: optionalText(200),
});

export async function addSongToSetlist(input: z.input<typeof addSongSchema>): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsed = addSongSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { eventId, songId, key, notes } = parsed.data;

  if (!(await findEvent(eventId, ctx.team.id))) return { ok: false, error: "Evento no encontrado" };
  const song = await db.song.findFirst({ where: { id: songId, teamId: ctx.team.id }, select: { key: true } });
  if (!song) return { ok: false, error: "Canción no encontrada" };

  await db.setlistItem.create({
    data: { eventId, type: "song", songId, key: key ?? song.key, notes, order: await nextOrder(eventId) },
  });
  touch(eventId);
  return { ok: true };
}

const addMomentSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().trim().min(1, "Escribí un título").max(60),
  durationMin: durationSchema,
  notes: optionalText(200),
});

export async function addMomentToSetlist(input: z.input<typeof addMomentSchema>): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsed = addMomentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { eventId, title, durationMin, notes } = parsed.data;

  if (!(await findEvent(eventId, ctx.team.id))) return { ok: false, error: "Evento no encontrado" };
  await db.setlistItem.create({
    data: { eventId, type: "moment", title, durationMin, notes, order: await nextOrder(eventId) },
  });
  touch(eventId);
  return { ok: true };
}

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().trim().min(1).max(60).optional(),
  key: keySchema,
  durationMin: durationSchema,
  notes: optionalText(200),
});

export async function updateSetlistItem(input: z.input<typeof updateItemSchema>): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { itemId, title, key, durationMin, notes } = parsed.data;

  const item = await db.setlistItem.findFirst({ where: { id: itemId, event: { teamId: ctx.team.id } } });
  if (!item) return { ok: false, error: "Elemento no encontrado" };

  await db.setlistItem.update({
    where: { id: itemId },
    data:
      item.type === "song"
        ? { key, durationMin, notes }
        : { title: title ?? item.title, durationMin, notes },
  });
  touch(item.eventId);
  return { ok: true };
}

export async function removeSetlistItem(itemId: string): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const item = await db.setlistItem.findFirst({ where: { id: itemId, event: { teamId: ctx.team.id } } });
  if (!item) return { ok: false, error: "Elemento no encontrado" };
  await db.setlistItem.delete({ where: { id: itemId } });
  touch(item.eventId);
  return { ok: true };
}

async function saveOrder(eventId: string, ids: string[]) {
  await db.$transaction(ids.map((id, order) => db.setlistItem.update({ where: { id }, data: { order } })));
}

/** Sube o baja un elemento una posición. */
export async function moveSetlistItem(itemId: string, direction: -1 | 1): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  if (direction !== -1 && direction !== 1) return { ok: false, error: "Dirección inválida" };
  const item = await db.setlistItem.findFirst({ where: { id: itemId, event: { teamId: ctx.team.id } } });
  if (!item) return { ok: false, error: "Elemento no encontrado" };

  const items = await db.setlistItem.findMany({ where: { eventId: item.eventId }, orderBy: { order: "asc" }, select: { id: true } });
  await saveOrder(item.eventId, moveId(items.map((i) => i.id), itemId, direction));
  touch(item.eventId);
  return { ok: true };
}

/** Guarda un orden completo (arrastrar y soltar). */
export async function reorderSetlist(eventId: string, ids: string[]): Promise<Result> {
  const auth = await requireEventManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  if (!(await findEvent(eventId, ctx.team.id))) return { ok: false, error: "Evento no encontrado" };
  const items = await db.setlistItem.findMany({ where: { eventId }, select: { id: true } });
  if (!isSameSet(items.map((i) => i.id), ids)) return { ok: false, error: "El setlist cambió, recargá la página" };
  await saveOrder(eventId, ids);
  touch(eventId);
  return { ok: true };
}
