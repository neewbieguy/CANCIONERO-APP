import { isChord, prefersFlats, transposeChord, transposeKey } from "./transpose";

export type Segment = { chord: string | null; text: string };
export type SheetLine =
  | { type: "lyrics"; segments: Segment[] }
  | { type: "comment"; text: string }
  | { type: "empty" };
export type SectionType = "verse" | "chorus" | "bridge" | "intro" | "outro" | "tab" | "none";
export type Section = { type: SectionType; label: string | null; lines: SheetLine[] };
export type ChordSheet = {
  meta: { title?: string; artist?: string; key?: string; tempo?: string; [k: string]: string | undefined };
  sections: Section[];
};

const SECTION_START: Record<string, SectionType> = {
  start_of_verse: "verse",
  sov: "verse",
  start_of_chorus: "chorus",
  soc: "chorus",
  start_of_bridge: "bridge",
  sob: "bridge",
  start_of_tab: "tab",
  sot: "tab",
  start_of_intro: "intro",
  start_of_outro: "outro",
};
const SECTION_END = new Set([
  "end_of_verse", "eov", "end_of_chorus", "eoc", "end_of_bridge", "eob", "end_of_tab", "eot", "end_of_intro", "end_of_outro",
]);
const META_ALIASES: Record<string, string> = { t: "title", st: "subtitle", a: "artist", bpm: "tempo" };
export const SECTION_LABELS: Record<SectionType, string> = {
  verse: "Verso",
  chorus: "Coro",
  bridge: "Puente",
  intro: "Intro",
  outro: "Final",
  tab: "Tablatura",
  none: "",
};

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
    if (current.lines.length) sections.push(current);
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const directive = /^\s*\{([^}:]+)(?::\s*(.*))?\}\s*$/.exec(line);

    if (directive) {
      const name = directive[1].trim().toLowerCase();
      const value = directive[2]?.trim() ?? "";
      if (name in SECTION_START) {
        pushCurrent();
        current = { type: SECTION_START[name], label: value || null, lines: [] };
      } else if (SECTION_END.has(name)) {
        pushCurrent();
        current = { type: "none", label: null, lines: [] };
      } else if (name === "comment" || name === "c" || name === "ci" || name === "comment_italic") {
        current.lines.push({ type: "comment", text: value });
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
  const keyMatch = /\{key:\s*([^}]+)\}/i.exec(source);
  const newKey = targetKey ?? (keyMatch ? transposeKey(keyMatch[1].trim(), semitones) : undefined);
  const flats = prefersFlats(newKey);
  return source
    .replace(/\[([^\]]+)\]/g, (_, c: string) => `[${transposeChord(c, semitones, flats)}]`)
    .replace(/\{key:\s*([^}]+)\}/i, () => `{key: ${newKey}}`);
}

/** Lista única de acordes usados, en orden de aparición. */
export function chordsUsed(source: string): string[] {
  const seen = new Set<string>();
  for (const m of source.matchAll(/\[([^\]]+)\]/g)) seen.add(m[1].trim());
  return Array.from(seen);
}

/** ¿La línea es solo acordes? (formato "acordes arriba de la letra") */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const chordish = tokens.filter((t) => isChord(t) || /^[|/%x\-.]+$/.test(t) || /^\(?x\d\)?$/i.test(t));
  return chordish.length === tokens.length && tokens.some((t) => isChord(t));
}

const HEADER_RE = /^\s*\[?(intro|verso|verse|estrofa|coro|chorus|estribillo|puente|bridge|pre-?coro|final|outro|interludio)\s*(\d*)\]?:?\s*$/i;
const HEADER_TYPE: Record<string, SectionType> = {
  intro: "intro", verso: "verse", verse: "verse", estrofa: "verse",
  coro: "chorus", chorus: "chorus", estribillo: "chorus", precoro: "chorus", "pre-coro": "chorus",
  puente: "bridge", bridge: "bridge", final: "outro", outro: "outro", interludio: "intro",
};

/** Combina una línea de acordes con la letra que tiene debajo, según la columna de cada acorde. */
export function mergeChordAndLyric(chordLine: string, lyric: string): string {
  const positions: { col: number; chord: string }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chordLine))) if (isChord(m[0])) positions.push({ col: m.index, chord: m[0] });
  let out = lyric.padEnd(Math.max(lyric.length, (positions.at(-1)?.col ?? 0) + 1), " ");
  for (let i = positions.length - 1; i >= 0; i--) {
    const { col, chord } = positions[i];
    out = out.slice(0, col) + `[${chord}]` + out.slice(col);
  }
  return out.trimEnd();
}

/**
 * Convierte texto plano "acordes arriba de la letra" a ChordPro.
 * Si el texto ya es ChordPro (tiene [acordes] o {directivas}), lo devuelve tal cual.
 */
export function toChordPro(input: string, meta: { title?: string; artist?: string; key?: string; tempo?: string | number } = {}): string {
  const text = input.replace(/\r\n?/g, "\n");
  const alreadyChordPro = /\{[a-z_]+(:[^}]*)?\}/i.test(text) || /\[[A-G][#b]?[^\]]*\]/.test(text);
  const header = [
    meta.title && `{title: ${meta.title}}`,
    meta.artist && `{artist: ${meta.artist}}`,
    meta.key && `{key: ${meta.key}}`,
    meta.tempo && `{tempo: ${meta.tempo}}`,
  ].filter(Boolean) as string[];

  if (alreadyChordPro) {
    const missing = header.filter((h) => !new RegExp(`\\{${h.slice(1, h.indexOf(":"))}:`, "i").test(text));
    return [...missing, text.trim()].join("\n");
  }

  const lines = text.split("\n");
  const out: string[] = [...header];
  if (header.length) out.push("");
  let open: SectionType | null = null;
  const close = () => {
    if (open) out.push(`{end_of_${open}}`);
    open = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = HEADER_RE.exec(line);
    if (h) {
      close();
      const type = HEADER_TYPE[h[1].toLowerCase()] ?? "verse";
      const label = h[1][0].toUpperCase() + h[1].slice(1).toLowerCase() + (h[2] ? ` ${h[2]}` : "");
      if (type === "verse" || type === "chorus" || type === "bridge") {
        out.push(`{start_of_${type}: ${label}}`);
        open = type;
      } else out.push(`{comment: ${label}}`);
      continue;
    }
    if (isChordLine(line)) {
      const next = lines[i + 1];
      if (next !== undefined && next.trim() !== "" && !isChordLine(next) && !HEADER_RE.test(next)) {
        out.push(mergeChordAndLyric(line, next));
        i++;
      } else {
        out.push(line.trim().split(/\s+/).map((t) => (isChord(t) ? `[${t}]` : t)).join(" "));
      }
      continue;
    }
    out.push(line);
  }
  close();
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
