import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import { dayParam, monthGrid, parseDayParam, shiftView, viewRange, weekDays } from "@/lib/calendar";
import { buildIcs, escapeIcsText } from "@/lib/ics";

const f = (d: Date) => format(d, "yyyy-MM-dd");

describe("calendario", () => {
  it("la grilla del mes arranca en lunes y cubre semanas completas", () => {
    const days = monthGrid(new Date(2026, 10, 15)); // noviembre 2026 (el 1 es domingo)
    expect(days.length % 7).toBe(0);
    expect(f(days[0])).toBe("2026-10-26");
    expect(days[0].getDay()).toBe(1);
    expect(f(days[days.length - 1])).toBe("2026-12-06");
  });

  it("la semana va de lunes a domingo", () => {
    const days = weekDays(new Date(2026, 10, 9)); // lunes 9
    expect(days.map(f)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
    expect(f(weekDays(new Date(2026, 10, 15))[0])).toBe("2026-11-09"); // domingo 15 pertenece a esa semana
  });

  it("rango y navegación", () => {
    const r = viewRange("semana", new Date(2026, 10, 12));
    expect(f(r.from)).toBe("2026-11-09");
    expect(f(r.to)).toBe("2026-11-16");
    expect(f(shiftView("mes", new Date(2026, 0, 31), 1))).toBe("2026-02-28");
    expect(f(shiftView("semana", new Date(2026, 10, 9), -1))).toBe("2026-11-02");
  });

  it("parámetro de fecha", () => {
    const fallback = new Date(2026, 0, 1);
    expect(f(parseDayParam("2026-11-15", fallback))).toBe("2026-11-15");
    expect(parseDayParam("cualquier-cosa", fallback)).toBe(fallback);
    expect(parseDayParam(undefined, fallback)).toBe(fallback);
    expect(dayParam(new Date(2026, 4, 3))).toBe("2026-05-03");
  });
});

describe("archivo .ics", () => {
  it("escapa caracteres especiales", () => {
    expect(escapeIcsText("Hola, mundo; línea\nnueva")).toBe(String.raw`Hola\, mundo\; línea\nnueva`);
  });

  it("genera un evento válido con fin por defecto de 2 horas", () => {
    const ics = buildIcs({
      id: "abc",
      title: "Servicio dominical",
      start: new Date("2026-11-15T13:00:00Z"),
      end: null,
      location: "Templo",
      now: new Date("2026-11-09T00:00:00Z"),
    });
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART:20261115T130000Z");
    expect(ics).toContain("DTEND:20261115T150000Z");
    expect(ics).toContain("LOCATION:Templo");
    expect(ics).toContain("UID:abc@cancionero.app");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
});
