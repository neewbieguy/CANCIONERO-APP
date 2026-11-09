export const APP_NAME = "Cancionero";

export const TEAM_ROLES = ["admin", "member"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
export const TEAM_ROLE_LABELS: Record<TeamRole, string> = { admin: "Admin", member: "Miembro" };

export const PARTICIPANT_STATUSES = ["pending", "confirmed", "declined"] as const;
export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];
export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "Rechazado",
};

export const SETLIST_ITEM_TYPES = ["song", "moment"] as const;
export type SetlistItemType = (typeof SETLIST_ITEM_TYPES)[number];

export const NOTIFICATION_TYPES = ["event_invite", "event_updated", "member_joined", "event_reminder"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Roles sugeridos al asignar participantes a un evento. */
export const EVENT_ROLES = [
  "Líder de alabanza",
  "Voz principal",
  "Coros",
  "Guitarra acústica",
  "Guitarra eléctrica",
  "Bajo",
  "Batería",
  "Teclado",
  "Piano",
  "Sonido",
  "Luces",
  "Proyección",
  "Transmisión",
] as const;
