import "server-only";
import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import type { TeamContext } from "@/lib/session";

const userSelect = { id: true, name: true, email: true, image: true } as const;

/** Eventos próximos (desde hoy) o pasados del equipo actual. */
export async function listEvents(ctx: TeamContext, scope: "upcoming" | "past") {
  const today = startOfDay(new Date());
  const events = await db.event.findMany({
    where: { teamId: ctx.team.id, date: scope === "upcoming" ? { gte: today } : { lt: today } },
    orderBy: { date: scope === "upcoming" ? "asc" : "desc" },
    take: scope === "past" ? 50 : undefined,
    include: {
      setlist: { where: { type: "song" }, select: { id: true } },
      participants: { include: { user: { select: userSelect } }, orderBy: { role: "asc" } },
    },
  });
  return events.map((e) => {
    const me = e.participants.find((p) => p.userId === ctx.user.id);
    return {
      id: e.id,
      title: e.title,
      date: e.date,
      template: e.template,
      location: e.location,
      songCount: e.setlist.length,
      participants: e.participants.map((p) => p.user),
      confirmed: e.participants.filter((p) => p.status === "confirmed").length,
      myRole: me?.role ?? null,
      myStatus: me?.status ?? null,
    };
  });
}
export type EventListItem = Awaited<ReturnType<typeof listEvents>>[number];

export async function getEventDetail(ctx: TeamContext, eventId: string) {
  return db.event.findFirst({
    where: { id: eventId, teamId: ctx.team.id },
    include: {
      setlist: {
        orderBy: { order: "asc" },
        include: { song: { select: { id: true, title: true, artist: true, key: true, bpm: true } } },
      },
      participants: {
        include: { user: { select: userSelect } },
        orderBy: { role: "asc" },
      },
    },
  });
}
export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventDetail>>>;

/** Datos para los selectores del editor (canciones y miembros del equipo). */
export async function getEventEditorOptions(ctx: TeamContext) {
  const [songs, members] = await Promise.all([
    db.song.findMany({
      where: { teamId: ctx.team.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true, artist: true, key: true },
    }),
    db.membership.findMany({
      where: { teamId: ctx.team.id },
      orderBy: { joinedAt: "asc" },
      select: { instrument: true, user: { select: userSelect } },
    }),
  ]);
  return { songs, members: members.map((m) => ({ ...m.user, instrument: m.instrument })) };
}
export type EditorOptions = Awaited<ReturnType<typeof getEventEditorOptions>>;
