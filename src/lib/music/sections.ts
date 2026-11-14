import { SECTION_LABELS, parseChordPro, transposeChordPro, type SectionType, type SheetLine } from "./chordpro";

/**
 * Modelo de "tarjetas" de una canción: toma las secciones del parser ChordPro y les suma
 * lo que hace falta para mostrarlas (abreviatura, color, repeticiones).
 * Es solo para mostrar: no cambia cómo se guarda la letra.
 */

/** Familias de color. Los valores están en globals.css (--sec-verse, --sec-chorus...). */
export type SectionGroup = "verse" | "prechorus" | "chorus" | "bridge" | "instrumental" | "ending" | "none";

export type SongSection = {
  /** Id único dentro de la canción, sirve de ancla para los chips de navegación. */
  id: string;
  type: SectionType;
  group: SectionGroup;
  /** Nombre completo ("Verso 2"). null en la tarjeta sin título. */
  label: string | null;
  /** Abreviatura para el círculo y los chips ("V2", "C", "PC"). */
  abbr: string | null;
  /** "x3" del título, si lo tenía. */
  repeat?: number;
  lines: SheetLine[];
  /** Posición de la sección anterior que repite (mismo título y mismo contenido), o null. */
  repeatOf: number | null;
};

const GROUP: Record<SectionType, SectionGroup> = {
  verse: "verse",
  prechorus: "prechorus",
  chorus: "chorus",
  bridge: "bridge",
  intro: "instrumental",
  interlude: "instrumental",
  instrumental: "instrumental",
  solo: "instrumental",
  tab: "instrumental",
  tag: "ending",
  outro: "ending",
  none: "none",
};

const ABBR: Record<SectionType, string> = {
  verse: "V",
  prechorus: "PC",
  chorus: "C",
  bridge: "P",
  intro: "I",
  interlude: "IL",
  instrumental: "IN",
  solo: "S",
  tab: "TB",
  tag: "T",
  outro: "F",
  none: "",
};

/** Abreviatura de una sección: "Verso 2" -> "V2", "Pre-coro" -> "PC", "Coro final" -> "CF". */
export function sectionAbbr(type: SectionType, label: string | null): string {
  const text = (label ?? "").toLowerCase();
  const number = /(\d+)\s*$/.exec(text)?.[1] ?? "";
  let base = ABBR[type];
  if (/^coro\s+final/.test(text)) base = "CF";
  else if (/^coda/.test(text)) base = "CD";
  else if (/^outro/.test(text)) base = "O";
  return base + number;
}

function findLast<T>(list: T[], test: (item: T) => boolean): number {
  for (let i = list.length - 1; i >= 0; i--) if (test(list[i])) return i;
  return -1;
}

const sameLabel = (a: string | null, b: string | null) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();

/** Arma las tarjetas de una canción a partir de su texto (ChordPro o acordes arriba de la letra). */
export function buildSongSections(source: string, semitones = 0, targetKey?: string): SongSection[] {
  const sheet = parseChordPro(transposeChordPro(source, semitones, targetKey));
  const out: SongSection[] = [];

  for (const section of sheet.sections) {
    const prev = out.at(-1);
    // Los bloques sin título seguidos van juntos en una sola tarjeta
    if (section.type === "none" && !section.label && prev && prev.type === "none" && !prev.label) {
      prev.lines = [...prev.lines, { type: "empty" }, ...section.lines];
      continue;
    }

    const label = section.label ?? (section.type !== "none" ? SECTION_LABELS[section.type] : null);
    let lines = section.lines;
    let repeatOf: number | null = null;

    if (label) {
      if (lines.length === 0) {
        // Solo el título ("Coro"): toma el contenido de la última sección con ese nombre.
        // Si el título no tiene número, vale también la última del mismo tipo ("Coro" -> "Coro 1").
        let from = findLast(out, (s) => s.lines.length > 0 && s.type === section.type && sameLabel(s.label, label));
        if (from < 0 && !/\d/.test(label)) from = findLast(out, (s) => s.lines.length > 0 && s.type === section.type);
        if (from >= 0) {
          lines = out[from].lines;
          repeatOf = out[from].repeatOf ?? from;
        }
      } else {
        const signature = JSON.stringify(lines);
        const from = out.findIndex((s) => s.type === section.type && sameLabel(s.label, label) && JSON.stringify(s.lines) === signature);
        if (from >= 0) repeatOf = from;
      }
    }

    out.push({
      id: `seccion-${out.length + 1}`,
      type: section.type,
      group: GROUP[section.type],
      label,
      abbr: label ? sectionAbbr(section.type, label) : null,
      repeat: section.repeat,
      lines,
      repeatOf,
    });
  }
  return out;
}
