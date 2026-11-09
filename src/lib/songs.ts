/** Funciones puras de canciones (sin DB) para poder testearlas. */

/** "Adoración, rápida ,  adoración" -> ["Adoración", "rápida"] (sin repetidos, sin importar mayúsculas). */
export function parseTags(csv: string | null | undefined): string[] {
  if (!csv) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of csv.split(",")) {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, 30);
    const k = normalize(tag);
    if (tag && !seen.has(k)) {
      seen.add(k);
      out.push(tag);
    }
  }
  return out;
}

export function tagsToCsv(tags: string[]) {
  return parseTags(tags.join(",")).join(", ") || null;
}

/** Minúsculas y sin tildes, para buscar "cancion" y encontrar "Canción". */
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** ¿La canción coincide con la búsqueda? Busca en título, artista, etiquetas y tono exacto. */
export function songMatches(
  song: { title: string; artist: string | null; key: string | null; tags: string | null },
  query: string,
) {
  const q = normalize(query);
  if (!q) return true;
  if (song.key && normalize(song.key) === q) return true;
  const haystack = normalize([song.title, song.artist ?? "", song.tags ?? ""].join(" "));
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

/** Todas las etiquetas usadas en la biblioteca, ordenadas por cantidad de canciones. */
export function tagCounts(songs: { tags: string | null }[]) {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const s of songs)
    for (const tag of parseTags(s.tags)) {
      const k = normalize(tag);
      const cur = counts.get(k);
      if (cur) cur.count++;
      else counts.set(k, { tag, count: 1 });
    }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
