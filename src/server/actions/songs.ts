"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { toChordPro } from "@/lib/music/chordpro";
import { can } from "@/lib/permissions";
import { requireTeamContext, type TeamContext } from "@/lib/session";
import { tagsToCsv } from "@/lib/songs";

type Result = { ok: true } | { ok: false; error: string };
const NO_PERMISSION = "No tenés permiso para gestionar canciones";

async function requireSongManager(): Promise<{ ok: true; ctx: TeamContext } | { ok: false; error: string }> {
  const ctx = await requireTeamContext();
  if (!can.manageSongs(ctx.membership)) return { ok: false, error: NO_PERMISSION };
  return { ok: true, ctx };
}

function touch(songId?: string) {
  revalidatePath("/", "layout");
  if (songId) revalidatePath(`/canciones/${songId}`);
}

const songSchema = z.object({
  title: z.string().trim().min(1, "Escribí el título").max(100),
  artist: z.string().trim().max(100).optional().transform((v) => v || null),
  key: z
    .string()
    .trim()
    .max(4)
    .regex(/^([A-G][#b]?m?)?$/, "Tono inválido (ej: G, Bb, F#m)")
    .optional()
    .transform((v) => v || null),
  bpm: z.coerce
    .number()
    .int("El BPM tiene que ser un número entero")
    .min(0)
    .max(300, "BPM máximo: 300")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  tags: z.array(z.string()).max(20).default([]),
  chordSheet: z.string().max(20000, "La hoja es demasiado larga").default(""),
});
export type SongInput = z.input<typeof songSchema>;

function toData(input: z.output<typeof songSchema>) {
  const sheet = input.chordSheet.trim();
  return {
    title: input.title,
    artist: input.artist,
    key: input.key,
    bpm: input.bpm,
    tags: tagsToCsv(input.tags),
    // Si pegaron "acordes arriba de la letra", se convierte a ChordPro
    chordSheet: sheet ? toChordPro(sheet) : null,
  };
}

export async function createSong(input: SongInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireSongManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const song = await db.song.create({ data: { teamId: ctx.team.id, ...toData(parsed.data) } });
  touch();
  return { ok: true, id: song.id };
}

export async function updateSong(songId: string, input: SongInput): Promise<Result> {
  const auth = await requireSongManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const parsed = songSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const updated = await db.song.updateMany({ where: { id: songId, teamId: ctx.team.id }, data: toData(parsed.data) });
  if (updated.count === 0) return { ok: false, error: "Canción no encontrada" };
  touch(songId);
  return { ok: true };
}

export async function deleteSong(songId: string): Promise<Result> {
  const auth = await requireSongManager();
  if (!auth.ok) return auth;
  const { ctx } = auth;
  const song = await db.song.findFirst({ where: { id: songId, teamId: ctx.team.id }, select: { id: true } });
  if (!song) return { ok: false, error: "Canción no encontrada" };

  await db.$transaction([
    // En los setlists de eventos futuros se quita; en los pasados queda como "Canción eliminada"
    db.setlistItem.deleteMany({ where: { songId, event: { date: { gte: new Date() } } } }),
    db.song.delete({ where: { id: songId } }),
  ]);
  touch();
  return { ok: true };
}

/** Marca o desmarca una canción como favorita (cualquier miembro). */
export async function toggleFavorite(songId: string, favorite: boolean): Promise<Result> {
  const ctx = await requireTeamContext();
  const song = await db.song.findFirst({ where: { id: songId, teamId: ctx.team.id }, select: { id: true } });
  if (!song) return { ok: false, error: "Canción no encontrada" };

  if (favorite) {
    await db.songFavorite.upsert({
      where: { userId_songId: { userId: ctx.user.id, songId } },
      create: { userId: ctx.user.id, songId },
      update: {},
    });
  } else {
    await db.songFavorite.deleteMany({ where: { userId: ctx.user.id, songId } });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
