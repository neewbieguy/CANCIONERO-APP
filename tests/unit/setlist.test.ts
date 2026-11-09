import { describe, expect, it } from "vitest";
import { estimateDuration, formatDuration, isSameSet, moveId, templateMoments, templateSongSlots } from "@/lib/setlist";
import { getTemplate } from "@/lib/templates";

describe("setlist", () => {
  it("moveId sube y baja, sin salirse de los bordes", () => {
    expect(moveId(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveId(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
    expect(moveId(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
    expect(moveId(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
    expect(moveId(["a", "b"], "x", 1)).toEqual(["a", "b"]);
  });

  it("isSameSet valida reordenamientos", () => {
    expect(isSameSet(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
    expect(isSameSet(["a", "b", "c"], ["a", "b"])).toBe(false);
    expect(isSameSet(["a", "b", "c"], ["a", "a", "b"])).toBe(false);
    expect(isSameSet(["a", "b"], ["a", "x"])).toBe(false);
  });

  it("duración estimada: canciones sin duración cuentan 5 min", () => {
    expect(
      estimateDuration([
        { type: "song", durationMin: null },
        { type: "song", durationMin: 7 },
        { type: "moment", durationMin: 10 },
        { type: "moment", durationMin: null },
      ]),
    ).toBe(22);
  });

  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(40)).toBe("40 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(85)).toBe("1 h 25 min");
  });

  it("plantillas: momentos en orden y canciones sugeridas", () => {
    const t = getTemplate("sunday_service");
    expect(templateMoments(t).map((m) => m.title)).toEqual([
      "Bienvenida", "Oración", "Anuncios", "Ofrenda", "Prédica", "Bendición final",
    ]);
    expect(templateSongSlots(t)).toBe(5);
    expect(templateMoments(getTemplate("custom"))).toEqual([]);
  });
});
