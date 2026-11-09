"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createTeamFor, requireUser } from "@/lib/session";

export async function switchTeam(teamId: string) {
  const user = await requireUser();
  const membership = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId } } });
  if (!membership) return { ok: false as const, error: "No sos miembro de ese equipo" };
  await db.user.update({ where: { id: user.id }, data: { currentTeamId: teamId } });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function createTeam(name: string) {
  const user = await requireUser();
  const parsed = z.string().trim().min(2, "Mínimo 2 caracteres").max(60).safeParse(name);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Nombre inválido" };
  const team = await createTeamFor(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true as const, teamId: team.id };
}
