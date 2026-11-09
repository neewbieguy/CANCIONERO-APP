import type { TeamRole } from "@/lib/constants";

/**
 * Reglas de permisos (funciones puras, sin DB, para poder testearlas).
 * - Admin: gestiona eventos, setlists, participantes, miembros e invitaciones.
 * - Miembro: ve todo, agrega/edita canciones, responde a eventos y chatea.
 */
export const can = {
  manageEvents: (role: string) => role === "admin",
  manageMembers: (role: string) => role === "admin",
  manageInvites: (role: string) => role === "admin",
  editSongs: (_role: string) => true,
  deleteSongs: (role: string) => role === "admin",
};

/** ¿Puede `actor` cambiar el rol de `target` a `nextRole`? Evita dejar el equipo sin admins. */
export function canChangeRole(opts: {
  actorRole: string;
  targetRole: string;
  nextRole: TeamRole;
  adminCount: number;
}): { ok: true } | { ok: false; reason: string } {
  if (opts.actorRole !== "admin") return { ok: false, reason: "Solo un admin puede cambiar roles" };
  if (opts.targetRole === opts.nextRole) return { ok: true };
  if (opts.targetRole === "admin" && opts.adminCount <= 1)
    return { ok: false, reason: "El equipo necesita al menos un admin" };
  return { ok: true };
}

/** ¿Puede `actor` quitar a `target` del equipo? (o salir, si es él mismo) */
export function canRemoveMember(opts: {
  actorRole: string;
  isSelf: boolean;
  targetRole: string;
  adminCount: number;
}): { ok: true } | { ok: false; reason: string } {
  if (!opts.isSelf && opts.actorRole !== "admin") return { ok: false, reason: "Solo un admin puede quitar miembros" };
  if (opts.targetRole === "admin" && opts.adminCount <= 1)
    return { ok: false, reason: "No podés quitar al único admin. Nombrá otro admin primero." };
  return { ok: true };
}
