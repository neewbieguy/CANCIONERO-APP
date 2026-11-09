import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accessOf } from "@/lib/permissions";

/** Usuario logueado (o null). Cacheado por request. */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Crea un equipo nuevo con el usuario como admin. */
export async function createTeamFor(userId: string, name: string) {
  const team = await db.team.create({
    data: {
      name,
      memberships: { create: { userId, role: "admin" } },
    },
  });
  await db.user.update({ where: { id: userId }, data: { currentTeamId: team.id } });
  return team;
}

/**
 * Contexto del equipo actual: usuario + equipo + membresía.
 * Si el usuario no tiene equipo, se le crea uno automáticamente.
 */
export const requireTeamContext = cache(async () => {
  const user = await requireUser();

  let membership = user.currentTeamId
    ? await db.membership.findUnique({
        where: { userId_teamId: { userId: user.id, teamId: user.currentTeamId } },
        include: { team: true },
      })
    : null;

  if (!membership) {
    membership = await db.membership.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: "asc" },
      include: { team: true },
    });
    if (membership) {
      await db.user.update({ where: { id: user.id }, data: { currentTeamId: membership.teamId } });
    }
  }

  if (!membership) {
    const firstName = user.name?.split(" ")[0];
    const team = await createTeamFor(user.id, firstName ? `Equipo de ${firstName}` : "Mi equipo");
    membership = await db.membership.findUniqueOrThrow({
      where: { userId_teamId: { userId: user.id, teamId: team.id } },
      include: { team: true },
    });
  }

  const { team, ...m } = membership;
  const access = accessOf(m);
  return { user, team, membership: m, isAdmin: access.isAdmin, access };
});

export type TeamContext = Awaited<ReturnType<typeof requireTeamContext>>;
