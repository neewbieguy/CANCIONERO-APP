import { describe, expect, it } from "vitest";
import {
  chordsUsed,
  isChordLine,
  normalizeLyrics,
  parseChordPro,
  parseSectionHeader,
  toChordPro,
  toPlainText,
  transposeChordPro,
  type Section,
} from "@/lib/music/chordpro";
import { isChord } from "@/lib/music/transpose";
import { GLORIOSO_DIA } from "../fixtures/glorioso-dia";

/** Texto de una línea de letra, sin acordes. */
const lyricOf = (section: Section, i: number) => {
  const line = section.lines[i];
  return line.type === "lyrics" ? line.segments.map((s) => s.text).join("") : "";
};
/** Acordes de una línea, en orden. */
const chordsOf = (section: Section, i: number) => {
  const line = section.lines[i];
  return line.type === "lyrics" ? line.segments.filter((s) => s.chord).map((s) => s.chord) : [];
};

describe("normalizeLyrics", () => {
  it("quita los caracteres invisibles", () => {
    expect(normalizeLyrics("﻿​Ver‌so‍ 1")).toBe("Verso 1");
  });
  it("cambia el espacio duro por un espacio normal", () => {
    expect(normalizeLyrics("G  D")).toBe("G  D");
  });
  it("unifica los saltos de línea", () => {
    expect(normalizeLyrics("a\r\nb\rc\nd")).toBe("a\nb\nc\nd");
  });
  it("el fixture no trae invisibles después de normalizar", () => {
    expect(GLORIOSO_DIA).toMatch(/​/);
    expect(normalizeLyrics(GLORIOSO_DIA)).not.toMatch(/[​-‍﻿ \r]/);
  });
});

describe("parseSectionHeader", () => {
  it.each([
    "Intro", "Verso", "Verso 1", "Verso 2", "Pre-coro", "Precoro", "Coro", "Estribillo", "Puente", "Interludio",
    "Instrumental", "Solo", "Final", "Outro", "Tag", "Verse", "Chorus", "Bridge", "Pre-Chorus",
  ])("reconoce %s", (name) => {
    expect(parseSectionHeader(name)).not.toBeNull();
    expect(parseSectionHeader(name.toUpperCase())).not.toBeNull();
    expect(parseSectionHeader(name.toLowerCase())).not.toBeNull();
    expect(parseSectionHeader(`${name}:`)).not.toBeNull();
    expect(parseSectionHeader(`[${name}]`)).not.toBeNull();
    expect(parseSectionHeader(`​${name}`)).not.toBeNull();
  });

  it("devuelve tipo y etiqueta", () => {
    expect(parseSectionHeader("VERSO 2")).toEqual({ type: "verse", label: "Verso 2" });
    expect(parseSectionHeader("coro:")).toEqual({ type: "chorus", label: "Coro" });
    expect(parseSectionHeader("[Estribillo]")).toEqual({ type: "chorus", label: "Estribillo" });
    expect(parseSectionHeader("Pre-Chorus")).toEqual({ type: "prechorus", label: "Pre-chorus" });
    expect(parseSectionHeader("[Final]")).toEqual({ type: "outro", label: "Final" });
  });

  it("no confunde letra ni acordes con un encabezado", () => {
    expect(parseSectionHeader("Coro de ángeles cantan")).toBeNull();
    expect(parseSectionHeader("Solo tú eres santo")).toBeNull();
    expect(parseSectionHeader("Verso G D")).toBeNull();
    expect(parseSectionHeader("[G]")).toBeNull();
    expect(parseSectionHeader("")).toBeNull();
  });
});

describe("detector de acordes", () => {
  it.each(["D2", "D5", "B5", "Bm7", "G/B", "Dsus4", "A7(b9)"])("acepta %s", (chord) => {
    expect(isChord(chord)).toBe(true);
    expect(isChordLine(`G   ${chord}   D`)).toBe(true);
  });

  it("acepta indicaciones comunes en la línea de acordes", () => {
    expect(isChordLine("G  D  Riff")).toBe(true);
    expect(isChordLine("G  D  x2")).toBe(true);
    expect(isChordLine("N.C.  G  D")).toBe(true);
    expect(isChordLine("| G | D | Em | C |")).toBe(true);
    expect(isChordLine("|G|D|")).toBe(true);
  });

  it("ignora los invisibles", () => {
    expect(isChordLine("​G  D")).toBe(true);
  });

  it("no acepta líneas sin ningún acorde ni líneas de letra", () => {
    expect(isChordLine("Riff x2")).toBe(false);
    expect(isChordLine("| | |")).toBe(false);
    expect(isChordLine("Dame tu mano G")).toBe(false);
  });
});

describe('fixture "GLORIOSO DIA" (pegado con U+200B)', () => {
  const sheet = parseChordPro(GLORIOSO_DIA);
  const byLabel = (label: string) => sheet.sections.find((s) => s.label === label)!;

  it("detecta las secciones en orden", () => {
    expect(sheet.sections.map((s) => s.label)).toEqual(["Intro", "Verso", "Coro", "Verso 2", "Puente", "Final"]);
    expect(sheet.sections.map((s) => s.type)).toEqual(["intro", "verse", "chorus", "verse", "bridge", "outro"]);
  });

  it("Verso, Coro, Puente y Verso 2 son secciones, no letra", () => {
    for (const label of ["Verso", "Coro", "Puente", "Verso 2"]) {
      expect(byLabel(label), label).toBeDefined();
    }
    const allText = sheet.sections.flatMap((s) => s.lines.map((_, i) => lyricOf(s, i).trim()));
    for (const header of ["Verso", "Coro:", "VERSO 2", "puente", "[Final]", "Intro"]) {
      expect(allText).not.toContain(header);
    }
  });

  it("no queda ningún carácter invisible", () => {
    expect(JSON.stringify(sheet)).not.toMatch(/[​-‍﻿ ]/);
  });

  it("los acordes quedan encima de la letra (misma línea que su letra)", () => {
    const verso = byLabel("Verso");
    expect(verso.lines).toHaveLength(3);
    expect(lyricOf(verso, 0)).toBe("Estaba lejos y sin luz");
    expect(chordsOf(verso, 0)).toEqual(["D", "G"]);
    expect(lyricOf(verso, 1)).toBe("Perdido en mi oscuridad");
    expect(chordsOf(verso, 1)).toEqual(["Bm7", "A", "D/F#"]);
    expect(lyricOf(verso, 2)).toBe("Hasta que oí tu voz");
    expect(chordsOf(verso, 2)).toEqual(["G/B", "Dsus4"]);
  });

  it("cada acorde cae en su columna", () => {
    const verso = byLabel("Verso");
    const first = verso.lines[0];
    expect(first.type === "lyrics" && first.segments).toEqual([
      { chord: "D", text: "Estaba lejos y sin" },
      { chord: "G", text: " luz" },
    ]);
  });

  it("ninguna línea de letra quedó como línea de acordes suelta", () => {
    for (const label of ["Verso", "Verso 2", "Puente"]) {
      const section = byLabel(label);
      section.lines.forEach((line, i) => {
        expect(line.type).toBe("lyrics");
        expect(chordsOf(section, i).length, `${label} línea ${i}`).toBeGreaterThan(0);
        expect(lyricOf(section, i).trim(), `${label} línea ${i}`).not.toBe("");
      });
    }
  });

  it("conserva N.C., Riff y x2 sin romper la línea de acordes", () => {
    const coro = byLabel("Coro");
    expect(lyricOf(coro, 0)).toBe("Me llamaste y corrí a ti");
    expect(chordsOf(coro, 0)).toEqual(["N.C.", "G", "D"]);
    expect(chordsOf(coro, 1)).toEqual(["A7(b9)", "Bm7", "Riff"]);
    expect(chordsOf(coro, 2)).toEqual(["D5", "B5", "G", "A"]);
    expect(chordsOf(byLabel("Puente"), 1)).toEqual(["Bm", "A", "x2"]);
  });

  it("las líneas de solo acordes (Intro y Final) también se detectan", () => {
    expect(chordsOf(byLabel("Intro"), 0)).toEqual(["D2", "G"]);
    expect(lyricOf(byLabel("Intro"), 0)).toContain("x2");
    expect(chordsOf(byLabel("Final"), 0)).toEqual(["D2", "G", "D"]);
  });

  it("chordsUsed lista solo acordes reales", () => {
    expect(chordsUsed(GLORIOSO_DIA)).toEqual(["D2", "G", "D", "Bm7", "A", "D/F#", "G/B", "Dsus4", "A7(b9)", "D5", "B5", "Bm"]);
  });

  it("transpone los acordes pero no las indicaciones", () => {
    const up = parseChordPro(transposeChordPro(GLORIOSO_DIA, 2));
    const coro = up.sections.find((s) => s.label === "Coro")!;
    expect(chordsOf(coro, 0)).toEqual(["N.C.", "A", "E"]);
    expect(chordsOf(coro, 1)).toEqual(["B7(b9)", "C#m7", "Riff"]);
    expect(up.sections.map((s) => s.label)).toEqual(["Intro", "Verso", "Coro", "Verso 2", "Puente", "Final"]);
  });

  it("convertir dos veces da lo mismo (sirve para canciones ya guardadas)", () => {
    const once = toChordPro(GLORIOSO_DIA);
    expect(toChordPro(once)).toBe(once);
    expect(parseChordPro(once)).toEqual(sheet);
  });

  it("exporta a texto plano con los acordes arriba", () => {
    const txt = toPlainText(GLORIOSO_DIA);
    expect(txt).toContain("[Verso]\nD                 G\nEstaba lejos y sin luz");
    expect(txt).toContain("[Verso 2]");
    expect(txt).toContain("[Puente]");
  });
});

describe("canciones guardadas antes del arreglo", () => {
  it("un encabezado entre corchetes ya no bloquea la conversión", () => {
    const sheet = parseChordPro("[Estribillo]\nG       D\nHola mundo bello\n\n[Final]\nG  D");
    expect(sheet.sections.map((s) => s.label)).toEqual(["Estribillo", "Final"]);
    expect(sheet.sections[0].lines[0]).toEqual({
      type: "lyrics",
      segments: [
        { chord: "G", text: "Hola mun" },
        { chord: "D", text: "do bello" },
      ],
    });
  });

  it("arregla una hoja convertida a medias (con U+200B guardados)", () => {
    const stored = [
      "{start_of_verse: Verso}",
      "[G]Hola [D]mundo",
      "",
      "​Coro",
      "​C       G",
      "​Canto hoy",
      "{end_of_verse}",
    ].join("\n");
    const sheet = parseChordPro(stored);
    expect(sheet.sections.map((s) => [s.type, s.label])).toEqual([
      ["verse", "Verso"],
      ["chorus", "Coro"],
    ]);
    expect(sheet.sections[1].lines).toEqual([
      {
        type: "lyrics",
        segments: [
          { chord: "C", text: "Canto ho" },
          { chord: "G", text: "y" },
        ],
      },
    ]);
  });

  it("no toca una tablatura", () => {
    const tab = "{sot}\nG D\ne|--3--2--|\n{eot}";
    expect(toChordPro(tab)).toBe(tab);
  });
});
