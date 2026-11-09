import "server-only";
import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { getOrCreateActiveInvite, inviteUrl } from "@/lib/invites";
import type { TeamContext } from "@/lib/session";
import { getUnreadByChannel } from "./chats";

export async function getDashboardData(ctx: TeamContext) {
  const { user, team } = ctx;
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  const [members, nextEvent, weekEvents, eventCount, songCount, favorites, unreadMap, invite] = await Promise.all([
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
    getUnreadByChannel(user.id, team.id),
    getOrCreateActiveInvite(team.id, user.id),
  ]);

  // Canales con mensajes sin leer (para la tarjeta de chats)
  const unreadChannelIds = Array.from(unreadMap.entries()).filter(([, n]) => n > 0);
  const unreadChannels = unreadChannelIds.length
    ? await db.channel.findMany({
        where: { id: { in: unreadChannelIds.map(([id]) => id) } },
        select: { id: true, type: true, event: { select: { title: true } } },
      })
    : [];

  return {
    members: members.map((m) => ({ ...m.user, role: m.role, instrument: m.instrument })),
    nextEvent,
    weekEvents,
    eventCount,
    songCount,
    favorites: favorites.map((f) => f.song),
    unread: {
      total: unreadChannelIds.reduce((acc, [, n]) => acc + n, 0),
      channels: unreadChannels
        .map((c) => ({
          id: c.id,
          name: c.type === "team" ? "General" : (c.event?.title ?? "Evento"),
          count: unreadMap.get(c.id) ?? 0,
        }))
        .sort((a, b) => b.count - a.count),
    },
    inviteLink: inviteUrl(invite.token),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
