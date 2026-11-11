/**
 * Transposición de acordes y tonos.
 * Soporta acordes como: G, F#m7, Bbmaj7, Dsus4, C/E, Am7b5, E7(#9), Gadd9/B
 */

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

/** Nombre preferido de cada tonalidad mayor / menor por semitono. */
const MAJOR_KEYS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
const MINOR_KEYS = ["Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "Bbm", "Bm"] as const;

export const ALL_KEYS: string[] = [...MAJOR_KEYS, ...MINOR_KEYS];

const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb", "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"]);

const NOTE_RE = /^([A-G])([#b]?)/;
const CHORD_RE = /^([A-G][#b]?)([^/\s]*)(?:\/([A-G][#b]?))?$/;

export function noteIndex(note: string): number {
  const m = NOTE_RE.exec(note);
  if (!m) return -1;
  const base = SHARPS.indexOf(m[1] as (typeof SHARPS)[number]);
  const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return (base + acc + 12) % 12;
}

export function isChord(token: string): boolean {
  return CHORD_RE.test(token.trim()) && isValidQuality(CHORD_RE.exec(token.trim())![2]);
}

/** Calidades aceptadas: m, maj7, sus4, add9, dim, aug, 7, m7b5, 6/9, (#9)... */
function isValidQuality(q: string) {
  return /^(m|min|maj|M|dim|aug|sus|add|no|[0-9]|[#b+\-°ø()])*$/.test(q);
}

export function prefersFlats(key?: string | null): boolean {
  if (!key) return false;
  return FLAT_KEYS.has(key) || (/b/.test(key.slice(1, 2)) && !key.startsWith("B#"));
}

export function transposeNote(note: string, semitones: number, useFlats = false): string {
  const i = noteIndex(note);
  if (i < 0) return note;
  const j = (((i + semitones) % 12) + 12) % 12;
  return (useFlats ? FLATS : SHARPS)[j];
}

export function transposeChord(chord: string, semitones: number, useFlats = false): string {
  if (semitones % 12 === 0) return chord;
  const m = CHORD_RE.exec(chord.trim());
  if (!m) return chord;
  const [, root, quality, bass] = m;
  const newRoot = transposeNote(root, semitones, useFlats);
  const newBass = bass ? "/" + transposeNote(bass, semitones, useFlats) : "";
  return newRoot + quality + newBass;
}

export function isMinorKey(key: string) {
  return /m$/.test(key) && !/maj$/.test(key);
}

/** Normaliza una tonalidad a su nombre preferido ("A#" -> "Bb", "Gbm" -> "F#m"). */
export function normalizeKey(key: string): string {
  const i = noteIndex(key);
  if (i < 0) return key;
  return isMinorKey(key) ? MINOR_KEYS[i] : MAJOR_KEYS[i];
}

export function transposeKey(key: string, semitones: number): string {
  const i = noteIndex(key);
  if (i < 0) return key;
  const j = (((i + semitones) % 12) + 12) % 12;
  return isMinorKey(key) ? MINOR_KEYS[j] : MAJOR_KEYS[j];
}

/** Semitonos para ir de un tono a otro, en el rango -5..+6 (el camino más corto). */
export function semitonesBetween(fromKey: string, toKey: string): number {
  const a = noteIndex(fromKey);
  const b = noteIndex(toKey);
  if (a < 0 || b < 0) return 0;
  let d = (b - a + 12) % 12;
  if (d > 6) d -= 12;
  return d;
}

const LATIN: Record<string, string> = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

/** Escribe un acorde en notación latina: "F#m7/C#" -> "Fa#m7/Do#". Si no es un acorde, lo deja igual. */
export function toLatinChord(chord: string): string {
  const m = CHORD_RE.exec(chord.trim());
  if (!m) return chord;
  const [, root, quality, bass] = m;
  const latin = (note: string) => LATIN[note[0]] + note.slice(1);
  return latin(root) + quality + (bass ? "/" + latin(bass) : "");
}

/** Acordes diatónicos de una tonalidad (I ii iii IV V vi para mayor; i III iv v VI VII para menor). */
export function diatonicChords(key: string): string[] {
  const minor = isMinorKey(key);
  const root = noteIndex(key);
  const flats = prefersFlats(normalizeKey(key));
  const name = (offset: number, suffix: string) => transposeNote("C", root + offset, flats) + suffix;
  return minor
    ? [name(0, "m"), name(3, ""), name(5, "m"), name(7, "m"), name(8, ""), name(10, "")]
    : [name(0, ""), name(2, "m"), name(4, "m"), name(5, ""), name(7, ""), name(9, "m")];
}
