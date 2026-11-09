import "server-only";
import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { getOrCreateActiveInvite, inviteUrl } from "@/lib/invites";
import type { TeamContext } from "@/lib/session";

export async function getDashboardData(ctx: TeamContext) {
  const { user, team } = ctx;
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  const [members, nextEvent, weekEvents, eventCount, songCount, favorites, invite] = await Promise.all([
    db.membership.findMany({
      where: { teamId: team.id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.event.findFirst({
      where: { teamId: team.id, date: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) } },
      orderBy: { date: "asc" },
      include: {
        setlist: {
          orderBy: { order: "asc" },
          include: { song: { select: { id: true, title: true, artist: true, key: true } } },
        },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { role: "asc" },
        },
      },
    }),
    db.event.findMany({
      where: { teamId: team.id, date: { gte: today, lt: weekEnd } },
      orderBy: { date: "asc" },
      select: { id: true, title: true, date: true, template: true },
    }),
    db.event.count({ where: { teamId: team.id } }),
    db.song.count({ where: { teamId: team.id } }),
    db.songFavorite.findMany({
      where: { userId: user.id, song: { teamId: team.id } },
      include: { song: { select: { id: true, title: true, artist: true, key: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Solo quien puede invitar recibe (o genera) el link
    ctx.access.invite ? getOrCreateActiveInvite(team.id, user.id) : null,
  ]);

  return {
    members: members.map((m) => ({ ...m.user, role: m.role, instrument: m.instrument })),
    nextEvent,
    weekEvents,
    eventCount,
    songCount,
    favorites: favorites.map((f) => f.song),
    inviteLink: invite ? inviteUrl(invite.token) : null,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
