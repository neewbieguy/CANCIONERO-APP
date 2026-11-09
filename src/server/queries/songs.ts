import "server-only";
import { db } from "@/lib/db";
import type { TeamContext } from "@/lib/session";

/** Biblioteca del equipo, con favoritos del usuario y cuándo se usó cada canción. */
export async function listSongs(ctx: TeamContext) {
  const now = new Date();
  const [songs, favorites, usage] = await Promise.all([
    db.song.findMany({
      where: { teamId: ctx.team.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true, artist: true, key: true, bpm: true, tags: true, chordSheet: true },
    }),
    db.songFavorite.findMany({ where: { userId: ctx.user.id, song: { teamId: ctx.team.id } }, select: { songId: true } }),
    db.setlistItem.findMany({
      where: { type: "song", event: { teamId: ctx.team.id, date: { lte: now } }, songId: { not: null } },
      select: { songId: true, event: { select: { date: true } } },
    }),
  ]);

  const fav = new Set(favorites.map((f) => f.songId));
  const uses = new Map<string, { count: number; last: Date }>();
  for (const u of usage) {
    const cur = uses.get(u.songId!);
    if (!cur) uses.set(u.songId!, { count: 1, last: u.event.date });
    else {
      cur.count++;
      if (u.event.date > cur.last) cur.last = u.event.date;
    }
  }

  return songs.map(({ chordSheet, ...s }) => ({
    ...s,
    hasSheet: Boolean(chordSheet?.trim()),
    favorite: fav.has(s.id),
    timesUsed: uses.get(s.id)?.count ?? 0,
    lastUsed: uses.get(s.id)?.last ?? null,
  }));
}
export type SongListItem = Awaited<ReturnType<typeof listSongs>>[number];

export async function getSong(ctx: TeamContext, songId: string) {
  const song = await db.song.findFirst({ where: { id: songId, teamId: ctx.team.id } });
  if (!song) return null;
  const [favorite, events] = await Promise.all([
    db.songFavorite.findUnique({ where: { userId_songId: { userId: ctx.user.id, songId } } }),
    db.setlistItem.findMany({
      where: { songId },
      orderBy: { event: { date: "desc" } },
      take: 8,
      select: { key: true, event: { select: { id: true, title: true, date: true } } },
    }),
  ]);
  return { ...song, favorite: Boolean(favorite), events };
}
export type SongDetail = NonNullable<Awaited<ReturnType<typeof getSong>>>;

/** Canciones del setlist de un evento, en orden, para el Modo Atril. */
export async function getStageData(ctx: TeamContext, eventId: string) {
  return db.event.findFirst({
    where: { id: eventId, teamId: ctx.team.id },
    select: {
      id: true,
      title: true,
      date: true,
      setlist: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          key: true,
          notes: true,
          durationMin: true,
          song: { select: { id: true, title: true, artist: true, key: true, bpm: true, chordSheet: true } },
        },
      },
    },
  });
}
export type StageData = NonNullable<Awaited<ReturnType<typeof getStageData>>>;
