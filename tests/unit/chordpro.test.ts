import { describe, expect, it } from "vitest";
import {
  chordsUsed,
  isChordLine,
  mergeChordAndLyric,
  parseChordPro,
  parseLyricLine,
  toChordPro,
  toPlainText,
  transposeChordPro,
} from "@/lib/music/chordpro";

const SAMPLE = `{title: Prueba}
{artist: Banda}
{key: G}
{tempo: 80}

{comment: Intro: G - D}

{start_of_verse: Verso 1}
[G]Hola [D]mundo
[Em]segunda [C]línea
{end_of_verse}

{soc}
[C]Coro [G]aquí
{eoc}`;

describe("parseLyricLine", () => {
  it("separa acordes y texto", () => {
    expect(parseLyricLine("[G]Hola [D]mundo")).toEqual([
      { chord: "G", text: "Hola " },
      { chord: "D", text: "mundo" },
    ]);
  });
  it("texto antes del primer acorde", () => {
    expect(parseLyricLine("Yo [Am]canto")).toEqual([
      { chord: null, text: "Yo " },
      { chord: "Am", text: "canto" },
    ]);
  });
  it("acorde al final sin texto", () => {
    expect(parseLyricLine("fin [G]")).toEqual([
      { chord: null, text: "fin " },
      { chord: "G", text: "" },
    ]);
  });
});

describe("parseChordPro", () => {
  const sheet = parseChordPro(SAMPLE);

  it("lee metadatos", () => {
    expect(sheet.meta).toMatchObject({ title: "Prueba", artist: "Banda", key: "G", tempo: "80" });
  });

  it("detecta secciones", () => {
    const types = sheet.sections.map((s) => s.type);
    expect(types).toEqual(["none", "verse", "chorus"]);
    expect(sheet.sections[1].label).toBe("Verso 1");
    expect(sheet.sections[1].lines).toHaveLength(2);
  });

  it("guarda comentarios", () => {
    expect(sheet.sections[0].lines[0]).toEqual({ type: "comment", text: "Intro: G - D" });
  });
});

describe("transposeChordPro", () => {
  it("transpone acordes y tonalidad", () => {
    const out = transposeChordPro(SAMPLE, 2);
    expect(out).toContain("{key: A}");
    expect(out).toContain("[A]Hola [E]mundo");
    expect(out).toContain("[F#m]segunda [D]línea");
  });

  it("usa bemoles si la tonalidad destino los usa", () => {
    const out = transposeChordPro(SAMPLE, 3); // G -> Bb
    expect(out).toContain("{key: Bb}");
    expect(out).toContain("[Bb]Hola [F]mundo");
    expect(out).toContain("[Eb]Coro");
  });

  it("no toca el texto con 0 semitonos", () => {
    expect(transposeChordPro(SAMPLE, 0)).toBe(SAMPLE);
  });
});

describe("chordsUsed", () => {
  it("lista acordes únicos en orden", () => {
    expect(chordsUsed(SAMPLE)).toEqual(["G", "D", "Em", "C"]);
  });
});

describe("importar acordes arriba de la letra", () => {
  it("isChordLine", () => {
    expect(isChordLine("G      D/F#    Em   C")).toBe(true);
    expect(isChordLine("Cuando la noche se vuelve larga")).toBe(false);
    expect(isChordLine("")).toBe(false);
  });

  it("mergeChordAndLyric respeta columnas", () => {
    expect(mergeChordAndLyric("G       D", "Hola mundo bello")).toBe("[G]Hola mun[D]do bello");
  });

  it("toChordPro convierte texto plano con encabezados", () => {
    const plain = ["Verso 1", "G         D", "Cuando la noche", "", "Coro", "C     G", "Amanecer de gracia"].join("\n");
    const out = toChordPro(plain, { title: "Amanecer", key: "G" });
    expect(out).toContain("{title: Amanecer}");
    expect(out).toContain("{key: G}");
    expect(out).toContain("{start_of_verse: Verso 1}");
    expect(out).toContain("[G]Cuando la [D]noche");
    expect(out).toContain("{start_of_chorus: Coro}");
    expect(out).toContain("[C]Amanec[G]er de gracia");
    expect(out.trim().endsWith("{end_of_chorus}")).toBe(true);
  });

  it("toChordPro deja intacto un texto que ya es ChordPro", () => {
    const out = toChordPro("[G]Hola", { title: "X" });
    expect(out).toBe("{title: X}\n[G]Hola");
  });
});

describe("toPlainText", () => {
  it("pone los acordes arriba de la letra", () => {
    const txt = toPlainText(SAMPLE);
    expect(txt).toContain("Prueba - Banda");
    expect(txt).toContain("Tono: G · BPM: 80");
    expect(txt).toContain("[Verso 1]\nG    D\nHola mundo");
    expect(txt).toContain("[Coro]\nC    G\nCoro aquí");
  });

  it("corre la letra si los acordes no entran", () => {
    expect(toPlainText("[Gmaj7]a[D]b")).toBe("Gmaj7 D\na     b\n");
  });
});
