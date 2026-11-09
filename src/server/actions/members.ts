"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { TEAM_ROLES } from "@/lib/constants";
import { inviteUrl, isInviteUsable, regenerateInvite } from "@/lib/invites";
import { notifyUsers } from "@/lib/notify";
import {
  MEMBER_PERMISSIONS,
  can,
  canChangeRole,
  canEditInstrument,
  canGrantPermission,
  canRemoveMember,
} from "@/lib/permissions";
import { publish, topics } from "@/lib/realtime";
import { requireTeamContext, requireUser } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

/** Avisa a todas las pestañas del equipo que algo cambió en los miembros. */
function refreshTeam(teamId: string) {
  revalidatePath("/", "layout");
  publish(topics.team(teamId), { type: "refresh", scope: "members" });
}

async function findMember(teamId: string, userId: string) {
  return db.membership.findUnique({
    where: { userId_teamId: { userId, teamId } },
    include: { user: { select: { name: true, email: true } } },
  });
}

const adminCountOf = (teamId: string) => db.membership.count({ where: { teamId, role: "admin" } });

// ---------- Permisos ----------

const permissionSchema = z.object({
  userId: z.string().min(1),
  permission: z.enum(MEMBER_PERMISSIONS),
  value: z.boolean(),
});

/** El admin da o quita un permiso a un miembro del equipo actual. */
export async function setMemberPermission(input: z.infer<typeof permissionSchema>): Promise<Result> {
  const ctx = await requireTeamContext();
  const parsed = permissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  const { userId, permission, value } = parsed.data;

  const target = await findMember(ctx.team.id, userId);
  if (!target) return { ok: false, error: "Esa persona no es miembro del equipo" };

  const check = canGrantPermission({ actorRole: ctx.membership.role, targetRole: target.role });
  if (!check.ok) return { ok: false, error: check.reason };

  await db.membership.update({ where: { id: target.id }, data: { [permission]: value } });
  refreshTeam(ctx.team.id);
  return { ok: true };
}

// ---------- Rol (admin / miembro) ----------

export async function changeMemberRole(input: { userId: string; role: string }): Promise<Result> {
  const ctx = await requireTeamContext();
  const parsed = z.object({ userId: z.string().min(1), role: z.enum(TEAM_ROLES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const target = await findMember(ctx.team.id, parsed.data.userId);
  if (!target) return { ok: false, error: "Esa persona no es miembro del equipo" };

  const check = canChangeRole({
    actorRole: ctx.membership.role,
    targetRole: target.role,
    nextRole: parsed.data.role,
    adminCount: await adminCountOf(ctx.team.id),
  });
  if (!check.ok) return { ok: false, error: check.reason };

  await db.membership.update({ where: { id: target.id }, data: { role: parsed.data.role } });
  if (target.userId !== ctx.user.id && parsed.data.role === "admin") {
    await notifyUsers([target.userId], {
      type: "member_joined",
      title: `Ahora sos admin de ${ctx.team.name}`,
      link: "/equipo",
    });
  }
  refreshTeam(ctx.team.id);
  return { ok: true };
}

// ---------- Instrumento / rol habitual ----------

export async function setMemberInstrument(input: { userId: string; instrument: string }): Promise<Result> {
  const ctx = await requireTeamContext();
  const parsed = z
    .object({ userId: z.string().min(1), instrument: z.string().trim().max(40, "Máximo 40 caracteres") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const isSelf = parsed.data.userId === ctx.user.id;
  if (!canEditInstrument({ actorRole: ctx.membership.role, isSelf }))
    return { ok: false, error: "Solo podés cambiar tu propio instrumento" };

  const target = await findMember(ctx.team.id, parsed.data.userId);
  if (!target) return { ok: false, error: "Esa persona no es miembro del equipo" };

  await db.membership.update({ where: { id: target.id }, data: { instrument: parsed.data.instrument || null } });
  refreshTeam(ctx.team.id);
  return { ok: true };
}

// ---------- Quitar / salir ----------

/** El admin quita a alguien, o un miembro se va del equipo (userId = el propio). */
export async function removeMember(userId: string): Promise<Result> {
  const ctx = await requireTeamContext();
  const target = await findMember(ctx.team.id, userId);
  if (!target) return { ok: false, error: "Esa persona no es miembro del equipo" };

  const isSelf = userId === ctx.user.id;
  const check = canRemoveMember({
    actorRole: ctx.membership.role,
    isSelf,
    targetRole: target.role,
    adminCount: await adminCountOf(ctx.team.id),
  });
  if (!check.ok) return { ok: false, error: check.reason };

  await db.$transaction([
    db.membership.delete({ where: { id: target.id } }),
    // Lo sacamos de los eventos futuros del equipo
    db.eventParticipant.deleteMany({
      where: { userId, event: { teamId: ctx.team.id, date: { gte: new Date() } } },
    }),
    // Si estaba viendo este equipo, la próxima vez entra a otro (o se le crea uno)
    db.user.updateMany({ where: { id: userId, currentTeamId: ctx.team.id }, data: { currentTeamId: null } }),
  ]);

  if (!isSelf) {
    await notifyUsers([userId], { type: "member_joined", title: `Ya no sos parte de ${ctx.team.name}` });
  }
  publish(topics.user(userId), { type: "refresh", scope: "members" });
  refreshTeam(ctx.team.id);
  return { ok: true };
}

// ---------- Invitaciones ----------

/** Genera un link nuevo y desactiva el anterior. */
export async function resetInviteLink(): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  const ctx = await requireTeamContext();
  if (!can.invite(ctx.membership)) return { ok: false, error: "No tenés permiso para invitar" };
  const invite = await regenerateInvite(ctx.team.id, ctx.user.id);
  revalidatePath("/", "layout");
  return { ok: true, link: inviteUrl(invite.token) };
}

/** El usuario logueado se une al equipo del link. */
export async function acceptInvite(token: string): Promise<{ ok: true; teamName: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const invite = await db.invite.findUnique({ where: { token }, include: { team: true } });
  if (!invite || !isInviteUsable(invite)) return { ok: false, error: "Esta invitación ya no es válida" };

  const existing = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: invite.teamId } },
  });

  if (!existing) {
    await db.$transaction([
      db.membership.create({ data: { userId: user.id, teamId: invite.teamId, role: "member" } }),
      db.invite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } }),
    ]);
    // Avisamos a los admins del equipo
    const admins = await db.membership.findMany({
      where: { teamId: invite.teamId, role: "admin" },
      select: { userId: true },
    });
    const name = user.name ?? user.email;
    await notifyUsers(
      admins.map((a) => a.userId),
      { type: "member_joined", title: `${name} se unió a ${invite.team.name}`, link: "/equipo" },
    );
  }

  await db.user.update({ where: { id: user.id }, data: { currentTeamId: invite.teamId } });
  refreshTeam(invite.teamId);
  return { ok: true, teamName: invite.team.name };
}
