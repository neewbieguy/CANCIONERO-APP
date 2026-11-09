import { describe, expect, it } from "vitest";
import {
  diatonicChords,
  isChord,
  normalizeKey,
  semitonesBetween,
  transposeChord,
  transposeKey,
} from "@/lib/music/transpose";

describe("transposeChord", () => {
  it("transpone acordes simples", () => {
    expect(transposeChord("G", 2)).toBe("A");
    expect(transposeChord("B", 1)).toBe("C");
    expect(transposeChord("C", -1)).toBe("B");
  });

  it("mantiene la calidad del acorde", () => {
    expect(transposeChord("F#m7", 1)).toBe("Gm7");
    expect(transposeChord("Dsus4", 2)).toBe("Esus4");
    expect(transposeChord("Am7b5", 3)).toBe("Cm7b5");
    expect(transposeChord("Cmaj7", 5)).toBe("Fmaj7");
  });

  it("transpone el bajo en acordes con barra", () => {
    expect(transposeChord("C/E", 2)).toBe("D/F#");
    expect(transposeChord("G/B", 3, true)).toBe("Bb/D");
  });

  it("usa bemoles cuando se pide", () => {
    expect(transposeChord("A", 1, true)).toBe("Bb");
    expect(transposeChord("A", 1, false)).toBe("A#");
  });

  it("no cambia nada con 0 o 12 semitonos", () => {
    expect(transposeChord("Ebm", 0)).toBe("Ebm");
    expect(transposeChord("Ebm", 12)).toBe("Ebm");
  });

  it("deja intacto lo que no es acorde", () => {
    expect(transposeChord("N.C.", 2)).toBe("N.C.");
  });
});

describe("tonalidades", () => {
  it("transposeKey usa nombres convencionales", () => {
    expect(transposeKey("G", 3)).toBe("Bb");
    expect(transposeKey("E", 2)).toBe("F#");
    expect(transposeKey("Am", 1)).toBe("Bbm");
    expect(transposeKey("C", -1)).toBe("B");
  });

  it("normalizeKey", () => {
    expect(normalizeKey("A#")).toBe("Bb");
    expect(normalizeKey("Gbm")).toBe("F#m");
  });

  it("semitonesBetween toma el camino más corto", () => {
    expect(semitonesBetween("G", "A")).toBe(2);
    expect(semitonesBetween("G", "E")).toBe(-3);
    expect(semitonesBetween("C", "F#")).toBe(6);
    expect(semitonesBetween("D", "D")).toBe(0);
  });

  it("diatonicChords en mayor y menor", () => {
    expect(diatonicChords("G")).toEqual(["G", "Am", "Bm", "C", "D", "Em"]);
    expect(diatonicChords("F")).toEqual(["F", "Gm", "Am", "Bb", "C", "Dm"]);
    expect(diatonicChords("Em")).toEqual(["Em", "G", "Am", "Bm", "C", "D"]);
  });
});

describe("isChord", () => {
  it("reconoce acordes válidos", () => {
    for (const c of ["C", "F#m", "Bbmaj7", "Gsus4", "D/F#", "E7(#9)", "Cadd9", "Bdim", "Aaug"]) {
      expect(isChord(c), c).toBe(true);
    }
  });
  it("rechaza palabras", () => {
    for (const w of ["Hola", "Dios", "Amor", "Cuando", "Bendito"]) expect(isChord(w), w).toBe(false);
  });
});
