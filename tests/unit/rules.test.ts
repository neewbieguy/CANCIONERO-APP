import { describe, expect, it } from "vitest";
import { addDays, isSameDay, startOfDay } from "date-fns";
import { can, canChangeRole, canEditInstrument, canGrantPermission, canRemoveMember } from "@/lib/permissions";
import { isInviteUsable } from "@/lib/invites";
import { nextSevenDays } from "@/lib/dates";
import { initials, plural } from "@/lib/utils";
import { EVENT_TEMPLATES, getTemplate } from "@/lib/templates";

describe("permisos", () => {
  const member = { role: "member", canManageEvents: false, canManageSongs: false, canInvite: false };
  const admin = { ...member, role: "admin" };

  it("admin puede todo; miembro sin permisos no puede crear ni invitar", () => {
    expect(can.manageEvents(admin)).toBe(true);
    expect(can.manageSongs(admin)).toBe(true);
    expect(can.invite(admin)).toBe(true);
    expect(can.manageEvents(member)).toBe(false);
    expect(can.manageSongs(member)).toBe(false);
    expect(can.invite(member)).toBe(false);
    expect(can.manageMembers(member)).toBe(false);
  });

  it("cada permiso dado por el admin habilita solo lo suyo", () => {
    const songs = { ...member, canManageSongs: true };
    expect(can.manageSongs(songs)).toBe(true);
    expect(can.manageEvents(songs)).toBe(false);
    expect(can.invite(songs)).toBe(false);
    expect(can.manageEvents({ ...member, canManageEvents: true })).toBe(true);
    expect(can.invite({ ...member, canInvite: true })).toBe(true);
    expect(can.manageMembers({ ...member, canManageEvents: true, canManageSongs: true, canInvite: true })).toBe(false);
  });

  it("solo un admin da permisos, y solo a miembros", () => {
    expect(canGrantPermission({ actorRole: "admin", targetRole: "member" }).ok).toBe(true);
    expect(canGrantPermission({ actorRole: "member", targetRole: "member" }).ok).toBe(false);
    expect(canGrantPermission({ actorRole: "admin", targetRole: "admin" }).ok).toBe(false);
  });

  it("no se puede degradar al único admin", () => {
    expect(canChangeRole({ actorRole: "admin", targetRole: "admin", nextRole: "member", adminCount: 1 }).ok).toBe(false);
    expect(canChangeRole({ actorRole: "admin", targetRole: "admin", nextRole: "member", adminCount: 2 }).ok).toBe(true);
    expect(canChangeRole({ actorRole: "member", targetRole: "member", nextRole: "admin", adminCount: 1 }).ok).toBe(false);
  });

  it("quitar miembros", () => {
    expect(canRemoveMember({ actorRole: "member", isSelf: true, targetRole: "member", adminCount: 1 }).ok).toBe(true);
    expect(canRemoveMember({ actorRole: "member", isSelf: false, targetRole: "member", adminCount: 1 }).ok).toBe(false);
    expect(canRemoveMember({ actorRole: "admin", isSelf: true, targetRole: "admin", adminCount: 1 }).ok).toBe(false);
    expect(canRemoveMember({ actorRole: "admin", isSelf: false, targetRole: "admin", adminCount: 2 }).ok).toBe(true);
    expect(canRemoveMember({ actorRole: "admin", isSelf: false, targetRole: "member", adminCount: 1 }).ok).toBe(true);
  });

  it("instrumento: cada uno el suyo, el admin el de todos", () => {
    expect(canEditInstrument({ actorRole: "member", isSelf: true })).toBe(true);
    expect(canEditInstrument({ actorRole: "member", isSelf: false })).toBe(false);
    expect(canEditInstrument({ actorRole: "admin", isSelf: false })).toBe(true);
  });
});

describe("invitaciones", () => {
  const base = { revoked: false, expiresAt: null, maxUses: null, uses: 0 };
  it("válida por defecto", () => expect(isInviteUsable(base)).toBe(true));
  it("revocada", () => expect(isInviteUsable({ ...base, revoked: true })).toBe(false));
  it("expirada", () => expect(isInviteUsable({ ...base, expiresAt: new Date(Date.now() - 1000) })).toBe(false));
  it("sin usos restantes", () => expect(isInviteUsable({ ...base, maxUses: 3, uses: 3 })).toBe(false));
});

describe("utilidades", () => {
  it("nextSevenDays empieza hoy y tiene 7 días", () => {
    const days = nextSevenDays(new Date("2026-11-08T15:00:00"));
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual(startOfDay(new Date("2026-11-08T15:00:00")));
    expect(isSameDay(days[6], addDays(days[0], 6))).toBe(true);
  });

  it("initials", () => {
    expect(initials("Lucía Fernández")).toBe("LF");
    expect(initials("ana.perez@mail.com")).toBe("AP");
    expect(initials("Martín")).toBe("MA");
    expect(initials(null)).toBe("?");
  });

  it("plural", () => {
    expect(plural(1, "miembro")).toBe("1 miembro");
    expect(plural(3, "miembro")).toBe("3 miembros");
    expect(plural(2, "canción", "canciones")).toBe("2 canciones");
  });

  it("plantillas", () => {
    expect(EVENT_TEMPLATES.map((t) => t.id)).toEqual(["sunday_service", "rehearsal", "concert", "custom"]);
    expect(getTemplate("inexistente").id).toBe("custom");
  });
});
