import { describe, expect, it } from "vitest";
import { normalize, parseTags, songMatches, tagCounts, tagsToCsv } from "@/lib/songs";

describe("canciones", () => {
  it("parseTags limpia, recorta y saca repetidos sin importar mayúsculas", () => {
    expect(parseTags("Adoración, rápida ,  adoración,, ")).toEqual(["Adoración", "rápida"]);
    expect(parseTags(null)).toEqual([]);
    expect(tagsToCsv(["Lenta", " lenta", "Santa Cena"])).toBe("Lenta, Santa Cena");
    expect(tagsToCsv([])).toBeNull();
  });

  it("normalize ignora tildes y mayúsculas", () => {
    expect(normalize("  Canción ÁGIL ")).toBe("cancion agil");
  });

  it("songMatches busca en título, artista, etiquetas y por tono exacto", () => {
    const s = { title: "Gracia Sublime", artist: "Hillsong", key: "G", tags: "Adoración, Lenta" };
    expect(songMatches(s, "")).toBe(true);
    expect(songMatches(s, "gracia")).toBe(true);
    expect(songMatches(s, "hillsong sublime")).toBe(true);
    expect(songMatches(s, "adoracion")).toBe(true);
    expect(songMatches(s, "g")).toBe(true);
    expect(songMatches(s, "rápida")).toBe(false);
  });

  it("tagCounts ordena por cantidad", () => {
    expect(tagCounts([{ tags: "Lenta, Adoración" }, { tags: "lenta" }, { tags: null }])).toEqual([
      { tag: "Lenta", count: 2 },
      { tag: "Adoración", count: 1 },
    ]);
  });
});
