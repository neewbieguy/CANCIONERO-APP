import { describe, expect, it } from "vitest";
import { parseBarLine, parseChordPro, parseLyricLine, parseSectionHeader, splitRepeat, toChordPro } from "@/lib/music/chordpro";
import { buildSongSections, sectionAbbr } from "@/lib/music/sections";
import { ALABA } from "../fixtures/alaba";
import { GLORIOSO_DIA } from "../fixtures/glorioso-dia";

describe("encabezados de sección", () => {
  it.each(["Coda", "CODA", "[Coda]", "Coro final", "CORO FINAL", "Interlude", "Pre coro", "PUENTE 2", "Coro 1"])("reconoce %s", (h) => {
    expect(parseSectionHeader(h)).not.toBeNull();
  });

  it("lee la repetición del título", () => {
    expect(parseSectionHeader("Intro (x3)")).toEqual({ type: "intro", label: "Intro", repeat: 3 });
    expect(parseSectionHeader("Coro x2")).toEqual({ type: "chorus", label: "Coro", repeat: 2 });
    expect(parseSectionHeader("[Puente 2 (2x)]")).toEqual({ type: "bridge", label: "Puente 2", repeat: 2 });
    expect(parseSectionHeader("Verso 1")?.repeat).toBeUndefined();
    expect(splitRepeat("Intro (x3)")).toEqual({ label: "Intro", repeat: 3 });
    expect(splitRepeat("Verso 2")).toEqual({ label: "Verso 2" });
  });

  it("no confunde letra con un encabezado", () => {
    expect(parseSectionHeader("Coro final de los ángeles")).toBeNull();
    expect(parseSectionHeader("Final feliz")).toBeNull();
  });

  it("acepta {comment: Verso 1} como encabezado", () => {
    const sheet = parseChordPro("{comment: Verso 1}\n[G]Hola\n{c: Coro (x2)}\n[D]Canto\n{comment: suave}\n");
    expect(sheet.sections.map((s) => [s.type, s.label, s.repeat])).toEqual([
      ["verse", "Verso 1", undefined],
      ["chorus", "Coro", 2],
    ]);
    expect(sheet.sections[1].lines.at(-1)).toEqual({ type: "comment", text: "suave" });
  });

  it("acepta {start_of_verse} sin título", () => {
    const [s] = buildSongSections("{start_of_verse}\n[G]Hola\n{end_of_verse}");
    expect([s.label, s.abbr]).toEqual(["Verso", "V"]);
  });
});

describe("filas de compases", () => {
  const bar = (line: string) => parseBarLine(parseLyricLine(toChordPro(line)));

  it("parte la línea en compases", () => {
    const b = bar("| G / / / | C / D / |")!;
    expect(b.bars).toBe(true);
    expect(b.measures.map((m) => m.map((t) => t.value).join(" "))).toEqual(["G / / /", "C / D /"]);
  });

  it("acepta N.C. y líneas de solo acordes", () => {
    expect(bar("N.C.")).toEqual({ bars: false, measures: [[{ kind: "mark", value: "N.C." }]] });
    expect(bar("D2  G  x2")?.measures[0].map((t) => t.kind)).toEqual(["chord", "chord", "mark"]);
  });

  it("no toma una línea con letra", () => {
    expect(parseBarLine(parseLyricLine("[G]Hola [D]mundo"))).toBeNull();
    expect(parseBarLine(parseLyricLine("Solo letra"))).toBeNull();
  });

  it("no pega los compases arriba de la letra", () => {
    expect(toChordPro("| G / / / |\nHola mundo")).toBe("| [G] / / / |\nHola mundo");
  });
});

describe("abreviaturas", () => {
  it.each([
    ["verse", "Verso 2", "V2"],
    ["chorus", "Coro", "C"],
    ["chorus", "Coro 1", "C1"],
    ["chorus", "Coro final", "CF"],
    ["prechorus", "Pre-coro", "PC"],
    ["bridge", "Puente 1", "P1"],
    ["intro", "Intro", "I"],
    ["tag", "Tag", "T"],
    ["outro", "Final", "F"],
    ["outro", "Coda", "CD"],
  ] as const)("%s %s -> %s", (type, label, abbr) => {
    expect(sectionAbbr(type, label)).toBe(abbr);
  });
});

describe("buildSongSections", () => {
  it("arma las tarjetas de ALABA", () => {
    const sections = buildSongSections(ALABA);
    expect(sections.map((s) => s.label)).toEqual([
      "Intro", "Verso 1", "Pre-coro", "Coro 1", "Verso 2", "Pre-coro", "Coro 1",
      "Puente 1", "Puente 2", "Interludio", "Instrumental", "Coro final", "Tag", "Final",
    ]);
    expect(sections.map((s) => s.abbr)).toEqual(["I", "V1", "PC", "C1", "V2", "PC", "C1", "P1", "P2", "IL", "IN", "CF", "T", "F"]);
    expect(sections.map((s) => s.group)).toEqual([
      "instrumental", "verse", "prechorus", "chorus", "verse", "prechorus", "chorus",
      "bridge", "bridge", "instrumental", "instrumental", "chorus", "ending", "ending",
    ]);
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
  });

  it("lee los x2 de los títulos", () => {
    const sections = buildSongSections(ALABA);
    expect(sections[0].repeat).toBe(2);
    expect(sections[10].repeat).toBe(2);
    expect(sections[1].repeat).toBeUndefined();
  });

  it("marca las secciones repetidas", () => {
    const sections = buildSongSections(ALABA);
    // "CORO 1" escrito de nuevo con el mismo contenido
    expect(sections[6].repeatOf).toBe(3);
    // "Pre-Coro" solo con el título: toma el contenido del anterior
    expect(sections[5].repeatOf).toBe(2);
    expect(sections[5].lines).toEqual(sections[2].lines);
    // El resto no son repeticiones
    expect(sections.filter((s) => s.repeatOf !== null)).toHaveLength(2);
  });

  it("funciona igual con la canción ya guardada como ChordPro", () => {
    expect(buildSongSections(toChordPro(ALABA))).toEqual(buildSongSections(ALABA));
  });

  it("transpone los acordes", () => {
    const [, verse] = buildSongSections(ALABA, 2, "B");
    const first = verse.lines[0];
    expect(first.type === "lyrics" && first.segments[0].chord).toBe("B");
  });

  it("sin encabezados: una sola tarjeta sin etiqueta", () => {
    const sections = buildSongSections("G        D\nHola mundo\n\nEm       C\nOtra estrofa\n\nG\nY otra más");
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBeNull();
    expect(sections[0].abbr).toBeNull();
    expect(sections[0].lines.filter((l) => l.type === "lyrics")).toHaveLength(3);
  });

  it("canción vacía: sin tarjetas", () => {
    expect(buildSongSections("")).toEqual([]);
  });

  it("funciona con texto pegado desde la web", () => {
    expect(buildSongSections(GLORIOSO_DIA).map((s) => s.abbr)).toEqual(["I", "V", "C", "V2", "P", "F"]);
  });
});
