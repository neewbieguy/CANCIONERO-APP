"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireTeamContext, requireUser } from "@/lib/session";
import { songPrefsSchema } from "@/lib/song-prefs";

const themeSchema = z.enum(["dark", "light", "system"]);

export async function saveThemePreference(theme: string) {
  const user = await requireUser();
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { ok: false as const };
  await db.user.update({ where: { id: user.id }, data: { theme: parsed.data } });
  return { ok: true as const };
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "Ingresá tu nombre").max(60),
  image: z.string().trim().url("URL inválida").max(500).or(z.literal("")),
});

export async function updateProfile(input: { name: string; image: string }) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, image: parsed.data.image || null },
  });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function renameTeam(name: string) {
  const ctx = await requireTeamContext();
  if (!ctx.isAdmin) return { ok: false as const, error: "Solo un admin puede cambiar el nombre del equipo" };
  const parsed = z.string().trim().min(2, "Mínimo 2 caracteres").max(60).safeParse(name);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Nombre inválido" };
  await db.team.update({ where: { id: ctx.team.id }, data: { name: parsed.data } });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/** Guarda las preferencias de lectura de canciones del usuario (vista, notación, fuente, etc.). */
export async function saveSongPrefs(prefs: unknown) {
  const user = await requireUser();
  const parsed = songPrefsSchema.safeParse(prefs);
  if (!parsed.success) return { ok: false as const };
  await db.user.update({ where: { id: user.id }, data: { songPrefs: parsed.data } });
  return { ok: true as const };
}
