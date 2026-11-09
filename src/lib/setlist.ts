import type { EventTemplate } from "@/lib/templates";

/** Funciones puras del setlist (sin DB) para poder testearlas. */

/** Mueve el elemento `id` una posición arriba (-1) o abajo (+1). Devuelve los ids en el nuevo orden. */
export function moveId(ids: string[], id: string, direction: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** ¿`next` es una permutación exacta de `current`? (mismos ids, sin repetidos ni faltantes) */
export function isSameSet(current: string[], next: string[]) {
  if (current.length !== next.length) return false;
  const a = new Set(current);
  return new Set(next).size === next.length && next.every((id) => a.has(id));
}

/** Duración estimada en minutos. Las canciones sin duración cuentan `songDefault` minutos. */
export function estimateDuration(items: { type: string; durationMin: number | null }[], songDefault = 5) {
  return items.reduce((acc, i) => acc + (i.durationMin ?? (i.type === "song" ? songDefault : 0)), 0);
}

/** "1 h 25 min", "40 min" */
export function formatDuration(min: number) {
  if (min <= 0) return "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Momentos iniciales del setlist según la plantilla (los huecos de canciones se completan después). */
export function templateMoments(template: EventTemplate) {
  return template.blocks
    .filter((b) => b.kind === "moment")
    .map((b) => ({ type: "moment" as const, title: b.kind === "moment" ? b.title : "", durationMin: b.kind === "moment" ? (b.durationMin ?? null) : null }));
}

/** Cantidad de canciones que sugiere la plantilla. */
export function templateSongSlots(template: EventTemplate) {
  return template.blocks.reduce((acc, b) => acc + (b.kind === "song_slot" ? b.count : 0), 0);
}
