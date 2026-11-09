import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export function newInviteToken() {
  return randomBytes(18).toString("base64url");
}

export function inviteUrl(token: string) {
  return absoluteUrl(`/invitacion/${token}`);
}

/** Una invitación es válida si no fue revocada, no expiró y no alcanzó el máximo de usos. */
export function isInviteUsable(invite: { revoked: boolean; expiresAt: Date | null; maxUses: number | null; uses: number }, now = new Date()) {
  if (invite.revoked) return false;
  if (invite.expiresAt && invite.expiresAt <= now) return false;
  if (invite.maxUses !== null && invite.uses >= invite.maxUses) return false;
  return true;
}

/** Devuelve el link de invitación activo del equipo (lo crea si no existe). */
export async function getOrCreateActiveInvite(teamId: string, createdById: string) {
  const candidates = await db.invite.findMany({
    where: { teamId, revoked: false },
    orderBy: { createdAt: "desc" },
  });
  const usable = candidates.find((i) => isInviteUsable(i));
  if (usable) return usable;
  return db.invite.create({ data: { teamId, createdById, token: newInviteToken() } });
}
