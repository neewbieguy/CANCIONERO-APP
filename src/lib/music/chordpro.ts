import { isChord, prefersFlats, transposeChord, transposeKey } from "./transpose";

export type Segment = { chord: string | null; text: string };
export type SheetLine =
  | { type: "lyrics"; segments: Segment[] }
  | { type: "comment"; text: string }
  | { type: "empty" };
const NAMED_SECTIONS = [
  "verse", "chorus", "prechorus", "bridge", "intro", "outro", "interlude", "instrumental", "solo", "tag", "tab",
] as const;
export type SectionType = (typeof NAMED_SECTIONS)[number] | "none";
export type Section = {
  type: SectionType;
  label: string | null;
  lines: SheetLine[];
  /** Veces que se toca, cuando el título lo dice: "Intro (x3)" -> 3. */
  repeat?: number;
};
export type ChordSheet = {
  meta: { title?: string; artist?: string; key?: string; tempo?: string; [k: string]: string | undefined };
  sections: Section[];
};

const SECTION_START: Record<string, SectionType> = { sov: "verse", soc: "chorus", sob: "bridge", sot: "tab" };
const SECTION_END = new Set(["eov", "eoc", "eob", "eot"]);
for (const t of NAMED_SECTIONS) {
  SECTION_START[`start_of_${t}`] = t;
  SECTION_END.add(`end_of_${t}`);
}
const DIRECTIVE_RE = /^\s*\{([^}:]+)(?::\s*(.*))?\}\s*$/;
const META_ALIASES: Record<string, string> = { t: "title", st: "subtitle", a: "artist", bpm: "tempo" };
export const SECTION_LABELS: Record<SectionType, string> = {
  verse: "Verso",
  chorus: "Coro",
  prechorus: "Pre-coro",
  bridge: "Puente",
  intro: "Intro",
  outro: "Final",
  interlude: "Interludio",
  instrumental: "Instrumental",
  solo: "Solo",
  tag: "Tag",
  tab: "Tablatura",
  none: "",
};

/**
 * Limpia texto pegado desde páginas web: quita caracteres invisibles (U+200B, U+200C, U+200D, U+FEFF),
 * cambia los espacios duros (U+00A0) por espacios normales y unifica los saltos de línea a \n.
 * Hace falta porque String.trim() no elimina U+200B y eso rompe la detección de acordes y secciones.
 */
export function normalizeLyrics(text: string): string {
  return text
    .replace(/[​-‍﻿]/g, "")
    .replace(/ /g, " ")
    .replace(/\r\n?/g, "\n");
}

/** Divide una línea "[G]Hola [D]mundo" en segmentos acorde+texto. */
export function parseLyricLine(line: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let chord: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const text = line.slice(last, m.index);
    if (text || chord) segments.push({ chord, text });
    chord = m[1].trim();
    last = m.index + m[0].length;
  }
  const tail = line.slice(last);
  if (tail || chord) segments.push({ chord, text: tail });
  return segments.length ? segments : [{ chord: null, text: line }];
}

export function parseChordPro(source: string): ChordSheet {
  const meta: ChordSheet["meta"] = {};
  const sections: Section[] = [];
  let current: Section = { type: "none", label: null, lines: [] };

  const pushCurrent = () => {
    // Quitar líneas vacías al inicio/fin de la sección
    while (current.lines[0]?.type === "empty") current.lines.shift();
    while (current.lines.at(-1)?.type === "empty") current.lines.pop();
    // Un encabezado sin contenido ("Coro" solo, para indicar que se repite) también se conserva
    if (current.lines.length || current.type !== "none") sections.push(current);
  };
  const startSection = (type: SectionType, rawLabel: string) => {
    pushCurrent();
    const { label, repeat } = splitRepeat(rawLabel);
    current = { type, label: label || null, lines: [], ...(repeat ? { repeat } : {}) };
  };

  // toChordPro limpia invisibles y convierte encabezados ("Coro", "[Final]") y acordes
  // arriba de la letra, así también se arreglan las canciones que ya estaban guardadas.
  for (const raw of toChordPro(source).split("\n")) {
    const line = raw.trimEnd();
    const directive = DIRECTIVE_RE.exec(line);

    if (directive) {
      const name = directive[1].trim().toLowerCase();
      const value = directive[2]?.trim() ?? "";
      if (name in SECTION_START) {
        startSection(SECTION_START[name], value);
      } else if (SECTION_END.has(name)) {
        pushCurrent();
        current = { type: "none", label: null, lines: [] };
      } else if (name === "comment" || name === "c" || name === "ci" || name === "comment_italic") {
        // {comment: Verso 1} también funciona como encabezado de sección
        const header = parseSectionHeader(value);
        if (header) startSection(header.type, header.label + (header.repeat ? ` (x${header.repeat})` : ""));
        else current.lines.push({ type: "comment", text: value });
      } else {
        meta[META_ALIASES[name] ?? name] = value;
      }
      continue;
    }

    if (line.trim() === "") {
      // Una línea vacía fuera de una sección explícita separa bloques
      if (current.type === "none" && current.lines.some((l) => l.type !== "empty")) {
        pushCurrent();
        current = { type: "none", label: null, lines: [] };
      } else current.lines.push({ type: "empty" });
      continue;
    }

    if (line.startsWith("#")) continue; // comentario de fuente

    current.lines.push({ type: "lyrics", segments: parseLyricLine(line) });
  }
  pushCurrent();
  return { meta, sections };
}

/** Transpone todos los acordes [X] y la directiva {key:} de un texto ChordPro. */
export function transposeChordPro(source: string, semitones: number, targetKey?: string): string {
  if (!semitones) return source;
  const text = toChordPro(source);
  const keyMatch = /\{key:\s*([^}]+)\}/i.exec(text);
  const newKey = targetKey ?? (keyMatch ? transposeKey(keyMatch[1].trim(), semitones) : undefined);
  const flats = prefersFlats(newKey);
  return text
    // Solo se transponen acordes reales: "[x2]" o "[Riff]" quedan como están
    .replace(/\[([^\]]+)\]/g, (m, c: string) => (isChord(c) ? `[${transposeChord(c, semitones, flats)}]` : m))
    .replace(/\{key:\s*([^}]+)\}/i, () => `{key: ${newKey}}`);
}

/** Convierte ChordPro a texto plano con los acordes arriba de la letra (para exportar). */
export function toPlainText(source: string): string {
  const sheet = parseChordPro(source);
  const out: string[] = [];
  const header = [sheet.meta.title, sheet.meta.artist].filter(Boolean).join(" - ");
  if (header) out.push(header);
  const info = [sheet.meta.key && `Tono: ${sheet.meta.key}`, sheet.meta.tempo && `BPM: ${sheet.meta.tempo}`].filter(Boolean);
  if (info.length) out.push(info.join(" · "));
  if (out.length) out.push("");

  for (const section of sheet.sections) {
    const label = section.label ?? (section.type !== "none" ? SECTION_LABELS[section.type] : null);
    if (label) out.push(`[${label}]`);
    for (const line of section.lines) {
      if (line.type === "empty") out.push("");
      else if (line.type === "comment") out.push(line.text);
      else {
        let chords = "";
        let text = "";
        for (const seg of line.segments) {
          if (seg.chord) {
            // Si el acorde anterior es más largo que la letra, se corre la letra
            if (chords.length > text.length) text = text.padEnd(chords.length);
            chords = chords.padEnd(text.length) + seg.chord + " ";
          }
          text += seg.text;
        }
        if (chords.trim()) out.push(chords.trimEnd());
        if (text.trim()) out.push(text.trimEnd());
      }
    }
    out.push("");
  }
  return out.join("\n").trim() + "\n";
}

/** Lista única de acordes usados, en orden de aparición. */
export function chordsUsed(source: string): string[] {
  const seen = new Set<string>();
  for (const m of toChordPro(source).matchAll(/\[([^\]]+)\]/g)) if (isChord(m[1])) seen.add(m[1].trim());
  return Array.from(seen);
}

/** Indicaciones que pueden ir en una línea de acordes sin ser acordes: Riff, N.C., x2, (x2), 2x, bis. */
const ANNOTATION_RE = /^(riff|n\.?c\.?|bis|\(?x\d+\)?|\(?\d+x\)?)$/i;
/** Símbolos sueltos de compás/repetición: / % - . : x */
const SYMBOL_RE = /^[/%x\-.:]+$/i;
/** "N.C." (sin acorde): alcanza para que una línea cuente como línea de acordes. */
const NO_CHORD_RE = /^n\.c\.?$/i;
/** Un "token" de la línea de acordes: todo lo que no sea espacio ni barra de compás. */
const TOKEN_RE = /[^\s|]+/g;

/** ¿La línea es solo acordes? (formato "acordes arriba de la letra") */
export function isChordLine(line: string): boolean {
  const tokens = normalizeLyrics(line).match(TOKEN_RE) ?? [];
  return (
    tokens.some((t) => isChord(t) || NO_CHORD_RE.test(t)) &&
    tokens.every((t) => isChord(t) || ANNOTATION_RE.test(t) || SYMBOL_RE.test(t))
  );
}

export type BarToken = { kind: "chord" | "mark"; value: string };
/** Una línea de solo acordes, partida en compases. `bars` indica si traía barras "|". */
export type BarLine = { bars: boolean; measures: BarToken[][] };

/**
 * Si la línea no tiene letra (solo acordes, barras e indicaciones como "| G / / / |" o "N.C."),
 * la devuelve partida en compases para mostrarla como fila de compases. Si tiene letra, null.
 */
export function parseBarLine(segments: Segment[]): BarLine | null {
  const measures: BarToken[][] = [[]];
  let bars = false;
  let musical = false;
  for (const seg of segments) {
    if (seg.chord) {
      if (isChord(seg.chord)) {
        measures.at(-1)!.push({ kind: "chord", value: seg.chord });
        musical = true;
      } else if (ANNOTATION_RE.test(seg.chord)) {
        measures.at(-1)!.push({ kind: "mark", value: seg.chord });
        musical ||= NO_CHORD_RE.test(seg.chord);
      } else return null;
    }
    for (const token of seg.text.match(/\||[^\s|]+/g) ?? []) {
      if (token === "|") {
        bars = true;
        measures.push([]);
      } else if (ANNOTATION_RE.test(token) || SYMBOL_RE.test(token)) {
        measures.at(-1)!.push({ kind: "mark", value: token });
        musical ||= NO_CHORD_RE.test(token);
      } else return null;
    }
  }
  if (!musical) return null;
  const kept = measures.filter((m) => m.length > 0);
  return kept.length ? { bars, measures: kept } : null;
}

const HEADER_RE =
  /^\s*\[?\s*(intro|verso|verse|estrofa|pre[-\s]?coro|pre[-\s]?chorus|pre[-\s]?estribillo|coro\s+final|coro|chorus|estribillo|puente|bridge|interludio|interlude|instrumental|solo|final|outro|coda|tag)\s*(\d*)\s*(?:\(?\s*(?:x\s*(\d+)|(\d+)\s*x)\s*\)?)?\s*:?\s*\]?\s*:?\s*$/i;
/** Repetición al final de un título: "Intro (x3)", "Coro x2", "Puente 2x". */
const REPEAT_RE = /\s*\(?\s*(?:x\s*(\d+)|(\d+)\s*x)\s*\)?\s*$/i;

/** Separa la repetición del título: "Intro (x3)" -> { label: "Intro", repeat: 3 }. */
export function splitRepeat(label: string): { label: string; repeat?: number } {
  const m = REPEAT_RE.exec(label);
  if (!m) return { label: label.trim() };
  const repeat = Number(m[1] ?? m[2]);
  return { label: label.slice(0, m.index).trim(), ...(repeat > 1 ? { repeat } : {}) };
}
const HEADER_TYPE: Record<string, SectionType> = {
  intro: "intro", verso: "verse", verse: "verse", estrofa: "verse",
  precoro: "prechorus", prechorus: "prechorus", preestribillo: "prechorus",
  coro: "chorus", chorus: "chorus", estribillo: "chorus", corofinal: "chorus",
  puente: "bridge", bridge: "bridge", interludio: "interlude", interlude: "interlude", instrumental: "instrumental", solo: "solo",
  final: "outro", outro: "outro", coda: "outro", tag: "tag",
};

/**
 * ¿La línea es un encabezado de sección? Acepta "Coro", "coro:", "VERSO 2", "[Estribillo]", "Pre-Chorus"...
 * Tiene que estar sola en su línea (sin acordes ni letra).
 */
export function parseSectionHeader(line: string): { type: SectionType; label: string; repeat?: number } | null {
  const h = HEADER_RE.exec(normalizeLyrics(line));
  if (!h) return null;
  const name = h[1].replace(/\s+/g, " ");
  const repeat = Number(h[3] ?? h[4] ?? 0);
  return {
    type: HEADER_TYPE[name.toLowerCase().replace(/[-\s]/g, "")] ?? "verse",
    label: name[0].toUpperCase() + name.slice(1).toLowerCase() + (h[2] ? ` ${h[2]}` : ""),
    ...(repeat > 1 ? { repeat } : {}),
  };
}

/** ¿La línea ya tiene acordes en formato ChordPro ("[G]Hola")? "[Coro]" o "[x2]" no cuentan. */
function hasBracketChords(line: string): boolean {
  for (const m of line.matchAll(/\[([^\]]+)\]/g)) if (isChord(m[1])) return true;
  return false;
}

/** Combina una línea de acordes con la letra que tiene debajo, según la columna de cada acorde. */
export function mergeChordAndLyric(chordLine: string, lyric: string): string {
  const positions: { col: number; chord: string }[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let m: RegExpExecArray | null;
  // Las indicaciones (Riff, x2, N.C.) también se conservan arriba de la letra
  while ((m = re.exec(chordLine))) if (isChord(m[0]) || ANNOTATION_RE.test(m[0])) positions.push({ col: m.index, chord: m[0] });
  let out = lyric.padEnd(Math.max(lyric.length, (positions.at(-1)?.col ?? 0) + 1), " ");
  for (let i = positions.length - 1; i >= 0; i--) {
    const { col, chord } = positions[i];
    out = out.slice(0, col) + `[${chord}]` + out.slice(col);
  }
  return out.trimEnd();
}

/**
 * Convierte texto plano "acordes arriba de la letra" a ChordPro.
 * Trabaja línea por línea: lo que ya es ChordPro ([acordes] o {directivas}) queda tal cual,
 * así que se puede aplicar más de una vez sin cambiar el resultado.
 */
export function toChordPro(input: string, meta: { title?: string; artist?: string; key?: string; tempo?: string | number } = {}): string {
  const text = normalizeLyrics(input);
  const header = (
    [
      meta.title && `{title: ${meta.title}}`,
      meta.artist && `{artist: ${meta.artist}}`,
      meta.key && `{key: ${meta.key}}`,
      meta.tempo && `{tempo: ${meta.tempo}}`,
    ].filter(Boolean) as string[]
  ).filter((h) => !new RegExp(`\\{${h.slice(1, h.indexOf(":"))}:`, "i").test(text));

  const lines = text.split("\n");
  const out: string[] = [...header];
  let open: SectionType | null = null;
  const close = () => {
    if (open) out.push(`{end_of_${open}}`);
    open = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Directivas que ya estaban: se respetan y se sigue qué sección queda abierta
    const directive = DIRECTIVE_RE.exec(line);
    if (directive) {
      const name = directive[1].trim().toLowerCase();
      if (name in SECTION_START) {
        close();
        open = SECTION_START[name];
      } else if (SECTION_END.has(name)) open = null;
      out.push(line);
      continue;
    }
    // Dentro de una tablatura no se toca nada
    if (open === "tab") {
      out.push(line);
      continue;
    }

    const h = parseSectionHeader(line);
    if (h) {
      close();
      out.push(`{start_of_${h.type}: ${h.label}${h.repeat ? ` (x${h.repeat})` : ""}}`);
      open = h.type;
      continue;
    }
    if (!hasBracketChords(line) && isChordLine(line)) {
      const next = lines[i + 1];
      // Una línea con barras de compás ("| G / / / |") nunca va arriba de una letra
      const nextIsLyric =
        !line.includes("|") &&
        next !== undefined &&
        next.trim() !== "" &&
        !isChordLine(next) &&
        !parseSectionHeader(next) &&
        !DIRECTIVE_RE.test(next) &&
        !hasBracketChords(next);
      if (nextIsLyric) {
        out.push(mergeChordAndLyric(line, next));
        i++;
      } else {
        // Línea de solo acordes (intro, riff...): "D2  G  x2" -> "[D2] [G] x2"
        out.push(line.trim().replace(TOKEN_RE, (t) => (isChord(t) ? `[${t}]` : t)).replace(/\s+/g, " "));
      }
      continue;
    }
    out.push(line);
  }
  close();
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
