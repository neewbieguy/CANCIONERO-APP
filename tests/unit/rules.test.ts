import { describe, expect, it } from "vitest";
import { addDays, isSameDay, startOfDay } from "date-fns";
import { can, canChangeRole, canRemoveMember } from "@/lib/permissions";
import { isInviteUsable } from "@/lib/invites";
import { nextSevenDays } from "@/lib/dates";
import { initials, plural } from "@/lib/utils";
import { EVENT_TEMPLATES, getTemplate } from "@/lib/templates";

describe("permisos", () => {
  it("solo admins gestionan eventos y miembros", () => {
    expect(can.manageEvents("admin")).toBe(true);
    expect(can.manageEvents("member")).toBe(false);
    expect(can.manageMembers("member")).toBe(false);
    expect(can.editSongs("member")).toBe(true);
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
