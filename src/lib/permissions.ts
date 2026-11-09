import type { TeamRole } from "@/lib/constants";

/**
 * Reglas de permisos (funciones puras, sin DB, para poder testearlas).
 * - Admin: puede todo, y es el único que da o quita permisos y gestiona miembros.
 * - Miembro: ve todo y responde a eventos. Solo crea/edita eventos, canciones
 *   o invita si el admin le dio ese permiso.
 */
export type MemberAccess = {
  role: string;
  canManageEvents: boolean;
  canManageSongs: boolean;
  canInvite: boolean;
};

export const MEMBER_PERMISSIONS = ["canManageEvents", "canManageSongs", "canInvite"] as const;
export type MemberPermission = (typeof MEMBER_PERMISSIONS)[number];

export const MEMBER_PERMISSION_LABELS: Record<MemberPermission, { label: string; description: string }> = {
  canManageEvents: { label: "Eventos", description: "Crear, editar y borrar eventos y setlists" },
  canManageSongs: { label: "Canciones", description: "Añadir, editar y borrar canciones" },
  canInvite: { label: "Invitar", description: "Compartir el link de invitación" },
};

const isAdmin = (m: Pick<MemberAccess, "role">) => m.role === "admin";

export const can = {
  manageEvents: (m: MemberAccess) => isAdmin(m) || m.canManageEvents,
  manageSongs: (m: MemberAccess) => isAdmin(m) || m.canManageSongs,
  invite: (m: MemberAccess) => isAdmin(m) || m.canInvite,
  manageMembers: (m: MemberAccess) => isAdmin(m),
};

/** Resumen de permisos para pasar a la UI. */
export function accessOf(m: MemberAccess) {
  return {
    isAdmin: isAdmin(m),
    manageEvents: can.manageEvents(m),
    manageSongs: can.manageSongs(m),
    invite: can.invite(m),
  };
}
export type Access = ReturnType<typeof accessOf>;

/** ¿Puede `actor` dar o quitar permisos a `target`? Solo admins, y a miembros (los admins ya tienen todo). */
export function canGrantPermission(opts: { actorRole: string; targetRole: string }): { ok: true } | { ok: false; reason: string } {
  if (opts.actorRole !== "admin") return { ok: false, reason: "Solo un admin puede dar permisos" };
  if (opts.targetRole === "admin") return { ok: false, reason: "Los admins ya tienen todos los permisos" };
  return { ok: true };
}

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

/** ¿Puede `actor` cambiar el instrumento/rol habitual de `target`? El admin a cualquiera; cada uno el suyo. */
export function canEditInstrument(opts: { actorRole: string; isSelf: boolean }) {
  return opts.isSelf || opts.actorRole === "admin";
}
