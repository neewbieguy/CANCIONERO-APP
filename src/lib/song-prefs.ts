import { z } from "zod";

/** Preferencias de lectura de canciones de cada usuario (se guardan en User.songPrefs). */

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 40;

export const SONG_VIEWS = [
  { value: "both", label: "Ambos" },
  { value: "chords", label: "Acordes" },
  { value: "lyrics", label: "Letras" },
] as const;

export const CHORD_NOTATIONS = [
  { value: "american", label: "Americano (C D E)" },
  { value: "latin", label: "Latino (Do Re Mi)" },
] as const;

export const SHEET_FONTS = [
  { value: "sans", label: "Sans", className: "font-sans" },
  { value: "serif", label: "Serif", className: "font-serif" },
  { value: "mono", label: "Monoespaciada", className: "font-mono" },
] as const;

// Cada campo inválido o faltante vuelve a su valor por defecto
export const songPrefsSchema = z.object({
  view: z.enum(["both", "chords", "lyrics"]).catch("both"),
  notation: z.enum(["american", "latin"]).catch("american"),
  font: z.enum(["sans", "serif", "mono"]).catch("sans"),
  fontSize: z.number().int().min(FONT_SIZE_MIN).max(FONT_SIZE_MAX).catch(17),
  showDetails: z.boolean().catch(true),
  compact: z.boolean().catch(false),
  twoColumns: z.boolean().catch(false),
});

export type SongPrefs = z.infer<typeof songPrefsSchema>;

export function parseSongPrefs(value: unknown): SongPrefs {
  return songPrefsSchema.parse(value && typeof value === "object" ? value : {});
}

export const DEFAULT_SONG_PREFS: SongPrefs = parseSongPrefs({});
